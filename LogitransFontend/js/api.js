// js/api.js
const API_URL = "http://localhost:9090/api"; // tu backend en AWS (ajústalo si está desplegado públicamente)

function getToken() {
  return localStorage.getItem("token");
}

function setToken(token) {
  localStorage.setItem("token", token);
}

function removeToken() {
  localStorage.removeItem("token");
}
