// Elements
const totalItemsEl = document.getElementById('totalItems');
const lowStockCountEl = document.getElementById('lowStockCount');
const nearExpiryCountEl = document.getElementById('nearExpiryCount');
const expiredCountEl = document.getElementById('expiredCount');
const categoryAnalytics = document.getElementById('categoryAnalytics');
const ctxEl = document.getElementById('statusPieChart');
const ctx = ctxEl ? ctxEl.getContext('2d') : null;

let statusChart;

// Function to calculate counts
function calculateCounts(itemsArray) {
  const today = new Date();
  let total = itemsArray.length;
  let lowStock = 0;
  let nearExpiry = 0;
  let expired = 0;

  itemsArray.forEach(item => {
    const expiryDate = new Date(item.expiryDate);
    const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) expired++;
    else if (daysLeft <= 7) nearExpiry++;
    if (item.quantity <= item.minStock) lowStock++;
  });

  totalItemsEl.textContent = total;
  lowStockCountEl.textContent = lowStock;
  nearExpiryCountEl.textContent = nearExpiry;
  expiredCountEl.textContent = expired;

  return { total, lowStock, nearExpiry, expired };
}

// Function to render pie chart
function renderPieChart(counts) {
  if (!ctx) return; // Skip if canvas not found
  if (statusChart) statusChart.destroy();

  statusChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Normal', 'Low Stock', 'Near Expiry', 'Expired'],
      datasets: [{
        data: [
          counts.total - counts.lowStock - counts.nearExpiry - counts.expired,
          counts.lowStock,
          counts.nearExpiry,
          counts.expired
        ],
        backgroundColor: ['#2e7d32', '#f9a825', '#ffb300', '#c62828'],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false, // allows fixed container height
      plugins: {
        legend: {
          position: 'right',       // move legend to the right
          align: 'center',
          labels: {
            boxWidth: 20,
            padding: 15
          }
        }
      }
    }
  });
}

// Render category analytics table
function renderCategoryTable(itemsArray) {
  if (!categoryAnalytics) return;
  if (itemsArray.length === 0) {
    categoryAnalytics.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No data yet</td></tr>`;
    return;
  }

  const today = new Date();
  const categoryData = itemsArray.reduce((acc, item) => {
    const cat = item.category || '-';
    if (!acc[cat]) acc[cat] = { total: 0, lowStock: 0, nearExpiry: 0, expired: 0 };
    acc[cat].total++;
    const expiryDate = new Date(item.expiryDate);
    const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) acc[cat].expired++;
    else if (daysLeft <= 7) acc[cat].nearExpiry++;
    if (item.quantity <= item.minStock) acc[cat].lowStock++;
    return acc;
  }, {});

  categoryAnalytics.innerHTML = '';
  for (const [cat, data] of Object.entries(categoryData)) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${cat}</td>
      <td>${data.total}</td>
      <td>${data.lowStock}</td>
      <td>${data.nearExpiry}</td>
      <td>${data.expired}</td>
    `;
    categoryAnalytics.appendChild(tr);
  }
}

// Render full dashboard
function renderDashboard(itemsArray = []) {
  const counts = calculateCounts(itemsArray);
  renderPieChart(counts);
  renderCategoryTable(itemsArray);
}

// Initial render
renderDashboard(window.itemsArray);

// Listen for updates from LocalStorage.js
document.addEventListener('inventoryUpdated', e => {
  if (e.detail) renderDashboard(e.detail);
});
