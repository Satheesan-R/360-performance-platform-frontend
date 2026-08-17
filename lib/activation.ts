const PASSWORD_SETUP_TOKEN_KEY = "performance_platform_password_setup";

export function savePasswordSetupToken(token: string) {
  sessionStorage.setItem(PASSWORD_SETUP_TOKEN_KEY, token);
}

export function getPasswordSetupToken() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(PASSWORD_SETUP_TOKEN_KEY);
}

export function clearPasswordSetupToken() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PASSWORD_SETUP_TOKEN_KEY);
}
