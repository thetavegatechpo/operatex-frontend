import { useEffect } from 'react';
import './buttonIcons.css';

/* Adds a functional icon in front of text-only buttons across every module
   (Add -> plus, Save -> disk, Delete -> bin, Export -> download ...).
   It only sets a `data-ox-icon` attribute; the icon itself is drawn by CSS (buttonIcons.css),
   so React state, handlers and layout of existing screens are never touched.
   Buttons that already contain an icon, icon-only buttons and navigation controls are skipped.
   Add class "ox-no-icon" to any button to opt out. */

const RULES = [
  [/\b(add|new|create|register|insert|attach)\b|^\+/, 'plus'],
  [/\b(save|update|apply|store|commit)\b/, 'save'],
  [/\b(submit|confirm|finish|done|ok)\b/, 'check'],
  [/\b(edit|modify|rename|change)\b/, 'edit'],
  [/\b(delete|remove|discard|purge|archive)\b/, 'trash'],
  [/\b(export|download|csv|excel|xlsx|pdf)\b/, 'download'],
  [/\b(import|upload|browse)\b/, 'upload'],
  [/\b(refresh|reload|sync|retry|recalculate|re-?run)\b/, 'refresh'],
  [/\b(search|find|lookup|query)\b/, 'search'],
  [/\b(filter|filters)\b/, 'filter'],
  [/\b(reset|undo|revert|rollback|restore)\b/, 'undo'],
  [/\b(cancel|close|dismiss|clear|abort)\b/, 'x'],
  [/\b(print)\b/, 'print'],
  [/\b(copy|duplicate|clone)\b/, 'copy'],
  [/\b(approve|accept|release|verify|complete|resolve|acknowledge|ack)\b/, 'approve'],
  [/\b(reject|deny|decline)\b/, 'reject'],
  [/\b(disable|deactivate|block|suspend)\b/, 'ban'],
  [/\b(stop|halt)\b/, 'stop'],
  [/\b(pause|hold)\b/, 'pause'],
  [/\b(start|run|execute|resume|activate|enable|test|simulate|trigger)\b/, 'play'],
  [/\b(view|details?|open|preview|show|inspect)\b/, 'eye'],
  [/\b(back|previous|return)\b/, 'back'],
  [/\b(history|audit|timeline|log|logs)\b/, 'history'],
  [/\b(report|document|sop|template)\b/, 'file'],
  [/\b(send|notify|dispatch|publish)\b/, 'send'],
  [/\b(alert|alarm|notification)\b/, 'bell'],
  [/\b(lock|unlock|permission|permissions|access)\b/, 'lock'],
  [/\b(link|map|assign|bind|connect|mapping)\b/, 'link'],
  [/\b(schedule|calendar|shift|plan)\b/, 'calendar'],
  [/\b(settings|configure|config|setup|rules?)\b/, 'sliders'],
  [/\b(scan|validate|barcode|trace)\b/, 'scan'],
  [/\b(chart|trend|analytics|kpi|oee)\b/, 'chart'],
  [/\b(maintenance|repair|breakdown|tool)\b/, 'wrench'],
  [/\b(user|operator|profile)\b/, 'user']
];

const BUTTON = 'button,.btn,a.btn,[role="button"]';
const SKIP = '.page-link,.accordion-button,.btn-close,.nav-link,[role="tab"],[role="switch"],[role="menuitem"],.ox-theme-toggle,.collapse-btn,.sidebar button,.ox-no-icon,.recharts-wrapper *';
const HAS_ICON = 'svg,img,i,.bi,[class*="icon"],[class*="Icon"]';

function label(el) {
  return (el.textContent || el.getAttribute('aria-label') || el.getAttribute('title') || '')
    .replace(/\s+/g, ' ').trim().toLowerCase();
}

function decorate(el) {
  if (!(el instanceof HTMLElement) || !el.matches(BUTTON) || el.matches(SKIP) || el.closest('.sidebar')) return;
  if (el.querySelector(HAS_ICON)) { if (el.dataset.oxIcon) delete el.dataset.oxIcon; return; }
  const text = label(el);
  if (!text || text.length > 38) { if (el.dataset.oxIcon) delete el.dataset.oxIcon; return; }
  const hit = RULES.find(([re]) => re.test(text));
  if (hit) { if (el.dataset.oxIcon !== hit[1]) el.dataset.oxIcon = hit[1]; }
  else if (el.dataset.oxIcon) delete el.dataset.oxIcon;
}

function scan(root) {
  if (!(root instanceof Element)) return;
  decorate(root);
  root.querySelectorAll?.(BUTTON).forEach(decorate);
}

export default function ButtonIcons() {
  useEffect(() => {
    let queue = new Set();
    let frame = 0;
    const flush = () => { frame = 0; const items = queue; queue = new Set(); items.forEach(scan); };
    const push = node => { if (node) { queue.add(node); if (!frame) frame = requestAnimationFrame(flush); } };

    scan(document.body);
    const mo = new MutationObserver(list => {
      for (const m of list) {
        if (m.type === 'characterData') push(m.target.parentElement?.closest(BUTTON));
        else m.addedNodes.forEach(n => n.nodeType === 1 ? push(n) : push(n.parentElement?.closest(BUTTON)));
      }
    });
    mo.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => { mo.disconnect(); if (frame) cancelAnimationFrame(frame); };
  }, []);
  return null;
}
