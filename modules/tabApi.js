/** @fileoverview Resilient wrappers around chrome.tabs calls */

/**
 * Chrome rejects tab edits while a tab is being dragged in the tab strip, and
 * briefly around some tab-strip animations, with:
 *   "Tabs cannot be edited right now (user may be dragging a tab)."
 * That error is transient, so these calls are retried with a short backoff
 * instead of failing (which previously left tabs open after "closing" them).
 */
const TRANSIENT_ERROR = /cannot be edited right now|user may be dragging/i;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Run a chrome.tabs/chrome.windows call, retrying while Chrome reports the tab
 * strip as busy.
 * @template T
 * @param {() => Promise<T>} fn
 * @param {{retries?: number, delayMs?: number}} [options]
 * @returns {Promise<T>}
 */
export async function withTabEditRetry(fn, { retries = 20, delayMs = 150 } = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= retries || !TRANSIENT_ERROR.test(err?.message || '')) throw err;
      await sleep(delayMs);
    }
  }
}

/**
 * Close several tabs. One stale/invalid id makes chrome.tabs.remove([...])
 * reject as a whole, so on a non-transient failure each tab is closed
 * individually and the result reports exactly what happened.
 * @param {number[]} tabIds
 * @returns {Promise<{closed: number[], failed: number[]}>}
 */
export async function removeTabs(tabIds) {
  if (tabIds.length === 0) return { closed: [], failed: [] };
  try {
    await withTabEditRetry(() => chrome.tabs.remove(tabIds));
    return { closed: [...tabIds], failed: [] };
  } catch (err) {
    console.warn('Batch close failed, closing tabs one by one:', err);
  }

  const results = await Promise.allSettled(
    tabIds.map(id => withTabEditRetry(() => chrome.tabs.remove(id)))
  );
  const closed = [];
  const failed = [];
  results.forEach((r, i) => (r.status === 'fulfilled' ? closed : failed).push(tabIds[i]));
  return { closed, failed };
}
