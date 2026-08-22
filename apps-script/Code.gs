/**
 * Google Apps Script backend for the wedding invitation.
 *
 * Sheet columns:
 * Timestamp | Name | Attendance | Guests | Message
 *
 * 1. Create a Google Sheet.
 * 2. Extensions -> Apps Script.
 * 3. Paste this file.
 * 4. Set SHEET_NAME if needed.
 * 5. Deploy -> New deployment -> Web app.
 *    Execute as: Me
 *    Who has access: Anyone
 * 6. Copy the /exec URL into config.js.
 */
const SHEET_NAME = "RSVP";

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Timestamp", "Name", "Attendance", "Guests", "Message"]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function doPost(e) {
  const p = e && e.parameter ? e.parameter : {};
  const name = clean_(p.name, 80);
  const attendance = p.attendance === "Attending" ? "Attending" : "Not Attending";
  const guests = Math.max(0, Math.min(10, Number(p.guests || 0)));
  const message = clean_(p.message, 500);

  if (!name) return json_({ok:false, error:"Name is required."});

  getSheet_().appendRow([new Date(), name, attendance, guests, message]);
  return json_({ok:true});
}

function doGet() {
  const sheet = getSheet_();
  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return ContentService.createTextOutput("[]").setMimeType(ContentService.MimeType.JSON);

  const items = rows.slice(1).map(r => ({
    timestamp: r[0],
    name: r[1],
    attendance: r[2],
    guests: r[3],
    message: r[4]
  })).filter(x => x.name);

  return ContentService.createTextOutput(JSON.stringify(items))
    .setMimeType(ContentService.MimeType.JSON);
}

function clean_(value, max) {
  return String(value || "").replace(/[<>]/g, "").trim().slice(0, max);
}
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
