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
    let activeCard = cards.find((c) => c.classList.contains("is-active")) || cards[0] || null;

    const setActive = (card, { scroll = false } = {}) => {
      if (!card || card === activeCard) {
        if (card && scroll) {
          card.scrollIntoView({
            behavior: reduceMotion ? "auto" : "smooth",
            inline: "center",
            block: "nearest",
          });
        }
        return;
      }
      activeCard = card;
      cards.forEach((c) => {
        const on = c === card;
        c.classList.toggle("is-active", on);
        c.setAttribute("aria-pressed", String(on));
      });
      if (scroll) {
        card.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          inline: "center",
          block: "nearest",
        });
      }
    };

    const cardFromPoint = (clientX, clientY) => {
      const el = document.elementFromPoint(clientX, clientY);
      return el?.closest?.("[data-rail-card]") || null;
    };

    cards.forEach((card) => {
      card.setAttribute("aria-pressed", String(card.classList.contains("is-active")));
      card.addEventListener("pointerenter", (e) => {
        if (e.pointerType !== "mouse") return;
        setActive(card);
      });
      card.addEventListener("focus", () => setActive(card));
      card.addEventListener("click", () => setActive(card, { scroll: true }));
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
          try {
            track.releasePointerCapture(pointerId);
          } catch (_) {}
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
        if (dragging) {
          const dx = e.clientX - startX;
          if (Math.abs(dx) > 4) moved = true;
          track.scrollLeft = startScroll - dx;
          return;
        }
        /* Brush along the rail: hover/swipe highlights the card under the pointer */
        if (e.pointerType === "mouse" || e.pointerType === "pen") {
          const hit = cardFromPoint(e.clientX, e.clientY);
          if (hit) setActive(hit);
        }
      });

      track.addEventListener("pointerup", endDrag);
      track.addEventListener("pointercancel", endDrag);
      track.addEventListener("pointerleave", (e) => {
        if (dragging && e.pointerType === "mouse") endDrag(e);
      });

      track.addEventListener(
        "click",
        (e) => {
          if (track.dataset.suppressClick) {
            e.preventDefault();
            e.stopPropagation();
          }
        },
        true
      );

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

  /* Curved testimonial rail — smooth infinite drift */
  const curveRoot = document.querySelector("[data-testimonial-curve]");
  if (curveRoot) {
    const viewport = curveRoot.querySelector("[data-curve-viewport]");
    const track = curveRoot.querySelector("[data-curve-track]");
    if (viewport && track) {
      const originals = [...track.querySelectorAll("[data-curve-card]")];
      /* Duplicate for seamless loop */
      originals.forEach((card) => track.appendChild(card.cloneNode(true)));

      let offset = 0;
      let velocity = reduceMotion ? 0 : 0.05;
      let autoSpeed = 0.05;
      let paused = false;
      let dragging = false;
      let lastX = 0;
      let lastT = 0;
      let loopWidth = 0;
      let raf = 0;
      let cards = [];

      const measure = () => {
        cards = [...track.querySelectorAll("[data-curve-card]")];
        const half = cards.length / 2;
        if (half < 1) return;
        const first = cards[0];
        const mid = cards[half];
        loopWidth = mid.offsetLeft - first.offsetLeft;
        if (offset > 0) offset = -(((-offset) % loopWidth + loopWidth) % loopWidth);
      };

      const paint = () => {
        const center = viewport.clientWidth / 2;
        let best = null;
        let bestDist = Infinity;

        cards.forEach((card) => {
          const rect = card.getBoundingClientRect();
          const viewRect = viewport.getBoundingClientRect();
          const cardCenter = rect.left + rect.width / 2 - viewRect.left;
          const norm = (cardCenter - center) / Math.max(220, center);
          const clamped = Math.max(-1.35, Math.min(1.35, norm));
          const rotateY = clamped * -42;
          const translateZ = (1 - Math.min(1, Math.abs(clamped))) * 56 - 18;
          const scale = 0.86 + (1 - Math.min(1, Math.abs(clamped))) * 0.16;
          const opacity = 0.42 + (1 - Math.min(1, Math.abs(clamped))) * 0.58;
          card.style.transform = `translate3d(0,0,${translateZ.toFixed(2)}px) rotateY(${rotateY.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
          card.style.opacity = opacity.toFixed(3);
          const dist = Math.abs(clamped);
          if (dist < bestDist) {
            bestDist = dist;
            best = card;
          }
        });

        cards.forEach((card) => card.classList.toggle("is-focus", card === best));
        track.style.transform = `translate3d(${offset.toFixed(2)}px,0,0)`;
      };

      const tick = (now) => {
        raf = requestAnimationFrame(tick);
        if (!loopWidth) measure();
        if (!loopWidth) return;

        if (!dragging && !paused && !reduceMotion) {
          const dt = lastT ? Math.min(34, now - lastT) : 16;
          offset -= autoSpeed * dt;
          velocity = autoSpeed;
        } else if (!dragging && Math.abs(velocity) > 0.002) {
          offset -= velocity * Math.min(34, now - lastT || 16);
          velocity *= 0.94;
        }

        if (loopWidth) {
          while (offset <= -loopWidth) offset += loopWidth;
          while (offset > 0) offset -= loopWidth;
        }

        lastT = now;
        paint();
      };

      measure();
      paint();
      if (!reduceMotion) raf = requestAnimationFrame(tick);
      else {
        offset = 0;
        paint();
      }

      viewport.addEventListener("pointerenter", () => {
        paused = true;
      });
      viewport.addEventListener("pointerleave", () => {
        if (!dragging) paused = false;
      });

      viewport.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;
        dragging = true;
        paused = true;
        lastX = e.clientX;
        velocity = 0;
        viewport.classList.add("is-dragging");
        viewport.setPointerCapture?.(e.pointerId);
      });

      viewport.addEventListener("pointermove", (e) => {
        if (!dragging) return;
        const dx = e.clientX - lastX;
        lastX = e.clientX;
        offset += dx;
        velocity = -dx * 0.08;
      });

      const endDrag = (e) => {
        if (!dragging) return;
        dragging = false;
        viewport.classList.remove("is-dragging");
        if (viewport.hasPointerCapture?.(e.pointerId)) {
          try {
            viewport.releasePointerCapture(e.pointerId);
          } catch (_) {}
        }
        paused = false;
      };

      viewport.addEventListener("pointerup", endDrag);
      viewport.addEventListener("pointercancel", endDrag);

      window.addEventListener("resize", () => {
        measure();
        paint();
      });
    }
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
