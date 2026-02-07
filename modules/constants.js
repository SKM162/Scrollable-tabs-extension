/** @fileoverview Centralized constants for the Tab Navigator extension */

/** Default settings for the extension */
export const DEFAULT_SETTINGS = {
  popupWidth: 800,
  showTitles: true,
  showIndices: true,
  autoCenter: true,
  keyboardNav: true,
  scrollSpeed: 1.0,
  visibleTabs: 7,
  animationSpeed: 200,
  colorTheme: 'auto',
  faviconSize: 'medium',
  highlightStyle: 'border',
  showCenterInfo: true
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
  BEHAVIOR: 'smooth'
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
  PIP_INDICATOR: 'pip-indicator',
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
  PIN: '<svg width="20" height="20" viewBox="5 5 20 20" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" version="1.1" id="svg822" inkscape:version="0.92.4 (f8dce91, 2019-08-02)" sodipodi:docname="pin.svg" fill="#000000" transform="matrix(-1, 0, 0, 1, 0, 0)"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <defs id="defs816"> <inkscape:path-effect effect="copy_rotate" starting_point="17,304.0625" origin="15,304.0625" id="path-effect1009" is_visible="true" copies_to_360="true" fuse_paths="false" starting_angle="0" rotation_angle="60.2" num_copies="8"></inkscape:path-effect> </defs> <sodipodi:namedview id="base" pagecolor="#ffffff" bordercolor="#ff1a1a" borderopacity="1.0" inkscape:pageopacity="0.0" inkscape:pageshadow="2" inkscape:zoom="19.610429" inkscape:cx="14.638758" inkscape:cy="14.520172" inkscape:document-units="px" inkscape:current-layer="layer1" showgrid="true" units="px" inkscape:window-width="1366" inkscape:window-height="713" inkscape:window-x="0" inkscape:window-y="0" inkscape:window-maximized="1" showguides="true" inkscape:guide-bbox="true"> <sodipodi:guide position="21.126168,22.794393" orientation="1,0" id="guide1575" inkscape:locked="false"></sodipodi:guide> <sodipodi:guide position="22.682243,23.285047" orientation="1,0" id="guide1635" inkscape:locked="false"></sodipodi:guide> <sodipodi:guide position="22.682243,7.6455921" orientation="0,1" id="guide1639" inkscape:locked="false"></sodipodi:guide> <sodipodi:guide position="18.859863,18.859863" orientation="1,0" id="guide1242" inkscape:locked="false"></sodipodi:guide> <inkscape:grid type="xygrid" id="grid1103"></inkscape:grid> <sodipodi:guide position="-16,8" orientation="1,0" id="guide1139" inkscape:locked="false"></sodipodi:guide> </sodipodi:namedview> <metadata id="metadata819"> <rdf:rdf> <cc:work rdf:about=""> <dc:format>image/svg+xml</dc:format> <dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage"></dc:type> <dc:title> </dc:title> </cc:work> </rdf:rdf> </metadata> <g inkscape:label="Layer 1" inkscape:groupmode="layer" id="layer1" transform="translate(0,-289.0625)"> <path style="fill:#ff2929;fill-opacity:1;stroke:none;stroke-width:4;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" d="m 5.0000001,301.01904 1.3043479,1.30434 c 0,0 1.2213086,0.0882 2.7751359,-0.70313 l 3.9741851,3.97418 c -1.298954,2.23377 -1.097147,4.12024 -1.097147,4.12024 l 1.73913,1.73914 3.478262,-3.47826 6.086955,6.08695 1.739131,0 v -1.73914 l -6.086956,-6.08694 3.47826,-3.47826 -1.73913,-1.73912 c 0,0 -1.88356,-0.19917 -4.118547,1.09883 l -3.97758,-3.97758 c 0.791095,-1.55408 0.704823,-2.77343 0.704823,-2.77343 l -1.304348,-1.30436 z" id="rect1085" inkscape:connector-curvature="0" sodipodi:nodetypes="cccccccccccccccccc"></path> </g> </g></svg>',
  UNPIN: '<svg width="20" height="20" viewBox="5 5 20 20" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" version="1.1" id="svg822" inkscape:version="0.92.4 (f8dce91, 2019-08-02)" sodipodi:docname="unpin.svg" fill="#000000" transform="matrix(-1, 0, 0, 1, 0, 0)" stroke="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <defs id="defs816"> <inkscape:path-effect effect="copy_rotate" starting_point="17,304.0625" origin="15,304.0625" id="path-effect1009" is_visible="true" copies_to_360="true" fuse_paths="false" starting_angle="0" rotation_angle="60.2" num_copies="8"></inkscape:path-effect> </defs> <sodipodi:namedview id="base" pagecolor="#ffffff" bordercolor="#f81212" borderopacity="1.0" inkscape:pageopacity="0.0" inkscape:pageshadow="2" inkscape:zoom="19.610429" inkscape:cx="14.638758" inkscape:cy="14.520172" inkscape:document-units="px" inkscape:current-layer="layer1" showgrid="true" units="px" inkscape:window-width="1366" inkscape:window-height="713" inkscape:window-x="0" inkscape:window-y="0" inkscape:window-maximized="1" showguides="true" inkscape:guide-bbox="true"> <sodipodi:guide position="21.126168,22.794393" orientation="1,0" id="guide1575" inkscape:locked="false"></sodipodi:guide> <sodipodi:guide position="22.682243,23.285047" orientation="1,0" id="guide1635" inkscape:locked="false"></sodipodi:guide> <sodipodi:guide position="22.682243,7.6455921" orientation="0,1" id="guide1639" inkscape:locked="false"></sodipodi:guide> <sodipodi:guide position="18.859863,18.859863" orientation="1,0" id="guide1242" inkscape:locked="false"></sodipodi:guide> <inkscape:grid type="xygrid" id="grid1103"></inkscape:grid> <sodipodi:guide position="-16,8" orientation="1,0" id="guide1139" inkscape:locked="false"></sodipodi:guide> </sodipodi:namedview> <metadata id="metadata819"> <rdf:rdf> <cc:work rdf:about=""> <dc:format>image/svg+xml</dc:format> <dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage"></dc:type> <dc:title> </dc:title> </cc:work> </rdf:rdf> </metadata> <g inkscape:label="Layer 1" inkscape:groupmode="layer" id="layer1" transform="translate(0,-289.0625)"> <path style="fill:#f81212;fill-opacity:1;stroke:none;stroke-width:4;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" d="M 19.355469 3.5859375 L 13.210938 9.7304688 L 12.556641 9.078125 C 13.347736 7.524045 13.261719 6.3046875 13.261719 6.3046875 L 11.957031 5 L 5 11.957031 L 6.3046875 13.261719 C 6.3046875 13.261719 7.5262508 13.349924 9.0800781 12.558594 L 9.7304688 13.210938 L 3.8007812 19.142578 L 5.2148438 20.556641 L 20.771484 5 L 19.355469 3.5859375 z M 20.322266 11.945312 C 19.687749 11.95014 18.209443 12.081186 16.533203 13.054688 L 16.058594 12.578125 L 12.578125 16.058594 L 13.052734 16.53125 C 11.75378 18.76502 11.957031 20.652344 11.957031 20.652344 L 13.695312 22.390625 L 17.173828 18.912109 L 23.261719 25 L 25 25 L 25 23.261719 L 18.912109 17.173828 L 22.390625 13.695312 L 20.652344 11.957031 C 20.652344 11.957031 20.533771 11.943703 20.322266 11.945312 z " transform="translate(0,289.0625)" id="rect1085"></path> </g> </g></svg>',
  MUTE: '<svg width="20" height="20" viewBox="0 1 15 15" fill="#363636" xmlns="http://www.w3.org/2000/svg" stroke="#363636" stroke-width="0.00016"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path clip-rule="evenodd" d="m2 7.5v3c0 .8.6 1.5 1.4 1.5h2.3l3.2 2.8c.1.1.3.2.4.2s.2 0 .3-.1c.2-.1.4-.4.4-.7v-.9l-7.2-7.2c-.5.2-.8.8-.8 1.4zm8 2v-5.8c0-.3-.1-.5-.4-.7-.1 0-.2 0-.3 0s-.3 0-.4.2l-2.8 2.5-4.1-4.1-1 1 3.4 3.4 5.6 5.6 3.6 3.6 1-1z" fill-rule="evenodd"></path></g></svg>',
  UNMUTE: '<svg width="20" height="20" viewBox="1 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#363636" stroke-width="0.00024000000000000003"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M13 3.7446C13 3.27314 12.8728 2.50021 12.1657 2.14424C11.4151 1.76635 10.7163 2.19354 10.3623 2.51158L4.94661 7.43717H3C1.89543 7.43717 1 8.3326 1 9.43717L1.00001 14.6248C1.00001 15.7293 1.89544 16.6248 3.00001 16.6248H4.95001L10.3623 21.4891C10.7175 21.8081 11.416 22.2331 12.1656 21.8554C12.8717 21.4998 13 20.7286 13 20.2561V3.7446Z" fill="#363636"></path> <path d="M17.336 3.79605L17.0952 3.72886C16.5633 3.58042 16.0117 3.89132 15.8632 4.42329L15.7289 4.90489C15.5804 5.43685 15.8913 5.98843 16.4233 6.13687L16.6641 6.20406C18.9551 6.84336 20.7501 9.14615 20.7501 12.0001C20.7501 14.854 18.9551 17.1568 16.6641 17.7961L16.4233 17.8632C15.8913 18.0117 15.5804 18.5633 15.7289 19.0952L15.8632 19.5768C16.0117 20.1088 16.5633 20.4197 17.0952 20.2713L17.336 20.2041C20.7957 19.2387 23.2501 15.8818 23.2501 12.0001C23.2501 8.11832 20.7957 4.76146 17.336 3.79605Z" fill="#363636"></path> <path d="M16.3581 7.80239L16.1185 7.73078C15.5894 7.57258 15.0322 7.87329 14.874 8.40243L14.7308 8.88148C14.5726 9.41062 14.8733 9.96782 15.4024 10.126L15.642 10.1976C16.1752 10.3571 16.75 11.012 16.75 12C16.75 12.9881 16.1752 13.643 15.642 13.8024L15.4024 13.874C14.8733 14.0322 14.5726 14.5894 14.7308 15.1185L14.874 15.5976C15.0322 16.1267 15.5894 16.4274 16.1185 16.2692L16.3581 16.1976C18.1251 15.6693 19.25 13.8987 19.25 12C19.25 10.1014 18.1251 8.33068 16.3581 7.80239Z" fill="#363636"></path> </g></svg>',
  OPEN_IN_NEWTAB: '<svg width="20" height="20" viewBox="3 2 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#000000" stroke-width="1.44"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round" stroke="#CCCCCC" stroke-width="0.4800000000000001"></g><g id="SVGRepo_iconCarrier"> <path d="M5 12V6C5 5.44772 5.44772 5 6 5H18C18.5523 5 19 5.44772 19 6V18C19 18.5523 18.5523 19 18 19H12M8.11111 12H12M12 12V15.8889M12 12L5 19" stroke="#363636" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>',
  DUPLICATE_TAB: '<svg width="20" height="20" viewBox="1 1 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#000000" stroke-width="0.00024000000000000003"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round" stroke="#CCCCCC" stroke-width="0.144"></g><g id="SVGRepo_iconCarrier"> <path d="M18 3H4C3.44772 3 3 3.44772 3 4V18C3 18.5523 2.55228 19 2 19C1.44772 19 1 18.5523 1 18V4C1 2.34315 2.34315 1 4 1H18C18.5523 1 19 1.44772 19 2C19 2.55228 18.5523 3 18 3Z" fill="#363636"></path> <path d="M13 11C13 10.4477 13.4477 10 14 10C14.5523 10 15 10.4477 15 11V13H17C17.5523 13 18 13.4477 18 14C18 14.5523 17.5523 15 17 15H15V17C15 17.5523 14.5523 18 14 18C13.4477 18 13 17.5523 13 17V15H11C10.4477 15 10 14.5523 10 14C10 13.4477 10.4477 13 11 13H13V11Z" fill="#363636"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M20 5C21.6569 5 23 6.34315 23 8V20C23 21.6569 21.6569 23 20 23H8C6.34315 23 5 21.6569 5 20V8C5 6.34315 6.34315 5 8 5H20ZM20 7C20.5523 7 21 7.44772 21 8V20C21 20.5523 20.5523 21 20 21H8C7.44772 21 7 20.5523 7 20V8C7 7.44772 7.44772 7 8 7H20Z" fill="#363636"></path> </g></svg>',
  RELOAD_TAB: '<svg width="20" height="20" viewBox="0 -2 300 300" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 303.597 303.597" xml:space="preserve" fill="#303030" stroke="#303030"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path style="fill:#363636;" d="M57.866,268.881c25.982,19.891,56.887,30.403,89.369,30.402h0.002c6.545,0,13.176-0.44,19.707-1.308 c39.055-5.187,73.754-25.272,97.702-56.557c14.571-19.033,24.367-41.513,28.329-65.01c0.689-4.084-2.064-7.954-6.148-8.643 l-19.721-3.326c-1.964-0.33-3.974,0.131-5.595,1.284c-1.621,1.153-2.717,2.902-3.048,4.864 c-3.019,17.896-10.49,35.032-21.608,49.555c-18.266,23.861-44.73,39.181-74.521,43.137c-4.994,0.664-10.061,1-15.058,1 c-24.757,0-48.317-8.019-68.137-23.191c-23.86-18.266-39.18-44.73-43.136-74.519c-3.957-29.787,3.924-59.333,22.189-83.194 c21.441-28.007,54.051-44.069,89.469-44.069c24.886,0,48.484,7.996,68.245,23.122c6.55,5.014,12.43,10.615,17.626,16.754 l-36.934-6.52c-1.956-0.347-3.973,0.101-5.604,1.241c-1.631,1.141-2.739,2.882-3.085,4.841l-3.477,19.695 c-0.72,4.079,2.003,7.969,6.081,8.689l88.63,15.647c0.434,0.077,0.869,0.114,1.304,0.114c1.528,0,3.031-0.467,4.301-1.355 c1.63-1.141,2.739-2.882,3.084-4.841l15.646-88.63c0.721-4.079-2.002-7.969-6.081-8.69l-19.695-3.477 c-4.085-0.723-7.97,2.003-8.689,6.082l-6.585,37.3c-7.387-9.162-15.87-17.463-25.248-24.642 c-25.914-19.838-56.86-30.324-89.495-30.324c-46.423,0-89.171,21.063-117.284,57.787C6.454,93.385-3.878,132.123,1.309,171.178 C6.497,210.236,26.583,244.933,57.866,268.881z"></path> </g></svg>',
  COPY_URL: '<svg width="20" height="20" viewBox="1 1 45 45" fill="none" xmlns="http://www.w3.org/2000/svg" transform="matrix(-1, 0, 0, 1, 0, 0)"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g id="Base/copy-link"> <path d="M0 0H48V48H0V0Z" fill="white" fill-opacity="0.01"></path> <g id="ç¼–ç»„ 2"> <g id="ç¼–ç»„"> <rect id="çŸ©å½¢" width="48" height="48" fill="white" fill-opacity="0.01"></rect> <path id="å½¢çŠ¶" d="M12 9.92704V7C12 5.34315 13.3431 4 15 4H41C42.6569 4 44 5.34315 44 7V33C44 34.6569 42.6569 36 41 36H38.0174" stroke="#363636" stroke-width="4"></path> <rect id="Rectangle Copy" x="4" y="10" width="34" height="34" rx="3" fill="#363636" stroke="#363636" stroke-width="4" stroke-linejoin="round"></rect> </g> <g id="ç¼–ç»„_2"> <g id="Group"> <path id="Oval" d="M18.4396 23.1098L23.7321 17.6003C25.1838 16.1486 27.5693 16.1806 29.0604 17.6717C30.5515 19.1628 30.5835 21.5483 29.1319 23L27.2218 25.0228" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path> <path id="Oval Copy 2" d="M13.4661 28.7469C12.9558 29.2573 11.9006 30.2762 11.9006 30.2762C10.4489 31.7279 10.4095 34.3152 11.9006 35.8063C13.3917 37.2974 15.7772 37.3294 17.2289 35.8777L22.3931 31.1894" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path> <path id="Oval Copy" d="M18.6631 28.3283C17.9705 27.6357 17.5927 26.7501 17.5321 25.8547C17.4624 24.8225 17.8143 23.7774 18.5916 23" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path> <path id="Oval Copy 3" d="M22.3218 25.8611C23.8129 27.3522 23.8449 29.7377 22.3932 31.1894" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path> </g> </g> </g> </g> </g></svg>'
}
