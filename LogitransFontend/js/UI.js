// Clase encargada de manejar la interfaz del login
export class UI {
    static showMessage(message, type = "info") {
      const msgBox = document.getElementById("message");
      msgBox.textContent = message;
      msgBox.style.color = type === "error" ? "#ef4444" : "#10b981";
    }
  
    static clearMessage() {
      const msgBox = document.getElementById("message");
      msgBox.textContent = "";
    }
  }
  