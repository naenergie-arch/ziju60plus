const SHEET_ID = '18CacsSzYLAY-ifek7_zTweiiFJapdpltzow_kxnwErk';
const SHEET_NAME = 'Leady';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(SHEET_ID);
    let sh = ss.getSheetByName(SHEET_NAME);
    if (!sh) sh = ss.insertSheet(SHEET_NAME);

    if (sh.getLastRow() === 0) {
      sh.appendRow(['Datum','Email','Jméno','Pohlaví','Věk_skut','Věk_poc','Pohyb','Nálada','Spojení','Spánek','Motivace','Zájmy','Text','Total','Zdroj']);
      sh.getRange(1,1,1,15).setBackground('#f0c060').setFontWeight('bold');
      sh.setFrozenRows(1);
    }

    sh.appendRow([
      new Date().toISOString(),
      data.email || '',
      data.jmeno || '',
      data.pohlavi || '',
      data.vek_skutecny || 0,
      data.vek_pocitovy || 0,
      data.pohyb || 0,
      data.nalada || 0,
      data.spojeni || 0,
      data.spanek || 0,
      data.motivace || 0,
      data.zalib || '',
      String(data.text || '').slice(0, 500),
      data.total || 0,
      data.zdroj || 'quiz',
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, saved: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', service: 'LeadsGAS' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function testSaveLead() {
  const fake = { postData: { contents: JSON.stringify({
    email: 'test@test.cz', jmeno: 'Test', pohlavi: 'muz',
    vek_skutecny: 65, vek_pocitovy: 55,
    pohyb: 3, nalada: 4, spojeni: 2, spanek: 3, motivace: 4,
    zalib: 'A,B', text: 'terminal test', total: 19, zdroj: 'test'
  })}};
  const result = doPost(fake);
  Logger.log(result.getContent());
}
