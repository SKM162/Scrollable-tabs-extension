# Scrollable-tabs-extension
Chrome extension that mimics scrollable tab strip experimental feature of chrome (chrome://flags/#scrollable-tabstrip).

A Chrome extension that provides a horizontal, scrollable view of all open tabs in a popup window.

Made with AI and human touch <3.

## Features

- **Horizontal scrollable list** of all tabs
- **Auto-focus on active tab** when popup opens
- **Click to switch** tabs
- **Real-time synchronization** with browser tab changes
- **Visual indicators** for pinned tabs and audio playing

![screenshot of extension](https://github.com/SKM162/Scrollable-tabs-extension/blob/main/assets/Scrollable%20tab%20peek.png)

## Installation

Get it from [Chrome web store](https://chromewebstore.google.com/detail/scrollable-tabs/beneiafglkilogdikodimmbmnkbpnnba)

OR

### Load Extension locally:
Official reference: https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked
1. Clone or download and extract the repository.
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle icon at top right)
3. Click "Load unpacked" (at top left)
4. Select the extension directory cloned or downloaded.

## Usage

Click the extension icon in the Chrome toolbar to open the tab navigator popup. The active tab will be automatically be focussed.

### Current Status (will be removed once stable at basic level.)

**Phase 1 (MVP) - ✅ Complete**
- Base popup with horizontal tab list
- Click to switch tabs
- Auto-center on active tab
- Real-time tab sync
- Tab group support

**Phase 2 - ✅ Complete**
- Navigation
- Basic settings (popup window size, auto focus on current tab, tab titles, current tab count)
- Basic tab menu options (close, pin/unpin, mute/unmute)

**Phase 3 - ✅ Complete**
- Better UI/UX for tab menu options
- fix scroll focus change after tab closing and tab not closing sometimes.
- fix smooth scrolling
- fix loading of thumbnails at each start, caching implemented.
- fix group closing icons
- Light/dark theme support
- new tab creation
- fix picture in picture handling (tab's pip status not supported by chrome.). fixed audio playing indication.

**Phase 4:**
- tab reordering
- tab search
- AI tab organization

## Contributions are welcomed!

# Attributions
Default thumbnail for tabs - [By Sarang - Own work, Public Domain](https://commons.wikimedia.org/w/index.php?curid=18827703)

## License

MIT
