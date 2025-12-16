// Elements
const transactionTable = document.getElementById('transactionTable');
const searchInput = document.getElementById('txSearch');
const typeFilter = document.getElementById('txTypeFilter');

// Global transactions array from LocalStorage
window.transactionsArray = JSON.parse(localStorage.getItem('transactions')) || [];

// Render transaction table
function renderTransactions(filtered = null) {
  const data = filtered || window.transactionsArray;
  transactionTable.innerHTML = '';

  if (data.length === 0) {
    transactionTable.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">No transactions recorded</td></tr>`;
    updateSummaryCards();
    return;
  }

  data.forEach(tx => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${tx.date}</td>
      <td>${tx.productName}</td>
      <td>${tx.category || '-'}</td>
      <td>${tx.type}</td>
      <td>${tx.quantityChange}</td>
      <td>${tx.newQuantity}</td>
    `;
    transactionTable.appendChild(tr);
  });

  updateSummaryCards();
}

// Update summary cards
function updateSummaryCards() {
  const total = window.transactionsArray.length;
  const incoming = window.transactionsArray.filter(tx => tx.type === 'Incoming').length;
  const outgoing = window.transactionsArray.filter(tx => tx.type === 'Removed').length;
  const adjustments = window.transactionsArray.filter(tx => tx.type === 'Adjustment').length;

  document.getElementById('totalTransactions').textContent = total;
  document.getElementById('totalIncoming').textContent = incoming;
  document.getElementById('totalOutgoing').textContent = outgoing;
  document.getElementById('totalAdjustments').textContent = adjustments;
}

// Search & filter
function filterTransactions() {
  let filtered = [...window.transactionsArray];
  const searchQuery = searchInput.value.toLowerCase();
  const typeQuery = typeFilter.value;

  if (searchQuery) {
    filtered = filtered.filter(tx =>
      tx.productName.toLowerCase().includes(searchQuery) ||
      (tx.category && tx.category.toLowerCase().includes(searchQuery))
    );
  }

  if (typeQuery !== 'all') {
    filtered = filtered.filter(tx => tx.type === typeQuery);
  }

  renderTransactions(filtered);
}

searchInput.addEventListener('input', filterTransactions);
typeFilter.addEventListener('change', filterTransactions);

// Initial render
renderTransactions();
