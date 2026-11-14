const STORAGE_KEY = 'chatmeter_state_v1';
const hasChromeStorage = typeof chrome !== 'undefined' && Boolean(chrome.storage?.local);

const initialEvents = [
  { id: 'e8', title: 'Prompt counted', detail: 'GPT-4.1 mini · 1 message', at: new Date(Date.now() - 8 * 60 * 1000).toISOString() },
  { id: 'e7', title: 'Prompt counted', detail: 'GPT-4.1 mini · 1 message', at: new Date(Date.now() - 34 * 60 * 1000).toISOString() },
  { id: 'e6', title: 'Prompt counted', detail: 'GPT-4.1 mini · 1 message', at: new Date(Date.now() - 75 * 60 * 1000).toISOString() },
  { id: 'e5', title: 'New session', detail: 'GPT-4.1 mini · 8 messages', at: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString() },
  { id: 'e4', title: 'Prompt counted', detail: 'GPT-4.1 mini · 1 message', at: new Date(Date.now() - 5.2 * 60 * 60 * 1000).toISOString() },
  { id: 'e3', title: 'New session', detail: 'GPT-4.1 mini · 5 messages', at: new Date(Date.now() - 7.8 * 60 * 60 * 1000).toISOString() },
  { id: 'e2', title: 'Prompt counted', detail: 'GPT-4.1 mini · 1 message', at: new Date(Date.now() - 21 * 60 * 60 * 1000).toISOString() },
  { id: 'e1', title: 'New session', detail: 'GPT-4.1 mini · 4 messages', at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString() }
];

function createInitialState() {
  return {
    plan: 'Plus',
    model: 'GPT-4.1 mini',
    used: 39,
    limit: 80,
    resetAt: new Date(Date.now() + 2 * 60 * 60 * 1000 + 14 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    events: initialEvents,
    prefs: { showPrivacy: true }
  };
}

let state = createInitialState();

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

async function readState() {
  if (hasChromeStorage) {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    return result[STORAGE_KEY] ? { ...createInitialState(), ...result[STORAGE_KEY] } : createInitialState();
  }
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    return saved ? { ...createInitialState(), ...saved } : createInitialState();
  } catch {
    return createInitialState();
  }
}

async function writeState() {
  const snapshot = clone(state);
  if (hasChromeStorage) {
    await chrome.storage.local.set({ [STORAGE_KEY]: snapshot });
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  }
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function formatRelative(iso) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatResetDate(iso) {
  const date = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const day = date.toDateString() === today.toDateString() ? 'Today' : date.toDateString() === tomorrow.toDateString() ? 'Tomorrow' : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${day}, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

function formatCountdown(iso) {
  const remaining = Math.max(0, new Date(iso).getTime() - Date.now());
  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

function statusFor(ratio) {
  if (ratio >= 0.85) return { label: 'DANGER', className: 'danger', color: 'var(--red)' };
  if (ratio >= 0.65) return { label: 'WATCH', className: 'warning', color: 'var(--orange)' };
  return { label: 'NORMAL', className: '', color: 'var(--lime)' };
}

function renderActivity() {
  const list = $('#activityList');
  const events = [...(state.events || [])].sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 8);
  $('#activityCount').textContent = events.length;
  $('#activityTotal').textContent = `${events.length} events`;
  list.innerHTML = events.map((event) => `
    <div class="activity-item">
      <span class="activity-icon">↗</span>
      <div class="activity-copy"><strong>${event.title}</strong><span>${event.detail}</span></div>
      <span class="activity-time">${formatRelative(event.at)}</span>
    </div>
  `).join('');
}

function render() {
  const ratio = clamp(Number(state.used) / Math.max(Number(state.limit), 1), 0, 1);
  const percent = Math.round(ratio * 100);
  const status = statusFor(ratio);
  const remaining = Math.max(Number(state.limit) - Number(state.used), 0);

  $('#usedValue').textContent = state.used;
  $('#limitValue').textContent = state.limit;
  $('#remainingValue').textContent = remaining;
  $('#percentValue').textContent = `${percent}%`;
  $('#ringValue').textContent = `${percent}%`;
  $('#planValue').textContent = state.plan;
  $('#modelValue').textContent = state.model;
  $('#resetCountdown').textContent = formatCountdown(state.resetAt);
  $('#resetDate').textContent = formatResetDate(state.resetAt);
  $('#updatedAt').textContent = formatRelative(state.updatedAt);
  $('#todayCount').textContent = state.used;
  $('#todayBar').style.width = `${Math.max(percent, 3)}%`;

  const fill = $('#progressFill');
  fill.style.width = `${Math.max(percent, 2)}%`;
  fill.style.background = status.color;
  fill.style.boxShadow = `0 0 15px color-mix(in srgb, ${status.color} 35%, transparent)`;
  const ring = $('#usageRing');
  ring.style.setProperty('--ring', `${Math.max(percent, 2) * 3.6}deg`);
  ring.style.setProperty('--ring-color', status.color);
  ring.setAttribute('aria-label', `${percent} percent of message limit used`);

  const badge = $('#statusBadge');
  badge.textContent = status.label;
  badge.className = `status-badge ${status.className}`;
  $('#limitInput').value = state.limit;
  $('#privacyToggle').checked = state.prefs?.showPrivacy !== false;
  $('#privacyCard').hidden = state.prefs?.showPrivacy === false;
  renderActivity();
}

async function logPrompt() {
  state.used = Math.min(Number(state.limit), Number(state.used) + 1);
  state.updatedAt = new Date().toISOString();
  state.events = [{ id: `e${Date.now()}`, title: 'Prompt counted', detail: `${state.model} · 1 message`, at: state.updatedAt }, ...(state.events || [])].slice(0, 30);
  await writeState();
  render();
}

async function resetData() {
  state = createInitialState();
  await writeState();
  render();
}

function setTab(tab) {
  const isOverview = tab === 'overview';
  $('#overviewPanel').classList.toggle('is-visible', isOverview);
  $('#overviewPanel').setAttribute('aria-hidden', String(!isOverview));
  $('#activityPanel').classList.toggle('is-visible', !isOverview);
  $('#activityPanel').setAttribute('aria-hidden', String(isOverview));
  $$('.segment').forEach((button) => {
    const active = button.dataset.tab === tab;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-selected', String(active));
  });
}

function setDrawer(open) {
  const drawer = $('#settingsDrawer');
  drawer.classList.toggle('is-open', open);
  drawer.setAttribute('aria-hidden', String(!open));
  $('#drawerScrim').hidden = !open;
  if (open) $('#limitInput').focus();
}

async function applyLimit() {
  const value = clamp(Number($('#limitInput').value) || 80, 1, 9999);
  state.limit = value;
  state.used = Math.min(state.used, value);
  state.updatedAt = new Date().toISOString();
  await writeState();
  render();
}

async function applyPrivacy() {
  state.prefs = { ...(state.prefs || {}), showPrivacy: $('#privacyToggle').checked };
  await writeState();
  render();
}

function wireEvents() {
  $$('.segment').forEach((button) => button.addEventListener('click', () => setTab(button.dataset.tab)));
  $('#logUsageButton').addEventListener('click', logPrompt);
  $('#settingsButton').addEventListener('click', () => setDrawer(true));
  $('#footerSettingsButton').addEventListener('click', () => setDrawer(true));
  $('#closeSettingsButton').addEventListener('click', () => setDrawer(false));
  $('#drawerScrim').addEventListener('click', () => setDrawer(false));
  $('#limitInput').addEventListener('change', applyLimit);
  $('#privacyToggle').addEventListener('change', applyPrivacy);
  $('#resetDataButton').addEventListener('click', async () => {
    if (window.confirm('Reset all locally stored ChatMeter data?')) {
      await resetData();
      setDrawer(false);
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setDrawer(false);
  });

  if (hasChromeStorage) {
    chrome.storage.onChanged.addListener((changes) => {
      if (changes[STORAGE_KEY]?.newValue) {
        state = { ...createInitialState(), ...changes[STORAGE_KEY].newValue };
        render();
      }
    });
  }
}

async function boot() {
  state = await readState();
  wireEvents();
  render();
  window.setInterval(render, 30000);
}

boot();
