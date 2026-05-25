const TAX_RATE = 0.065;
const CART_KEY = "restaurantOnlineStoreCart";

const products = [
  {
    id: 1,
    name: "Classic Burger",
    category: "Burgers",
    price: 10.99,
    image: "🍔",
    description: "Beef patty, cheddar, lettuce, tomato, pickles, and house sauce.",
    tags: ["Popular", "Fresh"]
  },
  {
    id: 2,
    name: "Spicy Chicken Sandwich",
    category: "Burgers",
    price: 10.99,
    image: "🍔",
    description: "Crispy spicy chicken, slaw, pickles, and spicy mayo.",
    tags: ["Spicy", "Popular"]
  },
  {
    id: 3,
    name: "Taco Trio",
    category: "Tacos",
    price: 11.99,
    image: "🌮",
    description: "Three street tacos with your choice of protein and salsa.",
    tags: ["Popular"]
  },
  {
    id: 4,
    name: "Family Taco Combo",
    category: "Combos",
    price: 17.99,
    image: "🌮",
    description: "Tacos, chips, salsa, and two drinks. Perfect for sharing.",
    tags: ["Best Value"]
  },
  {
    id: 5,
    name: "Chicken Rice Bowl",
    category: "Bowls",
    price: 11.49,
    image: "🍲",
    description: "Grilled chicken, rice, black beans, corn, pico, and lime crema.",
    tags: ["Protein"]
  },
  {
    id: 6,
    name: "Veggie Bowl",
    category: "Bowls",
    price: 9.99,
    image: "🥗",
    description: "Rice, roasted vegetables, avocado, beans, and citrus dressing.",
    tags: ["Vegetarian"]
  },
  {
    id: 7,
    name: "Loaded Fries",
    category: "Sides",
    price: 5.49,
    image: "🍟",
    description: "Crispy fries with cheese sauce, bacon bits, scallions, and sour cream.",
    tags: ["Shareable"]
  },
  {
    id: 8,
    name: "Chicken Quesadilla",
    category: "Combos",
    price: 8.99,
    image: "🫓",
    description: "Grilled chicken, cheese, peppers, onions, and sour cream.",
    tags: ["Quick Bite"]
  },
  {
    id: 9,
    name: "Fresh Lemonade",
    category: "Drinks",
    price: 3.49,
    image: "🥤",
    description: "Fresh-squeezed lemonade served ice cold.",
    tags: ["Refreshing"]
  },
  {
    id: 10,
    name: "Iced Tea",
    category: "Drinks",
    price: 2.99,
    image: "🧋",
    description: "Cold brewed tea with lemon and optional sweetener.",
    tags: ["Classic"]
  },
  {
    id: 11,
    name: "Chocolate Lava Cake",
    category: "Desserts",
    price: 6.49,
    image: "🍫",
    description: "Warm chocolate cake with a soft center and vanilla cream.",
    tags: ["Sweet"]
  },
  {
    id: 12,
    name: "Churro Bites",
    category: "Desserts",
    price: 4.99,
    image: "🍩",
    description: "Warm cinnamon churro bites with dipping sauce.",
    tags: ["Sweet"]
  }
];

let cart = loadCart();

const productGrid = document.getElementById("productGrid");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const sortSelect = document.getElementById("sortSelect");

const cartItems = document.getElementById("cartItems");
const subtotalText = document.getElementById("subtotalText");
const taxText = document.getElementById("taxText");
const totalText = document.getElementById("totalText");
const navCartCount = document.getElementById("navCartCount");

const clearCartButton = document.getElementById("clearCartButton");
const cartJumpButton = document.getElementById("cartJumpButton");
const checkoutForm = document.getElementById("checkoutForm");

const customerName = document.getElementById("customerName");
const customerPhone = document.getElementById("customerPhone");
const pickupTime = document.getElementById("pickupTime");

const successModal = document.getElementById("successModal");
const successMessage = document.getElementById("successMessage");
const closeModalButton = document.getElementById("closeModalButton");

renderProducts();
renderCart();

searchInput.addEventListener("input", renderProducts);
categoryFilter.addEventListener("change", renderProducts);
sortSelect.addEventListener("change", renderProducts);

cartJumpButton.addEventListener("click", () => {
  document.getElementById("cart").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
});

clearCartButton.addEventListener("click", () => {
  if (cart.length === 0) {
    return;
  }

  const confirmed = confirm("Clear your cart?");

  if (!confirmed) {
    return;
  }

  cart = [];
  saveCart();
  renderCart();
});

cartItems.addEventListener("click", (event) => {
  const button = event.target.closest("button");

  if (!button) {
    return;
  }

  const productId = Number(button.dataset.id);
  const action = button.dataset.action;

  if (action === "increase") {
    increaseQuantity(productId);
  }

  if (action === "decrease") {
    decreaseQuantity(productId);
  }

  if (action === "remove") {
    removeFromCart(productId);
  }
});

checkoutForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (cart.length === 0) {
    alert("Please add at least one item to your cart before placing an order.");
    return;
  }

  const totals = getCartTotals();
  const itemCount = getCartCount();

  successMessage.textContent =
    `Thanks ${customerName.value.trim()}! Your pickup order for ${itemCount} item(s) has been placed for ${pickupTime.value}. Total: $${totals.total.toFixed(2)}. We will text updates to ${customerPhone.value.trim()}.`;

  successModal.classList.remove("hidden");

  cart = [];
  saveCart();
  renderCart();
  checkoutForm.reset();
});

closeModalButton.addEventListener("click", closeModal);

successModal.addEventListener("click", (event) => {
  if (event.target === successModal) {
    closeModal();
  }
});

function renderProducts() {
  const filteredProducts = getFilteredProducts();

  productGrid.innerHTML = "";

  if (filteredProducts.length === 0) {
    productGrid.innerHTML = `
      <div class="empty-cart">
        <strong>No items found.</strong>
        <p>Try a different search or category.</p>
      </div>
    `;
    return;
  }

  filteredProducts.forEach((product) => {
    const card = document.createElement("article");
    card.className = "product-card";

    card.innerHTML = `
      <div class="product-image">${product.image}</div>

      <div class="product-content">
        <h3>${product.name}</h3>
        <p>${product.description}</p>

        <div class="product-tags">
          <span class="product-tag">${product.category}</span>
          ${product.tags.map((tag) => `<span class="product-tag">${tag}</span>`).join("")}
        </div>

        <div class="product-footer">
          <span class="price">$${product.price.toFixed(2)}</span>
          <button class="add-button" type="button" data-id="${product.id}">
            Add to Cart
          </button>
        </div>
      </div>
    `;

    const addButton = card.querySelector(".add-button");

    addButton.addEventListener("click", () => {
      addToCart(product.id);
    });

    productGrid.appendChild(card);
  });
}

function getFilteredProducts() {
  const searchTerm = searchInput.value.toLowerCase().trim();
  const selectedCategory = categoryFilter.value;
  const selectedSort = sortSelect.value;

  let filtered = products.filter((product) => {
    const matchesCategory =
      selectedCategory === "All" || product.category === selectedCategory;

    const matchesSearch = `
      ${product.name}
      ${product.description}
      ${product.category}
      ${product.tags.join(" ")}
    `.toLowerCase().includes(searchTerm);

    return matchesCategory && matchesSearch;
  });

  if (selectedSort === "priceLow") {
    filtered.sort((a, b) => a.price - b.price);
  }

  if (selectedSort === "priceHigh") {
    filtered.sort((a, b) => b.price - a.price);
  }

  if (selectedSort === "nameAZ") {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

  return filtered;
}

function addToCart(productId) {
  const existingItem = cart.find((item) => item.id === productId);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: productId,
      quantity: 1
    });
  }

  saveCart();
  renderCart();
}

function increaseQuantity(productId) {
  const item = cart.find((cartItem) => cartItem.id === productId);

  if (!item) {
    return;
  }

  item.quantity += 1;
  saveCart();
  renderCart();
}

function decreaseQuantity(productId) {
  const item = cart.find((cartItem) => cartItem.id === productId);

  if (!item) {
    return;
  }

  item.quantity -= 1;

  if (item.quantity <= 0) {
    cart = cart.filter((cartItem) => cartItem.id !== productId);
  }

  saveCart();
  renderCart();
}

function removeFromCart(productId) {
  cart = cart.filter((cartItem) => cartItem.id !== productId);
  saveCart();
  renderCart();
}

function renderCart() {
  cartItems.innerHTML = "";

  if (cart.length === 0) {
    cartItems.innerHTML = `
      <div class="empty-cart">
        <strong>Your cart is empty.</strong>
        <p>Add restaurant items from the store menu.</p>
      </div>
    `;
  } else {
    cart.forEach((cartItem) => {
      const product = products.find((item) => item.id === cartItem.id);

      if (!product) {
        return;
      }

      const itemTotal = product.price * cartItem.quantity;

      const itemElement = document.createElement("div");
      itemElement.className = "cart-item";

      itemElement.innerHTML = `
        <div class="cart-item-image">${product.image}</div>

        <div>
          <h4>${product.name}</h4>
          <small>$${product.price.toFixed(2)} each</small>

          <div class="quantity-controls">
            <button class="qty-button" type="button" data-action="decrease" data-id="${product.id}">
              -
            </button>

            <span class="qty-number">${cartItem.quantity}</span>

            <button class="qty-button" type="button" data-action="increase" data-id="${product.id}">
              +
            </button>
          </div>
        </div>

        <div>
          <strong>$${itemTotal.toFixed(2)}</strong>

          <button class="remove-button" type="button" data-action="remove" data-id="${product.id}">
            Remove
          </button>
        </div>
      `;

      cartItems.appendChild(itemElement);
    });
  }

  const totals = getCartTotals();

  subtotalText.textContent = `$${totals.subtotal.toFixed(2)}`;
  taxText.textContent = `$${totals.tax.toFixed(2)}`;
  totalText.textContent = `$${totals.total.toFixed(2)}`;
  navCartCount.textContent = getCartCount();
}

function getCartTotals() {
  const subtotal = cart.reduce((sum, cartItem) => {
    const product = products.find((item) => item.id === cartItem.id);

    if (!product) {
      return sum;
    }

    return sum + product.price * cartItem.quantity;
  }, 0);

  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  return {
    subtotal,
    tax,
    total
  };
}

function getCartCount() {
  return cart.reduce((sum, cartItem) => {
    return sum + cartItem.quantity;
  }, 0);
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function loadCart() {
  const savedCart = localStorage.getItem(CART_KEY);

  if (!savedCart) {
    return [];
  }

  try {
    return JSON.parse(savedCart);
  } catch (error) {
    console.error("Could not load cart:", error);
    return [];
  }
}

function closeModal() {
  successModal.classList.add("hidden");
}

function escapeHTML(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
