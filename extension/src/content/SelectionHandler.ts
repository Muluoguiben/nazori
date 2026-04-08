export interface SelectionInfo {
  text: string;
  rect: DOMRect;
}

const HOST_ID = 'nazori-translation-host';

/**
 * Returns information about the current text selection, or null if no
 * meaningful selection exists.
 */
export function getSelectionInfo(): SelectionInfo | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const text = selection.toString().trim();
  if (text.length < 1) {
    return null;
  }

  const range = selection.getRangeAt(0);

  // Ignore selections inside our own shadow host
  const ancestor = range.commonAncestorContainer;
  const hostEl =
    ancestor instanceof HTMLElement
      ? ancestor.closest(`#${HOST_ID}`)
      : ancestor.parentElement?.closest(`#${HOST_ID}`);
  if (hostEl) {
    return null;
  }

  const rect = range.getBoundingClientRect();

  // Sanity check: zero-area rects indicate collapsed selections
  if (rect.width === 0 && rect.height === 0) {
    return null;
  }

  return { text, rect };
}

const BUBBLE_MARGIN = 8;

/**
 * Calculate the ideal position for the translation bubble relative to the
 * viewport. Prefers placing the bubble below-right of the selection, but
 * flips when the bubble would overflow the viewport.
 */
export function calculateBubblePosition(
  selectionRect: DOMRect,
  bubbleWidth: number,
  bubbleHeight: number,
): { top: number; left: number } {
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;

  // ------ Vertical placement ------
  // Prefer below the selection
  let top = selectionRect.bottom + BUBBLE_MARGIN;

  // If it would overflow the bottom, try above
  if (top + bubbleHeight > viewportH - BUBBLE_MARGIN) {
    const above = selectionRect.top - BUBBLE_MARGIN - bubbleHeight;
    if (above >= BUBBLE_MARGIN) {
      top = above;
    } else {
      // Neither fits perfectly — pick whichever side has more room
      top =
        viewportH - selectionRect.bottom > selectionRect.top
          ? selectionRect.bottom + BUBBLE_MARGIN
          : Math.max(BUBBLE_MARGIN, selectionRect.top - BUBBLE_MARGIN - bubbleHeight);
    }
  }

  // ------ Horizontal placement ------
  // Align left edge with the selection's left, but keep within viewport
  let left = selectionRect.left;

  if (left + bubbleWidth > viewportW - BUBBLE_MARGIN) {
    left = viewportW - BUBBLE_MARGIN - bubbleWidth;
  }
  if (left < BUBBLE_MARGIN) {
    left = BUBBLE_MARGIN;
  }

  return { top, left };
}
