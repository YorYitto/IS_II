// js/googleAuth.js
// Manejo autenticación con Google Sign-In - conserva tu lógica y guarda user/token en localStorage

function handleCredentialResponse(response) {
  const data = parseJwt(response.credential);
  console.log("✅ Usuario autenticado con Google:", data);

  // Guardar en localStorage como usuario simple
  saveUser({ id: data.sub, nombre: data.name, correo: data.email, rol: data.email === "admin@tudominio.com" ? "admin" : "cliente" });

  // Enviar token al backend si lo deseas para validarlo/crear cuenta
  // fetch(`${API_BASE_URL}/google-login`, { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ token: response.credential }) });

  // Redirigir, si el correo es admin ir a admin.html
  const role = (data.email === "admin@tudominio.com") ? "admin" : "cliente";
  if (role === "admin") window.location.href = "admin.html";
  else window.location.href = "mapa.html";
}

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Error al decodificar el token:", e);
    return {};
  }
}
