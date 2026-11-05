(() => {
  const cfg = window.PROFIT_VISION || {
    brand: "Profit Vision",
    formEndpoint: "",
    restrictedCategoriesUnder18: ["trading", "criptoactivos"],
    investmentRelatedCategories: [
      "mercado-de-valores",
      "trading",
      "criptoactivos",
      "bienes-raices",
      "planificacion-para-el-retiro",
    ],
  };

  document.querySelectorAll("[data-brand]").forEach((el) => {
    el.textContent = cfg.brand;
  });

  const yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* Legal dialogs on form pages */
  document.querySelectorAll('a[href="#privacidad"], a[href="#terminos"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const id = link.getAttribute("href") === "#privacidad" ? "dialog-privacidad" : "dialog-terminos";
      const dialog = document.getElementById(id);
      if (dialog && typeof dialog.showModal === "function") dialog.showModal();
    });
  });

  document.querySelectorAll("[data-close-dialog]").forEach((btn) => {
    btn.addEventListener("click", () => btn.closest("dialog")?.close());
  });

  function ageFromDob(value) {
    if (!value) return null;
    const dob = new Date(value);
    if (Number.isNaN(dob.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age -= 1;
    return age;
  }

  const sanitizers = {
    phone: (v) => v.replace(/[^\d+()\s-]/g, "").replace(/(?!^)\+/g, ""),
    digits: (v) => v.replace(/\D/g, ""),
    name: (v) => v.replace(/[^\p{L}\s'.-]/gu, "").replace(/\s{2,}/g, " "),
    text: (v) => v.replace(/[^\p{L}\s'.-]/gu, "").replace(/\s{2,}/g, " "),
    email: (v) => v.replace(/\s/g, "").toLowerCase(),
  };

  function sanitizeValue(kind, value) {
    const fn = sanitizers[kind];
    return fn ? fn(value) : value;
  }

  function bindInputGuards(root = document) {
    root.querySelectorAll("[data-sanitize]").forEach((input) => {
      const kind = input.getAttribute("data-sanitize");

      const apply = () => {
        const next = sanitizeValue(kind, input.value);
        if (next !== input.value) {
          const pos = input.selectionStart;
          input.value = next;
          if (typeof pos === "number" && input.setSelectionRange) {
            const offset = Math.max(0, pos - 1);
            try {
              input.setSelectionRange(offset, offset);
            } catch (_) {
              /* ignore for unsupported types */
            }
          }
        }
      };

      input.addEventListener("input", apply);
      input.addEventListener("blur", apply);

      if (kind === "phone" || kind === "digits") {
        input.addEventListener("keypress", (e) => {
          if (e.ctrlKey || e.metaKey || e.key.length !== 1) return;
          if (kind === "digits" && !/\d/.test(e.key)) e.preventDefault();
          if (kind === "phone" && !/[\d+()\s-]/.test(e.key)) e.preventDefault();
        });
      }

      if (kind === "name" || kind === "text") {
        input.addEventListener("keypress", (e) => {
          if (e.ctrlKey || e.metaKey || e.key.length !== 1) return;
          if (!/[\p{L}\s'.-]/u.test(e.key)) e.preventDefault();
        });
      }
    });

    root.querySelectorAll("[data-dob]").forEach((input) => {
      const today = new Date();
      const max = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate());
      const min = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
      input.max = max.toISOString().slice(0, 10);
      input.min = min.toISOString().slice(0, 10);
    });
  }

  function isValidPhone(value) {
    const digits = value.replace(/\D/g, "");
    return digits.length >= 8 && digits.length <= 15;
  }

  function isValidName(value) {
    return /^[\p{L}][\p{L}\s'.-]{1,}$/u.test(value.trim()) && !/\d/.test(value);
  }

  bindInputGuards();

  function showError(field, message) {
    field.classList.add("has-error");
    const err = field.querySelector(".field-error");
    if (err) err.textContent = message;
  }

  function clearError(field) {
    field.classList.remove("has-error");
    const err = field.querySelector(".field-error");
    if (err) err.textContent = "";
  }

  function requireFilled(root, selector, message) {
    const el = root.querySelector(selector);
    if (!el) return true;
    const field = el.closest(".field") || el.closest("fieldset") || el.parentElement;
    const value = el.type === "checkbox" ? el.checked : String(el.value || "").trim();
    if (!value) {
      if (field?.classList?.contains("field")) showError(field, message);
      else if (field) {
        const err = field.querySelector(".field-error");
        if (err) err.textContent = message;
      }
      el.focus();
      return false;
    }
    if (field?.classList?.contains("field")) clearError(field);
    return true;
  }

  function requireChoice(name, message, container) {
    const checked = container.querySelector(`input[name="${name}"]:checked`);
    const group = container.querySelector(`[data-error-for="${name}"]`);
    if (!checked) {
      if (group) group.textContent = message;
      const first = container.querySelector(`input[name="${name}"]`);
      first?.focus();
      return false;
    }
    if (group) group.textContent = "";
    return true;
  }

  function syncChoiceStyles(root) {
    root.querySelectorAll(".choice").forEach((label) => {
      const input = label.querySelector("input");
      label.classList.toggle("is-selected", Boolean(input?.checked));
    });
    root.querySelectorAll(".chip-choice").forEach((label) => {
      const input = label.querySelector("input");
      label.classList.toggle("is-selected", Boolean(input?.checked));
    });
  }

  /* ---------- User form ---------- */
  const userForm = document.getElementById("user-registration");
  if (userForm) {
    const steps = Array.from(userForm.querySelectorAll("[data-step]"));
    const progress = userForm.querySelector("[data-progress]");
    const total = steps.length;
    let current = 0;

    const riskBlock = userForm.querySelector("[data-risk-block]");
    const guardianBlock = userForm.querySelector("[data-guardian-block]");
    const restrictedNotice = userForm.querySelector("[data-restricted-notice]");
    const categoryInputs = userForm.querySelectorAll('input[name="categoria"]');
    const interestInputs = userForm.querySelectorAll('input[name="intereses"]');

    function updateProgress() {
      if (!progress) return;
      progress.innerHTML = "";
      for (let i = 0; i < total; i += 1) {
        const span = document.createElement("span");
        if (i < current) span.className = "is-done";
        if (i === current) span.className = "is-current";
        progress.appendChild(span);
      }
      const label = userForm.querySelector("[data-step-label]");
      if (label) label.textContent = `Paso ${current + 1} de ${total}`;
    }

    function showStep(index) {
      current = index;
      steps.forEach((step, i) => {
        step.hidden = i !== current;
      });
      updateProgress();
      applyAgeRules();
      applyRiskRules();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function getAge() {
      return ageFromDob(userForm.querySelector("#fecha-nacimiento")?.value);
    }

    function applyAgeRules() {
      const age = getAge();
      const under18 = age !== null && age < 18;

      if (guardianBlock) guardianBlock.hidden = !under18;
      if (restrictedNotice) restrictedNotice.hidden = !under18;

      categoryInputs.forEach((input) => {
        const restricted = cfg.restrictedCategoriesUnder18.includes(input.value);
        const wrap = input.closest(".choice") || input.closest(".chip-choice");
        if (under18 && restricted) {
          input.checked = false;
          input.disabled = true;
          if (wrap) wrap.hidden = true;
        } else {
          input.disabled = false;
          if (wrap) wrap.hidden = false;
        }
      });

      interestInputs.forEach((input) => {
        const restricted = cfg.restrictedCategoriesUnder18.includes(input.value);
        const wrap = input.closest(".chip-choice");
        if (under18 && restricted) {
          input.checked = false;
          input.disabled = true;
          if (wrap) wrap.hidden = true;
        } else {
          input.disabled = false;
          if (wrap) wrap.hidden = false;
        }
      });
    }

    function applyRiskRules() {
      if (!riskBlock) return;
      const main = userForm.querySelector('input[name="categoria"]:checked')?.value;
      const interests = Array.from(
        userForm.querySelectorAll('input[name="intereses"]:checked')
      ).map((i) => i.value);
      const related = [main, ...interests].some((v) =>
        cfg.investmentRelatedCategories.includes(v)
      );
      riskBlock.hidden = !related;
      if (!related) {
        userForm.querySelectorAll('input[name="tolerancia-riesgo"]').forEach((i) => {
          i.checked = false;
        });
      }
    }

    userForm.addEventListener("change", (e) => {
      syncChoiceStyles(userForm);
      if (e.target.id === "fecha-nacimiento") applyAgeRules();
      if (e.target.name === "categoria" || e.target.name === "intereses") applyRiskRules();
    });

    function validateStep(index) {
      const step = steps[index];
      step.querySelectorAll(".field").forEach(clearError);
      step.querySelectorAll(".field-error").forEach((el) => {
        if (!el.closest(".field")) el.textContent = "";
      });

      if (index === 0) {
        const nombre = step.querySelector("#nombre");
        if (!requireFilled(step, "#nombre", "Indica tu nombre completo.")) return false;
        if (!isValidName(nombre.value)) {
          showError(nombre.closest(".field"), "Usa solo letras en el nombre.");
          return false;
        }
        if (!requireFilled(step, "#fecha-nacimiento", "Indica tu fecha de nacimiento.")) return false;
        const age = getAge();
        if (age === null || age < 13 || age > 100) {
          showError(
            step.querySelector("#fecha-nacimiento").closest(".field"),
            "Introduce una fecha de nacimiento válida (mínimo 13 años)."
          );
          return false;
        }
        const email = step.querySelector("#email");
        if (!requireFilled(step, "#email", "Indica tu correo electrónico.")) return false;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
          showError(email.closest(".field"), "Introduce un correo válido.");
          return false;
        }
        const telefono = step.querySelector("#telefono");
        if (!requireFilled(step, "#telefono", "Indica tu teléfono.")) return false;
        if (!isValidPhone(telefono.value)) {
          showError(telefono.closest(".field"), "Introduce un teléfono válido (solo números, 8 a 15 dígitos).");
          return false;
        }
        if (!requireFilled(step, "#pais", "Indica tu país.")) return false;
        if (!requireFilled(step, "#ciudad", "Indica tu ciudad.")) return false;
        return true;
      }

      if (index === 1) {
        if (!requireChoice("ingreso", "Selecciona una opción de ingreso.", step)) return false;
        if (!requireChoice("situacion", "Selecciona tu situación financiera.", step)) return false;
        return true;
      }

      if (index === 2) {
        if (!requireChoice("experiencia", "Selecciona tu nivel de experiencia.", step)) return false;
        return true;
      }

      if (index === 3) {
        const goals = step.querySelectorAll('input[name="metas"]:checked');
        const err = step.querySelector('[data-error-for="metas"]');
        if (!goals.length) {
          if (err) err.textContent = "Selecciona al menos una meta.";
          return false;
        }
        if (err) err.textContent = "";
        return true;
      }

      if (index === 4) {
        if (!requireChoice("categoria", "Selecciona una categoría principal.", step)) return false;
        if (!requireChoice("nivel", "Selecciona tu nivel de conocimiento.", step)) return false;
        if (!requireChoice("modalidad", "Selecciona una modalidad.", step)) return false;
        if (!requireChoice("idioma", "Selecciona un idioma.", step)) return false;
        if (!requireFilled(step, "#disponibilidad", "Describe tu disponibilidad.")) return false;
        if (!requireChoice("frecuencia", "Selecciona una frecuencia.", step)) return false;
        if (!requireChoice("horizonte", "Selecciona un horizonte temporal.", step)) return false;

        const age = getAge();
        if (age !== null && age < 18) {
          const guardian = step.querySelector("#consentimiento-tutor");
          if (!guardian?.checked) {
            const err = step.querySelector('[data-error-for="consentimiento-tutor"]');
            if (err) {
              err.textContent =
                "Si eres menor de 18 años, confirma que un tutor conoce este registro. Esto no sustituye una verificación legal.";
            }
            guardian?.focus();
            return false;
          }
        }

        if (!riskBlock.hidden) {
          if (!requireChoice("tolerancia-riesgo", "Selecciona tu tolerancia al riesgo.", step)) {
            return false;
          }
        }
        return true;
      }

      if (index === 5) {
        if (!step.querySelector("#acepto-terminos")?.checked) {
          const err = step.querySelector('[data-error-for="acepto-terminos"]');
          if (err) err.textContent = "Debes aceptar los términos para continuar.";
          return false;
        }
        if (!step.querySelector("#acepto-privacidad")?.checked) {
          const err = step.querySelector('[data-error-for="acepto-privacidad"]');
          if (err) err.textContent = "Debes aceptar la política de privacidad.";
          return false;
        }
        return true;
      }

      return true;
    }

    function buildSummary() {
      const getRadio = (name) =>
        userForm.querySelector(`input[name="${name}"]:checked`)?.closest("label")?.textContent?.trim() ||
        userForm.querySelector(`input[name="${name}"]:checked`)?.value ||
        "—";
      const getChecks = (name) =>
        Array.from(userForm.querySelectorAll(`input[name="${name}"]:checked`))
          .map((i) => i.closest("label")?.textContent?.trim() || i.value)
          .join(", ") || "—";

      const box = userForm.querySelector("[data-summary]");
      if (!box) return;
      box.innerHTML = `
        <h3>Resumen de tu registro</h3>
        <dl class="summary-list">
          <div><dt>Nombre</dt><dd>${userForm.querySelector("#nombre")?.value || "—"}</dd></div>
          <div><dt>Correo</dt><dd>${userForm.querySelector("#email")?.value || "—"}</dd></div>
          <div><dt>Ciudad</dt><dd>${userForm.querySelector("#ciudad")?.value || "—"}</dd></div>
          <div><dt>Situación</dt><dd>${getRadio("situacion")}</dd></div>
          <div><dt>Experiencia</dt><dd>${getRadio("experiencia")}</dd></div>
          <div><dt>Metas</dt><dd>${getChecks("metas")}</dd></div>
          <div><dt>Categoría</dt><dd>${getRadio("categoria")}</dd></div>
          <div><dt>Modalidad</dt><dd>${getRadio("modalidad")}</dd></div>
          <div><dt>Frecuencia</dt><dd>${getRadio("frecuencia")}</dd></div>
        </dl>
      `;
    }

    userForm.querySelectorAll("[data-next]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!validateStep(current)) return;
        if (current === total - 2) buildSummary();
        if (current < total - 1) showStep(current + 1);
      });
    });

    userForm.querySelectorAll("[data-back]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (current > 0) showStep(current - 1);
      });
    });

    userForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!validateStep(current)) return;

      const payload = Object.fromEntries(new FormData(userForm).entries());
      const multi = ["metas", "intereses"];
      multi.forEach((key) => {
        payload[key] = Array.from(userForm.querySelectorAll(`input[name="${key}"]:checked`)).map(
          (i) => i.value
        );
      });

      if (cfg.formEndpoint) {
        fetch(cfg.formEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "user", ...payload }),
        }).catch(() => {});
      } else {
        console.info("[Profit Vision] Demostración local — no se enviaron datos externos.", {
          type: "user",
          keys: Object.keys(payload),
        });
      }

      userForm.querySelector("[data-form-body]").hidden = true;
      userForm.querySelector("[data-success]").hidden = false;
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    syncChoiceStyles(userForm);
    showStep(0);
  }

  /* ---------- Mentor form ---------- */
  const mentorForm = document.getElementById("mentor-registration");
  if (mentorForm) {
    const steps = Array.from(mentorForm.querySelectorAll("[data-step]"));
    const progress = mentorForm.querySelector("[data-progress]");
    const total = steps.length;
    let current = 0;

    function updateProgress() {
      if (!progress) return;
      progress.innerHTML = "";
      for (let i = 0; i < total; i += 1) {
        const span = document.createElement("span");
        if (i < current) span.className = "is-done";
        if (i === current) span.className = "is-current";
        progress.appendChild(span);
      }
      const label = mentorForm.querySelector("[data-step-label]");
      if (label) label.textContent = `Paso ${current + 1} de ${total}`;
    }

    function showStep(index) {
      current = index;
      steps.forEach((step, i) => {
        step.hidden = i !== current;
      });
      updateProgress();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    mentorForm.addEventListener("change", () => syncChoiceStyles(mentorForm));

    function validateMentor(index) {
      const step = steps[index];
      step.querySelectorAll(".field").forEach(clearError);
      step.querySelectorAll(".field-error").forEach((el) => {
        if (!el.closest(".field")) el.textContent = "";
      });

      if (index === 0) {
        const nombre = step.querySelector("#m-nombre");
        if (!requireFilled(step, "#m-nombre", "Indica tu nombre completo.")) return false;
        if (!isValidName(nombre.value)) {
          showError(nombre.closest(".field"), "Usa solo letras en el nombre.");
          return false;
        }
        const email = step.querySelector("#m-email");
        if (!requireFilled(step, "#m-email", "Indica tu correo electrónico.")) return false;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
          showError(email.closest(".field"), "Introduce un correo válido.");
          return false;
        }
        const telefono = step.querySelector("#m-telefono");
        if (!requireFilled(step, "#m-telefono", "Indica tu teléfono.")) return false;
        if (!isValidPhone(telefono.value)) {
          showError(telefono.closest(".field"), "Introduce un teléfono válido (solo números, 8 a 15 dígitos).");
          return false;
        }
        if (!requireFilled(step, "#m-pais", "Indica tu país.")) return false;
        if (!requireFilled(step, "#m-ciudad", "Indica tu ciudad.")) return false;
        return true;
      }

      if (index === 1) {
        const areas = step.querySelectorAll('input[name="expertise"]:checked');
        const err = step.querySelector('[data-error-for="expertise"]');
        if (!areas.length) {
          if (err) err.textContent = "Selecciona al menos un área de expertise.";
          return false;
        }
        if (err) err.textContent = "";
        const years = step.querySelector("#m-experiencia");
        if (!requireFilled(step, "#m-experiencia", "Indica tus años de experiencia.")) return false;
        const yearsNum = Number(years.value);
        if (!Number.isFinite(yearsNum) || yearsNum < 0 || yearsNum > 60 || String(years.value).includes(".")) {
          showError(years.closest(".field"), "Introduce un número entero entre 0 y 60.");
          return false;
        }
        if (!requireFilled(step, "#m-background", "Describe tu trayectoria profesional.")) return false;
        return true;
      }

      if (index === 2) {
        if (!requireChoice("m-modalidad", "Selecciona una modalidad.", step)) return false;
        if (!requireFilled(step, "#m-disponibilidad", "Describe tu disponibilidad.")) return false;
        const langs = step.querySelectorAll('input[name="m-idiomas"]:checked');
        const err = step.querySelector('[data-error-for="m-idiomas"]');
        if (!langs.length) {
          if (err) err.textContent = "Selecciona al menos un idioma.";
          return false;
        }
        if (err) err.textContent = "";
        if (!requireFilled(step, "#m-bio", "Escribe una biografía breve.")) return false;
        return true;
      }

      if (index === 3) {
        if (!step.querySelector("#m-contacto")?.checked) {
          const err = step.querySelector('[data-error-for="m-contacto"]');
          if (err) err.textContent = "Debes aceptar ser contactado sobre tu solicitud.";
          return false;
        }
        return true;
      }
      return true;
    }

    function buildMentorSummary() {
      const getChecks = (name) =>
        Array.from(mentorForm.querySelectorAll(`input[name="${name}"]:checked`))
          .map((i) => i.closest("label")?.textContent?.trim() || i.value)
          .join(", ") || "—";
      const box = mentorForm.querySelector("[data-summary]");
      if (!box) return;
      box.innerHTML = `
        <h3>Resumen de tu solicitud</h3>
        <dl class="summary-list">
          <div><dt>Nombre</dt><dd>${mentorForm.querySelector("#m-nombre")?.value || "—"}</dd></div>
          <div><dt>Correo</dt><dd>${mentorForm.querySelector("#m-email")?.value || "—"}</dd></div>
          <div><dt>Áreas</dt><dd>${getChecks("expertise")}</dd></div>
          <div><dt>Experiencia</dt><dd>${mentorForm.querySelector("#m-experiencia")?.value || "—"} años</dd></div>
          <div><dt>Modalidad</dt><dd>${getChecks("m-modalidad")}</dd></div>
          <div><dt>Idiomas</dt><dd>${getChecks("m-idiomas")}</dd></div>
        </dl>
        <p class="preview-note" style="margin-top:1rem">Enviar esta solicitud no implica aprobación como mentor.</p>
      `;
    }

    mentorForm.querySelectorAll("[data-next]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!validateMentor(current)) return;
        if (current === total - 2) buildMentorSummary();
        if (current < total - 1) showStep(current + 1);
      });
    });

    mentorForm.querySelectorAll("[data-back]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (current > 0) showStep(current - 1);
      });
    });

    mentorForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!validateMentor(current)) return;

      const payload = Object.fromEntries(new FormData(mentorForm).entries());
      ["expertise", "m-idiomas"].forEach((key) => {
        payload[key] = Array.from(
          mentorForm.querySelectorAll(`input[name="${key}"]:checked`)
        ).map((i) => i.value);
      });

      if (cfg.formEndpoint) {
        fetch(cfg.formEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "mentor", ...payload }),
        }).catch(() => {});
      } else {
        console.info("[Profit Vision] Demostración local — solicitud de mentor no enviada.", {
          type: "mentor",
          keys: Object.keys(payload),
        });
      }

      mentorForm.querySelector("[data-form-body]").hidden = true;
      mentorForm.querySelector("[data-success]").hidden = false;
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    syncChoiceStyles(mentorForm);
    showStep(0);
  }
})();
