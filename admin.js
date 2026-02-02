/* ======================================
   ZYPSO MART – FIXED admin.js
   ====================================== */

import { db } from './firebase.js';

import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

/* ======================================
   GLOBAL STATE
   ====================================== */
let allProducts = [];
let allOrders = [];

let productsUnsub = null;
let ordersUnsub = null;

/* ======================================
   INIT
   ====================================== */
window.initAdmin = async () => {
  await initShopSettings();
  initProducts();
  initOrders();
};

/* ======================================
   SHOP SETTINGS (SAFE DEFAULT)
   ====================================== */
async function initShopSettings() {
  const ref = doc(db, 'shopControl', 'status');
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      isClosed: false,
      baseCharge: 20,
      chargePerKm: 10,
      freeDeliveryAbove: 500,
      minOrderAmount: 0,
      supportNumber: "8090315246",
      shopLocation: { lat: 0, lng: 0 }
    });
  }
}

/* ======================================
   PRODUCTS – REALTIME SAFE
   ====================================== */
function initProducts() {
  if (productsUnsub) {
    productsUnsub();
    productsUnsub = null;
  }

  const q = query(
    collection(db, 'products'),
    orderBy('createdAt', 'desc')
  );

  productsUnsub = onSnapshot(q, snap => {
    allProducts = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));
    renderProducts();
  });
}

/* ======================================
   ORDERS – REALTIME SAFE
   ====================================== */
function initOrders() {
  if (ordersUnsub) {
    ordersUnsub();
    ordersUnsub = null;
  }

  const q = query(
    collection(db, 'orders'),
    orderBy('createdAt', 'desc')
  );

  ordersUnsub = onSnapshot(q, snap => {
    allOrders = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));
    renderOrders();
    updateStats();
  });
}

/* ======================================
   ADD PRODUCT (CRITICAL FIX)
   ====================================== */
window.addProduct = async () => {
  const name = document.getElementById('p-name').value.trim();
  const price = Number(document.getElementById('p-price').value);
  const unit = document.getElementById('p-unit').value;
  const img = document.getElementById('p-img').value.trim();
  const desc = document.getElementById('p-desc').value.trim();
  const category = document.getElementById('p-category').value;
  const stock = Number(document.getElementById('p-stock').value);
  const featured = document.getElementById('p-featured').checked;

  if (!name || !price || !category) {
    alert('Please fill required fields');
    return;
  }

  const status =
    stock > 0 ? 'Available' : 'Out of Stock';

  await addDoc(collection(db, 'products'), {
    name,
    price,
    unit,
    imageUrl: img,
    description: desc,
    category,
    stock,
    featured: !!featured,
    status,
    createdAt: serverTimestamp()
  });

  clearProductForm();
};

/* ======================================
   UPDATE PRODUCT FIELDS
   ====================================== */
window.updateStockCount = async (id, value) => {
  const count = Number(value) || 0;

  await updateDoc(doc(db, 'products', id), {
    stock: count,
    status: count > 0 ? 'Available' : 'Out of Stock',
    updatedAt: serverTimestamp()
  });
};

window.updatePrice = async (id, value) => {
  await updateDoc(doc(db, 'products', id), {
    price: Number(value) || 0,
    updatedAt: serverTimestamp()
  });
};

window.updateUnit = async (id, unit) => {
  await updateDoc(doc(db, 'products', id), {
    unit,
    updatedAt: serverTimestamp()
  });
};

window.toggleFeatured = async (id, val) => {
  await updateDoc(doc(db, 'products', id), {
    featured: !!val,
    updatedAt: serverTimestamp()
  });
};

window.updateStockStatus = async (id, status) => {
  await updateDoc(doc(db, 'products', id), {
    status,
    updatedAt: serverTimestamp()
  });
};

window.deleteProduct = async (id) => {
  if (!confirm('Delete this product?')) return;
  await deleteDoc(doc(db, 'products', id));
};

/* ======================================
   RENDER PRODUCTS (ADMIN)
   ====================================== */
function renderProducts() {
  const table = document.getElementById('admin-inventory');
  if (!table) return;

  table.innerHTML = allProducts.map(p => `
    <tr>
      <td>${p.name}</td>
      <td>
        <input type="number"
          value="${p.stock || 0}"
          onchange="updateStockCount('${p.id}', this.value)"
        />
      </td>
      <td>₹${p.price}</td>
      <td>${p.category || '-'}</td>
      <td>${p.status}</td>
      <td>
        <button onclick="toggleFeatured('${p.id}', ${!p.featured})">
          ${p.featured ? '★' : '☆'}
        </button>
        <button onclick="deleteProduct('${p.id}')">🗑</button>
      </td>
    </tr>
  `).join('');
}

/* ======================================
   ORDERS RENDER
   ====================================== */
function renderOrders() {
  const table = document.getElementById('admin-orders');
  if (!table) return;

  table.innerHTML = allOrders.map(o => `
    <tr>
      <td>${o.customerName || '-'}</td>
      <td>${o.customerPhone || '-'}</td>
      <td>₹${o.total || 0}</td>
      <td>${o.status || 'pending'}</td>
    </tr>
  `).join('');
}

/* ======================================
   STATS
   ====================================== */
function updateStats() {
  const total = allOrders.length;
  const delivered = allOrders.filter(o => o.status === 'delivered').length;

  const totalEl = document.getElementById('total-orders-val');
  const deliveredEl = document.getElementById('delivered-orders-val');

  if (totalEl) totalEl.textContent = total;
  if (deliveredEl) deliveredEl.textContent = delivered;
}

/* ======================================
   HELPERS
   ====================================== */
function clearProductForm() {
  ['p-name','p-price','p-img','p-desc','p-stock'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('p-featured').checked = false;
}
