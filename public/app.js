const form = document.querySelector('#recordForm');
const formMessage = document.querySelector('#formMessage');
const recordsBody = document.querySelector('#recordsBody');
const chart = document.querySelector('#chart');
const yearChart = document.querySelector('#yearChart');
const submitRecord = document.querySelector('#submitRecord');
const cancelEdit = document.querySelector('#cancelEdit');
const showMoreRecords = document.querySelector('#showMoreRecords');
const filterText = document.querySelector('#filterText');
const filterCategory = document.querySelector('#filterCategory');
const filterFrom = document.querySelector('#filterFrom');
const filterTo = document.querySelector('#filterTo');
const clearFilters = document.querySelector('#clearFilters');

const recordsPageSize = 20;
let visibleRecords = recordsPageSize;
let currentRecords = [];
let allRecords = [];
let editingRecordId = null;

const categoryLabels = {
  income: 'Ingreso',
  personal_expense: 'Gasto personal',
  general_expense: 'Gasto general',
  investment: 'Inversion',
};

const currency = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

function setToday() {
  form.elements.date.value = new Date().toISOString().slice(0, 10);
}

function formatMoney(value) {
  return currency.format(value || 0);
}

function getFilteredRecords() {
  const text = filterText.value.trim().toLowerCase();
  const category = filterCategory.value;
  const from = filterFrom.value;
  const to = filterTo.value;

  return allRecords.filter(record => {
    const matchesText = !text || [record.description, record.subcategory, record.notes]
      .some(value => String(value || '').toLowerCase().includes(text));
    const matchesCategory = !category || record.category === category;
    const matchesFrom = !from || record.date >= from;
    const matchesTo = !to || record.date <= to;

    return matchesText && matchesCategory && matchesFrom && matchesTo;
  });
}

function refreshFilteredRecords(resetPage = true) {
  if (resetPage) visibleRecords = recordsPageSize;
  renderRecords(getFilteredRecords());
}

function clearEditMode() {
  editingRecordId = null;
  submitRecord.textContent = 'Guardar movimiento';
  cancelEdit.style.display = 'none';
}

function enterEditMode(record) {
  editingRecordId = record.id;
  form.elements.date.value = record.date;
  form.elements.description.value = record.description;
  form.elements.category.value = record.category;
  form.elements.subcategory.value = record.subcategory;
  form.elements.amount.value = record.amount;
  form.elements.notes.value = record.notes;
  submitRecord.textContent = 'Actualizar movimiento';
  cancelEdit.style.display = 'block';
  formMessage.textContent = `Editando: ${record.description}`;
  formMessage.classList.remove('error');
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderStats(summary) {
  document.querySelector('#netBalance').textContent = formatMoney(summary.netBalance);
  document.querySelector('#totalIncome').textContent = formatMoney(summary.totalIncome);
  document.querySelector('#totalExpenses').textContent = formatMoney(summary.totalExpenses);
  document.querySelector('#totalInvestments').textContent = formatMoney(summary.totalInvestments);
  document.querySelector('#recordCount').textContent = summary.recordCount;
}

function renderRecords(records) {
  currentRecords = [...records].sort((a, b) => b.date.localeCompare(a.date));
  const visible = currentRecords.slice(0, visibleRecords);
  recordsBody.innerHTML = '';

  if (currentRecords.length === 0) {
    recordsBody.innerHTML = '<tr><td colspan="7">No hay movimientos para los filtros seleccionados.</td></tr>';
    showMoreRecords.style.display = 'none';
    return;
  }

  for (const record of visible) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${record.date}</td>
      <td>${record.description}</td>
      <td>${categoryLabels[record.category] ?? record.category}</td>
      <td>${record.subcategory || '-'}</td>
      <td class="amount">${formatMoney(record.amount)}</td>
      <td>${record.notes || '-'}</td>
      <td class="actions-cell">
        <button class="edit-button" type="button" data-edit-id="${record.id}">Editar</button>
        <button class="danger-button" type="button" data-delete-id="${record.id}">Eliminar</button>
      </td>
    `;
    recordsBody.append(row);
  }

  showMoreRecords.style.display = visibleRecords < currentRecords.length ? 'block' : 'none';
  showMoreRecords.textContent = `Mostrar mas (${Math.min(recordsPageSize, currentRecords.length - visibleRecords)} de ${currentRecords.length - visibleRecords})`;
}

function renderChart(months) {
  chart.innerHTML = '';

  if (months.length === 0) {
    chart.textContent = 'Carga movimientos para ver la comparacion mensual.';
    return;
  }

  const max = Math.max(...months.flatMap(item => [item.income, item.expenses, item.investments]), 1);

  for (const month of months.slice(-8)) {
    const row = document.createElement('div');
    row.className = 'bar-row';
    row.innerHTML = `
      <strong>${month.label}</strong>
      <div class="bars" title="Ingresos ${formatMoney(month.income)} | Gastos ${formatMoney(month.expenses)} | Inversion ${formatMoney(month.investments)}">
        <span class="bar income" style="width:${Math.max((month.income / max) * 100, 1)}%"></span>
        <span class="bar expense" style="width:${Math.max((month.expenses / max) * 100, 1)}%"></span>
        <span class="bar investment" style="width:${Math.max((month.investments / max) * 100, 1)}%"></span>
      </div>
    `;
    chart.append(row);
  }
}

function buildAnnualSummary(records) {
  const years = new Map();

  for (const record of records) {
    const year = record.date.slice(0, 4);
    const entry = years.get(year) ?? { year, income: 0, expenses: 0, investments: 0, net: 0 };

    if (record.category === 'income') entry.income += record.amount;
    if (record.category === 'personal_expense' || record.category === 'general_expense') entry.expenses += record.amount;
    if (record.category === 'investment') entry.investments += record.amount;

    entry.net = entry.income - entry.expenses - entry.investments;
    years.set(year, entry);
  }

  return [...years.values()].sort((a, b) => a.year.localeCompare(b.year));
}

function renderYearChart(records) {
  yearChart.innerHTML = '';
  const years = buildAnnualSummary(records);

  if (years.length === 0) {
    yearChart.textContent = 'Carga movimientos para ver el resumen anual.';
    return;
  }

  for (const item of years) {
    const totalMovement = item.income + item.expenses + item.investments || 1;
    const row = document.createElement('article');
    row.className = 'year-row';
    row.innerHTML = `
      <header>
        <strong>${item.year}</strong>
        <span>Neto: ${formatMoney(item.net)}</span>
      </header>
      <div class="year-track" title="Ingresos ${formatMoney(item.income)} | Gastos ${formatMoney(item.expenses)} | Inversion ${formatMoney(item.investments)}">
        <span class="year-segment income" style="width:${(item.income / totalMovement) * 100}%"></span>
        <span class="year-segment expense" style="width:${(item.expenses / totalMovement) * 100}%"></span>
        <span class="year-segment investment" style="width:${(item.investments / totalMovement) * 100}%"></span>
      </div>
      <div class="year-total">Ingresos ${formatMoney(item.income)} · Gastos ${formatMoney(item.expenses)} · Inversion ${formatMoney(item.investments)}</div>
    `;
    yearChart.append(row);
  }
}

function render(data) {
  allRecords = data.records;
  renderStats(data.summary);
  refreshFilteredRecords(false);
  renderChart(data.monthlyComparisons);
  renderYearChart(data.records);
}

async function loadData() {
  const response = await fetch('/api/records');
  const data = await response.json();
  render(data);
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  formMessage.textContent = 'Guardando...';
  formMessage.classList.remove('error');

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());
  const url = editingRecordId ? `/api/records/${encodeURIComponent(editingRecordId)}` : '/api/records';
  const method = editingRecordId ? 'PUT' : 'POST';

  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    formMessage.textContent = data.error ?? 'No se pudo guardar el movimiento.';
    formMessage.classList.add('error');
    return;
  }

  form.reset();
  setToday();
  visibleRecords = recordsPageSize;
  formMessage.textContent = editingRecordId ? 'Movimiento actualizado en Excel.' : 'Movimiento guardado en Excel.';
  clearEditMode();
  render(data);
});

recordsBody.addEventListener('click', async event => {
  const editButton = event.target.closest('[data-edit-id]');
  if (editButton) {
    const record = allRecords.find(item => item.id === editButton.dataset.editId);
    if (record) enterEditMode(record);
    return;
  }

  const button = event.target.closest('[data-delete-id]');
  if (!button) return;

  const description = button.closest('tr')?.children[1]?.textContent ?? 'este movimiento';
  const confirmed = confirm(`Eliminar ${description}? Esta accion tambien actualiza el Excel.`);
  if (!confirmed) return;

  const response = await fetch(`/api/records/${encodeURIComponent(button.dataset.deleteId)}`, {
    method: 'DELETE',
  });

  const data = await response.json();

  if (!response.ok) {
    formMessage.textContent = data.error ?? 'No se pudo eliminar el movimiento.';
    formMessage.classList.add('error');
    return;
  }

  formMessage.textContent = 'Movimiento eliminado del Excel.';
  formMessage.classList.remove('error');
  if (editingRecordId === button.dataset.deleteId) {
    form.reset();
    setToday();
    clearEditMode();
  }
  render(data);
});

cancelEdit.addEventListener('click', () => {
  form.reset();
  setToday();
  clearEditMode();
  formMessage.textContent = 'Edicion cancelada.';
  formMessage.classList.remove('error');
});

showMoreRecords.addEventListener('click', () => {
  visibleRecords += recordsPageSize;
  renderRecords(currentRecords);
});

[filterText, filterCategory, filterFrom, filterTo].forEach(input => {
  input.addEventListener('input', () => refreshFilteredRecords());
});

clearFilters.addEventListener('click', () => {
  filterText.value = '';
  filterCategory.value = '';
  filterFrom.value = '';
  filterTo.value = '';
  refreshFilteredRecords();
});

setToday();
clearEditMode();
loadData().catch(error => {
  formMessage.textContent = error.message;
  formMessage.classList.add('error');
});
