/** @fileoverview Keyboard navigation handler */

import { KEYS } from './constants.js';

/**
 * Create keyboard navigation handler
 * @param {Object} options - Handler options
 * @param {Function} options.getTabs - Function to get current tabs array
 * @param {Function} options.onTabChange - Callback when tab should change
 * @param {Function} options.onClose - Callback to close popup
 * @param {Function} [options.onSelectAll] - Ctrl/Cmd+A: select all visible tabs
 * @param {Function} [options.onEscape] - Escape: return true if it was handled
 *   (e.g. selection mode exited) so the popup isn't closed
 * @returns {Function} Keyboard event handler
 */
export function createKeyboardNavigator({ getTabs, onTabChange, onClose, onSelectAll, onEscape }) {
  return function handleKeyboard(e) {
    if (e.defaultPrevented || e.isComposing) return;

    // Never hijack keys while the user is typing (e.g. Home/End/arrows in the
    // search box used to switch the browser to the first/pinned tab, and
    // Ctrl+A there must select the text, not every tab).
    const target = e.target;
    const typing = target instanceof HTMLElement &&
      (target.isContentEditable || target.closest('input, textarea, select'));

    if (e.key === KEYS.ESCAPE) {
      if (onEscape?.()) e.preventDefault();
      return;
    }
    if (typing) return;

    if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'a') {
      if (onSelectAll) {
        e.preventDefault();
        onSelectAll();
      }
      return;
    }

    // Leave other modified shortcuts (Cmd/Ctrl/Alt + key) to the browser
    if (e.altKey || e.ctrlKey || e.metaKey) return;

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
