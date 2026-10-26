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
- Nueva carpeta recuerda la última columna y fila elegidas, incluso si cancelás el formulario o recargás la app. Editar otra carpeta no modifica esa preferencia.

## Datos y privacidad

Los datos se guardan automáticamente en `localStorage` del navegador, sin enviarse a un servidor. No se sincronizan entre dispositivos. Borrar datos del navegador, cambiar de navegador o cambiar de dirección puede dejarte sin acceso al archivo; exportá copias regularmente. El modo privado y algunos navegadores pueden limitar el almacenamiento, especialmente al abrir archivos directamente. Se avisa cuando el guardado falla.

## Formato JSON

Ver `ejemplo.json`, que contiene datos opcionales de demostración. Se acepta un objeto con `version: 1` y `carpetas`, o directamente una lista. Cada carpeta requiere `nombre` (texto no vacío), `color`, `columna` (número 1–2) y `fila` (número 1–3). `id` y `creado` (fecha ISO) son opcionales y se generan si faltan. Los IDs deben ser únicos dentro del archivo. Colores: `amarillo`, `verde`, `azul`, `rojo`, `naranja`, `violeta`, `rosa`, `blanco`, `negro`, `marron`. Máximo de importación: 10 MB. Un archivo inválido se rechaza completo antes de modificar datos.

## Archivos

`index.html`: estructura accesible y diálogos. `styles.css`: diseño adaptable. `app.js`: búsqueda, CRUD, persistencia y JSON. No requiere compilación ni conexión a Internet.

## Desarrollo, privacidad y comprobaciones

El inventario y las preferencias se guardan en localStorage. Permite importar y exportar JSON; ejemplo.json contiene datos de demostración.

Los datos del navegador no se suben automáticamente a GitHub. Pueden perderse al borrar el almacenamiento o cambiar de navegador, perfil o dirección. localStorage e IndexedDB no son una bóveda cifrada ni un sistema de cuentas; no ofrecen aislamiento entre aplicaciones del mismo origen. Usá datos ficticios al preparar demos y pruebas. Conservá tus respaldos reales fuera de la carpeta del repositorio o dentro de `private-data/`, `backups/` o `exports/`, que están excluidas de Git. Las capturas privadas van en `private-screenshots/`; las capturas públicas deben revisarse manualmente.

`.gitignore` evita agregados accidentales, pero no elimina archivos ya versionados y se puede omitir con `git add -f`. El control local/CI también rechaza rutas privadas, formatos de respaldo y JSON no previstos. Solo se permiten los JSON de configuración, ejemplos explícitos (`*.example.json`) y fixtures ficticios revisados (`tests/fixtures/*.example.json` o `*.example.csv`). No conviertas datos reales en ejemplos cambiándoles el nombre. Si necesitás otro archivo público legítimo, revisá su contenido y ajustá la lista permitida en `scripts/check-repository.cjs`. El detector usa patrones conocidos: no garantiza detectar todos los secretos ni datos personales en texto o imágenes.

### Comprobar antes de subir

Con **Node.js 24** y **Git**, desde la raíz del repositorio, sin instalar dependencias:

```sh
node scripts/check-repository.cjs --self-test
node scripts/check-repository.cjs
```

El chequeo básico valida archivos privados, patrones de credenciales, reglas de exclusión, JSON y sintaxis JavaScript, incluidos los scripts dentro de HTML. No abre la interfaz ni demuestra que todas las funciones de la aplicación sean correctas. Las pruebas adicionales usan datos sintéticos y almacenamiento aislado.

### Activar la protección local

Cada clon nuevo debe habilitar el hook explícitamente:

```sh
git config --local core.hooksPath .githooks
```

El hook ejecuta el control antes de crear un commit. Necesita Node.js en PATH; no accede al navegador ni envía datos por red. Podés correr el mismo control manualmente. Antes de cada subida revisá además `git diff --cached` y `git status`. Un detector de CI se ejecuta después de subir: complementa la prevención local, pero no evita una primera exposición. Si se filtra una credencial, revocala/rotala; borrar el archivo o hacer privado el repositorio no invalida las copias previas.

GitHub Actions ejecuta estos controles en cada push y pull request, con permisos de lectura y sin secretos. Las acciones se fijan a commits concretos. No se instala ninguna dependencia de la aplicación durante estas verificaciones.
