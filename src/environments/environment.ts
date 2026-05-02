export const environment = {
  production: false,
  /** Local sem nginx: igual ao path real no uvicorn (main.py API_ROOT = /backend). */
  apiUrl: 'http://localhost:8000/backend'
};