

## Adaptar este sistema para otras materias

Esta sección explica cómo un docente puede reutilizar el sistema para crear su propio escrito digital, sin necesidad de conocimientos de programación.

### Archivos del template

El repositorio incluye dos archivos de template listos para adaptar:

| Archivo | Para qué sirve |
|---|---|
| `escrito-template.html` | El examen en blanco — con ejemplos de los 4 tipos de pregunta y comentarios que señalan exactamente qué cambiar |
| `codigo-google-sheet-template.js` | El Apps Script en blanco — con las mismas secciones de configuración marcadas |

### Pasos para crear un escrito propio

#### Paso 1 — Configurar la planilla y el Apps Script

Seguir los mismos pasos de la sección [Configuración → 1. Google Apps Script](#1-google-apps-script) de este README, pero usando `codigo-google-sheet-template.js` como base.

Dentro de ese archivo, editá solo la **zona de configuración** (está claramente marcada):

1. **`HEADERS`** — nombres de columna de la planilla (uno por pregunta)
2. **`QUESTION_IDS`** — lista de ids de las preguntas, en el mismo orden que en el HTML
3. **`CORRECT_ANSWERS`** — respuestas correctas de las preguntas autocorregibles (no poner las preguntas abiertas aquí)

#### Paso 2 — Editar el examen HTML

Abrir `escrito-template.html` con cualquier editor de texto (Bloc de notas, VS Code, Notepad++, etc.) y editar solo la **zona de configuración** del bloque `<script>`:

1. **`SHEET_WEBAPP_URL`** — pegar la URL del Apps Script (del Paso 1)
2. **`LS_KEY`** — cambiar por un nombre único para este examen (ej: `"historia_ww2_oct2025"`)
3. **`QUIZ_TITLE`** / **`QUIZ_HEADER`** — título que verán los estudiantes
4. **`questions`** — el array de preguntas (ver ejemplos comentados dentro del archivo)

#### Tipos de pregunta disponibles

El template incluye ejemplos comentados de los 4 tipos:

- **`open`** — el estudiante escribe libremente (se corrige manualmente en la planilla)
- **`single`** — elige una opción entre varias (radio buttons, se autocorrige)
- **`tf`** — verdadero o falso (se autocorrige)
- **`blank`** — completa blancos dentro de un bloque de código (se autocorrige)

Cada tipo puede tener opcionalmente un bloque de código antes de la pregunta o las opciones.

#### Paso 3 — Publicar

Subir `escrito-template.html` (renombrado como se quiera) a GitHub Pages, Netlify u otro hosting estático. La URL resultante es la que se comparte con los estudiantes.

> **Tip:** al alojar en GitHub Pages se obtiene una URL fija que se puede reutilizar en futuros escritos. Para cada examen nuevo, basta con actualizar el HTML y el Apps Script sin cambiar la URL.

---

## Personalización

### Cambiar o agregar preguntas

El array `questions` en el `<script>` del HTML contiene todas las preguntas. Cada objeto sigue esta estructura:

```js
// Pregunta abierta
{ id: "q1", type: "open", text: "Texto de la pregunta" }

// Opción única
{ id: "q2", type: "single", text: "Texto", options: [
    { id: "a", label: "Opción A" },
    { id: "b", label: "Opción B" }
]}

// Verdadero / Falso
{ id: "q3", type: "tf", text: "Texto de la pregunta" }

// Completar (con código)
{ id: "q4", type: "blank", text: "Texto", blanks: 2,
  code: `String x = request.__BLANK0__("param");\nreturn __BLANK1__;` }
```

Los marcadores `__BLANK0__`, `__BLANK1__`, etc. se reemplazan automáticamente por campos de texto al renderizar.

### Desactivar el orden aleatorio

Para que las preguntas aparezcan siempre en el mismo orden, comentar esta línea en el `<script>`:

```js
// shuffle(questions);
```

### Desactivar pantalla completa

Para utilizar el examen sin forzar pantalla completa, comentar este bloque al final del script:

```js
// document.addEventListener("click", function initFS() { ... });
```

---

## Tecnologías

- HTML5 / CSS3 / JavaScript vanilla — sin dependencias externas
- Google Apps Script (backend para guardar y calificar respuestas)
- JSONP para comunicación con el script sin restricciones CORS
- Fullscreen API del navegador
- localStorage (control de doble envío)

---

*Programación Avanzada — UTU (DGETP) · Elizabeth Izquierdo*
