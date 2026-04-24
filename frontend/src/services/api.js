const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const ACCESS_TOKEN_KEY = "vault_access_token";
const REFRESH_TOKEN_KEY = "vault_refresh_token";

function buildUrl(path) {
  return `${API_BASE_URL}${path}`;
}

async function parseError(response) {
  try {
    const data = await response.json();
    return data.detail || "Request failed";
  } catch (_error) {
    return response.statusText || "Request failed";
  }
}

async function request(path, options = {}) {
  const response = await fetch(buildUrl(path), options);
  if (!response.ok) {
    const message = await parseError(response);
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function withAuthHeader(token, headers = {}) {
  return {
    ...headers,
    Authorization: `Bearer ${token}`
  };
}

export function getStoredTokens() {
  return {
    accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY)
  };
}

export function persistTokens({ accessToken, refreshToken }) {
  if (accessToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  }
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export async function registerUser(payload) {
  return request("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export async function loginUser(payload) {
  return request("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export async function refreshAccessToken(refreshToken) {
  return request("/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken })
  });
}

export async function requestWithAuth(path, options, tokens, setTokens) {
  try {
    return await request(path, {
      ...options,
      headers: withAuthHeader(tokens.accessToken, options?.headers)
    });
  } catch (error) {
    if (error.status !== 401 || !tokens.refreshToken) {
      throw error;
    }

    const refreshed = await refreshAccessToken(tokens.refreshToken);
    const updatedTokens = {
      accessToken: refreshed.access_token,
      refreshToken: tokens.refreshToken
    };
    persistTokens(updatedTokens);
    setTokens(updatedTokens);

    return request(path, {
      ...options,
      headers: withAuthHeader(updatedTokens.accessToken, options?.headers)
    });
  }
}

export function getCurrentUser(tokens, setTokens) {
  return requestWithAuth("/auth/me", { method: "GET" }, tokens, setTokens);
}

export function listFiles(tokens, setTokens) {
  return requestWithAuth("/files/", { method: "GET" }, tokens, setTokens);
}

export function uploadFile(file, tokens, setTokens) {
  const formData = new FormData();
  formData.append("file", file);

  return requestWithAuth(
    "/files/upload",
    {
      method: "POST",
      body: formData
    },
    tokens,
    setTokens
  );
}

export function getDownloadLink(fileId, tokens, setTokens) {
  return requestWithAuth(`/files/${fileId}/presign`, { method: "GET" }, tokens, setTokens);
}

export function deleteFile(fileId, tokens, setTokens) {
  return requestWithAuth(`/files/${fileId}`, { method: "DELETE" }, tokens, setTokens);
}
