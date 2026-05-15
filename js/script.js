const stickyHeader = document.querySelector("[data-sticky-header]");
const heroSection = document.querySelector(".hero");
const navToggle = document.querySelector(".nav-toggle");
const mainNav = document.querySelector(".main-nav");
const accordionItems = document.querySelectorAll("[data-accordion] details");

// Mobile navigation toggle keeps the menu usable without external dependencies.
if (navToggle && mainNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
    document.body.classList.toggle("nav-open", isOpen);
  });

  mainNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mainNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("nav-open");
    });
  });
}


// Keep accordion behavior tidy by allowing one answer open at a time.
accordionItems.forEach((item) => {
  item.addEventListener("toggle", () => {
    if (!item.open) return;
    accordionItems.forEach((other) => {
      if (other !== item) other.open = false;
    });
  });
});

// Sticky header appears only after the hero section is passed and hides again while scrolling upward.
if (stickyHeader && heroSection) {
  let latestScroll = window.scrollY;
  let lastScroll = window.scrollY;
  let ticking = false;

  const updateStickyHeader = () => {
    const heroBottom = heroSection.offsetTop + heroSection.offsetHeight - 120;
    const scrollingDown = latestScroll > lastScroll;
    const shouldShow = latestScroll > heroBottom && scrollingDown;
    const closeToTop = latestScroll < heroSection.offsetHeight * 0.5;

    stickyHeader.classList.toggle("is-visible", shouldShow && !closeToTop);
    stickyHeader.setAttribute("aria-hidden", String(!(shouldShow && !closeToTop)));
    lastScroll = latestScroll;
    ticking = false;
  };

  const onScroll = () => {
    latestScroll = window.scrollY;
    if (!ticking) {
      window.requestAnimationFrame(updateStickyHeader);
      ticking = true;
    }
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  updateStickyHeader();
}

// Desktop wheel scrolling is lightly eased for a smoother premium feel.
const canSmoothWheel =
  window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (canSmoothWheel) {
  let wheelTargetY = window.scrollY;
  let wheelCurrentY = window.scrollY;
  let wheelFrame = null;

  const easeWheelScroll = () => {
    wheelCurrentY += (wheelTargetY - wheelCurrentY) * 0.12;

    if (Math.abs(wheelTargetY - wheelCurrentY) < 0.4) {
      wheelCurrentY = wheelTargetY;
      window.scrollTo(0, wheelCurrentY);
      wheelFrame = null;
      return;
    }

    window.scrollTo(0, wheelCurrentY);
    wheelFrame = window.requestAnimationFrame(easeWheelScroll);
  };

  window.addEventListener("wheel", (event) => {
    const interactiveTarget = event.target.closest("input, textarea, select, .process-pills, .applications-track, .testimonial-track");
    if (interactiveTarget) return;

    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    wheelTargetY = Math.max(0, Math.min(maxScroll, wheelTargetY + event.deltaY));
    event.preventDefault();

    if (!wheelFrame) {
      wheelFrame = window.requestAnimationFrame(easeWheelScroll);
    }
  }, { passive: false });
}

// Main hero carousel with keyboard, touch, and indicator support.
const carousel = document.querySelector(".hero-carousel");
const carouselTrack = carousel?.querySelector("[data-carousel-track]");
const slides = carousel ? Array.from(carousel.querySelectorAll("[data-carousel-slide]")) : [];
const indicators = carousel ? Array.from(document.querySelectorAll("[data-carousel-indicator]")) : [];
const prevButton = carousel?.querySelector("[data-carousel-prev]");
const nextButton = carousel?.querySelector("[data-carousel-next]");

if (carousel && carouselTrack && slides.length) {
  let activeIndex = 0;
  let startX = 0;
  let pointerMoveX = 0;
  let isPointerDown = false;
  let carouselFrame = null;
  const zoomPreview = document.querySelector("[data-zoom-preview]");
  const zoomPreviewImage = document.querySelector("[data-zoom-preview-image]");
  const canHoverZoom = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  let zoomFrameId = null;

  const updateCarousel = (index, animate = true) => {
    activeIndex = (index + slides.length) % slides.length;

    if (carouselFrame) {
      window.cancelAnimationFrame(carouselFrame);
    }

    carouselFrame = window.requestAnimationFrame(() => {
      carouselTrack.style.transition = animate ? "transform 760ms cubic-bezier(0.22, 1, 0.36, 1)" : "none";
      carouselTrack.style.transform = `translateX(-${activeIndex * 100}%)`;
      if (!animate) {
        void carouselTrack.offsetHeight;
        carouselTrack.style.transition = "";
      }
    });

    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-active", slideIndex === activeIndex);
    });

    indicators.forEach((indicator, indicatorIndex) => {
      const isActive = indicatorIndex === activeIndex;
      indicator.classList.toggle("is-active", isActive);
      indicator.setAttribute("aria-selected", String(isActive));
    });

    if (zoomPreview) {
      zoomPreview.classList.remove("is-visible");
      zoomPreview.setAttribute("aria-hidden", "true");
    }

    slides.forEach((slide) => {
      slide.querySelector("[data-zoom-frame]")?.classList.remove("is-zooming");
    });
  };

  const goNext = () => updateCarousel(activeIndex + 1);
  const goPrev = () => updateCarousel(activeIndex - 1);

  prevButton?.addEventListener("click", goPrev);
  nextButton?.addEventListener("click", goNext);

  indicators.forEach((indicator) => {
    indicator.addEventListener("click", () => {
      updateCarousel(Number(indicator.dataset.carouselIndicator));
    });
  });

  carousel.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goNext();
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goPrev();
    }
  });

  carousel.addEventListener("pointerdown", (event) => {
    isPointerDown = true;
    startX = event.clientX;
    pointerMoveX = event.clientX;
    carousel.setPointerCapture(event.pointerId);
  });

  carousel.addEventListener("pointermove", (event) => {
    if (!isPointerDown) return;
    pointerMoveX = event.clientX;
  });

  carousel.addEventListener("pointerup", (event) => {
    if (!isPointerDown) return;
    const delta = (pointerMoveX || event.clientX) - startX;
    if (delta > 50) goPrev();
    if (delta < -50) goNext();
    isPointerDown = false;
    carousel.releasePointerCapture(event.pointerId);
  });

  carousel.addEventListener("pointercancel", () => {
    isPointerDown = false;
  });

  if (canHoverZoom && zoomPreview && zoomPreviewImage) {
    const zoomScale = 2.2;
    const lensSize = 144;

    const hideZoom = (frame) => {
      frame.classList.remove("is-zooming");
      zoomPreview.classList.remove("is-visible");
      zoomPreview.setAttribute("aria-hidden", "true");
      if (zoomFrameId) {
        window.cancelAnimationFrame(zoomFrameId);
        zoomFrameId = null;
      }
    };

    slides.forEach((slide) => {
      const frame = slide.querySelector("[data-zoom-frame]");
      const image = slide.querySelector("[data-zoomable]");
      const lens = slide.querySelector("[data-zoom-lens]");
      if (!frame || !image || !lens) return;

      const renderZoom = (clientX, clientY) => {
        const bounds = frame.getBoundingClientRect();
        const x = clientX - bounds.left;
        const y = clientY - bounds.top;
        const halfLens = lensSize / 2;
        const clampedX = Math.max(halfLens, Math.min(bounds.width - halfLens, x));
        const clampedY = Math.max(halfLens, Math.min(bounds.height - halfLens, y));
        const xPercent = clampedX / bounds.width;
        const yPercent = clampedY / bounds.height;

        lens.style.left = `${clampedX}px`;
        lens.style.top = `${clampedY}px`;

        zoomPreviewImage.style.backgroundImage = `url("${image.currentSrc || image.src}")`;
        zoomPreviewImage.style.backgroundPosition = `${xPercent * 100}% ${yPercent * 100}%`;
        zoomPreviewImage.style.backgroundSize = `${zoomScale * 100}%`;
      };

      frame.addEventListener("mousemove", (event) => {
        if (!slide.classList.contains("is-active")) return;
        frame.classList.add("is-zooming");
        zoomPreview.classList.add("is-visible");
        zoomPreview.setAttribute("aria-hidden", "false");

        if (zoomFrameId) window.cancelAnimationFrame(zoomFrameId);
        zoomFrameId = window.requestAnimationFrame(() => {
          renderZoom(event.clientX, event.clientY);
        });
      });

      frame.addEventListener("mouseenter", (event) => {
        if (!slide.classList.contains("is-active")) return;
        frame.classList.add("is-zooming");
        zoomPreview.classList.add("is-visible");
        zoomPreview.setAttribute("aria-hidden", "false");
        renderZoom(event.clientX, event.clientY);
      });

      frame.addEventListener("mouseleave", () => {
        hideZoom(frame);
      });
    });
  }

  updateCarousel(0, false);
}

// Applications carousel supports arrows, drag, wheel, and touch with premium momentum.
const applicationsCarousel = document.querySelector("[data-applications-carousel]");

if (applicationsCarousel) {
  const applicationsViewport = applicationsCarousel.querySelector("[data-applications-viewport]");
  const applicationsTrack = applicationsCarousel.querySelector("[data-applications-track]");
  const applicationsPrev = document.querySelector("[data-applications-prev]");
  const applicationsNext = document.querySelector("[data-applications-next]");
  let startX = 0;
  let startScrollLeft = 0;
  let lastPointerX = 0;
  let velocityX = 0;
  let momentumFrame = null;
  let isPointerDown = false;
  const stopMomentum = () => {
    if (momentumFrame) {
      window.cancelAnimationFrame(momentumFrame);
      momentumFrame = null;
    }
  };

  const getApplicationStep = () => {
    const card = applicationsTrack.querySelector(".application-card");
    if (!card) return applicationsViewport.clientWidth * 0.88;
    const styles = window.getComputedStyle(applicationsTrack);
    const gap = parseFloat(styles.columnGap || styles.gap || "24");
    return card.getBoundingClientRect().width + gap;
  };

  const animateMomentum = () => {
    applicationsTrack.scrollLeft += velocityX;
    velocityX *= 0.94;

    if (Math.abs(velocityX) < 0.4) {
      momentumFrame = null;
      return;
    }

    momentumFrame = window.requestAnimationFrame(animateMomentum);
  };

  const moveApplications = (direction) => {
    stopMomentum();
    applicationsTrack.scrollBy({
      left: getApplicationStep() * direction,
      behavior: "smooth"
    });
  };

  applicationsPrev?.addEventListener("click", () => moveApplications(-1));
  applicationsNext?.addEventListener("click", () => moveApplications(1));

  applicationsViewport.addEventListener("pointerdown", (event) => {
    isPointerDown = true;
    startX = event.clientX;
    lastPointerX = event.clientX;
    startScrollLeft = applicationsTrack.scrollLeft;
    velocityX = 0;
    applicationsViewport.classList.add("is-dragging");
    stopMomentum();
    applicationsViewport.setPointerCapture(event.pointerId);
  });

  applicationsViewport.addEventListener("pointermove", (event) => {
    if (!isPointerDown) return;
    const delta = event.clientX - startX;
    const stepDelta = event.clientX - lastPointerX;
    applicationsTrack.scrollLeft = startScrollLeft - delta;
    velocityX = -stepDelta * 0.85;
    lastPointerX = event.clientX;
  });

  applicationsViewport.addEventListener("pointerup", (event) => {
    if (!isPointerDown) return;
    isPointerDown = false;
    applicationsViewport.classList.remove("is-dragging");
    applicationsViewport.releasePointerCapture(event.pointerId);
    momentumFrame = window.requestAnimationFrame(animateMomentum);
  });

  applicationsViewport.addEventListener("pointercancel", () => {
    isPointerDown = false;
    applicationsViewport.classList.remove("is-dragging");
  });
}

// Testimonials drag-scroll horizontally with eased momentum and duplicated cards for desktop overflow.
const testimonialTrack = document.querySelector(
  "[data-testimonial-track]"
);

if (testimonialTrack) {

  const cards = Array.from(testimonialTrack.children);

  // KEEP ADDING CARDS UNTIL TRACK IS WIDE ENOUGH
  while (
    testimonialTrack.scrollWidth <
    window.innerWidth * 3
  ) {
    cards.forEach((card) => {
      testimonialTrack.appendChild(
        card.cloneNode(true)
      );
    });
  }
}

// Process section tabs and slider stay in sync with the active manufacturing stage.
const processSection = document.querySelector("[data-process]");

if (processSection) {
  const processTabs = Array.from(processSection.querySelectorAll("[data-process-tab]"));
  const processTitle = processSection.querySelector("[data-process-title]");
  const processDescription = processSection.querySelector("[data-process-description]");
  const processBullets = processSection.querySelector("[data-process-bullets]");
  const processImageTrack = processSection.querySelector("[data-process-image-track]");
  const processPanels = Array.from(processSection.querySelectorAll("[data-process-panel]"));
  const processPrev = processSection.querySelector("[data-process-prev]");
  const processNext = processSection.querySelector("[data-process-next]");
  const processDots = processSection.querySelector("[data-process-dots]");

  const processStages = [
    {
      tab: "Raw Material",
      title: "High-Grade Raw Material Selection",
      description: "Vacuum sizing tanks ensure precise outer diameter while internal pressure maintains perfect roundness and wall thickness uniformity.",
      bullets: [
        "PE100 grade material",
        "Optimal molecular weight distribution"
      ],
      images: [
        { src: "assets/images/hero-main.jpg", alt: "Raw material preparation for HDPE pipe manufacturing", position: "center center" },
        { src: "assets/images/card-1.jpg", alt: "Raw material handling illustration 1", position: "center 18%" },
        { src: "assets/images/card-2.jpg", alt: "Raw material handling illustration 2", position: "center 14%" }
      ]
    },
    {
      tab: "Extrusion",
      title: "Precision Extrusion Control",
      description: "The heated compound is pushed through precision tooling under monitored pressure to create stable wall thickness and consistent pipe geometry.",
      bullets: [
        "Uniform melt flow consistency",
        "Controlled die pressure monitoring"
      ],
      images: [
        { src: "assets/images/card-1.jpg", alt: "Extrusion stage in operation view one", position: "center 28%" },
        { src: "assets/images/hero-main.jpg", alt: "Extrusion stage in operation view two", position: "65% center" },
        { src: "assets/images/card-3.jpg", alt: "Extrusion stage in operation view three", position: "center 8%" }
      ]
    },
    {
      tab: "Cooling",
      title: "Controlled Cooling & Stabilization",
      description: "Progressive cooling zones lock in the pipe profile while protecting the material structure from distortion during high-output production runs.",
      bullets: [
        "Even thermal dissipation",
        "Reduced surface deformation risk"
      ],
      images: [
        { src: "assets/images/card-2.jpg", alt: "Cooling line view one", position: "center 17%" },
        { src: "assets/images/hero-main.jpg", alt: "Cooling line view two", position: "78% center" },
        { src: "assets/images/card-1.jpg", alt: "Cooling line view three", position: "center 22%" }
      ]
    },
    {
      tab: "Sizing",
      title: "Accurate Vacuum Sizing",
      description: "Dedicated sizing calibration ensures roundness, dimensional repeatability, and smooth outer surfaces before the line advances downstream.",
      bullets: [
        "Precision diameter calibration",
        "Smooth surface consistency"
      ],
      images: [
        { src: "assets/images/card-3.jpg", alt: "Sizing stage view one", position: "center 10%" },
        { src: "assets/images/hero-main.jpg", alt: "Sizing stage view two", position: "20% center" },
        { src: "assets/images/card-2.jpg", alt: "Sizing stage view three", position: "center 20%" }
      ]
    },
    {
      tab: "Quality Control",
      title: "In-Line Quality Control Checks",
      description: "Every run is checked for dimensional accuracy, surface finish, and process stability to maintain the premium standards required for infrastructure work.",
      bullets: [
        "Continuous dimensional inspection",
        "Verified production tolerances"
      ],
      images: [
        { src: "assets/images/hero-main.jpg", alt: "Quality control view one", position: "40% center" },
        { src: "assets/images/card-2.jpg", alt: "Quality control view two", position: "center 12%" },
        { src: "assets/images/card-3.jpg", alt: "Quality control view three", position: "center 16%" }
      ]
    },
    {
      tab: "Marking",
      title: "Clear Product Identification Marking",
      description: "Traceable print marking is applied with batch and specification details so every pipe can be quickly identified during storage and installation.",
      bullets: [
        "Durable line identification",
        "Batch traceability support"
      ],
      images: [
        { src: "assets/images/card-1.jpg", alt: "Marking stage view one", position: "center 26%" },
        { src: "assets/images/hero-main.jpg", alt: "Marking stage view two", position: "55% center" },
        { src: "assets/images/card-3.jpg", alt: "Marking stage view three", position: "center 12%" }
      ]
    },
    {
      tab: "Cutting",
      title: "Measured Cutting & Length Control",
      description: "Automated cutting systems finish the pipe to accurate project-ready lengths while preserving clean edges and minimizing handling variation.",
      bullets: [
        "Consistent cut-length precision",
        "Clean finishing on every run"
      ],
      images: [
        { src: "assets/images/card-2.jpg", alt: "Cutting stage view one", position: "center 18%" },
        { src: "assets/images/hero-main.jpg", alt: "Cutting stage view two", position: "72% center" },
        { src: "assets/images/card-1.jpg", alt: "Cutting stage view three", position: "center 20%" }
      ]
    },
    {
      tab: "Packaging",
      title: "Secure Final Packaging Preparation",
      description: "Completed pipes are organized, wrapped, and prepared for dispatch to preserve finish quality and simplify on-site delivery handling.",
      bullets: [
        "Protected transport-ready bundles",
        "Efficient dispatch organization"
      ],
      images: [
        { src: "assets/images/card-3.jpg", alt: "Packaging stage view one", position: "center 10%" },
        { src: "assets/images/hero-main.jpg", alt: "Packaging stage view two", position: "88% center" },
        { src: "assets/images/card-2.jpg", alt: "Packaging stage view three", position: "center 14%" }
      ]
    }
  ];

  let activeProcessIndex = 0;
  let activeProcessImageIndex = 0;
  let processAutoPlayId = null;

  const stopProcessAutoPlay = () => {
    if (processAutoPlayId) {
      window.clearInterval(processAutoPlayId);
      processAutoPlayId = null;
    }
  };

  const buildProcessTrack = (images) => {
    processImageTrack.innerHTML = images.map((image) => (
      `<img src="${image.src}" alt="${image.alt}" loading="lazy" style="object-position:${image.position};">`
    )).join("");
  };

  const renderProcessDots = (count) => {
    if (!processDots) return;
    processDots.innerHTML = Array.from({ length: count }, (_, index) => (
      `<button class="process-dot${index === activeProcessImageIndex ? " is-active" : ""}" type="button" data-process-dot="${index}" aria-label="Show process image ${index + 1}"></button>`
    )).join("");

    processDots.querySelectorAll("[data-process-dot]").forEach((dot) => {
      dot.addEventListener("click", () => {
        renderProcessImage(Number(dot.dataset.processDot));
        startProcessAutoPlay();
      });
    });
  };

  const renderProcessImage = (imageIndex) => {
    const currentStage = processStages[activeProcessIndex];
    const images = currentStage.images;
    activeProcessImageIndex = (imageIndex + images.length) % images.length;

    processImageTrack.style.transform = `translateX(-${activeProcessImageIndex * 100}%)`;
    processDots?.querySelectorAll("[data-process-dot]").forEach((dot, index) => {
      dot.classList.toggle("is-active", index === activeProcessImageIndex);
    });
  };

  const startProcessAutoPlay = () => {
    stopProcessAutoPlay();
    processAutoPlayId = window.setInterval(() => {
      renderProcessImage(activeProcessImageIndex + 1);
    }, 4500);
  };

  const renderProcessStage = (index, animate = true) => {
    activeProcessIndex = (index + processStages.length) % processStages.length;
    const stage = processStages[activeProcessIndex];

    const updateStage = () => {
      processTitle.textContent = stage.title;
      processDescription.textContent = stage.description;
      processBullets.innerHTML = stage.bullets.map((bullet) => `<li>${bullet}</li>`).join("");
      activeProcessImageIndex = 0;
      buildProcessTrack(stage.images);
      renderProcessDots(stage.images.length);
      renderProcessImage(0);

      processTabs.forEach((tab, tabIndex) => {
        const isActive = tabIndex === activeProcessIndex;
        tab.classList.toggle("is-active", isActive);
        tab.setAttribute("aria-selected", String(isActive));
      });

      processPanels.forEach((panel) => panel.classList.remove("is-switching"));
    };

    if (!animate) {
      updateStage();
      return;
    }

    processPanels.forEach((panel) => panel.classList.add("is-switching"));
    window.setTimeout(updateStage, 160);
  };

  processTabs.forEach((tab, index) => {
    tab.addEventListener("click", () => {
      renderProcessStage(index);
      startProcessAutoPlay();
    });
  });

  processPrev?.addEventListener("click", () => {
    renderProcessImage(activeProcessImageIndex - 1);
    startProcessAutoPlay();
  });

  processNext?.addEventListener("click", () => {
    renderProcessImage(activeProcessImageIndex + 1);
    startProcessAutoPlay();
  });

  processSection.querySelector(".process-media")?.addEventListener("mouseenter", stopProcessAutoPlay);
  processSection.querySelector(".process-media")?.addEventListener("mouseleave", startProcessAutoPlay);

  renderProcessStage(0, false);
  startProcessAutoPlay();
}

// Prevent demo forms from reloading the page while keeping the markup production-ready.
document.querySelectorAll("form").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
  });
});
