/** @fileoverview Multi-tab selection management */

/**
 * Selection manager for multi-tab operations.
 *
 * Safety rule: every operation that adds tabs to the selection (select all,
 * shift-click ranges) works on the list of tabs the user can currently SEE
 * (after search/filter, excluding collapsed groups), which the caller passes in.
 * The popup additionally prunes the selection to visible tabs whenever the
 * filter changes, so a batch action can never reach a tab that isn't on screen.
 */
export class SelectionManager {
  constructor(options = {}) {
    this.selectedTabs = new Set();
    this.selectionMode = false;
    this.lastSelectedTabId = null;
    this.onSelectionChange = options.onSelectionChange || (() => {});
    this.onSelectionModeChange = options.onSelectionModeChange || (() => {});
  }

  /** Toggle selection mode on/off */
  toggleSelectionMode() {
    if (this.selectionMode) {
      this.exitSelectionMode();
    } else {
      this.enterSelectionMode();
    }
    return this.selectionMode;
  }

  /** Enter selection mode */
  enterSelectionMode() {
    if (!this.selectionMode) {
      this.selectionMode = true;
      this.onSelectionModeChange(true);
    }
  }

  /** Exit selection mode and clear selection */
  exitSelectionMode() {
    if (this.selectionMode) {
      this.selectionMode = false;
      this.clearSelection();
      this.onSelectionModeChange(false);
    }
  }

  /**
   * Handle a click on a tab while selecting.
   * @param {number} tabId - Tab ID
   * @param {MouseEvent} event - Click event for shift/ctrl detection
   * @param {chrome.tabs.Tab[]} visibleTabs - Tabs currently visible, in display order
   */
  toggleTab(tabId, event, visibleTabs = []) {
    if (!this.selectionMode) {
      this.enterSelectionMode();
    }

    if (event?.shiftKey && this.lastSelectedTabId !== null) {
      this.selectRange(this.lastSelectedTabId, tabId, visibleTabs);
      return;
    }

    if (this.selectedTabs.has(tabId)) {
      this.deselectTab(tabId);
    } else {
      this.selectTab(tabId);
    }
  }

  /** @param {number} tabId */
  selectTab(tabId) {
    this.selectedTabs.add(tabId);
    this.lastSelectedTabId = tabId;
    this._emit();
  }

  /** @param {number} tabId */
  deselectTab(tabId) {
    if (!this.selectedTabs.delete(tabId)) return;
    if (this.lastSelectedTabId === tabId) {
      this.lastSelectedTabId = this.selectedTabs.size > 0
        ? Array.from(this.selectedTabs)[this.selectedTabs.size - 1]
        : null;
    }
    this._emit();
  }

  /**
   * Select every visible tab between two tabs (inclusive).
   * Hidden (filtered-out / collapsed) tabs in between are NOT selected.
   * @param {number} fromTabId
   * @param {number} toTabId
   * @param {chrome.tabs.Tab[]} visibleTabs - Visible tabs in display order
   */
  selectRange(fromTabId, toTabId, visibleTabs) {
    const fromIndex = visibleTabs.findIndex(t => t.id === fromTabId);
    const toIndex = visibleTabs.findIndex(t => t.id === toTabId);

    if (toIndex === -1) return;
    if (fromIndex === -1) {
      // Anchor is no longer visible: treat as a plain toggle
      this.selectTab(toTabId);
      return;
    }

    const start = Math.min(fromIndex, toIndex);
    const end = Math.max(fromIndex, toIndex);
    for (let i = start; i <= end; i++) {
      this.selectedTabs.add(visibleTabs[i].id);
    }

    this.lastSelectedTabId = toTabId;
    this._emit();
  }

  /**
   * Select all VISIBLE tabs (respects search/filter and collapsed groups).
   * @param {chrome.tabs.Tab[]} visibleTabs
   */
  selectAll(visibleTabs) {
    this.enterSelectionMode();
    visibleTabs.forEach(tab => this.selectedTabs.add(tab.id));
    this.lastSelectedTabId = visibleTabs.length > 0 ? visibleTabs[visibleTabs.length - 1].id : null;
    this._emit();
  }

  /** Deselect all tabs */
  deselectAll() {
    if (this.selectedTabs.size === 0 && this.lastSelectedTabId === null) return;
    this.selectedTabs.clear();
    this.lastSelectedTabId = null;
    this._emit();
  }

  /** Clear selection (alias for deselectAll) */
  clearSelection() {
    this.deselectAll();
  }

  /**
   * Keep only the given tab ids selected (drops closed/hidden tabs).
   * @param {Iterable<number>} allowedIds
   * @returns {number} how many tabs were dropped
   */
  retainOnly(allowedIds) {
    const allowed = new Set(allowedIds);
    let dropped = 0;
    for (const id of Array.from(this.selectedTabs)) {
      if (!allowed.has(id)) {
        this.selectedTabs.delete(id);
        dropped++;
      }
    }
    if (this.lastSelectedTabId !== null && !allowed.has(this.lastSelectedTabId)) {
      this.lastSelectedTabId = null;
    }
    if (dropped) this._emit();
    return dropped;
  }

  /** @returns {number[]} */
  getSelectedTabs() {
    return Array.from(this.selectedTabs);
  }

  /** @param {number} tabId */
  isSelected(tabId) {
    return this.selectedTabs.has(tabId);
  }

  /** @returns {number} */
  getSelectionCount() {
    return this.selectedTabs.size;
  }

  /** @returns {boolean} */
  isInSelectionMode() {
    return this.selectionMode;
  }

  _emit() {
    this.onSelectionChange(this.getSelectedTabs());
  }
}
