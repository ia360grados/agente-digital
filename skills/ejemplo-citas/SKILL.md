# Gestión de citas (SKILL DE EJEMPLO — plantilla)

> Esta skill es una plantilla de demostración incluida en el producto base.
> Las skills comerciales siguen este mismo formato.

## Qué hace

Gestiona la agenda del negocio por WhatsApp: consulta huecos, crea,
mueve y cancela citas.

## Cuándo usarla

- "¿Qué citas tengo mañana?"
- "Apunta a García el jueves a las 10"
- "Cancela la cita de las 12"
- "¿Tengo hueco el viernes por la tarde?"

## Cómo ejecutarla

1. La agenda vive en `agenda.md` en esta carpeta (formato: una cita por
   línea, `YYYY-MM-DD HH:MM | nombre | motivo`).
2. Para consultar: lee `agenda.md` y responde solo lo relevante.
3. Para crear/mover/cancelar: edita `agenda.md` y confirma al usuario
   con fecha, hora y nombre.
4. Nunca borres citas sin confirmación explícita del usuario.

> La versión comercial de esta skill sincroniza con Google Calendar en
> lugar de un archivo local.

## Requisitos

Ninguno (versión de ejemplo con archivo local).
