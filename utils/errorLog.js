/** @fileoverview Small local error log used to pre-fill bug reports.
 *
 * Keeps the last few errors in chrome.storage.local (never sent anywhere by
 * itself). URLs are scrubbed so a report can't leak which sites were open.
 */

const KEY = 'errorLog';
const MAX_ENTRIES = 20;
const MAX_LENGTH = 400;

/** Remove URLs and trim long messages */
export function scrub(text) {
  return String(text ?? '')
    .replace(/\b[a-z][a-z0-9+.-]*:\/\/[^\s'")]+/gi, '<url>')
    .slice(0, MAX_LENGTH);
}

let queue = Promise.resolve();

/**
 * Append an entry (serialised so concurrent writes don't overwrite each other)
 * @param {string} source - e.g. 'popup'
 * @param {*} message
 */
export function logError(source, message) {
  queue = queue.then(async () => {
    try {
      const { [KEY]: log = [] } = await chrome.storage.local.get(KEY);
      log.push({ t: new Date().toISOString(), src: source, msg: scrub(message) });
      await chrome.storage.local.set({ [KEY]: log.slice(-MAX_ENTRIES) });
    } catch {
      // Logging must never break the page
    }
  });
  return queue;
}

/** @returns {Promise<Array<{t: string, src: string, msg: string}>>} */
export async function getErrorLog() {
  try {
    const { [KEY]: log = [] } = await chrome.storage.local.get(KEY);
    return log;
  } catch {
    return [];
  }
}

export async function clearErrorLog() {
  try { await chrome.storage.local.remove(KEY); } catch { /* ignore */ }
}

const describe = (value) => {
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  if (typeof value === 'string') return value;
  try { return JSON.stringify(value); } catch { return String(value); }
};

/**
 * Record uncaught errors, unhandled rejections and console.error calls.
 * @param {string} source
 */
export function installErrorLog(source) {
  window.addEventListener('error', (e) => logError(source, describe(e.error || e.message)));
  window.addEventListener('unhandledrejection', (e) => logError(source, `Unhandled rejection: ${describe(e.reason)}`));
  const original = console.error.bind(console);
  console.error = (...args) => {
    original(...args);
    logError(source, args.map(describe).join(' '));
  };
}
