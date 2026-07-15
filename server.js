const http = require('http');
const path = require('path');
const fs = require('fs');
const { Client } = require('pg');

const PASSWORD = 'R0978012009';
const TIMEOUT_MS = 30000;

const TWILIO_SID = process.env.TWILIO_SID;
const TWILIO_TOKEN = process.env.TWILIO_TOKEN;
const TWILIO_FROM = process.env.TWILIO_FROM;
const MY_PHONE = process.env.MY_PHONE;

function sendSMS(message) {
  if (!TWILIO_SID || !TWILIO_TOKEN || !TWILIO_FROM || !MY_PHONE) return;
  const auth = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64');
  const body = `To=${encodeURIComponent(MY_PHONE)}&From=${encodeURIComponent(TWILIO_FROM)}&Body=${encodeURIComponent(message)}`;
  const options = {
    hostname: 'api.twilio.com',
    path: `/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(body)
    }
  };
  const https = require('https');
  const req = https.request(options, r => {
    let data = '';
    r.on('data', d => data += d);
    r.on('end', () => console.log('SMS sent:', r.statusCode));
  });
  req.on('error', e => console.error('SMS error:', e));
  req.write(body);
  req.end();
}

let tabs = {};

// PWA support: icons served directly from this file (base64-embedded,
// avoids uploading separate binary image files).
const ICON_192_B64 = "iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAMAAABlApw1AAAA/1BMVEU3FAFEGgKORwRzNwNWJQOpWAW5YgVjLQMCAAD+/v7FagWcUQUnDQDRcgWAPgOnmZFwWEzt6ec7IxLOxsJXQjnRspTKuq3j2tJUNSWMenGvo5xlRzi0qaKnai2uekfPwrjs49pcMQuVgXadko22g1DDmnLd2NRFLSJ6aGCeYifNrIw9KSNfTkdgOCBtTUCcXyWaj4urcTu+lnC7tLDhzbnl0b0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACMiIa6AAAAQHRSTlP///////////////////////////////////////////////////////////////////////8AAAAAAAAAAAAAAxeF4wAACXxJREFUeNrlnemaojoQhisQBSSC2m3by/Ts69nX+7+1E0CQJUtlE3lO2c/8mBn1e+urSkKABjJF/Hv88vn1dWUS+TkiaRSxKJImaD8Ipb++7J7Kd3uFRpD9w/vj53XzjfnKAkEOEKEBKKkCgHzYlSdDgOPbSgIXsjIPnQcqCygVIBDCGNk97/EAP7026nM7gpUNgdyCluGx3OMAjnmn3kp+h+DBgh4BAUZLBMDpz0p+5KZf44GVBTXCy50O4AuX39XPahWIAG0BGQWDj0qA92+L88jjqN+miBIMAWG/neQA/+R1+t3zr/PAAYAw+k4G8NB+vg/91gQ6AD4xvBEDHPH6122s1pZV5ADAe7kUASDzv76o7ygsCAr7GqoInqcA7wb6c13qcQhyApcaqqroYQzwPtIbsFaERwsQDvDX1xHA6wBgZQywDmWB2ADCXoYAXwqt/rUupARiAHsLoCb42Ac4aQtojQlnC9ADaRV3PQBtAa3XLgQhANoiqgGOhRcDhARGFiS4JoCG4LkDyM31b+pwKiKHJmiCtgA/FeoKEmrvQocQAKC1oDwD/NB0gEr+FAHfBa5dDI8NwIOBARtx2AEUjgCEvakB3mpaWK/fksAVANiuAthHaAM2GwyBC0BsMAxVHuw5wFFdQTj9SoJgAFUbQ/ZZXUFI/X0C7Djk7gCvIch+R1bQZuNE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";
const ICON_512_B64 = "iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAMAAADDpiTIAAAA/1BMVEU/KyF2Uz5+cGihjIHJpH/j0L43FAFEGgKORwRzNwNWJQOpWAW5YwVjLQMAAAD+/v7FagWcUQQnDgDRcgWAPwTu6udRNihuV0qllo7GurLUw7XQysaMem/k2c+kaC06IhaaioG3q6XZ09DKqId5ZVplRza2hVVYQziVhHrFnHKdk429s65ZMBN8QAODbWGveUVgPSp5aWGEZ1gfEABBLSKvopru5NlcTENpT0GdXiOeYiiucDK9k2vTtJa4jGLizbgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA5amjnAAAAQHRSTlP/////////////////////////////////////////////////////////////////////////////////////73leyQAAIaZJREFUeNrtnQl32ziyhfk2kIREU1Io73YSZ+8tvUz3TG8z//9fPVGSZVLcsFQVCiDg49Nnek7Hjurer24VKSop4c/24fbdly8fP37983GxXi/WC8qz+3mdk9VfAKfK8io3OkX9dXakwkll+t2PH/7r6uf7z9dv77YIxUpA/7T//P3l45/tCizoz7rnZCCnMqz/XgMmAqg10Djyw8+ff73Z8hTA7Zc/Oy/7wkX9+ygAw4DKQgFmBNgzoHM+3MOJIAEq/uPuFe7W393hx4DCEAFp/4ESAYAAbr7uXtze+nNSAAMGnNffTgG7c/WtewH85+P+Ze1ruwu3pycNZk4VABECzo/8+dalAB6+LA4vS9f/C9f1H0gCbicBsBTQON99fnIjgO27x+cXhZ37MZNAxQoB+/Pj9ZZeAH+fyt/x/4JL/bsUsGfAvgdUQAQoAAhwwMA1sQDeNV5Itv7vD4PuEGDcA1SO/J8tmQC2X5ovI2P/IzKAnwJSeb+lEcD/tl5C1vbvDwIBpoDj+UwggNvH1ovB3P99ErBlQFVPApzmgMa5vEUWwPZj+8Vgb3+cIECNgFT9/LzFFMC7s5fOC/+jMAAoBcDNAS9R4BpNAP/3mHnpf3gGVOaTADYB6rXALYoAzunvkf8RGAC3C0BQgE4fUBbAb4+Zv/7vYYCjFGB4TVBTAOmPT9AC+Hs9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";

// SCHEMA SEPARATION: this app uses its own Postgres "schema" (pool3) so
// its tables (totals, cashouts) never collide with the login-pool
// projects' tables, even though they share the same DATABASE_URL.
const db = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    options: '-c search_path=pool3'
});

async function initDB() {
  await db.connect();
  // Create this app's dedicated schema if it doesn't exist yet. Every
  // CREATE TABLE below lands inside pool3 automatically because of the
  // search_path set in the Client config above.
  await db.query(`CREATE SCHEMA IF NOT EXISTS pool3;`);
  await db.query(`
    CREATE TABLE IF NOT EXISTS totals (
      site TEXT PRIMARY KEY,
      today NUMERIC DEFAULT 0,
      this_week NUMERIC DEFAULT 0,
      last_week NUMERIC DEFAULT 0,
      this_month NUMERIC DEFAULT 0,
      last_month NUMERIC DEFAULT 0,
      last_day_date TEXT DEFAULT '',
      last_week_date TEXT DEFAULT '',
      last_month_str TEXT DEFAULT ''
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS cashouts (
      id SERIAL PRIMARY KEY,
      tab_id TEXT,
      amount NUMERIC,
      timestamp BIGINT,
      site TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await db.query(`INSERT INTO totals (site) VALUES ('mwos') ON CONFLICT DO NOTHING`);
  await db.query(`INSERT INTO totals (site) VALUES ('bolabet') ON CONFLICT DO NOTHING`);
  console.log('Database ready!');
}

function getSite(site) {
  return site === 'bolabet' ? 'bolabet' : 'mwos';
}

function getZambiaDateParts() {
  const now = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  const dayOfWeek = now.getUTCDay();
  const dateStr = `${yyyy}-${mm}-${dd}`;
  const monthStr = `${yyyy}-${now.getUTCMonth()}`;
  return { dateStr, monthStr, dayOfWeek, now };
}

async function checkReset(site) {
  const { dateStr, monthStr, dayOfWeek } = getZambiaDateParts();

  const res = await db.query('SELECT * FROM totals WHERE site = $1', [site]);
  const row = res.rows[0];
  let updates = {};

  if (row.last_day_date !== '' && row.last_day_date !== dateStr) {
    updates.this_week = parseFloat(row.this_week) + parseFloat(row.today);
    updates.this_month = parseFloat(row.this_month) + parseFloat(row.today);
    updates.today = 0;
    console.log(`[${site}] Daily reset. today (${row.today}) -> this_week/this_month`);
  }
  if (row.last_day_date !== dateStr) updates.last_day_date = dateStr;

  if (dayOfWeek !== undefined && monthStr !== row.last_month_str && row.last_month_str !== '') {
    const currentThisMonth = updates.this_month !== undefined ? updates.this_month : parseFloat(row.this_month);
    updates.last_month = currentThisMonth;
    updates.this_month = 0;
    updates.last_month_str = monthStr;
    console.log(`[${site}] Monthly reset. this_month -> last_month`);
  }
  if (row.last_month_str === '') updates.last_month_str = monthStr;

  if (dayOfWeek === 0 && row.last_week_date !== dateStr) {
    const currentThisWeek = updates.this_week !== undefined ? updates.this_week : parseFloat(row.this_week);
    updates.last_week = currentThisWeek;
    updates.this_week = 0;
    updates.last_week_date = dateStr;
    console.log(`[${site}] Weekly reset. this_week -> last_week`);
  }

  if (Object.keys(updates).length > 0) {
    const cols = Object.keys(updates).map((k, i) => `${k} = $${i + 2}`).join(', ');
    const vals = Object.values(updates);
    await db.query(`UPDATE totals SET ${cols} WHERE site = $1`, [site, ...vals]);
  }
}

async function getTotals() {
  const res = await db.query('SELECT * FROM totals');
  const result = {};
  res.rows.forEach(row => {
    result[row.site] = {
      today: parseFloat(row.today),
      thisWeek: parseFloat(row.this_week),
      lastWeek: parseFloat(row.last_week),
      thisMonth: parseFloat(row.this_month),
      lastMonth: parseFloat(row.last_month)
    };
  });
  return result;
}

async function getCashouts() {
  const regular = await db.query(
    `SELECT * FROM cashouts WHERE tab_id NOT LIKE 'ID:%' ORDER BY id ASC`
  );
  const alerts = await db.query(
    `SELECT * FROM cashouts WHERE tab_id LIKE 'ID:%' ORDER BY id ASC`
  );
  const allRows = [...regular.rows, ...alerts.rows];
  return allRows.map(r => ({
    tabId: r.tab_id,
    amount: parseFloat(r.amount),
    timestamp: parseInt(r.timestamp),
    site: r.site
  }));
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  if (req.method === 'GET' && req.url === '/') {
    const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
    return;
  }

  if (req.method === 'POST' && req.url === '/login') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      try {
        const { password } = JSON.parse(body);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: password === PASSWORD }));
      } catch(e) { res.writeHead(400); res.end(); }
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/heartbeat') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const { tabId, site } = JSON.parse(body);
        const s = getSite(site);
        if (!tabs[tabId]) tabs[tabId] = { count: 0, total: 0, site: s };
        tabs[tabId].lastSeen = Date.now();
        tabs[tabId].site = s;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch(e) { res.writeHead(400); res.end(); }
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/cashout') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const { tabId, amount, timestamp, site } = data;
        const s = getSite(site);
        await checkReset(s);
        await db.query('UPDATE totals SET today = today + $1 WHERE site = $2', [amount, s]);
        await db.query('INSERT INTO cashouts (tab_id, amount, timestamp, site) VALUES ($1, $2, $3, $4)', [tabId, amount, timestamp, s]);
        if (!tabs[tabId]) tabs[tabId] = { count: 0, total: 0, lastSeen: Date.now(), site: s };
        tabs[tabId].lastSeen = Date.now();
        tabs[tabId].count++;
        tabs[tabId].total += amount;
        tabs[tabId].site = s;

        const todayRes = await db.query('SELECT today FROM totals WHERE site = $1', [s]);
        const todayTotal = parseFloat(todayRes.rows[0].today);

        const siteName = s === 'bolabet' ? 'BOLABET' : 'MWOS';
        const smsAmt = data.smsAmount || amount;
        sendSMS(`${siteName} CASHOUT\n+${amount} ZMW\nBalance: ${smsAmt} ZMW\nToday: ${todayTotal} ZMW\nTab: ${tabId}`);

        console.log(`[CASHOUT] ${s} | +${amount} ZMW`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch(e) { console.error(e); res.writeHead(500); res.end(); }
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/clear-alerts') {
    try {
      await db.query("DELETE FROM cashouts WHERE tab_id LIKE 'ID:%'");
      console.log('Alert records cleared.');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    } catch (e) {
      console.error(e);
      res.writeHead(500);
      res.end(JSON.stringify({ error: "Failed to clear alerts" }));
    }
    return;
  }

  if (req.method === 'GET' && req.url === '/state') {
    try {
      const now = Date.now();
      Object.keys(tabs).forEach(id => {
        if (now - tabs[id].lastSeen >= TIMEOUT_MS) delete tabs[id];
      });
      await checkReset('mwos');
      await checkReset('bolabet');
      const totals = await getTotals();
      const cashouts = await getCashouts();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ totals, cashouts, tabs }));
    } catch(e) { console.error(e); res.writeHead(500); res.end(); }
    return;
  }


  if (req.method === 'GET' && req.url === '/manifest.json') {
    const manifest = {
      name: "Mwos/Bolabet Withdraw Tracker",
      short_name: "Aviator",
      description: "Withdraw tracker dashboard",
      start_url: "/",
      scope: "/",
      display: "standalone",
      orientation: "portrait",
      background_color: "#0f172a",
      theme_color: "#0f172a",
      icons: [
        { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
        { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
        { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
      ]
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(manifest));
    return;
  }

  if (req.method === 'GET' && req.url === '/sw.js') {
    const sw = `
self.addEventListener('install', () => { self.skipWaiting(); });
self.addEventListener('activate', (event) => { event.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', (event) => { event.respondWith(fetch(event.request)); });
`;
    res.writeHead(200, { 'Content-Type': 'application/javascript' });
    res.end(sw);
    return;
  }

  if (req.method === 'GET' && req.url === '/icons/icon-192.png') {
    res.writeHead(200, { 'Content-Type': 'image/png' });
    res.end(Buffer.from(ICON_192_B64, 'base64'));
    return;
  }

  if (req.method === 'GET' && req.url === '/icons/icon-512.png') {
    res.writeHead(200, { 'Content-Type': 'image/png' });
    res.end(Buffer.from(ICON_512_B64, 'base64'));
    return;
  }

  res.writeHead(404); res.end('Not found');
});

const PORT = process.env.PORT || 8080;
initDB().then(() => {
  server.listen(PORT, () => console.log('Server running on port ' + PORT));
}).catch(err => {
  console.error('DB init failed:', err);
  process.exit(1);
});
