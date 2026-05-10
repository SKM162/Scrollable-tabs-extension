/** @fileoverview Tab management and rendering */

import { CLASSES, ICONS } from './constants.js';
import { createElement, resolveGroupColor, getCachedFaviconUrl, getHostname } from './uiUtils.js';
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
    this._groupInfoCache = new Map();
    this.filters = {
      searchText: '',
      radio: null
    };
  }

  /**
   * Fetch tabs from current window
   */
  async fetchTabs() {
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Tab query timeout')), 5000)
      );
      this.tabs = await Promise.race([
        chrome.tabs.query({ currentWindow: true }),
        timeoutPromise
      ]);
      return this.tabs;
    } catch (error) {
      console.error('Error fetching tabs:', error);
      return this.tabs || [];
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
   * Set a filter value
   * @param {string} filterType - The filter type (searchText, audio, pinned, etc.)
   * @param {*} value - The filter value
   */
  setFilter(filterType, value) {
    this.filters[filterType] = value;
  }

  /**
   * Clear all filters
   */
  clearFilters() {
    this.filters = {
      searchText: '',
      radio: null
    };
  }

  /**
   * Check if any filters are active
   * @returns {boolean}
   */
  hasActiveFilters() {
    return (
      this.filters.searchText ||
      this.filters.radio
    );
  }

  /**
   * Get filtered tabs
   * @returns {chrome.tabs.Tab[]}
   */
  getFilteredTabs() {
    let filtered = [...this.tabs];

    if (this.filters.searchText) {
      const searchLower = this.filters.searchText.toLowerCase();
      filtered = filtered.filter(tab => {
        const titleMatch = tab.title?.toLowerCase().includes(searchLower);
        const urlMatch = tab.url?.toLowerCase().includes(searchLower);
        return titleMatch || urlMatch;
      });
    }

    if (this.filters.radio) {
      const radioFilter = this.filters.radio;
      filtered = filtered.filter(tab => {
        if (radioFilter === 'audio') return tab.audible || tab.mutedInfo?.muted;
        if (radioFilter === 'pinned') return tab.pinned;
        if (radioFilter === 'grouped') return tab.groupId && tab.groupId !== chrome.tabs.TAB_ID_NONE;
        if (radioFilter === 'ungrouped') return !tab.groupId || tab.groupId === chrome.tabs.TAB_ID_NONE;
        return true;
      });
    }

    return filtered;
  }

  /**
   * Get filter stats
   * @returns {{total: number, filtered: number}}
   */
  getFilterStats() {
    const total = this.tabs.length;
    const filtered = this.getFilteredTabs().length;
    return { total, filtered };
  }

  /**
   * Mark that first render is complete
   */
  markFirstRenderComplete() {
    this.isFirstRender = false;
  }

  /**
   * Render all tabs (or filtered tabs if filters are active)
   */
  async render() {
    this.container.innerHTML = '';

    const tabsToRender = this.hasActiveFilters() ? this.getFilteredTabs() : this.tabs;

    if (tabsToRender.length === 0 && this.hasActiveFilters()) {
      this._renderNoResults();
      return;
    }

    const { pinnedTabs, unpinnedTabs } = this._categorizeTabs(tabsToRender);
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

_renderNoResults() {
    const boxWidth = 48;
    const boxGap = 4;
    const totalBox = boxWidth + boxGap;
    const containerWidth = (this.container.clientWidth || 500) - 40;
    const boxCount = Math.floor(containerWidth / totalBox);

    const container = createElement('div', {
      className: `${CLASSES.NO_RESULTS}`,
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        width: '100%',
        minWidth: '0',
        padding: '20px'
      }
    });

    const ghostRow = createElement('div', {
      style: {
        display: 'flex',
        gap: `${boxGap}px`,
        alignItems: 'flex-start',
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        justifyContent: 'center'
      }
    });

    for (let i = 0; i < boxCount; i++) {
      const ghostWrapper = createElement('div', {
        style: {
          width: `${boxWidth}px`,
          height: '64px',
          background: 'var(--ghost-box-bg)',
          borderRadius: '5px',
          boxShadow: 'var(--ghost-box-shadow)',
          flexShrink: '0'
        }
      });
      ghostRow.appendChild(ghostWrapper);
    }

    const travelWidth = (boxCount - 1) * totalBox;

    const movingGhost = createElement('div', {
      innerHTML: ICONS.GHOST,
      style: {
        position: 'absolute',
        width: '32px',
        height: '32px',
        top: '16px',
        left: '0px',
        animation: `ghostFade 8s ease-in-out infinite`
      }
    });

    const styleId = 'ghost-animation-style';
    let existingStyle = document.getElementById(styleId);
    if (existingStyle) existingStyle.remove();

    const styleSheet = document.createElement('style');
    styleSheet.id = styleId;
    styleSheet.textContent = `
      .ghost-animated {
        color: var(--ghost-color);
      }
      @keyframes ghostFade {
        0% { left: 0px; opacity: 0; }
        5% { opacity: 0.9; }
        85% { opacity: 0.9; }
        100% { left: ${travelWidth}px; opacity: 0; }
      }
    `;
    document.head.appendChild(styleSheet);

    movingGhost.classList.add('ghost-animated');

    ghostRow.appendChild(movingGhost);

    const iconWrapper = createElement('div', {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '32px',
        height: '32px',
        background: 'var(--ghost-icon-wrapper-bg)',
        borderRadius: '50%',
        marginTop: '4px'
      }
    });

    const filterIcon = createElement('div', {
      innerHTML: ICONS.FILTER,
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--ghost-icon-stroke)'
      }
    });

    iconWrapper.appendChild(filterIcon);
    container.appendChild(ghostRow);
    container.appendChild(iconWrapper);
    this.container.appendChild(container);
  }

  /**
   * Find tab element by ID
   * @param {number} tabId - Tab ID
   * @returns {HTMLElement|null}
   */
  findTabElement(tabId) {
    if (typeof tabId !== 'number') return null;
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

  _categorizeTabs(tabs = this.tabs) {
    const pinnedTabs = [];
    const unpinnedTabs = [];

    tabs.forEach(tab => {
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
      ungroupedTabs.length = 0; // Clear the array
    }
    if (groupTabs.length > 0) {
      const section = await this._createGroupSection(groupId, groupTabs, `Group ${groupId}`, false);
      this.container.appendChild(section);
      groupTabs.length = 0; // Clear the array
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
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Group query timeout')), 3000)
        );
        const groupInfo = await Promise.race([
          this._fetchGroupInfo(groupTabs[0].groupId),
          timeoutPromise
        ]);
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
        // Tab groups API not available or timeout
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
      const header = createElement('div', {
        className: `${CLASSES.GROUP_HEADER} ${CLASSES.GROUP_HEADER_PINNED}`
      });
      header.appendChild(createElement('span', {
        className: 'group-label',
        textContent: title
      }));
      header.appendChild(createElement('span', {
        className: 'group-count',
        textContent: count.toString()
      }));
      return header;
    }

    const header = createElement('div', {
      className: CLASSES.GROUP_HEADER
    });

    const label = createElement('span', { className: 'group-label', textContent: title });
    const countSpan = createElement('span', { className: 'group-count', textContent: count.toString() });
    const collapseBtn = createElement('button', {
      className: 'collapse-btn',
      textContent: '◀'
    });

    header.appendChild(label);
    header.appendChild(countSpan);
    header.appendChild(collapseBtn);

    header.addEventListener('click', () => {
      section.classList.toggle(CLASSES.COLLAPSED);
      const btn = header.querySelector('.collapse-btn');
      btn.textContent = section.classList.contains(CLASSES.COLLAPSED) ? '▼' : '◀';
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

    const faviconUrl = tab.favIconUrl && 
      !tab.favIconUrl.startsWith('chrome://') &&
      !tab.favIconUrl.startsWith('chrome-extension://') &&
      !tab.favIconUrl.startsWith('data:') &&
      tab.favIconUrl.length > 0 &&
      tab.favIconUrl.length < 2048
      ? tab.favIconUrl
      : null;

    if (faviconUrl) {
      favicon.src = getCachedFaviconUrl(faviconUrl);
      
      favicon.onerror = () => {
        favicon.src = chrome.runtime.getURL('assets/default-favicon.svg');
      };
    } else {
      favicon.src = chrome.runtime.getURL('assets/default-favicon.svg');
    }

    return favicon;
  }

  async _fetchGroupInfo(groupId) {
    if (this._groupInfoCache.has(groupId)) {
      return this._groupInfoCache.get(groupId);
    }
    try {
      const groupInfo = await chrome.tabGroups.get(groupId);
      this._groupInfoCache.set(groupId, groupInfo);
      return groupInfo;
    } catch {
      return null;
    }
  }

  async _addGroupIndicator(div, tab) {
    if (tab.groupId && tab.groupId !== chrome.tabs.TAB_ID_NONE && chrome.tabGroups) {
      const groupInfo = await this._fetchGroupInfo(tab.groupId);
      if (groupInfo) {
        const resolved = resolveGroupColor(groupInfo.color) || resolveGroupColor('blue');
        if (resolved) {
          div.dataset.groupColor = resolved.hex;
          div.dataset.groupTitle = groupInfo.title || 'Untitled';
        }
      }
    }
  }

  _addIndicators(div, tab) {
    if (tab.pinned) {
      div.appendChild(createElement('span', {
        className: `${CLASSES.INDICATOR} ${CLASSES.PIN_INDICATOR}`,
        innerHTML: ICONS.PIN,
        attributes: { title: 'Pinned' }
      }));
    }

    if (tab.audible) {
      div.appendChild(createElement('span', {
        className: `${CLASSES.INDICATOR} ${CLASSES.AUDIO_INDICATOR}`,
        innerHTML: ICONS.UNMUTE,
        attributes: { title: 'Audio playing' }
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
