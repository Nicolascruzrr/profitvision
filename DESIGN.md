# Profit Vision — Design system

## Product
Landing and registration prototype for financial education and mentorship. Brand name is centralized in `config.js` (`PROFIT_VISION.brand`).

## Palette
- White `#FFFFFF`, off-white `#FAFBF8`, soft green `#F3F8F1`
- Sage `#DCEBD7`, muted green `#7FA58B`, forest `#173C30`
- Text `#1B2822`, secondary `#66746C`, borders `#E3EAE3`

## Typography
- Plus Jakarta Sans for headlines and UI (DocuGreen-inspired geometric sans)
- Bold display weights; outlined secondary headline lines via `.text-outline`
- Brand lockup uses the official logo image (`assets/logo.png`)

## Form language
- Soft radii 14–36px + pill CTAs with lime arrow chips
- Cream ground `#F2F2EB`, forest CTAs, lime `#C5D831` accents
- Product UI previews as proof (not stock photos)

## Motion
- Scroll reveals via IntersectionObserver
- Accordion, step switcher, hover lifts
- Respects `prefers-reduced-motion`
