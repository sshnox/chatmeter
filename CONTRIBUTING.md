# Contributing to ChatMeter

Thanks for taking a look at ChatMeter. Please keep pull requests small and explain what changed, why it helps, and how you tested it.

## Before opening a pull request

Run the checks below and rebuild the extension if you changed source files:

```bash
npm run check
npm run build
```

For popup changes, include a screenshot or a short note describing what you checked in the preview.

## Privacy rules

ChatMeter is a local-first extension. Please do not add prompt-text collection, analytics, an account system, or a remote usage service. Keep new permissions narrow and explain them in the README.

## Suggested workflow

1. Fork the repository and create a branch.
2. Make the change.
3. Run `npm run check` and `npm run build`.
4. Test the preview and, when relevant, load `dist/` as an unpacked extension.
5. Open a pull request with a short summary and verification notes.

## Security

Please do not post sensitive security details in a public issue. Use a private GitHub security advisory when available, or contact the maintainer through the repository owner profile.
