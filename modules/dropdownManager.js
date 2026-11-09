/** @fileoverview Dropdown menu management */

import { CLASSES, DROPDOWN_ACTIONS, ICONS } from './constants.js';
import { createElement, $, $$ } from './uiUtils.js';
import { withTabEditRetry } from './tabApi.js';

/**
 * Create dropdown menu element for a tab
 * @param {chrome.tabs.Tab} tab - Tab object
 * @param {Function} onAction - Action handler callback
 * @returns {HTMLElement} Dropdown menu element
 */
export function createDropdownMenu(tab, onAction) {
  const menu = createElement('div', {
    className: CLASSES.TAB_DROPDOWN_MENU
  });

  const items = [
    {
      action: DROPDOWN_ACTIONS.PIN,
      icon: tab.pinned ? ICONS.UNPIN : ICONS.PIN,
      label: tab.pinned ? 'Unpin' : 'Pin',
      title: tab.pinned ? 'Unpin tab' : 'Pin tab'
    },
    {
      action: DROPDOWN_ACTIONS.MUTE,
      icon: tab.mutedInfo?.muted ? ICONS.UNMUTE : ICONS.MUTE,
      label: tab.mutedInfo?.muted ? 'Unmute' : 'Mute',
      title: tab.mutedInfo?.muted ? 'Unmute tab' : 'Mute tab'
    },
    { divider: true },
    {
      action: DROPDOWN_ACTIONS.RELOAD,
      icon: ICONS.RELOAD_TAB,
      label: 'Reload',
      title: 'Reload tab'
    },
    {
      action: DROPDOWN_ACTIONS.COPY_URL,
      icon: ICONS.COPY_URL,
      label: 'Copy URL',
      title: 'Copy URL to clipboard'
    },
    { divider: true },
    {
      action: DROPDOWN_ACTIONS.DUPLICATE,
      icon: ICONS.DUPLICATE_TAB,
      label: 'Duplicate',
      title: 'Duplicate tab'
    },
    {
      action: DROPDOWN_ACTIONS.NEW_TAB_LEFT,
      icon: ICONS.NEW_TAB_LEFT,
      label: 'New Tab to Left',
      title: 'Open new tab to the left'
    },
    {
      action: DROPDOWN_ACTIONS.NEW_TAB_RIGHT,
      icon: ICONS.NEW_TAB_RIGHT,
      label: 'New Tab to Right',
      title: 'Open new tab to the right'
    },
    { divider: true },
    {
      action: DROPDOWN_ACTIONS.NEW_WINDOW,
      icon: ICONS.OPEN_IN_NEW_WINDOW,
      label: 'Move to New Window',
      title: 'Move tab to new window'
    },
    {
      action: DROPDOWN_ACTIONS.CLOSE,
      icon: '×',
      label: 'Close',
      title: 'Close tab',
      danger: true
    }
  ];

  items.forEach(item => {
    if (item.divider) {
      menu.appendChild(createElement('div', {
        className: CLASSES.TAB_DROPDOWN_DIVIDER
      }));
    } else {
      const menuItem = createElement('div', {
        className: `${CLASSES.TAB_DROPDOWN_ITEM}${item.danger ? ` ${CLASSES.DANGER}` : ''}`,
        attributes: { 'data-action': item.action, title: item.title }
      });
      
      const iconSpan = createElement('span', {
        className: `${CLASSES.TAB_DROPDOWN_ITEM}-icon`,
        innerHTML: item.icon
      });
      const labelSpan = createElement('span', {
        textContent: item.label
      });
      
      menuItem.appendChild(iconSpan);
      menuItem.appendChild(labelSpan);
      
      menuItem.addEventListener('click', (e) => {
        e.stopPropagation();
        onAction(item.action, tab);
      });
      
      menu.appendChild(menuItem);
    }
  });

  return menu;
}

/**
 * Dropdown manager class
 */
export class DropdownManager {
  /**
   * @param {Object} [options]
   * @param {Function} [options.onClose] - Called whenever an open dropdown is closed
   * @param {Function} [options.createMenu] - (tab) => menu element. Menus are built
   *   lazily when opened instead of once per tab on every render: building nine
   *   SVG menu items for every tab made the popup slow to open with many tabs.
   */
  constructor(options = {}) {
    this.currentOpenDropdown = null;
    this.onClose = options.onClose || (() => {});
    this.createMenu = options.createMenu || null;
    this._boundCloseOnClickOutside = this._closeOnClickOutside.bind(this);
  }

  /**
   * Toggle dropdown for a tab element
   * @param {HTMLElement} tabElement - Tab element
   * @param {chrome.tabs.Tab} tab - Tab data
   * @param {HTMLElement} container - Popup container for overflow check
   */
  toggle(tabElement, tab, container) {
    let dropdownMenu = tabElement.querySelector(`.${CLASSES.TAB_DROPDOWN_MENU}`);
    const dropdownBtn = tabElement.querySelector(`.${CLASSES.TAB_DROPDOWN_BTN}`);

    // If this dropdown is already open, close it
    if (dropdownMenu && this.currentOpenDropdown === dropdownMenu) {
      this.closeAll();
      return;
    }

    // Close any other open dropdown (lazily-built menus are removed here)
    this.closeAll();

    dropdownMenu = tabElement.querySelector(`.${CLASSES.TAB_DROPDOWN_MENU}`);
    if (!dropdownMenu && this.createMenu) {
      dropdownMenu = this.createMenu(tab);
      tabElement.appendChild(dropdownMenu);
    }
    if (!dropdownMenu || !dropdownBtn) return;

    // Open this dropdown
    dropdownMenu.classList.add(CLASSES.VISIBLE);
    dropdownBtn.classList.add(CLASSES.ACTIVE);
    this.currentOpenDropdown = dropdownMenu;

    // Check for overflow and adjust position
    setTimeout(() => {
      this._adjustPosition(dropdownMenu, container);
    }, 0);
  }

  /**
   * Close all open dropdowns
   */
  closeAll() {
    const wasOpen = this.currentOpenDropdown !== null;
    $$(`.${CLASSES.TAB_DROPDOWN_MENU}`).forEach(menu => {
      if (this.createMenu) {
        menu.remove();
      } else {
        menu.classList.remove(CLASSES.VISIBLE, CLASSES.ALIGN_LEFT, CLASSES.ALIGN_RIGHT);
      }
    });
    $$(`.${CLASSES.TAB_DROPDOWN_BTN}.${CLASSES.ACTIVE}`).forEach(btn => {
      btn.classList.remove(CLASSES.ACTIVE);
    });
    this.currentOpenDropdown = null;
    if (wasOpen) this.onClose();
  }

  /**
   * Whether a dropdown menu is currently open
   * @returns {boolean}
   */
  isOpen() {
    return this.currentOpenDropdown !== null && this.currentOpenDropdown.isConnected;
  }

  /**
   * Setup click-outside listener
   */
  setup() {
    document.addEventListener('click', this._boundCloseOnClickOutside);
  }

  /**
   * Cleanup listeners
   */
  cleanup() {
    document.removeEventListener('click', this._boundCloseOnClickOutside);
  }

  _adjustPosition(dropdownMenu, container) {
    const menuRect = dropdownMenu.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const menuWidth = menuRect.width;
    const tabWidth = 48;
    const tabCenter = tabWidth / 2;

    dropdownMenu.classList.remove(CLASSES.ALIGN_LEFT, CLASSES.ALIGN_RIGHT);
    dropdownMenu.style.removeProperty('--arrow-offset');

    if (menuRect.right > containerRect.right) {
      dropdownMenu.classList.add(CLASSES.ALIGN_RIGHT);
      const offsetFromMenuCenter = ((menuWidth + 5) / 2) - tabCenter;
      dropdownMenu.style.setProperty('--arrow-offset', `${offsetFromMenuCenter}px`);
    } else if (menuRect.left < containerRect.left) {
      dropdownMenu.classList.add(CLASSES.ALIGN_LEFT);
      const offsetFromMenuCenter = -((menuWidth + 5) / 2) + tabCenter;
      dropdownMenu.style.setProperty('--arrow-offset', `${offsetFromMenuCenter}px`);
    }
  }

  _closeOnClickOutside(e) {
    if (!e.target.closest(`.${CLASSES.TAB_DROPDOWN_MENU}`) && 
        !e.target.closest(`.${CLASSES.TAB_DROPDOWN_BTN}`)) {
      this.closeAll();
    }
  }
}

/**
 * Handle dropdown actions.
 *
 * The tab object captured when the popup rendered can be stale (pinned/muted
 * state, index, or even the id after Chrome discards a tab), so state-dependent
 * actions re-read the tab first. Errors are caught and logged instead of being
 * left as unhandled promise rejections.
 *
 * @param {string} action - Action name
 * @param {chrome.tabs.Tab} tab - Target tab
 * @returns {Promise<boolean>} true if the action succeeded
 */
export async function handleDropdownAction(action, tab) {
  try {
    const fresh = await chrome.tabs.get(tab.id);
    const edit = (fn) => withTabEditRetry(fn);
    switch (action) {
      case DROPDOWN_ACTIONS.PIN:
        await edit(() => chrome.tabs.update(fresh.id, { pinned: !fresh.pinned }));
        break;
      case DROPDOWN_ACTIONS.MUTE:
        await edit(() => chrome.tabs.update(fresh.id, { muted: !fresh.mutedInfo?.muted }));
        break;
      case DROPDOWN_ACTIONS.DUPLICATE:
        await edit(() => chrome.tabs.duplicate(fresh.id));
        break;
      case DROPDOWN_ACTIONS.RELOAD:
        await chrome.tabs.reload(fresh.id);
        break;
      case DROPDOWN_ACTIONS.COPY_URL:
        await navigator.clipboard.writeText(fresh.url || fresh.pendingUrl || '');
        break;
      case DROPDOWN_ACTIONS.NEW_TAB_RIGHT:
        await edit(() => chrome.tabs.create({ windowId: fresh.windowId, index: fresh.index + 1 }));
        break;
      case DROPDOWN_ACTIONS.NEW_TAB_LEFT:
        await edit(() => chrome.tabs.create({ windowId: fresh.windowId, index: fresh.index }));
        break;
      case DROPDOWN_ACTIONS.NEW_WINDOW:
        await edit(() => chrome.windows.create({ tabId: fresh.id }));
        break;
      case DROPDOWN_ACTIONS.CLOSE:
        await edit(() => chrome.tabs.remove(fresh.id));
        break;
    }
    return true;
  } catch (err) {
    console.error(`Tab action "${action}" failed for tab ${tab?.id}:`, err);
    return false;
  }
}
