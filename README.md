# ChatMeter

> A local-first ChatGPT usage tracker for Chromium browsers.

ChatMeter is a small Chrome/Edge extension I built to keep ChatGPT usage visible while I work. The popup shows the current message count, configured limit, plan and model, reset timing, recent activity, and a simple usage status.

![ChatMeter dashboard preview](docs/preview.png)

Maintained by [sshnox](https://github.com/sshnox).

## What it does

- Shows messages used, messages remaining, and percentage used
- Displays the selected plan and active model
- Changes the meter between normal, watch, and danger states
- Shows a reset countdown and next reset time
- Keeps a small activity list of recent prompts and sessions
- Includes Overview and Activity tabs
- Lets you change the cycle limit and clear local history
- Runs as a Manifest V3 extension in Chromium browsers
- Includes a local preview so you can try the popup without installing it

## Install from source

ChatMeter is currently distributed as an unpacked developer build.

1. Clone this repository.
2. Run `npm run build`.
3. Open `chrome://extensions` in Chrome, Edge, Brave, Arc, or another Chromium browser.
4. Turn on **Developer mode**.
5. Choose **Load unpacked** and select the `dist/` directory.
6. Pin ChatMeter, open ChatGPT, and then open the ChatMeter popup.

The `dist/` directory is included for convenience. Run the build command again after changing the source files.

## Local preview

You can preview the popup without installing the extension:

```bash
npm run start
```

Open `http://localhost:3000`. The preview uses `localStorage` because `chrome.storage.local` is only available inside an installed extension. Use **+ log prompt** to try the activity feed and usage meter.

## Development commands

```bash
npm run start   # Run the preview on port 3000
npm run check   # Check JavaScript syntax
npm run build   # Build the unpacked extension into dist/
```

There are no runtime dependencies. The popup uses plain HTML, CSS, and browser JavaScript.

## How it works

The popup and background service worker share one `chatmeter_state_v1` record in `chrome.storage.local`. The content script watches the ChatGPT composer for a submission and sends a small event message to the service worker. The event contains a timestamp and a count, not the text of the prompt.

When the extension is not installed, the preview uses the same state shape in `localStorage`. The popup listens for storage changes so it can update when a prompt is recorded in another tab.

## Privacy and permissions

ChatMeter stores usage data in the browser and does not have a backend, login, analytics, or API key.

- **Storage:** saves the usage count, activity list, limit, and settings locally.
- **ChatGPT host access:** limited to `https://chatgpt.com/*` and `https://chat.openai.com/*` so prompt submissions can be counted.
- **No prompt text:** the content script sends an event signal only.
- **No network service:** usage data is not sent anywhere.
- **Clear anytime:** use **Reset local data** in settings to remove the local history.

The limit and reset values are configurable estimates. They are not an official OpenAI quota API or a billing meter.

## Project layout

```text
.
├── index.html          # Popup UI and settings drawer
├── styles.css          # Popup styles
├── app.js              # Popup state and interactions
├── background.js       # MV3 service worker
├── content.js          # ChatGPT composer event detection
├── manifest.json       # Extension metadata and permissions
├── build.mjs           # Builds the dist/ folder
├── server.mjs          # Local preview server
├── dist/               # Loadable unpacked extension
└── docs/preview.png    # README screenshot
```

## Contributing

Issues and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) before making a change. Please keep the extension local-first, avoid adding permissions without a clear reason, and do not add prompt-content collection.

## License

ChatMeter is released under the [MIT License](LICENSE).
