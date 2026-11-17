import { useLayoutEffect, useState } from "react";

// Count only the characters on the caret's rendered row, including inline text.
function columnAt(node, offset, caret, view) {
  let block = node.parentElement;
  while (block.parentElement && block !== view &&
    /^(inline|contents)/.test(getComputedStyle(block).display)) {
    block = block.parentElement;
  }
  const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
  walker.currentNode = node;
  const range = document.createRange();
  let column = 1;
  do {
    for (let i = offset - 1; i >= 0; i--) {
      range.setStart(node, i);
      range.setEnd(node, i + 1);
      const rect = range.getBoundingClientRect();
      if (!rect.height || !rect.width) continue;
      if (rect.bottom <= caret.top + 1) return column;
      if (rect.top < caret.bottom - 1 && rect.bottom > caret.top + 1) column++;
    }
    node = walker.previousNode();
    offset = node?.length || 0;
  } while (node);
  return column;
}

export function useEditorPosition(editorRef, active) {
  const [gutter, setGutter] = useState({ count: 1, top: 0, height: 25 });
  const [position, setPosition] = useState({ line: 1, column: 1 });

  useLayoutEffect(() => {
    const editor = editorRef.current;
    const view = editor?.querySelector(".fileview:not([hidden])");
    setPosition({ line: 1, column: 1 });
    if (!active || !view) return;

    const content = view.parentElement;
    const sheet = content.parentElement;
    let metrics, caret, frame;
    const lineAt = (y) => Math.max(1, Math.min(metrics.count,
      1 + Math.floor(y / metrics.lineHeight)));
    const updatePosition = () => {
      if (!metrics) return;
      let line = lineAt(editor.scrollTop), column = 1;
      if (caret?.field && view.contains(caret.field)) {
        const field = caret.field;
        const before = field.value.slice(0, field.selectionStart ?? field.value.length);
        const rows = before.split("\n");
        const rect = field.getBoundingClientRect();
        const style = getComputedStyle(field);
        const rowHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2;
        line = lineAt(rect.top - sheet.getBoundingClientRect().top +
          parseFloat(style.paddingTop) + (rows.length - 0.5) * rowHeight);
        column = rows.at(-1).length + 1;
      } else if (caret?.node && view.contains(caret.node)) {
        const { node } = caret;
        const offset = Math.min(caret.offset, node.length);
        const range = document.createRange();
        range.setStart(node, offset);
        range.collapse(true);
        const rect = range.getBoundingClientRect();
        if (rect.height) {
          line = lineAt((rect.top + rect.bottom) / 2 - sheet.getBoundingClientRect().top);
          column = columnAt(node, offset, rect, view);
        }
      }
      setPosition((previous) => previous.line === line && previous.column === column
        ? previous : { line, column });
    };
    const measure = () => {
      // Include the blank first row, but stop numbering at the active file's end.
      const leadingSpace = parseFloat(getComputedStyle(content).paddingTop) || 0;
      const height = leadingSpace + view.getBoundingClientRect().height;
      const lineHeight = parseFloat(getComputedStyle(sheet.querySelector(".gutter")).lineHeight);
      const count = Math.max(1, Math.floor(height / lineHeight));
      metrics = { count, lineHeight };
      const next = { count, top: 0, height: Math.min(height, count * lineHeight) };
      setGutter((previous) => Object.keys(next).every((key) => next[key] === previous[key])
        ? previous : next);
      updatePosition();
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const captureCaret = () => {
      const field = document.activeElement;
      if (view.contains(field) && field.matches("input, textarea")) {
        caret = { field };
      } else {
        const selection = window.getSelection();
        let node = selection?.focusNode;
        let offset = selection?.focusOffset;
        if (!node || !view.contains(node)) return;
        if (node.nodeType !== Node.TEXT_NODE) {
          const atEnd = offset > 0;
          const child = node.childNodes[atEnd ? offset - 1 : 0];
          if (!child) return;
          const walker = document.createTreeWalker(child, NodeFilter.SHOW_TEXT);
          node = child.nodeType === Node.TEXT_NODE ? child : walker.nextNode();
          if (atEnd) {
            let next;
            while ((next = walker.nextNode())) node = next;
          }
          if (!node) return;
          offset = atEnd ? node.length : 0;
        }
        caret = { node, offset };
      }
      updatePosition();
    };

    measure();
    const observer = new ResizeObserver(schedule);
    observer.observe(view);
    observer.observe(content);
    observer.observe(editor);
    editor.addEventListener("scroll", updatePosition, { passive: true });
    for (const event of ["pointerup", "keyup", "input", "select", "focusin"]) {
      editor.addEventListener(event, captureCaret);
    }
    document.addEventListener("selectionchange", captureCaret);
    document.fonts?.addEventListener("loadingdone", schedule);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      editor.removeEventListener("scroll", updatePosition);
      for (const event of ["pointerup", "keyup", "input", "select", "focusin"]) {
        editor.removeEventListener(event, captureCaret);
      }
      document.removeEventListener("selectionchange", captureCaret);
      document.fonts?.removeEventListener("loadingdone", schedule);
    };
  }, [editorRef, active]);

  return { gutter, ...position };
}
