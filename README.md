# ALVIREYA

A travel experience concept by [WebbingHUB](https://webbinghub.io), built for `alvireya.webbinghub.io`.

ALVIREYA is a fictional travel brand. Destinations are real places, but its hotels, prices, planner logic and request form are illustrations. Nothing on the page connects to an AI model, supplier, booking system or CRM, and the site needs no environment variables or external services.

## Running

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm run start
npm test         # concierge scenario and preference tests
```


Node 20.9+ is required by Next.js 16.

## Creative direction

- **Palette.** Warm paper ivory (`#f4eee3`), deep ink navy (`#10202f`) and the airplane's own sky blue (`#5fb3da`) form the brand. Sunlit coral (`#e2572b`) is reserved for action and the flight path. Muted gold (`#c9a46a`) only appears in the dark "behind the experience" layer. The combination reads as warm and human first, and technical second.
- **Type.** Fraunces for editorial display, with italics carrying the emotional words. Geist for interface text, and Geist Mono for flight-data labels (coordinates, steps, boarding-pass details).
- **Motif.** Aircraft windows, dashed flight paths and boarding-pass details. The playful 3D plane is deliberately set against real, editorial photography: a toy flying over a real coastline seen from above.

## Brand

- **Logo.** A monogram "A" whose crossbar is a rising flight route. It runs past the right leg and ends in a coral point, the destination. The monogram sits beside an ALVIREYA wordmark set in light Fraunces capitals with wide tracking. The lockup lives in `src/components/brand.tsx` and is used in the header, footer and share image.
- **Favicon.** The same monogram, paper on an ink tile with a coral route, readable at 16 px on light and dark browser UI. Files: `src/app/icon.svg`, `src/app/apple-icon.png` (180 px), and `public/icons/` (192, 512 and maskable 512), wired through `src/app/manifest.ts`.

## Page structure

A single page, server-rendered, with five chapters and a conversion close:

1. **Arrival.** The headline, the concierge, a window-shaped aerial photo, and the 3D plane flying in.
2. **Destinations.** Four editorial chapters with a sticky, crossfading photo stage on desktop and inline images on mobile.
3. **Planner.** A simulated, rule-based trip sketch (`src/lib/planner.ts`), clearly labelled as such.
4. **Booking journey.** Choose a place, compare stays, shape the trip, and read a fully itemized example quote. The request dialog sends nothing.
5. **Behind the experience.** Four system layers, each capability tagged as working on the page, simulated, or built for real agencies. Also a before/after agency workflow.
6. **Close.** Links to `webbinghub.io/contact` and `webbinghub.io`.

Content lives in `src/content`, pure logic in `src/lib`, and sections in `src/components/sections`. Only interactive pieces are client components.

## The airplane

The source model `src/raw/3dplane.glb` is 3.6 MB, with 71k triangles, 9 meshes, flat-colored materials, no textures and no animations. It is kept untouched.

`node scripts/optimize-plane.mjs` writes `public/models/alvireya-plane.glb`. That step drops the unused clearcoat and transmission extensions, welds and simplifies the geometry, then quantizes it with meshopt compression. The result is **123 KB with 13.6k triangles**, with no visible difference at hero size.

Runtime behavior (`src/components/hero-plane`):

- three.js is imported dynamically only after the `load` event and an idle callback, so it never competes with the LCP image.
- The plane glides along a curved path across the photo, banking naturally, and eases into place at the window edge. A coral contrail draws in sync, and a soft shadow on the page sells the height. Cloud wisps drift across the window in pure CSS.
- Rendering happens on demand only. On desktop that means during the arrival, then on pointer movement and on scroll while the hero is visible, with idle floating done as a CSS transform. On touch devices the plane stays in place after arriving and sways gently in 3D at about 30 fps, only while the hero is on screen.
- Device pixel ratio is capped (1.5 on desktop, 1.75 on mobile). The renderer uses `powerPreference: "low-power"`.
- With reduced motion, the single three-second arrival still plays, but pointer-follow, scroll drift, floating and drifting clouds are switched off. Save-Data, no WebGL or no JavaScript show a pre-rendered poster (`public/images/alvireya-plane.webp`, 23 KB) instead, and three.js is never downloaded.

The same plane returns as the site's mascot in the planner (`src/components/planner-mascot.tsx`). It perches on the corner of the journey-sketch card, glides across while a sketch is drafted, and turns to face the result. It loads only when the planner is near the viewport, shares the rig in `plane-rig.ts`, and renders only while it moves. With reduced motion it stays perched.

## Images

Photos come from Unsplash under the Unsplash License, credited in the footer. A custom `next/image` loader (`src/lib/image-loader.ts`) asks Unsplash's CDN for AVIF/WebP at the requested width. The hero uses `<picture>` art direction: a 16:10 crop on small screens, 3:4 on desktop, at high fetch priority.

## Measurements

Measured on a local production build (`next start`), Lighthouse 12.8 in headless Chrome on Windows. The machine was under other load, which mostly shows up as Total Blocking Time noise.

| Run | Performance | Accessibility | Best practices | SEO | LCP | TBT | CLS |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Mobile (default simulated throttling), 5 runs | 75–90, median 89 | 100 | 100 | 100 | 3.5 s | 120–620 ms | 0–0.017 |
| Desktop preset | 99 | 100 | 100 | 100 | 0.8 s | 10 ms | 0 |

Notes:

- These runs predate the concierge. The LCP element was the hero photo. Observed, unthrottled LCP equals first paint (about 0.95 s). The simulated 3.5 s comes from Lighthouse modelling the framework JavaScript (about 157 KB gzipped, mostly React and Next.js) as a dependency of the first paint.
- Initial JS is about 157 KB gzipped. Page-specific code is about 22 KB. three.js (161 KB gzipped) and the model (123 KB) load only after idle.
- These are lab numbers, not field Core Web Vitals. Real-user LCP, INP and CLS should be confirmed after deployment.

Verified at 375, 768 and 1440 px wide, with no horizontal overflow. There are no console errors with or without reduced motion. Keyboard checks covered the tabs, steppers, dialog (Escape and focus return) and the mobile menu. Without JavaScript, all content and the static plane render. The planner and booking demos need JavaScript.

## Concierge

An interactive concierge demo that shows what a travel site could do with live AI, without depending on one.

- **Invitation.** The hero holds a single field ("Describe your dream holiday") and six feelings with photo thumbnails: romantic, luxury, adventure, beach, family and culture.
- **Lounge.** Submitting opens a full-screen `<dialog>` that grows out of the hero field like a window opening (a clip-path animation), and contracts back into it on close. One side is a photo stage showing the place under discussion, with a boarding-pass brief that fills in as the visitor talks (feeling, when, travellers, budget). The other side is an editorial conversation: headlines that resolve word by word, postcard destination cards, a five-day sketch drawn from the planner's content, and a brief ready to hand to a travel designer. Mobile uses a photo band above a full-screen conversation.
- **Logic.** `src/lib/concierge.ts` routes free text to one of six curated scenarios (`src/content/concierge.ts`), answers questions about the four destinations, sketches itineraries and assembles a brief. It reads months, seasons, party and budget from what visitors type, and guides anything outside the collection back to the six feelings. It is deliberately small; there is no language model.
- **Sales path.** Every place offers a five-day sketch and a quote; "Request a quote" closes the lounge, selects the destination in the booking journey and scrolls there. The hero window and boarding strip follow the conversation, and a "Continue your conversation" link restores it. State is kept for the visit.
- **Honesty.** The lounge is labelled "Demo" and both the hero and the lounge carry: "Interactive concierge demo. A production version connects to live AI, booking systems and your agency's own inventory."
- **Access and performance.** Native modal dialog (focus trap, Esc, focus returns to the hero field), polite live announcements, keyboard-reachable everything, and a plain fade with reduced motion. The lounge code loads only on first hover, focus or use of the invitation, and its images load only once it opens.

## Deployment notes

- Canonical, sitemap and robots point to `https://alvireya.webbinghub.io`.
- `/models/*` and `/images/*` get long cache headers in `next.config.ts`. Rename the model file if it changes.
- Consider linking to the concept from webbinghub.io once it is live.
