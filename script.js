const TAX_RATE = 0.065;
const CART_KEY = "smokehouseCart";
const ORDERS_KEY = "smokehouseOrders";

const users = {
  customer: {
    email: "customer@test.com",
    password: "customer123",
    role: "customer",
    label: "Customer Ordering"
  },
  admin: {
    email: "admin@test.com",
    password: "admin123",
    role: "admin",
    label: "Admin Management"
  }
};

const menuItems = [
  {
    id: 1,
    name: "Brisket Plate",
    category: "Plates",
    price: 18.99,
    icon: "🥩",
    description: "Oak-smoked brisket, two sides, pickles, onions, and house BBQ sauce."
  },
  {
    id: 2,
    name: "Full Rack Ribs",
    category: "Plates",
    price: 26.99,
    icon: "🍖",
    description: "Tender smoked ribs glazed with house sauce and served with two sides."
  },
  {
    id: 3,
    name: "Pulled Pork Sandwich",
    category: "Sandwiches",
    price: 12.99,
    icon: "🥪",
    description: "Pulled pork, slaw, pickles, and smoky BBQ sauce on a toasted bun."
  },
  {
    id: 4,
    name: "Smoked Chicken Plate",
    category: "Plates",
    price: 16.99,
    icon: "🍗",
    description: "Half smoked chicken with two sides and Alabama white sauce."
  },
  {
    id: 5,
    name: "Burnt Ends Bowl",
    category: "Plates",
    price: 19.99,
    icon: "🔥",
    description: "Caramelized brisket burnt ends over mac and cheese with crispy onions."
  },
  {
    id: 6,
    name: "Family Feast",
    category: "Family Packs",
    price: 54.99,
    icon: "🍽️",
    description: "Brisket, ribs, pulled pork, four sides, sauces, and buns."
  },
  {
    id: 7,
    name: "Mac & Cheese",
    category: "Sides",
    price: 5.99,
    icon: "🧀",
    description: "Creamy smoked gouda mac and cheese."
  },
  {
    id: 8,
    name: "Pit Beans",
    category: "Sides",
    price: 4.99,
    icon: "🥣",
    description: "Slow-cooked BBQ beans with brisket bits."
  },
  {
    id: 9,
    name: "Sweet Tea",
    category: "Drinks",
    price: 3.49,
    icon: "🥤",
    description: "Cold Southern sweet tea with lemon."
  },
  {
    id: 10,
    name: "Banana Pudding",
    category: "Desserts",
    price: 5.99,
    icon: "🍌",
    description: "Classic banana pudding with wafers and whipped cream."
  }
];

let cart = loadCart();
let orders = loadOrders();
let currentRole = null;
let checkoutStep = 1;
let uploadFiles = [];

const authView = document.getElementById("authView");
const appView = document.getElementById("appView");
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const demoButtons = document.querySelectorAll(".demo-button");
const logoutButton = document.getElementById("logoutButton");
const roleLabel = document.getElementById("roleLabel");

const navButtons = document.querySelectorAll(".nav-button");
const views = document.querySelectorAll(".view");
const customerOnlyItems = document.querySelectorAll(".customer-only");
const adminOnlyItems = document.querySelectorAll(".admin-only");

const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const menuGrid = document.getElementById("menuGrid");

const cartCountBadge = document.getElementById("cartCountBadge");
const cartItems = document.getElementById("cartItems");
const subtotalText = document.getElementById("subtotalText");
const taxText = document.getElementById("taxText");
const totalText = document.getElementById("totalText");
const clearCartButton = document.getElementById("clearCartButton");
const startCheckoutButton = document.getElementById("startCheckoutButton");

const checkoutModal = document.getElementById("checkoutModal");
const closeCheckoutButton = document.getElementById("closeCheckoutButton");
const checkoutForm = document.getElementById("checkoutForm");
const prevStepButton = document.getElementById("prevStepButton");
const nextStepButton = document.getElementById("nextStepButton");
const placeOrderButton = document.getElementById("placeOrderButton");
const checkoutReview = document.getElementById("checkoutReview");

const customerName = document.getElementById("customerName");
const customerPhone = document.getElementById("customerPhone");
const customerEmail = document.getElementById("customerEmail");
const pickupTime = document.getElementById("pickupTime");
const orderType = document.getElementById("orderType");
const orderNotes = document.getElementById("orderNotes");

const adminRevenue = document.getElementById("adminRevenue");
const adminOrderCount = document.getElementById("adminOrderCount");
const adminAverageOrder = document.getElementById("adminAverageOrder");
const adminBestSeller = document.getElementById("adminBestSeller");
const revenueBars = document.getElementById("revenueBars");
const categoryBars = document.getElementById("categoryBars");
const topItemsList = document.getElementById("topItemsList");

const ordersTableBody = document.getElementById("ordersTableBody");
const exportOrdersButton = document.getElementById("exportOrdersButton");
const invoiceSelect = document.getElementById("invoiceSelect");
const invoicePreview = document.getElementById("invoicePreview");
const printInvoiceButton = document.getElementById("printInvoiceButton");

const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const uploadList = document.getElementById("uploadList");
const clearUploadsButton = document.getElementById("clearUploadsButton");
const fakeUploadButton = document.getElementById("fakeUploadButton");

const toast = document.getElementById("toast");

renderMenu();
renderCart();

loginForm.addEventListener("submit", handleLogin);

demoButtons.forEach((button) => {
  button.addEventListener("click", () => {
    loginAs(button.dataset.role);
  });
});

logoutButton.addEventListener("click", () => {
  currentRole = null;
  authView.classList.remove("hidden");
  appView.classList.add("hidden");
  loginForm.reset();
});

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    showView(button.dataset.view);
  });
});

searchInput.addEventListener("input", renderMenu);
categoryFilter.addEventListener("change", renderMenu);

clearCartButton.addEventListener("click", () => {
  cart = [];
  saveCart();
  renderCart();
});

cartItems.addEventListener("click", (event) => {
  const button = event.target.closest("button");

  if (!button) {
    return;
  }

  const id = Number(button.dataset.id);
  const action = button.dataset.action;

  if (action === "increase") increaseQuantity(id);
  if (action === "decrease") decreaseQuantity(id);
  if (action === "remove") removeFromCart(id);
});

startCheckoutButton.addEventListener("click", () => {
  if (cart.length === 0) {
    showToast("Add at least one item before checkout.");
    return;
  }

  checkoutStep = 1;
  updateCheckoutStep();
  checkoutModal.classList.remove("hidden");
});

closeCheckoutButton.addEventListener("click", () => {
  checkoutModal.classList.add("hidden");
});

prevStepButton.addEventListener("click", () => {
  if (checkoutStep > 1) {
    checkoutStep -= 1;
    updateCheckoutStep();
  }
});

nextStepButton.addEventListener("click", () => {
  if (!validateCurrentStep()) {
    return;
  }

  if (checkoutStep < 3) {
    checkoutStep += 1;
    updateCheckoutStep();
  }
});

checkoutForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const totals = getCartTotals();

  const newOrder = {
    id: createOrderId(),
    customer: {
      name: customerName.value.trim(),
      phone: customerPhone.value.trim(),
      email: customerEmail.value.trim()
    },
    pickupTime: pickupTime.value,
    orderType: orderType.value,
    notes: orderNotes.value.trim(),
    items: cart.map((entry) => {
      const item = menuItems.find((menuItem) => menuItem.id === entry.id);

      return {
        id: item.id,
        name: item.name,
        category: item.category,
        price: item.price,
        quantity: entry.quantity
      };
    }),
    subtotal: totals.subtotal,
    tax: totals.tax,
    total: totals.total,
    status: "New",
    date: new Date().toISOString()
  };

  orders.unshift(newOrder);
  saveOrders();

  cart = [];
  saveCart();

  checkoutForm.reset();
  checkoutModal.classList.add("hidden");

  renderCart();
  renderAdmin();
  showToast(`${newOrder.id} placed successfully.`);
});

ordersTableBody.addEventListener("change", (event) => {
  if (!event.target.classList.contains("status-select")) {
    return;
  }

  const orderId = event.target.dataset.id;
  const order = orders.find((item) => item.id === orderId);

  if (!order) {
    return;
  }

  order.status = event.target.value;
  saveOrders();
  renderAdmin();
  showToast(`${orderId} updated.`);
});

exportOrdersButton.addEventListener("click", exportOrdersCSV);

invoiceSelect.addEventListener("change", renderInvoice);
printInvoiceButton.addEventListener("click", () => {
  window.print();
});

dropZone.addEventListener("click", () => {
  fileInput.click();
});

fileInput.addEventListener("change", (event) => {
  addUploadFiles(event.target.files);
  fileInput.value = "";
});

dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.classList.add("dragging");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("dragging");
});

dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropZone.classList.remove("dragging");
  addUploadFiles(event.dataTransfer.files);
});

clearUploadsButton.addEventListener("click", () => {
  uploadFiles = [];
  renderUploads();
});

fakeUploadButton.addEventListener("click", () => {
  if (uploadFiles.length === 0) {
    showToast("Add files first.");
    return;
  }

  showToast(`${uploadFiles.length} file(s) ready for upload.`);
});

uploadList.addEventListener("click", (event) => {
  const button = event.target.closest("button");

  if (!button) {
    return;
  }

  const id = button.dataset.id;
  uploadFiles = uploadFiles.filter((item) => item.id !== id);
  renderUploads();
});

function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById("emailInput").value.trim();
  const password = document.getElementById("passwordInput").value.trim();

  const foundUser = Object.values(users).find((user) => {
    return user.email === email && user.password === password;
  });

  if (!foundUser) {
    loginMessage.textContent = "Invalid demo login.";
    return;
  }

  loginAs(foundUser.role);
}

function loginAs(role) {
  currentRole = role;

  authView.classList.add("hidden");
  appView.classList.remove("hidden");

  roleLabel.textContent = users[role].label;

  customerOnlyItems.forEach((item) => {
    item.style.display = role === "customer" ? "inline-flex" : "none";
  });

  adminOnlyItems.forEach((item) => {
    item.style.display = role === "admin" ? "inline-flex" : "none";
  });

  if (role === "customer") {
    showView("customerStore");
  } else {
    showView("adminDashboard");
    renderAdmin();
  }

  showToast(`${role === "admin" ? "Admin" : "Customer"} demo loaded.`);
}

function showView(viewId) {
  views.forEach((view) => {
    view.classList.toggle("active", view.id === viewId);
  });

  navButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.view === viewId);
  });

  if (viewId.startsWith("admin")) {
    renderAdmin();
  }

  if (viewId === "customerCart") {
    renderCart();
  }
}

function renderMenu() {
  const searchTerm = searchInput.value.toLowerCase().trim();
  const category = categoryFilter.value;

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = category === "All" || item.category === category;
    const matchesSearch = `
      ${item.name}
      ${item.category}
      ${item.description}
    `.toLowerCase().includes(searchTerm);

    return matchesCategory && matchesSearch;
  });

  menuGrid.innerHTML = "";

  if (filteredItems.length === 0) {
    menuGrid.innerHTML = `
      <div class="empty-state">No menu items match your search.</div>
    `;
    return;
  }

  filteredItems.forEach((item) => {
    const card = document.createElement("article");
    card.className = "menu-card";

    card.innerHTML = `
      <div class="menu-image">${item.icon}</div>

      <div class="menu-content">
        <span class="menu-tag">${item.category}</span>
        <h3>${item.name}</h3>
        <p>${item.description}</p>

        <div class="menu-footer">
          <span class="price">$${item.price.toFixed(2)}</span>
          <button class="add-button" data-id="${item.id}" type="button">
            Add
          </button>
        </div>
      </div>
    `;

    card.querySelector(".add-button").addEventListener("click", () => {
      addToCart(item.id);
    });

    menuGrid.appendChild(card);
  });
}

function addToCart(id) {
  const existing = cart.find((item) => item.id === id);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ id, quantity: 1 });
  }

  saveCart();
  renderCart();
  showToast("Added to cart.");
}

function increaseQuantity(id) {
  const item = cart.find((entry) => entry.id === id);
  if (!item) return;

  item.quantity += 1;
  saveCart();
  renderCart();
}

function decreaseQuantity(id) {
  const item = cart.find((entry) => entry.id === id);
  if (!item) return;

  item.quantity -= 1;

  if (item.quantity <= 0) {
    cart = cart.filter((entry) => entry.id !== id);
  }

  saveCart();
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter((entry) => entry.id !== id);
  saveCart();
  renderCart();
}

function renderCart() {
  cartItems.innerHTML = "";

  if (cart.length === 0) {
    cartItems.innerHTML = `
      <div class="empty-state">Your cart is empty.</div>
    `;
  }

  cart.forEach((entry) => {
    const item = menuItems.find((menuItem) => menuItem.id === entry.id);
    const lineTotal = item.price * entry.quantity;

    const cartItem = document.createElement("div");
    cartItem.className = "cart-item";

    cartItem.innerHTML = `
      <div class="cart-item-icon">${item.icon}</div>

      <div>
        <h4>${item.name}</h4>
        <small>$${item.price.toFixed(2)} each</small>

        <div class="qty-controls">
          <button class="qty-button" data-action="decrease" data-id="${item.id}" type="button">-</button>
          <strong>${entry.quantity}</strong>
          <button class="qty-button" data-action="increase" data-id="${item.id}" type="button">+</button>
        </div>
      </div>

      <div>
        <strong>$${lineTotal.toFixed(2)}</strong>
        <button class="remove-button" data-action="remove" data-id="${item.id}" type="button">
          Remove
        </button>
      </div>
    `;

    cartItems.appendChild(cartItem);
  });

  const totals = getCartTotals();

  subtotalText.textContent = `$${totals.subtotal.toFixed(2)}`;
  taxText.textContent = `$${totals.tax.toFixed(2)}`;
  totalText.textContent = `$${totals.total.toFixed(2)}`;
  cartCountBadge.textContent = getCartCount();
}

function getCartTotals() {
  const subtotal = cart.reduce((sum, entry) => {
    const item = menuItems.find((menuItem) => menuItem.id === entry.id);
    return sum + item.price * entry.quantity;
  }, 0);

  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  return { subtotal, tax, total };
}

function getCartCount() {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

function updateCheckoutStep() {
  document.querySelectorAll(".checkout-step").forEach((step) => {
    step.classList.toggle("active", Number(step.dataset.step) === checkoutStep);
  });

  document.querySelectorAll(".step-dot").forEach((dot) => {
    dot.classList.toggle("active", Number(dot.dataset.stepDot) === checkoutStep);
  });

  prevStepButton.style.display = checkoutStep === 1 ? "none" : "inline-flex";
  nextStepButton.classList.toggle("hidden", checkoutStep === 3);
  placeOrderButton.classList.toggle("hidden", checkoutStep !== 3);

  if (checkoutStep === 3) {
    renderCheckoutReview();
  }
}

function validateCurrentStep() {
  if (checkoutStep === 1) {
    if (!customerName.value.trim() || !customerPhone.value.trim() || !customerEmail.value.trim()) {
      showToast("Fill out customer info first.");
      return false;
    }
  }

  if (checkoutStep === 2) {
    if (!pickupTime.value) {
      showToast("Choose a pickup time.");
      return false;
    }
  }

  return true;
}

function renderCheckoutReview() {
  const totals = getCartTotals();

  checkoutReview.innerHTML = `
    <div class="summary-line">
      <span>Name</span>
      <strong>${escapeHTML(customerName.value)}</strong>
    </div>

    <div class="summary-line">
      <span>Pickup</span>
      <strong>${escapeHTML(pickupTime.value)}</strong>
    </div>

    ${cart.map((entry) => {
      const item = menuItems.find((menuItem) => menuItem.id === entry.id);
      return `
        <div class="summary-line">
          <span>${escapeHTML(item.name)} x${entry.quantity}</span>
          <strong>$${(item.price * entry.quantity).toFixed(2)}</strong>
        </div>
      `;
    }).join("")}

    <div class="summary-line total-line">
      <span>Total</span>
      <strong>$${totals.total.toFixed(2)}</strong>
    </div>
  `;
}

function renderAdmin() {
  renderAdminStats();
  renderRevenueChart();
  renderCategoryChart();
  renderTopItems();
  renderOrdersTable();
  renderInvoiceSelect();
  renderInvoice();
}

function renderAdminStats() {
  const revenue = orders.reduce((sum, order) => sum + order.total, 0);
  const average = orders.length ? revenue / orders.length : 0;
  const best = getTopItems()[0];

  adminRevenue.textContent = `$${revenue.toFixed(2)}`;
  adminOrderCount.textContent = orders.length;
  adminAverageOrder.textContent = `$${average.toFixed(2)}`;
  adminBestSeller.textContent = best ? best.name : "None";
}

function renderRevenueChart() {
  const totalsByDay = {};

  orders.forEach((order) => {
    const day = new Date(order.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    });

    totalsByDay[day] = (totalsByDay[day] || 0) + order.total;
  });

  const entries = Object.entries(totalsByDay).slice(-6);
  const max = Math.max(...entries.map((entry) => entry[1]), 1);

  revenueBars.innerHTML = entries.length
    ? ""
    : `<div class="empty-state">No revenue data yet.</div>`;

  entries.forEach(([day, total]) => {
    const width = (total / max) * 100;

    revenueBars.innerHTML += `
      <div class="bar-row">
        <div class="bar-row-top">
          <span>${day}</span>
          <strong>$${total.toFixed(2)}</strong>
        </div>

        <div class="track">
          <div class="fill" style="width: ${width}%"></div>
        </div>
      </div>
    `;
  });
}

function renderCategoryChart() {
  const categoryMap = {};

  orders.forEach((order) => {
    order.items.forEach((item) => {
      categoryMap[item.category] = (categoryMap[item.category] || 0) + item.quantity;
    });
  });

  const entries = Object.entries(categoryMap);
  const max = Math.max(...entries.map((entry) => entry[1]), 1);

  categoryBars.innerHTML = entries.length
    ? ""
    : `<div class="empty-state">No category data yet.</div>`;

  entries.forEach(([category, quantity]) => {
    const width = (quantity / max) * 100;

    categoryBars.innerHTML += `
      <div class="horizontal-row">
        <div class="horizontal-row-top">
          <span>${category}</span>
          <strong>${quantity} sold</strong>
        </div>

        <div class="track">
          <div class="fill" style="width: ${width}%"></div>
        </div>
      </div>
    `;
  });
}

function renderTopItems() {
  const topItems = getTopItems().slice(0, 5);

  topItemsList.innerHTML = topItems.length
    ? ""
    : `<div class="empty-state">No top sellers yet.</div>`;

  topItems.forEach((item, index) => {
    topItemsList.innerHTML += `
      <div class="top-item">
        <span>${index + 1}. ${item.name}</span>
        <strong>${item.quantity} sold</strong>
      </div>
    `;
  });
}

function getTopItems() {
  const itemMap = {};

  orders.forEach((order) => {
    order.items.forEach((item) => {
      if (!itemMap[item.name]) {
        itemMap[item.name] = {
          name: item.name,
          quantity: 0
        };
      }

      itemMap[item.name].quantity += item.quantity;
    });
  });

  return Object.values(itemMap).sort((a, b) => b.quantity - a.quantity);
}

function renderOrdersTable() {
  ordersTableBody.innerHTML = orders.length
    ? ""
    : `
      <tr>
        <td colspan="6">No orders yet.</td>
      </tr>
    `;

  orders.forEach((order) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${order.id}</td>
      <td>${escapeHTML(order.customer.name)}</td>
      <td>${escapeHTML(order.pickupTime)}</td>
      <td>$${order.total.toFixed(2)}</td>
      <td>
        <select class="status-select" data-id="${order.id}">
          <option ${order.status === "New" ? "selected" : ""}>New</option>
          <option ${order.status === "Preparing" ? "selected" : ""}>Preparing</option>
          <option ${order.status === "Ready" ? "selected" : ""}>Ready</option>
          <option ${order.status === "Completed" ? "selected" : ""}>Completed</option>
        </select>
      </td>
      <td>${formatDate(order.date)}</td>
    `;

    ordersTableBody.appendChild(row);
  });
}

function renderInvoiceSelect() {
  invoiceSelect.innerHTML = "";

  if (orders.length === 0) {
    invoiceSelect.innerHTML = `<option>No orders available</option>`;
    return;
  }

  orders.forEach((order) => {
    const option = document.createElement("option");
    option.value = order.id;
    option.textContent = `${order.id} - ${order.customer.name}`;
    invoiceSelect.appendChild(option);
  });
}

function renderInvoice() {
  const order = orders.find((item) => item.id === invoiceSelect.value) || orders[0];

  if (!order) {
    invoicePreview.innerHTML = `<p>No invoice available yet.</p>`;
    return;
  }

  invoicePreview.innerHTML = `
    <h3>SmokeHouse OS</h3>
    <p><strong>Receipt:</strong> ${order.id}</p>
    <p><strong>Customer:</strong> ${escapeHTML(order.customer.name)}</p>
    <p><strong>Phone:</strong> ${escapeHTML(order.customer.phone)}</p>
    <p><strong>Pickup:</strong> ${escapeHTML(order.pickupTime)}</p>

    <br />

    ${order.items.map((item) => `
      <div class="invoice-line">
        <span>${escapeHTML(item.name)} x${item.quantity}</span>
        <strong>$${(item.price * item.quantity).toFixed(2)}</strong>
      </div>
    `).join("")}

    <br />

    <div class="invoice-line">
      <span>Subtotal</span>
      <strong>$${order.subtotal.toFixed(2)}</strong>
    </div>

    <div class="invoice-line">
      <span>Tax</span>
      <strong>$${order.tax.toFixed(2)}</strong>
    </div>

    <div class="invoice-line">
      <span>Total</span>
      <strong>$${order.total.toFixed(2)}</strong>
    </div>
  `;
}

function addUploadFiles(fileList) {
  Array.from(fileList).forEach((file) => {
    uploadFiles.push({
      id: `${file.name}-${Date.now()}`,
      file,
      url: URL.createObjectURL(file)
    });
  });

  renderUploads();
}

function renderUploads() {
  uploadList.innerHTML = "";

  if (uploadFiles.length === 0) {
    uploadList.innerHTML = `<div class="empty-state">No files selected yet.</div>`;
    return;
  }

  uploadFiles.forEach((item) => {
    const file = item.file;
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    const card = document.createElement("article");
    card.className = "upload-card";

    let preview = `<div class="file-icon">📄</div>`;

    if (isImage) {
      preview = `<img src="${item.url}" alt="${escapeHTML(file.name)} preview" />`;
    }

    if (isVideo) {
      preview = `<video src="${item.url}" controls></video>`;
    }

    card.innerHTML = `
      <div class="upload-preview">
        ${preview}
      </div>

      <div class="upload-info">
        <strong>${escapeHTML(file.name)}</strong>
        <p>${file.type || "Unknown type"}</p>
        <p>${formatBytes(file.size)}</p>

        <button data-id="${item.id}" type="button">
          Remove
        </button>
      </div>
    `;

    uploadList.appendChild(card);
  });
}

function exportOrdersCSV() {
  const rows = [
    "orderId,customer,total,status,date"
  ];

  orders.forEach((order) => {
    rows.push([
      order.id,
      `"${order.customer.name}"`,
      order.total.toFixed(2),
      order.status,
      order.date
    ].join(","));
  });

  downloadFile("smokehouse-orders.csv", rows.join("\n"), "text/csv");
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

function createOrderId() {
  return `SH-${1000 + orders.length + 1}`;
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function loadCart() {
  const saved = localStorage.getItem(CART_KEY);

  if (!saved) {
    return [];
  }

  try {
    return JSON.parse(saved);
  } catch {
    return [];
  }
}

function saveOrders() {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

function loadOrders() {
  const saved = localStorage.getItem(ORDERS_KEY);

  if (!saved) {
    return getDemoOrders();
  }

  try {
    return JSON.parse(saved);
  } catch {
    return getDemoOrders();
  }
}

function getDemoOrders() {
  return [
    {
      id: "SH-1001",
      customer: { name: "Maya Johnson", phone: "555-123-4455", email: "maya@email.com" },
      pickupTime: "Today, 6:00 PM",
      orderType: "Pickup",
      notes: "Extra sauce",
      items: [
        { id: 1, name: "Brisket Plate", category: "Plates", price: 18.99, quantity: 2 },
        { id: 7, name: "Mac & Cheese", category: "Sides", price: 5.99, quantity: 2 }
      ],
      subtotal: 49.96,
      tax: 3.25,
      total: 53.21,
      status: "Preparing",
      date: new Date().toISOString()
    },
    {
      id: "SH-1002",
      customer: { name: "Chris Walker", phone: "555-888-1099", email: "chris@email.com" },
      pickupTime: "Today, 7:00 PM",
      orderType: "Pickup",
      notes: "",
      items: [
        { id: 6, name: "Family Feast", category: "Family Packs", price: 54.99, quantity: 1 }
      ],
      subtotal: 54.99,
      tax: 3.57,
      total: 58.56,
      status: "New",
      date: new Date().toISOString()
    }
  ];
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";

  const units = ["Bytes", "KB", "MB", "GB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, index);

  return `${value.toFixed(1)} ${units[index]}`;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

function escapeHTML(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
