// Application configuration
export const APP_CONFIG = {
  // Base URL for the application
  BASE_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://applicant.iuea.ac.ug',
  
  // API endpoints
  API: {
    // If you have any backend API endpoints, add them here
    // BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'https://api.iuea.ac.ug',
  },
  
  // External services
  EXTERNAL: {
    MAYTAPI: {
      BASE_URL: 'https://api.maytapi.com/api',
      PRODUCT_ID: process.env.NEXT_PUBLIC_MAYTAPI_PRODUCT_ID || 'eae79c59-f48d-4fd2-9feb-c65fc1d317df',
      TOKEN: process.env.NEXT_PUBLIC_MAYTAPI_TOKEN || '4dba0328-0c7e-4749-9b39-588ec18259cb',
      PHONE_ID: process.env.NEXT_PUBLIC_MAYTAPI_PHONE_ID || '104228',
    },
  },
};

// Helper functions for URL construction
export const createAbsoluteUrl = (path: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${APP_CONFIG.BASE_URL}/${cleanPath}`;
};

export const createExternalUrl = (path: string, baseUrl: string): string => {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${baseUrl}/${cleanPath}`;
};
