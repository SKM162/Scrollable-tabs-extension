/** @fileoverview Tab Navigator - Main Popup Logic */

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
  createKeyboardNavigator,
  enableKeyboardNavigation,
  saveScrollAnchor,
  restoreScrollAnchor,
  handleDropdownAction,
  setIcon,
  $,
  $$
} from '../modules/index.js';
import { loadSettings } from '../utils/storage.js';

class TabNavigator {
  constructor() {
    this.settings = { ...DEFAULT_SETTINGS };
    this.tabManager = null;
    this.scrollManager = null;
    this.dropdownManager = null;
    this.keyboardHandler = null;
    this.cleanupFns = [];
    this.elements = {};
  }

  async init() {
    // Cache DOM elements after DOM is ready
    this.cacheElements();
    
    await this.loadSettings();
    this.setupTheme();
    this.setupIcons();
    this.setupDimensions();
    this.setupManagers();
    this.setupEventListeners();
    
    await this.refreshTabList();
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
      settingsBtn: $(SELECTORS.SETTINGS_BTN)
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
    setIcon(this.elements.settingsBtn, 'SETTINGS');
    setIcon(this.elements.tabCounterWrapper?.querySelector('.tab-counter-icon'), 'TAB_COUNTER');
  }

  applyTheme(themeSetting) {
    let effectiveTheme = themeSetting;
    
    if (themeSetting === THEMES.AUTO) {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches 
        ? THEMES.DARK 
        : THEMES.LIGHT;
    }
    
    document.documentElement.setAttribute('data-theme', effectiveTheme);
    this.updateThemeButton(effectiveTheme);
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
    
    document.documentElement.setAttribute('data-theme', newTheme);
    this.updateThemeButton(newTheme);
    
    this.settings.theme = newTheme;
  }

  updateThemeButton(theme) {
    if (this.elements.themeToggleBtn) {
      this.elements.themeToggleBtn.innerHTML = theme === THEMES.DARK ? ICONS.DARK_MODE : ICONS.DARK_MODE;
      this.elements.themeToggleBtn.title = theme === THEMES.DARK ? 'Switch to light mode' : 'Switch to dark mode';
    }
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
    // Track tabs being closed to avoid full re-render
    this._closingTabIds = new Set();
    // Grace period after close to batch related events
    this._closeGracePeriod = false;
    // Render lock to prevent concurrent renders
    this._isRendering = false;

    // Tab manager
    this.tabManager = new TabManager({
      container: this.elements.tabContainer,
      settings: this.settings,
      onTabClick: (tabId) => {
        chrome.tabs.update(tabId, { active: true });
        window.close();
      },
      onTabHover: (tab) => this.updateHoveredTabInfo(tab),
      onTabHoverEnd: () => this.clearHoveredTabInfo(),
      onDropdownAction: (action, tab, tabElement) => {
        if (action === 'toggle') {
          this.dropdownManager.toggle(tabElement, tab, this.elements.popupContainer);
        } else if (action === 'close') {
          this.dropdownManager.closeAll();
          // Track this tab as being closed by us BEFORE calling chrome.tabs.remove
          this._closingTabIds.add(tab.id);
          this._closeGracePeriod = true;
          
          // Immediately remove from DOM for smooth UX
          this._removeTabElement(tab.id);
          
          // Call Chrome API to close the tab
          handleDropdownAction(action, tab);
          
          // Clear grace period after all related events should have fired
          setTimeout(() => {
            this._closeGracePeriod = false;
            this._closingTabIds.delete(tab.id);
          }, 500);
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
    this.dropdownManager = new DropdownManager();
    this.dropdownManager.setup();

    // Keyboard navigation
    if (this.settings.keyboardNav) {
      this.keyboardHandler = createKeyboardNavigator({
        getTabs: () => this.tabManager.getTabs(),
        onTabChange: (tabId) => chrome.tabs.update(tabId, { active: true }),
        onClose: () => window.close()
      });
      this.cleanupFns.push(enableKeyboardNavigation(this.keyboardHandler));
    }
  }

  setupEventListeners() {
    // Settings button
    $(SELECTORS.SETTINGS_BTN)?.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
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

    // Window resize
    const handleResize = () => {
      this.tabManager.highlightActiveTab();
      if (this.settings.autoCenter) {
        const activeTab = this.tabManager.getActiveTab();
        if (activeTab) {
          const element = this.tabManager.findTabElement(activeTab.id);
          if (element) {
            this.scrollManager.centerTab(element);
          }
        }
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
    const debouncedRefresh = (source) => {
      if (this._refreshTimeout) clearTimeout(this._refreshTimeout);
      this._refreshTimeout = setTimeout(() => {
        // Skip refresh during close grace period
        if (this._closeGracePeriod) {
          return;
        }
        this.refreshTabList();
      }, 50);
    };

    const listeners = [
      { event: chrome.tabs.onActivated, handler: (activeInfo) => {
        // Skip if we're in close grace period (Chrome auto-activates another tab after close)
        if (this._closeGracePeriod) {
          return;
        }
        debouncedRefresh('onActivated');
      }},
      { event: chrome.tabs.onCreated, handler: () => debouncedRefresh('onCreated') },
      { event: chrome.tabs.onRemoved, handler: (tabId) => {
        // Skip if we closed this tab ourselves (already handled)
        if (this._closingTabIds.has(tabId)) {
          return; // Don't delete here - let the timeout handle it
        }

        // Skip refresh during close grace period
        if (this._closeGracePeriod) {
          return;
        }

        debouncedRefresh('onRemoved');
      }},
      { event: chrome.tabs.onMoved, handler: () => debouncedRefresh('onMoved') },
      {
        event: chrome.tabs.onUpdated,
        handler: (tabId, changeInfo) => {
          // Skip refresh during close grace period
          if (this._closeGracePeriod) {
            return;
          }
          // Only refresh on meaningful changes to avoid scroll jumps
          // Skip 'loading' status to prevent jumps during page reloads
          const shouldRefresh = (
            changeInfo.favIconUrl ||
            changeInfo.audible !== undefined ||
            changeInfo.mutedInfo !== undefined ||
            changeInfo.pinned !== undefined ||
            changeInfo.groupId !== undefined ||
            (changeInfo.status === 'complete' && !changeInfo.title) ||
            // Only update title if it's not a loading title change
            (changeInfo.title && !changeInfo.title.startsWith('http') && changeInfo.status !== 'loading')
          );

          if (shouldRefresh) {
            debouncedRefresh('onUpdated');
          }
        }
      }
    ];

    if (chrome.tabGroups?.onUpdated) {
      listeners.push({
        event: chrome.tabGroups.onUpdated,
        handler: () => {
          // Skip refresh during close grace period
          if (this._closeGracePeriod) {
            return;
          }
          this.refreshTabList();
        }
      });
    }

    listeners.forEach(({ event, handler }) => event.addListener(handler));
    this.cleanupFns.push(() => {
      listeners.forEach(({ event, handler }) => event.removeListener(handler));
    });
  }

  async refreshTabList(forceCenter = false, skipIfClosing = true) {
    // Skip if already rendering
    if (this._isRendering) {
      return;
    }
    this._isRendering = true;

    try {
      // Skip re-render if we just closed a tab ourselves (DOM already updated)
      if (skipIfClosing && this._closingTabIds.size > 0) {
        // Still update the internal tab list but don't re-render
        await this.tabManager.fetchTabs();
        this.updateCurrentTabInfo();
        return;
      }

      // Save scroll anchor before re-render (only if not forcing center)
      const anchor = (this.tabManager.isFirstRender || forceCenter)
        ? null
        : saveScrollAnchor(this.elements.tabContainer);

      await this.tabManager.fetchTabs();
      await this.tabManager.render();
      
      this.updateCurrentTabInfo();
      this.updateTabCounter();

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
        // Restore previous scroll position after DOM settles
        requestAnimationFrame(() => {
          restoreScrollAnchor(this.elements.tabContainer, anchor);
        });
      }
    } catch (error) {
      console.error('Error in refreshTabList:', error);
    } finally {
      this._isRendering = false;
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
      
      // Update tab counter immediately
      const currentCount = parseInt(this.elements.tabCounter.textContent.match(/\d+/)?.[0] || '0');
      const newCount = Math.max(0, currentCount - 1);
      const activeIndex = this.tabManager.getTabs().findIndex(t => t.active);
      if (this.settings.showIndices && activeIndex >= 0) {
        this.elements.tabCounter.textContent = `On tab ${activeIndex + 1} of ${newCount}`;
      } else {
        this.elements.tabCounter.textContent = `${newCount} tabs`;
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
        
        // Clean up tracking
        this._closingTabIds.delete(tabId);
      }, 200);
    }
  }
}

// Initialize
const navigator = new TabNavigator();
document.addEventListener('DOMContentLoaded', () => navigator.init());

// Cleanup when popup is hidden/closed
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    navigator.destroy();
  }
});
