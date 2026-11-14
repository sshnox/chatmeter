# ChatMeter

> A local-first ChatGPT usage tracker for Chromium browsers.

ChatMeter is a small Manifest V3 browser extension that gives you a clear, private view of your ChatGPT usage. It shows the current message count, configured limit, plan and model context, reset timing, recent activity, and a compact health signal without sending usage data to a server.

![ChatMeter dashboard preview](docs/preview.png)

## Why ChatMeter?

ChatGPT usage limits can be difficult to keep in view while you work. ChatMeter turns that state into a focused popup: one glance tells you how much of the current cycle you have used, how much remains, and when the cycle is expected to reset.

The project is intentionally local-first. The extension uses `chrome.storage.local`, requests only the `storage` permission, and runs its content script only on ChatGPT pages. There is no account system, analytics endpoint, remote database, or API key.

## Features

- Current-cycle message count with remaining messages and percentage used
- Plan and active-model context in the popup
- Normal, watch, and danger threshold states as usage increases
- Reset countdown and next reset date/time
- Recent prompt/session activity feed with relative timestamps
- Overview and Activity tabs in a compact popup layout
- Settings for the cycle limit, privacy reminder, and local-data reset
- Chromium Manifest V3 packaging with a background service worker
- Local preview fallback using `localStorage` when the extension API is unavailable
- ChatGPT composer detection for prompt events on `chatgpt.com` and `chat.openai.com`

## Install from source

ChatMeter is currently distributed as an unpacked developer build.

1. Clone this repository.
2. Run `npm run build`.
3. Open `chrome://extensions` in Chrome, Edge, Brave, Arc, or another Chromium browser.
4. Turn on **Developer mode**.
5. Choose **Load unpacked** and select the generated `dist/` directory.
6. Pin ChatMeter from the extensions menu, then open ChatGPT and the ChatMeter popup.

The generated `dist/` directory is checked in so reviewers can inspect the exact loadable bundle. Rebuild it after changing source files.

## Local preview

The popup can be previewed without installing the extension:

```bash
npm run start
```

Then open `http://localhost:3000`. The preview uses browser `localStorage` as a fallback because `chrome.storage.local` is only available inside the extension runtime. Use **+ log prompt** to exercise the activity feed and meter.

## Development commands

```bash
npm run start   # Run the local preview on port 3000
npm run check   # Check JavaScript syntax
npm run build   # Emit the loadable dist/ extension bundle
```

The project intentionally has no runtime dependencies. The UI is built with semantic HTML, plain CSS, and browser JavaScript so the extension remains small and easy to audit.

## How it works

The popup reads a single `chatmeter_state_v1` snapshot from `chrome.storage.local`. The background service worker creates the initial snapshot and receives `CHATMETER_PROMPT` messages from the content script. The content script watches for Enter submissions in the ChatGPT composer and clicks on send buttons, then records only a local event count and timestamp. It does not read or transmit prompt text.

The popup also listens for storage changes, so the dashboard can update when a prompt is recorded while ChatGPT is open in another tab. In a normal browser preview, the same state model is persisted to `localStorage`.

## Privacy and permissions

ChatMeter is designed to be auditable:

- **Storage permission:** used only to retain the usage snapshot and settings locally.
- **ChatGPT host access:** limited to `https://chatgpt.com/*` and `https://chat.openai.com/*` so prompt submissions can be counted.
- **No prompt text collection:** the content script sends an event signal, not the text you typed.
- **No network service:** the extension has no backend, telemetry endpoint, login, or API key.
- **Reset anytime:** the settings drawer removes the locally stored usage history from the current browser.

The limit and reset values are user-configured approximations. They are not an official OpenAI quota API and should not be treated as billing or availability guarantees.

## Project layout

```text
.
├── index.html          # Popup UI and settings drawer
├── styles.css          # Original dark graphite/citron visual system
├── app.js              # Popup state, rendering, tabs, and local persistence
├── background.js       # MV3 service worker for local prompt events
├── content.js          # ChatGPT composer event detection
├── manifest.json       # Browser extension metadata and permissions
├── build.mjs           # Copies the loadable bundle into dist/
├── server.mjs          # Dependency-free local preview server
├── dist/               # Generated unpacked extension bundle
└── docs/preview.png    # Dashboard screenshot used in this README
```

## Contributing

Issues and pull requests are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before making a change. Keep the extension local-first, avoid adding permissions without a clear need, and do not introduce prompt-content collection.

## License

ChatMeter is released under the [MIT License](LICENSE).

## Acknowledgements

The feature direction was informed by reviewing public open-source usage tracker patterns, including [GPT Stats](https://github.com/fchavonet/chrome_extension-gpt_stats), [AI Usage Extension](https://github.com/cupcakedev/ai-usage-extension), and [ChatGPT Token Counter](https://github.com/Dhruvg0/Chatgpt-token-counter). ChatMeter does not copy their source code, branding, or exact visual design.
