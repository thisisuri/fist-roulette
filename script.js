class FutureRoulette {
  constructor() {
    this.challenges = [];
    this.recentChallenges = []; // Últimos 3 desafíos para evitar repetición
    this.isSpinning = false;

    // Validar que todos los elementos necesarios existen
    this.validateDOM();

    this.elements = {
      slideTrack: document.getElementById("slideTrack"),
      slideDots: document.getElementById("slideDots"),
      spinButton: document.getElementById("spinButton"),
      challengeText: document.getElementById("challengeText"),
      particles: document.getElementById("particles"),
      currentNumber: document.getElementById("currentNumber"),
      prevButton: document.getElementById("prevButton"),
      nextButton: document.getElementById("nextButton"),
    };

    this.currentSlide = 0;

    this.init();
  }

  validateDOM() {
    const requiredElements = [
      "slideTrack",
      "slideDots",
      "spinButton",
      "challengeText",
      "particles",
      "currentNumber",
      "prevButton",
      "nextButton",
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
      this.createRoulette();
      this.setupEventListeners();
      this.createParticles();
      this.updateCounter();
      // Mostrar el texto del primer desafío
      if (this.challenges[0]) {
        this.elements.challengeText.textContent = this.challenges[0].text;
      }
      console.log("🎮 Fist Roulette 2026 initialized successfully!");
    } catch (error) {
      console.error("❌ Error initializing roulette:", error);
      this.showErrorState(error.message);
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

  createRoulette() {
    // Crear slides
    this.elements.slideTrack.innerHTML = "";
    this.elements.slideDots.innerHTML = "";

    this.challenges.forEach((challenge, index) => {
      // Crear slide solo con número
      const slide = document.createElement("div");
      slide.className = index === 0 ? "slide active" : "slide";
      slide.innerHTML = `
        <div class="slide-number">${challenge.id}</div>
      `;
      this.elements.slideTrack.appendChild(slide);

      // Crear dot
      const dot = document.createElement("div");
      dot.className = index === 0 ? "dot active" : "dot";
      dot.addEventListener("click", () => this.goToSlide(index));
      this.elements.slideDots.appendChild(dot);
    });

    this.updateSlideIndicator();
    this.updateNavigation();
    console.log(`🎯 Created slideshow with ${this.challenges.length} slides`);
  }

  setupEventListeners() {
    this.elements.spinButton.addEventListener("click", () => this.spin());
    this.elements.prevButton.addEventListener("click", () =>
      this.previousSlide()
    );
    this.elements.nextButton.addEventListener("click", () => this.nextSlide());

    // Efectos de sonido con Web Audio API (opcional)
    this.setupAudioContext();

    // Atajos de teclado
    document.addEventListener("keydown", (e) => {
      if (e.code === "Space" && !this.isSpinning) {
        e.preventDefault();
        this.spin();
      } else if (e.code === "ArrowLeft" && !this.isSpinning) {
        this.previousSlide();
      } else if (e.code === "ArrowRight" && !this.isSpinning) {
        this.nextSlide();
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

  goToSlide(index) {
    if (this.isSpinning) return;

    this.currentSlide = index;
    const translateX = -index * 100;
    this.elements.slideTrack.style.transform = `translateX(${translateX}%)`;

    // Actualizar slides activos
    document.querySelectorAll(".slide").forEach((slide, i) => {
      slide.classList.toggle("active", i === index);
    });

    // Actualizar dots
    document.querySelectorAll(".dot").forEach((dot, i) => {
      dot.classList.toggle("active", i === index);
    });

    // Mostrar el texto del desafío correspondiente al número seleccionado
    if (this.challenges[index]) {
      this.elements.challengeText.textContent = this.challenges[index].text;
    }

    this.updateSlideIndicator();
    this.updateNavigation();
    this.updateCounter();

    this.playTone(400 + index * 50, 150);
  }

  previousSlide() {
    if (this.isSpinning || this.currentSlide === 0) return;
    this.goToSlide(this.currentSlide - 1);
  }

  nextSlide() {
    if (this.isSpinning || this.currentSlide === this.challenges.length - 1)
      return;
    this.goToSlide(this.currentSlide + 1);
  }

  updateSlideIndicator() {
    const indicator = document.querySelector(".slide-indicator::after");
    const percentage = (this.currentSlide / (this.challenges.length - 1)) * 80;
    document.documentElement.style.setProperty(
      "--indicator-position",
      `${percentage}%`
    );
  }

  updateNavigation() {
    this.elements.prevButton.disabled = this.currentSlide === 0;
    this.elements.nextButton.disabled =
      this.currentSlide === this.challenges.length - 1;
  }

  updateCounter() {
    // optionCounter fue removido, ya no se actualiza

    if (this.elements.currentNumber && this.challenges[this.currentSlide]) {
      this.elements.currentNumber.textContent =
        this.challenges[this.currentSlide].id;
    }
  }

  calculateTargetSlide(targetChallenge) {
    return this.challenges.findIndex((c) => c.id === targetChallenge.id);
  }

  async spin() {
    if (this.isSpinning) return;

    this.isSpinning = true;
    this.elements.spinButton.disabled = true;
    this.elements.spinButton.querySelector(".button-text").textContent =
      "GIRANDO...";

    // Deshabilitar navegación manual
    this.elements.prevButton.disabled = true;
    this.elements.nextButton.disabled = true;

    // Efecto visual de inicio
    this.addSpinEffects();

    // Seleccionar desafío
    const selectedChallenge = this.selectRandomChallenge();
    const targetSlide = this.calculateTargetSlide(selectedChallenge);

    // Simular efecto de giro pasando por varios slides
    await this.animateSlideshow(targetSlide);

    // Finalizar
    this.completeSpinOLD(selectedChallenge);

    console.log(`🎲 Spinning to challenge: ${selectedChallenge.text}`);
  }

  async animateSlideshow(targetSlide) {
    return new Promise((resolve) => {
      // Crear animación de slides rápidos
      const steps = 15 + Math.floor(Math.random() * 10); // 15-25 pasos
      const stepDuration = 150; // ms por paso
      let currentStep = 0;

      const slideAnimation = setInterval(() => {
        // Ir a un slide aleatorio durante la animación
        const randomSlide = Math.floor(Math.random() * this.challenges.length);
        this.goToSlide(randomSlide);

        currentStep++;

        if (currentStep >= steps) {
          clearInterval(slideAnimation);
          // Ir al slide objetivo final
          setTimeout(() => {
            this.goToSlide(targetSlide);
            resolve();
          }, stepDuration);
        }
      }, stepDuration);
    });
  }

  addSpinEffects() {
    // Efecto de partículas adicionales
    this.createBurstParticles();

    // Efecto de brillo en el slideshow
    const slideshowContainer = document.querySelector(".slideshow-container");
    slideshowContainer.style.boxShadow = "0 0 50px rgba(255, 0, 64, 0.8)";
  }

  playSpinSounds() {
    // Serie de tonos durante el giro
    const tones = [600, 700, 800, 900, 1000];
    tones.forEach((frequency, index) => {
      setTimeout(() => {
        this.playTone(frequency, 200);
      }, index * 500);
    });

    // Tono de finalización
    setTimeout(() => {
      this.playTone(1200, 500);
    }, 2800);
  }

  completeSpinOLD(selectedChallenge) {
    this.isSpinning = false;
    this.elements.spinButton.disabled = false;
    this.elements.spinButton.querySelector(".button-text").textContent =
      "GIRAR NUEVA RULETA";

    // Actualizar desafío actual
    this.elements.challengeText.textContent = selectedChallenge.text;

    // Actualizar historial reciente solo para lógica anti-repetición
    this.recentChallenges.unshift(selectedChallenge);
    if (this.recentChallenges.length > 3) {
      this.recentChallenges = this.recentChallenges.slice(0, 3);
    }

    // Efectos visuales de completación
    this.addCompletionEffects();

    // Restaurar navegación
    this.updateNavigation();

    // Limpiar efectos visuales
    const slideshowContainer = document.querySelector(".slideshow-container");
    slideshowContainer.style.boxShadow = "var(--shadow-red)";

    console.log(`✅ Challenge selected: ${selectedChallenge.text}`);
  }

  addCompletionEffects() {
    // Efecto de explosión de partículas
    this.createBurstParticles(50);

    // Efecto de brillo en el resultado
    const challengePanel = document.querySelector(".current-challenge");
    challengePanel.style.boxShadow = "0 0 40px rgba(255, 0, 64, 0.8)";

    setTimeout(() => {
      challengePanel.style.boxShadow = "var(--shadow-red)";
    }, 1000);
  }

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
    this.currentSlide = 0;
    this.elements.challengeText.textContent =
      "¡Haz girar la ruleta para comenzar!";
    this.elements.spinButton.querySelector(".button-text").textContent =
      "INICIAR RULETA";

    // Resetear slideshow a la primera posición
    this.goToSlide(0);

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
