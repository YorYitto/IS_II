// js/auth.js
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const correo = document.getElementById("correo").value;
      const contraseña = document.getElementById("contraseña").value;

      try {
        const res = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ correo, contraseña }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        setToken(data.token);

        if (data.rol === "admin") {
          window.location.href = "admin.html";
        } else {
          window.location.href = "mapa.html";
        }
      } catch (err) {
        alert("Error al iniciar sesión: " + err.message);
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const nombre = document.getElementById("nombre").value;
      const correo = document.getElementById("correo").value;
      const contraseña = document.getElementById("contraseña").value;

      try {
        const res = await fetch(`${API_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre, correo, contraseña }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        alert("Registro exitoso, ahora inicia sesión.");
        window.location.href = "index.html";
      } catch (err) {
        alert("Error al registrar: " + err.message);
      }
    });
  }
});
