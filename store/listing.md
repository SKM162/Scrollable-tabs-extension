# Chrome Web Store listing — v0.5.0

Copy these into the Developer Dashboard. Upload `dist/scrollable-tabs-0.5.0.zip`
(build it with `./scripts/package.sh`).

## Package

| Field | Value |
|---|---|
| Version | 0.5.0 |
| Minimum Chrome | 104 |
| Upload | `dist/scrollable-tabs-0.5.0.zip` |

## Store listing tab

**Name:** Scrollable Tabs

**Summary** (from the manifest, 132 characters max):
> A horizontal, scrollable strip of all your tabs: search, filter, multi-select and manage them from the toolbar.

**Description:**

```
Scrollable Tabs brings back the idea of Chrome's experimental scrollable tab strip: every open tab in one horizontal, scrollable row, right from your toolbar. No more squinting at tabs squeezed down to a sliver.

ALL YOUR TABS IN ONE STRIP
• Pinned tabs and your tab groups (with their names and colours) are shown in order
• The current tab is centred when you open the popup
• Collapse groups to save space; scroll with the mouse wheel, trackpad or the navigation buttons
• Hover a tab to see its full title and site

FIND TABS FAST
• Just start typing to search titles and URLs; Enter opens the first match
• Filter to tabs that are playing audio or muted, pinned, in a group, or not in a group

SELECT MANY TABS AND ACT ON THEM AT ONCE
• Ctrl/Cmd+click to select, Shift+click for a range, Ctrl/Cmd+A for all shown tabs
• Close, mute, pin, move to the front (right after your pinned tabs) or move to a new window
• Safe by design: actions only touch the tabs you can see, pinned tabs are never closed in bulk, and closing many tabs asks for confirmation

QUICK ACTIONS FOR ANY TAB
• Pin, mute, reload, copy URL, duplicate, open a new tab next to it, move to a new window or close
• Middle-click a tab to close it

YOURS TO ADJUST
• Light, dark or system theme
• Popup width, tab titles, tab counter, auto-centre, keyboard navigation and scroll speed

PRIVATE
Everything happens inside your browser. Scrollable Tabs has no servers, no analytics and no tracking, and it never reads the content of the pages you visit.

Open source: https://github.com/SKM162/Scrollable-tabs-extension
```

**Category:** Productivity → Tools (or "Workflow & Planning")
**Language:** English

**Graphics:**
- Icon: `assets/icons/icon128.png`
- Screenshots (1280×800): `store/screenshot-1-strip.png`, `store/screenshot-2-search.png`, `store/screenshot-3-selection.png`
- Small promo tile (440×280) and marquee (1400×560): `assets/promo/` on the `homepage` branch (unchanged)

**Homepage URL:** https://skm162.github.io/Scrollable-tabs-extension/
**Support URL:** https://github.com/SKM162/Scrollable-tabs-extension/issues

## Privacy practices tab

**Single purpose:**
> View and manage the tabs of the current window in a horizontal, scrollable list in the toolbar popup.

**Permission justifications:**

| Permission | Justification |
|---|---|
| `tabs` | Read the title, URL and state (active, pinned, audible, muted) of open tabs to list and search them in the popup, and to switch, close, pin, mute, reload, duplicate and move tabs when the user asks. |
| `tabGroups` | Show each tab group's name and colour in the strip and keep grouped tabs together; take tabs out of a group when the user moves them to the front. |
| `storage` | Save the user's settings (theme, popup width, display options), remember collapsed groups for the browsing session, keep an unsent feedback draft, and keep a small local log of recent errors that the user can choose to attach to a bug report. |
| `favicon` | Show each tab's site icon from Chrome's own favicon cache, so the popup never fetches icons from the sites themselves. |

**Host permissions:** none.

**Remote code:** No, I am not using remote code. (All JavaScript is in the package; there are no remote scripts, `eval` or Wasm.)

**Data usage:** tick nothing. The extension does not collect or transmit any user data: tab information is only read locally to draw the popup. The bug report form only builds a GitHub link; nothing is sent unless the user reviews and submits the issue on GitHub themselves.

Certify all three statements (not sold to third parties; not used for unrelated purposes; not used for creditworthiness or lending).

**Privacy policy URL:** https://skm162.github.io/Scrollable-tabs-extension/privacy.html

## What's new in 0.5.0

```
• Search bar: start typing anywhere to find tabs; Enter opens the first match
• Multi-select with batch close, mute, pin, move to front and move to a new window
• Move selected tabs to the front, right after your pinned tabs
• Hovered and current tab share the info bar; navigation stays available while selecting
• Middle-click to close; collapsed groups stay collapsed
• Bug report form that opens a pre-filled GitHub issue
• Many reliability fixes: tabs that failed to close, wrong-tab closes, scroll jumps and safer bulk closing
```
