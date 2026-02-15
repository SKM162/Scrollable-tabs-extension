/** @fileoverview Centralized constants for the Tab Navigator extension */

/** Default settings for the extension */
export const DEFAULT_SETTINGS = {
  popupWidth: 800,
  showTitles: true,
  showIndices: true,
  autoCenter: true,
  keyboardNav: true,
  scrollSpeed: 5.0,
  visibleTabs: 7,
  animationSpeed: 200,
  colorTheme: 'auto',
  faviconSize: 'medium',
  highlightStyle: 'border',
  showCenterInfo: true,
  theme: 'auto'
};

/** Theme modes */
export const THEMES = {
  AUTO: 'auto',
  LIGHT: 'light',
  DARK: 'dark'
};

/** Popup dimensions */
export const POPUP_DIMENSIONS = {
  MIN_WIDTH: 400,
  MAX_WIDTH: 800,
  DEFAULT_HEIGHT: 250
};

/** Scroll configuration */
export const SCROLL_CONFIG = {
  PRIORITY_MS: 600,
  BEHAVIOR: 'auto'
};

/** Chrome tab group color mappings */
export const CHROME_GROUP_COLORS = {
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

/** Tab element CSS selectors */
export const SELECTORS = {
  TAB_CONTAINER: '#tabContainer',
  TAB_COUNTER: '#tabCounter',
  POPUP_CONTAINER: '#popupContainer',
  CURRENT_TAB_TITLE: '#currentTabTitle',
  CURRENT_TAB_URL: '#currentTabUrl',
  CURRENT_TAB_INFO: '#currentTabInfo',
  HOVERED_TAB_TITLE: '#hoveredTabTitle',
  HOVERED_TAB_URL: '#hoveredTabUrl',
  HOVERED_TAB_INFO: '#hoveredTabInfo',
  TAB_COUNTER_WRAPPER: '#tabCounterWrapper',
  SETTINGS_BTN: '#settingsBtn',
  THEME_TOGGLE_BTN: '#themeToggleBtn',
  SCROLL_FIRST_BTN: '#scrollFirstBtn',
  SCROLL_PAGE_BACK_BTN: '#scrollPageBackBtn',
  SCROLL_PAGE_FWD_BTN: '#scrollPageFwdBtn',
  SCROLL_LAST_BTN: '#scrollLastBtn'
};

/** CSS class names */
export const CLASSES = {
  TAB_ITEM: 'tab-item',
  ACTIVE_TAB: 'active-tab',
  TAB_GROUP_SECTION: 'tab-group-section',
  PINNED_SECTION: 'pinned-section',
  COLLAPSIBLE_SECTION: 'collapsible-section',
  GROUP_HEADER: 'group-header',
  GROUP_HEADER_PINNED: 'group-header-pinned',
  GROUP_TABS_CONTAINER: 'group-tabs-container',
  FAVICON: 'favicon',
  TITLE: 'title',
  INDICATOR: 'indicator',
  PIN_INDICATOR: 'pin-indicator',
  AUDIO_INDICATOR: 'audio-indicator',
  TAB_DROPDOWN_BTN: 'tab-dropdown-btn',
  TAB_DROPDOWN_MENU: 'tab-dropdown-menu',
  TAB_DROPDOWN_ITEM: 'tab-dropdown-item',
  TAB_DROPDOWN_DIVIDER: 'tab-dropdown-divider',
  VISIBLE: 'visible',
  ACTIVE: 'active',
  ALIGN_LEFT: 'align-left',
  ALIGN_RIGHT: 'align-right',
  IS_SCROLLING: 'is-scrolling',
  COLLAPSED: 'collapsed',
  TAB_DIVIDER: 'tab-divider',
  MESSAGE: 'message',
  SUCCESS: 'success',
  ERROR: 'error',
  DANGER: 'danger'
};

/** Dropdown menu actions */
export const DROPDOWN_ACTIONS = {
  PIN: 'pin',
  MUTE: 'mute',
  DUPLICATE: 'duplicate',
  RELOAD: 'reload',
  COPY_URL: 'copy-url',
  NEW_TAB_RIGHT: 'new-tab-right',
  NEW_TAB_LEFT: 'new-tab-left',
  NEW_WINDOW: 'new-window',
  CLOSE: 'close'
};

/** Message display duration in milliseconds */
export const MESSAGE_DURATION = 3000;

/** Keyboard keys */
export const KEYS = {
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  ENTER: 'Enter'
};

export const ICONS = {
  PIN: '<svg class="pin-icon" width="20" height="20" viewBox="5 5 20 20" xmlns="http://www.w3.org/2000/svg" transform="scale(-1 1)"><g stroke-width="0"/><g stroke-linecap="round" stroke-linejoin="round"/><path style="fill:#363636;fill-opacity:1;stroke:none;stroke-width:4;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" d="m5 301.019 1.304 1.304s1.222.089 2.775-.703l3.975 3.974c-1.3 2.234-1.097 4.12-1.097 4.12l1.739 1.74 3.478-3.478 6.087 6.087H25v-1.74l-6.087-6.087 3.478-3.478-1.739-1.739s-1.883-.2-4.118 1.099l-3.978-3.978c.791-1.554.705-2.773.705-2.773l-1.304-1.304z" transform="translate(0 -289.063)"/></svg>',
  UNPIN: '<svg class="unpin-icon" width="20" height="20" viewBox="2 2 22 22" xmlns="http://www.w3.org/2000/svg" fill="#363636" stroke="#363636" transform="scale(-1 1)"><path style="fill:#363636;fill-opacity:1;stroke:none;stroke-width:4" d="M19.355 3.586 13.211 9.73l-.654-.652c.79-1.554.705-2.773.705-2.773L11.957 5 5 11.957l1.305 1.305s1.221.088 2.775-.703l.65.652-5.93 5.932 1.415 1.414L20.77 5zm.967 8.36c-.634.004-2.113.135-3.789 1.109l-.474-.477-3.48 3.48.474.473c-1.3 2.234-1.096 4.121-1.096 4.121l1.738 1.739 3.479-3.479L23.262 25H25v-1.738l-6.088-6.088 3.479-3.479-1.739-1.738s-.118-.013-.33-.012" stroke="none"/></svg>',
  MUTE: '<svg class="mute-icon" width="20" height="20" viewBox="0 1 15 15" fill="#363636" xmlns="http://www.w3.org/2000/svg" stroke="#363636" stroke-width="0.00016"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path clip-rule="evenodd" d="m2 7.5v3c0 .8.6 1.5 1.4 1.5h2.3l3.2 2.8c.1.1.3.2.4.2s.2 0 .3-.1c.2-.1.4-.4.4-.7v-.9l-7.2-7.2c-.5.2-.8.8-.8 1.4zm8 2v-5.8c0-.3-.1-.5-.4-.7-.1 0-.2 0-.3 0s-.3 0-.4.2l-2.8 2.5-4.1-4.1-1 1 3.4 3.4 5.6 5.6 3.6 3.6 1-1z" fill-rule="evenodd"></path></g></svg>',
  UNMUTE: '<svg class="unmute-icon" width="20" height="20" viewBox="-0.5 -0.5 25 25" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#363636" stroke-width="0"><g/><g stroke-linecap="round" stroke-linejoin="round"/><g fill="#363636" stroke="none"><path d="M13 3.745c0-.472-.127-1.245-.834-1.6-.75-.379-1.45.049-1.804.367L4.947 7.437H3a2 2 0 0 0-2 2v5.188a2 2 0 0 0 2 2h1.95l5.412 4.864c.355.32 1.054.744 1.804.366.706-.355.834-1.126.834-1.599zm4.336.051-.24-.067a1 1 0 0 0-1.233.694l-.134.482a1 1 0 0 0 .694 1.232l.241.067c2.291.64 4.086 2.942 4.086 5.796s-1.795 5.157-4.086 5.796l-.24.067a1 1 0 0 0-.695 1.232l.134.482a1 1 0 0 0 1.232.694l.241-.067c3.46-.965 5.914-4.322 5.914-8.204s-2.454-7.239-5.914-8.204"/><path d="m16.358 7.802-.24-.071a1 1 0 0 0-1.244.671l-.143.48a1 1 0 0 0 .671 1.244l.24.072c.533.16 1.108.814 1.108 1.802s-.575 1.643-1.108 1.802l-.24.072a1 1 0 0 0-.671 1.244l.143.48a1 1 0 0 0 1.245.671l.24-.071c1.766-.529 2.891-2.3 2.891-4.198s-1.125-3.67-2.892-4.198"/></g></svg>',
  OPEN_IN_NEW_WINDOW: '<svg class="new-window-icon" width="20" height="20" viewBox="3 2 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#000000" stroke-width="1.44"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round" stroke="#CCCCCC" stroke-width="0.4800000000000001"></g><g id="SVGRepo_iconCarrier"> <path d="M5 12V6C5 5.44772 5.44772 5 6 5H18C18.5523 5 19 5.44772 19 6V18C19 18.5523 18.5523 19 18 19H12M8.11111 12H12M12 12V15.8889M12 12L5 19" stroke="#363636" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>',
  DUPLICATE_TAB: '<svg class="duplicate-tab-icon" width="20" height="20" viewBox="1 1 23 23" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#000" stroke-width="0"><g/><g stroke-linecap="round" stroke-linejoin="round" stroke="#ccc" stroke-width=".144"/><g fill="#363636" stroke="none"><path d="M18 3H4a1 1 0 0 0-1 1v14a1 1 0 1 1-2 0V4a3 3 0 0 1 3-3h14a1 1 0 1 1 0 2m-5 8a1 1 0 1 1 2 0v2h2a1 1 0 1 1 0 2h-2v2a1 1 0 1 1-2 0v-2h-2a1 1 0 1 1 0-2h2z"/><path fill-rule="evenodd" clip-rule="evenodd" d="M20 5a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3zm0 2a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z"/></g></svg>',
  RELOAD_TAB: '<svg class="reload-tab-icon" width="20" height="20" viewBox="-10 -10 320 320" xmlns="http://www.w3.org/2000/svg" xml:space="preserve" fill="#303030" stroke="#303030"><g stroke-width="0"/><g stroke-linecap="round" stroke-linejoin="round"/><path style="fill:#363636" d="M57.866 268.881c25.982 19.891 56.887 30.403 89.369 30.402h.002c6.545 0 13.176-.44 19.707-1.308 39.055-5.187 73.754-25.272 97.702-56.557 14.571-19.033 24.367-41.513 28.329-65.01a7.5 7.5 0 0 0-6.148-8.643l-19.721-3.326a7.5 7.5 0 0 0-8.643 6.148c-3.019 17.896-10.49 35.032-21.608 49.555-18.266 23.861-44.73 39.181-74.521 43.137-4.994.664-10.061 1-15.058 1-24.757 0-48.317-8.019-68.137-23.191-23.86-18.266-39.18-44.73-43.136-74.519-3.957-29.787 3.924-59.333 22.189-83.194 21.441-28.007 54.051-44.069 89.469-44.069 24.886 0 48.484 7.996 68.245 23.122a113 113 0 0 1 17.626 16.754l-36.934-6.52a7.5 7.5 0 0 0-8.689 6.082l-3.477 19.695a7.5 7.5 0 0 0 6.081 8.689l88.63 15.647q.651.115 1.304.114a7.495 7.495 0 0 0 7.385-6.196l15.646-88.63a7.5 7.5 0 0 0-6.081-8.69l-19.695-3.477a7.494 7.494 0 0 0-8.689 6.082l-6.585 37.3a148.2 148.2 0 0 0-25.248-24.642c-25.914-19.838-56.86-30.324-89.495-30.324-46.423 0-89.171 21.063-117.284 57.787C6.454 93.385-3.878 132.123 1.309 171.178c5.188 39.058 25.274 73.755 56.557 97.703z"/></svg>',
  COPY_URL: '<svg class="copy-url-icon" width="20" height="20" viewBox="0 0 33 33" xmlns="http://www.w3.org/2000/svg"><g stroke-width="0"/><g stroke-linecap="round" stroke-linejoin="round"/><title>permalink</title><path d="m30.785 3.613-1.43-1.429C27.775.604 24.58.42 23 2l-7 7c-1.056 1.056-.905 2.881-.549 4.228L25 4c.79-.79 2.21.21 3 1s1.79 2.21 1 3l-9.259 9.518c1.347.355 3.203.538 4.259-.518l7-7c1.58-1.579 1.365-4.807-.215-6.387M8 29c-.79.79-2.21-.21-3-1s-1.79-2.21-1-3l9.228-9.549c-1.347-.356-3.172-.507-4.228.549l-7 7c-1.58 1.58-1.396 4.775.184 6.354l1.43 1.431C5.193 32.365 8.42 32.58 10 31l7-7c1.056-1.056.874-2.912.518-4.259zm11.702-15.718a1.013 1.013 0 0 0-1.43 0l-5.005 5.005a1.012 1.012 0 0 0 1.43 1.431l5.005-5.005a1.01 1.01 0 0 0 0-1.431" fill="#363636" fill-rule="evenodd"/></svg>',
  NEW_TAB_RIGHT: '<svg class="new-tab-r-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M12 4V20M4 12H20" stroke="#363636" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path><path d="M18 8L22 12L18 16" stroke="#363636" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></g></svg>',
  NEW_TAB_LEFT: '<svg class="new-tab-l-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M12 4V20M4 12H20" stroke="#363636" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path><path d="M6 8L2 12L6 16" stroke="#363636" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></g></svg>',
  SETTINGS: '<svg class="settings-icon" width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g stroke-width="0"/><g stroke-linecap="round" stroke-linejoin="round"/><title>settings</title><g fill="none" fill-rule="evenodd"><path d="M24 0v24H0V0zM12.593 23.258l-.011.002-.071.035-.02.004-.014-.004-.071-.035q-.016-.005-.024.005l-.004.01-.017.428.005.02.01.013.104.074.015.004.012-.004.104-.074.012-.016.004-.017-.017-.427q-.004-.016-.017-.018m.265-.113-.013.002-.185.093-.01.01-.003.011.018.43.005.012.008.007.201.093q.019.005.029-.008l.004-.014-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014-.034.614q.001.018.017.024l.015-.002.201-.093.01-.008.004-.011.017-.43-.003-.012-.01-.01z"/><path class="settings-path" d="M18 4a1 1 0 1 0-2 0v1H4a1 1 0 0 0 0 2h12v1a1 1 0 1 0 2 0V7h2a1 1 0 1 0 0-2h-2zM4 11a1 1 0 1 0 0 2h2v1a1 1 0 1 0 2 0v-1h12a1 1 0 1 0 0-2H8v-1a1 1 0 0 0-2 0v1zm-1 7a1 1 0 0 1 1-1h12v-1a1 1 0 1 1 2 0v1h2a1 1 0 1 1 0 2h-2v1a1 1 0 1 1-2 0v-1H4a1 1 0 0 1-1-1" fill="#363636"/></g></svg></button>',
  TAB_COUNTER: '<svg class="tab-counter-icon" fill="#fff" width="20" height="20" viewBox="3.5 3.5 25 25" xmlns="http://www.w3.org/2000/svg" stroke="#fff" stroke-width="0"><g/><path d="M16.001 5c-4.216 0-7.714 3.418-7.634 7.634.029 1.578.719 2.824 1.351 4.024.242.461 6.264 10.332 6.264 10.332V27l.001-.007.002.007v-.01l6.531-10.377c.407-.703.793-1.771.793-1.771A7.63 7.63 0 0 0 16.001 5M16 16.019a3.895 3.895 0 0 1-3.896-3.897A3.898 3.898 0 1 1 16 16.019" stroke-linecap="round" stroke-linejoin="round" stroke="#a6a5a7" stroke-width="1.728"/><path d="M16.001 5c-4.216 0-7.714 3.418-7.634 7.634.029 1.578.719 2.824 1.351 4.024.242.461 6.264 10.332 6.264 10.332V27l.001-.007.002.007v-.01l6.531-10.377c.407-.703.793-1.771.793-1.771A7.63 7.63 0 0 0 16.001 5M16 16.019a3.895 3.895 0 0 1-3.896-3.897A3.898 3.898 0 1 1 16 16.019" stroke="none"/></svg>',
  DARK_MODE: '<svg class="dark-mode-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g stroke-width="0"/><g stroke-linecap="round" stroke-linejoin="round"/><g fill="#000"><path d="M12 16a4 4 0 0 0 0-8z"/><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2m0 2v4a4 4 0 1 0 0 8v4a8 8 0 1 0 0-16"/></g></svg>'
}
