/** @fileoverview UI utilities and color helpers */

import { CHROME_GROUP_COLORS, CLASSES, MESSAGE_DURATION, ICONS } from './constants.js';

/**
 * Set icon on an element from ICONS constant
 * @param {HTMLElement} element - Target element (usually a button)
 * @param {string} iconName - Name of the icon in ICONS object
 */
export function setIcon(element, iconName) {
  if (element && ICONS[iconName]) {
    element.innerHTML = ICONS[iconName];
  }
}

/**
 * Convert hex color to RGB object
 * @param {string} hex - Hex color string
 * @returns {{r: number, g: number, b: number}|null} RGB object or null if invalid
 */
export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Resolve Chrome group color (named string or hex) to RGB and hex
 * @param {string} color - Color name or hex value
 * @returns {{rgb: {r: number, g: number, b: number}, hex: string}|null} Color object or null
 */
export function resolveGroupColor(color) {
  if (!color) return null;
  const hex = CHROME_GROUP_COLORS[color] || (color.startsWith('#') ? color : null);
  if (!hex) return null;
  const rgb = hexToRgb(hex);
  return rgb ? { rgb, hex } : null;
}

/**
 * Create a DOM element with specified attributes
 * @param {string} tag - HTML tag name
 * @param {Object} options - Element options
 * @param {string} [options.className] - CSS class name(s)
 * @param {string} [options.textContent] - Text content
 * @param {string} [options.innerHTML] - Inner HTML
 * @param {Object} [options.dataset] - Data attributes
 * @param {Object} [options.style] - Inline styles
 * @param {Object} [options.attributes] - Other attributes
 * @returns {HTMLElement} Created element
 */
export function createElement(tag, options = {}) {
  const element = document.createElement(tag);
  
  if (options.className) element.className = options.className;
  if (options.textContent !== undefined) element.textContent = options.textContent;
  if (options.innerHTML !== undefined) element.innerHTML = options.innerHTML;
  if (options.title) element.title = options.title;
  
  if (options.dataset) {
    Object.entries(options.dataset).forEach(([key, value]) => {
      element.dataset[key] = value;
    });
  }
  
  if (options.style) {
    Object.entries(options.style).forEach(([key, value]) => {
      element.style[key] = value;
    });
  }
  
  if (options.attributes) {
    Object.entries(options.attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  }
  
  return element;
}

/**
 * Show a temporary message toast.
 *
 * Styled by .message in popup.css (theme-aware, centred above the info bar).
 * It used to be pinned top-right with inline colours, covering the header
 * buttons, and referenced slideIn/slideOut animations that were never defined.
 * @param {string} text - Message text
 * @param {'success'|'error'|'info'} [type='info'] - Message type
 */
let messageTimer = null;
export function showMessage(text, type = 'info') {
  document.querySelector(`.${CLASSES.MESSAGE}`)?.remove();
  clearTimeout(messageTimer);

  const message = createElement('div', {
    className: `${CLASSES.MESSAGE} ${type}`,
    textContent: text,
    attributes: { role: type === CLASSES.ERROR ? 'alert' : 'status' }
  });
  document.body.appendChild(message);

  messageTimer = setTimeout(() => {
    message.classList.add('leaving');
    setTimeout(() => message.remove(), 200);
  }, MESSAGE_DURATION);
}

/**
 * Get hostname from URL
 * @param {string} url - URL string
 * @returns {string} Hostname or empty string
 */
export function getHostname(url) {
  try {
    return url ? new URL(url).hostname : '';
  } catch {
    return '';
  }
}

/**
 * Query DOM element with selector
 * @param {string} selector - CSS selector
 * @param {ParentNode} [parent=document] - Parent element
 * @returns {HTMLElement|null}
 */
export function $(selector, parent = document) {
  return parent.querySelector(selector);
}

/**
 * Query all DOM elements with selector
 * @param {string} selector - CSS selector
 * @param {ParentNode} [parent=document] - Parent element
 * @returns {NodeListOf<HTMLElement>}
 */
export function $$(selector, parent = document) {
  return parent.querySelectorAll(selector);
}
