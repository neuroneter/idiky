#!/usr/bin/env python3
"""
Revisa que el texto visible de la interfaz lleve sus tildes.

Por que existe: la ortografia dice mucho de la calidad de una aplicacion, y el
texto de la interfaz se escribe a mano en decenas de archivos. Revisarlo a ojo no
funciona: en la primera pasada se escaparon frases que estaban solas en su linea.

Uso:
    python3 herramientas/revisar-ortografia.py

Sale con codigo 1 si encuentra algo, para poder encadenarlo antes de subir.

Que NO revisa, a proposito:
  - Identificadores, clases de CSS, rutas e imports. Ahi las tildes no van
    (docs/08-convenciones.md).
  - Los valores del dominio: `id: 'peticion'` y `autor: 'administracion'` se quedan
    sin tilde porque son datos, no texto; con tilde se romperia la comparacion. La
    regla que los separa: una etiqueta visible nunca es una sola palabra en
    minuscula. Lo que se muestra es `texto: 'Peticion'`, y ese si lleva tilde.
"""

import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent

# Palabra sin tilde -> con tilde. Solo palabras que aparecen en la interfaz.
PALABRAS = {
    # -cion / -sion
    'administracion': 'administración', 'aplicacion': 'aplicación', 'sesion': 'sesión',
    'gestion': 'gestión', 'informacion': 'información', 'descripcion': 'descripción',
    'confirmacion': 'confirmación', 'previsualizacion': 'previsualización',
    'consignacion': 'consignación', 'autorizacion': 'autorización',
    'imputacion': 'imputación', 'peticion': 'petición', 'radicacion': 'radicación',
    'publicacion': 'publicación', 'recepcion': 'recepción', 'filtracion': 'filtración',
    'seleccion': 'selección', 'facturacion': 'facturación', 'situacion': 'situación',
    'solucion': 'solución', 'decision': 'decisión', 'refrigeracion': 'refrigeración',
    'sancion': 'sanción', 'reunion': 'reunión', 'notificacion': 'notificación',
    'validacion': 'validación', 'conexion': 'conexión', 'opcion': 'opción',
    'impermeabilizacion': 'impermeabilización', 'observacion': 'observación',
    # tiempo y numeros
    'proximo': 'próximo', 'proxima': 'próxima', 'sabado': 'sábado', 'dias': 'días',
    'ultimo': 'último', 'ultima': 'última', 'manana': 'mañana', 'anos': 'años',
    'numero': 'número', 'minimo': 'mínimo', 'maximo': 'máximo', 'area': 'área',
    # espacios y objetos
    'salon': 'salón', 'bano': 'baño', 'banos': 'baños', 'porteria': 'portería',
    'codigo': 'código', 'telefono': 'teléfono', 'pagina': 'página',
    'deposito': 'depósito', 'envio': 'envío', 'envios': 'envíos',
    # conectores y verbos
    'aqui': 'aquí', 'tambien': 'también', 'ademas': 'además', 'asi': 'así',
    'despues': 'después', 'segun': 'según', 'vera': 'verá', 'estan': 'están',
    'apareceran': 'aparecerán', 'contrasena': 'contraseña', 'contrasenas': 'contraseñas',
    'danar': 'dañar', 'facil': 'fácil', 'dificil': 'difícil', 'util': 'útil',
    'rapido': 'rápido', 'credito': 'crédito', 'debito': 'débito',
    'automatico': 'automático', 'electronico': 'electrónico', 'cedula': 'cédula',
}

# Lineas que nunca son texto visible.
NO_ES_TEXTO = re.compile(
    r"className|to=|href=|import |from '|nombre=\"|/app|var\(|aria-|role=|"
    r"id: '|key=|\.tsx|https?://"
)
# Comentarios: son para quien lee el codigo, no para el usuario. No se revisan.
ES_COMENTARIO = re.compile(r'^\s*(//|/\*|\*)')

# Propiedades cuyo valor SI se muestra en pantalla.
PROPS_VISIBLES = re.compile(
    r"""(?:texto|ayuda|titulo|detalle|placeholder|title|concepto|autor|motivo)"""
    r"""\s*[:=]\s*['"]([^'"]+)['"]"""
)


def frases_visibles(linea: str):
    """Devuelve los trozos de la linea que un usuario llega a leer.

    Es deliberadamente estricto: vale mas dejar pasar una palabra que proponer
    cambiar un identificador. `sesion!.personaId`, `telefono: ''` y
    `descripcion?: string` son codigo, y ahi las tildes no van
    (docs/08-convenciones.md).
    """
    trozos = re.findall(r'>([^<>{}\n]+)<', linea)   # <p>texto</p>
    trozos += PROPS_VISIBLES.findall(linea)         # texto: '...' / titulo="..."

    # Cadenas de prosa: varias palabras entre comillas. Un valor del dominio
    # ('peticion') es una sola palabra y no entra por aqui.
    for cadena in re.findall(r"""['"]([^'"]{6,})['"]""", linea):
        if ' ' in cadena.strip() and re.search(r'[a-zñ]{3}', cadena):
            trozos.append(cadena)

    # Texto de JSX que ocupa su propia linea, sin etiquetas alrededor. Es el caso
    # que se escapo en la primera revision a mano ("Generar codigo de acceso").
    suelto = linea.strip()
    if (suelto and ' ' in suelto
            and not re.search(r'[<>{}=;:()\[\]!?]', suelto)
            and not suelto.endswith(',')
            and re.search(r'[a-zñ]{3}', suelto)):
        trozos.append(suelto)
    return trozos


def main() -> None:
    hallazgos = []
    for archivo in sorted((RAIZ / 'src').rglob('*.tsx')):
        en_comentario = False
        for n, linea in enumerate(archivo.read_text(encoding='utf-8').split('\n'), 1):
            # Los comentarios JSX de varias lineas ({/* ... */}) no empiezan por // ni
            # por *, asi que hay que seguirlos de una linea a otra.
            abre, cierra = '{/*' in linea, '*/' in linea
            estaba = en_comentario
            if abre and not cierra:
                en_comentario = True
            elif cierra:
                en_comentario = False
            if estaba or abre:
                continue
            if NO_ES_TEXTO.search(linea) or ES_COMENTARIO.match(linea):
                continue
            for frase in frases_visibles(linea):
                # Una etiqueta visible nunca es una sola palabra en minuscula: eso
                # es un valor del dominio (`autor: 'administracion'`, que distingue
                # quien escribio el mensaje). Ahi la tilde romperia la comparacion.
                if frase.strip().islower() and ' ' not in frase.strip():
                    continue
                for palabra in re.findall(r'\b[a-zA-ZñÑ]+\b', frase):
                    correcta = PALABRAS.get(palabra.lower())
                    if not correcta:
                        continue
                    # Respeta la mayuscula inicial de la palabra encontrada.
                    esperada = correcta.capitalize() if palabra[0].isupper() else correcta
                    hallazgos.append(
                        (archivo.relative_to(RAIZ), n, palabra, esperada, frase.strip()[:56])
                    )

    if not hallazgos:
        print('Ortografia: sin hallazgos.')
        return

    print(f'Ortografia: {len(hallazgos)} palabras sin tilde en texto visible.\n')
    for ruta, n, mal, bien, frase in hallazgos:
        print(f'  {ruta}:{n}\n    {mal} -> {bien}   en: "{frase}"')
    sys.exit(1)


if __name__ == '__main__':
    main()
