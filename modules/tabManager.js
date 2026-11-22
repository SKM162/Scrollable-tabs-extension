/** @fileoverview Tab management and rendering */

import { CLASSES, ICONS } from './constants.js';
import { createElement, resolveGroupColor, getHostname } from './uiUtils.js';

/** Parse each SVG icon once and clone it, instead of re-parsing innerHTML per tab */
const iconTemplates = new Map();
function iconNode(name) {
  let tpl = iconTemplates.get(name);
  if (!tpl) {
    tpl = document.createElement('template');
    tpl.innerHTML = ICONS[name];
    iconTemplates.set(name, tpl);
  }
  return tpl.content.cloneNode(true);
}

/** chrome.tabGroups.TAB_GROUP_ID_NONE (-1), without depending on the API being present */
const NO_GROUP = chrome.tabGroups?.TAB_GROUP_ID_NONE ?? -1;

/** Collapse button glyphs: the strip is horizontal, so sections fold to the left */
const GLYPH_EXPANDED = '◀';
const GLYPH_COLLAPSED = '▶';
/** chrome.storage.session key for collapsed tab groups (survives popup re-opens, not restarts) */
const COLLAPSED_KEY = 'collapsedSections';

/**
 * Collapse or expand a section element and keep its button glyph in sync.
 * (Several code paths used to set different glyphs: '▼' for expanded in some,
 * '◀' in others.)
 * @param {HTMLElement} section
 * @param {boolean} collapsed
 */
export function setSectionCollapsed(section, collapsed) {
  if (!section) return;
  section.classList.toggle(CLASSES.COLLAPSED, collapsed);
  const btn = section.querySelector('.collapse-btn');
  if (btn) {
    btn.textContent = collapsed ? GLYPH_COLLAPSED : GLYPH_EXPANDED;
    btn.setAttribute('aria-expanded', String(!collapsed));
  }
  const header = section.querySelector(`.${CLASSES.GROUP_HEADER}`);
  if (header) header.title = collapsed ? 'Expand' : 'Collapse';
}

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
    this.isSelected = options.isSelected || (() => false);
    this.onSectionToggle = options.onSectionToggle || (() => {});
    this.onTabMiddleClick = options.onTabMiddleClick || (() => {});
    this.onClearFilters = options.onClearFilters || (() => {});
    this.isFirstRender = true;
    // Keys of collapsed sections. Rendering rebuilds the DOM on every tab update
    // (title/favicon/audio changes), which used to silently re-expand every
    // group the user had collapsed.
    this.collapsedSections = new Set();
    // Tab ids in the last render, so only newly appearing tabs animate in
    // (previously the whole strip re-played its fade-in on every update)
    this._renderedIds = new Set();
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

  /** Restore collapsed groups from this browser session */
  async loadCollapsedState() {
    try {
      const { [COLLAPSED_KEY]: keys = [] } = await chrome.storage.session.get(COLLAPSED_KEY);
      this.collapsedSections = new Set(keys);
    } catch { /* storage.session unavailable: keep in memory only */ }
  }

  _saveCollapsedState() {
    // Only real tab groups have stable ids worth remembering
    const keys = [...this.collapsedSections].filter(k => k.startsWith('g-'));
    chrome.storage.session?.set({ [COLLAPSED_KEY]: keys }).catch(() => {});
  }

  /**
   * Make sure a tab's section is expanded (e.g. before scrolling to it)
   * @param {number} tabId
   * @returns {HTMLElement|null} the tab element
   */
  revealTab(tabId) {
    const el = this.findTabElement(tabId);
    const section = el?.closest(`.${CLASSES.COLLAPSIBLE_SECTION}`);
    if (section?.classList.contains(CLASSES.COLLAPSED)) {
      setSectionCollapsed(section, false);
      if (this.collapsedSections.delete(section.dataset.sectionKey)) this._saveCollapsedState();
    }
    return el;
  }

  /**
   * Get current tabs
   * @returns {chrome.tabs.Tab[]}
   */
  getTabs() {
    return this.tabs;
  }

  /**
   * Drop a tab from the cached list (after it was closed) without re-fetching
   * @param {number} tabId - Tab ID
   */
  forgetTab(tabId) {
    this.tabs = this.tabs.filter(t => t.id !== tabId);
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
        if (radioFilter === 'grouped') return tab.groupId && tab.groupId !== NO_GROUP;
        if (radioFilter === 'ungrouped') return !tab.groupId || tab.groupId === NO_GROUP;
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
    // Build the new strip off-DOM and swap it in with a single replaceChildren().
    // Previously the container was emptied first and then filled across several
    // awaits (tab group lookups), so for a moment the strip was empty / scrolled
    // to 0 with the pinned tabs under the cursor; a click landing in that window
    // activated the wrong (often pinned) tab or missed the dropdown entirely.
    const target = document.createDocumentFragment();
    this._renderTarget = target;

    const tabsToRender = this.hasActiveFilters() ? this.getFilteredTabs() : this.tabs;

    if (tabsToRender.length === 0 && this.hasActiveFilters()) {
      this._renderNoResults();
      this.container.replaceChildren(target);
      return;
    }

    const { pinnedTabs, unpinnedTabs } = this._categorizeTabs(tabsToRender);
    const { groupedTabs } = this._groupTabs(unpinnedTabs);
    const sortedGroups = this._sortGroups(groupedTabs);

    // Pre-fetch group info so the build below doesn't wait per section
    await Promise.all(Object.keys(groupedTabs).map(id => this._fetchGroupInfo(Number(id))));

    // Render pinned section
    if (pinnedTabs.length > 0) {
      const pinnedSection = await this._createGroupSection('pinned', pinnedTabs, 'Pinned', true);
      target.appendChild(pinnedSection);
      target.appendChild(this._createDivider());
    }

    // Render unpinned tabs in order
    await this._renderUnpinnedTabs(unpinnedTabs, sortedGroups);

    this.container.replaceChildren(target);
    this._renderedIds = new Set(tabsToRender.map(t => t.id));
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
        width: '40px',
        height: '40px',
        top: '12px',
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
        gap: '8px',
        background: 'var(--ghost-icon-wrapper-bg)',
        borderRadius: '6px',
        padding: '8px 12px',
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

    const noResultsText = createElement('span', {
      textContent: 'No tabs found for the applied filter',
      style: {
        color: 'var(--text-primary)',
        fontSize: '13px'
      }
    });

    const clearBtn = createElement('button', {
      className: 'no-results-clear',
      textContent: 'Clear filters'
    });
    clearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.onClearFilters();
    });

    iconWrapper.appendChild(filterIcon);
    iconWrapper.appendChild(noResultsText);
    iconWrapper.appendChild(clearBtn);

    container.appendChild(ghostRow);
    container.appendChild(iconWrapper);
    this._renderTarget.appendChild(container);
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
    this.revealTab(activeTab.id);
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
      if (tab.groupId && tab.groupId !== NO_GROUP) {
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
    const position = new Map(this.tabs.map((t, i) => [t.id, i]));
    const firstIndex = (tabs) => Math.min(...tabs.map(t => position.get(t.id) ?? Infinity));
    return Object.entries(groupedTabs).sort(([, tabsA], [, tabsB]) => firstIndex(tabsA) - firstIndex(tabsB));
  }

  async _renderUnpinnedTabs(unpinnedTabs, sortedGroups) {
    let currentGroupId = null;
    let currentGroupTabs = [];
    let currentUngroupedTabs = [];

    for (const tab of unpinnedTabs) {
      const tabGroupId = tab.groupId && tab.groupId !== NO_GROUP ? tab.groupId : null;

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
      this._renderTarget.appendChild(section);
      ungroupedTabs.length = 0; // Clear the array
    }
    if (groupTabs.length > 0) {
      const section = await this._createGroupSection(groupId, groupTabs, 'Unnamed group', false);
      this._renderTarget.appendChild(section);
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

    if (!isPinned && groupTabs.length > 0 && groupTabs[0].groupId && groupTabs[0].groupId !== NO_GROUP && chrome.tabGroups) {
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

    if (!isPinned) {
      const key = groupId === 'ungrouped' ? `u-${groupTabs[0]?.id}` : `g-${groupId}`;
      section.dataset.sectionKey = key;
      // While searching/filtering, show every match instead of hiding some of
      // them inside a collapsed group
      setSectionCollapsed(section, !this.hasActiveFilters() && this.collapsedSections.has(key));
    }

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
      textContent: GLYPH_EXPANDED,
      attributes: { 'aria-label': 'Toggle group', 'aria-expanded': 'true' }
    });

    header.appendChild(label);
    header.appendChild(countSpan);
    header.appendChild(collapseBtn);

    header.addEventListener('click', () => {
      const collapsed = !section.classList.contains(CLASSES.COLLAPSED);
      setSectionCollapsed(section, collapsed);
      // Remember it (but not for temporary toggles while a filter is active)
      if (!this.hasActiveFilters() && section.dataset.sectionKey) {
        if (collapsed) this.collapsedSections.add(section.dataset.sectionKey);
        else this.collapsedSections.delete(section.dataset.sectionKey);
        this._saveCollapsedState();
      }
      this.onSectionToggle(section);
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
    if (!this.isFirstRender && !this._renderedIds.has(tab.id)) {
      div.classList.add('tab-enter');
    }
    if (tab.discarded) {
      div.classList.add('discarded');
    }
    // Selection state is applied while building, so re-renders (tab updates,
    // filtering, scrolling-triggered refreshes) never drop the selection.
    if (this.isSelected(tab.id)) {
      div.classList.add(CLASSES.SELECTED_TAB);
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

    // Selection checkmark overlay
    const checkmark = createElement('span', { className: CLASSES.SELECTION_CHECKMARK });
    checkmark.appendChild(iconNode('CHECKMARK'));
    div.appendChild(checkmark);

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

    div.addEventListener('click', (e) => {
      this.onTabClick(tab.id, e);
    });

    // Middle-click closes the tab, like in Chrome's own tab strip. (mousedown is
    // prevented so Chrome doesn't start autoscroll mode.)
    div.addEventListener('mousedown', (e) => {
      if (e.button === 1) e.preventDefault();
    });
    div.addEventListener('auxclick', (e) => {
      if (e.button !== 1) return;
      e.preventDefault();
      e.stopPropagation();
      this.onTabMiddleClick(tab);
    });

    return div;
  }

  _createFavicon(tab) {
    const favicon = createElement('img', {
      className: CLASSES.FAVICON
    });
    const fallback = chrome.runtime.getURL('assets/default-favicon.svg');

    // Use Chrome's built-in favicon cache (requires the "favicon" permission).
    // This avoids making network requests from the extension page to whatever
    // host a tab's favIconUrl points at (privacy leak / tracking pixel), and it
    // also works for data: and chrome:// favicons.
    const pageUrl = tab.url || tab.pendingUrl;
    if (pageUrl) {
      const url = new URL(chrome.runtime.getURL('/_favicon/'));
      url.searchParams.set('pageUrl', pageUrl);
      url.searchParams.set('size', '32');
      favicon.src = url.toString();
    } else {
      favicon.src = fallback;
    }

    favicon.onerror = () => {
      favicon.onerror = null;
      favicon.src = fallback;
    };

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
    if (tab.groupId && tab.groupId !== NO_GROUP && chrome.tabGroups) {
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
    // One badge in the corner. Pinned tabs always live in the "Pinned" section,
    // so the old pin badge was redundant - and it sat on exactly the same spot
    // as the audio badge, so a pinned tab playing audio showed an overlapped mess.
    // Muted tabs had no indicator at all, although the Audio filter lists them.
    const muted = !!tab.mutedInfo?.muted;
    if (!muted && !tab.audible) return;
    const badge = createElement('span', {
      className: `${CLASSES.INDICATOR} ${muted ? 'muted-indicator' : CLASSES.AUDIO_INDICATOR}`,
      attributes: { title: muted ? 'Muted' : 'Playing audio' }
    });
    badge.appendChild(iconNode(muted ? 'MUTE' : 'UNMUTE'));
    div.appendChild(badge);
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
    // The menu itself is created lazily by DropdownManager when opened
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
   * Tabs the user can currently see, in display order: rendered after
   * search/filter and not inside a collapsed group. Selection operations
   * (select all, shift-range) and batch actions are limited to these.
   * @returns {chrome.tabs.Tab[]}
   */
  getVisibleTabs() {
    const byId = new Map(this.tabs.map(t => [t.id, t]));
    const result = [];
    this.container.querySelectorAll(`.${CLASSES.TAB_ITEM}`).forEach(el => {
      if (el.classList.contains('closing')) return;
      if (el.closest(`.${CLASSES.COLLAPSIBLE_SECTION}.${CLASSES.COLLAPSED}`)) return;
      const tab = byId.get(Number(el.dataset.tabId));
      if (tab) result.push(tab);
    });
    return result;
  }

  /**
   * Update selection state on rendered tab elements
   * @param {Set<number>} selectedTabIds
   */
  updateSelectionState(selectedTabIds) {
    this.container.querySelectorAll(`.${CLASSES.TAB_ITEM}`).forEach(el => {
      el.classList.toggle(CLASSES.SELECTED_TAB, selectedTabIds.has(Number(el.dataset.tabId)));
    });
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
