const productsGrid = document.getElementById("productsGrid");
const productCount = document.getElementById("productCount");
const emptyProducts = document.getElementById("emptyProducts");

const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const cartButton = document.getElementById("cartButton");
const cartCount = document.getElementById("cartCount");

const cartPanel = document.getElementById("cartPanel");
const cartItems = document.getElementById("cartItems");
const cartMessage = document.getElementById("cartMessage");
const cartTotal = document.getElementById("cartTotal");
const clearCartButton = document.getElementById("clearCartButton");
const checkoutButton = document.getElementById("checkoutButton");

const themeSelect = document.getElementById("themeSelect");

const products = [
  {
    id: 1,
    name: "Wireless Headphones",
    category: "Tech",
    price: 79.99,
    rating: "4.8",
    icon: "🎧",
    description: "Comfortable wireless headphones with deep sound and long battery life.",
    colors: ["Black", "Silver", "Blue"],
    sizes: ["Standard"]
  },
  {
    id: 2,
    name: "Mechanical Keyboard",
    category: "Tech",
    price: 119.99,
    rating: "4.7",
    icon: "⌨️",
    description: "A responsive keyboard built for coding, gaming, and long work sessions.",
    colors: ["Black", "White"],
    sizes: ["Full Size", "Tenkeyless"]
  },
  {
    id: 3,
    name: "Everyday Hoodie",
    category: "Clothing",
    price: 49.99,
    rating: "4.6",
    icon: "🧥",
    description: "Soft daily hoodie with a clean fit for casual wear.",
    colors: ["Black", "Gray", "Navy"],
    sizes: ["S", "M", "L", "XL"]
  },
  {
    id: 4,
    name: "Desk Lamp",
    category: "Home",
    price: 34.99,
    rating: "4.5",
    icon: "💡",
    description: "Minimal desk lamp with adjustable brightness for focused work.",
    colors: ["White", "Black"],
    sizes: ["Standard"]
  },
  {
    id: 5,
    name: "Running Shoes",
    category: "Fitness",
    price: 89.99,
    rating: "4.7",
    icon: "👟",
    description: "Lightweight shoes made for walking, running, and everyday movement.",
    colors: ["Black", "Red", "Blue"],
    sizes: ["8", "9", "10", "11", "12"]
  },
  {
    id: 6,
    name: "Smart Watch",
    category: "Tech",
    price: 149.99,
    rating: "4.9",
    icon: "⌚",
    description: "Track workouts, notifications, sleep, and daily activity.",
    colors: ["Black", "Silver", "Gold"],
    sizes: ["Small", "Large"]
  }
];

let cart = JSON.parse(localStorage.getItem("onlineStoreCart")) || [];

const themeClasses = [
  "theme-modern",
  "theme-luxury",
  "theme-neon",
  "theme-boutique",
  "theme-clean"
];

themeSelect.addEventListener("change", function () {
  applyTheme(themeSelect.value);
});

searchInput.addEventListener("input", function () {
  renderProducts();
});

categoryFilter.addEventListener("change", function () {
  renderProducts();
});

productsGrid.addEventListener("click", function (event) {
  if (event.target.classList.contains("add-button")) {
    const productId = Number(event.target.dataset.id);
    addToCart(productId);
  }
});

cartItems.addEventListener("click", function (event) {
  const cartId = event.target.dataset.id;

  if (event.target.classList.contains("increase-button")) {
    updateCartQuantity(cartId, 1);
  }

  if (event.target.classList.contains("decrease-button")) {
    updateCartQuantity(cartId, -1);
  }

  if (event.target.classList.contains("remove-button")) {
    removeFromCart(cartId);
  }
});

clearCartButton.addEventListener("click", function () {
  if (cart.length === 0) {
    return;
  }

  const confirmClear = confirm("Clear all items from your cart?");

  if (confirmClear) {
    cart = [];
    saveCart();
    renderCart();
  }
});

checkoutButton.addEventListener("click", function () {
  if (cart.length === 0) {
    alert("Your cart is empty.");
    return;
  }

  alert("Checkout demo complete. This front-end project does not process real payments.");
});

cartButton.addEventListener("click", function () {
  cartPanel.scrollIntoView({ behavior: "smooth" });
});

function applyTheme(theme) {
  document.body.classList.remove(...themeClasses);
  document.body.classList.add(`theme-${theme}`);
  localStorage.setItem("selectedOnlineStoreTheme", theme);
}

function renderProducts() {
  productsGrid.innerHTML = "";

  const searchText = searchInput.value.toLowerCase().trim();
  const selectedCategory = categoryFilter.value;

  const filteredProducts = products.filter(function (product) {
    const matchesSearch =
      product.name.toLowerCase().includes(searchText) ||
      product.description.toLowerCase().includes(searchText) ||
      product.category.toLowerCase().includes(searchText);

    const matchesCategory =
      selectedCategory === "All" || product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  productCount.textContent = `${filteredProducts.length} products`;

  if (filteredProducts.length === 0) {
    emptyProducts.classList.remove("hidden");
    return;
  }

  emptyProducts.classList.add("hidden");

  filteredProducts.forEach(function (product) {
    const card = document.createElement("article");
    card.className = "product-card";

    card.innerHTML = `
      <div class="product-image">${product.icon}</div>

      <div class="product-content">
        <p class="product-category">${product.category}</p>
        <h3>${product.name}</h3>
        <p class="product-description">${product.description}</p>

        <div class="product-meta">
          <p class="price">$${product.price.toFixed(2)}</p>
          <p class="rating">⭐ ${product.rating}</p>
        </div>

        <div class="product-options">
          <select id="color-${product.id}">
            ${product.colors.map(function (color) {
              return `<option value="${color}">${color}</option>`;
            }).join("")}
          </select>

          <select id="size-${product.id}">
            ${product.sizes.map(function (size) {
              return `<option value="${size}">${size}</option>`;
            }).join("")}
          </select>

          <input class="quantity-input" id="quantity-${product.id}" type="number" min="1" value="1" />
        </div>

        <button class="add-button" data-id="${product.id}" type="button">Add to Cart</button>
      </div>
    `;

    productsGrid.appendChild(card);
  });
}

function addToCart(productId) {
  const product = products.find(function (item) {
    return item.id === productId;
  });

  const colorSelect = document.getElementById(`color-${productId}`);
  const sizeSelect = document.getElementById(`size-${productId}`);
  const quantityInput = document.getElementById(`quantity-${productId}`);

  const selectedColor = colorSelect.value;
  const selectedSize = sizeSelect.value;
  const selectedQuantity = Number(quantityInput.value);

  if (selectedQuantity < 1) {
    return;
  }

  const cartId = `${productId}-${selectedColor}-${selectedSize}`;

  const existingItem = cart.find(function (item) {
    return item.cartId === cartId;
  });

  if (existingItem) {
    existingItem.quantity += selectedQuantity;
  } else {
    cart.push({
      cartId: cartId,
      productId: product.id,
      name: product.name,
      price: product.price,
      icon: product.icon,
      color: selectedColor,
      size: selectedSize,
      quantity: selectedQuantity
    });
  }

  saveCart();
  renderCart();
  quantityInput.value = 1;
}

function renderCart() {
  cartItems.innerHTML = "";

  const totalItems = cart.reduce(function (sum, item) {
    return sum + item.quantity;
  }, 0);

  cartCount.textContent = totalItems;

  if (cart.length === 0) {
    cartMessage.textContent = "No items yet.";
    cartTotal.textContent = "$0.00";
    return;
  }

  cartMessage.textContent = `${totalItems} item${totalItems === 1 ? "" : "s"} in cart`;

  cart.forEach(function (item) {
    const cartItem = document.createElement("article");
    cartItem.className = "cart-item";

    cartItem.innerHTML = `
      <div class="cart-item-top">
        <div>
          <p class="cart-item-title">${item.icon} ${item.name}</p>
          <p class="cart-item-options">${item.color} • ${item.size}</p>
        </div>

        <strong>$${(item.price * item.quantity).toFixed(2)}</strong>
      </div>

      <div class="cart-actions">
        <button class="quantity-button decrease-button" data-id="${item.cartId}" type="button">-</button>
        <span>${item.quantity}</span>
        <button class="quantity-button increase-button" data-id="${item.cartId}" type="button">+</button>
        <button class="remove-button" data-id="${item.cartId}" type="button">Remove</button>
      </div>
    `;

    cartItems.appendChild(cartItem);
  });

  const total = cart.reduce(function (sum, item) {
    return sum + item.price * item.quantity;
  }, 0);

  cartTotal.textContent = `$${total.toFixed(2)}`;
}

function updateCartQuantity(cartId, change) {
  cart = cart.map(function (item) {
    if (item.cartId === cartId) {
      return {
        ...item,
        quantity: item.quantity + change
      };
    }

    return item;
  });

  cart = cart.filter(function (item) {
    return item.quantity > 0;
  });

  saveCart();
  renderCart();
}

function removeFromCart(cartId) {
  cart = cart.filter(function (item) {
    return item.cartId !== cartId;
  });

  saveCart();
  renderCart();
}

function saveCart() {
  localStorage.setItem("onlineStoreCart", JSON.stringify(cart));
}

const savedTheme = localStorage.getItem("selectedOnlineStoreTheme") || "modern";
themeSelect.value = savedTheme;
applyTheme(savedTheme);

renderProducts();
renderCart();
