/** @fileoverview Background service worker for Scrollable Tabs extension */

// Handle messages from popup or other scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_TABS') {
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      sendResponse({ tabs: tabs });
    });
    return true;
  }
  
  if (message.type === 'GET_SETTINGS') {
    chrome.storage.sync.get(null, (settings) => {
      sendResponse({ settings: settings });
    });
    return true;
  }
  
  return false;
});
