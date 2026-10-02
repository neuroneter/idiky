#!/usr/bin/env python3
"""
Empaqueta el demo compilado en **un solo archivo HTML** que se puede compartir.

Por que existe: para mostrarle el demo a alguien que no tiene el repositorio ni Node.
El resultado es un HTML autocontenido — sin peticiones a ningun servidor — que se abre
con doble clic, se manda por correo o se sube a cualquier hosting estatico.

Funciona porque el demo no tiene backend: los datos viven en `localStorage` y la
navegacion usa `HashRouter`, asi que no hace falta configurar rutas en un servidor.

Uso:
    npm run build
    python3 herramientas/empaquetar-demo.py [destino.html]
    python3 herramientas/empaquetar-demo.py --artifact [destino.html]

Por defecto escribe `dist/demo-idiky.html`.

`--artifact` escribe la misma cosa **sin `<html>`, `<head>` ni `<body>`**, que es lo
que pide el publicador de artefactos de claude.ai: ahi la pagina se envuelve sola, y
un documento completo dentro de otro no arranca. Es el formato del demo publicado;
**si se actualiza el demo hay que volver a publicarlo con esta opcion**, porque el
archivo compartido y el artefacto son dos copias distintas.

Ojo: cada persona que lo abra tiene su **propia copia** de los datos, en su navegador.
Nadie ve lo que hace el otro. Para una demostracion eso es una ventaja.
"""

import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
DIST = RAIZ / 'dist'
TITULO = 'Demo de Idiky'


def color_de_marca() -> str:
    """Lee --color-marca de los tokens para que el theme-color no se desactualice."""
    tokens = (RAIZ / 'src/estilos/tokens.css').read_text(encoding='utf-8')
    encontrado = re.search(r'--color-marca:\s*(#[0-9a-fA-F]{3,8})\s*;', tokens)
    if not encontrado:
        raise SystemExit('No se pudo leer --color-marca de src/estilos/tokens.css')
    return encontrado.group(1)


def unico(patron: str) -> Path:
    encontrados = sorted(DIST.glob(patron))
    if not encontrados:
        raise SystemExit(
            f'No se encontro ningun {patron} en {DIST}. ¿Corriste `npm run build` antes?'
        )
    if len(encontrados) > 1:
        raise SystemExit(
            f'Hay mas de un {patron} en {DIST}: {[f.name for f in encontrados]}. '
            'Borra `dist/` y vuelve a compilar.'
        )
    return encontrados[0]


def main() -> None:
    argumentos = [a for a in sys.argv[1:] if a != '--artifact']
    para_artefacto = '--artifact' in sys.argv[1:]

    css = unico('assets/*.css').read_text(encoding='utf-8')
    js = unico('assets/*.js').read_text(encoding='utf-8')

    # Un `</script` dentro del bundle cerraria la etiqueta antes de tiempo y romperia
    # el archivo en silencio. Mejor fallar aqui que publicar algo que no arranca.
    if '</script' in js.lower():
        raise SystemExit(
            'El bundle contiene un cierre de <script>. Hay que escaparlo antes de incrustarlo.'
        )

    destino = Path(argumentos[0]) if argumentos else DIST / (
        'demo-idiky-artefacto.html' if para_artefacto else 'demo-idiky.html'
    )

    if para_artefacto:
        destino.write_text(
            f'<title>{TITULO}</title>\n'
            '<style>\n' + css + '\n</style>\n'
            '<div id="root"></div>\n'
            '<script type="module">\n' + js + '\n</script>\n',
            encoding='utf-8',
        )
        print(f'{destino}: {destino.stat().st_size / 1024:.0f} kB (para artefacto)')
        return

    destino.write_text(
        '<!doctype html>\n'
        '<html lang="es">\n'
        '<head>\n'
        '<meta charset="UTF-8" />\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />\n'
        f'<meta name="theme-color" content="{color_de_marca()}" />\n'
        f'<title>{TITULO}</title>\n'
        '<style>\n' + css + '\n</style>\n'
        '</head>\n'
        '<body>\n'
        '<div id="root"></div>\n'
        '<script type="module">\n' + js + '\n</script>\n'
        '</body>\n'
        '</html>\n',
        encoding='utf-8',
    )
    print(f'{destino}: {destino.stat().st_size / 1024:.0f} kB')


if __name__ == '__main__':
    main()
