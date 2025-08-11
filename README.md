# Nyota Student Portal

A modern student portal built with Next.js and Firebase for the International University of East Africa (IUEA).

## Features

- Student authentication and management
- Course enrollment and tracking
- Real-time notifications
- Responsive design with Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase account

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
   - Copy `.env.local.example` to `.env.local`
   - Fill in your Firebase configuration values

4. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) with your browser to see the result (development).

For production, the app will run on port 3000 by default.

## Available Scripts

- `npm run dev` - Runs the development server with Turbopack on port 3001
- `npm run build` - Builds the application for production
- `npm start` - Starts the production server on port 3000 (or PORT env variable)
- `npm run lint` - Runs ESLint for code quality
- `npm run lint:fix` - Auto-fixes ESLint issues
- `npm run clean` - Removes build artifacts
- `npm run clean:all` - Complete cleanup including node_modules

## Technology Stack

- **Framework**: Next.js 15.4.6
- **UI**: React 19.1.0, Tailwind CSS 4
- **Backend**: Firebase (Firestore, Authentication, Storage)
- **Language**: TypeScript
- **Icons**: Remix Icons

## Deployment

### Quick Deployment with Script

Use the provided deployment script for easy setup:

```bash
# Development
./deploy.sh development

# Production
./deploy.sh production
```

### Manual Deployment

This application is configured for deployment with Vercel or Firebase Hosting.

For production deployment, make sure to:

1. Set all environment variables
2. Run `npm run build` to create the production build
3. Configure your hosting platform with the build output

### Environment Configuration

- **Development**: Uses port 3001, connects to backend on port 5000
- **Production**: Uses port 3000 (configurable via PORT env variable)

Make sure to set up the appropriate `.env.production` file with your production backend URL.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

Private - International University of East Africa
