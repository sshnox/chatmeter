/* ChatMeter 0.3.1: best-effort, privacy-first browser-observed submissions.
 * A send gesture arms ONE observation. A newly rendered user message confirms it.
 * No prompt text, content, or account identifiers are sent or persisted.
 */
(() => {
  const USER_MESSAGE = '[data-message-author-role="user"]';
  const COMPOSER = '#prompt-textarea, textarea, [contenteditable="true"][data-testid*="composer"]';
  const SEND_BUTTON = 'button[aria-label*="Send" i], button[data-testid*="send" i]';
  const seenNodes = new WeakSet();
  const seenIds = new Set();
  const pending = [];
  const ARM_LIFETIME_MS = 10000;
  const GESTURE_COALESCE_MS = 120;
  let lastArmAt = -Infinity;
  let lastArmType = '';
  let currentUrl = location.href;

  function messageId(node) {
    return node.getAttribute?.('data-message-id') ||
      node.closest?.('[data-message-id]')?.getAttribute?.('data-message-id') ||
      null;
  }

  function remember(node) {
    seenNodes.add(node);
    const id = messageId(node);
    if (id) {
      seenIds.add(id);
      if (seenIds.size > 500) seenIds.delete(seenIds.values().next().value);
    }
  }

  function visibleMessage(node) {
    // Intentionally do not copy/store the text; only check for a nonempty message.
    return Boolean((node.innerText || node.textContent || '').trim());
  }

  function baseline() {
    document.querySelectorAll(USER_MESSAGE).forEach(remember);
  }
  baseline();

  function composerReady() {
    const composer = document.querySelector(COMPOSER);
    if (!composer) return false;
    return Boolean((composer.value || composer.innerText || composer.textContent || '').trim());
  }

  function arm(type) {
    if (!composerReady()) return;
    const now = Date.now();
    pending.splice(0, pending.length, ...pending.filter(t => t > now));
    // Prevent a duplicate Enter + click gesture for the same submission,
    // without suppressing separate real messages received seconds or milliseconds apart.
    if (type !== lastArmType && now - lastArmAt < GESTURE_COALESCE_MS) return;
    lastArmType = type;
    lastArmAt = now;
    pending.push(now + ARM_LIFETIME_MS);
  }

  function detect() {
    if (location.href !== currentUrl) {
      // The first send on the new-chat page commonly changes / to /c/{id}.
      // Preserve only that pending send; ordinary conversation navigation
      // clears pending gestures and baselines historical messages.
      const previousPath = new URL(currentUrl).pathname;
      const nextPath = new URL(location.href).pathname;
      const firstConversation = previousPath === '/' && nextPath.startsWith('/c/') && pending.length > 0;
      currentUrl = location.href;
      if (!firstConversation) {
        pending.length = 0;
        baseline();
        return;
      }
    }
    const now = Date.now();
    while (pending.length && pending[0] <= now) pending.shift();

    document.querySelectorAll(USER_MESSAGE).forEach(node => {
      if (seenNodes.has(node)) return;
      const id = messageId(node);
      if (id && seenIds.has(id)) { remember(node); return; }
      // React may insert an empty node before its message content arrives.
      if (!visibleMessage(node)) return;
      remember(node);
      if (!pending.length) return;
      pending.shift();
      chrome.runtime.sendMessage({ type: 'CHATMETER_PROMPT' }).catch(() => {});
    });
  }

  document.addEventListener('keydown', event => {
    if (!event.isTrusted || event.isComposing || event.defaultPrevented ||
        event.key !== 'Enter' || event.shiftKey || event.ctrlKey ||
        event.metaKey || event.altKey) return;
    const target = event.target;
    if (target instanceof HTMLElement &&
        (target.matches('textarea, #prompt-textarea') || Boolean(target.closest?.('[contenteditable="true"][data-testid*="composer"]')))) arm('keyboard');
  }, true);

  document.addEventListener('click', event => {
    if (!event.isTrusted) return;
    const button = event.target instanceof Element ? event.target.closest(SEND_BUTTON) : null;
    if (button && !button.disabled) arm('click');
  }, true);

  new MutationObserver(detect).observe(document.documentElement, {
    childList: true, subtree: true, characterData: true
  });
})();
