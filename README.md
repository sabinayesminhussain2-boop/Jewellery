# AURÉLIA — Haute Joaillerie

A premium, cinematic jewellery website demo built to be presented to a real jewellery
house as a website proposal. Deep noir ground, champagne-gold detailing, editorial serif
typography and slow, restrained motion.

**No frameworks, no build step, no dependencies.** Just `index.html`, one stylesheet,
one small script and optimised imagery — it loads fast and is easy for any developer to
hand over or extend.

---

## 1. Run it

Any static file server works:

```bash
# Python (already on most machines)
python3 -m http.server 4173

# or Node
npx serve .
```

Then open <http://localhost:4173>. Opening `index.html` directly from disk also works,
though a local server gives more accurate font/caching behaviour.

## 2. Deploy to Vercel

**Option A — dashboard (no CLI):** push this repo to GitHub → vercel.com → *Add New
Project* → import the repo → framework preset **Other**, no build command, output
directory `.` → Deploy.

**Option B — CLI:**

```bash
npx vercel --prod
```

`vercel.json` already sets long-lived immutable caching for `/assets/*` plus basic
security headers. Nothing else is required — there is no server-side code.

---

## 3. What's inside

```
/
├── index.html              # all page content + demo product data
├── vercel.json             # caching + security headers
└── assets/
    ├── css/styles.css      # the entire design system (tokens → components → responsive)
    ├── js/main.js          # wishlist, bag, quick view, menu, reveal, toasts
    ├── fonts/              # self-hosted Cormorant Garamond + Jost (woff2)
    ├── images/             # WebP, pre-optimised (~490 KB for the whole site)
    └── favicon.svg
```

### Sections

1. **Hero** — full-viewport campaign image with a slow cinematic drift, layered
   gradients, headline *BEYOND BEAUTY. BEYOND TIME.*, gold CTA and scroll cue.
2. **Collections** — Diamond Rings / Luxury Necklaces / Earrings. Tall editorial cards
   with gold frame reveal and image zoom on hover.
3. **Featured products** — four signature pieces with image, name, INR price,
   *View Details* quick view and a persistent wishlist heart.
4. **Brand experience** — *CRAFTED TO LAST FOREVER.* over a parallax atelier image,
   with maison stats and a signature.
5. **Private salon CTA**, then a minimal footer with logo, contact, about, collections,
   Instagram, newsletter and privacy policy.

### Interactions (all client-side)

| Feature | Behaviour |
| --- | --- |
| Navigation | Smooth scroll with header offset; full-screen menu on mobile/tablet |
| Quick view | Modal with description, GIA specs, add-to-bag and enquiry |
| Wishlist | Heart toggle synced to a slide-over drawer, saved in `localStorage` |
| Bag | Slide-over with items, subtotal in INR, remove; demo-only checkout |
| Reveals | `IntersectionObserver` fade/rise, staggered per grid, disabled for `prefers-reduced-motion` |
| Feedback | Elegant toast for wishlist, bag, newsletter and demo actions |
| Keyboard | `Esc` closes the topmost layer; visible focus rings; skip link |

Everything is a **demo**: there is no backend, no payment gateway and no real inventory.
The wishlist and bag live in the browser only. Buttons that would normally submit a
form (private appointment, privacy policy, checkout) show a toast so nothing feels broken
during a presentation.

---

## 4. Customising it for the client

### Brand name
`index.html` — replace `AURÉLIA` in the header `.brand-name`, the mobile menu, the
footer `.brand-name--lg` and `.footer__watermark`, plus `<title>` and the meta tags.

### Colours
`assets/css/styles.css`, the `:root` block at the top:

```css
--noir: #040404;        /* page background        */
--charcoal: #0a0908;    /* raised panels          */
--gold: #c8a96a;        /* accent, rules, CTAs    */
--gold-soft: #e0c99b;   /* prices, headings       */
--champagne: #efe6d5;   /* primary text           */
```

Change these four and the whole site re-themes. A silver platinum direction, for example:
`--gold: #c2c6cc`, `--gold-soft: #e4e7ea`, `--champagne: #eef0f2`.

### Products
Each product is one `<article class="product">` in `#featured`. Copy the block and edit the
data attributes — the grid, modal, bag and wishlist all read from them:

```html
<article class="product" data-reveal data-id="unique-slug"
  data-name="Piece Name"
  data-price="245000"                        <!-- plain number, formatted as ₹2,45,000 -->
  data-image="assets/images/your-image.webp"
  data-material="18K Gold · 1.02 ct"
  data-desc="Two or three sentences for the quick view."
  data-specs="Centre stone|1.02 ct round brilliant
    Clarity|VVS1 · Colour E
    Certification|GIA">
```

Keep the `<img>`, the `.wishlist` button (`data-wish="unique-slug"`) and the
`.product__view` button inside the card.

### Photographs
Drop files into `assets/images/` as `.webp` (or `.jpg` and adjust the `src`). Recommended:

- hero `1376×768`+ (keep the subject right of centre — the headline sits left)
- collection cards `768×1376` portrait
- products `1024×1024` on a dark ground
- atelier `1408×768`+

Update the `width`/`height` attributes to match and use
`cwebp -q 82 in.jpg -o out.webp` (or Squoosh) to keep files small.

### Fonts
Cormorant Garamond (display) and Jost (UI) are self-hosted in `assets/fonts/`. Swap the
`@font-face` blocks and the `--serif` / `--sans` tokens to change the type pairing.

### Copy and contact details
Hero, maison story, salon text and footer contact (currently a Guwahati flagship) are
plain text in `index.html`. Search for `Guwahati`, `concierge@aurelia.in` and
`+91&nbsp;98640&nbsp;00000`.

---

## 5. Performance & quality notes

- **No third-party requests** — fonts are self-hosted, icons are inline SVG, zero JS
  libraries. Nothing blocks on a CDN.
- **Total imagery ~490 KB** across nine WebP files; the hero is preloaded with
  `fetchpriority="high"`, everything else is lazy-loaded with intrinsic dimensions to
  avoid layout shift.
- **Motion is intentional and cheap** — CSS transforms/opacity only, one throttled
  `requestAnimationFrame` parallax, and a full `prefers-reduced-motion` fallback.
- **Responsive** at 1920 / 1440 / 1280 / 1024 / 820 / 760 / 420 px breakpoints, with
  44px+ touch targets and a full-screen mobile menu.
- HTML passes `html-validate`; the JS is dependency-free and initialises state
  defensively (private-mode `localStorage`, missing APIs).

## 6. Scope for the proposal (₹30,000 tier)

Included: this single-page luxury experience, responsive build, animations, wishlist/bag
demo interactions, local product data, Vercel deployment, SEO/meta basics and one round
of copy/image changes.

Deliberately **not** included (natural phase two): CMS or admin panel, live inventory,
payment gateway, customer accounts, real appointment booking, multi-page journal and
product listing pages with filters. Because products are data attributes, adding real
product pages or a CMS later is a clean extension rather than a rewrite.
