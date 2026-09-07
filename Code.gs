// ╔═════════════════════════════════════════════════════════════════════════════╗
// ║         SCRIPT DE GOOGLE APPS — TEMPLATE PARA ESCRITOS DIGITALES            ║
// ║                                                                             ║
// ║  Instrucciones de instalación:                                              ║
// ║  1. Crear una Google Sheet nueva (vacía)                                    ║
// ║  2. Menú → Extensiones → Apps Script                                        ║
// ║  3. Borrar el código por defecto y pegar este archivo completo              ║
// ║  4. Guardar (Ctrl+S)                                                        ║
// ║  5. Implementar → Nueva implementación → Tipo: Aplicación web               ║
// ║        Ejecutar como: Yo / Quién tiene acceso: Cualquier persona            ║
// ║  6. Copiar la URL y pegarla en el HTML (constante SHEET_WEBAPP_URL)         ║
// ║                                                                             ║
// ║  IMPORTANTE: cada vez que se modifique este script hay que crear una        ║
// ║  NUEVA VERSIÓN del deployment para que los cambios tomen efecto:            ║
// ║  Implementar → Administrar implementaciones → ✏️ → Nueva versión → Guardar  ║
// ╚═════════════════════════════════════════════════════════════════════════════╝


// ══════════════════════════════════════════════════════════════════
//  ZONA DE CONFIGURACIÓN — Editá solo esta sección
// ══════════════════════════════════════════════════════════════════

// ── 1. Encabezados de la planilla ─────────────────────────────────────────
//    La primera columna es siempre "Timestamp" y la segunda "Nombre".
//    Luego va una columna por cada pregunta (con una descripción breve).
//    Al final, la columna de autocorrección.
//
//    Ajustar según la cantidad y tipo de preguntas del examen.
//    El formato "P1 – [descripción]" es solo una convención; podés usar
//    cualquier nombre de columna que te resulte claro en la planilla.
var HEADERS = [
  "Timestamp",
  "Nombre",
  "P1 – [descripción breve de la pregunta 1]",   // open  → corrección manual
  "P2 – [descripción breve de la pregunta 2]",   // single
  "P3 – [descripción breve de la pregunta 3]",   // tf
  "P4 – [descripción breve de la pregunta 4]",   // blank
  "P5 – [descripción breve de la pregunta 5]",   // open  → corrección manual
  "P6 – [descripción breve de la pregunta 6]",   // single
  "P7 – [descripción breve de la pregunta 7]",   // tf
  "Autocorrección (X/" + 4 + ")"   // ← cambiar el número por la cantidad de preguntas autocorregibles
];

// ── 2. IDs de las preguntas ────────────────────────────────────────────────
//    Lista con todos los ids del HTML, en el mismo orden que aparecen en
//    el array "questions". Deben coincidir exactamente.
var QUESTION_IDS = ["q1", "q2", "q3", "q4", "q5", "q6", "q7"];

// ── 3. Respuestas correctas ────────────────────────────────────────────────
//    Solo incluir las preguntas que se autocorrigen (single, tf, blank).
//    Las preguntas "open" NO van aquí (se corrigen manualmente).
//
//    Formatos:
//    ● single → string con la letra de la opción correcta: "b"
//    ● tf     → string "true" o "false"
//    ● blank  → array con las respuestas en orden, una por cada blanco:
//               ["respuesta1", "respuesta2"]
//
//    La comparación es case-insensitive (no distingue mayúsculas).
var CORRECT_ANSWERS = {
  // q1 es "open" → no va aquí (corrección manual)
  q2: "b",                        // single: letra de la opción correcta
  q3: "true",                     // tf: "true" o "false"
  q4: ["respuesta1", "respuesta2"], // blank: una respuesta por cada blanco
  // q5 es "open" → no va aquí (corrección manual)
  q6: "a",                        // single
  q7: "false"                     // tf
};

// ══════════════════════════════════════════════════════════════════════════
//  FIN DE LA ZONA DE CONFIGURACIÓN
//  El código de abajo no hace falta modificarlo.
// ══════════════════════════════════════════════════════════════════════════


// ── Calificación automática ───────────────────────────────────────────────
function gradeAnswers(data) {
  var results = {};
  var correct = 0;
  var total   = Object.keys(CORRECT_ANSWERS).length;

  for (var qid in CORRECT_ANSWERS) {
    var correctAns  = CORRECT_ANSWERS[qid];
    var studentRaw  = (data[qid] || "").trim();

    if (Array.isArray(correctAns)) {
      // blank: el estudiante envía los campos unidos con " | "
      var studentBlanks = studentRaw.split(" | ").map(function(s) { return s.trim().toLowerCase(); });
      var allOk = correctAns.every(function(ans, i) {
        return (studentBlanks[i] || "") === ans.toLowerCase();
      });
      results[qid] = allOk ? "correcta" : "incorrecta";
      if (allOk) correct++;
    } else {
      // single o tf
      var ok = studentRaw.toLowerCase() === correctAns.toLowerCase();
      results[qid] = ok ? "correcta" : "incorrecta";
      if (ok) correct++;
    }
  }

  return { correct: correct, total: total, results: results };
}

// ── doGet: recibe respuestas vía JSONP y las guarda en la planilla ────────
function doGet(e) {
  if (e && e.parameter && e.parameter.data) {
    try {
      var data      = JSON.parse(e.parameter.data);
      var sheet     = getOrCreateSheet();
      ensureHeaders(sheet);

      var timestamp = data.timestamp || new Date().toISOString();
      var nombre    = (data.nombre || "").trim() || "(sin nombre)";
      var grade     = gradeAnswers(data);

      var detalle = Object.keys(grade.results).map(function(q) {
        return q + ":" + (grade.results[q] === "correcta" ? "✓" : "✗");
      }).join("  ");
      var resumen = grade.correct + "/" + grade.total + "  →  " + detalle;

      var row = [timestamp, nombre];
      QUESTION_IDS.forEach(function(id) { row.push(data[id] || ""); });
      row.push(resumen);

      sheet.appendRow(row);
      console.log("Guardado para: " + nombre + " | " + resumen);

      var result = {
        ok: true,
        correct: grade.correct,
        total: grade.total,
        results: grade.results
      };

      // Si viene callback → respuesta JSONP para el quiz HTML
      var cb = (e.parameter.callback || "").replace(/[^a-zA-Z0-9_]/g, "");
      if (cb) {
        return ContentService
          .createTextOutput(cb + "(" + JSON.stringify(result) + ")")
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      }
      return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);

    } catch (err) {
      console.error("Error en doGet: " + err.message);
      var errResult = { ok: false, error: err.message };
      var cb2 = (e.parameter.callback || "").replace(/[^a-zA-Z0-9_]/g, "");
      if (cb2) {
        return ContentService
          .createTextOutput(cb2 + "(" + JSON.stringify(errResult) + ")")
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      }
      return ContentService
        .createTextOutput(JSON.stringify(errResult))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  // Sin parámetro data → prueba rápida para verificar que el script está activo
  return ContentService
    .createTextOutput("✓ Script activo — Escritos digitales")
    .setMimeType(ContentService.MimeType.TEXT);
}

// ── doPost: disponible para pruebas manuales desde el editor ──────────────
function doPost(e) {
  try {
    var raw = "{}";
    if (e && e.postData && e.postData.contents) {
      raw = e.postData.contents;
    } else if (e && e.parameter) {
      raw = JSON.stringify(e.parameter);
    }
    var data  = JSON.parse(raw);
    var sheet = getOrCreateSheet();
    ensureHeaders(sheet);

    var timestamp = data.timestamp || new Date().toISOString();
    var nombre    = (data.nombre || "").trim() || "(sin nombre)";
    var grade     = gradeAnswers(data);
    var detalle   = Object.keys(grade.results).map(function(q) {
      return q + ":" + (grade.results[q] === "correcta" ? "✓" : "✗");
    }).join("  ");
    var resumen = grade.correct + "/" + grade.total + "  →  " + detalle;

    var row = [timestamp, nombre];
    QUESTION_IDS.forEach(function(id) { row.push(data[id] || ""); });
    row.push(resumen);

    sheet.appendRow(row);
    console.log("Guardado (POST) para: " + nombre);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    console.error("Error en doPost: " + err.message);
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── Prueba manual desde el editor del Apps Script ─────────────────────────
//    Seleccionar esta función y hacer clic en "Ejecutar" para probar
//    que el script guarda correctamente en la planilla.
function testManual() {
  var fakeEvent = {
    postData: {
      contents: JSON.stringify({
        nombre: "Estudiante de Prueba",
        q1: "Respuesta abierta de prueba.",
        q2: "b",
        q3: "true",
        q4: "respuesta1 | respuesta2",
        q5: "Otra respuesta abierta.",
        q6: "a",
        q7: "false",
        timestamp: new Date().toISOString()
      })
    }
  };
  var result = doPost(fakeEvent);
  console.log("Resultado: " + result.getContent());
}

// ── Helpers ───────────────────────────────────────────────────────────────
function getOrCreateSheet() {
  var ss        = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = "Respuestas";
  return ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
}

function ensureHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    var r = sheet.getRange(1, 1, 1, HEADERS.length);
    r.setFontWeight("bold");
    r.setBackground("#1d1f2b");
    r.setFontColor("#ffb454");
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, HEADERS.length);
  }
}
