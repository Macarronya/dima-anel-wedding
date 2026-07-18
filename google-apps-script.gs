/**
 * Google Apps Script для записи RSVP-ответов в Google Таблицу.
 *
 * 1. Создайте Google Таблицу.
 * 2. Откройте: Расширения → Apps Script.
 * 3. Вставьте этот код вместо содержимого файла Code.gs.
 * 4. Запустите функцию setupHeaders один раз и подтвердите доступ.
 * 5. Нажмите Развернуть → Новое развертывание → Веб-приложение.
 * 6. Выполнять от имени: вы.
 * 7. У кого есть доступ: все.
 * 8. Скопируйте URL и вставьте его в config.js в googleScriptUrl.
 */

const SHEET_NAME = "RSVP";

function getSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  return sheet;
}

function setupHeaders() {
  const sheet = getSheet_();

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Дата ответа",
      "Имя гостя",
      "Присутствие",
      "Алкоголь",
      "Комментарий",
      "Технические данные"
    ]);

    sheet.getRange(1, 1, 1, 6).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    setupHeaders();

    const payload = JSON.parse(e.postData.contents || "{}");
    const sheet = getSheet_();

    sheet.appendRow([
      payload.submittedAt || new Date().toISOString(),
      payload.guestName || "",
      payload.attendance || "",
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
