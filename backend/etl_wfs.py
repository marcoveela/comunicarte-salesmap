import requests
import psycopg2
import hashlib
from datetime import datetime
import os

# Configuramos la conexión leyendo las variables de entorno
DB_HOST = os.getenv("POSTGRES_HOST", "localhost")
DB_USER = os.getenv("POSTGRES_USER", "comunicarte")
DB_PASS = os.getenv("POSTGRES_PASSWORD", "tu_contrasena_segura") # ¡No olvides poner tu password real!
DB_NAME = os.getenv("POSTGRES_DB", "salesmap_db")
DB_PORT = "5432"

def extraer_colegios_wfs_departamento():
    url = "https://seie.minedu.gob.bo/geoserver/minedu/ows"
    
    # Filtro actualizado: cod_pol_dep='7' trae todo el departamento de Santa Cruz
    params = {
        "service": "WFS",
        "version": "1.0.0",
        "request": "GetFeature",
        "typeName": "minedu:vw_unidad_geo7",
        "outputFormat": "application/json",
        "CQL_FILTER": "cod_pol_dep='7'" 
    }
    
    print("Descargando colegios de TODO el departamento de Santa Cruz (WFS)...")
    # Aumentamos el timeout a 60 segundos por el volumen de datos
    response = requests.get(url, params=params, timeout=60)
    response.raise_for_status()
    return response.json().get("features", [])

def cargar_en_base_de_datos(features):
    print(f"Conectando a PostgreSQL en {DB_HOST}...")
    try:
        conn = psycopg2.connect(
            dbname=DB_NAME, user=DB_USER, password=DB_PASS, host=DB_HOST, port=DB_PORT
        )
        cur = conn.cursor()
        
        insertados = 0
        actualizados = 0

        for feature in features:
            props = feature["properties"]
            
            # Datos base extraídos del WFS
            codigo_sie = str(props.get("cod_ue", "")).strip()
            nombre = str(props.get("des_ue", "")).strip()
            lat = props.get("latitud")
            lng = props.get("longitud")
            
            # Ignoramos registros sin coordenadas válidas
            if not lat or not lng or not codigo_sie:
                continue

            # Creamos un hash para saber si los datos cambiaron
            raw_data = f"{codigo_sie}{nombre}{lat}{lng}"
            source_hash = hashlib.sha256(raw_data.encode('utf-8')).hexdigest()
            scraped_at = datetime.now()

            # Sentencia SQL "Upsert"
            sql = """
                INSERT INTO colegios (codigo_sie, nombre, geom, scraped_at, source_hash)
                VALUES (%s, %s, ST_SetSRID(ST_MakePoint(%s, %s), 4326), %s, %s)
                ON CONFLICT (codigo_sie) DO UPDATE 
                SET nombre = EXCLUDED.nombre,
                    geom = EXCLUDED.geom,
                    scraped_at = EXCLUDED.scraped_at,
                    source_hash = EXCLUDED.source_hash
                WHERE colegios.source_hash != EXCLUDED.source_hash;
            """
            
            cur.execute(sql, (codigo_sie, nombre, lng, lat, scraped_at, source_hash))
            
            if cur.rowcount == 1:
                insertados += 1
            
        conn.commit()
        print(f"ETL Finalizado. Operaciones en BD: {insertados} nuevos registros procesados.")
        
        cur.close()
        conn.close()

    except Exception as e:
        print(f"Error en la base de datos: {e}")

if __name__ == "__main__":
    colegios_wfs = extraer_colegios_wfs_departamento()
    if colegios_wfs:
        cargar_en_base_de_datos(colegios_wfs)