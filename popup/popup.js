// Tab Navigator - Main Popup Logic

let tabs = [];
let settings = {
  visibleTabs: 7,
  popupWidth: 800,
  showTitles: true,
  showIndices: true,
  animationSpeed: 200,
  colorTheme: 'auto',
  faviconSize: 'medium',
  highlightStyle: 'border',
  autoCenter: true,
  keyboardNav: true,
  scrollSpeed: 1.0,
  showCenterInfo: true
};

const tabContainer = document.getElementById('tabContainer');
const tabCounter = document.getElementById('tabCounter');
const popupContainer = document.getElementById('popupContainer');
const currentTabTitle = document.getElementById('currentTabTitle');
const currentTabUrl = document.getElementById('currentTabUrl');
const currentTabInfo = document.getElementById('currentTabInfo');
const hoveredTabTitle = document.getElementById('hoveredTabTitle');
const hoveredTabUrl = document.getElementById('hoveredTabUrl');
const hoveredTabInfo = document.getElementById('hoveredTabInfo');
const tabCounterWrapper = document.getElementById('tabCounterWrapper');
const hoverActionsBar = document.getElementById('hoverActionsBar');
const hoverPinBtn = document.getElementById('hoverPinBtn');
const hoverMuteBtn = document.getElementById('hoverMuteBtn');
const hoverCloseBtn = document.getElementById('hoverCloseBtn');
let hoveredTab = null;
let actionsTargetTab = null;  // tab the bar was shown for
let lastTargetTab = null;     // fallback when hover is cleared before click (e.g. slow move to button)
let hideActionsTimeout = null;
let scrollPriorityTimeout = null;
let isFirstRender = true;

function getTargetTab() {
  return hoveredTab || actionsTargetTab || lastTargetTab;
}

// Initialize
async function init() {
  // Load settings from storage
  await loadSettings();
  
  // Fixed compact size – responsive (scroll shows all), no fluid resizing
  const w = Math.min(Math.max(400, settings.popupWidth || 500), 800);
  const h = 280;
  popupContainer.style.width = `${w}px`;
  popupContainer.style.height = `${h}px`;
  
  // Setup hover action buttons
  setupHoverActions();
  
  // Set up settings button
  setupSettingsButton();
  
  // Set up scroll navigation buttons
  document.getElementById('scrollFirstBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    scrollToFirst();
  });
  document.getElementById('scrollPageBackBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    scrollPageBack();
  });
  document.getElementById('scrollPageFwdBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    scrollPageForward();
  });
  document.getElementById('scrollLastBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    scrollToLast();
  });
  
  // Make current tab info clickable
  currentTabInfo.addEventListener('click', () => {
    scrollToCurrentTab();
  });
  
  // Make tab counter (with icon) clickable – goes to current tab
  tabCounterWrapper.addEventListener('click', (e) => {
    e.stopPropagation();
    scrollToCurrentTab();
  });
  
  // Fetch and render tabs
  await refreshTabList();
  
  // Set up event listeners
  setupEventListeners();
}

// Setup settings button
function setupSettingsButton() {
  document.getElementById('settingsBtn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
}

// Setup hover action buttons
function setupHoverActions() {
  hoverPinBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const tab = getTargetTab();
    if (tab) {
      chrome.tabs.update(tab.id, { pinned: !tab.pinned });
    }
  });
  
  hoverMuteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const tab = getTargetTab();
    if (tab) {
      chrome.tabs.update(tab.id, { muted: !tab.mutedInfo?.muted });
    }
  });
  
  // Use mousedown so we capture tabId and close before any mouseleave can hide the bar and steal the click
  hoverCloseBtn.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const tabId = hoverCloseBtn.dataset.tabId ? parseInt(hoverCloseBtn.dataset.tabId, 10) : null;
    const tab = tabId ? { id: tabId } : getTargetTab();
    if (tab && tab.id) {
      chrome.tabs.remove(tab.id);
      lastTargetTab = null;
      hoverCloseBtn.dataset.tabId = '';
      hideHoverActions();
    }
  });
}

// Load settings from chrome.storage
async function loadSettings() {
  try {
    const stored = await chrome.storage.sync.get(settings);
    settings = { ...settings, ...stored };
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

// Fetch all tabs in current window
async function refreshTabList() {
  try {
    // Query tabs in current window (popup context)
    tabs = await chrome.tabs.query({ currentWindow: true });
    
    renderTabs();
  } catch (error) {
    console.error('Error fetching tabs:', error);
  }
}

// Render all tabs grouped by pinned status and tab groups
async function renderTabs() {
  const savedScrollLeft = tabContainer.scrollLeft;
  const savedScrollTop = tabContainer.scrollTop;
  // Anchor: tab at top-left of viewport so we can restore same logical position after re-render
  let anchorTabId = null;
  let offsetInAnchorX = 0;
  let offsetInAnchorY = 0;
  if (!isFirstRender) {
    const containerRect = tabContainer.getBoundingClientRect();
    for (const el of tabContainer.querySelectorAll('[data-tab-id]')) {
      const r = el.getBoundingClientRect();
      const contentLeft = r.left - containerRect.left + savedScrollLeft;
      const contentTop = r.top - containerRect.top + savedScrollTop;
      if (contentLeft + r.width >= savedScrollLeft && contentTop + r.height >= savedScrollTop &&
          contentLeft <= savedScrollLeft + tabContainer.clientWidth && contentTop <= savedScrollTop + tabContainer.clientHeight) {
        anchorTabId = el.dataset.tabId;
        offsetInAnchorX = savedScrollLeft - contentLeft;
        offsetInAnchorY = savedScrollTop - contentTop;
        break;
      }
    }
    if (!anchorTabId) {
      // No tab under viewport top-left: use first tab that starts after scroll position
      let best = null;
      let bestDist = Infinity;
      for (const el of tabContainer.querySelectorAll('[data-tab-id]')) {
        const r = el.getBoundingClientRect();
        const contentLeft = r.left - containerRect.left + savedScrollLeft;
        const contentTop = r.top - containerRect.top + savedScrollTop;
        const dist = Math.max(0, contentTop - savedScrollTop) + Math.max(0, contentLeft - savedScrollLeft);
        if (dist < bestDist) { bestDist = dist; best = el; }
      }
      if (best) {
        anchorTabId = best.dataset.tabId;
        const r = best.getBoundingClientRect();
        const contentLeft = r.left - containerRect.left + savedScrollLeft;
        const contentTop = r.top - containerRect.top + savedScrollTop;
        offsetInAnchorX = savedScrollLeft - contentLeft;
        offsetInAnchorY = savedScrollTop - contentTop;
      }
    }
  }
  tabContainer.innerHTML = '';
  
  // Separate pinned and unpinned tabs, preserving original order
  const pinnedTabs = [];
  const unpinnedTabs = [];
  
  // Process tabs in their original order to preserve sequence
  tabs.forEach(tab => {
    if (tab.pinned) {
      pinnedTabs.push(tab);
    } else {
      unpinnedTabs.push(tab);
    }
  });
  
  // Group unpinned tabs by groupId, preserving order within groups
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
  
  // Sort groups by the minimum index of tabs in each group (preserve original order)
  const sortedGroups = Object.entries(groupedTabs).sort(([groupIdA, tabsA], [groupIdB, tabsB]) => {
    const minIndexA = Math.min(...tabsA.map(t => tabs.findIndex(orig => orig.id === t.id)));
    const minIndexB = Math.min(...tabsB.map(t => tabs.findIndex(orig => orig.id === t.id)));
    return minIndexA - minIndexB;
  });
  
  // Sort tabs within each group by their original index
  sortedGroups.forEach(([groupId, groupTabs]) => {
    groupTabs.sort((a, b) => {
      const indexA = tabs.findIndex(t => t.id === a.id);
      const indexB = tabs.findIndex(t => t.id === b.id);
      return indexA - indexB;
    });
  });
  
  // Render pinned tabs section
  if (pinnedTabs.length > 0) {
    const pinnedSection = await createTabGroupSection('pinned', pinnedTabs, 'Pinned', true);
    tabContainer.appendChild(pinnedSection);
    
    // Add divider after pinned tabs
    const divider = document.createElement('div');
    divider.className = 'tab-divider';
    tabContainer.appendChild(divider);
  }
  
  // Render unpinned tabs in their original order, grouping consecutive tabs with the same groupId
  let currentGroupId = null;
  let currentGroupTabs = [];
  let currentUngroupedTabs = [];
  
  for (const tab of unpinnedTabs) {
    const tabGroupId = tab.groupId && tab.groupId !== chrome.tabs.TAB_ID_NONE ? tab.groupId : null;
    
    if (tabGroupId) {
      // Tab belongs to a group
      if (currentGroupId === tabGroupId) {
        // Continue current group
        currentGroupTabs.push(tab);
      } else {
        // New group - render previous section first
        if (currentUngroupedTabs.length > 0) {
          const ungroupedSection = await createTabGroupSection('ungrouped', currentUngroupedTabs, 'Other Tabs', false);
          tabContainer.appendChild(ungroupedSection);
          currentUngroupedTabs = [];
        }
        if (currentGroupTabs.length > 0) {
          const groupSection = await createTabGroupSection(currentGroupId, currentGroupTabs, `Group ${currentGroupId}`, false);
          tabContainer.appendChild(groupSection);
        }
        // Start new group
        currentGroupId = tabGroupId;
        currentGroupTabs = [tab];
      }
    } else {
      // Tab is ungrouped
      if (currentGroupId !== null) {
        // Render current group first
        const groupSection = await createTabGroupSection(currentGroupId, currentGroupTabs, `Group ${currentGroupId}`, false);
        tabContainer.appendChild(groupSection);
        currentGroupId = null;
        currentGroupTabs = [];
      }
      currentUngroupedTabs.push(tab);
    }
  }
  
  // Render remaining sections
  if (currentUngroupedTabs.length > 0) {
    const ungroupedSection = await createTabGroupSection('ungrouped', currentUngroupedTabs, 'Other Tabs', false);
    tabContainer.appendChild(ungroupedSection);
  }
  if (currentGroupTabs.length > 0) {
    const groupSection = await createTabGroupSection(currentGroupId, currentGroupTabs, `Group ${currentGroupId}`, false);
    tabContainer.appendChild(groupSection);
  }
  
  // Update current tab info
  updateCurrentTabInfo();
  
  // Update tab counter
  updateTabCounter();
  
  // Restore scroll when re-rendering: keep same tab at same viewport position (anchor) or raw scroll
  if (!isFirstRender) {
    if (anchorTabId) {
      const anchorEl = tabContainer.querySelector(`[data-tab-id="${anchorTabId}"]`);
      if (anchorEl) {
        const containerRect = tabContainer.getBoundingClientRect();
        const r = anchorEl.getBoundingClientRect();
        const contentLeft = r.left - containerRect.left + tabContainer.scrollLeft;
        const contentTop = r.top - containerRect.top + tabContainer.scrollTop;
        const newScrollLeft = contentLeft - offsetInAnchorX;
        const newScrollTop = contentTop - offsetInAnchorY;
        const maxL = Math.max(0, tabContainer.scrollWidth - tabContainer.clientWidth);
        const maxT = Math.max(0, tabContainer.scrollHeight - tabContainer.clientHeight);
        tabContainer.scrollLeft = Math.max(0, Math.min(newScrollLeft, maxL));
        tabContainer.scrollTop = Math.max(0, Math.min(newScrollTop, maxT));
      } else {
        tabContainer.scrollLeft = Math.min(savedScrollLeft, Math.max(0, tabContainer.scrollWidth - tabContainer.clientWidth));
        tabContainer.scrollTop = Math.min(savedScrollTop, Math.max(0, tabContainer.scrollHeight - tabContainer.clientHeight));
      }
    } else {
      tabContainer.scrollLeft = Math.min(savedScrollLeft, Math.max(0, tabContainer.scrollWidth - tabContainer.clientWidth));
      tabContainer.scrollTop = Math.min(savedScrollTop, Math.max(0, tabContainer.scrollHeight - tabContainer.clientHeight));
    }
  } else if (settings.autoCenter) {
    isFirstRender = false;
    setTimeout(() => {
      const activeTab = tabs.find(t => t.active);
      if (activeTab) {
        const activeTabElement = tabContainer.querySelector(`[data-tab-id="${activeTab.id}"]`);
        if (activeTabElement) {
          centerTab(activeTabElement);
        }
      }
    }, 100);
  } else {
    isFirstRender = false;
  }
}

// Create a tab group section
async function createTabGroupSection(groupId, groupTabs, label, isPinned) {
  const section = document.createElement('div');
  section.className = `tab-group-section ${isPinned ? 'pinned-section' : 'collapsible-section'}`;
  section.dataset.groupId = groupId;
  
  let groupTitle = label;
  let groupColor = null;
  
  // Get group info if available
  if (!isPinned && groupTabs.length > 0 && groupTabs[0].groupId && chrome.tabGroups) {
    try {
      const groupInfo = await chrome.tabGroups.get(groupTabs[0].groupId);
      if (groupInfo) {
        groupTitle = groupInfo.title || label;
        groupColor = groupInfo.color;
        
        // Apply group color as section background (Chrome returns color name, not hex)
        const resolved = resolveGroupColor(groupColor);
        if (resolved) {
          const { rgb, hex } = resolved;
          section.style.backgroundColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.28)`;
          section.style.borderLeft = `3px solid ${hex}`;
        }
      }
    } catch (e) {
      // Tab groups API not available or error
    }
  }
  
  // Section header
  if (isPinned) {
    const header = document.createElement('div');
    header.className = 'group-header group-header-pinned';
    header.innerHTML = `
      <span class="group-label">${groupTitle}</span>
      <span class="group-count">${groupTabs.length}</span>
    `;
    section.appendChild(header);
  } else if (groupTabs.length >= 1) {
    // Show header for all non-pinned sections (groups and Other Tabs), including single-tab groups/sections
    const header = document.createElement('div');
    header.className = 'group-header';
    header.innerHTML = `
      <span class="group-label">${groupTitle}</span>
      <span class="group-count">${groupTabs.length}</span>
      <button class="collapse-btn">◀</button>
    `;
    header.addEventListener('click', () => {
      section.classList.toggle('collapsed');
      const btn = header.querySelector('.collapse-btn');
      btn.textContent = section.classList.contains('collapsed') ? '◀' : '▼';
    });
    section.appendChild(header);
  }
  
  // Tabs container
  const tabsContainer = document.createElement('div');
  tabsContainer.className = 'group-tabs-container';
  
  groupTabs.forEach((tab, index) => {
    const tabElement = createTabElement(tab, index);
    tabsContainer.appendChild(tabElement);
  });
  
  section.appendChild(tabsContainer);
  
  return section;
}

// Create a tab element
function createTabElement(tab, index) {
  const div = document.createElement('div');
  div.className = 'tab-item';
  div.dataset.tabId = tab.id;
  div.dataset.index = index;
  
  if (tab.active) {
    div.classList.add('active-tab');
  }
  
  // Favicon (chrome:// URLs cannot be loaded in extension pages)
  const favicon = document.createElement('img');
  favicon.className = 'favicon';
  const faviconUrl = tab.favIconUrl && !tab.favIconUrl.startsWith('chrome://')
    ? tab.favIconUrl
    : null;
  if (faviconUrl) {
    // Cache-bust so updated favicons (same URL, new content) show live
    const sep = faviconUrl.includes('?') ? '&' : '?';
    favicon.src = `${faviconUrl}${sep}t=${tab.id}-${Date.now()}`;
    favicon.onerror = () => {
      favicon.src = chrome.runtime.getURL('assets/default-favicon.svg');
    };
  } else {
    favicon.src = chrome.runtime.getURL('assets/default-favicon.svg');
  }
  div.appendChild(favicon);
  
  // Title
  if (settings.showTitles) {
    const title = document.createElement('span');
    title.className = 'title';
    title.textContent = tab.title || 'New Tab';
    title.title = tab.title || 'New Tab';
    div.appendChild(title);
  }
  
  // Tab group indicator (if Chrome supports it) - for reference only; section enclosure is tinted, not individual tabs
  if (tab.groupId && tab.groupId !== chrome.tabs.TAB_ID_NONE && chrome.tabGroups) {
    chrome.tabGroups.get(tab.groupId).then(groupInfo => {
      if (groupInfo) {
        const resolved = resolveGroupColor(groupInfo.color) || resolveGroupColor('blue');
        if (resolved) {
          div.dataset.groupColor = resolved.hex;
          div.dataset.groupTitle = groupInfo.title || 'Untitled';
        }
      }
    }).catch(() => {});
  }
  
  // Pin indicator (top right corner)
  if (tab.pinned) {
    const pinIndicator = document.createElement('span');
    pinIndicator.className = 'indicator pin-indicator';
    pinIndicator.textContent = '📌';
    pinIndicator.title = 'Pinned';
    div.appendChild(pinIndicator);
  }
  
  if (tab.audible) {
    const audioIndicator = document.createElement('span');
    audioIndicator.className = 'indicator audio-indicator';
    audioIndicator.textContent = '🔊';
    audioIndicator.title = 'Audio playing';
    div.appendChild(audioIndicator);
  }
  
  // Picture-in-Picture indicator (check if tab is in PiP)
  if (tab.audible && tab.mutedInfo && !tab.mutedInfo.muted) {
    // Check for PiP - Chrome doesn't expose this directly, but we can infer
    const pipIndicator = document.createElement('span');
    pipIndicator.className = 'indicator pip-indicator';
    pipIndicator.textContent = '📺';
    pipIndicator.title = 'Picture-in-Picture';
    div.appendChild(pipIndicator);
  }
  
  // Hover handlers for showing tab info and actions (skipped while scrolling so scroll feels smooth)
  div.addEventListener('mouseenter', () => {
    if (tabContainer.classList.contains('is-scrolling')) return;
    // Clear any pending hide timeout
    if (hideActionsTimeout) {
      clearTimeout(hideActionsTimeout);
      hideActionsTimeout = null;
    }
    
    hoveredTab = tab;
    updateHoveredTabInfo(tab);
    showHoverActions(tab);
  });
  
  div.addEventListener('mouseleave', () => {
    // Delay hiding to allow moving to action buttons - longer delay for better UX
    hideActionsTimeout = setTimeout(() => {
      // Only hide if not hovering over actions bar or any tab
      if (!hoverActionsBar.matches(':hover') && !document.querySelector('.tab-item:hover')) {
        clearHoveredTabInfo();
        hideHoverActions();
      }
    }, 300); // Increased delay to 300ms for easier access
  });
  
  // Click handler
  div.addEventListener('click', (e) => {
    chrome.tabs.update(tab.id, { active: true });
    window.close();
  });
  
  return div;
}

// Scroll navigation: first, last, page back, page forward
function scrollToFirst() {
  tabContainer.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
}

function scrollToLast() {
  const left = tabContainer.scrollWidth - tabContainer.clientWidth;
  const top = tabContainer.scrollHeight - tabContainer.clientHeight;
  tabContainer.scrollTo({ left: Math.max(0, left), top: Math.max(0, top), behavior: 'smooth' });
}

function scrollPageBack() {
  const w = tabContainer.clientWidth;
  const h = tabContainer.clientHeight;
  const left = Math.max(0, tabContainer.scrollLeft - w);
  const top = Math.max(0, tabContainer.scrollTop - h);
  tabContainer.scrollTo({ left, top, behavior: 'smooth' });
}

function scrollPageForward() {
  const w = tabContainer.clientWidth;
  const h = tabContainer.clientHeight;
  const maxLeft = Math.max(0, tabContainer.scrollWidth - w);
  const maxTop = Math.max(0, tabContainer.scrollHeight - h);
  const left = Math.min(maxLeft, tabContainer.scrollLeft + w);
  const top = Math.min(maxTop, tabContainer.scrollTop + h);
  tabContainer.scrollTo({ left, top, behavior: 'smooth' });
}

// Scroll to current tab
function scrollToCurrentTab() {
  const activeTab = tabs.find(t => t.active);
  if (!activeTab) return;
  
  const tabElement = tabContainer.querySelector(`[data-tab-id="${activeTab.id}"]`);
  if (!tabElement) return;
  
  // Expand the section containing the active tab if collapsed
  const groupSection = tabElement.closest('.collapsible-section');
  if (groupSection && groupSection.classList.contains('collapsed')) {
    groupSection.classList.remove('collapsed');
    const btn = groupSection.querySelector('.collapse-btn');
    if (btn) btn.textContent = '▼';
  }
  
  // Wait a bit for the section to expand, then scroll
  setTimeout(() => {
    centerTab(tabElement);
  }, 50);
}

// Center the active tab
function centerActiveTab() {
  scrollToCurrentTab();
}

// Center a specific tab element
function centerTab(tabElement) {
  const containerWidth = tabContainer.offsetWidth;
  const containerHeight = tabContainer.offsetHeight;
  const containerScrollWidth = tabContainer.scrollWidth;
  const containerScrollHeight = tabContainer.scrollHeight;
  
  // Get the tab's position relative to the viewport
  const tabRect = tabElement.getBoundingClientRect();
  const containerRect = tabContainer.getBoundingClientRect();
  
  // Calculate the tab's position relative to the scrollable container
  // This accounts for nested parent elements (group-tabs-container, tab-group-section)
  const tabOffsetLeft = tabRect.left - containerRect.left + tabContainer.scrollLeft;
  const tabOffsetTop = tabRect.top - containerRect.top + tabContainer.scrollTop;
  const tabWidth = tabRect.width;
  const tabHeight = tabRect.height;
  
  // Calculate horizontal scroll position to center the tab
  let scrollLeft = tabOffsetLeft - (containerWidth / 2) + (tabWidth / 2);
  const maxScrollLeft = containerScrollWidth - containerWidth;
  scrollLeft = Math.max(0, Math.min(scrollLeft, maxScrollLeft));
  
  // Calculate vertical scroll position to bring tab into view
  // We want to scroll so the tab is visible, not necessarily centered vertically
  let scrollTop = tabContainer.scrollTop;
  const tabTop = tabOffsetTop;
  const tabBottom = tabTop + tabHeight;
  const visibleTop = scrollTop;
  const visibleBottom = scrollTop + containerHeight;
  
  // If tab is above visible area, scroll up
  if (tabTop < visibleTop) {
    scrollTop = tabTop - 10; // Add small padding
  }
  // If tab is below visible area, scroll down
  else if (tabBottom > visibleBottom) {
    scrollTop = tabBottom - containerHeight + 10; // Add small padding
  }
  
  const maxScrollTop = containerScrollHeight - containerHeight;
  scrollTop = Math.max(0, Math.min(scrollTop, maxScrollTop));
  
  // Only scroll if needed
  const currentScrollLeft = tabContainer.scrollLeft;
  const currentScrollTop = tabContainer.scrollTop;
  
  if (Math.abs(currentScrollLeft - scrollLeft) > 5 || Math.abs(currentScrollTop - scrollTop) > 5) {
    tabContainer.scrollTo({
      left: scrollLeft,
      top: scrollTop,
      behavior: 'smooth'
    });
    
    // Ensure active tab is highlighted after scroll
    setTimeout(() => {
      ensureActiveTabHighlighted();
    }, 350);
  } else {
    ensureActiveTabHighlighted();
  }
}

// Ensure active tab is properly highlighted (no center tab logic needed)
function ensureActiveTabHighlighted() {
  const activeTab = tabs.find(t => t.active);
  if (activeTab) {
    const activeTabElement = tabContainer.querySelector(`[data-tab-id="${activeTab.id}"]`);
    if (activeTabElement) {
      // Remove active-tab class from all tabs
      document.querySelectorAll('.tab-item.active-tab').forEach(el => {
        el.classList.remove('active-tab');
      });
      // Add active-tab class to current active tab
      activeTabElement.classList.add('active-tab');
      
      // Expand the section containing the active tab if collapsed
      const groupSection = activeTabElement.closest('.collapsible-section');
      if (groupSection && groupSection.classList.contains('collapsed')) {
        groupSection.classList.remove('collapsed');
        const btn = groupSection.querySelector('.collapse-btn');
        if (btn) btn.textContent = '▼';
      }
    }
  }
}

// Chrome tab group color names (API returns these, not hex)
const CHROME_GROUP_COLORS = {
  grey: '#5f6368',
  blue: '#4285f4',
  red: '#ea4335',
  yellow: '#fbbc04',
  green: '#34a853',
  pink: '#f538a0',
  purple: '#a142f4',
  cyan: '#24c1e0',
  orange: '#ff9800'
};

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Resolve Chrome group color (named string or hex) to { rgb, hex }
function resolveGroupColor(color) {
  if (!color) return null;
  const hex = CHROME_GROUP_COLORS[color] || (color.startsWith('#') ? color : null);
  if (!hex) return null;
  const rgb = hexToRgb(hex);
  return rgb ? { rgb, hex } : null;
}

// Update current tab information display
function updateCurrentTabInfo() {
  const activeTab = tabs.find(t => t.active);
  if (activeTab) {
    currentTabTitle.textContent = activeTab.title || 'New Tab';
    currentTabUrl.textContent = activeTab.url ? new URL(activeTab.url).hostname : '';
  } else {
    currentTabTitle.textContent = 'No active tab';
    currentTabUrl.textContent = '';
  }
}

// Update hovered tab information display
function updateHoveredTabInfo(tab) {
  hoveredTabTitle.textContent = tab.title || 'New Tab';
  hoveredTabUrl.textContent = tab.url ? new URL(tab.url).hostname : '';
  hoveredTabInfo.style.display = 'flex';
}

// Clear hovered tab information
function clearHoveredTabInfo() {
  hoveredTabTitle.textContent = '';
  hoveredTabUrl.textContent = '';
  hoveredTabInfo.style.display = 'none';
}

// Show hover actions bar
function showHoverActions(tab) {
  actionsTargetTab = tab;
  lastTargetTab = tab;
  hoverCloseBtn.dataset.tabId = String(tab.id);
  hoverActionsBar.classList.add('visible');
  
  // Update button states
  hoverPinBtn.textContent = tab.pinned ? '📌' : '📌';
  hoverPinBtn.title = tab.pinned ? 'Unpin tab' : 'Pin tab';
  
  hoverMuteBtn.textContent = tab.mutedInfo?.muted ? '🔇' : '🔊';
  hoverMuteBtn.title = tab.mutedInfo?.muted ? 'Unmute tab' : 'Mute tab';
  
  hoverCloseBtn.textContent = '×';
  hoverCloseBtn.title = 'Close tab';
}

// Hide hover actions bar
function hideHoverActions() {
  if (hideActionsTimeout) {
    clearTimeout(hideActionsTimeout);
    hideActionsTimeout = null;
  }
  lastTargetTab = hoveredTab || actionsTargetTab || lastTargetTab;
  hoverCloseBtn.dataset.tabId = '';
  hoverActionsBar.classList.remove('visible');
  hoveredTab = null;
  actionsTargetTab = null;
}

// Update tab counter
function updateTabCounter() {
  const activeIndex = tabs.findIndex(t => t.active);
  const total = tabs.length;
  
  if (settings.showIndices && activeIndex >= 0) {
    tabCounter.textContent = `On tab ${activeIndex + 1} of ${total}`;
  } else {
    tabCounter.textContent = `${total} tabs`;
  }
}

// Setup event listeners
function setupEventListeners() {
  // Scroll priority: while user is scrolling, suppress hover updates and hover visuals for smooth scroll.
  // Cause of "slow continuous scroll getting stuck": when the gap between wheel events exceeds the timeout,
  // we clear is-scrolling and restore pointer-events. Hover can then run (mouse is over a tab), which
  // shows hover-actions-bar. That bar is in the layout flow, so tab-container height shrinks -> reflow.
  // The next wheel lands during/after that reflow, causing a hitch. So use a delay long enough that
  // slow continuous scroll (e.g. one wheel every 400–500ms) keeps is-scrolling active.
  const SCROLL_PRIORITY_MS = 600;
  function setScrollingPriority() {
    tabContainer.classList.add('is-scrolling');
    if (scrollPriorityTimeout) clearTimeout(scrollPriorityTimeout);
    scrollPriorityTimeout = setTimeout(() => {
      tabContainer.classList.remove('is-scrolling');
      scrollPriorityTimeout = null;
    }, SCROLL_PRIORITY_MS);
  }
  let lastScrollLeft = tabContainer.scrollLeft;
  tabContainer.addEventListener('scroll', () => {
    setScrollingPriority();
    const currentScrollLeft = tabContainer.scrollLeft;
    const maxScroll = tabContainer.scrollWidth - tabContainer.offsetWidth;
    if ((currentScrollLeft <= 0 && lastScrollLeft <= 0) ||
        (currentScrollLeft >= maxScroll && lastScrollLeft >= maxScroll)) {
      lastScrollLeft = currentScrollLeft;
      return;
    }
    lastScrollLeft = currentScrollLeft;
  });
  
  // Handle resize – only re-center, no size change
  window.addEventListener('resize', () => {
    ensureActiveTabHighlighted();
    if (settings.autoCenter) {
      const activeTab = tabs.find(t => t.active);
      if (activeTab) {
        const activeTabElement = tabContainer.querySelector(`[data-tab-id="${activeTab.id}"]`);
        if (activeTabElement) {
          centerTab(activeTabElement);
        }
      }
    }
  });
  
  // Keep hover actions visible when hovering over them (restore target if it was cleared by timeout)
  hoverActionsBar.addEventListener('mouseenter', () => {
    if (hideActionsTimeout) {
      clearTimeout(hideActionsTimeout);
      hideActionsTimeout = null;
    }
    const tab = getTargetTab();
    if (tab) {
      hoveredTab = tab;
      updateHoveredTabInfo(tab);
      showHoverActions(tab);
    }
  });
  
  hoverActionsBar.addEventListener('mouseleave', () => {
    // Delay hiding to allow moving back to tab or to another tab
    hideActionsTimeout = setTimeout(() => {
      if (!document.querySelector('.tab-item:hover')) {
        clearHoveredTabInfo();
        hideHoverActions();
      }
    }, 200);
  });
  
  // Keyboard navigation
  if (settings.keyboardNav) {
    document.addEventListener('keydown', handleKeyboard);
  }
  
  // Mouse wheel horizontal scroll (also mark scrolling for priority over hover)
  tabContainer.addEventListener('wheel', (e) => {
    setScrollingPriority();
    if (e.deltaY !== 0) {
      e.preventDefault();
      tabContainer.scrollLeft += e.deltaY * settings.scrollSpeed;
    }
  }, { passive: false });
  
  // Chrome tab event listeners
  chrome.tabs.onActivated.addListener(() => {
    refreshTabList();
    updateCurrentTabInfo();
  });
  chrome.tabs.onCreated.addListener(() => refreshTabList());
  chrome.tabs.onRemoved.addListener(() => refreshTabList());
  chrome.tabs.onMoved.addListener(() => refreshTabList());
  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.title || changeInfo.favIconUrl || changeInfo.audible !== undefined || 
        changeInfo.mutedInfo !== undefined || changeInfo.pinned !== undefined) {
      refreshTabList();
      // Update current tab info if active tab was updated
      const activeTab = tabs.find(t => t.active && t.id === tabId);
      if (activeTab) {
        updateCurrentTabInfo();
      }
      // Update hover actions if this is the hovered tab
      if (hoveredTab && hoveredTab.id === tabId) {
        hoveredTab = tabs.find(t => t.id === tabId);
        if (hoveredTab) {
          showHoverActions(hoveredTab);
        }
      }
    }
  });
  
  if (chrome.tabGroups && chrome.tabGroups.onUpdated) {
    chrome.tabGroups.onUpdated.addListener(() => refreshTabList());
  }
}

// Keyboard navigation handler
function handleKeyboard(e) {
  const currentIndex = tabs.findIndex(t => t.active);
  if (currentIndex === -1) return;
  
  let newIndex = currentIndex;
  
  switch (e.key) {
    case 'ArrowLeft':
      e.preventDefault();
      newIndex = Math.max(0, currentIndex - 1);
      break;
    case 'ArrowRight':
      e.preventDefault();
      newIndex = Math.min(tabs.length - 1, currentIndex + 1);
      break;
    case 'Home':
      e.preventDefault();
      newIndex = 0;
      break;
    case 'End':
      e.preventDefault();
      newIndex = tabs.length - 1;
      break;
    case 'Enter':
      e.preventDefault();
      // Already active, just close popup
      window.close();
      return;
    default:
      return;
  }
  
  if (newIndex !== currentIndex) {
    chrome.tabs.update(tabs[newIndex].id, { active: true });
  }
}


// Initialize on load
document.addEventListener('DOMContentLoaded', init);
