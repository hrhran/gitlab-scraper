const db = require('../db');
const chromeCookiesSecure = require('chrome-cookies-secure');

const COOKIE_KEY = 'gitlab_cookie';

function getCookie() {
  const row = db.prepare(`SELECT value FROM settings WHERE key=?`).get(COOKIE_KEY);
  if (!row) return null;
  try {
    return JSON.parse(row.value);
  } catch {
    return null;
  }
}

function saveCookie(cookieObj) {
  const cookieJSON = JSON.stringify(cookieObj);
  db.prepare(`
    INSERT INTO settings (key, value)
    VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value=excluded.value
  `).run(COOKIE_KEY, cookieJSON);
}

async function fetchCookieFromChrome() {
  return new Promise((resolve, reject) => {
    // The domain must match your GitLab domain, e.g. 'gitlab.com'
    chromeCookiesSecure.getCookies('https://gitlab.com', 'chrome', (err, cookies) => {
      if (err) {
        return reject(err);
      }
      if (!cookies) {
        return reject(new Error('No cookies found for GitLab in Chrome.'));
      }
      saveCookie(cookies);
      resolve(cookies);
    });
  });
}

module.exports = {
  getCookie,
  saveCookie,
  fetchCookieFromChrome,
};
