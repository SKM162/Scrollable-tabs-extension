/** @fileoverview Keyboard navigation handler */

import { KEYS } from './constants.js';

/**
 * Create keyboard navigation handler
 * @param {Object} options - Handler options
 * @param {Function} options.getTabs - Function to get current tabs array
 * @param {Function} options.onTabChange - Callback when tab should change
 * @param {Function} options.onClose - Callback to close popup
 * @returns {Function} Keyboard event handler
 */
export function createKeyboardNavigator({ getTabs, onTabChange, onClose }) {
  return function handleKeyboard(e) {
    const tabs = getTabs();
    const currentIndex = tabs.findIndex(t => t.active);
    if (currentIndex === -1) return;

    let newIndex = currentIndex;
    let handled = false;

    switch (e.key) {
      case KEYS.ARROW_LEFT:
        e.preventDefault();
        newIndex = Math.max(0, currentIndex - 1);
        handled = true;
        break;
      case KEYS.ARROW_RIGHT:
        e.preventDefault();
        newIndex = Math.min(tabs.length - 1, currentIndex + 1);
        handled = true;
        break;
      case KEYS.HOME:
        e.preventDefault();
        newIndex = 0;
        handled = true;
        break;
      case KEYS.END:
        e.preventDefault();
        newIndex = tabs.length - 1;
        handled = true;
        break;
      case KEYS.ENTER:
        e.preventDefault();
        onClose();
        return;
    }

    if (handled && newIndex !== currentIndex) {
      onTabChange(tabs[newIndex].id);
    }
  };
}

/**
 * Enable keyboard navigation
 * @param {Function} handler - Keyboard event handler
 * @returns {Function} Cleanup function to remove listener
 */
export function enableKeyboardNavigation(handler) {
  document.addEventListener('keydown', handler);
  return () => document.removeEventListener('keydown', handler);
}
