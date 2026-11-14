# ChatMeter

ChatMeter is an original, local-first Chrome/Edge Manifest V3 extension-style tracker for ChatGPT usage. It surfaces the current message count, plan/model context, limit health, reset timing, recent activity, and settings without sending usage data to a server.

## Preview

```bash
npm run start
```

Open the managed preview or visit `http://localhost:3000` locally. The preview uses `localStorage` when the Chrome extension storage API is unavailable.

## Load the extension

```bash
npm run build
```

Open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select the generated `dist/` folder. The content script watches ChatGPT composer submissions and records prompt events in `chrome.storage.local`.

## Notes

The daily/current-cycle limit is configurable from Tracker settings. The dashboard ships with demo activity so the UI is useful immediately; use **Reset local data** to clear it in the current browser. The reference review and feature inspiration are documented in [RESEARCH.md](./RESEARCH.md).
