# Learned

- The visual layer is intentionally lightweight: five static SVG assets in `public/assets/fairplay/`, typed wrapper components, and CSS-only motion hooks.
- Decorative image handling is centralized through `decorative`, which emits empty alt text and `aria-hidden="true"`.
- Reduced-motion support exists in global CSS for all new motion hooks, using one-shot 1ms animations under `prefers-reduced-motion: reduce`.
- The responsive Playwright coverage does not render production pages. It intercepts route requests and serves hand-written HTML/CSS that uses the approved asset URLs.
- Build output includes the T09 client surfaces without a meaningful first-load regression from the new visual primitives.
