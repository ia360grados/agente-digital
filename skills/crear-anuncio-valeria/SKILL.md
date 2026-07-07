# Crear anuncio UGC de Valeria (vídeo IA completo)

## Qué hace

Produce un anuncio vertical (9:16) estilo UGC protagonizado por **Valeria**
(avatar IA), con voz en español lip-sync, chat de WhatsApp animado,
subtítulos quemados y silencios recortados. De guion a MP4 en ~20 min y
~150-300 créditos de Higgsfield (~5-10€).

## Cuándo usarla

- "Hazme un anuncio de Valeria sobre X"
- "Necesito un reel/ad para la campaña Y"
- "Genera una variante del hook del anuncio"

## Requisitos

- Cuenta **Higgsfield** conectada (MCP) con el Soul entrenado:
  - Soul "Valeria Pereyra": `soul_id: 8f494662-d9a3-4fa2-baa9-d88adee96e99`
- **Node.js** (portable vale) para renderizar con Remotion
- Guion aprobado por el usuario ANTES de generar nada (regla de oro)

## El pipeline (5 pasos)

### 1. Guion — SIEMPRE primero, sin generar nada
Estructura que convierte (30s):
- **Hook directo (0-3s)**: la promesa entera en una frase señalando algo
  físico ("En este ordenador tengo un trabajador de IA trabajando 24 horas")
- **Mecanismo (3-8s)**: "le hablo por WhatsApp como a una persona"
- **Demo real (8-20s)**: pantalla de WhatsApp + Valeria narrando en
  círculo PiP. LA VOZ NUNCA PARA (un segundo mudo = scroll)
- **Precio/objeción (20-25s)**: "no cobra nómina... un café al día"
- **CTA (25-30s)**: "haz clic e instala el tuyo"

### 2. Fotogramas clave (Higgsfield `generate_image`)
- Modelo: `soul_2` + `soul_id` de Valeria, `aspect_ratio: 9:16`
- Un fotograma por plano, MISMO escenario en todos (continuidad)
- Prompt en inglés: "UGC vertical video frame, young Spanish woman...,
  authentic smartphone footage look, photorealistic"
- Coste: ~0,12 créditos/imagen

### 3. Clips con voz (Higgsfield `generate_video`)
- Modelo: `seedance_2_0`, `generate_audio: true`, 9:16, 720p
- `medias: [{role: start_image, value: <job_id del fotograma>}]`
- El diálogo VA DENTRO del prompt, entrecomillado, con
  "in Spanish (Castilian accent), lip-synced dialogue: ..."
- Números en letras ("cuatrocientos cincuenta euros")
- Duración = lo que dura el diálogo + 1s. Coste: ~4,5 créditos/segundo
- Para la narración del bloque demo: un clip largo (10-12s) de Valeria
  hablando seguido — su audio es la voz en off del chat

### 4. Montaje (Remotion — plantilla incluida)
Copiar `plantilla-remotion/` a un directorio nuevo, poner los clips en
`public/`, y ajustar:
- `src/Anuncio.tsx`: orden de clips, subtítulos (palabra clave en verde
  #25D366), recortes de silencio (tabla `T`)
- `src/WhatsAppScene.tsx`: mensajes del chat, tiempos, PiP de Valeria
- **Recorte de silencios**: detectar con
  `npx remotion ffmpeg -i clip.mp4 -vn -af silencedetect=noise=-25dB:d=0.2 -f wav -y /dev/null`
  y quitar cabeceras/colas mudas vía `startFrom`/`endAt` (frames = seg × 30).
  Pausas internas largas → partir el clip en 2 secuencias (jump cut UGC)
- Render: `npm install && npx remotion render src/index.ts Anuncio out/anuncio.mp4`

### 5. Entrega
- Copiar a Escritorio y abrir con QuickTime para revisión
- Para enviar por WhatsApp: subir con Higgsfield `media_upload` (PUT +
  `media_confirm`) → URL pública del CDN → POST a WasenderAPI
  (`/api/send-message` con `to`, `text`, `videoUrl`; token en los
  escenarios de Make del usuario)

## Reglas aprendidas (no repetir errores)

1. **Guion aprobado antes de gastar créditos.** Presentar bloques y hooks
   alternativos; el usuario elige.
2. **Nada de escenas mudas.** Si un bloque no tiene clip hablado, lleva
   voz en off generada como clip de Valeria.
3. **Directo y al grano**: hooks de una frase, sin presentaciones.
4. **El usuario querrá iterar**: hook más directo, más ritmo, CTA distinto.
   Regenerar solo el clip afectado (~20-50 créditos), no todo.
5. Revisar siempre: acento castellano, que no se coma el final de frase,
   identidad consistente de Valeria entre clips.
