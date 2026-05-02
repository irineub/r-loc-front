/**
 * Produção: URL pública (nginx). O proxy encaminha para o uvicorn em /backend/...
 * (FastAPI API_ROOT = /backend). Não use /api/backend no uvicorn sem esse proxy.
 */
export const environment = {
  production: true,
  apiUrl: 'http://srv1466969.hstgr.cloud/api/backend'
};