export const USE_API =
  String(import.meta.env.VITE_USE_API ?? '').toLowerCase() === 'true';

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8000';
