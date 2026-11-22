/** @fileoverview Keyboard navigation handler */

import { KEYS } from './constants.js';

/**
 * Create the popup's keyboard handler.
 *
 * Escape, Ctrl/Cmd+A, Delete and type-to-search always work; only the
 * tab-switching keys (arrows, Home, End, Enter) depend on the "Keyboard
 * Navigation" setting. (Previously no handler was installed at all when that
 * setting was off, so Escape could not leave selection mode either.)
 *
 * @param {Object} options - Handler options
 * @param {Function} options.getTabs - Tabs to navigate, in display order (the
 *   visible ones, so arrows don't walk into filtered-out tabs)
 * @param {boolean} [options.navEnabled=true] - Arrow/Home/End/Enter navigation
 * @param {Function} options.onTabChange - Callback when tab should change
 * @param {Function} options.onClose - Callback to close popup
 * @param {Function} [options.onSelectAll] - Ctrl/Cmd+A: select all visible tabs
 * @param {Function} [options.onEscape] - Escape: return true if it was handled
 *   (e.g. selection mode exited) so the popup isn't closed
 * @param {Function} [options.onDelete] - Delete (not Backspace, not auto-repeat): return true if handled
 * @param {Function} [options.onTypeToSearch] - Called with a printable key typed
 *   outside a text field, to start a search
 * @returns {Function} Keyboard event handler
 */
export function createKeyboardNavigator({
  getTabs, navEnabled = true, onTabChange, onClose,
  onSelectAll, onEscape, onDelete, onTypeToSearch
}) {
  return function handleKeyboard(e) {
    if (e.defaultPrevented || e.isComposing) return;

    // Never hijack keys while the user is typing (e.g. Home/End/arrows in the
    // search box used to switch the browser to the first/pinned tab, and
    // Ctrl+A there must select the text, not every tab).
    const target = e.target;
    const typing = target instanceof HTMLElement &&
      (target.isContentEditable || target.closest('input, textarea, select'));

    if (e.key === KEYS.ESCAPE) {
      if (onEscape?.(e)) {
        e.preventDefault();
        e.stopPropagation();
      }
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

    // Only Delete closes selected tabs. Backspace is too easy to press out of
    // habit (e.g. to edit the search after Esc left the search box), and a held
    // key's auto-repeat must not click through the "confirm close" step.
    if (e.key === KEYS.DELETE) {
      if (e.repeat) {
        e.preventDefault();
        return;
      }
      if (onDelete?.()) {
        e.preventDefault();
        return;
      }
    }

    // A printable character starts a search (buttons keep Space for clicking)
    if (onTypeToSearch && e.key.length === 1 && e.key !== ' ') {
      e.preventDefault();
      onTypeToSearch(e.key);
      return;
    }

    if (!navEnabled) return;

    // Buttons (header icons, menu items) keep Enter for activating themselves
    if (e.key === KEYS.ENTER && target instanceof HTMLElement && target.closest('button, a')) return;

    const tabs = getTabs();
    if (tabs.length === 0) return;
    const currentIndex = tabs.findIndex(t => t.active);

    let newIndex;
    switch (e.key) {
      case KEYS.ARROW_LEFT:
        // Active tab hidden by a filter: start from the last visible one
        newIndex = currentIndex === -1 ? tabs.length - 1 : Math.max(0, currentIndex - 1);
        break;
      case KEYS.ARROW_RIGHT:
        newIndex = currentIndex === -1 ? 0 : Math.min(tabs.length - 1, currentIndex + 1);
        break;
      case KEYS.HOME:
        newIndex = 0;
        break;
      case KEYS.END:
        newIndex = tabs.length - 1;
        break;
      case KEYS.ENTER:
        e.preventDefault();
        onClose();
        return;
      default:
        return;
    }

    e.preventDefault();
    if (newIndex !== currentIndex) {
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
