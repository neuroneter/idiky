#!/usr/bin/env python3
"""
Genera los iconos PNG de la PWA a partir de la geometria de los SVG de `public/`.

Por que existe: el manifest necesita PNG de 192 y 512 px para que Android ofrezca
instalar la app, e iOS necesita un PNG para el `apple-touch-icon`. En el entorno no
hay ImageMagick ni rsvg, y agregar una dependencia de imagen rompe la regla del
CLAUDE.md (nada nuevo sin ADR). Asi que se rasteriza aqui, con la libreria estandar.

Uso:
    python3 herramientas/generar-iconos.py

Reescribe los PNG en `public/`. Si cambia el logo, hay que actualizar la geometria
de ICONOS y volver a correrlo.
"""

import struct
import zlib
from pathlib import Path

PUBLICO = Path(__file__).resolve().parent.parent / 'public'

MARCA = (0x0F, 0x3D, 0x3E)
BLANCO = (0xFF, 0xFF, 0xFF)
NARANJA = (0xD9, 0x83, 0x24)

# Geometria copiada de los SVG (viewBox 0 0 192 192).
ICONOS = {
    'icono-192.png': {
        'tamano': 192,
        'radio_fondo': 42,
        'trazos': [
            (BLANCO, 10, [(48, 132), (48, 76), (96, 44), (144, 76), (144, 132)]),
            (NARANJA, 10, [(78, 132), (78, 98), (114, 98), (114, 132)]),
            (BLANCO, 10, [(36, 138), (156, 138)]),
        ],
    },
    'icono-512.png': {
        'tamano': 512,
        'radio_fondo': 42,
        'trazos': [
            (BLANCO, 10, [(48, 132), (48, 76), (96, 44), (144, 76), (144, 132)]),
            (NARANJA, 10, [(78, 132), (78, 98), (114, 98), (114, 132)]),
            (BLANCO, 10, [(36, 138), (156, 138)]),
        ],
    },
    # Maskable: sin esquinas redondeadas y con el dibujo mas adentro, porque el
    # sistema operativo recorta el icono con la forma que quiera.
    'icono-maskable-512.png': {
        'tamano': 512,
        'radio_fondo': 0,
        'trazos': [
            (BLANCO, 9, [(56, 128), (56, 82), (96, 56), (136, 82), (136, 128)]),
            (NARANJA, 9, [(82, 128), (82, 102), (110, 102), (110, 128)]),
        ],
    },
}

LIENZO = 192.0  # El viewBox de los SVG.


def distancia_a_segmento(px, py, ax, ay, bx, by):
    dx, dy = bx - ax, by - ay
    largo2 = dx * dx + dy * dy
    if largo2 == 0:
        t = 0.0
    else:
        t = ((px - ax) * dx + (py - ay) * dy) / largo2
        t = 0.0 if t < 0.0 else (1.0 if t > 1.0 else t)
    cx, cy = ax + t * dx, ay + t * dy
    return ((px - cx) ** 2 + (py - cy) ** 2) ** 0.5


def distancia_a_rect_redondeado(px, py, lado, radio):
    """Distancia con signo: negativa dentro de la figura."""
    cx = abs(px - lado / 2) - (lado / 2 - radio)
    cy = abs(py - lado / 2) - (lado / 2 - radio)
    fuera = ((max(cx, 0.0)) ** 2 + (max(cy, 0.0)) ** 2) ** 0.5
    return fuera + min(max(cx, cy), 0.0) - radio


def cobertura(distancia):
    """Antialias: 1 px de transicion alrededor del borde."""
    valor = 0.5 - distancia
    return 0.0 if valor < 0.0 else (1.0 if valor > 1.0 else valor)


def mezclar(fondo, frente, alfa):
    return tuple(round(f * (1 - alfa) + d * alfa) for f, d in zip(fondo, frente))


def dibujar(spec):
    lado = spec['tamano']
    escala = lado / LIENZO
    radio = spec['radio_fondo'] * escala
    # Segmentos y radios ya escalados a pixeles.
    trazos = [
        (
            color,
            (ancho * escala) / 2,
            [
                ((p[0] * escala, p[1] * escala), (q[0] * escala, q[1] * escala))
                for p, q in zip(puntos, puntos[1:])
            ],
        )
        for color, ancho, puntos in spec['trazos']
    ]

    filas = []
    for y in range(lado):
        py = y + 0.5
        fila = bytearray()
        fila.append(0)  # filtro PNG "None"
        for x in range(lado):
            px = x + 0.5
            alfa_fondo = cobertura(distancia_a_rect_redondeado(px, py, lado, radio))
            if alfa_fondo <= 0.0:
                fila.extend((0, 0, 0, 0))
                continue
            pixel = MARCA
            for color, medio_ancho, segmentos in trazos:
                d = min(
                    distancia_a_segmento(px, py, a[0], a[1], b[0], b[1])
                    for a, b in segmentos
                )
                a_trazo = cobertura(d - medio_ancho)
                if a_trazo > 0.0:
                    pixel = mezclar(pixel, color, a_trazo)
            fila.extend((*pixel, round(alfa_fondo * 255)))
        filas.append(bytes(fila))
    return lado, b''.join(filas)


def bloque(tipo, datos):
    return (
        struct.pack('>I', len(datos))
        + tipo
        + datos
        + struct.pack('>I', zlib.crc32(tipo + datos) & 0xFFFFFFFF)
    )


def escribir_png(ruta, lado, crudo):
    cabecera = struct.pack('>IIBBBBB', lado, lado, 8, 6, 0, 0, 0)  # RGBA de 8 bits
    ruta.write_bytes(
        b'\x89PNG\r\n\x1a\n'
        + bloque(b'IHDR', cabecera)
        + bloque(b'IDAT', zlib.compress(crudo, 9))
        + bloque(b'IEND', b'')
    )


def main():
    for nombre, spec in ICONOS.items():
        lado, crudo = dibujar(spec)
        destino = PUBLICO / nombre
        escribir_png(destino, lado, crudo)
        print(f'{nombre}: {lado}x{lado} px, {destino.stat().st_size / 1024:.1f} kB')


if __name__ == '__main__':
    main()
