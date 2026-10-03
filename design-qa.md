# Studio ATS buyer journey — design QA

## Evidence

- Source visual truth: `/Users/mathieu_pro/.codex/generated_images/01a10184-e604-7dd1-954b-2a835f1e3586/exec-e107ba0e-711f-4230-9116-b1caf3cb66e7.png`
- Source pixels: `713 × 2206` (portrait design board, density 1)
- Implementation URL: `http://localhost:3000/fr/studio`
- Implementation screenshot: `cua://iab/tab/3` (inline CUA browser capture; the IAB API does not expose a filesystem export path)
- Implementation pixels / CSS viewport: `1440 × 1000`, density 1
- Responsive checks: `375 × 812`, `768 × 900`, `1440 × 1000`
- State: French, light theme, public buyer page, no referral, capacity message disabled by current server settings
- Density normalization: none required for the implementation capture; the source board was judged by corresponding visible regions rather than as a pixel-perfect full-page crop.

## Full-view comparison evidence

The source visual and the rendered IAB capture were opened in the same QA pass. The implementation preserves the selected direction's defining composition: editorial split hero, oversized black/blue headline, an overlapping three-step site/form/lead story, long-form journey, horizontal project gallery, strong dark conversion close, and generous white-space rhythm. The implementation intentionally uses the existing Studio ATS type, tokens, navigation, and real demo screenshots instead of the concept's invented architecture brand and synthetic client claims.

The implementation is somewhat denser than the concept after the hero because it also carries the required product tour, offer comparison, FAQ, and real lead form. This is an intentional scope difference, not visual drift.

## Focused region comparison evidence

- Hero: inspected at 1440, 768, and 375 CSS px. Headline wraps without collision, CTAs remain visible, and the visual sequence retains its overlap without horizontal overflow.
- Journey/product demo: CTA anchor reaches `#journey`; the tabs update `aria-selected`, swap real interface captures, and support Enter plus arrow-key navigation. Portfolio exposes three horizontally scrollable examples; Rendez-vous shows the complete offer/date/time/payment path.
- Proof gallery: only approved `FieldProof` items can be rendered as client proof. Product captures are presented separately as delivered or demonstration interfaces, with a disclosure that visible data is not a claimed client result.
- Pricing: `/fr/pricing` contains no partner commission table or commission copy. The buyer navigation and One/Pro/Premium choice links are present.
- Buy: `/fr/buy?offer=pro&referral=123456` preserves the referral while switching offers and renders the exact Pro summary, cadence, reassurance, and secure-payment state.
- FAQ/form: the first disclosure opens; the labelled `fullName` input receives focus.

## Required fidelity surfaces

- Fonts and typography: passed. Existing Geist display/body system is preserved; hierarchy, optical weights, line height, headline wrapping, and small-label tracking match the concept's intent.
- Spacing and layout rhythm: passed. No horizontal overflow at 375/768/1440. Section spacing, overlapping hero cards, radii, and elevation remain coherent across breakpoints.
- Colors and tokens: passed. Studio blue, near-black, white, muted surfaces, success, and warning colors are drawn from existing tokens with sufficient contrast.
- Image quality and asset fidelity: passed. `next/image` supplies stable dimensions and responsive `sizes`; the hero loads eagerly and supporting WebP captures remain lazy. No unvalidated client result is presented as proof.
- Copy and content: passed. French buyer copy is coherent and no English UI fragment was observed. Demo labels no longer reuse affiliate-commission legal copy.
- Icons and controls: passed. Lucide icons match the existing product library and align consistently with their controls.
- Accessibility and motion: passed. Labels, semantic tabs/disclosures, visible focus styles, keyboard reachability, alt text, and the global `prefers-reduced-motion` override are present.

## Comparison history

1. P2 — Demo proof labels reused affiliate earning-disclaimer copy. Fixed by adding a dedicated `studio.demoOnly` string in all nine dictionaries. Post-fix evidence shows the concise French demo disclosure in the hero and gallery.
2. P2 — `/pricing` still exposed partner-first navigation after removing the commission table. Fixed by using the Studio buyer navbar. Post-fix evidence shows the buyer CTA and no partner commission content.
3. P2 — The browser reported the hero image as lazy LCP content. Fixed by making the hero a distinct static image import with eager loading. Post-fix console contains only React DevTools/HMR development messages.
4. P2 — The journey used an unvalidated client screenshot. Fixed by replacing it with a Studio-owned demo capture. Post-fix proof rendering is gated by `publicFieldProof()` consent.

## Findings

No actionable P0, P1, or P2 findings remain.

## Follow-up polish

- P3: the live capacity card is intentionally absent while the server setting is disabled. It appears only after an administrator enters real Pro/Premium capacity and enables the message.
- P3: 3–6 real projects can replace the demo gallery after written publication consent is recorded in `FieldProof`.

## Primary interactions tested

- Hero demo CTA and request anchor
- Product tabs
- Portfolio horizontal capture gallery and complete appointment-request capture
- FAQ disclosure
- Lead-form focus/start state
- Offer selection and referral query preservation
- Pricing-to-buy route
- Mobile/tablet/desktop overflow
- Browser console after the final hero-image fix

final result: passed
