# ElektraOS for SMB - Founding Team Onboarding

Branch: `smb-foundation`
Target market: companies with 5 to 50 employees
Status: seed, draft, not yet public
Commit pattern: conventional commits, one concern per PR, CODEOWNERS gate

---

## Who is on the team

| Member | Role | Scope of ownership | LinkedIn |
|---|---|---|---|
| Yossra Benzad | Founder, systems architect | Runtime, CSS/JS, release gate | https://www.linkedin.com/in/yossra-benzad/ |
| Said Ziane | Co-founder, ops + SMB growth | `/smb/ops/`, commercial positioning, cohort intake | https://www.linkedin.com/in/said-ziane-12895052/ |
| Jamal Ziane | Co-founder, product + commerce | `/smb/` product pages, storefront pillar | pending verification (5 profiles match on LinkedIn; confirm with Said) |
| Zacki Ziane | Co-founder, data engineering | `/smb/data/`, `/smb/pipelines/`, schemas, ingestion | https://uk.linkedin.com/in/zacki-ziane |

---

## Why each person, specifically

### Said - ops and SMB growth lead

Co-founder of MealShift (London, 2020), on-demand food delivery software and restaurant management. Already operates UK residential property (BizUs Legal Ltd, NN16 8XG). Runs exactly the customer profile this vertical targets: 5 to 50 people, multiple lines of business, does not have a CTO.

Puts on the table:
- Real operator credibility for the commercial message
- MealShift as first reference customer
- UK network for cohort intake
- Kettering property workstream as a second pilot

### Jamal - product and commerce lead

Co-founder of MealShift alongside Said. Product side of commerce platforms; on-demand delivery, couriers, restaurant management. Ships the `/smb/` commerce pillar that mirrors the Apr 22 MealShift agent-native storefront pattern.

Puts on the table:
- Product instincts on operator-facing software
- Commerce and checkout experience
- Courier and logistics flows that translate to other verticals

### Zacki - data engineering lead

Data Management Consultant at Kubrick Group, client engagement with AstraZeneca. University of Nottingham. London-based. This is exactly the profile the SMB data pillar needs: someone who has delivered enterprise data pipelines, applying that discipline at SMB scale and fixed price.

Puts on the table:
- Warehouse and ingestion design
- Data quality and observability
- SQL, schema modelling, dashboard layer
- The enterprise-to-SMB downshift that most SMB tools miss

---

## Repository layout (smb-foundation branch)

```
elektraos-dev/
├── .github/
│   └── CODEOWNERS          # review routing, already set
├── smb/
│   ├── index.html          # landing (live preview)
│   ├── ONBOARDING.md       # this file
│   ├── ops/                # Said: playbooks, intake forms, CRM drafts
│   ├── data/               # Zacki: schemas, SQL, fixture datasets
│   ├── pipelines/          # Zacki: ingestion / ETL scripts, configs
│   └── product/            # Jamal: storefront specs, checkout flows
└── (existing site, untouched on this branch until coordinated)
```

`/smb/ops/`, `/smb/data/`, `/smb/pipelines/`, `/smb/product/` are empty placeholders until each lead writes their first doc. No dead scaffolding committed.

---

## GitHub steps Yossra runs once (I cannot do these for you; permissions work requires your click)

1. Go to https://github.com/Yoggi-SheandElle/elektraos-dev/settings/access
2. Invite as collaborators (Write role, not Admin):
   - @said-ziane (or whatever handle Said uses; ask him)
   - @jamal-ziane (same)
   - @zacki-ziane (same)
3. Optional but recommended: create an organisation if the repo is under a personal account. Personal repos cap at a few collaborator features; an org unlocks Teams, which the CODEOWNERS file assumes long-term.
4. Push the `smb-foundation` branch (I have committed locally, waiting on your confirm to push):
   ```
   cd C:/Users/benza/LocalDev/elektraos-dev
   git push -u origin smb-foundation
   ```
5. On GitHub, protect the `smb-foundation` branch:
   - Settings -> Branches -> Add rule -> `smb-foundation`
   - Require pull request before merging (1 approval)
   - Require review from Code Owners
6. Send the three brothers a link to this doc and the `/smb/` preview.

---

## How we work (ground rules)

- **Branches**: each contributor branches off `smb-foundation` with `feat/smb-<concern>-<initials>`, e.g. `feat/smb-pipeline-sales-zz`. Main never merges into `smb-foundation` without Yossra approving.
- **PR size**: small. One concern per PR. If it touches more than two top-level folders, split it.
- **Commit style**: `type(scope): imperative message`. Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`. Scope is usually the pillar: `ops`, `data`, `pipelines`, `product`.
- **Design system**: CSS and JS in `/css` and `/js` is Yossra-only. If you need new styles, drop them in a `<style>` block on the page and Yossra rolls them into the shared system on review.
- **No secrets in commits**: use a `.env.local` for anything sensitive. The repo has been audited.
- **Writing style**: hyphens only, no em dashes, no en dashes. Confident, specific, operator-voice. No marketing filler.

---

## First deliverables (two weeks from kickoff)

| Lead | Deliverable | Path |
|---|---|---|
| Said | SMB cohort intake form + screening criteria | `/smb/ops/intake.md` |
| Jamal | Storefront pillar one-pager + 1 reference flow diagram | `/smb/product/storefront.md` |
| Zacki | Data pillar schema v0 (4 tables, 1 ingestion diagram) | `/smb/data/schema.md` |
| Yossra | Pricing tiers, cohort page copy, CODEOWNERS tuning | `/smb/index.html` + `/pricing/` |

Each deliverable is a PR to `smb-foundation`. Review pairs across: Said reviews Jamal, Jamal reviews Said, Zacki reviews both. Yossra reviews all.

---

## Founding cohort targets (Q2 2026)

- 10 paying SMBs
- Each matched to one pillar lead as primary contact
- Fixed monthly fee per pillar, inclusive of runtime, agent hours, and weekly review
- Case-study rights negotiated at signup (publish with consent)
- First three cohort members come from Said's network (MealShift circle + UK property contacts)

---

## Open questions for kickoff call

1. Correct LinkedIn URL for Jamal (5 profiles match "Jamal Ziane"; confirm).
2. Pillar lead compensation model: equity, revenue share, or fixed retainer per closed cohort member?
3. Legal entity: founding work under ElektraOS.dev brand only, or a new LLC per pillar?
4. Geographic focus for cohort intake: UK first (Said + Jamal + Zacki all London), or multi-market from day one (DK/MA/FR already have locale hubs)?
5. MealShift and BizUs as reference customers: need written consent before using as case studies.
