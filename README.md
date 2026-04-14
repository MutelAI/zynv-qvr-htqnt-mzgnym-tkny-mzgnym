# Business Website Template

A generic, JSON-driven business website template built with **Angular 21**, **Analog.js**, and **Tailwind CSS 4**.  
No hardcoded business content — just edit a single JSON file to create a fully localized (Hebrew/English) business website.

## Quick Start

```bash
pnpm install
pnpm dev
```

## How It Works

All business data is in a single file: **`public/data/business.json`**

Replace its content with your own business data, and the entire website updates — SEO, structured data, all sections.

## JSON Structure (`public/data/business.json`)

```jsonc
{
  "business": {
    "name": "שם העסק בעברית",
    "name_en": "Business Name in English",
    "phone": "+972501234567",
    "phone_display": "050-123-4567",
    "whatsapp": "+972501234567",
    "website": "https://example.co.il/",
    "rating": 4.8,
    "reviews_count": 30,
    "address_he": "כתובת בעברית",
    "address_en": "Address in English",
    "category_he": "קטגוריה בעברית",
    "category_en": "Category in English",
    "maps_url": "https://maps.google.com/?q=...",
    "thumbnail": "/images/hero.jpg",
    "logo_emoji": "🏢",
    "geo": { "latitude": 32.08, "longitude": 34.78 },
    "schema_type": "LocalBusiness",
    "price_range": "$$"
  },
  "hours": [
    { "day_key": "sunday", "day_he": "ראשון", "day_en": "Sunday", "hours_he": "09:00 – 18:00", "hours_en": "09:00 – 18:00", "is_open": true }
    // ... more days
  ],
  "services": [
    { "id": "1", "icon": "🔧", "title_he": "שירות", "title_en": "Service", "desc_he": "תיאור", "desc_en": "Description" }
    // ... more services
  ],
  "reviews": [
    { "author": "Name", "rating": 5, "text": "Review text...", "date": "2 months ago", "is_local_guide": false }
    // ... more reviews
  ],
  "photos": [
    { "url": "/images/photo1.jpg", "thumb": "/images/photo1-thumb.jpg", "source": "owner", "alt_he": "תיאור", "alt_en": "Description" }
    // ... more photos
  ],
  "translations": {
    "hero_badge": { "he": "שירות מקצועי", "en": "Professional Service" },
    "hero_subtitle": { "he": "כותרת משנה", "en": "Subtitle" },
    "about_title": { "he": "עלינו", "en": "About Us" },
    "about_desc": { "he": "תיאור העסק", "en": "Business description" }
    // ... all UI strings (see business.json for the full list of keys)
  }
}
```

## Sections

| Section | Description |
|---------|------------|
| **Header** | Sticky navigation with logo emoji, name, nav links, phone, language toggle |
| **Hero** | Full-screen hero with name, subtitle, rating badge, CTA buttons |
| **About** | Business description, working hours, stats (rating, reviews, experience) |
| **Services** | Grid of services with icons |
| **Gallery** | Masonry photo grid with lightbox |
| **Reviews** | Customer reviews with star ratings, load-more |
| **Contact** | Contact info + WhatsApp form |
| **Footer** | Brand, quick links, contact details |
| **WhatsApp FAB** | Floating action button |

## For AI: How to Generate a New Site

1. Create a `business.json` following the schema above
2. Place the file at `public/data/business.json`
3. Add images to `public/images/` and reference them in the JSON
4. Run `pnpm build` to generate the static site

All translation keys in the `translations` object control the UI text in both Hebrew and English. The website automatically supports RTL (Hebrew) and LTR (English) with a language toggle.

## Build & Deploy

```bash
pnpm build        # Output in dist/client/
pnpm preview      # Preview the built site
```

This project was generated with [Analog](https://analogjs.org), the fullstack meta-framework for Angular.

## Setup

Run `npm install` to install the application dependencies.

## Development

Run `npm start` for a dev server. Navigate to `http://localhost:5173/`. The application automatically reloads if you change any of the source files.

## Build

Run `npm run build` to build the client/server project. The client build artifacts are located in the `dist/analog/public` directory. The server for the API build artifacts are located in the `dist/analog/server` directory.

## Community

- Visit and Star the [GitHub Repo](https://github.com/analogjs/analog)
- Join the [Discord](https://chat.analogjs.org)
- Follow us on [Twitter](https://twitter.com/analogjs)
- Become a [Sponsor](https://github.com/sponsors/brandonroberts)
