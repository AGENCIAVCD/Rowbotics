const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
document.documentElement.classList.add("js");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const fallbackMotion = (options) => {
  const targets = typeof options.targets === "string" ? $$(options.targets) : Array.isArray(options.targets) ? options.targets.flatMap((target) => (typeof target === "string" ? $$(target) : target)) : [options.targets];
  targets.filter(Boolean).forEach((target, index) => {
    const delay = typeof options.delay === "function" ? options.delay(target, index) : options.delay || 0;
    if (target instanceof HTMLElement) {
      const fromY = Array.isArray(options.translateY) ? options.translateY[0] : null;
      const toY = Array.isArray(options.translateY) ? options.translateY[1] : null;
      const fromOpacity = Array.isArray(options.opacity) ? options.opacity[0] : null;
      const toOpacity = Array.isArray(options.opacity) ? options.opacity[1] : null;
      target.animate(
        [
          { transform: fromY !== null ? `translateY(${fromY})` : undefined, opacity: fromOpacity ?? undefined },
          { transform: toY !== null ? `translateY(${toY})` : undefined, opacity: toOpacity ?? undefined },
        ],
        { duration: options.duration || 700, delay, easing: "cubic-bezier(.16,1,.3,1)", fill: "forwards" }
      );
    }
    if (typeof options.update === "function") {
      const start = performance.now() + delay;
      const duration = options.duration || 700;
      const tick = (now) => {
        const progress = Math.min(1, Math.max(0, (now - start) / duration));
        options.animations = [{ currentValue: (options.targets.value || 0) + ((options.value || 0) - (options.targets.value || 0)) * progress }];
        options.update(options);
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  });
};
fallbackMotion.stagger = (amount) => (_, index) => index * amount;
fallbackMotion.timeline = () => ({ add(options) { fallbackMotion(options); return this; } });

const motion = (typeof anime !== "undefined" ? anime : window.anime) || fallbackMotion;

const formatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

function splitText(element) {
  const text = element.textContent.trim();
  element.textContent = "";
  text.split(" ").forEach((word, index) => {
    const outer = document.createElement("span");
    const inner = document.createElement("span");
    outer.className = "word";
    inner.textContent = word + (index === text.split(" ").length - 1 ? "" : "\u00a0");
    outer.appendChild(inner);
    element.appendChild(outer);
  });
}

$$(".split").forEach(splitText);

if (!reduceMotion) {
  motion
    .timeline({ easing: "easeOutExpo" })
    .add({
      targets: ".site-header",
      translateY: [-28, 0],
      opacity: [0, 1],
      duration: 700,
    })
    .add(
      {
      targets: ".hero .word > span",
      translateY: ["110%", "0%"],
      delay: motion.stagger(22),
      duration: 620,
      },
      "-=320"
    )
    .add(
      {
      targets: [".hero-actions .button", ".hero-console", ".hero-rail span"],
      translateY: [18, 0],
      opacity: [0, 1],
      delay: motion.stagger(52),
      duration: 520,
      },
      "-=420"
    );
} else {
  $$(".reveal, .word > span").forEach((element) => {
    element.style.opacity = "1";
    element.style.transform = "none";
  });
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      if (reduceMotion) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "none";
      } else {
        motion({
          targets: entry.target,
          opacity: [0, 1],
          translateY: [34, 0],
          duration: 780,
          easing: "easeOutCubic",
        });
      }
      if (entry.target.classList.contains("metric")) animateMetric(entry.target);
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.18 }
);

$$(".reveal").forEach((element) => revealObserver.observe(element));

function animateMetric(metric) {
  const target = metric.querySelector("[data-count]");
  if (!target || target.dataset.done) return;
  target.dataset.done = "true";
  motion({
    targets: { value: 0 },
    value: Number(target.dataset.count),
    duration: 1100,
    easing: "easeOutExpo",
    update: (anim) => {
      target.textContent = Math.round(anim.animations[0].currentValue);
    },
  });
}

const header = $(".site-header");
const progress = $(".scroll-progress");
const cinemaImage = $(".cinema-panel img");
const topAction = $(".top-action");

function updateScroll() {
  const max = document.documentElement.scrollHeight - innerHeight;
  const ratio = max > 0 ? scrollY / max : 0;
  progress.style.width = `${ratio * 100}%`;
  header.classList.toggle("is-scrolled", scrollY > innerHeight * 0.7);
  topAction?.classList.toggle("is-visible", scrollY > innerHeight * 0.85);
  if (cinemaImage) {
    const rect = cinemaImage.parentElement.getBoundingClientRect();
    const movement = Math.max(-60, Math.min(60, rect.top * -0.06));
    cinemaImage.style.setProperty("--parallax", `${movement}px`);
  }
}

window.addEventListener("scroll", updateScroll, { passive: true });
updateScroll();

topAction?.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

const flow = $(".flow");
$(".flow-prev")?.addEventListener("click", () => {
  flow?.scrollBy({ left: -300, behavior: "smooth" });
});
$(".flow-next")?.addEventListener("click", () => {
  flow?.scrollBy({ left: 300, behavior: "smooth" });
});

const glow = $(".cursor-glow");
window.addEventListener("pointermove", (event) => {
  if (reduceMotion) return;
  motion({
    targets: glow,
    left: event.clientX,
    top: event.clientY,
    duration: 600,
    easing: "easeOutQuad",
  });
});

$$(".magnetic").forEach((element) => {
  element.addEventListener("pointermove", (event) => {
    if (reduceMotion) return;
    const rect = element.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    element.style.transform = `translate(${x * 0.08}px, ${y * 0.12}px)`;
  });
  element.addEventListener("pointerleave", () => {
    element.style.transform = "";
  });
});

const hours = $("#hours");
const hoursText = $("#hoursText");
const currentCost = $("#currentCost");
const towCost = $("#towCost");
const monthlySavings = $("#monthlySavings");

function updateSavings() {
  const h = Number(hours.value || 0);
  const current = Number(currentCost.value || 0);
  const tow = Number(towCost.value || 0);
  hoursText.textContent = `${h} h/mês`;
  monthlySavings.textContent = formatter.format(Math.max(0, h * (current - tow)));
}

[hours, currentCost, towCost].forEach((input) => input.addEventListener("input", updateSavings));
updateSavings();

const testimonialData = [
  {
    quote: "Antes, cada manobra exigia coordenar mais pessoas e interromper parte da rotina. O controle fino muda a dinâmica dentro do hangar.",
    initials: "OP",
    name: "Operação de hangar",
    role: "Cenário ilustrativo · Aviação executiva",
  },
  {
    quote: "O que chama atenção é conseguir aproximar a aeronave com calma, sem ruído e com mais previsibilidade em espaços apertados.",
    initials: "MT",
    name: "Equipe de manutenção",
    role: "Cenário ilustrativo · Centro técnico",
  },
  {
    quote: "A conversa deixa de ser apenas sobre equipamento. Quando simulamos frequência e custo por hora, o ganho operacional fica muito concreto.",
    initials: "GF",
    name: "Gestão financeira",
    role: "Cenário ilustrativo · Hangar privado",
  },
  {
    quote: "Para uma operação que recebe clientes exigentes, reduzir emissão e apresentar uma solução nacional também fortalece a imagem do hangar.",
    initials: "DR",
    name: "Direção executiva",
    role: "Cenário ilustrativo · FBO",
  },
];

const testimonialStack = $(".testimonial-stack");
if (testimonialStack) {
  const testimonialCard = $(".testimonial-card.is-current");
  const testimonialDots = $(".testimonial-dots");
  let testimonialIndex = 0;
  let dragStartX = 0;
  let dragX = 0;
  let isDraggingTestimonial = false;

  testimonialData.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.className = "testimonial-dot";
    dot.type = "button";
    dot.setAttribute("role", "tab");
    dot.setAttribute("aria-label", `Exibir cenário ${index + 1}`);
    dot.addEventListener("click", () => showTestimonial(index, index > testimonialIndex ? 1 : -1));
    testimonialDots.appendChild(dot);
  });

  function renderTestimonial() {
    const item = testimonialData[testimonialIndex];
    $(".testimonial-index").textContent = `${String(testimonialIndex + 1).padStart(2, "0")} / ${String(testimonialData.length).padStart(2, "0")}`;
    $(".testimonial-card blockquote").textContent = item.quote;
    $(".testimonial-avatar").textContent = item.initials;
    $(".testimonial-profile strong").textContent = item.name;
    $(".testimonial-profile small").textContent = item.role;
    $$(".testimonial-dot").forEach((dot, index) => {
      dot.classList.toggle("is-active", index === testimonialIndex);
      dot.setAttribute("aria-selected", index === testimonialIndex ? "true" : "false");
    });
  }

  function showTestimonial(nextIndex, direction = 1) {
    if (testimonialCard.classList.contains("is-exiting")) return;
    const exit = direction * 118;
    testimonialCard.classList.add("is-exiting");
    testimonialCard.style.transform = `translateX(${exit}%) rotate(${direction * 10}deg)`;
    window.setTimeout(() => {
      testimonialIndex = (nextIndex + testimonialData.length) % testimonialData.length;
      renderTestimonial();
      testimonialCard.classList.remove("is-exiting");
      testimonialCard.style.transform = `translateX(${-direction * 16}%) rotate(${-direction * 3}deg)`;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          testimonialCard.style.transform = "";
        });
      });
    }, 280);
  }

  testimonialCard.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) return;
    isDraggingTestimonial = true;
    dragStartX = event.clientX;
    testimonialCard.classList.add("is-dragging");
    testimonialCard.setPointerCapture(event.pointerId);
  });
  testimonialCard.addEventListener("pointermove", (event) => {
    if (!isDraggingTestimonial) return;
    dragX = event.clientX - dragStartX;
    testimonialCard.style.transform = `translateX(${dragX}px) rotate(${dragX / 28}deg)`;
  });
  testimonialCard.addEventListener("pointerup", () => {
    if (!isDraggingTestimonial) return;
    isDraggingTestimonial = false;
    testimonialCard.classList.remove("is-dragging");
    if (Math.abs(dragX) > 72) {
      showTestimonial(testimonialIndex + (dragX > 0 ? -1 : 1), dragX > 0 ? 1 : -1);
    } else {
      testimonialCard.style.transform = "";
    }
    dragX = 0;
  });
  testimonialCard.addEventListener("pointercancel", () => {
    isDraggingTestimonial = false;
    dragX = 0;
    testimonialCard.classList.remove("is-dragging");
    testimonialCard.style.transform = "";
  });
  $(".testimonial-prev").addEventListener("click", () => showTestimonial(testimonialIndex - 1, -1));
  $(".testimonial-next").addEventListener("click", () => showTestimonial(testimonialIndex + 1, 1));
  renderTestimonial();
}

const typeform = $(".typeform");
if (typeform) {
  const steps = $$(".form-step");
  const nextButton = $(".step-next");
  const nextLabel = $(".step-next-label");
  const backButton = $(".step-back");
  const progressCapsule = $(".progress-capsule");
  const progressDots = $$(".form-progress-dots i");
  let currentStep = 0;

  function renderStep() {
    steps.forEach((step, index) => step.classList.toggle("is-active", index === currentStep));
    backButton.disabled = currentStep === 0;
    typeform.classList.toggle("has-history", currentStep > 0 && currentStep < steps.length - 1);
    typeform.classList.toggle("is-complete", currentStep === steps.length - 1);
    progressDots.forEach((dot, index) => dot.classList.toggle("is-reached", index <= Math.min(currentStep, progressDots.length - 1)));
    progressCapsule.style.width = `${32 + Math.min(currentStep, progressDots.length - 1) * 56}px`;
    nextLabel.textContent = currentStep >= steps.length - 2 ? "Solicitar contato comercial" : "Continuar";
    if (currentStep === steps.length - 1) {
      nextLabel.textContent = "Nova solicitação";
      backButton.disabled = true;
    }
  }

  nextButton.addEventListener("click", () => {
    if (currentStep === steps.length - 1) {
      typeform.reset();
      currentStep = 0;
    } else {
      currentStep += 1;
    }
    renderStep();
  });

  backButton.addEventListener("click", () => {
    currentStep = Math.max(0, currentStep - 1);
    renderStep();
  });

  typeform.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      nextButton.click();
    }
  });

  renderStep();
}
