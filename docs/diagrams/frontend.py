import sys
sys.path.insert(0, __import__('os').path.dirname(__file__))
from svgkit import Diagram, C, FAINT, MUTED

d = Diagram(1240, 680, "Wera web: frontend architecture",
            "A React single-page app. Every call goes to its own origin (/api), so it runs the same behind Vite, nginx or Vercel.")

d.boundary(28, 108, 760, 470, "Browser", C["blue"])
d.boundary(820, 108, 392, 200, "Delivery", C["ember"])
d.boundary(820, 340, 392, 238, "Backend", C["green"])

# Browser layers (top to bottom = request path)
d.card(52, 134, 712, 92, "route", "Routes and guards", ["React Router 7 · RequireAuth → RequireProfile → RequireAdmin · AppShell with sidebar,",
                                                        "phone tab bar and ⌘K command palette · pages load the user's data on entry"], C["blue"], )
d.card(52, 242, 345, 156, "layers", "Pages", ["Today · Jobs + job view · Industries", "Tracker · Sponsorship · Interview prep", "Community · Profile · Settings",
                                               "Excluded · System (admin)", "Welcome (setup wizard)"], C["blue"])
d.card(419, 242, 345, 156, "box", "Components", ["Job view: posting, fit, cover letter", "ScoreRing (estimate vs AI score)", "Prose: safe markdown, no HTML",
                                                  "Reactions (optimistic), FilterBar", "Switch, toasts, charts"], C["blue"])
d.card(52, 414, 345, 140, "chart", "Server state", ["TanStack Query cache per endpoint", "polls Today while scores arrive", "optimistic updates, invalidation",
                                                     "sign-out clears it in place"], C["teal"], tag="@tanstack/react-query")
d.card(419, 414, 345, 140, "lock", "API client", ["same-origin fetch, cookie session", "errors become ApiError(status, msg)", "401 anywhere → signed out → /login",
                                                   "no tokens in JS, no third parties"], C["teal"], tag="src/api/client.ts")

# Delivery
d.card(844, 134, 344, 150, "shield", "nginx (or Vercel)", ["hashed assets cached for a year", "index.html revalidated on each load", "/api proxied to the API",
                                                          "strict CSP, HSTS, no framing"], C["ember"], tag="dist/ · self-hosted fonts")
# Backend
d.card(844, 366, 344, 186, "server", "wera-api", ["JSON over /api: auth, jobs, today,", "tracker, settings, profile, files,", "letters, posts, interview,",
                                                   "sponsorship; /healthz with version", "see the wera repository"], C["green"], tag="Go · REST")

d.arrow([(764, 484), (804, 484), (804, 210), (844, 210)], "fetch /api/*", C["slate"], label_at=(804, 350))
d.arrow([(1016, 284), (1016, 366)], "proxy", C["ember"], label_at=(1046, 330))
d.arrow([(408, 226), (408, 242)], color=C["slate"])
d.arrow([(224, 398), (224, 414)], color=C["slate"])
d.arrow([(591, 398), (591, 414)], color=C["slate"])
d.arrow([(397, 484), (419, 484)], color=C["slate"])

# Cross-cutting + quality
yq = 608
d.text(36, yq, "Cross-cutting", 12, MUTED, 650)
x = 140
for t in ["Tailwind v4 design tokens", "light / dark / system theme", "circular reveal (View Transitions)", "count-up stat tiles", "reduced-motion aware"]:
    x += d.chip(x, yq - 14, t, C["blue"]) + 8
d.text(36, yq + 40, "Quality", 12, MUTED, 650)
x = 140
for t, col in [("TypeScript strict", C["slate"]), ("ESLint, zero warnings", C["slate"]), ("Vitest + Testing Library: 62 tests", C["teal"]),
               ("Playwright e2e: desktop + phone", C["teal"]), ("CI on every PR", C["ember"])]:
    x += d.chip(x, yq + 26, t, col) + 8
d.text(1212, 664, "No third-party requests: fonts and scripts are served with the app", 11, FAINT, anchor="end")

open(sys.argv[1], "w").write(d.svg())
