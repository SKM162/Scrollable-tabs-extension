/** @fileoverview Feedback / bug report page.
 *
 * Builds a GitHub "new issue" link pre-filled with the user's report and opens
 * it. The user reviews and submits the issue on GitHub with their own account.
 *
 * Deliberately NOT done: creating the issue through the GitHub API from the
 * extension. That would require shipping a GitHub token inside the extension
 * package, where anyone could extract it and use it to spam or modify the repo.
 */

import { DEFAULT_SETTINGS } from '../modules/constants.js';
import { loadSettings } from '../utils/storage.js';
import { getErrorLog, scrub } from '../utils/errorLog.js';

const REPO_ISSUES_URL = 'https://github.com/SKM162/Scrollable-tabs-extension/issues/new';
// GitHub rejects very long URLs (HTTP 414) at roughly 8k characters
const MAX_URL_LENGTH = 7500;
const DRAFT_KEY = 'feedbackDraft';
const LABELS = { bug: 'bug', feature: 'enhancement', question: 'question' };
const TITLE_PREFIX = { bug: '[Bug] ', feature: '[Feature] ', question: '' };
// Only these settings are reported (values are booleans/numbers/enums)
const REPORTED_SETTINGS = ['popupWidth', 'showTitles', 'showIndices', 'autoCenter', 'keyboardNav', 'scrollSpeed', 'theme'];

const $ = (id) => document.getElementById(id);
const fields = ['type', 'title', 'description', 'steps', 'expected'];

let diagnostics = '';
let errorLines = [];

function applyTheme(theme) {
  const effective = theme === 'auto' || !theme
    ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme;
  document.documentElement.setAttribute('data-theme', effective);
}

async function collectDiagnostics(settings) {
  const manifest = chrome.runtime.getManifest();
  const brands = navigator.userAgentData?.brands
    ?.filter(b => !/not.?a.?brand/i.test(b.brand))
    .map(b => `${b.brand} ${b.version}`).join(', ');
  const platform = navigator.userAgentData?.platform || navigator.platform || 'unknown';

  let counts = 'unavailable';
  try {
    const [tabs, windows] = await Promise.all([
      chrome.tabs.query({}),
      chrome.windows.getAll()
    ]);
    const groups = new Set(tabs.map(t => t.groupId).filter(id => id >= 0));
    counts = `${tabs.length} tabs (${tabs.filter(t => t.pinned).length} pinned, ` +
      `${tabs.filter(t => t.discarded).length} discarded), ${groups.size} groups, ${windows.length} windows`;
  } catch { /* ignore */ }

  const shownSettings = REPORTED_SETTINGS
    .map(k => `${k}=${JSON.stringify(settings[k])}`)
    .join(', ');

  return [
    `- Extension version: ${manifest.version}`,
    `- Browser: ${brands || scrub(navigator.userAgent)}`,
    `- Platform: ${platform}`,
    `- Tabs: ${counts}`,
    `- Settings: ${shownSettings}`
  ].join('\n');
}

function values() {
  return Object.fromEntries(fields.map(f => [f, $(f).value]));
}

/** Build title + markdown body; shorten the optional parts if the URL would be too long */
function buildIssue() {
  const v = values();
  const type = v.type;
  const title = (TITLE_PREFIX[type] + v.title.replace(/\s+/g, ' ').trim()).slice(0, 140);

  const sections = [];
  sections.push(`### ${type === 'bug' ? 'What happened' : 'Description'}\n${v.description.trim() || '_No description_'}`);
  if (type === 'bug') {
    if (v.steps.trim()) sections.push(`### Steps to reproduce\n${v.steps.trim()}`);
    if (v.expected.trim()) sections.push(`### Expected behaviour\n${v.expected.trim()}`);
  }

  const optional = [];
  if ($('includeDiagnostics').checked && diagnostics) {
    optional.push(`### Environment\n${diagnostics}`);
  }
  if ($('includeErrors').checked && errorLines.length) {
    optional.push(`### Recent errors\n\`\`\`\n${errorLines.join('\n')}\n\`\`\``);
  }
  const footer = '\n\n---\n_Sent from the Scrollable Tabs feedback form_';

  const make = (opt) => [...sections, ...opt].join('\n\n') + footer;
  let body = make(optional);
  let truncated = false;

  // Drop error lines, then diagnostics, then cut the free text, until it fits
  let errs = [...errorLines];
  while (buildUrl(title, body, type).length > MAX_URL_LENGTH) {
    truncated = true;
    if ($('includeErrors').checked && errs.length > 1) {
      errs = errs.slice(Math.ceil(errs.length / 2));
      optional[optional.length - 1] = `### Recent errors (latest only)\n\`\`\`\n${errs.join('\n')}\n\`\`\``;
      body = make(optional);
    } else if (optional.length) {
      optional.pop();
      body = make(optional);
    } else {
      body = body.slice(0, Math.floor(body.length * 0.8)) + '\n\n_[truncated]_' + footer;
    }
  }
  return { title, body, type, truncated };
}

function buildUrl(title, body, type) {
  const url = new URL(REPO_ISSUES_URL);
  url.searchParams.set('title', title);
  url.searchParams.set('body', body);
  if (LABELS[type]) url.searchParams.set('labels', LABELS[type]);
  return url.toString();
}

function render() {
  document.body.className = `type-${$('type').value}`;
  $('descriptionLabel').firstChild.textContent =
    $('type').value === 'bug' ? 'What happened? ' : 'Description ';
  const { title, body, truncated } = buildIssue();
  $('preview').textContent = `${title || '(no title)'}\n\n${body}`;
  $('truncatedNote').hidden = !truncated;
}

function validate() {
  let ok = true;
  for (const id of ['title', 'description']) {
    const el = $(id);
    const bad = !el.value.trim();
    el.classList.toggle('invalid', bad);
    if (bad && ok) el.focus();
    ok = ok && !bad;
  }
  return ok;
}

let saveTimer = null;
function saveDraft() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    chrome.storage.local.set({ [DRAFT_KEY]: values() }).catch(() => {});
  }, 300);
}

async function init() {
  const settings = await loadSettings(DEFAULT_SETTINGS);
  applyTheme(settings.theme);

  const params = new URLSearchParams(location.search);
  if (params.get('type') && LABELS[params.get('type')]) $('type').value = params.get('type');

  try {
    const { [DRAFT_KEY]: draft } = await chrome.storage.local.get(DRAFT_KEY);
    if (draft) fields.forEach(f => { if (typeof draft[f] === 'string') $(f).value = draft[f]; });
  } catch { /* ignore */ }

  diagnostics = await collectDiagnostics(settings);
  const log = await getErrorLog();
  errorLines = log.slice(-10).map(e => `${e.t} [${e.src}] ${scrub(e.msg)}`);
  $('errorCount').textContent = errorLines.length ? `(${errorLines.length})` : '(none recorded)';
  $('includeErrors').disabled = errorLines.length === 0;

  document.querySelectorAll('input, textarea, select').forEach(el => {
    el.addEventListener('input', () => {
      el.classList.remove('invalid');
      render();
      saveDraft();
    });
    el.addEventListener('change', render);
  });

  $('feedbackForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const { title, body, type } = buildIssue();
    await chrome.tabs.create({ url: buildUrl(title, body, type) });
    await chrome.storage.local.remove(DRAFT_KEY).catch(() => {});
  });

  render();
  $('title').focus();
}

document.addEventListener('DOMContentLoaded', init);
