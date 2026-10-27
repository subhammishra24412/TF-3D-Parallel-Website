/* ==========================================================
   CHRONOSCAPE
   High-performance multi-layer parallax engine
   ========================================================== */

(() => {
  "use strict";

  /* ========================================================
     01. DOM CACHE
     ======================================================== */

  const body = document.body;
  const root = document.documentElement;

  const loader = document.getElementById("pageLoader");
  const progressBar = document.getElementById("progressBar");
  const navLineFill = document.getElementById("navLineFill");

  const statusIndex = document.getElementById("statusIndex");
  const statusName = document.getElementById("statusName");

  const cursorDot = document.getElementById("cursorDot");
  const cursorRing = document.getElementById("cursorRing");

  const altitudeValue = document.getElementById("altitudeValue");
  const velocityValue = document.getElementById("velocityValue");
  const depthValue = document.getElementById("depthValue");

  const portalWhiteout = document.getElementById("portalWhiteout");

  const scenes = [...document.querySelectorAll(".scene")];
  const parallaxElements = [...document.querySelectorAll("[data-speed]")];
  const revealElements = [...document.querySelectorAll(".reveal")];
  const journeyDots = [...document.querySelectorAll(".journey-dot")];

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const isTouch =
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0;

  /* ========================================================
     02. STATE
     ======================================================== */

  let scrollY = window.scrollY;
  let targetScrollY = scrollY;
  let viewportHeight = window.innerHeight;
  let documentHeight =
    document.documentElement.scrollHeight - viewportHeight;

  let mouseX = 0;
  let mouseY = 0;

  let smoothMouseX = 0;
  let smoothMouseY = 0;

  let cursorX = window.innerWidth / 2;
  let cursorY = window.innerHeight / 2;

  let ringX = cursorX;
  let ringY = cursorY;

  let ticking = true;

  /* ========================================================
     03. HELPERS
     ======================================================== */

  const clamp = (value, min, max) =>
    Math.min(Math.max(value, min), max);

  const lerp = (start, end, amount) =>
    start + (end - start) * amount;

  function getSceneProgress(scene) {
    const rect = scene.getBoundingClientRect();

    const total =
      scene.offsetHeight + viewportHeight;

    return clamp(
      (viewportHeight - rect.top) / total,
      0,
      1
    );
  }

  function getCenteredProgress(scene) {
    const rect = scene.getBoundingClientRect();

    const scrollableDistance =
      Math.max(scene.offsetHeight - viewportHeight, 1);

    return clamp(
      -rect.top / scrollableDistance,
      0,
      1
    );
  }

  /* ========================================================
     04. LOADER
     ======================================================== */

  window.addEventListener("load", () => {
    setTimeout(() => {
      loader.classList.add("loaded");
      body.classList.add("experience-ready");
    }, 500);
  });

  /* ========================================================
     05. SCROLL INPUT
     ======================================================== */

  window.addEventListener(
    "scroll",
    () => {
      targetScrollY = window.scrollY;
    },
    { passive: true }
  );

  window.addEventListener(
    "resize",
    () => {
      viewportHeight = window.innerHeight;

      documentHeight =
        document.documentElement.scrollHeight -
        viewportHeight;
    },
    { passive: true }
  );

  /* ========================================================
     06. POINTER DEPTH
     ======================================================== */

  if (!isTouch && !reducedMotion) {
    body.classList.add("cursor-active");

    window.addEventListener(
      "pointermove",
      (event) => {
        mouseX =
          (event.clientX / window.innerWidth - 0.5) * 2;

        mouseY =
          (event.clientY / window.innerHeight - 0.5) * 2;

        cursorX = event.clientX;
        cursorY = event.clientY;
      },
      { passive: true }
    );

    const interactiveElements =
      document.querySelectorAll(
        "button, a, .journey-dot"
      );

    interactiveElements.forEach((element) => {
      element.addEventListener(
        "mouseenter",
        () => body.classList.add("cursor-hover")
      );

      element.addEventListener(
        "mouseleave",
        () => body.classList.remove("cursor-hover")
      );
    });
  }

  /* ========================================================
     07. PARALLAX ENGINE
     ======================================================== */

  function updateParallax() {
    if (reducedMotion) return;

    smoothMouseX = lerp(
      smoothMouseX,
      mouseX,
      0.055
    );

    smoothMouseY = lerp(
      smoothMouseY,
      mouseY,
      0.055
    );

    parallaxElements.forEach((element) => {
      const scene = element.closest(".scene");

      if (!scene) return;

      const rect = scene.getBoundingClientRect();

      if (
        rect.bottom < -viewportHeight * 0.3 ||
        rect.top > viewportHeight * 1.3
      ) {
        return;
      }

      const progress =
        getCenteredProgress(scene);

      const centered =
        progress - 0.5;

      const speed =
        parseFloat(element.dataset.speed || 0);

      const xSpeed =
        parseFloat(element.dataset.xSpeed || 0);

      const scaleAmount =
        parseFloat(element.dataset.scale || 0);

      const rotateAmount =
        parseFloat(element.dataset.rotate || 0);

      const pointerDepth =
        parseFloat(element.dataset.pointer || 0);

      const movementBase =
        Math.min(viewportHeight, 900);

      const y =
        centered *
        speed *
        movementBase;

      const x =
        centered *
        xSpeed *
        movementBase;

      const pointerX =
        smoothMouseX *
        pointerDepth *
        14;

      const pointerY =
        smoothMouseY *
        pointerDepth *
        10;

      const scale =
        1 +
        progress *
        scaleAmount;

      const rotation =
        centered *
        rotateAmount;

      element.style.transform = `
        translate3d(
          ${x + pointerX}px,
          ${y + pointerY}px,
          0
        )
        scale(${scale})
        rotate(${rotation}deg)
      `;
    });
  }

  /* ========================================================
     08. PAGE PROGRESS
     ======================================================== */

  function updateProgress() {
    const progress =
      documentHeight > 0
        ? clamp(scrollY / documentHeight, 0, 1)
        : 0;

    progressBar.style.transform =
      `scaleX(${progress})`;

    navLineFill.style.transform =
      `scaleY(${progress})`;

    root.style.setProperty(
      "--page-progress",
      progress.toFixed(4)
    );
  }

  /* ========================================================
     09. ACTIVE SCENE
     ======================================================== */

  function updateActiveScene() {
    let activeIndex = 0;
    let smallestDistance = Infinity;

    scenes.forEach((scene, index) => {
      const rect =
        scene.getBoundingClientRect();

      const center =
        rect.top + rect.height / 2;

      const distance =
        Math.abs(
          center - viewportHeight / 2
        );

      if (distance < smallestDistance) {
        smallestDistance = distance;
        activeIndex = index;
      }
    });

    scenes.forEach((scene, index) => {
      scene.classList.toggle(
        "active-scene",
        index === activeIndex
      );
    });

    journeyDots.forEach((dot, index) => {
      dot.classList.toggle(
        "active",
        index === activeIndex
      );
    });

    const activeScene =
      scenes[activeIndex];

    statusIndex.textContent =
      String(activeIndex).padStart(2, "0");

    statusName.textContent =
      activeScene.dataset.scene || "";
  }

  /* ========================================================
     10. SCENE-SPECIFIC TELEMETRY
     ======================================================== */

  function updateTelemetry() {
    const atmosphere =
      document.getElementById("atmosphere");

    const fall =
      document.getElementById("fall");

    const abyss =
      document.getElementById("abyss");

    const altitudeProgress =
      getSceneProgress(atmosphere);

    const altitude =
      Math.max(
        0,
        Math.round(
          84000 *
          (1 - altitudeProgress)
        )
      );

    altitudeValue.textContent =
      `${altitude.toLocaleString()} KM`;

    const fallProgress =
      getSceneProgress(fall);

    const velocity =
      Math.round(
        fallProgress *
        12800
      );

    velocityValue.textContent =
      String(velocity).padStart(4, "0");

    const abyssProgress =
      getSceneProgress(abyss);

    const depth =
      Math.round(
        600 +
        abyssProgress * 8900
      );

    depthValue.textContent =
      `${depth.toLocaleString()} M`;
  }

  /* ========================================================
     11. PORTAL WHITEOUT
     ======================================================== */

  function updatePortal() {
    const portal =
      document.getElementById("portal");

    const progress =
      getCenteredProgress(portal);

    const whiteout =
      clamp(
        (progress - 0.72) / 0.28,
        0,
        1
      );

    portalWhiteout.style.opacity =
      whiteout;
  }

  /* ========================================================
     12. CUSTOM CURSOR
     ======================================================== */

  function updateCursor() {
    if (isTouch || reducedMotion) return;

    ringX = lerp(
      ringX,
      cursorX,
      0.14
    );

    ringY = lerp(
      ringY,
      cursorY,
      0.14
    );

    cursorDot.style.transform =
      `translate3d(
        ${cursorX}px,
        ${cursorY}px,
        0
      )`;

    cursorRing.style.transform =
      `translate3d(
        ${ringX}px,
        ${ringY}px,
        0
      )`;
  }

  /* ========================================================
     13. MAIN ANIMATION LOOP
     ======================================================== */

  function animate() {
    scrollY = lerp(
      scrollY,
      targetScrollY,
      reducedMotion ? 1 : 0.13
    );

    updateProgress();
    updateParallax();
    updateActiveScene();
    updateTelemetry();
    updatePortal();
    updateCursor();

    if (ticking) {
      requestAnimationFrame(animate);
    }
  }

  requestAnimationFrame(animate);

  /* ========================================================
     14. INTERSECTION OBSERVER REVEALS
     ======================================================== */

  const revealObserver =
    new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(
              "is-visible"
            );
          }
        });
      },
      {
        threshold: 0.18,
        rootMargin: "0px 0px -8% 0px"
      }
    );

  revealElements.forEach((element) => {
    revealObserver.observe(element);
  });

  /* ========================================================
     15. NAVIGATION
     ======================================================== */

  journeyDots.forEach((dot) => {
    dot.addEventListener("click", () => {
      const target =
        document.getElementById(
          dot.dataset.target
        );

      if (target) {
        target.scrollIntoView({
          behavior:
            reducedMotion
              ? "auto"
              : "smooth"
        });
      }
    });
  });

  document
    .querySelectorAll("[data-scroll-target]")
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          const target =
            document.getElementById(
              button.dataset.scrollTarget
            );

          target?.scrollIntoView({
            behavior:
              reducedMotion
                ? "auto"
                : "smooth"
          });
        }
      );
    });

  const restartButton =
    document.getElementById("restartBtn");

  restartButton.addEventListener(
    "click",
    () => {
      window.scrollTo({
        top: 0,
        behavior:
          reducedMotion
            ? "auto"
            : "smooth"
      });
    }
  );

  /* ========================================================
     16. MAGNETIC BUTTONS
     ======================================================== */

  if (!isTouch && !reducedMotion) {
    const magneticButtons =
      document.querySelectorAll(
        ".magnetic-btn"
      );

    magneticButtons.forEach((button) => {
      button.addEventListener(
        "mousemove",
        (event) => {
          const rect =
            button.getBoundingClientRect();

          const x =
            event.clientX -
            rect.left -
            rect.width / 2;

          const y =
            event.clientY -
            rect.top -
            rect.height / 2;

          button.style.transform =
            `translate3d(
              ${x * 0.12}px,
              ${y * 0.15}px,
              0
            )`;
        }
      );

      button.addEventListener(
        "mouseleave",
        () => {
          button.style.transform =
            "translate3d(0,0,0)";
        }
      );
    });
  }

  /* ========================================================
     17. SPEED LINES
     ======================================================== */

  function createSpeedLines() {
    const container =
      document.getElementById(
        "speedLines"
      );

    const count =
      window.innerWidth < 600
        ? 24
        : 55;

    const fragment =
      document.createDocumentFragment();

    for (let i = 0; i < count; i++) {
      const line =
        document.createElement("span");

      line.className =
        "speed-line";

      line.style.setProperty(
        "--x",
        `${Math.random() * 100}%`
      );

      line.style.setProperty(
        "--y",
        `${Math.random() * 100}%`
      );

      line.style.setProperty(
        "--line-height",
        `${40 + Math.random() * 150}px`
      );

      line.style.setProperty(
        "--opacity",
        `${0.1 + Math.random() * 0.5}`
      );

      line.style.setProperty(
        "--duration",
        `${0.35 + Math.random() * 0.8}s`
      );

      fragment.appendChild(line);
    }

    container.appendChild(fragment);
  }

  /* ========================================================
     18. BUBBLES
     ======================================================== */

  function createBubbles() {
    const container =
      document.getElementById(
        "bubbleField"
      );

    const count =
      window.innerWidth < 600
        ? 22
        : 48;

    const fragment =
      document.createDocumentFragment();

    for (let i = 0; i < count; i++) {
      const bubble =
        document.createElement("span");

      bubble.className = "bubble";

      const size =
        2 + Math.random() * 10;

      bubble.style.setProperty(
        "--x",
        `${Math.random() * 100}%`
      );

      bubble.style.setProperty(
        "--size",
        `${size}px`
      );

      bubble.style.setProperty(
        "--duration",
        `${6 + Math.random() * 10}s`
      );

      bubble.style.setProperty(
        "--delay",
        `${-Math.random() * 15}s`
      );

      bubble.style.setProperty(
        "--drift",
        `${-40 + Math.random() * 80}px`
      );

      fragment.appendChild(bubble);
    }

    container.appendChild(fragment);
  }

  /* ========================================================
     19. GENERIC ENERGY PARTICLES
     ======================================================== */

  function createEnergyParticles(
    containerId,
    count
  ) {
    const container =
      document.getElementById(
        containerId
      );

    if (!container) return;

    const fragment =
      document.createDocumentFragment();

    const finalCount =
      window.innerWidth < 600
        ? Math.round(count * 0.55)
        : count;

    for (
      let i = 0;
      i < finalCount;
      i++
    ) {
      const particle =
        document.createElement("span");

      particle.className =
        "energy-particle";

      particle.style.setProperty(
        "--x",
        `${Math.random() * 100}%`
      );

      particle.style.setProperty(
        "--y",
        `${Math.random() * 100}%`
      );

      particle.style.setProperty(
        "--size",
        `${1 + Math.random() * 3}px`
      );

      particle.style.setProperty(
        "--opacity",
        `${0.15 + Math.random() * 0.65}`
      );

      particle.style.setProperty(
        "--duration",
        `${2 + Math.random() * 7}s`
      );

      particle.style.setProperty(
        "--drift-x",
        `${-50 + Math.random() * 100}px`
      );

      particle.style.setProperty(
        "--drift-y",
        `${-60 + Math.random() * 120}px`
      );

      fragment.appendChild(
        particle
      );
    }

    container.appendChild(fragment);
  }

  /* ========================================================
     20. INITIALIZE PROCEDURAL EFFECTS
     ======================================================== */

  createSpeedLines();
  createBubbles();

  createEnergyParticles(
    "energyParticles",
    70
  );

  createEnergyParticles(
    "fractureParticles",
    60
  );

  createEnergyParticles(
    "portalParticles",
    90
  );

  /* ========================================================
     21. INITIAL STATE
     ======================================================== */

  targetScrollY =
    window.scrollY;

  documentHeight =
    document.documentElement.scrollHeight -
    window.innerHeight;

})();