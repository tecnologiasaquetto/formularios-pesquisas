// Mock auth for prototype
const ADMIN_PASSWORD = "admin123";

export function login(senha: string): boolean {
  if (senha === ADMIN_PASSWORD) {
    sessionStorage.setItem("admin_token", senha);
    return true;
  }
  return false;
}

export function logout() {
  sessionStorage.removeItem("admin_token");
}

export function isAuthenticated(): boolean {
  return sessionStorage.getItem("admin_token") === ADMIN_PASSWORD;
}
