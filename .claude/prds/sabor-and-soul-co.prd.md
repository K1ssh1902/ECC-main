# Sabor & Soul Co. — Premium Bilingual Catering Website Template

## Problem
Fiverr web design agency owners who want to attract premium ($500–$2000+) clients cannot demonstrate high-end custom capability through a portfolio that shows only generic templates. Without at least one showcase piece that signals $10k-level craft — bilingual UX, editorial layouts, zero-dependency vanilla code — prospective buyers default to cheaper competitors or mass-produced ThemeForest sellers.

## Evidence
- Assumption — needs validation via Fiverr conversion analytics and buyer interview
- Observed market gap: no bilingual luxury catering templates exist that target the LA/Hispanic premium events segment with editorial dark-mode aesthetics and no-framework purity
- Direct user statement: portfolio piece needed to "guarantee clients hire me on Fiverr"

## Users
- **Primary**: Viren — Fiverr web design agency owner, building portfolio to win premium catering/hospitality clients; trigger is active Fiverr shop growth push
- **Not for**: End catering clients (they are the implied buyer of the template's *subject*, not the template itself); developers who need CMS or backend; buyers on budget tiers below $300

## Hypothesis
We believe **a visually distinctive, fully-coded, bilingual luxury catering template (EN/ES toggle, editorial dark aesthetic, three vanilla files)** will **convert prospective Fiverr buyers from browse to inquiry** for **Viren's web design agency**.
We'll know we're right when **at least one Fiverr order at ≥$300 cites the portfolio template as the decision trigger within 30 days of listing**.

## Success Metrics
| Metric | Target | How measured |
|---|---|---|
| Fiverr orders referencing portfolio | ≥1 in 30 days | Buyer message review |
| Template renders without errors on open | 100% | Manual browser test (Chrome, Firefox, Safari) |
| Bilingual switch latency | <100ms | Manual stopwatch |
| Mobile layout integrity | No overflow at 375px | DevTools / real device |

## Scope
**MVP** — Three self-contained vanilla files (`index.html`, `style.css`, `app.js`) in a `public/` directory, rendering the full four-section layout with working bilingual toggle, filterable menu gallery, modal, and contact form — no build step, no dependencies, opens by double-clicking `index.html`.

**Out of scope**
- Form backend / email delivery — deferred; static success state is sufficient for portfolio demo
- CMS or admin panel — not the product being showcased
- Next.js / React version — separate deliverable if client requests it
- SEO meta-tag optimisation — not load-bearing for portfolio demo
- Payment integration — out of scope for catering inquiry flow

## Delivery Milestones
| # | Milestone | Outcome | Status | Plan |
|---|---|---|---|---|
| 1 | Core HTML scaffold + design system CSS | Page renders with correct palette, typography, and layout structure | pending | — |
| 2 | Hero + Philosophy sections complete | Above-fold experience fully animated and bilingual | pending | — |
| 3 | Menu gallery + modal complete | Filterable grid, modal overlay, all 9 items with EN/ES strings | pending | — |
| 4 | Contact hub + form validation complete | Working form, WhatsApp button, call CTA, success state | pending | — |
| 5 | Cross-browser + mobile pass | No layout breaks at 375, 768, 1440px in Chrome/Firefox/Safari | pending | — |

## Open Questions
- [ ] Real WhatsApp number and phone number to replace placeholders before client delivery
- [ ] Actual pricing — template uses illustrative figures; real client adjusts
- [ ] Unsplash CDN URL stability — if images 404, fallback strategy needed (local images or different provider)

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Unsplash CDN URLs become stale | Medium | High — page renders broken | Document all image IDs; provide replacement instructions |
| Modal JS fails on iOS Safari | Low | Medium | Test on real device; use passive event listeners |
| Font CDN blocked in some locales | Low | Medium | Add system serif/sans fallback stack |
| Template looks too "template-like" despite effort | Medium | High | Review against design-quality checklist before listing |

---
*Status: DRAFT — requirements only. Implementation planning pending via /plan.*
