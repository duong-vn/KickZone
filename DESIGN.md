# KickZone Design System Specification (DESIGN.md)

> **Source Project:** Hệ thống Quản lý KickZone  
> **Stitch Project ID:** `10572488772490441791`  
> **Design Theme:** Kickzone Athletic System  
> **Aesthetic Archetype:** Modern Corporate / Active Precision (Sportive High-Performance)

---

## 1. Brand & Design Philosophy

The KickZone design system balances the high energy of soccer sports with a clean, high-contrast, professional corporate layout:
- **Active Precision:** Uses vibrant Pitch Green (`#22c55e` / `#006e2f`) to evoke the vitality of the soccer pitch.
- **Generous Whitespace & Tonal Layering:** Soft off-white backgrounds (`#f8f9fa`) with crisp white elevated cards (`#ffffff`) to reduce eye strain during booking and browsing.
- **Vietnamese Typography Optimization:** Generous line heights ($\ge 1.5$ for body) to ensure legibility of Vietnamese accents and diacritics.

---

## 2. Color Palette & Tokens

### 2.1 Core Brand Colors

| Token Name | Hex Code | Semantic Usage |
| :--- | :--- | :--- |
| `primary` | `#006e2f` | Deep Pitch Green — Primary CTA buttons, brand badges, active links |
| `primary-container` | `#22c55e` | Vibrant Green — Highlights, active selection states, focus outlines |
| `on-primary` | `#ffffff` | Text/icons on primary surfaces |
| `on-primary-container`| `#004b1e` | Deep contrast text on green containers |
| `primary-fixed` | `#6bff8f` | Accent mint highlight |
| `primary-fixed-dim` | `#4ae176` | Inverse primary & active glow |

### 2.2 Neutral & Surface Hierarchy

| Token Name | Hex Code | Semantic Usage |
| :--- | :--- | :--- |
| `background` / `surface` | `#f8f9fa` | Main page background (soft canvas) |
| `surface-container-lowest`| `#ffffff` | Elevated cards, forms, modals, dropdown containers |
| `surface-container-low` | `#f3f4f5` | Filter bars, table headers, secondary panel backgrounds |
| `surface-container` | `#edeeef` | Card hover backgrounds, subtle dividers |
| `surface-container-high`| `#e7e8e9` | Inactive pill badges, borders on light surfaces |
| `surface-container-highest`| `#e1e3e4` | Disabled input backgrounds |
| `on-background` / `text-primary` | `#191c1d` | Main text & headings (Dark Charcoal, AAA contrast) |
| `on-surface-variant` / `text-muted` | `#3d4a3d` / `#6b7280` | Metadata, subtitles, helper text |
| `outline` | `#6d7b6c` | Standard component borders (1px) |
| `outline-variant` | `#bccbb9` / `#e5e7eb` | Subtle dividers and card outlines |

### 2.3 Secondary & Accent Colors

| Token Name | Hex Code | Semantic Usage |
| :--- | :--- | :--- |
| `secondary` | `#575e70` | Slate Steel — Secondary actions, navigation neutral elements |
| `secondary-container` | `#d9dff5` | Secondary chip background |
| `tertiary` | `#585f6c` | Supporting icons, neutral status |
| `tertiary-container` | `#a5acbb` | Tertiary subtle fills |

### 2.4 Functional & Status Colors

| State | Background / Container | Text / Foreground | Description |
| :--- | :--- | :--- | :--- |
| **Available / Confirmed** | `#dcfce7` (Green-100) | `#15803d` (Green-700) | Còn sân / Đã xác nhận / Hoạt động |
| **Pending / In Progress** | `#fef9c3` (Yellow-100) | `#a16207` (Yellow-700) | Chờ duyệt / Đang xử lý |
| **Cancelled / Rejected / Error**| `#ffdad6` (`#fee2e2`) | `#ba1a1a` (`#991b1b`) | Đã hủy / Từ chối / Lỗi hệ thống |
| **Completed / Neutral** | `#f1f5f9` (Slate-100) | `#475569` (Slate-600) | Hoàn thành / Lịch sử |

---

## 3. Typography System

The project uses a dual-font strategy:
- **Headline Font:** `Manrope` (Sans-serif) — Geometric, modern, athletic feel.
- **Body & UI Font:** `Inter` (Sans-serif) — Exceptionally readable at small sizes, optimal for forms and data tables.

### 3.1 Type Scale Specification

| Style Key | Font Family | Size | Weight | Line Height | Letter Spacing | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `display-lg` | Manrope | 48px (`3rem`) | 800 (Extra Bold)| 1.2 | -0.02em | Hero banner titles |
| `headline-lg` | Manrope | 32px (`2rem`) | 700 (Bold) | 1.3 | -0.01em | Page headers, section titles |
| `headline-lg-mobile`| Manrope | 24px (`1.5rem`)| 700 (Bold) | 1.3 | normal | Section titles on mobile |
| `headline-md` | Manrope | 24px (`1.5rem`)| 600 (Semi Bold)| 1.4 | normal | Card titles, modal titles |
| `body-lg` | Inter | 18px (`1.125rem`)| 400 (Regular) | 1.6 | normal | Lead paragraphs, hero subtext |
| `body-md` | Inter | 16px (`1rem`) | 400 (Regular) | 1.6 | normal | Standard body copy, descriptions |
| `body-sm` | Inter | 14px (`0.875rem`)| 400 (Regular) | 1.5 | normal | Field cards, captions, metadata |
| `label-md` | Inter | 14px (`0.875rem`)| 600 (Semi Bold)| 1.0 | 0.05em | Form labels, navigation items |
| `button` | Inter | 16px (`1rem`) | 600 (Semi Bold)| 1.0 | normal | Button text, action links |

---

## 4. Spacing, Grid & Layout

### 4.1 Spacing Scale (4px Baseline)

| Token | Size | Pixels | Usage |
| :--- | :--- | :--- | :--- |
| `xs` | `0.5rem` | 8px | Gap between icon and text, compact badge padding |
| `sm` | `1rem` | 16px | Input padding, tight container margins |
| `md` | `1.5rem` | 24px | Card inner padding, grid gutters |
| `lg` | `2.5rem` | 40px | Section vertical spacing |
| `xl` | `4.0rem` | 64px | Hero & major section margins |

### 4.2 Grid & Breakpoints

- **Desktop ($\ge 1280\text{px}$):** 12-column grid, max-width `1280px`, margin `24px`, gutter `24px`.
- **Tablet ($768\text{px} - 1024\text{px}$):** 8-column grid, margin `20px`, gutter `16px`.
- **Mobile ($< 768\text{px}$):** 4-column grid, margin `16px`, gutter `12px`.

---

## 5. Shape & Elevation

### 5.1 Corner Radius (`border-radius`)

| Scale | Radius Value | Component Application |
| :--- | :--- | :--- |
| `sm` | 4px (`0.25rem`) | Small tooltips, inner chips |
| `DEFAULT` | 8px (`0.5rem`) | Standard input controls, dropdown items |
| `md` | 12px (`0.75rem`) | Buttons, notification banners, input groups |
| `lg` | 16px (`1.0rem`) | Field cards, search bars, modal dialogs |
| `xl` | 24px (`1.5rem`) | Hero promo containers, floating widgets |
| `full` | 9999px | Status badges, pills, avatar circles, filter chips |

### 5.2 Elevation & Shadow Layers

- **Level 0 (Base Canvas):** Background `#f8f9fa`, no shadow.
- **Level 1 (Surface Cards):**
  - Background: `#ffffff`
  - Border: `1px solid #e5e7eb`
  - Shadow: `0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)`
  - Hover: `0 10px 15px -3px rgba(0, 0, 0, 0.08)`
- **Level 2 (Modals / Popovers / Dropdowns):**
  - Background: `#ffffff`
  - Border: `1px solid #e5e7eb`
  - Shadow: `0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)`

---

## 6. Key UI Components Specification

### 6.1 Navigation Header
- **Layout:** Sticky top, height `72px`, white background (`#ffffff`), bottom border `1px solid #e5e7eb`.
- **Elements:** Logo KickZone, Navigation Links (`body-sm` font-weight 600), Notification Icon, User Profile Dropdown / Auth Buttons (Đăng nhập / Đăng ký).
- **Active State:** 2px Pitch Green bottom indicator (`#006e2f`).

### 6.2 Search & Discovery Bar (Thanh Tìm Kiếm Sân)
- **Container:** Elevated white surface (`Level 1`), border-radius `16px` (`rounded-lg`).
- **Fields:**
  1. *Địa điểm/Quận huyện* (Location dropdown with MapPin icon)
  2. *Ngày đặt* (Date picker with Calendar icon)
  3. *Khung giờ* (Time slot selector)
  4. *Loại sân* (5 người / 7 người / 11 người)
  5. *CTA Button:* Solid Pitch Green (`#006e2f`), text "Tìm kiếm", icon Search.

### 6.3 Field Card (Thẻ Sân Bóng)
- **Card Container:** Radius `16px`, white surface with Level 1 shadow, overflow hidden.
- **Image Header:** Aspect ratio `16:9` with 12px top-radius, favorite heart toggle icon top-right.
- **Content Section:**
  - Field Type Pill: e.g. "Sân 7 người" (bg: `#f3f4f5`, text: `#374151`)
  - Title: `headline-md` (e.g. "Sân bóng Chuyên Việt")
  - Address: `body-sm` with Location icon
  - Rating & Reviews: Star icon `#f59e0b` + rating score (`4.8 (120 đánh giá)`)
  - Pricing: `base_price_per_hour` highlighted in green (e.g. `300.000đ / giờ`)
  - Action: Button "Đặt ngay" or "Xem chi tiết"

### 6.4 Booking Time Slot Matrix (Lưới Chọn Giờ Sân)
- **Time intervals:** 30-minute blocks (06:00 → 23:00).
- **Slot States:**
  - **Available:** White bg, border `#e5e7eb`, price tag underneath, green border on hover.
  - **Selected:** Bg `#22c55e`, text `#ffffff`, active tick mark.
  - **Booked / Unavailable:** Bg `#f3f4f5`, text `#9ca3af`, line-through or lock icon, not clickable.

### 6.5 Status Badges (Nhãn Trạng Thái)
- **Pill Shape:** `rounded-full`, padding `4px 12px`, font `label-md` (weight 600).
- **Pending (Chờ duyệt):** Bg `#fef9c3`, text `#a16207`.
- **Confirmed (Đã duyệt):** Bg `#dcfce7`, text `#15803d`.
- **Rejected (Từ chối):** Bg `#fee2e2`, text `#991b1b`.
- **Cancelled (Đã hủy):** Bg `#f1f5f9`, text `#64748b`.
- **Completed (Hoàn thành):** Bg `#e0f2fe`, text `#0369a1`.

---

## 7. Stitch Screen Catalog Reference

Below are the key UI screens designed in Stitch project `10572488772490441791`:

| Screen Title | Path / Route Target | Key Features |
| :--- | :--- | :--- |
| **KICKZONE - Trang chủ** | `/` | Hero section, search bar, featured venues, promo vouchers, testimonial reviews, footer |
| **KICKZONE - Tìm sân bóng** | `/fields` | Filter sidebar (Field type, price slider, time, amenities), interactive grid list, sort dropdown |
| **KICKZONE - Chi tiết sân bóng** | `/fields/[id]` | Image gallery, operating hours table, price rules breakdown, 30-min slot selector, reviews list |
| **KICKZONE - Xác nhận đặt sân** | `/booking/confirm` | Order summary, voucher input & validate button, price breakdown, payment/confirmation step |
| **KICKZONE - Đơn đặt sân của tôi** | `/my-bookings` | Filter tabs (Tất cả / Chờ duyệt / Đã xác nhận / Đã hủy / Hoàn thành), booking cards, detail drawer |
| **KICKZONE - Hủy đơn đặt sân (Popup)** | Modal in `/my-bookings` | Cancellation reason radio list, note input, warning text, confirm cancel CTA |
| **KICKZONE - Bình luận đánh giá** | `/fields/[id]/reviews` | Star rating picker (1-5), review text area, verified booking badge |
| **KICKZONE - Sân yêu thích** | `/favorites` | User's bookmarked soccer fields with quick book CTA |
| **KICKZONE - Hồ sơ cá nhân** | `/profile` | Profile avatar, full name, phone number, security tab |
| **Đăng nhập / Đăng ký** | `/login`, `/register` | Email/password form, Google & Facebook OAuth buttons, validation alerts |
| **Admin - Tổng quan** | `/admin` | Key metrics cards, upcoming booking list, revenue & booking charts |
| **Admin - Quản lý đơn đặt sân** | `/admin/bookings` | Booking table, status filter, approve/reject quick action buttons |
| **Admin - Quản lý sân bóng** | `/admin/fields` | Field list with active/inactive toggles, add field modal, pricing rules editor |
| **Admin - Lịch sân** | `/admin/schedule` | Field calendar schedule timeline view with 30-min booking slots |
| **Admin - Quản lý người dùng** | `/admin/users` | User list, role indicator, active/inactive account status toggle |

---

## 8. Tailwind CSS & Code Integration

When configuring Tailwind in `apps/web/tailwind.config.ts`, integrate these tokens:

```ts
// apps/web/tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  theme: {
    extend: {
      colors: {
        pitch: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          700: '#006e2f',
          900: '#004b1e',
        },
        surface: {
          DEFAULT: '#f8f9fa',
          card: '#ffffff',
          dim: '#d9dadb',
        },
      },
      fontFamily: {
        headline: ['var(--font-manrope)', 'Manrope', 'sans-serif'],
        body: ['var(--font-inter)', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
      },
      boxShadow: {
        card: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        modal: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      },
    },
  },
};

export default config;
```
