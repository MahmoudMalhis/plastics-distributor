import { api } from "../../../lib/api";

export async function checkInitialized() {
  const { data } = await api.get(`/api/auth/initialized`);
  return data;
}

export async function login({ username, password }) {
  const { data } = await api.post(`/api/auth/login`, {
    username,
    password,
  });
  return data;
}

export async function setupInitialAdmin({ username, password }) {
  const { data } = await api.post(`/api/auth/setup-initial-admin`, {
    username,
    password,
  });
  return data;
}

export async function refreshToken(refreshToken) {
  const { data } = await api.post(`/api/auth/refresh`, {
    refreshToken,
  });
  return data;
}

export async function setPasswordWithToken({ token, newPassword }) {
  const { data } = await api.post(`/api/auth/set-password`, {
    token,
    newPassword,
  });
  return data;
}

export async function verifyPasswordToken(token) {
  const { data } = await api.get(`/api/auth/password-token/verify`, {
    params: { token },
  });
  return data;
}
