(() => {
  const cfg = window.PROFIT_VISION || { brand: "Profit Vision" };
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll("[data-brand]").forEach((el) => {
    el.textContent = cfg.brand;
  });

  const yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* Sticky header */
  const header = document.querySelector("[data-header]");
  if (header) {
    const onScroll = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* Mobile nav — smooth panel */
  const toggle = document.querySelector("[data-nav-toggle]");
  const mobile = document.querySelector("[data-nav-mobile]");
  const backdrop = document.querySelector("[data-nav-backdrop]");
  if (toggle && mobile) {
    const setOpen = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
      mobile.classList.toggle("is-open", open);
      mobile.setAttribute("aria-hidden", String(!open));
      if (backdrop) {
        backdrop.hidden = false;
        requestAnimationFrame(() => {
          backdrop.classList.toggle("is-open", open);
        });
        if (!open) {
          const hide = () => {
            if (!backdrop.classList.contains("is-open")) backdrop.hidden = true;
          };
          backdrop.addEventListener("transitionend", hide, { once: true });
          setTimeout(hide, 500);
        }
      }
      document.body.style.overflow = open ? "hidden" : "";
    };

    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") !== "true";
      setOpen(open);
    });

    backdrop?.addEventListener("click", () => setOpen(false));

    mobile.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setOpen(false));
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth >= 960) setOpen(false);
    });
  }

  /* Smooth in-page anchors already via CSS; ensure hash focus */
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const id = link.getAttribute("href");
      if (!id || id === "#") return;
      if (id === "#privacidad" || id === "#terminos") {
        e.preventDefault();
        const dialog = document.getElementById(
          id === "#privacidad" ? "dialog-privacidad" : "dialog-terminos"
        );
        if (dialog && typeof dialog.showModal === "function") dialog.showModal();
        return;
      }
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        history.pushState(null, "", id);
      }
    });
  });

  document.querySelectorAll("[data-close-dialog]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const dialog = btn.closest("dialog");
      if (dialog) dialog.close();
    });
  });

  /* Financial learning rail */
  const rail = document.querySelector("[data-finance-rail]");
  if (rail) {
    const track = rail.querySelector("[data-rail-track]");
    const cards = [...rail.querySelectorAll("[data-rail-card]")];
    const detail = document.querySelector("[data-rail-detail]");
    const titleEl = detail?.querySelector("[data-rail-title]");
    const copyEl = detail?.querySelector("[data-rail-copy]");
    const kickerEl = detail?.querySelector("[data-rail-kicker]");

    const topics = {
      presupuesto: {
        kicker: "Hábitos · 01",
        title: "Organiza tu presupuesto",
        copy: "Aprende a entender tus ingresos, controlar tus gastos y crear mejores hábitos financieros día a día.",
      },
      ahorro: {
        kicker: "Constancia · 02",
        title: "Construye el hábito de ahorrar",
        copy: "Empieza con montos realistas y convierte el ahorro en un hábito sostenible, no en un sacrificio puntual.",
      },
      emergencia: {
        kicker: "Respaldo · 03",
        title: "Crea tu fondo de emergencia",
        copy: "Prepara un colchón para imprevistos y reduce la ansiedad financiera cuando algo no sale como esperabas.",
      },
      deudas: {
        kicker: "Orden · 04",
        title: "Ordena tus deudas con método",
        copy: "Prioriza, negocia y paga con un plan claro. Entiende costos y plazos antes de asumir nuevas obligaciones.",
      },
      invertir: {
        kicker: "Crecimiento · 05",
        title: "Invertir con bases",
        copy: "Conoce los fundamentos, las oportunidades y los riesgos antes de tomar decisiones. La mentoría te acompaña a tu ritmo.",
      },
      metas: {
        kicker: "Claridad · 06",
        title: "Define metas concretas",
        copy: "Convierte tus objetivos en pasos medibles: desde un fondo de emergencia hasta planificar tu futuro.",
      },
      mentoria: {
        kicker: "Guía · 07",
        title: "Aprende con acompañamiento",
        copy: "Una mentoría te ayuda a ordenar dudas, sostener el ritmo y aplicar lo aprendido a tu situación real.",
      },
    };

    const setActive = (card) => {
      const topic = card.getAttribute("data-topic");
      const data = topics[topic];
      if (!data) return;
      cards.forEach((c) => {
        const on = c === card;
        c.classList.toggle("is-active", on);
        c.setAttribute("aria-pressed", String(on));
      });
      if (kickerEl) kickerEl.textContent = data.kicker;
      if (titleEl) titleEl.textContent = data.title;
      if (copyEl) copyEl.textContent = data.copy;
      card.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", inline: "center", block: "nearest" });
    };

    cards.forEach((card) => {
      card.setAttribute("aria-pressed", String(card.classList.contains("is-active")));
      card.addEventListener("click", () => setActive(card));
    });

    if (track) {
      let dragging = false;
      let moved = false;
      let startX = 0;
      let startScroll = 0;
      let pointerId = null;

      const endDrag = (e) => {
        if (!dragging) return;
        dragging = false;
        track.classList.remove("is-dragging");
        if (pointerId !== null && track.hasPointerCapture?.(pointerId)) {
          try { track.releasePointerCapture(pointerId); } catch (_) {}
        }
        pointerId = null;
        if (moved && e?.type === "pointerup") {
          track.dataset.suppressClick = "1";
          setTimeout(() => delete track.dataset.suppressClick, 0);
        }
      };

      track.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;
        if (e.target.closest("[data-rail-card]") && e.pointerType === "touch") return;
        dragging = true;
        moved = false;
        startX = e.clientX;
        startScroll = track.scrollLeft;
        pointerId = e.pointerId;
        track.classList.add("is-dragging");
        track.setPointerCapture?.(e.pointerId);
      });

      track.addEventListener("pointermove", (e) => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        if (Math.abs(dx) > 4) moved = true;
        track.scrollLeft = startScroll - dx;
      });

      track.addEventListener("pointerup", endDrag);
      track.addEventListener("pointercancel", endDrag);
      track.addEventListener("pointerleave", (e) => {
        if (dragging && e.pointerType === "mouse") endDrag(e);
      });

      track.addEventListener("click", (e) => {
        if (track.dataset.suppressClick) {
          e.preventDefault();
          e.stopPropagation();
        }
      }, true);

      /* gentle entrance sway impulse */
      if (!reduceMotion) {
        cards.forEach((card, i) => {
          card.style.setProperty("--swing", `${(i % 2 ? 1 : -1) * 2.2}deg`);
          setTimeout(() => card.style.removeProperty("--swing"), 700 + i * 60);
        });
      }
    }
  }

  /* How-it-works steps */
  const stepBtns = document.querySelectorAll("[data-step-btn]");
  const previews = document.querySelectorAll("[data-preview]");
  if (stepBtns.length) {
    const activate = (n) => {
      stepBtns.forEach((btn) => {
        const active = btn.getAttribute("data-step-btn") === n;
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-pressed", String(active));
      });
      previews.forEach((panel) => {
        const match = panel.getAttribute("data-preview") === n;
        panel.hidden = !match;
        panel.classList.toggle("is-active", match);
      });
    };
    stepBtns.forEach((btn) => {
      btn.addEventListener("click", () => activate(btn.getAttribute("data-step-btn")));
    });
  }

  /* FAQ accordion */
  const accordion = document.querySelector("[data-accordion]");
  if (accordion) {
    accordion.querySelectorAll(".faq-trigger").forEach((btn) => {
      btn.addEventListener("click", () => {
        const expanded = btn.getAttribute("aria-expanded") === "true";
        const panel = document.getElementById(btn.getAttribute("aria-controls"));

        accordion.querySelectorAll(".faq-trigger").forEach((other) => {
          if (other === btn) return;
          other.setAttribute("aria-expanded", "false");
          const otherPanel = document.getElementById(other.getAttribute("aria-controls"));
          if (otherPanel) otherPanel.hidden = true;
        });

        btn.setAttribute("aria-expanded", String(!expanded));
        if (panel) panel.hidden = expanded;
      });
    });
  }

  /* Scroll reveals */
  const reveals = document.querySelectorAll(".reveal");
  if (!reduceMotion && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }

  /* Page load — header + hero rise smoothly */
  const pageRise = () => {
    document.querySelector("[data-header]")?.classList.add("is-in");
    document.querySelectorAll(".hero-rise, .hero-anim").forEach((el) => {
      el.classList.add("is-in");
    });
    document.documentElement.classList.add("page-ready");
  };

  if (reduceMotion) {
    pageRise();
  } else {
    requestAnimationFrame(() => {
      setTimeout(pageRise, 60);
    });
  }
})();
