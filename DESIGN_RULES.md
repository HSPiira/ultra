# Design Rules for Ultra Frontend

## Color Palette - STRICTLY ENFORCED

### Primary Colors (Use Hex Values)
- **Main Background**: `#1a1a1a` (darkest)
- **Secondary Background**: `#2a2a2a` (cards, sections)
- **Content Background**: `#3b3b3b` (content areas, buttons)
- **Borders**: `#4a4a4a` or `#5a5a5a`

### Text Colors
- **Primary Text**: `#ffffff` (headings, main content)
- **Secondary Text**: `#d1d5db` (subheadings, labels)
- **Muted Text**: `#9ca3af` (descriptions, placeholders)

### Interactive Elements
- **Buttons**: `#3b3b3b` with `#4a4a4a` on hover
- **Active States**: `#4a4a4a` (selected items, active tabs)
- **Hover States**: `#4a4a4a` or `#5a5a5a`

### Status Colors (Use Sparingly)
- **Success**: `#10b981` / `#065f46`
- **Error**: `#ef4444` / `#7f1d1d`
- **Warning**: `#f59e0b` / `#78350f`

### Icons
- **Primary Icons**: `#d1d5db` or `#9ca3af`
- **Interactive Icons**: `#9ca3af` with `#ffffff` on hover

## FORBIDDEN COLORS
- ❌ **NO BLUE** - Never use blue-500, blue-600, blue-700, etc.
- ❌ **NO COLORED ACCENTS** - Stick to gray scale only
- ❌ **NO BRIGHT COLORS** - Keep everything muted and professional

## Layout Rules
- Use consistent spacing: `space-y-6`, `gap-4`, `p-6`
- Rounded corners: `rounded-lg` for cards, `rounded-md` for buttons
- Shadows: `shadow-sm` for subtle depth
- Borders: Always use gray borders, never colored

## Component Guidelines
- **Cards**: Always use `bg-gray-800` with `border border-gray-700`
- **Buttons**: Use gray backgrounds with white text
- **Forms**: Gray backgrounds with gray borders
- **Modals**: `bg-gray-800` with proper backdrop

## Typography
- **Headings**: `text-white` with appropriate font weights
- **Body Text**: `text-gray-300` or `text-gray-400`
- **Links**: `text-gray-300 hover:text-white` (no colored links)

---

**REMEMBER**: This is a professional, muted interface. No bright colors, no blue accents, no colorful highlights. Everything should be gray-scale with subtle variations.
