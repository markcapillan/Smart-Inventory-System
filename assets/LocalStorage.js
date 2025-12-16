// Elements
const itemForm = document.getElementById('itemForm');
const inventoryTable = document.getElementById('inventoryTable');
const alertList = document.getElementById('alertList');

// Make itemsArray and transactionsArray global
window.itemsArray = JSON.parse(localStorage.getItem('inventory')) || [];
window.transactionsArray = JSON.parse(localStorage.getItem('transactions')) || [];

// Save to LocalStorage
function saveToLocalStorage() {
  localStorage.setItem('inventory', JSON.stringify(window.itemsArray));
  localStorage.setItem('transactions', JSON.stringify(window.transactionsArray));
}

// Dispatch update event for dashboard
function notifyDashboard() {
  document.dispatchEvent(new CustomEvent('inventoryUpdated', { detail: window.itemsArray }));
}

// Generate unique ID
function generateID() {
  return Date.now().toString();
}

// ===== TRANSACTION LOGGING =====
function logTransaction(item, type, change = 0) {
  const transaction = {
    id: generateID(),
    productName: item.productName,
    category: item.category,
    type: type, // 'Incoming', 'Outgoing', 'Adjustment', 'Removed'
    quantityChange: change,
    newQuantity: item.quantity,
    date: new Date().toLocaleString()
  };
  window.transactionsArray.push(transaction);
  localStorage.setItem('transactions', JSON.stringify(window.transactionsArray));
}

// ===== RENDER INVENTORY TABLE =====
function renderTable(filteredItems = null) {
  const itemsToRender = filteredItems || window.itemsArray;
  inventoryTable.innerHTML = '';
  alertList.innerHTML = '';

  if (itemsToRender.length === 0) {
    inventoryTable.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No items added</td></tr>`;
    alertList.innerHTML = `<li class="list-group-item text-muted">No alerts yet</li>`;
    updateDashboardCounts();
    notifyDashboard();
    return;
  }

  const today = new Date();
  let lowStockCount = 0, nearExpiryCount = 0, expiredCount = 0;
  let alerts = [];

  itemsToRender.forEach(item => {
    const expiryDate = new Date(item.expiryDate);
    const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    let status = '';
    let badgeClass = '';

    if (daysLeft < 0) {
      status = 'Expired';
      badgeClass = 'badge-expired';
      expiredCount++;
      if (!item.alertSentExpired) {
        alerts.push(`${item.productName} has expired!`);
        item.alertSentExpired = true;
      }
    } else if (daysLeft <= 7) {
      status = 'Near Expiry';
      badgeClass = 'badge-near-expiry';
      nearExpiryCount++;
      if (!item.alertSentExpiry) {
        alerts.push(`${item.productName} is expiring in ${daysLeft} day(s)!`);
        item.alertSentExpiry = true;
      }
    } else {
      status = 'Normal';
      badgeClass = 'badge-normal';
    }

    if (item.quantity <= item.minStock) {
      lowStockCount++;
      if (!item.alertSentLowStock) {
        alerts.push(`${item.productName} is low in stock!`);
        item.alertSentLowStock = true;
      }
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.productName}</td>
      <td>${item.category || '-'}</td>
      <td>${item.quantity}</td>
      <td>${item.expiryDate}</td>
      <td><span class="badge ${badgeClass}">${status}</span></td>
      <td class="text-center inventory-actions">
        <button class="btn btn-sm btn-warning me-1" onclick="openUpdateModal('${item.id}')">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteItem('${item.id}')">Delete</button>
      </td>
    `;
    inventoryTable.appendChild(tr);
  });

  alertList.innerHTML = alerts.length
    ? alerts.map(a => `<li class="list-group-item list-group-item-warning">${a}</li>`).join('')
    : `<li class="list-group-item text-muted">No alerts yet</li>`;

  saveToLocalStorage();
  updateDashboardCounts(window.itemsArray.length, lowStockCount, nearExpiryCount, expiredCount);
  notifyDashboard();
}

// ===== DASHBOARD COUNTS =====
function updateDashboardCounts(total = 0, low = 0, nearExpiry = 0, expired = 0) {
  document.getElementById('totalItems').textContent = total;
  document.getElementById('lowStockCount').textContent = low;
  document.getElementById('nearExpiryCount').textContent = nearExpiry;
  document.getElementById('expiredCount').textContent = expired;
}

// ===== ADD ITEM =====
itemForm.addEventListener('submit', e => {
  e.preventDefault();
  const productName = document.getElementById('productName').value.trim();
  const category = document.getElementById('category').value.trim();
  const quantity = parseInt(document.getElementById('quantity').value);
  const minStock = parseInt(document.getElementById('minStock').value);
  const expiryDate = document.getElementById('expiryDate').value;

  const newItem = {
    id: generateID(),
    productName,
    category,
    quantity,
    minStock,
    expiryDate,
    alertSentExpiry: false,
    alertSentLowStock: false,
    alertSentExpired: false
  };

  window.itemsArray.push(newItem);
  logTransaction(newItem, 'Incoming', quantity);
  saveToLocalStorage();
  renderTable();

  itemForm.reset();
  const modalEl = document.getElementById('addItemModal');
  const modal = bootstrap.Modal.getInstance(modalEl);
  modal.hide();
});

// ===== DELETE ITEM =====
function deleteItem(id) {
  const item = window.itemsArray.find(i => i.id === id);
  if (!item) return;

  if (confirm('Are you sure you want to delete this item?')) {
    logTransaction(item, 'Removed', -item.quantity);
    window.itemsArray = window.itemsArray.filter(i => i.id !== id);
    saveToLocalStorage();
    renderTable();
  }
}

// ===== UPDATE ITEM =====
function openUpdateModal(id) {
  const item = window.itemsArray.find(i => i.id === id);
  if (!item) return;

  document.getElementById('updateItemId').value = item.id;
  document.getElementById('updateProductName').value = item.productName;
  document.getElementById('updateCategory').value = item.category;
  document.getElementById('updateQuantity').value = item.quantity;
  document.getElementById('updateMinStock').value = item.minStock;
  document.getElementById('updateExpiryDate').value = item.expiryDate;

  const updateModalEl = document.getElementById('updateItemModal');
  const updateModal = new bootstrap.Modal(updateModalEl);
  updateModal.show();
}

document.getElementById('updateItemForm').addEventListener('submit', e => {
  e.preventDefault();
  const id = document.getElementById('updateItemId').value;
  const productName = document.getElementById('updateProductName').value.trim();
  const category = document.getElementById('updateCategory').value.trim();
  const quantity = parseInt(document.getElementById('updateQuantity').value);
  const minStock = parseInt(document.getElementById('updateMinStock').value);
  const expiryDate = document.getElementById('updateExpiryDate').value;

  const itemIndex = window.itemsArray.findIndex(i => i.id === id);
  if (itemIndex === -1) return;

  const oldQuantity = window.itemsArray[itemIndex].quantity;

  window.itemsArray[itemIndex] = {
    ...window.itemsArray[itemIndex],
    productName,
    category,
    quantity,
    minStock,
    expiryDate,
    alertSentExpiry: false,
    alertSentLowStock: false,
    alertSentExpired: false
  };

  logTransaction(window.itemsArray[itemIndex], 'Adjustment', quantity - oldQuantity);
  saveToLocalStorage();
  renderTable();

  const modalEl = document.getElementById('updateItemModal');
  const modal = bootstrap.Modal.getInstance(modalEl);
  modal.hide();
});

// ===== SEARCH & FILTER =====
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const clearFiltersBtn = document.getElementById('clearFilters');
let searchQuery = '';
let statusQuery = 'all';

function filterAndRenderTable() {
  let filteredItems = [...itemsArray];

  if (searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase();
    filteredItems = filteredItems.filter(item =>
      item.productName.toLowerCase().includes(q) ||
      (item.category && item.category.toLowerCase().includes(q)) ||
      getItemStatus(item).toLowerCase().includes(q)
    );
  }

  if (statusQuery !== 'all') {
    filteredItems = filteredItems.filter(item => getItemStatus(item) === statusQuery);
  }

  renderTable(filteredItems);
}

function getItemStatus(item) {
  const today = new Date();
  const expiryDate = new Date(item.expiryDate);
  const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) return 'Expired';
  if (daysLeft <= 7) return 'Near Expiry';
  if (item.quantity <= item.minStock) return 'Low Stock';
  return 'Normal';
}

searchInput.addEventListener('input', e => {
  searchQuery = e.target.value;
  filterAndRenderTable();
});

statusFilter.addEventListener('change', e => {
  statusQuery = e.target.value;
  filterAndRenderTable();
});

clearFiltersBtn.addEventListener('click', () => {
  searchQuery = '';
  statusQuery = 'all';
  searchInput.value = '';
  statusFilter.value = 'all';
  filterAndRenderTable();
});

// ===== INITIAL RENDER =====
renderTable();
