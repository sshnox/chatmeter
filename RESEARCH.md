# Reference review

The implementation is an original browser-extension-style tracker. The following public GitHub projects were reviewed for feature patterns only; no repository source, branding, or exact visual design is copied.

## Patterns used as inspiration

- [GPT Stats](https://github.com/fchavonet/chrome_extension-gpt_stats) emphasizes local browser storage, prompt counts, time spent, persistent history, and an offline-friendly popup dashboard.
- [AI Usage Extension](https://github.com/cupcakedev/ai-usage-extension) emphasizes plan/provider usage percentages, reset timing, configurable refresh, a popup surface, and privacy-forward messaging.
- [ChatGPT Token Counter](https://github.com/Dhruvg0/Chatgpt-token-counter) emphasizes progress thresholds, model detection, plan-aware limits, reset timers, and no external network requests.

## Product decisions for ChatMeter

ChatMeter keeps the most useful patterns for a focused ChatGPT tracker: message usage, plan/model context, a limit meter with normal/warning/danger states, a reset countdown, recent activity, settings, and local-only storage. It is intentionally a small MV3 extension scaffold with a browser-preview fallback so the UI can be reviewed without installing the extension first.
