// Žiju60plus – Admin monitoring
// Spouštěj každých 30 minut pomocí GAS Time Trigger
// Nastavení: Spouštěče → Přidat spouštěč → runMonitor → Časovač → Každých 30 minut

const HEALTH_URL = 'https://ziju60plus.cz/api/health'; // bez ?alert=1 → email jen při chybě

function runMonitor() {
  try {
    const res = UrlFetchApp.fetch(HEALTH_URL, {
      method: 'GET',
      muteHttpExceptions: true,
      followRedirects: true,
    });
    const code = res.getResponseCode();
    const body = JSON.parse(res.getContentText());

    if (code !== 200 || !body.ok) {
      Logger.log('⚠️ Monitoring: problém detekován – email odeslán');
    } else {
      Logger.log('✅ Monitoring OK: ' + body.checked_at);
    }
  } catch (e) {
    // Pokud selže i samotný health endpoint – pošli nouzový email
    GmailApp.sendEmail(
      'ziju60plus@gmail.com',
      '🚨 Žiju60plus – health endpoint nedostupný',
      'Health endpoint ' + HEALTH_URL + ' selhal s chybou: ' + e.message +
      '\n\nČas: ' + new Date().toLocaleString('cs-CZ')
    );
    Logger.log('❌ Health endpoint nedostupný: ' + e.message);
  }
}

// Spusť jednou ručně pro ověření
function testMonitor() {
  runMonitor();
}
