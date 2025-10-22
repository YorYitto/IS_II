// js/register.js

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  const messageDiv = document.getElementById("message");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = document.getElementById("fullname").value.trim();
    const correo = document.getElementById("email").value.trim();
    const contraseña = document.getElementById("password").value.trim();
    const confirmPass = document.getElementById("confirmPassword").value.trim();

    if (!nombre || !correo || !contraseña || !confirmPass) {
      showMessage("⚠️ Por favor complete todos los campos.", "error");
      return;
    }

    if (contraseña !== confirmPass) {
      showMessage("❌ Las contraseñas no coinciden.", "error");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, correo, contraseña }),
      });

      const data = await response.json();

      if (!response.ok) {
        showMessage(data.error || "❌ Error al registrar usuario.", "error");
        return;
      }

      showMessage("✅ Usuario registrado con éxito.", "success");
      setTimeout(() => (window.location.href = "index.html"), 1200);
    } catch (error) {
      console.error("Error:", error);
      showMessage("⚠️ No se pudo conectar con el servidor.", "error");
    }
  });

  function showMessage(msg, type) {
    messageDiv.textContent = msg;
    messageDiv.className = type;
    setTimeout(() => (messageDiv.textContent = ""), 4000);
  }
});
