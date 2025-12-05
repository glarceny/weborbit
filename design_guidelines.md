# Design Guidelines: Sistem Otomasi Hosting

## Design Approach

**Selected Approach:** Hybrid - Drawing from modern SaaS platforms (Vercel, DigitalOcean, Stripe) with e-commerce checkout patterns

**Core Principles:**
- Professional utility with visual appeal
- Dark-first design for technical audience
- Trust-building through clarity and polish
- Real-time feedback and status transparency

---

## Typography

**Font Stack:**
- Primary: 'Inter' (Google Fonts) - Clean, modern sans-serif for UI
- Mono: 'JetBrains Mono' - For server credentials, IPs, technical data

**Hierarchy:**
- Hero Headlines: text-4xl to text-6xl, font-bold
- Section Titles: text-3xl, font-semibold
- Card Titles: text-xl, font-semibold
- Body Text: text-base, font-normal
- Technical Data: text-sm, font-mono
- Labels: text-sm, font-medium, uppercase tracking

---

## Layout System

**Spacing Primitives:** Consistent use of Tailwind units: 4, 6, 8, 12, 16, 24
- Component padding: p-6 to p-8
- Section spacing: py-16 to py-24
- Card gaps: gap-6
- Form fields: space-y-4

**Container Strategy:**
- Max width: max-w-7xl for main content
- Product grid: max-w-6xl
- Checkout form: max-w-md (centered)
- Client area: max-w-4xl

---

## Component Library

### Product Catalog Page
**Layout:** 3-column grid on desktop (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)

**Product Cards:**
- Bordered cards with subtle hover elevation
- Card structure (top to bottom):
  - Product badge (Linux/Windows/NodeJS) with icon
  - Product name (text-2xl, bold)
  - Price (text-4xl, prominent) with /bulan suffix
  - Specs list (RAM, Disk, CPU) with icons
  - Feature bullets (3-5 items) with checkmark icons
  - CTA button (full width, prominent)
- Visual treatment: Subtle gradient border on hover
- Icons: Use Heroicons for all UI icons

**Header Section:**
- Centered layout with max-w-3xl
- Main headline emphasizing "Otomatis & Instan"
- Subheadline explaining "Server Aktif Detik Itu Juga"
- Trust indicators: "QRIS Payment • Auto Deploy • No Setup"

### Checkout Page
**Two-Phase Layout:**

**Phase 1 - Form Entry:**
- Single column form (max-w-md, centered)
- Form structure:
  - Order summary card (selected package recap)
  - Customer data fields (email, username, server name)
  - Large primary button: "Generate QR Code"
- Field styling: Consistent input heights (h-12), clear labels above inputs

**Phase 2 - QR Display:**
- Centered modal-like layout with backdrop blur
- QR code container:
  - Large QR code (320x320px minimum) centered
  - Generated using qrcode.js library
  - Bordered container with padding
  - Amount display above QR (text-3xl, bold)
  - "Scan untuk Bayar" instruction
  - Real-time status indicator below (pulsing dot + text)
- Payment instructions in sidebar or below QR
- Countdown timer showing 15-minute expiry

### Client Area / Success Page
**Dashboard Layout:**
- Hero section: Success checkmark animation + congratulations message
- Server details card (prominent):
  - Panel URL (clickable link with external icon)
  - Username (with copy button)
  - Password (with copy button and show/hide toggle)
  - Server IP:Port (with copy button)
  - Server status badge: "Active" (green)
- Card styling: Dark background with border, technical mono font for credentials
- Action buttons: "Access Panel" (primary), "Download Client" (secondary)
- Support section at bottom: FAQ links, Discord/WhatsApp support

### Navigation
**Header:**
- Minimal top bar with logo left, "Login" link right
- Sticky on scroll with subtle shadow

**Footer:**
- Compact footer with payment methods (Pakasir logo), social links, copyright

---

## Visual Design Elements

**QR Code Display:**
- Smooth fade-in animation (0.3s ease)
- Pulsing border animation during "waiting payment" state
- Success checkmark overlay animation when paid

**Status Indicators:**
- Pending: Amber pulsing dot
- Processing: Blue animated spinner
- Completed: Green checkmark with bounce animation

**Loading States:**
- Skeleton loaders for product cards during initial load
- Spinner with text during server provisioning: "Creating your server..."

---

## Images

**Hero Section (Product Catalog):**
- Background: Abstract server/network visualization (subtle, low opacity)
- OR: Isometric 3D illustration of servers/hosting infrastructure
- Placement: Full-width background with gradient overlay for text readability

**Product Card Icons:**
- Linux icon for SAMP Linux
- Windows icon for SAMP Windows  
- Node.js logo for NodeJS package
- Use CDN icon libraries (Simple Icons or similar)

**Success Page:**
- Animated success illustration (server going live, checkmark, etc.)
- Placement: Above server details card

---

## Critical UX Patterns

**Real-Time Feedback:**
- Polling status every 3 seconds with visual feedback (subtle pulse)
- Toast notifications for state changes
- Automatic redirect on payment success (with 3-2-1 countdown)

**Copy-to-Clipboard:**
- One-click copy for all credentials
- Visual confirmation (checkmark replacing icon for 2s)

**Form Validation:**
- Inline validation with error messages below fields
- Disabled submit button until form valid
- Clear error states with red borders and icons

**Trust Signals:**
- Security badge near payment section
- "Your data is encrypted" text
- Pakasir payment logo for credibility

---

## Accessibility

- All form inputs have associated labels
- Focus states clearly visible on all interactive elements
- Sufficient contrast ratios throughout
- Keyboard navigation support for all actions
- Screen reader-friendly status announcements