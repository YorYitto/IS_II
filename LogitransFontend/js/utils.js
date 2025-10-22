// js/utils.js
// Funciones utilitarias usadas por todos los scripts

const API_BASE_URL = "http://3.82.210.45:9090/api"; // ajusta si cambias el backend

function getToken() {
  return localStorage.getItem("lt_token");
}

function setToken(token) {
  localStorage.setItem("lt_token", token);
}

function removeToken() {
  localStorage.removeItem("lt_token");
}

function saveUser(user) {
  localStorage.setItem("lt_user", JSON.stringify(user));
}

function getUser() {
  const s = localStorage.getItem("lt_user");
  return s ? JSON.parse(s) : null;
}

function requireAuthRedirect() {
  if (!getToken()) {
    window.location.href = "index.html";
  }
}

// Export for modules? Files are plain scripts so we attach to window
window.API_BASE_URL = API_BASE_URL;
window.getToken = getToken;
window.setToken = setToken;
window.removeToken = removeToken;
window.saveUser = saveUser;
window.getUser = getUser;
window.requireAuthRedirect = requireAuthRedirect;
