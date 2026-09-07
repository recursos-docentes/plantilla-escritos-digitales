# Plantilla de escritos digitales

Base reutilizable para armar exámenes digitales autocorregidos: un único
archivo HTML (sin dependencias externas más que una fuente opcional de
Google Fonts) más un script de Google Apps Script que corrige y guarda cada
intento en una planilla de Google Sheets — pensada para usarse en la sala de
informática, con medidas razonables contra copia sin depender de ningún
software adicional instalado.

Esta plantilla es la generalización de varios escritos ya armados con esta
misma base (Java Web/JSP, arrays en Java); acá se documenta la arquitectura
para que cualquier docente pueda adaptarla a su propia materia.

## Qué resuelve

Armar un escrito digital "a mano" con Google Forms u otras herramientas
similares tiene límites: no se puede forzar pantalla completa, no hay forma
simple de auto-enviar si el estudiante intenta salirse, y las respuestas
correctas suelen quedar visibles en el código si se arma algo custom. Esta
plantilla resuelve los tres problemas:

- **Pantalla completa forzada**, con envío automático de lo que esté
  respondido si el estudiante sale de ella antes de terminar.
- **Anti-doble-envío**: una vez enviado, el navegador queda marcado y no se
  puede reabrir el mismo escrito ahí (con un link de reinicio que solo
  conoce la docente, por si hace falta habilitar un reintento puntual).
- **Corrección 100% del lado del servidor**: la clave de respuestas vive
  solo en Apps Script. El HTML que le llega al estudiante no la contiene, así
  que abrir el código fuente o las herramientas de desarrollador (F12) no
  sirve para verla.

## Archivos

```
escrito-template.html          # El escrito en sí (HTML + CSS + JS, autocontenido)
codigo-google-sheet-template.js # El script de Apps Script (corrección + guardado)
```

`escrito-template.html` no tiene ninguna respuesta correcta adentro — todo
el criterio de corrección vive en `codigo-google-sheet-template.js`, que se
pega en el proyecto de Apps Script vinculado a la planilla de cada docente.

## Tipos de pregunta soportados

| Tipo     | Qué es                                              |
|----------|------------------------------------------------------|
| `single` | Opción única (radio buttons)                         |
| `multi`  | Selección múltiple (checkboxes, puede haber más de una correcta) |
| `tf`     | Verdadero / Falso                                     |
| `blank`  | Completar código (uno o más espacios en blanco por pregunta) |
| `open`   | Pregunta abierta de desarrollo — **no se corrige automáticamente**, queda guardada en la planilla para revisión manual, y no suma al puntaje de las demás |

Cada pregunta puede incluir opcionalmente un bloque de código (con resaltado
de sintaxis básico) o un diagrama simple, según lo que necesite la consigna.

## Cómo armar un escrito nuevo a partir de la plantilla

1. Copiar `escrito-template.html` y `codigo-google-sheet-template.js` a un
   repo nuevo (o una carpeta nueva).
2. En el HTML, editar el array de preguntas (`autoQuestions` para las que se
   corrigen solas, y `openQuestion` si se quiere agregar una de desarrollo)
   con el contenido de la materia correspondiente.
3. En el script de Apps Script, completar `ANSWER_KEY` con un id por cada
   pregunta automática (debe coincidir con el `id` usado en el HTML) y su
   respuesta correcta.
4. Seguir los pasos de la sección **Configurar la planilla** más abajo para
   publicar el backend y conectar la URL.
5. Renombrar el HTML (por ejemplo a `index.html`) y publicarlo — GitHub
   Pages es la forma más simple, pero cualquier hosting estático sirve.

## Configurar la planilla de notas

### 1. Crear la planilla

Crear una planilla nueva en Google Sheets. En la fila 1, poner los
encabezados: `Fecha`, `Nombre y Apellido`, `Puntaje`, `Total`, una columna
`P1`, `P2`, ... por cada pregunta automática que tenga el escrito, y
`Respuesta abierta` al final (si el escrito tiene una).

### 2. Pegar el script

**Extensiones → Apps Script**, borrar el contenido de `Code.gs` y pegar el
de `codigo-google-sheet-template.js`, completando `ANSWER_KEY` con las
respuestas de ese escrito puntual.

### 3. Publicar como aplicación web

**Implementar → Nueva implementación → Tipo: Aplicación web.**
Configurar **Ejecutar como: Yo**, y **Quién tiene acceso: Cualquiera.**
Autorizar cuando lo pida (es un script propio, el aviso de "no seguro" es
normal). Copiar la URL que termina en `/exec` — la de la sección **App
web**, no la de "Biblioteca".

### 4. Conectar el HTML

En `escrito-template.html`, buscar `SHEET_WEBAPP_URL` y pegar ahí esa URL.

### Actualizar el script sin romper la URL

Para cambiar `Code.gs` más adelante sin que cambie la URL (y así no tener
que volver a tocar el HTML): **Implementar → Administrar implementaciones →
ícono de lápiz → Versión: Nueva versión → Implementar.** Crear una
implementación nueva desde cero en lugar de editar la existente genera una
URL distinta.

## Decisiones técnicas (y por qué)

Vale la pena documentarlas para no volver a pisar los mismos problemas al
adaptar la plantilla a un escrito nuevo:

- **Todo el intercambio con Apps Script es por GET, con formato JSONP** (un
  `<script src="...">`, nunca `fetch` con POST). Google Apps Script
  redirige cada pedido internamente, y en ese salto algunos navegadores
  convierten un POST en GET y descartan el cuerpo del mensaje — con GET no
  hay cuerpo que perder. Además, `fetch` normal contra Apps Script choca con
  problemas de CORS al intentar leer la respuesta; JSONP los evita del
  todo, porque cargar un `<script>` no está sujeto a esa política.
- **Un solo intento, con timeout de 15 segundos**: si no llega respuesta a
  tiempo, se asume igual que el envío se disparó correctamente (porque ya
  se disparó) y se avisa sin mostrar el detalle de corrección, en vez de
  reintentar en bucle y arriesgarse a mandar la misma respuesta varias
  veces.
- **La pantalla completa no se puede forzar en iOS** (ni Safari ni ningún
  otro navegador ahí, porque todos usan el motor WebKit de Apple por
  debajo). En esos dispositivos, el escrito avisa y deja continuar igual
  sin pantalla completa, para no bloquearlos por completo.
- **El anti-doble-envío usa `localStorage`**, que es por navegador y por
  origen (dominio), no por archivo — así que dos escritos distintos
  publicados en el mismo sitio no deberían compartir la misma clave de
  `localStorage` (revisar que cada adaptación de la plantilla use una clave
  distinta si conviven varios escritos en el mismo dominio).
- **No hay forma de garantizar al 100% que un estudiante no reabra el
  escrito** (otro navegador, modo incógnito, otro dispositivo evaden la
  marca). Es una traba razonable, no una prueba de examen con cámara — para
  eso hace falta software de bloqueo real como Safe Exam Browser, que es
  una capa aparte y no depende de esta plantilla.

## Personalización visual

El HTML usa variables CSS (`:root`) para todos los colores, así que cambiar
de tema es editar un solo bloque. Dos temas ya probados:

- **Editor de código (oscuro)**: fondo casi negro, acento ámbar, tipografía
  monoespaciada en todo — pensado para materias de programación.
- **Crema y tinta / papel de examen (claro)**: fondo color hueso, acento
  rojo vino, tipografía serif (Lora, de Google Fonts) para el texto general
  y monoespaciada solo en los bloques de código — más parecido a un examen
  en papel.

Para adaptar un tema nuevo, alcanza con cambiar las variables de `:root` y,
si se usa una fuente distinta a la monoespaciada de base, actualizar
`font-family` en `html,body` y en los botones principales.
