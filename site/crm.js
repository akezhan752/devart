const STORAGE_KEY = "devart_kazservice_event_registrations";
const STATUSES = ["new", "confirmed", "reminder", "attended", "followup"];
const STATUS_LABELS = {
  new: "Заявка", confirmed: "Подтверждено", reminder: "Напоминание",
  attended: "Посещение", followup: "Follow-up"
};

function loadRecords() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch (_) { return []; }
}

function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function pluralize(count) {
  const n10 = count % 10;
  const n100 = count % 100;
  if (n10 === 1 && n100 !== 11) return `${count} заявка`;
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return `${count} заявки`;
  return `${count} заявок`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function render() {
  const records = loadRecords();
  document.getElementById("crm-count").textContent = `${pluralize(records.length)} в локальной базе`;
  document.querySelectorAll(".crm-column").forEach((column) => {
    const status = column.dataset.status;
    const list = column.querySelector(".crm-list");
    const cards = records.filter((record) => record.status === status);
    list.innerHTML = cards.length ? cards.map(cardHtml).join("") : '<p class="crm-empty">Пока пусто</p>';
  });
  document.querySelectorAll("[data-advance]").forEach((button) => {
    button.addEventListener("click", () => advance(button.dataset.advance));
  });
}

function cardHtml(record) {
  const index = STATUSES.indexOf(record.status);
  const isLast = index === STATUSES.length - 1;
  const next = !isLast ? STATUS_LABELS[STATUSES[index + 1]] : "";
  return `<article class="crm-card">
    <div class="cc-id">${escapeHtml(record.id)}</div>
    <div class="cc-name">${escapeHtml(record.name)}</div>
    <div class="cc-meta">${escapeHtml(record.company)} · ${escapeHtml(record.role)}</div>
    <div class="cc-email">${escapeHtml(record.email)}</div>
    <button type="button" data-advance="${escapeHtml(record.id)}" ${isLast ? "disabled" : ""}>
      ${isLast ? "Цепочка завершена" : `Далее: ${escapeHtml(next)}`}
    </button>
  </article>`;
}

function advance(id) {
  const records = loadRecords();
  const record = records.find((item) => item.id === id);
  if (!record) return;
  const current = STATUSES.indexOf(record.status);
  if (current >= 0 && current < STATUSES.length - 1) {
    record.status = STATUSES[current + 1];
    record.updatedAt = new Date().toISOString();
    saveRecords(records);
    render();
  }
}

function seed() {
  const now = new Date().toISOString();
  const demo = [
    ["DU-1001","Айгерим Сатпаева","Orion Demo","Руководитель бизнеса","aigerim@example.kz","new"],
    ["DU-1002","Дамир Ахметов","Vector Demo","ИТ / цифровизация","damir@example.kz","confirmed"],
    ["DU-1003","Марат Жумабеков","North Demo","Операционный директор","marat@example.kz","reminder"],
    ["DU-1004","Гульнара Ибраева","Steppe Demo","Продажи / развитие","gulnara@example.kz","attended"],
    ["DU-1005","Ерлан Касымов","Caspian Demo","Руководитель бизнеса","erlan@example.kz","followup"]
  ].map(([id,name,company,role,email,status]) => ({id,name,company,role,email,phone:"",status,createdAt:now}));
  const existing = loadRecords().filter((record) => !String(record.id).startsWith("DU-10"));
  saveRecords([...existing, ...demo]);
  render();
}

document.getElementById("seed-data").addEventListener("click", seed);
document.getElementById("clear-data").addEventListener("click", () => {
  if (window.confirm("Удалить все локальные тестовые записи?")) {
    localStorage.removeItem(STORAGE_KEY);
    render();
  }
});
render();
