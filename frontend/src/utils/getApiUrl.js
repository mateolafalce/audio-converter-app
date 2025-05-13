export function getApiUrl(endpoint) {
  if (window.location.hostname === "localhost") {
    return `http://localhost:8002${endpoint}`;
  }
  return `/api${endpoint}`;
}
