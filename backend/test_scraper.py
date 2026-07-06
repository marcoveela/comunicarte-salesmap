import requests
from bs4 import BeautifulSoup
import re

def explorar_html():
    codigo_sie = "81981089"
    url = f"https://seie.minedu.gob.bo/reportes/mapas_unidades_educativas/ficha/ver/{codigo_sie}"
    
    print(f"Descargando HTML de: {url}\n")
    
    # Deshabilitamos la verificación SSL por si el servidor del ministerio tiene problemas de certificado
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    response = requests.get(url, headers=headers, verify=False)
    
    soup = BeautifulSoup(response.text, 'lxml')
    
    # Buscamos cualquier elemento que contenga la palabra DIRECTOR
    elemento = soup.find(string=re.compile("DIRECTOR", re.IGNORECASE))
    
    if elemento:
        print("¡Encontramos la palabra DIRECTOR!")
        print("--------------------------------------------------")
        # Imprimimos el HTML del "padre" y el "abuelo" de ese texto para ver la estructura
        print(elemento.parent.parent.prettify())
        print("--------------------------------------------------")
    else:
        print("No se encontró la palabra 'DIRECTOR' en el HTML. ¿Estará cargando con JavaScript?")
        print("Primeros 500 caracteres del HTML:")
        print(response.text[:500])

if __name__ == "__main__":
    # Suprimimos los warnings de SSL para mantener la consola limpia
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    explorar_html()