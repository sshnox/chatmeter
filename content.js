(() => {
  let lastSentAt = 0;

  function notifyPrompt() {
    const now = Date.now();
    if (now - lastSentAt < 1200) return;
    lastSentAt = now;
    chrome.runtime.sendMessage({ type: 'CHATMETER_PROMPT' }).catch(() => {});
  }

  document.addEventListener('keydown', (event) => {
    const target = event.target;
    if (event.key === 'Enter' && !event.shiftKey && target instanceof HTMLElement && (target.matches('textarea') || target.isContentEditable)) {
      window.setTimeout(notifyPrompt, 250);
    }
  }, true);

  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const sendButton = target?.closest('button[aria-label*="Send" i], button[data-testid*="send" i]');
    if (sendButton) window.setTimeout(notifyPrompt, 250);
  }, true);
})();
