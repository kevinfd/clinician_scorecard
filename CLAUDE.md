## gstack (recommended)

This project uses [gstack](https://github.com/garrytan/gstack) for AI-assisted workflows.
Install it for the best experience:

```bash
git clone --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
cd ~/.claude/skills/gstack && ./setup --team
```

Skills like /qa, /ship, /review, /investigate, and /browse become available after install.
Use /browse for all web browsing (Aside first, the bundled gstack browser as fallback). Use ~/.claude/skills/gstack/... for gstack file paths.

## impeccable (frontend design)

This project uses [impeccable](https://github.com/pbakaus/impeccable) for all frontend design work: the M1 surgeon email, the M2 web app, and every later screen. It is installed project-locally under `.claude/skills/impeccable` (skill, four agents, and the design detector hooks in `.claude/settings.json`).

- Durable product truth lives in `PRODUCT.md`; the visual system lives in `DESIGN.md`. Read both before any UI work and keep them current with `/impeccable init` and `/impeccable document`.
- Before building any surface: `/impeccable shape <surface>` to produce the brief, then build, then `/impeccable critique`, `/impeccable harden`, `/impeccable onboard`, `/impeccable clarify`, and `/impeccable audit` before `/impeccable polish`.
- The app is in Operate mode (a task tool for surgeons, chiefs, and the analyst): scanability, consistency, and the real usage scene outrank expression.
- gstack's `/plan-design-review` and `/design-review` run the impeccable engine first when it is installed; keep the two in step.
