# Contributing to **Strategist**

Thanks for helping us build a faster way to surface cultural & competitive signals!  
We follow a _“small, reviewable PR”_ workflow to keep the code-base healthy and the
beta stable.

---

## 1. Branch strategy

| Branch | Purpose                         |
|--------|---------------------------------|
| `main` | Production-ready, deploys to Replit |
| `beta-polish` | Current closed-beta work (feature freeze) |
| feature/* | Short-lived topic branches off **beta-polish** |

Always branch from **beta-polish**:

```bash
git checkout beta-polish
git pull
git checkout -b feature/my-awesome-improvement
2. Commit conventions
We use Conventional Commits for clean git history and automatic changelogs:

type(scope): short description

body (optional) - _what_ & _why_
Examples:

fix(nav): default Explore tab -> Trending
feat(cohort): add copy-to-clipboard button
chore: bump react-query to 5.60.6
3. Pull-request checklist
Before opening a PR:

lint / type-check

npm run check   # tsc --noEmit + eslint
unit tests & e2e

npm test              # jest
npx playwright test   # e2e smoke
update docs
• If you add env-vars → update .env.example
• If you add routes → update docs/api.md

squash commits (git rebase -i) so history is clean.

A bot will run the same commands in CI. Green CI = ✅ ready for review.

4. Code style
TypeScript strict – no any unless unavoidable (add // TODO: type).
React – functional components, hooks first, no class components.
Styling – Tailwind CSS plus shadcn/ui components; avoid inline styles.
Logs – use debugLogger (info, warn, error, debug).
Env secrets – never hard-code keys; read via process.env.*.
5. Adding dependencies
Prefer lightweight libs.
Run npm install <pkg> --save (or --save-dev).
Add a 1-line rationale in your PR description (“needed for X”).
If it bundles >50 KB, open a discussion before adding.
6. Database migrations (Drizzle)
Add a migration file in migrations/ with incremental prefix, e.g.
002_add_feature_flags.sql.
Update shared/schema.ts types if necessary.
Test locally with npm run db:push.
7. Feature flags
Experimental or risky functionality must be behind a feature flag (feature_flags table) and default to off.

8. Support & questions
Slack: #strategist-dev
Issues: GitHub Issues
Contact: maintainer-email@example.com
Happy shipping! 🚀


Feel free to tweak section names or add organisation-specific details, then commit:

```bash
git add CONTRIBUTING.md
git commit -m "docs: add contributing guide"
git push origin beta-polish