# Scrollable-tabs-extension
Chrome extension that mimics scrollable tab strip experimental feature of chrome.

A Chrome extension that provides a horizontal, scrollable view of all open tabs in a popup window with multiple viewing modes.

## Features

- **Horizontal scrollable list** of all tabs
- **Auto-focus on active tab** when popup opens
- **Click to switch** tabs
- **Real-time synchronization** with browser tab changes
- **Visual indicators** for pinned tabs and audio playing

![screenshot of extension](https://github.com/SKM162/Scrollable-tabs-extension/blob/main/image.png)



## Installation

### Load Extension locally:

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the extension directory

## Usage

Click the extension icon in the Chrome toolbar to open the tab navigator popup. The active tab will be automatically be focussed.

### Keyboard Shortcuts

- **Arrow Left/Right**: Navigate between tabs
- **Home**: Jump to first tab
- **End**: Jump to last tab
- **Enter**: Close popup (tab already active)

### Current Status

**Phase 1 (MVP) - ✅ Complete**
- ✅ Basic popup with horizontal tab list
- ✅ Click to switch tabs
- ✅ Auto-center on active tab
- ✅ Real-time tab sync
- ✅ Basic styling

**Phase 2 - ✅ Complete**
- ✅ navigation
- ✅ basic settings
- ✅ basic tab menu options (close, pin/unpin, mute/unmute)

**Phase 3 - Pending**
- fix scroll focus change after tab closing.
- fix smooth scrolling
- fix tabs not closing sometimes
- better UI for tab menu options
- Light/dark theme support
- new tab creation
- tab search
- AI tab organization
- picture in picture handling

## License

MIT
