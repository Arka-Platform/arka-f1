# Arka - Books in Motion

A modern, sustainable book-sharing platform built with React and TypeScript.

## Features

### Pages
- **Landing Page** (`/`): Arka landing page with hero, how it works, join options, and app download
- **Books Marketplace** (`/books`): Browse books with search, filters, reviews, and recommendations
- **Order/Checkout** (`/order`): Complete order form with user details, pickup location, and payment options
- **Contact Us** (`/contact`): Contact form, contact information, and FAQ section
- **EcoBookHub Landing** (`/ecobookhub`): Alternative landing page with hero, services, and testimonials
- **Book Pickup** (`/pickup`): Eco-friendly book pickup service page with service details

### Shared Components
- **Layout**: Header and Footer wrapper for consistent navigation
- **BookCard**: Reusable book display component
- **Button**: Styled button component with variants
- **Input**: Form input component with labels and error handling
- **Textarea**: Multi-line text input component
- **Select**: Dropdown select component with custom styling

### Design Features
- **Responsive Design**: Mobile-first approach with breakpoints for tablets and desktops
- **Accessibility**: ARIA labels and semantic HTML
- **Full-width Layout**: Header and footer span entire screen width
- **Modular Architecture**: Reusable components and organized page structure

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **React Router** - Client-side routing
- **Vite** - Build tool and dev server
- **CSS Modules** - Scoped styling

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The production build will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
arka-f1/
├── src/
│   ├── components/
│   │   ├── Layout/          # Shared layout wrapper (Header + Footer)
│   │   ├── Header/          # Site header with navigation
│   │   ├── Footer/          # Site footer component
│   │   ├── Hero/            # Hero section component
│   │   ├── HowItWorks/      # How it works section component
│   │   ├── JoinBookCycle/   # Join section component
│   │   ├── GetOurApp/       # Get app section component
│   │   └── shared/          # Reusable shared components
│   │       ├── Button/      # Button component
│   │       ├── Input/       # Input component
│   │       ├── Textarea/    # Textarea component
│   │       ├── Select/      # Select dropdown component
│   │       └── BookCard/  # Book card display component
│   ├── pages/
│   │   ├── LandingPage/         # BookCycle landing page
│   │   ├── BooksMarketplace/    # Books marketplace page
│   │   ├── Order/               # Order/checkout page
│   │   ├── ContactUs/           # Contact us page
│   │   ├── EcoBookHubLanding/   # EcoBookHub landing page
│   │   └── BookPickup/          # Book pickup service page
│   ├── App.tsx              # Main app with routing
│   ├── App.css
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Development

### Code Style

- TypeScript strict mode enabled
- ESLint configured for React best practices
- CSS Modules for component-scoped styles

### Architecture

- **Pages** (`src/pages/`): Full page components that compose multiple sections
  - `LandingPage`: The main landing page with all hero and content sections
- **Components** (`src/components/`): Reusable UI components
  - `Layout`: Shared layout wrapper with Header and Footer
  - `Header`, `Footer`: Site-wide navigation components
  - `Hero`, `HowItWorks`, `JoinBookCycle`, `GetOurApp`: Section components used in pages

### Component Guidelines

- Each component has its own directory with:
  - Component file (`.tsx`)
  - Styles file (`.module.css`)
- Components use functional components with hooks
- Props are typed with TypeScript interfaces
- Pages compose multiple components to create full page views

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT

