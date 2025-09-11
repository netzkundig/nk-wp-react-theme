# Contributing Guidelines

## Language
- Use English for all code comments, documentation, commit messages, and issue titles/descriptions.
- Prefer concise, descriptive wording. Avoid idioms where possible.

## Commit Messages
- Use English and imperative mood (e.g., "Add", "Fix", "Refactor").
- Keep the subject line under 72 characters; add details in the body if needed.
- The repository enforces English-only via Git hooks. If your message is rejected, translate it to English.

## Code Comments
- Write comments in English. Explain the "why" more than the "what" when helpful.
- Keep comments up to date with code changes.

## Tools
- A local spell checker configuration is provided in `cspell.json` (English).
- Git hooks in `.githooks/` enforce English in commit messages and comments (heuristics).
- To enable hooks locally: `git config core.hooksPath .githooks`

