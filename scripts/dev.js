#!/usr/bin/env node

const { spawn } = require("child_process");

let nextProcess = null;

// Función para iniciar Next.js
function startNextDev() {
  if (nextProcess) {
    nextProcess.kill();
  }

  nextProcess = spawn("next", ["dev"], {
    stdio: "inherit",
    shell: false,
  });

  nextProcess.on("error", (error) => {
    console.error("Error al iniciar Next.js:", error);
  });
}

// Configurar stdin en modo raw para capturar keypresses
if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding("utf8");

  process.stdin.on("data", (char) => {
    if (char === "c" || char === "C") {
      console.clear();
    } else if (char === "r" || char === "R") {
      console.log("\n🔄 Restarting Next.js dev server...\n");
      startNextDev();
    } else if (char === "\u0003") {
      // Ctrl+C
      console.log("\n👋 Stopping dev server...");
      process.exit(0);
    }
  });
}

// Manejar Ctrl+C
process.on("SIGINT", () => {
  console.log("\n👋 Stopping dev server...");
  if (nextProcess) {
    nextProcess.kill();
  }
  process.exit(0);
});

// Iniciar el servidor
console.log("🚀 Starting Next.js dev server... (Press 'c' to clear, 'r' to restart)\n");
startNextDev();


