```markdown
# Design System Specification: University Operations Hub

## 1. Creative North Star: "The Academic Monolith"
The design system is built upon the concept of **"The Academic Monolith."** Unlike standard enterprise dashboards that feel cluttered and frantic, this system draws inspiration from high-end editorial layouts and modern architectural structures. It emphasizes stability, deep focus, and authoritative clarity. 

We break the "template" look by rejecting the standard 1px border. Instead, we use **Tonal Architecture**—defining hierarchy through shifting densities of slate and navy. The layout should feel like a series of heavy, purposeful slabs organized with intentional asymmetry. We prioritize "Breathing Room" over "Data Density," trusting that a clear mind leads to efficient operations.

---

## 2. Colors & Surface Philosophy
The palette moves away from "web-safe" blues into a sophisticated spectrum of Deep Navy (`#000a1e`) and Slate (`#515f74`).

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning. Structural boundaries must be defined solely through background color shifts.
*   **Primary Container:** Use `surface` (`#f7f9fb`) as the canvas.
*   **Sectioning:** Differentiate areas by nesting a `surface-container-low` section within the main `surface`.

### Surface Hierarchy & Nesting
Treat the UI as physical layers of fine paper.
*   **Level 0 (Canvas):** `surface` (`#f7f9fb`)
*   **Level 1 (Sub-sections):** `surface-container-low` (`#f2f4f6`)
*   **Level 2 (Active Cards):** `surface-container-lowest` (`#ffffff`) - creates a soft, natural lift.
*   **Level 3 (Overlays):** `surface-container-highest` (`#e0e3e5`) - for temporary states or sidebars.

### The "Glass & Gradient" Rule
To avoid a "flat" enterprise feel, use a subtle **Signature Texture**:
*   **Action Gradients:** Primary CTAs should utilize a vertical linear gradient from `primary` (`#000a1e`) to `primary_container` (`#002147`). 
*   **The Frosted Sidebar:** Navigation backgrounds should use `primary` at 95% opacity with a `20px` backdrop-blur to allow underlying surface colors to bleed through, softening the "hard" edge of the navy.

---

## 3. Typography: Editorial Authority
We utilize a dual-typeface system to balance modern efficiency with institutional prestige.

*   **Display & Headlines (Manrope):** Chosen for its geometric precision and unique character. Use `headline-lg` (2rem) for page titles to establish an editorial feel.
*   **Interface & Body (Inter):** The workhorse. Use `body-md` (0.875rem) for the majority of data-heavy environments.
*   **The "Weight of Truth":** Use `title-sm` (Inter, 1rem) in **Medium (500) or Semi-Bold (600)** for table headers and navigation labels to ensure they feel grounded and unmovable.

---

## 4. Elevation & Depth: Tonal Layering
Traditional box-shadows are often messy. We replace them with "Ambient Occlusion" and "Tonal Lift."

*   **The Layering Principle:** Rather than a shadow, place a `surface-container-lowest` card on top of a `surface-container-high` background. The contrast in lightness provides the "lift."
*   **Ambient Shadows:** For floating modals, use a shadow with a blur of `40px`, an offset of `y: 12`, and a color of `on-surface` (`#191c1e`) at only **6% opacity**. It should feel like a soft glow, not a dark edge.
*   **The "Ghost Border":** If a data table requires separation, use the `outline_variant` (`#c4c6cf`) at **15% opacity**. Total opacity borders are strictly forbidden.

---

## 5. Components

### Complex Data Tables
*   **Structure:** No vertical or horizontal lines. Use `surface-container-low` for the header row and `surface` for alternating rows (zebra striping) only if necessary for legibility.
*   **Spacing:** Use Spacing Scale `4` (0.9rem) for vertical cell padding to give data "room to breathe."
*   **Header:** `label-md` in `on_surface_variant` with a 0.05em letter-spacing for an institutional, organized look.

### Status Badges (The "Ink-Drop" Style)
Instead of high-contrast solid blocks, use a "Tint & Tone" approach:
*   **Active (Emerald):** Background `tertiary_fixed` (`#6ffbbe`) at 30% opacity | Text `on_tertiary_fixed_variant` (`#005236`).
*   **Pending (Amber):** Background `on_secondary_container` (`#57657a`) | Text `secondary_fixed` (`#d5e3fc`). *Note: Referencing the slate-amber transition for a sophisticated pending state.*
*   **Out of Service:** Background `error_container` | Text `on_error_container`.

### Side Navigation
*   **Background:** `primary` (`#000a1e`).
*   **Active State:** No "pill" shape. Use a left-aligned vertical bar (4px width) in `tertiary_fixed` and transition the background of the item to `primary_fixed_variant` at 20% opacity.
*   **Typography:** `title-sm` for nav items, using `secondary_fixed_dim` for inactive states to maintain a high-end, dimmed aesthetic.

### Buttons & Inputs
*   **Primary Button:** Gradient fill (Navy to Deep Navy), `xl` (0.75rem) roundedness. 
*   **Inputs:** `surface-container-highest` background, no border. On focus, a `2px` ghost border of `surface_tint`.

---

## 6. Do’s and Don’ts

### Do:
*   **Use Asymmetry:** Place secondary actions far-right and primary titles far-left to create a dynamic, modern eye-path.
*   **Embrace the Spacing Scale:** Use `16` (3.5rem) for page margins. Large margins signal "Premium" and "Controlled."
*   **Leverage Tonal Shifts:** Use `surface-dim` for inactive or "backgrounded" content.

### Don’t:
*   **No High-Contrast Borders:** Never use `#000000` or the full opacity `outline` token for containers.
*   **No Crowding:** If a data table feels tight, do not shrink the font. Increase the container width or introduce horizontal scrolling.
*   **No Standard Blue:** Avoid "Hyperlink Blue." All "Action" colors must be derived from the Tertiary Emerald or Primary Navy tokens to maintain the brand’s sophisticated palette.