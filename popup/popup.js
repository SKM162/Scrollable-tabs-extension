/** @fileoverview Scrollable Tabs - Main Popup Logic */

import {
  DEFAULT_SETTINGS,
  SELECTORS,
  POPUP_DIMENSIONS,
  CLASSES,
  THEMES,
  ICONS,
  TabManager,
  ScrollManager,
  DropdownManager,
  SelectionManager,
  createDropdownMenu,
  createKeyboardNavigator,
  enableKeyboardNavigation,
  saveScrollAnchor,
  restoreScrollAnchor,
  handleDropdownAction,
  withTabEditRetry,
  removeTabs,
  showMessage,
  setIcon,
  $,
  $$
} from '../modules/index.js';
import { loadSettings, saveSettings } from '../utils/storage.js';
import { installErrorLog } from '../utils/errorLog.js';

installErrorLog('popup');

class TabNavigator {
  constructor() {
    this.settings = { ...DEFAULT_SETTINGS };
    this.tabManager = null;
    this.scrollManager = null;
    this.dropdownManager = null;
    this.selectionManager = null;
    this.keyboardHandler = null;
    this.cleanupFns = [];
    this.elements = {};
  }

  async init() {
    // Cache DOM elements after DOM is ready
    this.cacheElements();
    
    // Start the tab query while settings load instead of one after the other
    const tabsPromise = chrome.tabs.query({ currentWindow: true }).catch(() => null);
    await this.loadSettings();
    this.setupTheme();
    this.setupIcons();
    this.setupDimensions();
    this.setupManagers();
    this.setupEventListeners();

    const initialTabs = await tabsPromise;
    if (initialTabs) this.tabManager.tabs = initialTabs;
    await this.refreshTabList(false, false, { skipFetch: !!initialTabs });
  }
  
  cacheElements() {
    this.elements = {
      tabContainer: $(SELECTORS.TAB_CONTAINER),
      tabCounter: $(SELECTORS.TAB_COUNTER),
      popupContainer: $(SELECTORS.POPUP_CONTAINER),
      currentTabTitle: $(SELECTORS.CURRENT_TAB_TITLE),
      currentTabUrl: $(SELECTORS.CURRENT_TAB_URL),
      currentTabInfo: $(SELECTORS.CURRENT_TAB_INFO),
      hoveredTabTitle: $(SELECTORS.HOVERED_TAB_TITLE),
      hoveredTabUrl: $(SELECTORS.HOVERED_TAB_URL),
      hoveredTabInfo: $(SELECTORS.HOVERED_TAB_INFO),
      tabCounterWrapper: $(SELECTORS.TAB_COUNTER_WRAPPER),
      themeToggleBtn: $(SELECTORS.THEME_TOGGLE_BTN),
      settingsBtn: $(SELECTORS.SETTINGS_BTN),
      searchInput: $(SELECTORS.SEARCH_INPUT),
      filterDropdown: $(SELECTORS.FILTER_DROPDOWN),
      filterBtn: $(SELECTORS.FILTER_BTN),
      filterMenu: $(SELECTORS.FILTER_MENU),
      filterResults: $(SELECTORS.FILTER_RESULTS),
      clearFiltersBtn: $(SELECTORS.CLEAR_FILTERS_BTN),
      clearFiltersBtnInline: $(SELECTORS.CLEAR_FILTERS_BTN_INLINE),
      selectionModeBtn: $(SELECTORS.SELECTION_MODE_BTN),
      bugReportBtn: $(SELECTORS.BUG_REPORT_BTN),
      selectionBar: $('#selectionBar'),
      selectAllBtn: $('#selectAllBtn'),
      deselectAllBtn: $('#deselectAllBtn'),
      batchCloseBtn: $('#batchCloseBtn'),
      batchMuteBtn: $('#batchMuteBtn'),
      batchPinBtn: $('#batchPinBtn'),
      batchWindowBtn: $('#batchWindowBtn')
    };
  }

  async loadSettings() {
    this.settings = await loadSettings(DEFAULT_SETTINGS);
  }

  setupTheme() {
    const themeSetting = this.settings.theme || THEMES.AUTO;
    this.applyTheme(themeSetting);
    
    this.elements.themeToggleBtn?.addEventListener('click', () => {
      this.toggleTheme();
    });
  }

  setupIcons() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    setIcon(this.elements.themeToggleBtn, currentTheme === 'dark' ? 'DARK_MODE' : 'LIGHT_MODE');
    setIcon(this.elements.settingsBtn, 'SETTINGS');
    setIcon(this.elements.filterBtn, 'FILTER');
    setIcon(this.elements.clearFiltersBtnInline, 'CLEAR_FILTER');
    setIcon(this.elements.tabCounterWrapper?.querySelector('.tab-counter-icon'), 'TAB_COUNTER');
    setIcon(this.elements.selectionModeBtn, 'SELECT');
    setIcon(this.elements.bugReportBtn, 'BUG');
    setIcon(this.elements.selectAllBtn, 'SELECT_ALL');
    setIcon(this.elements.deselectAllBtn, 'DESELECT_ALL');
    setIcon(this.elements.batchCloseBtn, 'CLOSE_TABS');
    // Same icons as the per-tab dropdown menu; mute/pin switch to unmute/unpin
    // in updateBatchActionIcons() when every selected tab is already muted/pinned
    setIcon(this.elements.batchMuteBtn, 'MUTE');
    setIcon(this.elements.batchPinBtn, 'PIN');
    setIcon(this.elements.batchWindowBtn, 'OPEN_IN_NEW_WINDOW');
  }

  applyTheme(themeSetting) {
    let effectiveTheme = themeSetting;
    
    if (themeSetting === THEMES.AUTO) {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches 
        ? THEMES.DARK 
        : THEMES.LIGHT;
    }
    
    document.documentElement.setAttribute('data-theme', effectiveTheme);
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
    
    document.documentElement.setAttribute('data-theme', newTheme);
    setIcon(this.elements.themeToggleBtn, newTheme === THEMES.DARK ? 'DARK_MODE' : 'LIGHT_MODE');
    this.elements.themeToggleBtn.title = newTheme === THEMES.DARK ? 'Switch to light mode' : 'Switch to dark mode';
    
    this.settings.theme = newTheme;
    // Persist the choice (previously it was only kept in memory and lost on close)
    saveSettings({ theme: newTheme });
  }

  setupDimensions() {
    const w = Math.min(
      Math.max(POPUP_DIMENSIONS.MIN_WIDTH, this.settings.popupWidth || 500),
      POPUP_DIMENSIONS.MAX_WIDTH
    );
    this.elements.popupContainer.style.width = `${w}px`;
    this.elements.popupContainer.style.height = `${POPUP_DIMENSIONS.DEFAULT_HEIGHT}px`;
  }

  setupManagers() {
    // Tabs we asked Chrome to close and whose removal we're still waiting on
    this._closingTabIds = new Set();
    // Render state: a refresh requested while one is running is queued, not dropped
    this._isRendering = false;
    this._renderQueued = false;
    // A refresh requested while a tab's dropdown menu is open is deferred until it
    // closes, so background tab updates (title/favicon changes) can't rebuild the
    // DOM under the user's cursor and destroy the menu they're about to click.
    this._refreshDeferred = false;
    // Once the user scrolls/clicks we stop auto-centering on 'resize'
    this._userInteracted = false;

    // Selection manager
    this.selectionManager = new SelectionManager({
      onSelectionChange: (selectedTabs) => {
        this.tabManager.updateSelectionState(new Set(selectedTabs));
        this.cancelCloseConfirmation();
        this.updateSelectionInfo();
      },
      onSelectionModeChange: (isActive) => {
        this.elements.popupContainer.classList.toggle(CLASSES.SELECTION_MODE, isActive);
        this.elements.selectionModeBtn?.classList.toggle(CLASSES.ACTIVE, isActive);
        if (this.elements.selectionModeBtn) {
          this.elements.selectionModeBtn.title = isActive ? 'Exit selection mode (Esc)' : 'Select multiple tabs';
        }
        this.cancelCloseConfirmation();
        this.updateSelectionInfo();
      }
    });

    // Tab manager
    this.tabManager = new TabManager({
      container: this.elements.tabContainer,
      settings: this.settings,
      isSelected: (tabId) => this.selectionManager.isSelected(tabId),
      onSectionToggle: () => this.pruneSelectionToVisible(),
      onTabClick: async (tabId, event) => {
        if (this.selectionManager.isInSelectionMode() ||
            event?.ctrlKey || event?.metaKey || event?.shiftKey) {
          this.selectionManager.toggleTab(tabId, event, this.tabManager.getVisibleTabs());
          return;
        }
        try {
          await withTabEditRetry(() => chrome.tabs.update(tabId, { active: true }));
        } catch (err) {
          console.error('Failed to activate tab:', err);
        }
        window.close();
      },
      onTabHover: (tab) => this.updateHoveredTabInfo(tab),
      onTabHoverEnd: () => this.clearHoveredTabInfo(),
      onDropdownAction: (action, tab, tabElement) => {
        if (action === 'toggle') {
          this.dropdownManager.toggle(tabElement, tab, this.elements.popupContainer);
        } else if (action === 'close') {
          this.dropdownManager.closeAll();
          this.closeTab(tab);
        } else {
          this.dropdownManager.closeAll();
          handleDropdownAction(action, tab);
        }
      }
    });

    // Scroll manager
    this.scrollManager = new ScrollManager(this.elements.tabContainer, {
      scrollSpeed: this.settings.scrollSpeed,
      onScrollStart: () => {},
      onScrollEnd: () => {}
    });
    this.scrollManager.setup();

    // Dropdown manager
    this.dropdownManager = new DropdownManager({
      createMenu: (tab) => createDropdownMenu(tab, (action, t) => {
        this.tabManager.onDropdownAction(action, t);
      }),
      onClose: () => {
        if (this._refreshDeferred) {
          this._refreshDeferred = false;
          this.refreshTabList();
        }
      }
    });
    this.dropdownManager.setup();

    // Keyboard navigation
    if (this.settings.keyboardNav) {
      this.keyboardHandler = createKeyboardNavigator({
        getTabs: () => this.tabManager.getTabs(),
        onTabChange: (tabId) => withTabEditRetry(() => chrome.tabs.update(tabId, { active: true }))
          .catch(err => console.error('Failed to activate tab:', err)),
        onClose: () => window.close(),
        onSelectAll: () => this.selectAllVisible(),
        onEscape: () => {
          if (this.dropdownManager.isOpen()) {
            this.dropdownManager.closeAll();
            return true;
          }
          if (this.selectionManager.isInSelectionMode()) {
            this.selectionManager.exitSelectionMode();
            return true;
          }
          return false;
        }
      });
      this.cleanupFns.push(enableKeyboardNavigation(this.keyboardHandler));
    }
  }

  setupEventListeners() {
    // Selection mode + batch actions
    this.elements.selectionModeBtn?.addEventListener('click', () => {
      this.selectionManager.toggleSelectionMode();
    });
    this.elements.selectAllBtn?.addEventListener('click', () => this.selectAllVisible());
    this.elements.deselectAllBtn?.addEventListener('click', () => this.selectionManager.deselectAll());
    this.elements.batchCloseBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.batchCloseSelected();
    });
    this.elements.batchMuteBtn?.addEventListener('click', () => this.batchMuteSelected());
    this.elements.batchPinBtn?.addEventListener('click', () => this.batchPinSelected());
    this.elements.batchWindowBtn?.addEventListener('click', () => this.batchMoveToWindow());
    // Any click elsewhere cancels a pending "confirm close"
    document.addEventListener('click', (e) => {
      if (!this.elements.batchCloseBtn?.contains(e.target)) this.cancelCloseConfirmation();
    });

    // Bug report / feedback form (opens in a tab; the popup is too small for a form)
    this.elements.bugReportBtn?.addEventListener('click', async () => {
      await chrome.tabs.create({ url: chrome.runtime.getURL('feedback/feedback.html') });
      window.close();
    });

    // Settings button
    $(SELECTORS.SETTINGS_BTN)?.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });

    // Filter dropdown toggle
    this.elements.filterBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      const menu = this.elements.filterMenu;
      if (menu) {
        menu.classList.toggle('visible');
        if (menu.classList.contains('visible')) {
          const containerRect = this.elements.popupContainer.getBoundingClientRect();
          menu.style.left = '0';
          menu.style.right = 'auto';
          const menuRect = menu.getBoundingClientRect();
          if (menuRect.right > containerRect.width) {
            menu.style.left = 'auto';
            menu.style.right = '0';
          }
        }
      }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (this.elements.filterDropdown && !this.elements.filterDropdown.contains(e.target)) {
        this.elements.filterMenu?.classList.remove('visible');
      }
    });

    // Search input
    this.elements.searchInput?.addEventListener('input', (e) => {
      this.tabManager.setFilter('searchText', e.target.value);
      this.updateFilterResults();
      this.refreshTabList(false, false);
    });

    // Filter radio buttons (only one active at a time, can click to deselect)
    this.elements.filterMenu?.querySelectorAll('.filter-switch').forEach(label => {
      const radio = label.querySelector('input[type="radio"]');
      if (!radio) return;
      
      label.addEventListener('click', (e) => {
        e.preventDefault();
        
        if (radio.checked && this.tabManager.filters.radio === radio.dataset.filter) {
          radio.checked = false;
          this.tabManager.setFilter('radio', null);
        } else {
          radio.checked = true;
          this.tabManager.setFilter('radio', radio.dataset.filter);
        }
        
        this.updateFilterResults();
        this.refreshTabList(false, false);
      });
    });

    // Clear filters button
    this.elements.clearFiltersBtn?.addEventListener('click', () => {
      this.clearAllFilters();
    });

    // Inline clear filters button
    this.elements.clearFiltersBtnInline?.addEventListener('click', () => {
      this.clearAllFilters();
    });

    // Scroll buttons
    $(SELECTORS.SCROLL_FIRST_BTN)?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.scrollManager.scrollToFirst();
    });
    $(SELECTORS.SCROLL_PAGE_BACK_BTN)?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.scrollManager.scrollPageBack();
    });
    $(SELECTORS.SCROLL_PAGE_FWD_BTN)?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.scrollManager.scrollPageForward();
    });
    $(SELECTORS.SCROLL_LAST_BTN)?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.scrollManager.scrollToLast();
    });

    // Current tab info click
    this.elements.currentTabInfo?.addEventListener('click', () => {
      this.scrollToCurrentTab();
    });

    // Tab counter click
    this.elements.tabCounterWrapper?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.scrollToCurrentTab();
    });

    // Track user interaction so we stop auto-centering once they've moved around
    const markInteracted = () => { this._userInteracted = true; };
    this.elements.tabContainer.addEventListener('wheel', markInteracted, { passive: true });
    this.elements.tabContainer.addEventListener('pointerdown', markInteracted);
    this.elements.popupContainer.querySelectorAll('.nav-btn-inline').forEach(btn => {
      btn.addEventListener('click', markInteracted);
    });

    // Window resize.
    // Chrome fires 'resize' on the action popup on many layout passes (hover,
    // opening a dropdown, ...) even when the size doesn't change. Re-centering
    // on each of those snapped the strip back to the active tab, moving the tab
    // the user was about to close out from under the cursor whenever the active
    // tab was scrolled out of view. Only react to real size changes, and only
    // before the user has started scrolling.
    let lastSize = `${window.innerWidth}x${window.innerHeight}`;
    const handleResize = () => {
      const size = `${window.innerWidth}x${window.innerHeight}`;
      if (size === lastSize) return;
      lastSize = size;
      if (this._userInteracted || this.dropdownManager.isOpen()) return;
      this.tabManager.highlightActiveTab();
      if (this.settings.autoCenter) {
        const activeTab = this.tabManager.getActiveTab();
        const element = activeTab && this.tabManager.findTabElement(activeTab.id);
        if (element) this.scrollManager.centerTab(element);
      }
    };
    window.addEventListener('resize', handleResize);
    this.cleanupFns.push(() => window.removeEventListener('resize', handleResize));

    // Chrome tab events
    this.setupChromeListeners();
  }

  setupChromeListeners() {
    // Debounced refresh to batch multiple rapid events
    this._refreshTimeout = null;
    const debouncedRefresh = () => {
      if (this._refreshTimeout) clearTimeout(this._refreshTimeout);
      this._refreshTimeout = setTimeout(() => {
        this._refreshTimeout = null;
        this.refreshTabList();
      }, 50);
    };

    const listeners = [
      {
        // Activation doesn't change the strip's structure: just re-read the tab
        // list and move the highlight instead of rebuilding the whole DOM.
        event: chrome.tabs.onActivated,
        handler: () => this.syncActiveTab()
      },
      { event: chrome.tabs.onCreated, handler: debouncedRefresh },
      {
        event: chrome.tabs.onRemoved,
        handler: (tabId) => {
          if (this._closingTabIds.has(tabId)) {
            // We closed it ourselves and already removed it from the DOM
            this.tabManager.forgetTab(tabId);
            this.updateTabCounter();
            this.updateFilterResults();
            return;
          }
          debouncedRefresh();
        }
      },
      { event: chrome.tabs.onMoved, handler: debouncedRefresh },
      { event: chrome.tabs.onAttached, handler: debouncedRefresh },
      { event: chrome.tabs.onDetached, handler: debouncedRefresh },
      // Chrome gives a tab a NEW id when it's discarded (Memory Saver) or
      // prerendered. Without this, the popup kept the old id and "Close" failed
      // silently with "No tab with id", so the tab came back on next open.
      { event: chrome.tabs.onReplaced, handler: debouncedRefresh },
      {
        event: chrome.tabs.onUpdated,
        handler: (tabId, changeInfo) => {
          // Only refresh on meaningful changes to avoid scroll jumps
          // Skip 'loading' status to prevent jumps during page reloads
          const shouldRefresh = (
            changeInfo.favIconUrl ||
            changeInfo.audible !== undefined ||
            changeInfo.mutedInfo !== undefined ||
            changeInfo.pinned !== undefined ||
            changeInfo.groupId !== undefined ||
            changeInfo.discarded !== undefined ||
            (changeInfo.status === 'complete' && !changeInfo.title) ||
            // Only update title if it's not a loading title change
            (changeInfo.title && !changeInfo.title.startsWith('http') && changeInfo.status !== 'loading')
          );

          if (shouldRefresh) {
            debouncedRefresh();
          }
        }
      }
    ];

    if (chrome.tabGroups?.onUpdated) {
      listeners.push({
        event: chrome.tabGroups.onUpdated,
        handler: (group) => {
          // Group title/colour changed: drop the cached info so it's re-read
          this.tabManager._groupInfoCache?.delete(group.id);
          debouncedRefresh();
        }
      });
    }

    listeners.forEach(({ event, handler }) => event?.addListener(handler));
    this.cleanupFns.push(() => {
      listeners.forEach(({ event, handler }) => event?.removeListener(handler));
    });
  }

  /**
   * Re-read tabs and move the active highlight without a full re-render
   */
  async syncActiveTab() {
    if (this._isRendering) {
      this._renderQueued = true;
      return;
    }
    await this.tabManager.fetchTabs();
    this._closingTabIds.forEach(id => this.tabManager.forgetTab(id));
    const activeTab = this.tabManager.getActiveTab();
    if (activeTab && !this.tabManager.findTabElement(activeTab.id) && !this.tabManager.hasActiveFilters()) {
      // Active tab isn't in the DOM (e.g. newly created): fall back to a full refresh
      return this.refreshTabList();
    }
    this.tabManager.highlightActiveTab();
    this.updateCurrentTabInfo();
    this.updateTabCounter();
  }

  /**
   * Close a tab from the dropdown menu.
   *
   * The element is removed optimistically for a smooth UX, but the result of
   * chrome.tabs.remove() is now awaited. Previously it was fire-and-forget,
   * so when removal failed (stale id after a discard, tab being dragged, ...)
   * the tab vanished from the popup but stayed open in the browser.
   * @param {chrome.tabs.Tab} tab
   */
  async closeTab(tab) {
    this._closingTabIds.add(tab.id);
    this.selectionManager.deselectTab(tab.id);
    this._removeTabElement(tab.id);

    let closed = false;
    try {
      await withTabEditRetry(() => chrome.tabs.remove(tab.id));
      closed = true;
    } catch (err) {
      // The id may be stale because Chrome replaced the tab (discard/prerender).
      // Look for the same tab (same window, position and URL) under its new id.
      try {
        const current = await chrome.tabs.query({ windowId: tab.windowId });
        const replacement = current.find(t =>
          t.id !== tab.id && t.index === tab.index && t.url === tab.url);
        if (replacement) {
          this._closingTabIds.add(replacement.id);
          await withTabEditRetry(() => chrome.tabs.remove(replacement.id));
          closed = true;
        } else {
          console.error('Failed to close tab:', err);
        }
      } catch (retryErr) {
        console.error('Failed to close tab:', retryErr);
      }
    }

    if (closed) {
      this.tabManager.forgetTab(tab.id);
      this.updateTabCounter();
      this.updateFilterResults();
      // Keep the ids briefly so late onRemoved events are recognised as ours
      setTimeout(() => this._closingTabIds.delete(tab.id), 1000);
    } else {
      // Bring the view back in sync with reality: the tab is still open
      this._closingTabIds.delete(tab.id);
      await this.refreshTabList(false, true);
    }
  }

  async refreshTabList(forceCenter = false, force = false, { skipFetch = false } = {}) {
    // Don't rebuild the DOM under an open dropdown; refresh once it closes
    if (!force && this.dropdownManager?.isOpen()) {
      this._refreshDeferred = true;
      return;
    }
    // A refresh requested mid-render is queued instead of silently dropped,
    // otherwise the popup could keep showing stale tabs (e.g. a closed tab
    // re-appearing after changing a filter).
    if (this._isRendering) {
      this._renderQueued = true;
      return;
    }
    this._isRendering = true;

    try {
      if (!skipFetch) await this.tabManager.fetchTabs();
      // Tabs we're in the middle of closing shouldn't flash back in
      this._closingTabIds.forEach(id => this.tabManager.forgetTab(id));

      // Save scroll anchor before re-render (only if not forcing center)
      const anchor = (this.tabManager.isFirstRender || forceCenter)
        ? null
        : saveScrollAnchor(this.elements.tabContainer);

      await this.tabManager.render();
      // Drop selected tabs that were closed elsewhere or are now hidden by the
      // search/filter, so batch actions only ever touch tabs on screen.
      this.pruneSelectionToVisible();
      
      this.updateCurrentTabInfo();
      this.updateTabCounter();
      this.updateFilterResults();

      // Handle scroll position or auto-center
      if (this.tabManager.isFirstRender) {
        this.tabManager.markFirstRenderComplete();
        if (this.settings.autoCenter) {
          // Use requestAnimationFrame for smoother initial centering
          requestAnimationFrame(() => {
            this.centerOnActiveTabWithRetry(10, 50);
          });
        }
      } else if (forceCenter) {
        // Force center on active tab (e.g., after explicit user actions)
        this.centerOnActiveTabWithRetry(5, 50);
      } else {
        // Restore the previous scroll position synchronously, in the same task
        // as the DOM swap, so the user never sees (or clicks) an un-scrolled strip
        restoreScrollAnchor(this.elements.tabContainer, anchor);
      }
    } catch (error) {
      console.error('Error in refreshTabList:', error);
    } finally {
      this._isRendering = false;
      if (this._renderQueued) {
        this._renderQueued = false;
        this.refreshTabList();
      }
    }
  }

  /**
   * Center on active tab with retry logic for tabs that are still loading
   * @param {number} maxRetries - Maximum number of retry attempts
   * @param {number} delayMs - Delay between retries in milliseconds
   */
  centerOnActiveTabWithRetry(maxRetries = 10, delayMs = 50) {
    let attempts = 0;
    
    const tryCenter = () => {
      attempts++;
      const activeTab = this.tabManager.getActiveTab();
      
      if (activeTab) {
        // First try to find the tab element directly
        let element = this.tabManager.findTabElement(activeTab.id);
        
        // If not found, the tab might be in a collapsed group
        if (!element) {
          // Try to expand all groups and search again
          const collapsedGroups = this.elements.tabContainer.querySelectorAll('.collapsed');
          collapsedGroups.forEach(group => {
            group.classList.remove('collapsed');
            const btn = group.querySelector('.collapse-btn');
            if (btn) btn.textContent = '▼';
          });
          
          // Try finding again after expanding
          element = this.tabManager.findTabElement(activeTab.id);
        }
        
        if (element) {
          // Use requestAnimationFrame for smoother scrolling
          requestAnimationFrame(() => {
            this.scrollManager.centerTab(element);
          });
          return;
        }
      }
      
      // If not found and we have retries left, try again
      if (attempts < maxRetries) {
        setTimeout(tryCenter, delayMs);
      }
    };
    
    // Start immediately for faster response
    tryCenter();
  }

  scrollToCurrentTab() {
    const activeTab = this.tabManager.getActiveTab();
    if (!activeTab) return;

    const tabElement = this.tabManager.findTabElement(activeTab.id);
    if (!tabElement) return;

    // Expand section if collapsed
    const groupSection = tabElement.closest(`.${CLASSES.COLLAPSIBLE_SECTION}`);
    if (groupSection?.classList.contains(CLASSES.COLLAPSED)) {
      groupSection.classList.remove(CLASSES.COLLAPSED);
      const btn = groupSection.querySelector('.collapse-btn');
      if (btn) btn.textContent = '▼';
    }

    setTimeout(() => {
      this.scrollManager.centerTab(tabElement);
    }, 50);
  }

  updateCurrentTabInfo() {
    if (this.selectionManager?.isInSelectionMode()) {
      this.updateSelectionInfo();
      return;
    }
    const info = this.tabManager.getCurrentTabInfo();
    if (this.elements.currentTabTitle) {
      this.elements.currentTabTitle.textContent = info.title;
    }
    if (this.elements.currentTabUrl) {
      this.elements.currentTabUrl.textContent = info.hostname;
    }
  }

  updateHoveredTabInfo(tab) {
    const info = this.tabManager.getTabInfo(tab.id);
    if (info) {
      this.elements.hoveredTabTitle.textContent = info.title;
      this.elements.hoveredTabUrl.textContent = info.hostname;
      this.elements.hoveredTabInfo.style.display = 'flex';
    }
  }

  clearHoveredTabInfo() {
    this.elements.hoveredTabTitle.textContent = '';
    this.elements.hoveredTabUrl.textContent = '';
    this.elements.hoveredTabInfo.style.display = 'none';
  }

  updateTabCounter() {
    const counterText = this.tabManager.getTabCounterText();
    if (this.elements.tabCounter) {
      this.elements.tabCounter.textContent = counterText;
    }
  }

  updateFilterResults() {
    if (!this.elements.filterResults) return;

    if (this.tabManager.hasActiveFilters()) {
      const stats = this.tabManager.getFilterStats();
      this.elements.filterResults.textContent = `${stats.filtered} of ${stats.total}`;
    } else {
      this.elements.filterResults.textContent = '';
    }
    this.updateClearFiltersButton();
  }

  clearAllFilters() {
    this.tabManager.clearFilters();
    if (this.elements.searchInput) {
      this.elements.searchInput.value = '';
    }
    this.elements.filterMenu?.querySelectorAll('.filter-switch input[type="radio"]').forEach(radio => {
      radio.checked = false;
    });
    this.updateFilterResults();
    this.refreshTabList(false, false);
  }

  updateClearFiltersButton() {
    const hasFilters = this.tabManager.hasActiveFilters();
    if (this.elements.clearFiltersBtn) {
      this.elements.clearFiltersBtn.style.display = hasFilters ? 'block' : 'none';
    }
    if (this.elements.clearFiltersBtnInline) {
      this.elements.clearFiltersBtnInline.style.display = hasFilters ? 'block' : 'none';
    }
  }

  // ---------------------------------------------------------------------------
  // Selection
  // ---------------------------------------------------------------------------

  /** Select every tab currently on screen (respects search/filter and collapsed groups) */
  selectAllVisible() {
    const visible = this.tabManager.getVisibleTabs();
    this.selectionManager.selectAll(visible);
  }

  /**
   * Keep the selection limited to tabs the user can see.
   * Called after every render and when a group is collapsed.
   */
  pruneSelectionToVisible() {
    if (!this.selectionManager || this.selectionManager.getSelectionCount() === 0) return;
    const dropped = this.selectionManager.retainOnly(this.tabManager.getVisibleTabs().map(t => t.id));
    if (dropped > 0 && this.tabManager.getTabs().length > 0) {
      this.updateSelectionInfo();
    }
  }

  /**
   * Selected tabs that are actually actionable right now: still open AND visible.
   * Batch actions use only this list (never the raw selection set).
   * @returns {chrome.tabs.Tab[]}
   */
  getActionableSelection() {
    return this.tabManager.getVisibleTabs().filter(t => this.selectionManager.isSelected(t.id));
  }

  updateSelectionInfo() {
    const infoLabel = this.elements.currentTabInfo?.querySelector('.info-label');
    if (!this.selectionManager?.isInSelectionMode()) {
      if (infoLabel) infoLabel.textContent = 'Current Tab';
      const info = this.tabManager.getCurrentTabInfo();
      if (this.elements.currentTabTitle) this.elements.currentTabTitle.textContent = info.title;
      if (this.elements.currentTabUrl) this.elements.currentTabUrl.textContent = info.hostname;
      return;
    }

    const count = this.selectionManager.getSelectionCount();
    const visibleCount = this.tabManager.getVisibleTabs().length;
    const filtered = this.tabManager.hasActiveFilters();
    if (infoLabel) infoLabel.textContent = filtered ? 'Selection Mode · filtered' : 'Selection Mode';
    if (this.elements.currentTabTitle) {
      this.elements.currentTabTitle.textContent = count > 0
        ? `${count} of ${visibleCount} tab${visibleCount === 1 ? '' : 's'} selected`
        : 'Click tabs to select';
    }
    if (this.elements.currentTabUrl) {
      this.elements.currentTabUrl.textContent = count > 0
        ? 'Shift+click for range · Esc to exit'
        : 'Ctrl/Cmd+A selects all shown';
    }
    this.updateBatchActionIcons();
    if (this.elements.selectAllBtn) {
      this.elements.selectAllBtn.title = filtered
        ? `Select all ${visibleCount} filtered tabs`
        : `Select all ${visibleCount} tabs`;
    }
  }

  /** Show Mute/Unmute and Pin/Unpin like the tab menu does, based on the selection */
  updateBatchActionIcons() {
    const selected = this.getActionableSelection();
    const allMuted = selected.length > 0 && selected.every(t => t.mutedInfo?.muted);
    const allPinned = selected.length > 0 && selected.every(t => t.pinned);
    const set = (btn, icon, title) => {
      if (!btn) return;
      if (btn.dataset.icon !== icon) {
        setIcon(btn, icon);
        btn.dataset.icon = icon;
      }
      btn.title = title;
    };
    set(this.elements.batchMuteBtn, allMuted ? 'UNMUTE' : 'MUTE', allMuted ? 'Unmute selected tabs' : 'Mute selected tabs');
    set(this.elements.batchPinBtn, allPinned ? 'UNPIN' : 'PIN', allPinned ? 'Unpin selected tabs' : 'Pin selected tabs');
    set(this.elements.batchWindowBtn, 'OPEN_IN_NEW_WINDOW', 'Move selected tabs to a new window');
  }

  cancelCloseConfirmation() {
    const btn = this.elements.batchCloseBtn;
    if (!btn || !btn.classList.contains('confirming')) return;
    clearTimeout(this._confirmTimer);
    btn.classList.remove('confirming');
    setIcon(btn, 'CLOSE_TABS');
    btn.title = 'Close selected tabs';
  }

  /**
   * Close the selected (visible) tabs.
   * Pinned tabs are skipped. Closing many tabs, or every remaining tab in the
   * window (which would close the window), needs a second click to confirm.
   */
  async batchCloseSelected() {
    const btn = this.elements.batchCloseBtn;
    const selected = this.getActionableSelection();
    const toClose = selected.filter(t => !t.pinned);
    const pinnedSkipped = selected.length - toClose.length;

    if (toClose.length === 0) {
      showMessage(pinnedSkipped ? 'Pinned tabs are not closed in bulk' : 'No tabs selected', 'error');
      return;
    }

    const closesWindow = toClose.length >= this.tabManager.getTabs().length;
    const needsConfirm = closesWindow || toClose.length >= 5;
    if (needsConfirm && !btn.classList.contains('confirming')) {
      btn.classList.add('confirming');
      btn.textContent = closesWindow ? `Close all ${toClose.length} + window?` : `Close ${toClose.length}?`;
      btn.title = 'Click again to confirm';
      clearTimeout(this._confirmTimer);
      this._confirmTimer = setTimeout(() => this.cancelCloseConfirmation(), 4000);
      return;
    }
    this.cancelCloseConfirmation();

    const ids = toClose.map(t => t.id);
    ids.forEach(id => {
      this._closingTabIds.add(id);
      this.tabManager.findTabElement(id)?.classList.add('closing');
    });

    const { closed, failed } = await removeTabs(ids);

    closed.forEach(id => {
      this.tabManager.forgetTab(id);
      this.selectionManager.deselectTab(id);
    });
    setTimeout(() => closed.forEach(id => this._closingTabIds.delete(id)), 1000);
    failed.forEach(id => this._closingTabIds.delete(id));

    let msg = `${closed.length} tab${closed.length === 1 ? '' : 's'} closed`;
    if (pinnedSkipped) msg += ` (${pinnedSkipped} pinned skipped)`;
    if (failed.length) msg += ` · ${failed.length} could not be closed`;
    showMessage(msg, failed.length ? 'error' : 'success');

    // Reconcile with the real tab list (also brings back any tab that failed)
    await this.refreshTabList(false, true);
  }

  /** Read the current state of the selected tabs (the render-time snapshot may be stale) */
  async _freshSelection() {
    const tabs = await Promise.all(
      this.getActionableSelection().map(t => chrome.tabs.get(t.id).catch(() => null))
    );
    return tabs.filter(Boolean);
  }

  async _runBatch(tabs, fn) {
    const results = await Promise.allSettled(tabs.map(t => withTabEditRetry(() => fn(t))));
    const failed = results.filter(r => r.status === 'rejected');
    failed.forEach(r => console.error('Batch action failed:', r.reason));
    return failed.length;
  }

  async batchMuteSelected() {
    const tabs = await this._freshSelection();
    if (tabs.length === 0) return showMessage('No tabs selected', 'error');
    const allMuted = tabs.every(t => t.mutedInfo?.muted);
    const failed = await this._runBatch(tabs, t => chrome.tabs.update(t.id, { muted: !allMuted }));
    showMessage(`${tabs.length - failed} tab${tabs.length === 1 ? '' : 's'} ${allMuted ? 'unmuted' : 'muted'}` +
      (failed ? ` · ${failed} failed` : ''), failed ? 'error' : 'success');
  }

  async batchPinSelected() {
    const tabs = await this._freshSelection();
    if (tabs.length === 0) return showMessage('No tabs selected', 'error');
    const allPinned = tabs.every(t => t.pinned);
    // Pin/unpin sequentially in tab order so the tabs keep their relative order
    const ordered = [...tabs].sort((a, b) => allPinned ? b.index - a.index : a.index - b.index);
    let failed = 0;
    for (const t of ordered) {
      try {
        await withTabEditRetry(() => chrome.tabs.update(t.id, { pinned: !allPinned }));
      } catch (err) {
        failed++;
        console.error('Pin failed:', err);
      }
    }
    showMessage(`${tabs.length - failed} tab${tabs.length === 1 ? '' : 's'} ${allPinned ? 'unpinned' : 'pinned'}` +
      (failed ? ` · ${failed} failed` : ''), failed ? 'error' : 'success');
  }

  async batchMoveToWindow() {
    const tabs = (await this._freshSelection()).sort((a, b) => a.index - b.index);
    const movable = tabs.filter(t => !t.pinned);
    if (movable.length === 0) {
      return showMessage(tabs.length ? 'Pinned tabs cannot be moved' : 'No tabs selected', 'error');
    }
    try {
      const win = await withTabEditRetry(() => chrome.windows.create({ tabId: movable[0].id, type: 'normal' }));
      if (movable.length > 1) {
        await withTabEditRetry(() => chrome.tabs.move(movable.slice(1).map(t => t.id), { windowId: win.id, index: -1 }));
      }
      this.selectionManager.deselectAll();
      showMessage(`${movable.length} tab${movable.length === 1 ? '' : 's'} moved to new window`, 'success');
    } catch (err) {
      console.error('Move to new window failed:', err);
      showMessage('Could not move tabs to a new window', 'error');
      this.refreshTabList(false, true);
    }
  }

  destroy() {
    this.scrollManager?.cleanup();
    this.dropdownManager?.cleanup();
    this.cleanupFns.forEach(fn => fn());
    
    // Clear any pending refresh timeout
    if (this._refreshTimeout) {
      clearTimeout(this._refreshTimeout);
    }
  }

  /**
   * Remove a tab element from the DOM without full re-render
   * @param {number} tabId - Tab ID to remove
   */
  _removeTabElement(tabId) {
    const tabElement = this.tabManager.findTabElement(tabId);
    if (tabElement) {
      // Add closing animation class
      tabElement.classList.add('closing');
      
      // Find the group section this tab belongs to
      const groupSection = tabElement.closest('.tab-group-section');
      
      // Update tab counter immediately (computed from the tab list; the old
      // code parsed the first number out of "On tab X of Y", i.e. X, and
      // produced things like "On tab 36 of 35")
      const remaining = this.tabManager.getTabs().filter(t => t.id !== tabId);
      const activeIndex = remaining.findIndex(t => t.active);
      if (this.settings.showIndices && activeIndex >= 0) {
        this.elements.tabCounter.textContent = `On tab ${activeIndex + 1} of ${remaining.length}`;
      } else {
        this.elements.tabCounter.textContent = `${remaining.length} tabs`;
      }
      
      // Remove after animation completes
      setTimeout(() => {
        tabElement.remove();
        
        // Check if the group section is now empty
        if (groupSection) {
          const remainingTabs = groupSection.querySelectorAll('.tab-item');
          if (remainingTabs.length === 0) {
            groupSection.remove();
          } else {
            // Update the group count
            const countEl = groupSection.querySelector('.group-count');
            if (countEl) {
              countEl.textContent = remainingTabs.length;
            }
          }
        }
      }, 200);
    }
  }
}

// Initialize (named `app`, not `navigator`, so it doesn't shadow window.navigator)
const app = new TabNavigator();
document.addEventListener('DOMContentLoaded', () => app.init());

// Cleanup when popup is hidden/closed
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    app.destroy();
  }
});
