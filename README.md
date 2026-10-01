# Manga Cam — PWA de cámara con stickers faciales

App 100% del lado del cliente: cámara, seguimiento facial y segmentación de
piel corren en el navegador del usuario (MediaPipe, vía CDN). No hay backend
ni se sube ningún video o imagen a un servidor.

## Archivos

- `index.html` — pantallas: permiso/arranque, cámara, vista previa, panel de ajustes.
- `styles.css` — identidad visual tipo panel de cómic (tinta oscura, acento rojo, esquinas cortadas).
- `app.js` — cámara, seguimiento facial (MediaPipe Face Landmarker), clasificación de expresión/ángulo, dibujo del sticker, oclusión de manos (MediaPipe Image Segmenter), grabación (MediaRecorder), instalación de PWA.
- `manifest.json` — nombre, íconos, modo standalone.
- `sw.js` — service worker (cache-first) para uso offline tras la primera visita.
- `icons/` — íconos 192px y 512px.

## Cómo publicarlo (necesita HTTPS para que funcione la cámara)

La forma más simple, gratis y sin instalar nada:

1. Andá a **https://app.netlify.com/drop**.
2. Arrastrá la carpeta completa `manga-cam-pwa` (o un .zip con estos archivos) a la página.
3. Netlify te da una URL `https://algo.netlify.app` con HTTPS automático — ya está lista para usar y para instalar en el celular.

Alternativas equivalentes: **Vercel** (`vercel.com`, drag-and-drop o `vercel deploy`), **GitHub Pages** (subir el repo y activar Pages), **Cloudflare Pages**.

> Importante: no la abras como archivo local (`file://`) ni en `http://` sin certificado — el navegador bloquea la cámara en ese caso y la propia app te avisa por qué.

## Cómo instalarla en el celular

- **Android/Chrome:** abrí la URL, tocá el botón "Instalar app" que aparece dentro de la app (o el menú ⋮ → "Instalar app").
- **iPhone/Safari:** abrí la URL, tocá "Compartir" → "Agregar a inicio". iOS no soporta el instalador automático, por eso la app muestra estas instrucciones manualmente.

## Notas sobre el seguimiento facial y la oclusión de manos

- El seguimiento de rostro usa **MediaPipe Face Landmarker** (landmarks 3D +
  blendshapes + matriz de transformación facial), cargado desde
  `cdn.jsdelivr.net` y `storage.googleapis.com/mediapipe-models` la primera
  vez que se abre la app (con conexión a internet). El seguimiento en sí
  corre localmente en el dispositivo (WebAssembly/GPU del navegador).
- La expresión (feliz/riendo/decepción/sorprendido/enojado/neutral) se
  clasifica con reglas simples sobre los blendshapes — es una heurística,
  no un modelo de emoción entrenado, así que puede fallar en casos límite.
  Podés ajustar los umbrales en `classifyEmotion()` dentro de `app.js`.
- La oclusión de manos usa el modelo multiclase de **MediaPipe Image
  Segmenter** (`selfie_multiclass_256x256`), tomando la categoría
  "body-skin" para pintar la piel de manos/antebrazos por encima del
  sticker. Es más pesado que el seguimiento facial: por eso corre a media
  frecuencia de frames y tiene su propio interruptor en Ajustes. Si el
  modelo no carga (dispositivo viejo, sin GPU, etc.), la app lo detecta y
  deshabilita la opción automáticamente sin afectar el resto.
- Los stickers subidos por el usuario viven solo en memoria (Object URLs)
  durante la sesión — se pierden al cerrar/recargar la app, tal como pide
  el brief (no hay backend ni cuenta de usuario).

## Limitaciones conocidas / posibles próximos pasos

- La detección de "riendo" vs. "feliz" y "decepción" vs. "enojado" es la
  parte más subjetiva de la heurística — vale la pena calibrarla mirando
  la propia cara del usuario final.
- `MediaRecorder` con `canvas.captureStream()` funciona en Chrome/Android y
  Safari/iOS 15+; en iOS más viejo el formato de salida puede variar.
- El control de zoom óptico solo aparece si el navegador/dispositivo expone
  la capacidad `zoom` en `MediaStreamTrack.getCapabilities()` (no todos lo
  hacen, especialmente en iOS).
