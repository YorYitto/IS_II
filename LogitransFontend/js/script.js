// js/script.js
// Manejo del login

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");

  if (!loginForm) return;

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const correo = document.getElementById("username").value.trim();
    const contraseña = document.getElementById("password").value;

    try {
      const resp = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, contraseña }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        alert("❌ Usuario o contraseña incorrectos");
        return;
      }

      const data = await resp.json();

      // El backend debe devolver: { token, rol, nombre, id }
      setToken(data.token);
      saveUser({ id: data.id || data.user?.id || null, nombre: data.nombre || data.user?.nombre || null, rol: data.rol || data.user?.rol || null });

      // Redireccionar según rol
      const rol = data.rol || (data.user && data.user.rol);
      if (rol === "admin") {
        window.location.href = "admin.html";
      } else {
        window.location.href = "mapa.html";
      }
    } catch (err) {
      console.error(err);
      alert("⚠️ No se pudo conectar con el servidor.");
    }
  });
});
