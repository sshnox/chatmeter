const STORAGE_KEY = 'chatmeter_state_v1';

function initialState() {
  return {
    plan: 'Plus',
    model: 'GPT-4.1 mini',
    used: 0,
    limit: 80,
    resetAt: new Date(Date.now() + 2 * 60 * 60 * 1000 + 14 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    events: [],
    prefs: { showPrivacy: true }
  };
}

chrome.runtime.onInstalled.addListener(async () => {
  const current = await chrome.storage.local.get(STORAGE_KEY);
  if (!current[STORAGE_KEY]) await chrome.storage.local.set({ [STORAGE_KEY]: initialState() });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'CHATMETER_PROMPT') return;
  chrome.storage.local.get(STORAGE_KEY).then(async (result) => {
    const state = { ...initialState(), ...(result[STORAGE_KEY] || {}) };
    const now = new Date().toISOString();
    state.used = Math.min(Number(state.limit), Number(state.used) + 1);
    state.updatedAt = now;
    state.events = [{ id: `page-${Date.now()}`, title: 'Prompt counted', detail: `${state.model} · 1 message`, at: now }, ...(state.events || [])].slice(0, 30);
    await chrome.storage.local.set({ [STORAGE_KEY]: state });
    sendResponse({ ok: true });
  });
  return true;
});
