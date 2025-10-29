# Figma Design Handoff Prompt for ScreenGraph Stack

## For Designers: Create Figma Designs with This Context

When creating designs for ScreenGraph, use this prompt to ensure seamless handoff to frontend implementation:

---

## Design System Constraints

### Technology Stack
- **Frontend Framework**: SvelteKit 2 + Svelte 5 (Runes-based reactivity)
- **Styling**: Tailwind CSS v3+ (utility-first)
- **Deployment**: Vercel (SSR + Edge Functions)
- **Type Safety**: TypeScript (strict mode)

### Core Design Principles

1. **Mobile-First Responsive Design**
   - Start with mobile (375px width minimum)
   - Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px)
   - Test all designs at: 375px, 768px, 1280px, 1920px

2. **Dark Mode Native**
   - Always design both light and dark mode variants
   - Use Skeleton UI's built-in theme tokens
   - Avoid pure white (#FFFFFF) and pure black (#000000)
   - Use semantic color names (surface, primary, secondary, tertiary, success, warning, error)

3. **Accessibility First (WCAG 2.1 AA minimum)**
   - Color contrast ratio ≥ 4.5:1 for text
   - Touch targets ≥ 44×44px
   - Keyboard navigation support (visible focus states)
   - Screen reader friendly (proper heading hierarchy)
   - Motion reduction support (respect prefers-reduced-motion)

---

## Component Mapping: Figma → Skeleton UI

When designing, think in terms of these Skeleton UI components:

### Layout Components
- **AppShell** → App frame with header, sidebar, page content, footer
- **AppBar** → Top navigation bar
- **AppRail** → Side navigation rail (vertical icon menu)
- **TabGroup** → Horizontal tabs with panels

### Form Components
- **Input** → Text inputs (styled with rounded corners, focus rings)
- **Select** → Dropdown selectors
- **Radio** → Radio button groups
- **Checkbox** → Checkboxes with labels
- **SlideToggle** → Toggle switches (better than checkboxes for binary states)
- **RangeSlider** → Numeric input sliders

### Feedback Components
- **Modal** → Dialogs, confirmations, forms in overlays
- **Drawer** → Slide-in panels from edges
- **Toast** → Notifications (top-right, bottom-right, etc.)
- **ProgressBar** → Loading bars
- **ProgressRadial** → Circular loaders

### Data Display
- **Table** → Tabular data with sorting, filtering
- **ListBox** → Selectable lists
- **Accordion** → Expandable content sections
- **Card** → Contained content blocks
- **Avatar** → User profile images with fallbacks

### Navigation
- **Breadcrumb** → Hierarchical navigation
- **Pagination** → Page navigation controls
- **Stepper** → Multi-step process indicators

---

## Naming Conventions for Figma Layers

Use these naming patterns so Figma MCP and frontend implementation align:

### Pages
- `page-home` → routes/+page.svelte
- `page-dashboard` → routes/dashboard/+page.svelte
- `page-settings` → routes/settings/+page.svelte

### Components
- `component-header` → lib/components/Header.svelte
- `component-sidebar` → lib/components/Sidebar.svelte
- `component-card-run` → lib/components/RunCard.svelte

### States (use variants)
- `state-default`, `state-hover`, `state-active`, `state-disabled`
- `state-loading`, `state-error`, `state-success`
- `state-empty` (for empty states)

### Modifiers
- Add `/sm`, `/md`, `/lg` suffix for size variants
- Add `/primary`, `/secondary`, `/tertiary` for color variants
- Add `/light`, `/dark` for theme variants

### Interactive Elements
- `button-primary`, `button-secondary`, `button-ghost`
- `input-text`, `input-email`, `input-password`
- `icon-close`, `icon-menu`, `icon-search`

---

## Color Tokens (Match Skeleton UI Theme)

Design using these semantic color names:

### Surface Colors
- `surface-50` to `surface-900` → Background layers (light to dark)
- `surface-backdrop` → Modal/drawer overlays (rgba with opacity)

### Brand Colors
- `primary-50` to `primary-900` → Main brand color scale
- `secondary-50` to `secondary-900` → Secondary actions
- `tertiary-50` to `tertiary-900` → Accent highlights

### Feedback Colors
- `success-50` to `success-900` → Success states (green scale)
- `warning-50` to `warning-900` → Warning states (yellow/orange scale)
- `error-50` to `error-900` → Error states (red scale)

### Text Colors
- Use color-[value] from surface/primary palette
- Never hardcode hex values in component names

---

## Typography System

### Font Family
- **Primary**: Inter, system-ui, sans-serif (default)
- **Monospace**: 'Fira Code', 'Cascadia Code', monospace (for code)

### Font Sizes (Tailwind scale)
- `text-xs` → 12px (captions, metadata)
- `text-sm` → 14px (body text, labels)
- `text-base` → 16px (default body)
- `text-lg` → 18px (emphasized text)
- `text-xl` → 20px (section titles)
- `text-2xl` → 24px (page titles)
- `text-3xl` → 30px (hero titles)

### Font Weights
- `font-normal` → 400 (body text)
- `font-medium` → 500 (emphasis)
- `font-semibold` → 600 (headings)
- `font-bold` → 700 (strong emphasis)

### Line Heights
- `leading-tight` → 1.25 (headings)
- `leading-normal` → 1.5 (body)
- `leading-relaxed` → 1.625 (long-form content)

---

## Spacing System (Tailwind Scale)

Use 4px-based spacing:
- `1` = 4px, `2` = 8px, `3` = 12px, `4` = 16px
- `5` = 20px, `6` = 24px, `8` = 32px, `10` = 40px
- `12` = 48px, `16` = 64px, `20` = 80px, `24` = 96px

### Common Patterns
- Card padding: `p-4` or `p-6`
- Button padding: `px-4 py-2` (horizontal, vertical)
- Section spacing: `space-y-6` or `space-y-8`
- Grid gaps: `gap-4` or `gap-6`

---

## Border Radius Standards

- `rounded-sm` → 2px (subtle rounding)
- `rounded` → 4px (default for buttons, inputs)
- `rounded-md` → 6px (cards)
- `rounded-lg` → 8px (larger cards, modals)
- `rounded-xl` → 12px (prominent elements)
- `rounded-full` → 9999px (circles, pills)

---

## Animation & Transitions

### Automatic Animations (via AutoAnimate)
Mark these in Figma with interactions:
- **List items** → AutoAnimate will handle add/remove/reorder
- **Modal open/close** → AutoAnimate handles fade + scale
- **Accordion expand/collapse** → AutoAnimate handles height transitions

### Manual Transitions (Tailwind)
Use these duration/easing for interactions:
- `duration-150` → 150ms (hover states, toggles)
- `duration-300` → 300ms (default for most transitions)
- `duration-500` → 500ms (drawer slides, large animations)
- `ease-in-out` → Default easing

### Loading States
- Skeleton loaders → Use Skeleton UI's built-in placeholders
- Spinners → Use ProgressRadial component
- Progress bars → Use ProgressBar component

---

## Real-World ScreenGraph Use Cases

### 1. Run Timeline View
**What it is**: A vertical timeline showing agent execution steps with real-time updates.

**Design Requirements**:
- Vertical list with AutoAnimate for new steps
- Each step card shows: timestamp, action, status (pending/running/success/error)
- Color-coded status indicators (Skeleton's success/warning/error tokens)
- Expandable detail panels (Accordion component)
- Dark mode optimized (will run on mobile emulators)

**Figma Structure**:
```
page-run-timeline/
├─ component-timeline-step/default
├─ component-timeline-step/pending
├─ component-timeline-step/running (with spinner)
├─ component-timeline-step/success
├─ component-timeline-step/error
└─ component-timeline-step/expanded (detail view)
```

### 2. Agent Dashboard
**What it is**: Main control panel for starting/stopping agent runs.

**Design Requirements**:
- AppShell layout (header + sidebar + main content)
- Primary action button → "Start New Run" (large, prominent)
- Recent runs list → Cards with ListBox selection
- Real-time status badges → Toast notifications for events
- Mobile-responsive (drawer sidebar on small screens)

**Figma Structure**:
```
page-dashboard/
├─ component-header (AppBar with actions)
├─ component-sidebar (AppRail with icons)
├─ component-run-card/idle
├─ component-run-card/running
├─ component-run-card/completed
└─ component-action-panel (buttons, filters)
```

### 3. Device Inspector (Future)
**What it is**: Live view of device screen with interaction replay.

**Design Requirements**:
- Center-focused viewport (device screen mockup)
- Floating control panel (play/pause/speed controls)
- Event log sidebar (TabGroup with Console/Network/Actions tabs)
- Full-screen mode support
- Touch/click hotspots visualization

**Figma Structure**:
```
page-inspector/
├─ component-device-viewport (16:9 or device aspect ratio)
├─ component-controls (media player style)
├─ component-event-log (table with filtering)
└─ component-hotspot-overlay (interactive markers)
```

---

## Figma MCP Integration Points

When using Figma MCP, reference nodes by:

1. **Node IDs**: Extract from Figma URLs
   - Format: `https://figma.com/design/:fileKey/:fileName?node-id=1-2`
   - Backend agent will use fileKey + nodeId to fetch design context

2. **Code Connect Mappings**: Link Figma components to Svelte files
   - Map `component-button-primary` → `lib/components/Button.svelte`
   - Ensures consistency between design and implementation

3. **Variable Definitions**: Export Figma variables as CSS custom properties
   - Color tokens → Tailwind theme config
   - Spacing scales → Tailwind spacing config
   - Typography → Tailwind font config

---

## Playwright MCP Testing Requirements

Designs must support automated testing via Playwright:

### Testable Elements
- All interactive elements need unique data-testid attributes
- Forms need proper label associations
- Buttons need descriptive text or aria-labels
- Navigation should be keyboard accessible

### States to Design
- **Default state** → Initial render
- **Loading state** → During API calls
- **Error state** → When operations fail
- **Empty state** → When no data exists
- **Success state** → After successful operations

### Test Scenarios to Consider
- Mobile viewport (375px) → Touch interactions
- Desktop viewport (1920px) → Mouse + keyboard
- Dark mode toggle → Theme persistence
- Slow network → Loading indicators remain visible
- Screen readers → Semantic HTML structure

---

## Handoff Checklist for Designers

Before marking a design as "ready for development":

- [ ] Both light and dark mode variants exist
- [ ] All interactive states designed (default, hover, active, disabled)
- [ ] Mobile (375px), tablet (768px), desktop (1280px) layouts
- [ ] Color contrast meets WCAG AA (4.5:1 minimum)
- [ ] Touch targets are ≥ 44×44px
- [ ] Loading/error/empty states included
- [ ] Component names follow naming conventions above
- [ ] Typography uses Tailwind scale (text-sm, text-base, etc.)
- [ ] Spacing uses 4px increments (matches Tailwind)
- [ ] Border radius matches Skeleton UI standards
- [ ] Animations are subtle and respect reduced-motion
- [ ] Figma components are organized and documented
- [ ] Variable definitions exported for color/spacing tokens
- [ ] Code Connect mappings defined (if using Skeleton UI components)

---

## For AI Agents Using This Prompt

When implementing designs from Figma:

1. **Extract design context** → Use Figma MCP `get_design_context` with fileKey + nodeId
2. **Map to Skeleton UI components** → Match Figma layers to Skeleton components above
3. **Use Tailwind utilities** → Convert spacing/colors to Tailwind classes
4. **Implement with Svelte 5 Runes** → Use $state/$derived for reactivity
5. **Add AutoAnimate** → Apply `use:autoAnimate` to lists/modals automatically
6. **Test with Playwright MCP** → Verify responsive behavior, interactions, accessibility
7. **Generate type-safe API calls** → Use Encore client for backend communication

---

## Example Design → Code Translation

### Figma Design
```
component-run-card/running
├─ Frame (rounded-lg, p-4, bg-surface-200-800-token)
│  ├─ Text (text-lg, font-semibold) → "Run #1234"
│  ├─ Badge (bg-primary-500) → "Running"
│  ├─ ProgressBar (variant-filled-primary)
│  └─ Button (variant-ghost-surface) → "Cancel"
```

### SvelteKit Implementation
```svelte
<!-- lib/components/RunCard.svelte -->
<script lang="ts">
  import { ProgressBar } from '@skeletonlabs/skeleton';
  
  interface Props {
    runId: string;
    status: 'running' | 'completed' | 'error';
    progress: number;
    onCancel: () => void;
  }
  
  let { runId, status, progress, onCancel }: Props = $props();
</script>

<div class="card variant-soft-surface p-4 rounded-lg space-y-3">
  <div class="flex justify-between items-center">
    <h3 class="text-lg font-semibold">Run #{runId}</h3>
    <span class="badge variant-filled-primary">Running</span>
  </div>
  
  <ProgressBar value={progress} max={100} />
  
  <button 
    class="btn variant-ghost-surface" 
    onclick={onCancel}
    data-testid="cancel-run-{runId}"
  >
    Cancel
  </button>
</div>
```

---

## Resources & References

- **Skeleton UI Docs**: https://skeleton.dev
- **Tailwind CSS Docs**: https://tailwindcss.com
- **SvelteKit Docs**: https://kit.svelte.dev
- **Svelte 5 Runes**: https://svelte.dev/docs/svelte/$state
- **AutoAnimate**: https://auto-animate.formkit.com
- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG21/quickref

---

**Last Updated**: 2025-10-29
**Version**: 1.0
**Maintained By**: ScreenGraph Team

