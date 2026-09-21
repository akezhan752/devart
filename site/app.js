const STORAGE_KEY = "devart_kazservice_event_registrations";

// Safari blocks localStorage on file:// origins; keep the demo usable for the page session.
let memoryFallback = null;

function loadRegistrations() {
  if (memoryFallback) return memoryFallback;
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveRegistrations(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    memoryFallback = list;
  }
}

function makeRegId(list) {
  const n = list.length + 1;
  return "DU-" + String(n).padStart(4, "0");
}

function validators() {
  return {
    "f-name": (v) => v.trim().length >= 2,
    "f-company": (v) => v.trim().length >= 2,
    "f-role": (v) => v !== "",
    "f-email": (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
    "f-phone": (v) => v.trim() === "" || /^[+0-9()\s-]{6,}$/.test(v.trim()),
    "f-consent": (v) => v === true
  };
}

const errorMessages = {
  "f-name": "Укажите имя и фамилию",
  "f-company": "Укажите название компании",
  "f-role": "Выберите роль",
  "f-email": "Введите корректный email",
  "f-phone": "Введите корректный номер телефона",
  "f-consent": "Нужно согласие на обработку данных"
};

function initRegistrationForm() {
  const form = document.getElementById("reg-form");
  if (!form) return;
  const rules = validators();

  function fieldValue(el) {
    if (el.type === "checkbox") return el.checked;
    return el.value;
  }

  function showError(id, message) {
    const el = form.querySelector('.field-error[data-for="' + id + '"]');
    if (el) el.textContent = message || "";
  }

  function validateField(el) {
    const rule = rules[el.id];
    if (!rule) return true;
    el.dataset.touched = "true";
    const ok = rule(fieldValue(el));
    showError(el.id, ok ? "" : errorMessages[el.id]);
    return ok;
  }

  Array.from(form.elements).forEach((el) => {
    if (!el.id || !rules[el.id]) return;
    el.addEventListener("blur", () => validateField(el));
    el.addEventListener("input", () => {
      if (el.dataset.touched === "true") validateField(el);
    });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let allValid = true;
    Array.from(form.elements).forEach((el) => {
      if (!el.id || !rules[el.id]) return;
      if (!validateField(el)) allValid = false;
    });
    if (!allValid) {
      const firstInvalid = form.querySelector(".field-error:not(:empty)");
      if (firstInvalid) firstInvalid.closest(".form-row").querySelector("input,select").focus();
      return;
    }

    const list = loadRegistrations();
    const record = {
      id: makeRegId(list),
      name: form.elements["name"].value.trim(),
      company: form.elements["company"].value.trim(),
      role: form.elements["role"].value,
      email: form.elements["email"].value.trim(),
      phone: form.elements["phone"].value.trim(),
      status: "new",
      createdAt: new Date().toISOString()
    };
    list.push(record);
    saveRegistrations(list);

    form.hidden = true;
    const success = document.getElementById("reg-success");
    document.getElementById("reg-id-value").textContent = record.id;
    success.hidden = false;

    animatePipeline("new");
  });
}

const PIPELINE_STEPS = ["new", "confirmed", "reminder", "attended", "followup"];

function animatePipeline(fromStatus) {
  const container = document.getElementById("pipeline");
  if (!container) return;
  const steps = Array.from(container.querySelectorAll(".pipeline-step"));
  const startIndex = Math.max(0, PIPELINE_STEPS.indexOf(fromStatus));

  steps.forEach((s) => s.classList.remove("active"));

  steps.forEach((step, i) => {
    setTimeout(() => {
      const statusIndex = PIPELINE_STEPS.indexOf(step.dataset.step);
      if (statusIndex >= startIndex) step.classList.add("active");
    }, i * 420);
  });
}

function initPipelinePreview() {
  const container = document.getElementById("pipeline");
  if (!container) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animatePipeline("new");
        observer.disconnect();
      }
    });
  }, { threshold: 0.4 });
  observer.observe(container);
}

document.addEventListener("DOMContentLoaded", () => {
  initRegistrationForm();
  initPipelinePreview();
});
