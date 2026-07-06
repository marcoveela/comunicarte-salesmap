import requests
from bs4 import BeautifulSoup
import psycopg2
from psycopg2.extras import Json
import time
import os
import re
import json
import random
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

DB_HOST = os.getenv("POSTGRES_HOST", "localhost")
DB_USER = os.getenv("POSTGRES_USER", "comunicarte")
DB_PASS = os.getenv("POSTGRES_PASSWORD", "tu_contrasena_segura")
DB_NAME = os.getenv("POSTGRES_DB", "salesmap_db")
DB_PORT = "5432"

MAPEO_CATEGORIAS = {
    'matricula': 'matricula',
    'promovidos': 'promovidos',
    'reprobados': 'reprobados',
    'abandono': 'retirados',
}

MAX_REINTENTOS = 3
MAX_FALLOS_CONSECUTIVOS = 10

def procesar_niveles(texto_niveles):
    if not texto_niveles or texto_niveles.strip() == '--':
        return []
    return [n.strip().capitalize() for n in texto_niveles.split('/')]

def procesar_turno(texto_turno):
    if not texto_turno or texto_turno.strip() == '--':
        return None
    texto = texto_turno.upper()
    if 'MAÑANA' in texto: return 'Mañana'
    if 'TARDE' in texto: return 'Tarde'
    if 'NOCHE' in texto: return 'Noche'
    if 'CONTINUO' in texto: return 'Continuo'
    return None

def extraer_json_estadisticas(html):
    match = re.search(r"var general = jQuery\.parseJSON\('(.+?)'\);", html)
    if not match:
        return {}
    try:
        return json.loads(match.group(1))
    except json.JSONDecodeError:
        return {}

def construir_historico(general):
    historico = {}
    for clave_fuente, clave_destino in MAPEO_CATEGORIAS.items():
        lista_por_unidad = general.get(clave_fuente, [])
        por_unidad = {item['unidad']: item['porcentaje'] for item in lista_por_unidad}
        mapeo_genero = {'Total': 'total', 'Mujer': 'mujeres', 'Hombre': 'hombres'}
        for unidad_fuente, campo_destino in mapeo_genero.items():
            for entrada in por_unidad.get(unidad_fuente, []):
                anio = str(entrada['gestion'])
                try:
                    valor = int(entrada['est1'])
                except (ValueError, TypeError):
                    continue
                historico.setdefault(anio, {}).setdefault(clave_destino, {})[campo_destino] = valor
    return historico

def obtener_anio_actual(historico):
    anios_con_matricula = sorted((a for a in historico if 'matricula' in historico[a]), reverse=True)
    if not anios_con_matricula:
        return None, None
    anio = anios_con_matricula[0]
    matricula_total = historico[anio]['matricula'].get('total')
    return int(anio), matricula_total

def descargar_con_reintentos(url, headers):
    """Reintentos con backoff exponencial. Si falla del todo, devuelve None
    en vez de lanzar excepción — el llamador decide si cuenta para el circuit breaker."""
    espera = 2
    for intento in range(1, MAX_REINTENTOS + 1):
        try:
            response = requests.get(url, headers=headers, verify=False, timeout=15)
            response.raise_for_status()
            return response
        except requests.RequestException as e:
            if intento == MAX_REINTENTOS:
                print(f"    -> Falló tras {MAX_REINTENTOS} intentos: {e}")
                return None
            print(f"    -> Intento {intento} falló ({e}), reintentando en {espera}s...")
            time.sleep(espera)
            espera *= 2
    return None

def procesar_colegios():
    try:
        conn = psycopg2.connect(
            dbname=DB_NAME, user=DB_USER, password=DB_PASS, host=DB_HOST, port=DB_PORT
        )
        cur = conn.cursor()

        cur.execute("""
            SELECT id, codigo_sie, nombre FROM colegios
            WHERE estadisticas_historico = '{}'::jsonb
        """)
        colegios = cur.fetchall()

        total = len(colegios)
        print(f"Iniciando extracción de Fichas Técnicas para {total} colegios...\n")

        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        fallos_consecutivos = 0

        for index, (db_id, codigo_sie, nombre) in enumerate(colegios, 1):
            url = f"https://seie.minedu.gob.bo/reportes/mapas_unidades_educativas/ficha/ver/{codigo_sie}"
            print(f"[{index}/{total}] Procesando: {nombre} ({codigo_sie})")

            response = descargar_con_reintentos(url, headers)

            if response is None:
                fallos_consecutivos += 1
                print("  -> Pendiente, se reintentará en la próxima corrida.")
                if fallos_consecutivos >= MAX_FALLOS_CONSECUTIVOS:
                    print(f"\n⚠️  {MAX_FALLOS_CONSECUTIVOS} fallos seguidos — probablemente el portal está caído. Cortando el job.")
                    break
                time.sleep(random.uniform(1.5, 3.5))
                continue

            fallos_consecutivos = 0

            try:
                soup = BeautifulSoup(response.text, 'lxml')

                datos_admin = {"director": None, "telefono": None, "direccion": None, "niveles": [], "turno": None}
                dt_tags = soup.find_all('dt')
                for dt in dt_tags:
                    etiqueta = dt.get_text(strip=True).lower()
                    dd = dt.find_next_sibling('dd')
                    if not dd:
                        continue
                    valor = dd.get_text(strip=True)
                    if valor == '--':
                        valor = None
                    if "director" in etiqueta: datos_admin["director"] = valor
                    elif "teléfono" in etiqueta: datos_admin["telefono"] = valor
                    elif "dirección" in etiqueta: datos_admin["direccion"] = valor
                    elif "nivel" in etiqueta: datos_admin["niveles"] = procesar_niveles(valor)
                    elif "turno" in etiqueta: datos_admin["turno"] = procesar_turno(valor)

                general = extraer_json_estadisticas(response.text)
                historico = construir_historico(general)
                anio_actual, matricula_actual = obtener_anio_actual(historico)

                sql_update = """
                    UPDATE colegios
                    SET director = %s, telefono = %s, direccion = %s,
                        niveles = %s, turno = %s,
                        matricula_actual = %s, anio_actual = %s,
                        estadisticas_historico = %s,
                        scraped_at = NOW()
                    WHERE id = %s
                """
                cur.execute(sql_update, (
                    datos_admin["director"], datos_admin["telefono"], datos_admin["direccion"],
                    datos_admin["niveles"], datos_admin["turno"],
                    matricula_actual, anio_actual,
                    Json(historico),
                    db_id
                ))
                conn.commit()

            except Exception as e:
                print(f"  -> Error al procesar {codigo_sie}: {e}")
                conn.rollback()

            time.sleep(random.uniform(1.5, 3.5))

        cur.close()
        conn.close()
        print("\n¡ETL Finalizado!")

    except Exception as e:
        print(f"Error general: {e}")

if __name__ == "__main__":
    procesar_colegios()