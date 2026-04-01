import { setAuthTokenGetter } from "@workspace/api-client-react";

setAuthTokenGetter(() => localStorage.getItem("admin_jwt"));

const originalFetch = window.fetch;
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const response = await originalFetch(input, init);
  if (response.status === 401) {
    window.dispatchEvent(new CustomEvent('api-unauthorized', { detail: 401 }));
  }
  return response;
};

export function getAuthHeaders() {
  const token = localStorage.getItem("admin_jwt");
  return token ? { Authorization: `Bearer ${token}` } : {};
}
