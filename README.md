# Eventa Frontend

Premium VIP Transport Management System - Frontend Application

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: React Context
- **Charts**: Recharts
- **Icons**: Lucide React

## Features

- 🔐 **Authentication**: Login with role-based access (Admin/Driver)
- 📱 **PWA Support**: Add to home screen, standalone mode
- 🌍 **Multi-language**: Azerbaijani, English, Russian, Turkish
- 🌙 **Theme**: Light/Dark mode toggle
- 📊 **Dashboard**: Real-time stats and weekly performance charts
- 📅 **Events**: Create, manage events and guest transfers
- 🚗 **Drivers**: Driver management with assignment workflows
- 📈 **Reports**: Export data to Excel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

For production, set `NEXT_PUBLIC_API_URL` to your backend URL.

## Project Structure

```
app/
├── admin/           # Admin pages (dashboard, events, drivers, users, reports)
├── driver/          # Driver portal pages
├── reset-password/  # Password reset flow
├── page.tsx         # Login page
└── layout.tsx       # Root layout with providers

components/
├── ui/              # shadcn/ui components
└── ...              # Custom components (sidebar, status-badge, etc.)

lib/
├── api.ts           # API client
├── auth-context.tsx # Authentication context
├── language-context.tsx # i18n context
├── translations.ts  # Translation strings
└── types.ts         # TypeScript types
```

## Build

```bash
# Production build
npm run build

# Start production server
npm start
```

## Deployment

Deploy to Railway, Vercel, or any Node.js hosting:

1. Set `NEXT_PUBLIC_API_URL` environment variable
2. Run `npm run build`
3. Start with `npm start`

## License

Private - All rights reserved
