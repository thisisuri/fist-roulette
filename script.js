class FutureRoulette {
  constructor() {
    this.challenges = [];
    this.recentChallenges = []; // Últimos 3 desafíos para evitar repetición
    this.isSpinning = false;

    // Validar que todos los elementos necesarios existen
    this.validateDOM();

    this.elements = {
      spinnerArea: document.getElementById("spinnerArea"),
      spinButton: document.getElementById("spinButton"),
      challengeEs: document.getElementById("challengeEs").querySelector(".challenge-text"),
      challengeRu: document.getElementById("challengeRu").querySelector(".challenge-text"),
      challengeEn: document.getElementById("challengeEn").querySelector(".challenge-text"),
      particles: document.getElementById("particles"),
    };

    this.init();
  }

  validateDOM() {
    const requiredElements = [
      "spinnerArea",
      "spinButton", 
      "challengeMultilang",
      "challengeEs",
      "challengeRu", 
      "challengeEn",
      "particles",
    ];

    const missingElements = requiredElements.filter(
      (id) => !document.getElementById(id)
    );

    if (missingElements.length > 0) {
      console.error("❌ Missing required DOM elements:", missingElements);
      throw new Error(
        `Faltan elementos necesarios en el HTML: ${missingElements.join(", ")}`
      );
    }
  }

  async init() {
    try {
      await this.loadChallenges();
      this.setupEventListeners();
      this.createParticles();
      
      // Cargar historial desde localStorage
      this.loadRecentChallenges();
      
      // Solo mostrar "empieza a jugar" si nunca se ha jugado
      if (this.recentChallenges.length === 0) {
        this.elements.challengeEs.textContent = "empieza a jugar";
        this.elements.challengeRu.textContent = "начни играть";
        this.elements.challengeEn.textContent = "start playing";
      } else {
        // Si ya se ha jugado, mostrar el último desafío
        const lastChallenge = this.recentChallenges[0];
        this.elements.challengeEs.textContent = lastChallenge.texts.es;
        this.elements.challengeRu.textContent = lastChallenge.texts.ru;
        this.elements.challengeEn.textContent = lastChallenge.texts.en;
      }
      
      console.log("🎮 Fist Roulette 2026 initialized successfully!");
    } catch (error) {
      console.error("❌ Error initializing roulette:", error);
      this.showErrorState(error.message);
    }
  }

  loadRecentChallenges() {
    try {
      const stored = localStorage.getItem('fistroulette_recent');
      if (stored) {
        this.recentChallenges = JSON.parse(stored);
        console.log(`📚 Loaded ${this.recentChallenges.length} recent challenges from storage`);
      }
    } catch (error) {
      console.warn("⚠️ Could not load recent challenges from localStorage:", error);
      this.recentChallenges = [];
    }
  }

  saveRecentChallenges() {
    try {
      localStorage.setItem('fistroulette_recent', JSON.stringify(this.recentChallenges));
    } catch (error) {
      console.warn("⚠️ Could not save recent challenges to localStorage:", error);
    }
  }

  async loadChallenges() {
    try {
      const response = await fetch("./challenges.json");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      this.challenges = data.challenges;
      console.log(`📝 Loaded ${this.challenges.length} challenges`);
    } catch (error) {
      console.error("❌ Error loading challenges:", error);
      // En lugar de fallback, mostrar error
      this.challenges = [];
      throw new Error(
        "No se pueden cargar las opciones de la ruleta. Lo sentimos..."
      );
    }
  }

  setupEventListeners() {
    this.elements.spinButton.addEventListener("click", () => this.spin());

    // Efectos de sonido con Web Audio API (opcional)
    this.setupAudioContext();

    // Atajo de teclado solo para girar
    document.addEventListener("keydown", (e) => {
      if (e.code === "Space" && !this.isSpinning) {
        e.preventDefault();
        this.spin();
      }
    });
  }

  setupAudioContext() {
    try {
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
    } catch (error) {
      console.log("🔇 Audio context not available");
    }
  }

  playTone(frequency = 800, duration = 100) {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(
      frequency,
      this.audioContext.currentTime
    );
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + duration / 1000
    );

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration / 1000);
  }

  getValidChallenges() {
    // Filtrar desafíos que no estén en los últimos 3 resultados
    const recentIds = this.recentChallenges.map((challenge) => challenge.id);
    return this.challenges.filter(
      (challenge) => !recentIds.includes(challenge.id)
    );
  }

  selectRandomChallenge() {
    const validChallenges = this.getValidChallenges();

    if (validChallenges.length === 0) {
      // Si no hay desafíos válidos, reiniciar el historial reciente
      console.log("🔄 Resetting recent challenges history");
      this.recentChallenges = [];
      return this.challenges[
        Math.floor(Math.random() * this.challenges.length)
      ];
    }

    return validChallenges[Math.floor(Math.random() * validChallenges.length)];
  }

  calculateTargetIndex(targetChallenge) {
    return this.challenges.findIndex((c) => c.id === targetChallenge.id);
  }

  async spin() {
    if (this.isSpinning) return;

    this.isSpinning = true;
    this.elements.spinButton.disabled = true;
    this.elements.spinButton.querySelector(".button-text").textContent =
      "GIRANDO...";

    // Seleccionar desafío
    const selectedChallenge = this.selectRandomChallenge();

    // Mostrar spinner
    this.showSpinner();

    // Esperar 2 segundos
    await this.waitForSpinner();

    // Ocultar spinner y mostrar resultado
    this.hideSpinner();
    this.showWinningResult(selectedChallenge);

    // Finalizar
    this.completeSpin(selectedChallenge);

    console.log(`🎲 Selected challenge: ${selectedChallenge.text}`);
  }

  showSpinner() {
    // Ocultar mensaje por defecto
    const defaultMessage = this.elements.spinnerArea.querySelector('.default-message');
    if (defaultMessage) defaultMessage.style.display = 'none';

    // Crear overlay de spinner
    const spinnerOverlay = document.createElement("div");
    spinnerOverlay.id = "spinnerOverlay";
    spinnerOverlay.className = "spinner-overlay";
    spinnerOverlay.innerHTML = `
      <div class="spinner">
        <div class="spinner-circle"></div>
        <div class="spinner-text">GIRANDO...</div>
      </div>
    `;

    this.elements.spinnerArea.appendChild(spinnerOverlay);

    // Efectos de sonido
    this.playSpinSounds();
  }

  async waitForSpinner() {
    return new Promise((resolve) => {
      setTimeout(resolve, 2000);
    });
  }

  hideSpinner() {
    const spinnerOverlay = document.getElementById("spinnerOverlay");
    if (spinnerOverlay) {
      spinnerOverlay.remove();
    }
  }

  showWinningResult(challenge) {
    // Mostrar el número ganador en el área del spinner
    this.elements.spinnerArea.innerHTML = `
      <h2 class="roulette-title">RULETA DE DESAFÍOS</h2>
      <div class="winning-display">
        <div class="winning-number">${challenge.id}</div>
        <div class="winning-label">¡Desafío seleccionado!</div>
      </div>
    `;
  }

  centerOnWinningSlot(winningId) {
    const wheel = document.getElementById("rouletteWheel");
    const container = this.elements.wheelTrack;
    const slots = wheel.querySelectorAll(".roulette-slot");

    // Encontrar la casilla con el número ganador en la segunda copia (posición inicial)
    const totalSlots = this.challenges.length;
    let targetSlot = null;

    slots.forEach((slot, index) => {
      const slotNumber = parseInt(
        slot.querySelector(".slot-number").textContent
      );
      const isInSecondCopy = index >= totalSlots && index < totalSlots * 2;

      if (slotNumber === winningId && isInSecondCopy) {
        targetSlot = slot;
      }
    });

    if (targetSlot && container) {
      const containerWidth = container.offsetWidth;
      const slotWidth = 120;
      const centerOffset = containerWidth / 2 - slotWidth / 2;
      const slotIndex = Array.from(slots).indexOf(targetSlot);
      const targetPosition = slotIndex * slotWidth;

      wheel.style.transition =
        "transform 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
      wheel.style.transform = `translateX(${centerOffset - targetPosition}px)`;
    }
  }

  async animateWheel(targetIndex) {
    return new Promise((resolve) => {
      const wheel = document.getElementById("rouletteWheel");
      const container = this.elements.wheelTrack;
      const slotWidth = 120;
      const totalSlots = this.challenges.length;
      const containerWidth = container.offsetWidth;
      const centerOffset = containerWidth / 2 - slotWidth / 2;

      // Calcular rotaciones adicionales para efecto visual
      const extraRotations = 4 + Math.random() * 3; // 4-7 vueltas completas
      const extraDistance = extraRotations * totalSlots * slotWidth;

      // Posición final: segunda copia + índice objetivo, centrado
      const finalPosition = totalSlots * slotWidth + targetIndex * slotWidth;
      const centeredFinalPosition = centerOffset - finalPosition;

      // Posición durante la animación (con vueltas extra)
      const animationEndPosition =
        centerOffset - (finalPosition + extraDistance);

      // Primera fase: animación larga con vueltas extra
      wheel.style.transition = "transform 3.5s cubic-bezier(0.15, 0, 0.25, 1)";
      wheel.style.transform = `translateX(${animationEndPosition}px)`;

      // Sonidos durante la rotación
      this.playSpinSounds();

      setTimeout(() => {
        // Segunda fase: posicionar en la casilla final centrada
        wheel.style.transition =
          "transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
        wheel.style.transform = `translateX(${centeredFinalPosition}px)`;

        setTimeout(() => {
          resolve();
        }, 800);
      }, 3500);
    });
  }



  completeSpin(challenge) {
    // Actualizar texto del desafío en los 3 idiomas
    this.elements.challengeEs.textContent = challenge.texts.es;
    this.elements.challengeRu.textContent = challenge.texts.ru;
    this.elements.challengeEn.textContent = challenge.texts.en;

    // Agregar a historial de desafíos recientes
    this.recentChallenges.unshift(challenge); // Agregar al principio
    if (this.recentChallenges.length > 3) {
      this.recentChallenges = this.recentChallenges.slice(0, 3); // Mantener solo los últimos 3
    }
    
    // Guardar en localStorage
    this.saveRecentChallenges();

    // Habilitar botón de nuevo
    setTimeout(() => {
      this.elements.spinButton.disabled = false;
      this.elements.spinButton.querySelector(".button-text").textContent = "¡GIRA LA RULETA!";
      this.isSpinning = false;
      
      // Solo restaurar área de spinner sin resetear textos
      this.elements.spinnerArea.innerHTML = `
        <h2 class="roulette-title">RULETA DE DESAFÍOS</h2>
        <div class="default-message">listo para el siguiente</div>
      `;
    }, 2000);

    // Efectos de sonido de victoria
    this.playTone(880, 200);
    setTimeout(() => this.playTone(1100, 300), 200);

    console.log(
      `🏆 Challenge completed! Recent challenges: ${this.recentChallenges.length}/3`
    );
  }

  highlightWinningSlot(winningId) {
    // Limpiar highlight anterior
    document.querySelectorAll(".roulette-slot").forEach((slot) => {
      slot.classList.remove("winning-slot");
    });

    // Encontrar y marcar la casilla ganadora que está centrada
    const wheel = document.getElementById("rouletteWheel");
    const container = this.elements.wheelTrack;
    const containerWidth = container.offsetWidth;
    const centerX = containerWidth / 2;
    const slots = wheel.querySelectorAll(".roulette-slot");

    let closestSlot = null;
    let minDistance = Infinity;

    slots.forEach((slot) => {
      const slotNumber = parseInt(
        slot.querySelector(".slot-number").textContent
      );
  createParticles() {
    const particleCount = 20;

    for (let i = 0; i < particleCount; i++) {
      setTimeout(() => {
        this.createSingleParticle();
      }, i * 200);
    }

    // Crear partículas continuamente
    setInterval(() => {
      this.createSingleParticle();
    }, 2000);
  }

  createSingleParticle() {
    const particle = document.createElement("div");
    particle.className = "particle";

    particle.style.left = Math.random() * 100 + "%";
    particle.style.top = Math.random() * 100 + "%";
    particle.style.animationDelay = Math.random() * 6 + "s";
    particle.style.animationDuration = 4 + Math.random() * 4 + "s";

    this.elements.particles.appendChild(particle);

    // Remover partícula después de la animación
    setTimeout(() => {
      if (particle.parentNode) {
        particle.parentNode.removeChild(particle);
      }
    }, 8000);
  }

  createBurstParticles(count = 30) {
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const particle = document.createElement("div");
        particle.className = "particle";
        particle.style.position = "fixed";
        particle.style.left = "50%";
        particle.style.top = "50%";
        particle.style.width = "4px";
        particle.style.height = "4px";
        particle.style.background = "var(--neon-red)";
        particle.style.borderRadius = "50%";
        particle.style.pointerEvents = "none";
        particle.style.zIndex = "1000";

        const angle = (i / count) * Math.PI * 2;
        const velocity = 100 + Math.random() * 100;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;

        particle.style.animation = `burstParticle 1s ease-out forwards`;
        particle.style.setProperty("--vx", vx + "px");
        particle.style.setProperty("--vy", vy + "px");

        document.body.appendChild(particle);

        setTimeout(() => {
          if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
          }
        }, 1000);
      }, i * 10);
    }

    // Añadir la animación CSS dinámicamente si no existe
    if (!document.querySelector("#burst-animation-style")) {
      const style = document.createElement("style");
      style.id = "burst-animation-style";
      style.textContent = `
                @keyframes burstParticle {
                    0% {
                        transform: translate(-50%, -50%) translate(0, 0);
                        opacity: 1;
                        scale: 1;
                    }
                    100% {
                        transform: translate(-50%, -50%) translate(var(--vx), var(--vy));
                        opacity: 0;
                        scale: 0;
                    }
                }
            `;
      document.head.appendChild(style);
    }
  }

  // Método para reiniciar el juego
  reset() {
    this.recentChallenges = [];
    this.elements.challengeText.textContent =
      "¡Haz girar la ruleta para comenzar!";
    this.elements.spinButton.querySelector(".button-text").textContent =
      "INICIAR RULETA";

    // Resetear ruleta a la posición inicial centrada
    this.centerWheel();

    console.log("🔄 Game reset");
  }

  // Método para mostrar estado de error
  showErrorState(message) {
    // Ocultar el slideshow y mostrar mensaje de error
    const slideshowContainer = document.querySelector(".slideshow-container");
    if (slideshowContainer) {
      slideshowContainer.style.display = "none";
    }

    // Deshabilitar botón de giro
    this.elements.spinButton.disabled = true;
    this.elements.spinButton.querySelector(".button-text").textContent =
      "ERROR";

    // Mostrar mensaje de error en el panel de resultado
    this.elements.challengeText.textContent = message;

    // Crear mensaje de error en el área del slideshow
    const rouletteContainer = document.querySelector(".roulette-container");
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-state";
    errorDiv.innerHTML = `
      <div class="error-icon">⚠️</div>
      <div class="error-message">${message}</div>
      <div class="error-suggestion">Por favor, recarga la página.</div>
    `;

    // Insertar el error antes del panel de control
    const controlPanel = document.querySelector(".control-panel");
    rouletteContainer.insertBefore(errorDiv, controlPanel);

    console.log(`💥 Error state displayed: ${message}`);
  }

  // Método para obtener estadísticas
  getStats() {
    return {
      recentChallenges: this.recentChallenges,
      availableChallenges: this.getValidChallenges().length,
      totalChallenges: this.challenges.length,
    };
  }
}

// Inicializar el juego cuando se cargue la página
document.addEventListener("DOMContentLoaded", () => {
  try {
    // Crear instancia global de la ruleta
    window.futureRoulette = new FutureRoulette();

    console.log("✅ Game initialized successfully");
  } catch (error) {
    console.error("💥 Failed to initialize game:", error);

    // Mostrar error en la página
    const errorContainer = document.createElement("div");
    errorContainer.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #990026;
      color: white;
      padding: 20px;
      border-radius: 10px;
      text-align: center;
      z-index: 9999;
      box-shadow: 0 0 20px rgba(153, 0, 38, 0.8);
    `;
    errorContainer.innerHTML = `
      <h3>Error al cargar el juego</h3>
      <p>${error.message}</p>
      <p><small>Por favor, recarga la página.</small></p>
    `;
    document.body.appendChild(errorContainer);
  }

  // Exponer métodos útiles en la consola para debugging
  if (window.futureRoulette) {
    window.resetGame = () => window.futureRoulette.reset();
    window.getGameStats = () => console.table(window.futureRoulette.getStats());

    // Easter egg: comando de consola para modo debug
    window.debugMode = () => {
      console.log("🎮 Debug mode activated!");
      console.log("Available commands: resetGame(), getGameStats()");
      console.table(window.futureRoulette.getStats());
    };
  }

  // Mensaje de bienvenida en consola
  console.log(`
    🚀 ================================
    🎮 FIST ROULETTE 2026 
    🚀 ================================
    
    🎯 Commands:
    - Space: Spin roulette
    - resetGame(): Reset game
    - getGameStats(): Show stats
    - debugMode(): Debug info
    
    🔥 Ready to challenge yourself!
    `);
});

// Manejo de errores globales
window.addEventListener("error", (event) => {
  console.error("❌ Global error:", event.error);
});

// Prevenir zoom en dispositivos móviles
document.addEventListener("touchstart", (event) => {
  if (event.touches.length > 1) {
    event.preventDefault();
  }
});

// Manejar cambio de orientación en móviles
window.addEventListener("orientationchange", () => {
  setTimeout(() => {
    // Recalcular tamaños si es necesario
    if (window.futureRoulette) {
      console.log("📱 Orientation changed, recalculating...");
    }
  }, 500);
});
