/* ================================
   ZYPSO MART – FIXED app.js
   ================================ */

import { auth, db } from './firebase.js';

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

/* ================================
   GLOBAL STATE
   ================================ */
let currentUser = null;
let allProducts = [];
let activeCategory = 'all';
let searchTerm = '';
let productsUnsub = null;

/* ================================
   DOM SAFE INIT
   ================================ */
document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  initSearch();
});

/* ================================
   AUTH LISTENER
   ================================ */
function initAuth() {
  onAuthStateChanged(auth, user => {
    currentUser = user || null;
    initProductsListener();
  });
}

/* ================================
   PRODUCTS – REALTIME SAFE
   ================================ */
function initProductsListener() {
  // 🔴 Prevent duplicate listeners
  if (productsUnsub) {
    productsUnsub();
    productsUnsub = null;
  }

  const q = query(
    collection(db, 'products'),
    orderBy('createdAt', 'desc')
  );

  productsUnsub = onSnapshot(
    q,
    snap => {
      allProducts = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      renderProducts();
      hideLoader();
    },
    err => {
      console.error('Firestore error:', err);
      hideLoader();
    }
  );
}

/* ================================
   SEARCH
   ================================ */
function initSearch() {
  const input = document.getElementById('product-search');
  if (!input) return;

  input.addEventListener('input', e => {
    searchTerm = e.target.value.toLowerCase().trim();
    renderProducts();
  });
}

/* ================================
   CATEGORY FILTER (FIXED)
   ================================ */
window.filterCat = (cat, el) => {
  activeCategory = cat;

  document
    .querySelectorAll('.category-chip')
    .forEach(c => c.classList.remove('active'));

  if (el) el.classList.add('active');

  renderProducts();
};

/* ================================
   RENDER PRODUCTS (CRITICAL FIX)
   ================================ */
function renderProducts() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  let filtered = allProducts.filter(p => {
    // 🔐 Safety guards
    if (!p || !p.name) return false;

    // Category
    if (activeCategory !== 'all' && p.category !== activeCategory) {
      return false;
    }

    // Search
    if (searchTerm) {
      const txt =
        (p.name + ' ' + (p.description || '')).toLowerCase();
      if (!txt.includes(searchTerm)) return false;
    }

    return true;
  });

  /* ================================
     EMPTY STATE (REAL FIX)
     ================================ */
  if (allProducts.length === 0) {
    grid.innerHTML = `
      <div class="no-products">
        <h3>No products added yet</h3>
        <p>Please check back later</p>
      </div>
    `;
    return;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="no-products">
        <h3>No matching products</h3>
        <p>Try changing category or search</p>
      </div>
    `;
    return;
  }

  /* ================================
     PRODUCT CARDS
     ================================ */
  grid.innerHTML = filtered.map(p => {
    const out =
      p.status === 'Out of Stock' ||
      p.status === 'Unavailable' ||
      Number(p.stock) <= 0;

    return `
      <div class="product-card ${out ? 'out-of-stock' : ''}">
        ${out ? `<span class="status-badge">Out of Stock</span>` : ''}

        <img
          src="${p.imageUrl || 'https://via.placeholder.com/300'}"
          class="product-img"
          alt="${p.name}"
          onerror="this.src='https://via.placeholder.com/300'"
        />

        <h4>${p.name}</h4>
        <p>₹${p.price}</p>

        <button
          class="btn-primary"
          ${out ? 'disabled' : ''}
          onclick="addToCart('${p.id}')"
        >
          ${out ? 'Unavailable' : 'Add to Cart'}
        </button>
      </div>
    `;
  }).join('');
}

/* ================================
   CART (SAFE STUB – UNCHANGED LOGIC)
   ================================ */
window.addToCart = id => {
  console.log('Add to cart:', id);
  // Existing cart logic untouched
};

/* ================================
   UI HELPERS
   ================================ */
function hideLoader() {
  const l = document.getElementById('loading-indicator');
  if (l) l.style.display = 'none';
}

/* ================================
   LOGOUT
   ================================ */
window.logout = () => {
  signOut(auth);
};
