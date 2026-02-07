/** @fileoverview Tab management and rendering */

import { CLASSES } from './constants.js';
import { createElement, resolveGroupColor, cacheBustFavicon, getHostname } from './uiUtils.js';
import { createDropdownMenu } from './dropdownManager.js';

/**
 * Tab manager class
 */
export class TabManager {
  constructor(options = {}) {
    this.tabs = [];
    this.settings = options.settings || {};
    this.container = options.container;
    this.onTabClick = options.onTabClick || (() => {});
    this.onTabHover = options.onTabHover || (() => {});
    this.onTabHoverEnd = options.onTabHoverEnd || (() => {});
    this.onDropdownAction = options.onDropdownAction || (() => {});
    this.isFirstRender = true;
  }

  /**
   * Fetch tabs from current window
   */
  async fetchTabs() {
    try {
      this.tabs = await chrome.tabs.query({ currentWindow: true });
      return this.tabs;
    } catch (error) {
      console.error('Error fetching tabs:', error);
      return [];
    }
  }

  /**
   * Get current tabs
   * @returns {chrome.tabs.Tab[]}
   */
  getTabs() {
    return this.tabs;
  }

  /**
   * Get active tab
   * @returns {chrome.tabs.Tab|undefined}
   */
  getActiveTab() {
    return this.tabs.find(t => t.active);
  }

  /**
   * Update settings
   * @param {Object} settings - New settings
   */
  updateSettings(settings) {
    this.settings = { ...this.settings, ...settings };
  }

  /**
   * Mark that first render is complete
   */
  markFirstRenderComplete() {
    this.isFirstRender = false;
  }

  /**
   * Render all tabs
   */
  async render() {
    this.container.innerHTML = '';

    const { pinnedTabs, unpinnedTabs } = this._categorizeTabs();
    const { groupedTabs, ungroupedTabs } = this._groupTabs(unpinnedTabs);
    const sortedGroups = this._sortGroups(groupedTabs);

    // Render pinned section
    if (pinnedTabs.length > 0) {
      const pinnedSection = await this._createGroupSection('pinned', pinnedTabs, 'Pinned', true);
      this.container.appendChild(pinnedSection);
      this.container.appendChild(this._createDivider());
    }

    // Render unpinned tabs in order
    await this._renderUnpinnedTabs(unpinnedTabs, sortedGroups);
  }

  /**
   * Find tab element by ID
   * @param {number} tabId - Tab ID
   * @returns {HTMLElement|null}
   */
  findTabElement(tabId) {
    return this.container.querySelector(`[data-tab-id="${tabId}"]`);
  }

  /**
   * Highlight active tab
   */
  highlightActiveTab() {
    const activeTab = this.getActiveTab();
    if (!activeTab) return;

    const activeTabElement = this.findTabElement(activeTab.id);
    if (!activeTabElement) return;

    // Remove active class from all tabs
    this.container.querySelectorAll(`.${CLASSES.TAB_ITEM}.${CLASSES.ACTIVE_TAB}`).forEach(el => {
      el.classList.remove(CLASSES.ACTIVE_TAB);
    });

    // Add active class to current tab
    activeTabElement.classList.add(CLASSES.ACTIVE_TAB);

    // Expand collapsed section if needed
    const groupSection = activeTabElement.closest(`.${CLASSES.COLLAPSIBLE_SECTION}`);
    if (groupSection?.classList.contains(CLASSES.COLLAPSED)) {
      groupSection.classList.remove(CLASSES.COLLAPSED);
      const btn = groupSection.querySelector('.collapse-btn');
      if (btn) btn.textContent = '▼';
    }
  }

  _categorizeTabs() {
    const pinnedTabs = [];
    const unpinnedTabs = [];

    this.tabs.forEach(tab => {
      if (tab.pinned) {
        pinnedTabs.push(tab);
      } else {
        unpinnedTabs.push(tab);
      }
    });

    return { pinnedTabs, unpinnedTabs };
  }

  _groupTabs(unpinnedTabs) {
    const groupedTabs = {};
    const ungroupedTabs = [];

    unpinnedTabs.forEach(tab => {
      if (tab.groupId && tab.groupId !== chrome.tabs.TAB_ID_NONE) {
        if (!groupedTabs[tab.groupId]) {
          groupedTabs[tab.groupId] = [];
        }
        groupedTabs[tab.groupId].push(tab);
      } else {
        ungroupedTabs.push(tab);
      }
    });

    return { groupedTabs, ungroupedTabs };
  }

  _sortGroups(groupedTabs) {
    return Object.entries(groupedTabs).sort(([groupIdA, tabsA], [groupIdB, tabsB]) => {
      const minIndexA = Math.min(...tabsA.map(t => this.tabs.findIndex(orig => orig.id === t.id)));
      const minIndexB = Math.min(...tabsB.map(t => this.tabs.findIndex(orig => orig.id === t.id)));
      return minIndexA - minIndexB;
    });
  }

  async _renderUnpinnedTabs(unpinnedTabs, sortedGroups) {
    let currentGroupId = null;
    let currentGroupTabs = [];
    let currentUngroupedTabs = [];

    for (const tab of unpinnedTabs) {
      const tabGroupId = tab.groupId && tab.groupId !== chrome.tabs.TAB_ID_NONE ? tab.groupId : null;

      if (tabGroupId) {
        if (currentGroupId === tabGroupId) {
          currentGroupTabs.push(tab);
        } else {
          await this._flushPendingSections(currentUngroupedTabs, currentGroupTabs, currentGroupId);
          currentGroupId = tabGroupId;
          currentGroupTabs = [tab];
        }
      } else {
        if (currentGroupId !== null) {
          await this._flushPendingSections(currentUngroupedTabs, currentGroupTabs, currentGroupId);
          currentGroupId = null;
          currentGroupTabs = [];
        }
        currentUngroupedTabs.push(tab);
      }
    }

    await this._flushPendingSections(currentUngroupedTabs, currentGroupTabs, currentGroupId);
  }

  async _flushPendingSections(ungroupedTabs, groupTabs, groupId) {
    if (ungroupedTabs.length > 0) {
      const section = await this._createGroupSection('ungrouped', ungroupedTabs, 'Other Tabs', false);
      this.container.appendChild(section);
    }
    if (groupTabs.length > 0) {
      const section = await this._createGroupSection(groupId, groupTabs, `Group ${groupId}`, false);
      this.container.appendChild(section);
    }
  }

  async _createGroupSection(groupId, groupTabs, label, isPinned) {
    const section = createElement('div', {
      className: `${CLASSES.TAB_GROUP_SECTION} ${isPinned ? CLASSES.PINNED_SECTION : CLASSES.COLLAPSIBLE_SECTION}`,
      dataset: { groupId }
    });

    let groupTitle = label;
    let groupColor = null;

    if (!isPinned && groupTabs.length > 0 && groupTabs[0].groupId && chrome.tabGroups) {
      try {
        const groupInfo = await chrome.tabGroups.get(groupTabs[0].groupId);
        if (groupInfo) {
          groupTitle = groupInfo.title || label;
          groupColor = groupInfo.color;

          const resolved = resolveGroupColor(groupColor);
          if (resolved) {
            section.style.backgroundColor = `rgba(${resolved.rgb.r}, ${resolved.rgb.g}, ${resolved.rgb.b}, 0.28)`;
            section.style.borderLeft = `3px solid ${resolved.hex}`;
          }
        }
      } catch (e) {
        // Tab groups API not available
      }
    }

    // Create header
    const header = this._createSectionHeader(groupTitle, groupTabs.length, isPinned, section);
    section.appendChild(header);

    // Create tabs container
    const tabsContainer = createElement('div', { className: CLASSES.GROUP_TABS_CONTAINER });
    groupTabs.forEach((tab, index) => {
      const tabElement = this._createTabElement(tab, index);
      tabsContainer.appendChild(tabElement);
    });
    section.appendChild(tabsContainer);

    return section;
  }

  _createSectionHeader(title, count, isPinned, section) {
    if (isPinned) {
      return createElement('div', {
        className: `${CLASSES.GROUP_HEADER} ${CLASSES.GROUP_HEADER_PINNED}`,
        innerHTML: `
          <span class="group-label">${title}</span>
          <span class="group-count">${count}</span>
        `
      });
    }

    const header = createElement('div', {
      className: CLASSES.GROUP_HEADER,
      innerHTML: `
        <span class="group-label">${title}</span>
        <span class="group-count">${count}</span>
        <button class="collapse-btn">◀</button>
      `
    });

    header.addEventListener('click', () => {
      section.classList.toggle(CLASSES.COLLAPSED);
      const btn = header.querySelector('.collapse-btn');
      btn.textContent = section.classList.contains(CLASSES.COLLAPSED) ? '◀' : '▼';
    });

    return header;
  }

  _createTabElement(tab, index) {
    const div = createElement('div', {
      className: CLASSES.TAB_ITEM,
      dataset: { tabId: tab.id, index }
    });

    if (tab.active) {
      div.classList.add(CLASSES.ACTIVE_TAB);
    }

    // Favicon
    const favicon = this._createFavicon(tab);
    div.appendChild(favicon);

    // Title
    if (this.settings.showTitles) {
      const title = createElement('span', {
        className: CLASSES.TITLE,
        textContent: tab.title || 'New Tab',
        attributes: { title: tab.title || 'New Tab' }
      });
      div.appendChild(title);
    }

    // Group indicator
    this._addGroupIndicator(div, tab);

    // Indicators
    this._addIndicators(div, tab);

    // Dropdown
    this._addDropdown(div, tab);

    // Event listeners
    div.addEventListener('mouseenter', () => {
      if (!this.container.classList.contains(CLASSES.IS_SCROLLING)) {
        this.onTabHover(tab);
      }
    });

    div.addEventListener('mouseleave', () => {
      if (!this.container.querySelector(`.${CLASSES.TAB_ITEM}:hover`)) {
        this.onTabHoverEnd();
      }
    });

    div.addEventListener('click', () => {
      this.onTabClick(tab.id);
    });

    return div;
  }

  _createFavicon(tab) {
    const favicon = createElement('img', {
      className: CLASSES.FAVICON
    });

    const faviconUrl = tab.favIconUrl && !tab.favIconUrl.startsWith('chrome://')
      ? tab.favIconUrl
      : null;

    if (faviconUrl) {
      favicon.src = cacheBustFavicon(faviconUrl, tab.id);
      favicon.onerror = () => {
        favicon.src = chrome.runtime.getURL('assets/default-favicon.svg');
      };
    } else {
      favicon.src = chrome.runtime.getURL('assets/default-favicon.svg');
    }

    return favicon;
  }

  _addGroupIndicator(div, tab) {
    if (tab.groupId && tab.groupId !== chrome.tabs.TAB_ID_NONE && chrome.tabGroups) {
      chrome.tabGroups.get(tab.groupId).then(groupInfo => {
        if (groupInfo) {
          const resolved = resolveGroupColor(groupInfo.color) || resolveGroupColor('blue');
          if (resolved) {
            div.dataset.groupColor = resolved.hex;
            div.dataset.groupTitle = groupInfo.title || 'Untitled';
          }
        }
      }).catch(() => { });
    }
  }

  _addIndicators(div, tab) {
    if (tab.pinned) {
      div.appendChild(createElement('span', {
        className: `${CLASSES.INDICATOR} ${CLASSES.PIN_INDICATOR}`,
        textContent: '📌',
        attributes: { title: 'Pinned' }
      }));
    }

    if (tab.audible) {
      div.appendChild(createElement('span', {
        className: `${CLASSES.INDICATOR} ${CLASSES.AUDIO_INDICATOR}`,
        textContent: '🔊',
        attributes: { title: 'Audio playing' }
      }));
    }

    if (tab.audible && tab.mutedInfo && !tab.mutedInfo.muted) {
      div.appendChild(createElement('span', {
        className: `${CLASSES.INDICATOR} ${CLASSES.PIP_INDICATOR}`,
        textContent: '📺',
        attributes: { title: 'Picture-in-Picture' }
      }));
    }
  }

  _addDropdown(div, tab) {
    const dropdownBtn = createElement('button', {
      className: CLASSES.TAB_DROPDOWN_BTN,
      textContent: '▼',
      attributes: { title: 'Tab actions' }
    });

    dropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.onDropdownAction('toggle', tab, div);
    });

    div.appendChild(dropdownBtn);

    const dropdownMenu = createDropdownMenu(tab, (action, t) => {
      this.onDropdownAction(action, t);
    });

    div.appendChild(dropdownMenu);
  }

  _createDivider() {
    return createElement('div', { className: CLASSES.TAB_DIVIDER });
  }

  /**
   * Get tab counter text
   * @returns {string}
   */
  getTabCounterText() {
    const activeIndex = this.tabs.findIndex(t => t.active);
    const total = this.tabs.length;

    if (this.settings.showIndices && activeIndex >= 0) {
      return `On tab ${activeIndex + 1} of ${total}`;
    }
    return `${total} tabs`;
  }

  /**
   * Get current tab info for display
   * @returns {{title: string, hostname: string}}
   */
  getCurrentTabInfo() {
    const activeTab = this.getActiveTab();
    if (activeTab) {
      return {
        title: activeTab.title || 'New Tab',
        hostname: getHostname(activeTab.url)
      };
    }
    return { title: 'No active tab', hostname: '' };
  }

  /**
   * Get tab info by ID
   * @param {number} tabId - Tab ID
   * @returns {{title: string, hostname: string}|null}
   */
  getTabInfo(tabId) {
    const tab = this.tabs.find(t => t.id === tabId);
    if (tab) {
      return {
        title: tab.title || 'New Tab',
        hostname: getHostname(tab.url)
      };
    }
    return null;
  }
}
