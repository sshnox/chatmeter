# Contributing to ChatMeter

Thanks for helping improve ChatMeter. The project is deliberately small and dependency-free, so the easiest way to contribute is to keep changes focused and easy to audit.

## Before opening a pull request

Please describe the user problem, the behavior you changed, and how you checked it. Run `npm run check` and `npm run build`, then include a screenshot when a UI change affects the popup layout.

## Privacy contract

ChatMeter must remain local-first. New code should not collect prompt text, add analytics, introduce an account system, or send usage data to a remote service. New browser permissions need a clear explanation in the README and should be kept as narrow as possible.

## Development flow

1. Fork the repository and create a focused branch.
2. Make the smallest change that solves the issue.
3. Run the syntax check and rebuild `dist/`.
4. Test the popup in local preview and, when relevant, as an unpacked extension.
5. Open a pull request with a concise summary and verification notes.

## Reporting security issues

Please avoid posting sensitive security details in a public issue. Open a private GitHub security advisory when available, or contact the maintainer through the repository owner profile.
