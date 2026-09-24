# Carpetas

Buscador de carpetas físicas en HTML, CSS y JavaScript puro, con modo oscuro y diseño adaptable a celulares. Sin instalación, dependencias ni servicios externos.

## Abrir

Abrí `index.html` en un navegador moderno. También podés servir esta carpeta con `python -m http.server 8000` y entrar a `http://localhost:8000`.

## Uso

- Agregá un nombre, color, columna (1 o 2) y fila (1, 2 o 3). La estantería se lee de frente y la fila 3 está arriba, la fila 2 en el medio y la fila 1 abajo.
- Se admiten nombres largos y repetidos: cada carpeta tiene un identificador independiente.
- Buscá fragmentos o palabras en cualquier orden, sin distinguir mayúsculas ni tildes. Por ejemplo, `2026 servicios` encuentra `Facturas de servicios 2026`.
- Combiná filtros de color y ubicación; pulsá una celda de la estantería para filtrar y volvé a pulsarla para quitar ese filtro. Sus números indican coincidencias/total.
- Editá o eliminá desde cada tarjeta. El aviso de eliminación permite deshacer la última eliminación.
- Exportá JSON para respaldar o trasladar el archivo. Al importar podés agregar (omite IDs existentes) o reemplazar todo. Los nombres repetidos se conservan.
- El atajo `/` enfoca la búsqueda.

## Datos y privacidad

Los datos se guardan automáticamente en `localStorage` del navegador, sin enviarse a un servidor. No se sincronizan entre dispositivos. Borrar datos del navegador, cambiar de navegador o cambiar de dirección puede dejarte sin acceso al archivo; exportá copias regularmente. El modo privado y algunos navegadores pueden limitar el almacenamiento, especialmente al abrir archivos directamente. Se avisa cuando el guardado falla.

## Formato JSON

Ver `ejemplo.json`, que contiene datos opcionales de demostración. Se acepta un objeto con `version: 1` y `carpetas`, o directamente una lista. Cada carpeta requiere `nombre` (texto no vacío), `color`, `columna` (número 1–2) y `fila` (número 1–3). `id` y `creado` (fecha ISO) son opcionales y se generan si faltan. Los IDs deben ser únicos dentro del archivo. Colores: `amarillo`, `verde`, `azul`, `rojo`, `naranja`, `violeta`, `rosa`, `blanco`, `negro`, `marron`. Máximo de importación: 10 MB. Un archivo inválido se rechaza completo antes de modificar datos.

## Archivos

`index.html`: estructura accesible y diálogos. `styles.css`: diseño adaptable. `app.js`: búsqueda, CRUD, persistencia y JSON. No requiere compilación ni conexión a Internet.
