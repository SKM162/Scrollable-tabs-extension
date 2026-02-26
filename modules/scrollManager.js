/** @fileoverview Scroll management utilities */

import { SCROLL_CONFIG, CLASSES } from './constants.js';

/**
 * Scroll manager class
 */
export class ScrollManager {
  constructor(tabContainer, options = {}) {
    this.tabContainer = tabContainer;
    this.scrollSpeed = options.scrollSpeed || 5.0;
    this.onScrollStart = options.onScrollStart || (() => {});
    this.onScrollEnd = options.onScrollEnd || (() => {});

    this.scrollPriorityTimeout = null;
    this.lastScrollLeft = 0;
    this._boundHandleScroll = this._handleScroll.bind(this);
    this._boundHandleWheel = this._handleWheel.bind(this);

    // Wheel scroll batching
    this._pendingDelta = 0;
    this._scrollPending = false;
  }

  /**
   * Initialize scroll listeners
   */
  setup() {
    this.tabContainer.addEventListener('scroll', this._boundHandleScroll);
    this.tabContainer.addEventListener('wheel', this._boundHandleWheel, { passive: false });
    this.lastScrollLeft = this.tabContainer.scrollLeft;
  }

  /**
   * Cleanup scroll listeners
   */
  cleanup() {
    this.tabContainer.removeEventListener('scroll', this._boundHandleScroll);
    this.tabContainer.removeEventListener('wheel', this._boundHandleWheel);
    if (this.scrollPriorityTimeout) {
      clearTimeout(this.scrollPriorityTimeout);
      this.scrollPriorityTimeout = null;
    }
  }

  /**
   * Scroll to first item
   */
  scrollToFirst() {
    this.tabContainer.scrollTo({ left: 0, top: 0, behavior: SCROLL_CONFIG.BEHAVIOR });
  }

  /**
   * Scroll to last item
   */
  scrollToLast() {
    const left = this.tabContainer.scrollWidth - this.tabContainer.clientWidth;
    const top = this.tabContainer.scrollHeight - this.tabContainer.clientHeight;
    this.tabContainer.scrollTo({ 
      left: Math.max(0, left), 
      top: Math.max(0, top), 
      behavior: SCROLL_CONFIG.BEHAVIOR 
    });
  }

  /**
   * Scroll one page back
   */
  scrollPageBack() {
    const w = this.tabContainer.clientWidth;
    const h = this.tabContainer.clientHeight;
    const left = Math.max(0, this.tabContainer.scrollLeft - w);
    const top = Math.max(0, this.tabContainer.scrollTop - h);
    this.tabContainer.scrollTo({ left, top, behavior: SCROLL_CONFIG.BEHAVIOR });
  }

  /**
   * Scroll one page forward
   */
  scrollPageForward() {
    const w = this.tabContainer.clientWidth;
    const h = this.tabContainer.clientHeight;
    const maxLeft = Math.max(0, this.tabContainer.scrollWidth - w);
    const maxTop = Math.max(0, this.tabContainer.scrollHeight - h);
    const left = Math.min(maxLeft, this.tabContainer.scrollLeft + w);
    const top = Math.min(maxTop, this.tabContainer.scrollTop + h);
    this.tabContainer.scrollTo({ left, top, behavior: SCROLL_CONFIG.BEHAVIOR });
  }

  /**
   * Center a tab element in the viewport
   * @param {HTMLElement} tabElement - Tab element to center
   * @param {Function} onComplete - Callback after scroll completes
   */
  centerTab(tabElement, onComplete) {
    const containerWidth = this.tabContainer.offsetWidth;
    const containerHeight = this.tabContainer.offsetHeight;
    const containerScrollWidth = this.tabContainer.scrollWidth;
    const containerScrollHeight = this.tabContainer.scrollHeight;

    const tabRect = tabElement.getBoundingClientRect();
    const containerRect = this.tabContainer.getBoundingClientRect();

    const tabOffsetLeft = tabRect.left - containerRect.left + this.tabContainer.scrollLeft;
    const tabOffsetTop = tabRect.top - containerRect.top + this.tabContainer.scrollTop;
    const tabWidth = tabRect.width;
    const tabHeight = tabRect.height;

    let scrollLeft = tabOffsetLeft - (containerWidth / 2) + (tabWidth / 2);
    const maxScrollLeft = containerScrollWidth - containerWidth;
    scrollLeft = Math.max(0, Math.min(scrollLeft, maxScrollLeft));

    let scrollTop = this.tabContainer.scrollTop;
    const tabTop = tabOffsetTop;
    const tabBottom = tabTop + tabHeight;
    const visibleTop = scrollTop;
    const visibleBottom = scrollTop + containerHeight;

    if (tabTop < visibleTop) {
      scrollTop = tabTop - 10;
    } else if (tabBottom > visibleBottom) {
      scrollTop = tabBottom - containerHeight + 10;
    }

    const maxScrollTop = containerScrollHeight - containerHeight;
    scrollTop = Math.max(0, Math.min(scrollTop, maxScrollTop));

    const currentScrollLeft = this.tabContainer.scrollLeft;
    const currentScrollTop = this.tabContainer.scrollTop;

    if (Math.abs(currentScrollLeft - scrollLeft) > 5 || Math.abs(currentScrollTop - scrollTop) > 5) {
      this.tabContainer.scrollTo({
        left: scrollLeft,
        top: scrollTop,
        behavior: SCROLL_CONFIG.BEHAVIOR
      });

      setTimeout(() => {
        onComplete?.();
      }, 350);
    } else {
      onComplete?.();
    }
  }

  /**
   * Set scrolling priority (suppress hover updates during scroll)
   */
  setScrollingPriority() {
    this.tabContainer.classList.add(CLASSES.IS_SCROLLING);
    this.onScrollStart();
    
    if (this.scrollPriorityTimeout) {
      clearTimeout(this.scrollPriorityTimeout);
    }
    
    this.scrollPriorityTimeout = setTimeout(() => {
      this.tabContainer.classList.remove(CLASSES.IS_SCROLLING);
      this.onScrollEnd();
      this.scrollPriorityTimeout = null;
    }, SCROLL_CONFIG.PRIORITY_MS);
  }

  /**
   * Check if currently scrolling
   * @returns {boolean}
   */
  isScrolling() {
    return this.tabContainer.classList.contains(CLASSES.IS_SCROLLING);
  }

  /**
   * Update scroll speed setting
   * @param {number} speed - New scroll speed
   */
  updateScrollSpeed(speed) {
    this.scrollSpeed = speed;
  }

  _handleScroll() {
    this.setScrollingPriority();
    const currentScrollLeft = this.tabContainer.scrollLeft;
    const maxScroll = this.tabContainer.scrollWidth - this.tabContainer.offsetWidth;
    
    if ((currentScrollLeft <= 0 && this.lastScrollLeft <= 0) ||
        (currentScrollLeft >= maxScroll && this.lastScrollLeft >= maxScroll)) {
      this.lastScrollLeft = currentScrollLeft;
      return;
    }
    this.lastScrollLeft = currentScrollLeft;
  }

  _handleWheel(e) {
    e.preventDefault();
    
    // Get scroll delta (prefer X for trackpads, fall back to Y)
    const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
    
    // Accumulate delta for smooth batching
    this._pendingDelta = (this._pendingDelta || 0) + delta;
    
    // Schedule scroll update
    if (!this._scrollPending) {
      this._scrollPending = true;
      requestAnimationFrame(() => {
        this._scrollPending = false;
        if (this._pendingDelta) {
          this.tabContainer.scrollLeft += this._pendingDelta * this.scrollSpeed * 5;
          this._pendingDelta = 0;
        }
      });
    }
  }
}

/**
 * Save scroll position anchor
 * @param {HTMLElement} container - Scrollable container
 * @returns {{tabId: string|null, offsetX: number, offsetY: number, scrollLeft: number, scrollTop: number}} Anchor data
 */
export function saveScrollAnchor(container) {
  const savedScrollLeft = container.scrollLeft;
  const savedScrollTop = container.scrollTop;
  const containerRect = container.getBoundingClientRect();
  
  let anchorTabId = null;
  let offsetInAnchorX = 0;
  let offsetInAnchorY = 0;

  // Find the first visible tab as the anchor
  const allTabs = Array.from(container.querySelectorAll('[data-tab-id]'));
  
  for (const el of allTabs) {
    const r = el.getBoundingClientRect();
    const contentLeft = r.left - containerRect.left + savedScrollLeft;
    const contentTop = r.top - containerRect.top + savedScrollTop;
    
    // Check if tab is visible in the viewport
    if (contentLeft + r.width > savedScrollLeft && 
        contentTop + r.height > savedScrollTop &&
        contentLeft < savedScrollLeft + container.clientWidth && 
        contentTop < savedScrollTop + container.clientHeight) {
      anchorTabId = el.dataset.tabId;
      offsetInAnchorX = savedScrollLeft - contentLeft;
      offsetInAnchorY = savedScrollTop - contentTop;
      break;
    }
  }

  // If no visible tab found, use the tab closest to the viewport
  if (!anchorTabId && allTabs.length > 0) {
    let bestTab = null;
    let bestDistance = Infinity;
    
    for (const el of allTabs) {
      const r = el.getBoundingClientRect();
      const contentLeft = r.left - containerRect.left + savedScrollLeft;
      const contentTop = r.top - containerRect.top + savedScrollTop;
      
      // Calculate distance from viewport
      const distX = contentLeft < savedScrollLeft 
        ? savedScrollLeft - (contentLeft + r.width)
        : contentLeft - (savedScrollLeft + container.clientWidth);
      const distY = contentTop < savedScrollTop
        ? savedScrollTop - (contentTop + r.height)
        : contentTop - (savedScrollTop + container.clientHeight);
      
      const distance = Math.max(0, distX) + Math.max(0, distY);
      
      if (distance < bestDistance) {
        bestDistance = distance;
        bestTab = el;
      }
    }
    
    if (bestTab) {
      anchorTabId = bestTab.dataset.tabId;
      const r = bestTab.getBoundingClientRect();
      const contentLeft = r.left - containerRect.left + savedScrollLeft;
      const contentTop = r.top - containerRect.top + savedScrollTop;
      offsetInAnchorX = savedScrollLeft - contentLeft;
      offsetInAnchorY = savedScrollTop - contentTop;
    }
  }

  return { tabId: anchorTabId, offsetX: offsetInAnchorX, offsetY: offsetInAnchorY, scrollLeft: savedScrollLeft, scrollTop: savedScrollTop };
}

/**
 * Restore scroll position from anchor
 * @param {HTMLElement} container - Scrollable container
 * @param {{tabId: string|null, offsetX: number, offsetY: number, scrollLeft: number, scrollTop: number}} anchor - Anchor data
 */
export function restoreScrollAnchor(container, anchor) {
  if (!anchor || (!anchor.tabId && anchor.scrollLeft === undefined)) {
    return;
  }

  const maxL = Math.max(0, container.scrollWidth - container.clientWidth);
  const maxT = Math.max(0, container.scrollHeight - container.clientHeight);

  // First try to restore using the anchor tab
  if (anchor.tabId) {
    const anchorEl = container.querySelector(`[data-tab-id="${anchor.tabId}"]`);
    if (anchorEl) {
      const containerRect = container.getBoundingClientRect();
      const r = anchorEl.getBoundingClientRect();
      const contentLeft = r.left - containerRect.left + container.scrollLeft;
      const contentTop = r.top - containerRect.top + container.scrollTop;
      const newScrollLeft = Math.max(0, Math.min(contentLeft - anchor.offsetX, maxL));
      const newScrollTop = Math.max(0, Math.min(contentTop - anchor.offsetY, maxT));
      
      container.scrollTo({
        left: newScrollLeft,
        top: newScrollTop,
        behavior: 'auto'
      });
      return;
    }
  }

  // Anchor tab not found - try to find closest tab to original position
  const allTabs = Array.from(container.querySelectorAll('[data-tab-id]'));
  if (allTabs.length > 0 && anchor.scrollLeft !== undefined) {
    const containerRect = container.getBoundingClientRect();
    const originalViewportLeft = anchor.scrollLeft;
    const originalViewportTop = anchor.scrollTop;
    
    let bestTab = null;
    let bestDistance = Infinity;

    for (const tab of allTabs) {
      const r = tab.getBoundingClientRect();
      const contentLeft = r.left - containerRect.left + container.scrollLeft;
      const contentTop = r.top - containerRect.top + container.scrollTop;
      
      // Distance from where the viewport was
      const distance = Math.abs(contentLeft - originalViewportLeft) + 
                      Math.abs(contentTop - originalViewportTop);
      
      if (distance < bestDistance) {
        bestDistance = distance;
        bestTab = { el: tab, contentLeft, contentTop };
      }
    }

    if (bestTab) {
      // Restore relative to the best matching tab
      const newScrollLeft = Math.max(0, Math.min(bestTab.contentLeft - anchor.offsetX, maxL));
      const newScrollTop = Math.max(0, Math.min(bestTab.contentTop - anchor.offsetY, maxT));
      
      container.scrollTo({
        left: newScrollLeft,
        top: newScrollTop,
        behavior: 'auto'
      });
      return;
    }
  }

  // Fallback to absolute scroll position
  if (anchor.scrollLeft !== undefined || anchor.scrollTop !== undefined) {
    container.scrollTo({
      left: Math.max(0, Math.min(anchor.scrollLeft || 0, maxL)),
      top: Math.max(0, Math.min(anchor.scrollTop || 0, maxT)),
      behavior: 'auto'
    });
  }
}
