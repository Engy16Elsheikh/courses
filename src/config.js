// Single place to read the API URL from environment variables (Create React App).
// For Vite, use: import.meta.env.VITE_API_URL
export const API_URL = (
  process.env.REACT_APP_API_URL || 'http://localhost:5000'
).replace(/\/$/, '');

// Works for both full URLs (Cloudinary, S3...) and relative paths served by the backend
export const imageUrl = (path) => {
  if (!path) return 'https://via.placeholder.com/400x200?text=No+Image';
  return /^https?:\/\//i.test(path) ? path : `${API_URL}${path}`;
};