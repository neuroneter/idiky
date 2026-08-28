#!/usr/bin/env python3
"""
Revisa que el texto visible de la interfaz lleve sus tildes.

Por que existe: la ortografia dice mucho de la calidad de una aplicacion, y el
texto de la interfaz se escribe a mano en decenas de archivos. Revisarlo a ojo no
funciona: en la primera pasada se escaparon frases que estaban solas en su linea.

Uso:
    python3 herramientas/revisar-ortografia.py

Sale con codigo 1 si encuentra algo, para poder encadenarlo antes de subir.

Que revisa: el texto de las pantallas (`src/**/*.tsx`) **y el de los datos de
ejemplo** (`src/datos/semilla.ts`). Lo segundo se agrego el 2026-08-27: la semilla
es lo que se lee en la demostracion, asi que sus tildes valen igual que las del
codigo. Nada gana un revisor que solo mira la mitad de lo que se ve.

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
    # asambleas
    'quorum': 'quórum', 'dia': 'día', 'eleccion': 'elección', 'instalacion': 'instalación',
    'verificacion': 'verificación', 'consideracion': 'consideración', 'discusion': 'discusión',
    'votacion': 'votación', 'destinacion': 'destinación',
    'revision': 'revisión', 'ano': 'año', 'proposito': 'propósito', 'tecnico': 'técnico',
    'reglamentacion': 'reglamentación', 'citacion': 'citación', 'tuberia': 'tubería',
    'comun': 'común', 'supervision': 'supervisión', 'mas': 'más',
    'bogota': 'Bogotá',
}

# Lineas que nunca son texto visible.
NO_ES_TEXTO = re.compile(
    r"className|to=|href=|import |from '|nombre=\"|/app|var\(|aria-|role=|"
    r"key=|\.tsx|https?://|^\s*\|"
)
# `id: '...'` NO entra aqui: la linea `{ id: 'pse', texto: 'PSE / debito a cuenta' }`
# lleva las dos cosas, y descartarla entera dejo pasar dos palabras sin tilde
# durante semanas. El valor del dominio ya lo protege la regla de la palabra
# suelta en minuscula.
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


def signos_de_apertura(frase: str):
    """Devuelve el signo que falta al principio de una pregunta o exclamacion.

    En espanol la pregunta se abre y se cierra. Es la falta de ortografia que mas
    se ve en una interfaz porque se copia del ingles sin darse cuenta, y es
    decidible sin ambiguedad: si la frase termina en `?` y empieza en mayuscula,
    o lleva `¿` o esta mal.
    """
    limpia = frase.strip()
    if not limpia or not limpia[0].isupper():
        return None
    if limpia.endswith('?') and '¿' not in limpia:
        return '¿'
    if limpia.endswith('!') and '¡' not in limpia:
        return '¡'
    return None


def main() -> None:
    hallazgos = []
    aperturas = []
    archivos = sorted((RAIZ / 'src').rglob('*.tsx')) + [RAIZ / 'src/datos/semilla.ts']
    for archivo in archivos:
        en_comentario = False
        for n, linea in enumerate(archivo.read_text(encoding='utf-8').split('\n'), 1):
            # Los comentarios de varias lineas no empiezan por // ni por *, asi que
            # hay que seguirlos de una linea a otra. Cuentan los dos: `{/* ... */}`
            # dentro del JSX y `/* ... */` entre los atributos.
            abre, cierra = '/*' in linea, '*/' in linea
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
                signo = signos_de_apertura(frase)
                if signo:
                    aperturas.append((archivo.relative_to(RAIZ), n, signo, frase.strip()[:56]))
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

    if not hallazgos and not aperturas:
        print('Ortografia: sin hallazgos.')
        return

    if hallazgos:
        print(f'Ortografia: {len(hallazgos)} palabras sin tilde en texto visible.\n')
        for ruta, n, mal, bien, frase in hallazgos:
            print(f'  {ruta}:{n}\n    {mal} -> {bien}   en: "{frase}"')
    if aperturas:
        print(f'\nOrtografia: {len(aperturas)} frases sin signo de apertura.\n')
        for ruta, n, signo, frase in aperturas:
            print(f'  {ruta}:{n}\n    falta "{signo}" al principio   en: "{frase}"')
    sys.exit(1)


if __name__ == '__main__':
    main()
