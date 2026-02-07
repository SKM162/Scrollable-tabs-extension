/** @fileoverview Tab Navigator - Main Popup Logic */

import {
  DEFAULT_SETTINGS,
  SELECTORS,
  POPUP_DIMENSIONS,
  CLASSES,
  TabManager,
  ScrollManager,
  DropdownManager,
  createKeyboardNavigator,
  enableKeyboardNavigation,
  saveScrollAnchor,
  restoreScrollAnchor,
  handleDropdownAction,
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
      tabCounterWrapper: $(SELECTORS.TAB_COUNTER_WRAPPER)
    };
  }

  async loadSettings() {
    this.settings = await loadSettings(DEFAULT_SETTINGS);
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
    const listeners = [
      { event: chrome.tabs.onActivated, handler: () => this.refreshTabList() },
      { event: chrome.tabs.onCreated, handler: () => this.refreshTabList() },
      { event: chrome.tabs.onRemoved, handler: () => this.refreshTabList() },
      { event: chrome.tabs.onMoved, handler: () => this.refreshTabList() },
      {
        event: chrome.tabs.onUpdated,
        handler: (tabId, changeInfo) => {
          if (changeInfo.title || changeInfo.favIconUrl || changeInfo.audible !== undefined ||
              changeInfo.mutedInfo !== undefined || changeInfo.pinned !== undefined) {
            this.refreshTabList();
            
            const activeTab = this.tabManager.getActiveTab();
            if (activeTab && activeTab.id === tabId) {
              this.updateCurrentTabInfo();
            }
          }
        }
      }
    ];

    if (chrome.tabGroups?.onUpdated) {
      listeners.push({
        event: chrome.tabGroups.onUpdated,
        handler: () => this.refreshTabList()
      });
    }

    listeners.forEach(({ event, handler }) => event.addListener(handler));
    this.cleanupFns.push(() => {
      listeners.forEach(({ event, handler }) => event.removeListener(handler));
    });
  }

  async refreshTabList() {
    try {
      // Save scroll anchor before re-render
      const anchor = this.tabManager.isFirstRender
        ? null
        : saveScrollAnchor(this.elements.tabContainer);

      await this.tabManager.fetchTabs();
      await this.tabManager.render();
      
      this.updateCurrentTabInfo();
      this.updateTabCounter();

      // Restore scroll position or auto-center
      if (!this.tabManager.isFirstRender) {
        restoreScrollAnchor(this.elements.tabContainer, anchor);
      } else if (this.settings.autoCenter) {
        this.tabManager.markFirstRenderComplete();
        setTimeout(() => {
          const activeTab = this.tabManager.getActiveTab();
          if (activeTab) {
            const element = this.tabManager.findTabElement(activeTab.id);
            if (element) {
              this.scrollManager.centerTab(element);
            }
          }
        }, 100);
      } else {
        this.tabManager.markFirstRenderComplete();
      }
    } catch (error) {
      console.error('Error in refreshTabList:', error);
    }
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
  }
}

// Initialize
const navigator = new TabNavigator();
document.addEventListener('DOMContentLoaded', () => navigator.init());

// Cleanup on unload
window.addEventListener('unload', () => navigator.destroy());
