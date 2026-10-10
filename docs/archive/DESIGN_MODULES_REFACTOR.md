# design: Modules Page Refactor (System Visibility Edge)

## 1. Design Philosophy
Shift from the "Unified Command" dashboard to the "System Visibility Edge" aesthetic.
- **Visuals**: High-contrast, asymmetric grid, hairline typography, visible borders.
- **Tone**: Institutional, protocol-driven, austere but premium.

## 2. Layout Mapping
We will adapt the HTML structure from `code.html` to React/Next.js.

### A. Header (Sticky)
- **Left**: "System Visibility Edge" (with yellow system dot).
- **Right**: "Request Authorization" / "Login" buttons.

### B. Hero (Monolithic Typography)
- **Text**: "BRAND INTELLIGENCE\nOPERATIONAL FRAMEWORK." (Replaces "Artificial Intelligence...")
- **Status**: "Protocol Version 5.0 // Status: OPERATIONAL"

### C. Asymmetric Layout (Grid)
- **Left Column (Sticky)**:
  - "Institutional Anchor": Description of the platform's role.
  - "Location Index": "Global Modules [01-08]"

- **Right Column (Content)**:
  - **Description**: Institutional description of AffeXAI.
  - **Module Grid (Public Capabilities)**:
    - This is where `SOCIAL_ARRAY`, `EVENT_HORIZON`, etc. live.
    - Format: Rigid 3-column grid with borders.
    - Content: Number (01.), Title (Module Name), Description (One-liner).

### D. Compliance / Metrics (Footer Area)
- **Compliance**: List "GDPR", "ISO 27001" (adds credibility).
- **Latency**: "Average Response: 0.12ms" visualization.

## 3. Component Structure
*   **`HeroSection`**: The large text.
*   **`AsymmetricGrid`**: The parent layout container.
*   **`ModuleCard`**: The rigid grid items (hover effects `hover:bg-zinc-950`).

## 4. Execution
1.  Overwrite `apps/frontend/src/app/(marketing)/modules/page.tsx` with this completely new layout.
2.  Import `Inter` font (or use `Public Sans` with similar weight settings).
3.  Ensure `tailwind.config` supports the `text-hairline` (font-weight 100) or use arbitrary values.
