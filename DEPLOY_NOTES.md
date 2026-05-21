# SalesDrive Web v4 — Deploy Notes

## Live URLs
- **Stabiler Alias:** https://salesdrive-web-seven.vercel.app
- **Aktueller Deploy:** https://salesdrive-2vf88s5h5-llehner-6500s-projects.vercel.app
- **Dashboard:** https://vercel.com/llehner-6500s-projects/salesdrive-web

## Pages
| Route | Datei | Status |
|---|---|---|
| `/` | `index.html` | ✅ Live (all-black v4 mit Wow-Animationen) |
| `/team` | `team.html` | ✅ Live (dark theme rebuild) |
| `/referenzen` | `referenzen.html` | ✅ Live (3 Cases + Testimonial Wall) |
| `/zertifizierungen` | `zertifizierungen.html` | ✅ Live (TÜV-Detail-Seite) |
| `/formular` | `formular.html` | ✅ Live (4-Step Funnel + Calendly) |
| `/danke` | `danke.html` | ✅ Live |
| `/impressum` | `impressum.html` | ✅ Live (full rewrite) |
| `/datenschutz` | `datenschutz.html` | ✅ Live (full rewrite, 13 Sektionen) |
| `/agb` | `agb.html` | ✅ Live (full rewrite, §1–§14) |

## API Endpoint
- `POST /api/lead` → `api/lead.js`
- Erwartet JSON-Body mit Funnel-Feldern (firma, email, telefon, etc.)
- Sendet Lead an Close CRM (POST /api/v1/lead/)

## ⚠️ FEHLENDE ENV VARS (vor Go-Live setzen)

In **Vercel Dashboard → Project → Settings → Environment Variables**:

| Variable | Beschreibung | Pflicht? |
|---|---|---|
| `CLOSE_API_KEY` | Close CRM API Key (Format: `api_xxxxxxxxxxxx`) | ✅ Pflicht |
| `CLOSE_LEAD_STATUS_ID` | ID des Lead-Status z.B. `stat_xxx` | optional |
| `CLOSE_LEAD_SOURCE_FIELD` | Custom Field ID `lcf_xxx` | optional |
| `NOTIFY_WEBHOOK` | Slack/Make Webhook URL für Lead-Notif. | optional |

**Hinweis:** Solange `CLOSE_API_KEY` nicht gesetzt ist, blockt das `/api/lead`-Endpoint die User nicht — die Funnel-Flow bleibt funktional, der Lead landet nur (noch) nicht in Close. Form-Submission landet trotzdem im localStorage des Browsers (`sd_last_lead`) als Notfall-Backup.

## Funnel-Flow
1. User klickt CTA → `/formular`
2. 4-stufiges Formular (Firma+Branche → Umsatz+Kundenwert → Personalia → Anliegen)
3. Submit → POST `/api/lead` (best-effort) + `localStorage` Backup
4. Calendly Inline-Widget öffnet sich mit prefilled name+email+firma+telefon
5. Nach Calendly-Buchung redirect-Möglichkeit zu `/danke` (Calendly-eigene Redirect-Settings konfigurieren)

## Cookie Consent
- Erscheint nach 1.4s auf jeder Seite, bottom-right
- Drei Kategorien: Essential (immer an), Analytics, Marketing
- Speicherung in `localStorage` als `sd_cookie_consent_v1`
- Banner verschwindet nach erstmaliger Entscheidung

## Wow-Animationen (homepage)
- **Hero-Video** fliegt aus `translateZ(-600px) blur(30px)` rein
- **Word-by-word Headline** Reveal
- **"Du hast alles im Griff"** Section-Heading kommt aus `translateZ(-500px) blur(40px)` mit glow
- **Hub-Dashboard** Funnel-Bars wachsen scroll-getriggert auf realen Prozentwerten
- **Counters** zählen alle hoch (Stats, Dashboard, Cases)
- **Timeline-Linie** zeichnet sich beim Scrollen durch die 3 Schritte
- **Reveal-Variants:** fade-up, blur-in, scale-in, slide-l/r, shadow-emerge

## Testimonial Videos
- Cases verwenden `aspect-ratio: 9 / 16` (Portrait, uncropped Original-Format)
- Click-to-play öffnet Vimeo-iframe in derselben Box

## Backup Files (sollten vor Go-Live aus dem Public-Folder)
- `index.old.html` — alter v1-Stand (light theme)
- `index.v2.html` — Apple-Light-Style-Zwischenversion
- Beide via `.vercelignore` schon ausgeschlossen ✅

## Lokal Previewen
```bash
cd "/Users/lukaslehner/Downloads/salesdrive-web 8"
python3 -m http.server 8000
# → http://localhost:8000
```

(Hinweis: `/api/lead` funktioniert nur auf Vercel, nicht im lokalen `http.server`.)

## Custom Domain
Nächster Schritt: `salesdrive.at` als Custom Domain in Vercel hinzufügen.
1. Vercel Dashboard → Project → Settings → Domains → Add `salesdrive.at`
2. DNS bei Registrar: `A 76.76.21.21` oder `CNAME cname.vercel-dns.com`
3. SSL wird automatisch ausgestellt.
