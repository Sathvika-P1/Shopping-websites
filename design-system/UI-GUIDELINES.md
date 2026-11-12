# Shopping Web — UI Guidelines

## Navigation and information architecture
- Top bar with a horizontal main nav on desktop, collapsing behind a menu button below 768px; shoppers browse far more than they configure, so content gets the full width and no sidebar.
- Main sections, in order: **Shop** (`shop`), **Categories** (`categories`), **Deals** (`deals`). Each is a top-level destination so product discovery is one tap away.
- Utility links at the right of the bar: **Wishlist** (`wishlist`), **Account** (`account`), **Bag** (`bag`); the bag stays visible at every width because it is the path to purchase.
- Mark the current section with `aria-current="page"` on its `data-nav-key` link, never with a custom class, so the shell styles it consistently.
- Checkout is a focused flow: keep the top bar but do not add extra links to it, so shoppers are not pulled away mid-purchase.

## Layout and density
- Spacious consumer layout: use `.container` for page width and `.stack-lg` between page sections, because browsing is visual and relaxed.
- Product listings use `.grid` (auto-fills columns, one column at 375px); the layout must work from 375px up, with 768px the one breakpoint that changes the shell.
- Keep one primary action per screen region so the next step is obvious.

## Component usage
- Product, order and review summaries are `.card`; a card is for a single item that links or acts, so do not nest cards.
- Order history and line items with several comparable attributes use a plain list or table; on narrow screens prefer a list of `.card`s over a wide table to avoid horizontal scroll.
- `.btn-primary` for the single forward action (Add to bag, Place order); `.btn-secondary` for alternatives; `.btn-ghost` for low-emphasis actions; `.btn-danger` only for irreversible actions (Remove, Cancel order).
- Size, color and fit pickers on a product use `.chip` (selected = `aria-pressed="true"`), with out-of-stock sizes `disabled`; shoppers pick a size before they can add to bag, so it must be one tap.
- Filters and sort: `.chip` for quick toggles, `.dropdown` for sort, `.select` inside forms; the former are one tap, the latter keep forms native on mobile.
- Bag preview and quick filters open in a `.drawer`; confirmations of destructive actions use `.modal`; `.toast` confirms background results (Added to bag) without interrupting.
- Stock and order status use `.badge` variants (success = in stock/delivered, warning = low stock/pending, danger = out of stock/failed) so status reads the same everywhere.
- Loading uses `.skeleton` for product grids and `.spinner` only for button-sized waits; empty bag, wishlist or search results use `.empty-state` with a path back to Shop.
- Form errors: `.is-invalid` on the control plus an error message in the `.field`, shown inline, because checkout forms are long and errors must sit next to their cause.

## Theme stance
- Light theme only, with warm-ivory `color-bg` as the page surface and `color-primary` reserved for actions and links; garment photography reads best on a soft neutral ground, and a single theme keeps scope small.
- Clothing-boutique look: headings and the brand use `font-serif` while body and controls stay in `font-sans`, and buttons are uppercase with `letter-spacing-wide`; this gives an editorial fashion feel without hurting readability of prices and sizes.
- Keep corners crisp (`radius-sm`/`radius-md`) and let `color-bg-subtle` (linen) separate sections instead of heavy borders, because tailored, restrained surfaces keep attention on the clothes.

## Voice and tone
- Friendly, plain and brief: "Added to your bag", not "Item successfully added to cart"; shoppers skim.
- Sentence case everywhere; buttons start with a verb ("Add to bag", "Place order").
- Errors say what to do next ("Enter a 5-digit ZIP code"), never blame the shopper.
- Prices always show the currency symbol and two decimals so totals are never ambiguous.
