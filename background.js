/** @fileoverview Background service worker for Scrollable Tabs extension
 *
 * The popup talks to the chrome.tabs API directly, so the service worker has
 * no message handlers. (A previous GET_TABS/GET_SETTINGS handler was unused
 * and returned every tab's URL/title to any extension context that asked.)
 */
