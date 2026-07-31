const form = document.querySelector('#recordForm');
const formMessage = document.querySelector('#formMessage');
const recordsBody = document.querySelector('#recordsBody');
const chart = document.querySelector('#chart');

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

function renderStats(summary) {
  document.querySelector('#netBalance').textContent = formatMoney(summary.netBalance);
  document.querySelector('#totalIncome').textContent = formatMoney(summary.totalIncome);
  document.querySelector('#totalExpenses').textContent = formatMoney(summary.totalExpenses);
  document.querySelector('#totalInvestments').textContent = formatMoney(summary.totalInvestments);
  document.querySelector('#recordCount').textContent = summary.recordCount;
}

function renderRecords(records) {
  recordsBody.innerHTML = '';
  const ordered = [...records].sort((a, b) => b.date.localeCompare(a.date));

  if (ordered.length === 0) {
    recordsBody.innerHTML = '<tr><td colspan="6">Todavia no hay movimientos cargados.</td></tr>';
    return;
  }

  for (const record of ordered) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${record.date}</td>
      <td>${record.description}</td>
      <td>${categoryLabels[record.category] ?? record.category}</td>
      <td>${record.subcategory || '-'}</td>
      <td class="amount">${formatMoney(record.amount)}</td>
      <td>${record.notes || '-'}</td>
    `;
    recordsBody.append(row);
  }
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

function render(data) {
  renderStats(data.summary);
  renderRecords(data.records);
  renderChart(data.monthlyComparisons);
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

  const response = await fetch('/api/records', {
    method: 'POST',
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
  formMessage.textContent = 'Movimiento guardado en Excel.';
  render(data);
});

setToday();
loadData().catch(error => {
  formMessage.textContent = error.message;
  formMessage.classList.add('error');
});
