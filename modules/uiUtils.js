/** @fileoverview UI utilities and color helpers */

import { CHROME_GROUP_COLORS, CLASSES, MESSAGE_DURATION } from './constants.js';

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
 * Show a temporary message toast
 * @param {string} text - Message text
 * @param {string} type - Message type ('success' or 'error')
 */
export function showMessage(text, type) {
  // Remove existing message
  const existing = document.querySelector(`.${CLASSES.MESSAGE}`);
  if (existing) existing.remove();
  
  // Create message
  const message = createElement('div', {
    className: `${CLASSES.MESSAGE} ${type}`,
    textContent: text,
    style: {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px 20px',
      background: type === CLASSES.SUCCESS ? '#4caf50' : '#f44336',
      color: 'white',
      borderRadius: '4px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      zIndex: '1000',
      animation: 'slideIn 0.3s ease'
    }
  });
  
  document.body.appendChild(message);
  
  // Remove after duration
  setTimeout(() => {
    message.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => message.remove(), 300);
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
 * Cache-bust a favicon URL
 * @param {string} faviconUrl - Original favicon URL
 * @param {number} tabId - Tab ID for cache key
 * @returns {string} Cache-busted URL
 */
export function cacheBustFavicon(faviconUrl, tabId) {
  const sep = faviconUrl.includes('?') ? '&' : '?';
  return `${faviconUrl}${sep}t=${tabId}-${Date.now()}`;
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
