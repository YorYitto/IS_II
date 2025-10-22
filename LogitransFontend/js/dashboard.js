// js/dashboard.js

window.onload = () => {
    const userData = JSON.parse(localStorage.getItem("user"));
    const userInfo = document.getElementById("user-info");
    
    if (!userData) {
      // Si no hay sesión, vuelve al login
      window.location.href = "index.html";
      return;
    }
  
    userInfo.innerHTML = `
      <strong>Usuario:</strong> ${userData.name}<br>
      <strong>Correo:</strong> ${userData.email}
    `;
  
    document.getElementById("logout").addEventListener("click", () => {
      localStorage.removeItem("user");
      window.location.href = "index.html";
    });
  };
  