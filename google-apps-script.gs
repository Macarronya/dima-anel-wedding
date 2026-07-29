/**
 * Google Apps Script для записи RSVP-ответов в Google Таблицу.
 *
 * Этот вариант рассчитан и на уже существующую таблицу:
 * если столбца "Ночёвка" ещё нет, скрипт автоматически вставит его
 * перед столбцом "Алкоголь", не удаляя существующие ответы.
 */

const SHEET_NAME = "RSVP";

const HEADERS = [
  "Дата ответа",
  "Имя гостя",
  "Присутствие",
  "Ночёвка",
  "Алкоголь",
  "Комментарий",
  "Технические данные"
];

function getSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  return sheet;
}

/**
 * Создаёт заголовки для новой таблицы либо аккуратно добавляет
 * недостающий столбец "Ночёвка" в уже существующую таблицу.
 */
function setupHeaders() {
  const sheet = getSheet_();

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  } else {
    const lastColumn = Math.max(sheet.getLastColumn(), 1);
    const currentHeaders = sheet
      .getRange(1, 1, 1, lastColumn)
      .getValues()[0]
      .map(value => String(value).trim());

    if (!currentHeaders.includes("Ночёвка")) {
      const alcoholIndex = currentHeaders.indexOf("Алкоголь");

      if (alcoholIndex >= 0) {
        // alcoholIndex начинается с 0, а номера столбцов Google Sheets — с 1.
        const alcoholColumn = alcoholIndex + 1;
        sheet.insertColumnBefore(alcoholColumn);
        sheet.getRange(1, alcoholColumn).setValue("Ночёвка");
      } else {
        sheet.insertColumnAfter(lastColumn);
        sheet.getRange(1, lastColumn + 1).setValue("Ночёвка");
      }
    }
  }

  const refreshedLastColumn = Math.max(sheet.getLastColumn(), HEADERS.length);
  const refreshedHeaders = sheet
    .getRange(1, 1, 1, refreshedLastColumn)
    .getValues()[0]
    .map(value => String(value).trim());

  // Приводим порядок первых семи столбцов к ожидаемому виду.
  // Если структура уже правильная, данные не меняются.
  const headerPositions = {};
  refreshedHeaders.forEach((header, index) => {
    if (header) headerPositions[header] = index + 1;
  });

  HEADERS.forEach((header, targetIndex) => {
    const targetColumn = targetIndex + 1;
    const currentColumn = headerPositions[header];

    if (!currentColumn) {
      sheet.insertColumnAfter(sheet.getLastColumn());
      sheet.getRange(1, sheet.getLastColumn()).setValue(header);
    }
  });

  sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), HEADERS.length))
    .setFontWeight("bold");
  sheet.setFrozenRows(1);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    setupHeaders();

    const payload = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const sheet = getSheet_();

    sheet.appendRow([
      payload.submittedAt || new Date().toISOString(),
      payload.guestName || "",
      payload.attendance || "",
      payload.overnight || "",
      Array.isArray(payload.alcohol) ? payload.alcohol.join(", ") : "",
      payload.comment || "",
      payload.userAgent || ""
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(error) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
