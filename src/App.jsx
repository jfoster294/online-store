import { useEffect, useMemo, useRef, useState } from "react";
import { defaultMenuItems } from "./data/menuData";

const TAX_RATE = 0.065;
const CART_KEY = "smokehouseReactCart";
const ORDERS_KEY = "smokehouseReactOrders";
const MENU_KEY = "smokehouseReactMenuItems";

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

const emptyCheckoutForm = {
  name: "",
  phone: "",
  email: "",
  pickupTime: "",
  orderType: "Pickup",
  notes: ""
};

const emptyMenuForm = {
  id: "",
  name: "",
  category: "",
  price: "",
  description: "",
  image: "",
  icon: "🔥"
};

const categories = [
  "All",
  "Plates",
  "Sandwiches",
  "Family Packs",
  "Sides",
  "Drinks",
  "Desserts"
];

const orderStatuses = ["New", "Preparing", "Ready", "Completed"];

function App() {
  const fileInputRef = useRef(null);

  const [currentRole, setCurrentRole] = useState(null);
  const [activeView, setActiveView] = useState("customerStore");
  const [loginMessage, setLoginMessage] = useState("");

  const [menuItems, setMenuItems] = useState(() => {
    return loadFromStorage(MENU_KEY, defaultMenuItems);
  });

  const [cart, setCart] = useState(() => {
    return loadFromStorage(CART_KEY, []);
  });

  const [orders, setOrders] = useState(() => {
    return loadFromStorage(ORDERS_KEY, getDemoOrders());
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [checkoutForm, setCheckoutForm] = useState(emptyCheckoutForm);

  const [menuForm, setMenuForm] = useState(emptyMenuForm);
  const [menuImagePreview, setMenuImagePreview] = useState("");

  const [orderFilter, setOrderFilter] = useState("All");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [uploadFiles, setUploadFiles] = useState([]);
  const [toast, setToast] = useState("");

  useEffect(() => {
    saveToStorage(MENU_KEY, menuItems);
  }, [menuItems]);

  useEffect(() => {
    saveToStorage(CART_KEY, cart);
  }, [cart]);

  useEffect(() => {
    saveToStorage(ORDERS_KEY, orders);
  }, [orders]);

  useEffect(() => {
    if (!selectedInvoiceId && orders.length > 0) {
      setSelectedInvoiceId(orders[0].id);
    }
  }, [orders, selectedInvoiceId]);

  const cartEntries = useMemo(() => {
    return cart
      .map((entry) => {
        const item = menuItems.find((menuItem) => menuItem.id === entry.id);

        if (!item) {
          return null;
        }

        return {
          ...entry,
          item,
          lineTotal: item.price * entry.quantity
        };
      })
      .filter(Boolean);
  }, [cart, menuItems]);

  const cartTotals = useMemo(() => {
    return getCartTotals(cart, menuItems);
  }, [cart, menuItems]);

  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const filteredMenuItems = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    return menuItems.filter((item) => {
      const matchesCategory = categoryFilter === "All" || item.category === categoryFilter;

      const matchesSearch = `
        ${item.name}
        ${item.category}
        ${item.description}
      `
        .toLowerCase()
        .includes(search);

      return matchesCategory && matchesSearch;
    });
  }, [menuItems, searchTerm, categoryFilter]);

  const topItems = useMemo(() => {
    return getTopItems(orders);
  }, [orders]);

  const adminStats = useMemo(() => {
    const revenue = orders.reduce((sum, order) => sum + order.total, 0);
    const average = orders.length ? revenue / orders.length : 0;
    const best = topItems[0];

    return {
      revenue,
      orderCount: orders.length,
      average,
      bestSeller: best ? best.name : "None"
    };
  }, [orders, topItems]);

  const statusCounts = useMemo(() => {
    return orderStatuses.reduce((result, status) => {
      result[status] = orders.filter((order) => order.status === status).length;
      return result;
    }, {});
  }, [orders]);

  const revenueData = useMemo(() => {
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

    return { entries, max };
  }, [orders]);

  const categoryData = useMemo(() => {
    const categoryMap = {};

    orders.forEach((order) => {
      order.items.forEach((item) => {
        categoryMap[item.category] = (categoryMap[item.category] || 0) + item.quantity;
      });
    });

    const entries = Object.entries(categoryMap);
    const max = Math.max(...entries.map((entry) => entry[1]), 1);

    return { entries, max };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (orderFilter === "All") {
      return orders;
    }

    return orders.filter((order) => order.status === orderFilter);
  }, [orders, orderFilter]);

  const selectedInvoice = useMemo(() => {
    return orders.find((order) => order.id === selectedInvoiceId) || orders[0] || null;
  }, [orders, selectedInvoiceId]);

  function showToast(message) {
    setToast(message);

    setTimeout(() => {
      setToast((currentToast) => {
        return currentToast === message ? "" : currentToast;
      });
    }, 2600);
  }

  function loginAs(role) {
    setCurrentRole(role);
    setLoginMessage("");

    if (role === "customer") {
      setActiveView("customerStore");
    } else {
      setActiveView("adminDashboard");
    }

    showToast(`${role === "admin" ? "Admin" : "Customer"} demo loaded.`);
  }

  function handleLogin(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email")).trim();
    const password = String(formData.get("password")).trim();

    const foundUser = Object.values(users).find((user) => {
      return user.email === email && user.password === password;
    });

    if (!foundUser) {
      setLoginMessage("Invalid demo login.");
      return;
    }

    loginAs(foundUser.role);
    event.currentTarget.reset();
  }

  function logout() {
    setCurrentRole(null);
    setActiveView("customerStore");
    setLoginMessage("");
  }

   function addToCart(id) {
    setCart((currentCart) => {
      const existing = currentCart.find((item) => item.id === id);

      if (existing) {
        return currentCart.map((item) => {
          return item.id === id ? { ...item, quantity: item.quantity + 1 } : item;
        });
      }

      return [...currentCart, { id, quantity: 1 }];
    });

    showToast("Added to cart.");
  }

  function increaseQuantity(id) {
    setCart((currentCart) => {
      return currentCart.map((item) => {
        return item.id === id ? { ...item, quantity: item.quantity + 1 } : item;
      });
    });
  }

  function decreaseQuantity(id) {
    setCart((currentCart) => {
      return currentCart
        .map((item) => {
          return item.id === id ? { ...item, quantity: item.quantity - 1 } : item;
        })
        .filter((item) => item.quantity > 0);
    });
  }

  function removeFromCart(id) {
    setCart((currentCart) => {
      return currentCart.filter((item) => item.id !== id);
    });
  }

  function clearCart() {
    setCart([]);
    showToast("Cart cleared.");
  }

  function openCheckout() {
    if (cart.length === 0) {
      showToast("Add at least one item before checkout.");
      return;
    }

    setCheckoutStep(1);
    setCheckoutOpen(true);
  }

  function updateCheckoutField(field, value) {
    setCheckoutForm((currentForm) => {
      return {
        ...currentForm,
        [field]: value
      };
    });
  }

  function validateCheckoutStep() {
    if (checkoutStep === 1) {
      if (!checkoutForm.name.trim() || !checkoutForm.phone.trim() || !checkoutForm.email.trim()) {
        showToast("Fill out customer info first.");
        return false;
      }
    }

    if (checkoutStep === 2) {
      if (!checkoutForm.pickupTime) {
        showToast("Choose a pickup time.");
        return false;
      }
    }

    return true;
  }

  function goToNextCheckoutStep() {
    if (!validateCheckoutStep()) {
      return;
    }

    if (checkoutStep < 3) {
      setCheckoutStep((currentStep) => currentStep + 1);
    }
  }

  function goToPreviousCheckoutStep() {
    if (checkoutStep > 1) {
      setCheckoutStep((currentStep) => currentStep - 1);
    }
  }

  function placeOrder(event) {
    event.preventDefault();

    if (cartEntries.length === 0) {
      showToast("Your cart is empty.");
      return;
    }

    if (!validateCheckoutStep()) {
      return;
    }

    const newOrder = {
      id: createOrderId(orders),
      customer: {
        name: checkoutForm.name.trim(),
        phone: checkoutForm.phone.trim(),
        email: checkoutForm.email.trim()
      },
      pickupTime: checkoutForm.pickupTime,
      orderType: checkoutForm.orderType,
      notes: checkoutForm.notes.trim(),
      items: cartEntries.map((entry) => {
        return {
          id: entry.item.id,
          name: entry.item.name,
          category: entry.item.category,
          price: entry.item.price,
          quantity: entry.quantity
        };
      }),
      subtotal: cartTotals.subtotal,
      tax: cartTotals.tax,
      total: cartTotals.total,
      status: "New",
      date: new Date().toISOString()
    };

    setOrders((currentOrders) => [newOrder, ...currentOrders]);
    setCart([]);
    setCheckoutForm(emptyCheckoutForm);
    setCheckoutOpen(false);
    setCheckoutStep(1);
    setSelectedInvoiceId(newOrder.id);

    showToast(`${newOrder.id} placed successfully.`);
  }

  function updateOrderStatus(orderId, status) {
    setOrders((currentOrders) => {
      return currentOrders.map((order) => {
        return order.id === orderId ? { ...order, status } : order;
      });
    });

    showToast(`${orderId} updated.`);
  }

  function exportOrdersCSV() {
    const rows = ["orderId,customer,email,pickupTime,total,status,date"];

    orders.forEach((order) => {
      rows.push([
        order.id,
        csvSafe(order.customer.name),
        csvSafe(order.customer.email),
        csvSafe(order.pickupTime),
        order.total.toFixed(2),
        order.status,
        order.date
      ].join(","));
    });

    downloadFile("smokehouse-orders.csv", rows.join("\n"), "text/csv");
    showToast("Orders CSV exported.");
  }

  function updateMenuForm(field, value) {
    setMenuForm((currentForm) => {
      return {
        ...currentForm,
        [field]: value
      };
    });
  }

  function handleMenuImageChange(event) {
    const file = event.target.files[0];

    if (!file) {
      setMenuImagePreview("");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const imageData = reader.result;

      setMenuForm((currentForm) => {
        return {
          ...currentForm,
          image: imageData
        };
      });

      setMenuImagePreview(imageData);
    };

    reader.readAsDataURL(file);
  }

  function saveMenuItem(event) {
    event.preventDefault();

    const editingId = menuForm.id ? Number(menuForm.id) : null;

    const itemData = {
      id: editingId || Date.now(),
      name: menuForm.name.trim(),
      category: menuForm.category,
      price: Number(menuForm.price),
      icon: menuForm.icon || "🔥",
      image: menuForm.image || "",
      description: menuForm.description.trim()
    };

    if (!itemData.name || !itemData.category || !itemData.price || !itemData.description) {
      showToast("Fill out the full menu item form.");
      return;
    }

    if (editingId) {
      setMenuItems((currentItems) => {
        return currentItems.map((item) => {
          return item.id === editingId ? itemData : item;
        });
      });

      showToast("Menu item updated.");
    } else {
      setMenuItems((currentItems) => [itemData, ...currentItems]);
      showToast("Menu item added.");
    }

    resetMenuForm();
  }

  function editMenuItem(item) {
    setMenuForm({
      id: String(item.id),
      name: item.name,
      category: item.category,
      price: String(item.price),
      description: item.description,
      image: item.image || "",
      icon: item.icon || "🔥"
    });

    setMenuImagePreview(item.image || "");
    setActiveView("adminMenu");
    showToast("Editing menu item.");
  }

  function deleteMenuItem(id) {
    const item = menuItems.find((menuItem) => menuItem.id === id);

    if (!item) {
      return;
    }

    const confirmed = window.confirm(`Delete ${item.name} from the menu?`);

    if (!confirmed) {
      return;
    }

    setMenuItems((currentItems) => {
      return currentItems.filter((menuItem) => menuItem.id !== id);
    });

    setCart((currentCart) => {
      return currentCart.filter((cartItem) => cartItem.id !== id);
    });

    showToast("Menu item deleted.");
  }

  function resetMenuForm() {
    setMenuForm(emptyMenuForm);
    setMenuImagePreview("");
  }

   function handleUploadFiles(fileList) {
    const files = Array.from(fileList).map((file) => {
      return {
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        name: file.name,
        type: file.type || "Unknown type",
        size: file.size,
        url: URL.createObjectURL(file),
        isImage: file.type.startsWith("image/"),
        isVideo: file.type.startsWith("video/")
      };
    });

    setUploadFiles((currentFiles) => [...currentFiles, ...files]);
  }

  function removeUpload(id) {
    setUploadFiles((currentFiles) => {
      return currentFiles.filter((file) => file.id !== id);
    });
  }

  function clearUploads() {
    setUploadFiles([]);
    showToast("Uploads cleared.");
  }

  function markFilesReady() {
    if (uploadFiles.length === 0) {
      showToast("Add files first.");
      return;
    }

    showToast(`${uploadFiles.length} file(s) ready for upload.`);
  }

  return (
    <>
      <div className="page-glow"></div>

      {!currentRole ? (
        <AuthView
          onLogin={handleLogin}
          onDemoLogin={loginAs}
          loginMessage={loginMessage}
        />
      ) : (
        <div className="app-view">
          <AppHeader
            role={currentRole}
            roleLabel={users[currentRole].label}
            activeView={activeView}
            onViewChange={setActiveView}
            onLogout={logout}
            cartCount={cartCount}
          />

          <main className="main-shell">
            <div className="demo-banner">
              <strong>Front-End Demo App</strong>
              <span>
                React state, role-based views, localStorage, checkout, admin tools,
                CSV export, and file previews.
              </span>
            </div>

            {currentRole === "customer" && activeView === "customerStore" && (
              <CustomerStore
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
                filteredMenuItems={filteredMenuItems}
                onAddToCart={addToCart}
              />
            )}

            {currentRole === "customer" && activeView === "customerCart" && (
              <CustomerCart
                cartEntries={cartEntries}
                cartTotals={cartTotals}
                onIncrease={increaseQuantity}
                onDecrease={decreaseQuantity}
                onRemove={removeFromCart}
                onClearCart={clearCart}
                onStartCheckout={openCheckout}
                onContinueShopping={() => setActiveView("customerStore")}
              />
            )}

            {currentRole === "admin" && activeView === "adminDashboard" && (
              <AdminDashboard
                adminStats={adminStats}
                statusCounts={statusCounts}
                revenueData={revenueData}
                categoryData={categoryData}
                topItems={topItems}
              />
            )}

            {currentRole === "admin" && activeView === "adminOrders" && (
              <AdminOrders
                orders={filteredOrders}
                orderFilter={orderFilter}
                setOrderFilter={setOrderFilter}
                onStatusChange={updateOrderStatus}
                onExportOrders={exportOrdersCSV}
              />
            )}

            {currentRole === "admin" && activeView === "adminMenu" && (
              <AdminMenu
                menuItems={menuItems}
                menuForm={menuForm}
                menuImagePreview={menuImagePreview}
                onFormChange={updateMenuForm}
                onImageChange={handleMenuImageChange}
                onSaveMenuItem={saveMenuItem}
                onResetMenuForm={resetMenuForm}
                onEditMenuItem={editMenuItem}
                onDeleteMenuItem={deleteMenuItem}
              />
            )}

            {currentRole === "admin" && activeView === "adminInvoice" && (
              <AdminInvoice
                orders={orders}
                selectedInvoiceId={selectedInvoiceId}
                setSelectedInvoiceId={setSelectedInvoiceId}
                selectedInvoice={selectedInvoice}
              />
            )}

            {currentRole === "admin" && activeView === "adminUploads" && (
              <AdminUploads
                uploadFiles={uploadFiles}
                fileInputRef={fileInputRef}
                onUploadFiles={handleUploadFiles}
                onRemoveUpload={removeUpload}
                onClearUploads={clearUploads}
                onMarkFilesReady={markFilesReady}
              />
            )}
          </main>
        </div>
      )}

      {checkoutOpen && (
        <CheckoutModal
          checkoutStep={checkoutStep}
          checkoutForm={checkoutForm}
          cartEntries={cartEntries}
          cartTotals={cartTotals}
          onClose={() => setCheckoutOpen(false)}
          onPrevious={goToPreviousCheckoutStep}
          onNext={goToNextCheckoutStep}
          onPlaceOrder={placeOrder}
          onFieldChange={updateCheckoutField}
        />
      )}

      <Toast message={toast} />
    </>
  );
}


function AuthView({ onLogin, onDemoLogin, loginMessage }) {
  return (
    <section className="auth-view">
      <div className="auth-card">
        <div className="brand-mark">🔥</div>

        <p className="eyebrow">Premium BBQ Restaurant System</p>
        <h1>SmokeHouse OS</h1>

        <p className="auth-copy">
          Customer ordering, multi-step checkout, admin analytics, menu management,
          invoices, order management, CSV export, and file upload previews in one React app.
        </p>

        <form className="login-form" onSubmit={onLogin}>
          <label htmlFor="emailInput">Email</label>
          <input
            id="emailInput"
            name="email"
            type="email"
            placeholder="admin@test.com"
            required
          />

          <label htmlFor="passwordInput">Password</label>
          <input
            id="passwordInput"
            name="password"
            type="password"
            placeholder="admin123"
            required
          />

          <button type="submit">Login</button>

          <p className="login-message">{loginMessage}</p>
        </form>

        <div className="demo-logins">
          <button
            className="demo-button"
            type="button"
            onClick={() => onDemoLogin("customer")}
          >
            Customer Demo
          </button>

          <button
            className="demo-button"
            type="button"
            onClick={() => onDemoLogin("admin")}
          >
            Admin Demo
          </button>
        </div>

        <div className="credentials">
          <p><strong>Customer:</strong> customer@test.com / customer123</p>
          <p><strong>Admin:</strong> admin@test.com / admin123</p>
        </div>
      </div>
    </section>
  );
}

function AppHeader({ role, roleLabel, activeView, onViewChange, onLogout, cartCount }) {
  const customerViews = [
    { id: "customerStore", label: "Menu" },
    { id: "customerCart", label: "Cart", badge: cartCount }
  ];

  const adminViews = [
    { id: "adminDashboard", label: "Dashboard" },
    { id: "adminOrders", label: "Orders" },
    { id: "adminMenu", label: "Menu Manager" },
    { id: "adminInvoice", label: "Invoices" },
    { id: "adminUploads", label: "Uploads" }
  ];

  const views = role === "customer" ? customerViews : adminViews;

  return (
    <header className="app-header">
      <div className="brand">
        <div className="brand-icon">🔥</div>

        <div>
          <h1>SmokeHouse OS</h1>
          <p>{roleLabel}</p>
        </div>
      </div>

      <nav className="app-nav">
        {views.map((view) => (
          <button
            key={view.id}
            className={`nav-button ${activeView === view.id ? "active" : ""}`}
            type="button"
            onClick={() => onViewChange(view.id)}
          >
            {view.label}
            {typeof view.badge === "number" && <span>{view.badge}</span>}
          </button>
        ))}
      </nav>

      <button className="logout-button" type="button" onClick={onLogout}>
        Logout
      </button>
    </header>
  );
}

function CustomerStore({
  searchTerm,
  setSearchTerm,
  categoryFilter,
  setCategoryFilter,
  filteredMenuItems,
  onAddToCart
}) {
  return (
    <section className="view active">
      <div className="hero">
        <div>
          <p className="eyebrow">Premium BBQ Pickup</p>
          <h2>Slow-smoked BBQ. Fast online ordering.</h2>
          <p>
            Order brisket, ribs, pulled pork, sides, drinks, and family packs
            through a clean customer checkout flow.
          </p>
        </div>

        <div className="hero-feature">
          <span>Today’s Special</span>
          <strong>Brisket Plate</strong>
          <p>Oak-smoked brisket, two sides, pickles, onions, and house sauce.</p>
        </div>
      </div>

      <div className="store-controls">
        <div className="search-box">
          <label htmlFor="searchInput">Search Menu</label>
          <input
            id="searchInput"
            type="text"
            placeholder="Search brisket, ribs, sides..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <div className="filter-box">
          <label htmlFor="categoryFilter">Category</label>
          <select
            id="categoryFilter"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === "All" ? "All Categories" : category}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="menu-grid">
        {filteredMenuItems.length === 0 ? (
          <EmptyState message="No menu items match your search." />
        ) : (
          filteredMenuItems.map((item) => (
            <article className="menu-card" key={item.id}>
              <div className="menu-image">
                {item.image ? (
                  <img className="food-photo" src={item.image} alt={item.name} />
                ) : (
                  item.icon || "🔥"
                )}
              </div>

              <div className="menu-content">
                <span className="menu-tag">{item.category}</span>
                <h3>{item.name}</h3>
                <p>{item.description}</p>

                <div className="menu-footer">
                  <span className="price">{formatCurrency(item.price)}</span>

                  <button
                    className="add-button"
                    type="button"
                    onClick={() => onAddToCart(item.id)}
                  >
                    Add
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function CustomerCart({
  cartEntries,
  cartTotals,
  onIncrease,
  onDecrease,
  onRemove,
  onClearCart,
  onStartCheckout,
  onContinueShopping
}) {
  return (
    <section className="view active">
      <div className="section-heading">
        <p className="eyebrow">Customer Checkout</p>
        <h2>Your BBQ Order</h2>
        <p>Review your tray before starting the multi-step checkout.</p>
      </div>

      <div className="cart-layout">
        <div className="cart-card">
          <div className="cart-header">
            <h3>Cart Items</h3>

            <button type="button" onClick={onClearCart}>
              Clear Cart
            </button>
          </div>

          <div className="cart-items">
            {cartEntries.length === 0 ? (
              <EmptyState message="Your cart is empty." />
            ) : (
              cartEntries.map((entry) => (
                <div className="cart-item" key={entry.item.id}>
                  <div className="cart-item-icon">
                    {entry.item.image ? (
                      <img src={entry.item.image} alt={entry.item.name} />
                    ) : (
                      entry.item.icon || "🔥"
                    )}
                  </div>

                  <div>
                    <h4>{entry.item.name}</h4>
                    <small>{formatCurrency(entry.item.price)} each</small>

                    <div className="qty-controls">
                      <button
                        className="qty-button"
                        type="button"
                        onClick={() => onDecrease(entry.item.id)}
                      >
                        -
                      </button>

                      <strong>{entry.quantity}</strong>

                      <button
                        className="qty-button"
                        type="button"
                        onClick={() => onIncrease(entry.item.id)}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <strong>{formatCurrency(entry.lineTotal)}</strong>

                    <button
                      className="remove-button"
                      type="button"
                      onClick={() => onRemove(entry.item.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <aside className="summary-card">
          <h3>Order Summary</h3>

          <div className="summary-line">
            <span>Subtotal</span>
            <strong>{formatCurrency(cartTotals.subtotal)}</strong>
          </div>

          <div className="summary-line">
            <span>Tax 6.5%</span>
            <strong>{formatCurrency(cartTotals.tax)}</strong>
          </div>

          <div className="summary-line total-line">
            <span>Total</span>
            <strong>{formatCurrency(cartTotals.total)}</strong>
          </div>

          <button
            className="primary-action"
            type="button"
            disabled={cartEntries.length === 0}
            onClick={onStartCheckout}
          >
            Start Checkout
          </button>

          <button
            className="secondary-action full-width-gap"
            type="button"
            onClick={onContinueShopping}
          >
            Continue Shopping
          </button>
        </aside>
      </div>
    </section>
  );
}

function CheckoutModal({
  checkoutStep,
  checkoutForm,
  cartEntries,
  cartTotals,
  onClose,
  onPrevious,
  onNext,
  onPlaceOrder,
  onFieldChange
}) {
  return (
    <div className="modal">
      <div className="checkout-card">
        <div className="checkout-header">
          <div>
            <p className="eyebrow">Multi-Step Checkout</p>
            <h2>Place Pickup Order</h2>
          </div>

          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="step-track">
          {[1, 2, 3].map((step) => (
            <span
              key={step}
              className={`step-dot ${checkoutStep === step ? "active" : ""}`}
            >
              {step}
            </span>
          ))}
        </div>

        <form onSubmit={onPlaceOrder}>
          {checkoutStep === 1 && (
            <div className="checkout-step active">
              <h3>Customer Info</h3>

              <label htmlFor="customerName">Name</label>
              <input
                id="customerName"
                type="text"
                placeholder="Your name"
                value={checkoutForm.name}
                onChange={(event) => onFieldChange("name", event.target.value)}
                required
              />

              <label htmlFor="customerPhone">Phone</label>
              <input
                id="customerPhone"
                type="tel"
                placeholder="(555) 123-4567"
                value={checkoutForm.phone}
                onChange={(event) => onFieldChange("phone", event.target.value)}
                required
              />

              <label htmlFor="customerEmail">Email</label>
              <input
                id="customerEmail"
                type="email"
                placeholder="you@email.com"
                value={checkoutForm.email}
                onChange={(event) => onFieldChange("email", event.target.value)}
                required
              />
            </div>
          )}

          {checkoutStep === 2 && (
            <div className="checkout-step active">
              <h3>Pickup Details</h3>

              <label htmlFor="pickupTime">Pickup Time</label>
              <select
                id="pickupTime"
                value={checkoutForm.pickupTime}
                onChange={(event) => onFieldChange("pickupTime", event.target.value)}
                required
              >
                <option value="">Choose pickup time</option>
                <option>Today, 5:30 PM</option>
                <option>Today, 6:00 PM</option>
                <option>Today, 6:30 PM</option>
                <option>Today, 7:00 PM</option>
                <option>Today, 7:30 PM</option>
                <option>Today, 8:00 PM</option>
              </select>

              <label htmlFor="orderType">Order Type</label>
              <select
                id="orderType"
                value={checkoutForm.orderType}
                onChange={(event) => onFieldChange("orderType", event.target.value)}
                required
              >
                <option>Pickup</option>
                <option>Dine-In</option>
              </select>

              <label htmlFor="orderNotes">Special Instructions</label>
              <textarea
                id="orderNotes"
                rows="4"
                placeholder="Extra sauce, no onions, allergies, etc."
                value={checkoutForm.notes}
                onChange={(event) => onFieldChange("notes", event.target.value)}
              ></textarea>
            </div>
          )}

          {checkoutStep === 3 && (
            <div className="checkout-step active">
              <h3>Review Order</h3>

              <div className="checkout-review">
                <div className="summary-line">
                  <span>Name</span>
                  <strong>{checkoutForm.name}</strong>
                </div>

                <div className="summary-line">
                  <span>Pickup</span>
                  <strong>{checkoutForm.pickupTime}</strong>
                </div>

                {cartEntries.map((entry) => (
                  <div className="summary-line" key={entry.item.id}>
                    <span>
                      {entry.item.name} x{entry.quantity}
                    </span>
                    <strong>{formatCurrency(entry.lineTotal)}</strong>
                  </div>
                ))}

                <div className="summary-line total-line">
                  <span>Total</span>
                  <strong>{formatCurrency(cartTotals.total)}</strong>
                </div>
              </div>
            </div>
          )}

          <div className="checkout-actions">
            {checkoutStep > 1 && (
              <button className="secondary-action" type="button" onClick={onPrevious}>
                Back
              </button>
            )}

            {checkoutStep < 3 && (
              <button className="primary-action" type="button" onClick={onNext}>
                Continue
              </button>
            )}

            {checkoutStep === 3 && (
              <button className="primary-action" type="submit">
                Place Order
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function AdminDashboard({ adminStats, statusCounts, revenueData, categoryData, topItems }) {
  return (
    <section className="view active">
      <div className="section-heading">
        <p className="eyebrow">Admin Dashboard</p>
        <h2>SmokeHouse Analytics</h2>
        <p>Track revenue, orders, best sellers, and category performance.</p>
      </div>

      <div className="stats-grid">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(adminStats.revenue)}
          caption="All orders in the system"
        />

        <StatCard
          title="Total Orders"
          value={adminStats.orderCount}
          caption="Orders stored locally"
        />

        <StatCard
          title="Average Order"
          value={formatCurrency(adminStats.average)}
          caption="Average customer spend"
        />

        <StatCard
          title="Best Seller"
          value={adminStats.bestSeller}
          caption="Top item by quantity"
        />
      </div>

      <div className="status-grid">
        {orderStatuses.map((status) => (
          <article className="status-card" key={status}>
            <span>{status}</span>
            <strong>{statusCounts[status] || 0}</strong>
          </article>
        ))}
      </div>

      <div className="dashboard-grid">
        <article className="panel-card">
          <div className="panel-header">
            <h3>Revenue by Day</h3>
          </div>

          <div className="bar-chart">
            {revenueData.entries.length === 0 ? (
              <EmptyState message="No revenue data yet." />
            ) : (
              revenueData.entries.map(([day, total]) => (
                <div className="bar-row" key={day}>
                  <div className="bar-row-top">
                    <span>{day}</span>
                    <strong>{formatCurrency(total)}</strong>
                  </div>

                  <div className="track">
                    <div
                      className="fill"
                      style={{ width: `${(total / revenueData.max) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="panel-card">
          <div className="panel-header">
            <h3>Orders by Category</h3>
          </div>

          <div className="horizontal-chart">
            {categoryData.entries.length === 0 ? (
              <EmptyState message="No category data yet." />
            ) : (
              categoryData.entries.map(([category, quantity]) => (
                <div className="horizontal-row" key={category}>
                  <div className="horizontal-row-top">
                    <span>{category}</span>
                    <strong>{quantity} sold</strong>
                  </div>

                  <div className="track">
                    <div
                      className="fill"
                      style={{ width: `${(quantity / categoryData.max) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="panel-card">
          <div className="panel-header">
            <h3>Top Items</h3>
          </div>

          <div className="top-list">
            {topItems.length === 0 ? (
              <EmptyState message="No top sellers yet." />
            ) : (
              topItems.slice(0, 5).map((item, index) => (
                <div className="top-item" key={item.name}>
                  <span>
                    {index + 1}. {item.name}
                  </span>
                  <strong>{item.quantity} sold</strong>
                </div>
              ))
            )}
          </div>
        </article>
      </div>
    </section>
  );
}

function StatCard({ title, value, caption }) {
  return (
    <article className="stat-card">
      <span>{title}</span>
      <strong>{value}</strong>
      <p>{caption}</p>
    </article>
  );
}

function AdminOrders({
  orders,
  orderFilter,
  setOrderFilter,
  onStatusChange,
  onExportOrders
}) {
  return (
    <section className="view active">
      <div className="section-heading">
        <p className="eyebrow">Order Management</p>
        <h2>All Orders</h2>
        <p>View customer orders, filter by status, update progress, and export order data.</p>
      </div>

      <div className="admin-actions">
        {["All", ...orderStatuses].map((status) => (
          <button
            key={status}
            className={`secondary-action ${orderFilter === status ? "filter-active" : ""}`}
            type="button"
            onClick={() => setOrderFilter(status)}
          >
            {status}
          </button>
        ))}

        <button className="primary-action" type="button" onClick={onExportOrders}>
          Export Orders CSV
        </button>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Pickup</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>

          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan="6">No orders match this filter.</td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.customer.name}</td>
                  <td>{order.pickupTime}</td>
                  <td>{formatCurrency(order.total)}</td>
                  <td>
                    <select
                      className="status-select"
                      value={order.status}
                      onChange={(event) => onStatusChange(order.id, event.target.value)}
                    >
                      {orderStatuses.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                  </td>
                  <td>{formatDate(order.date)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AdminMenu({
  menuItems,
  menuForm,
  menuImagePreview,
  onFormChange,
  onImageChange,
  onSaveMenuItem,
  onResetMenuForm,
  onEditMenuItem,
  onDeleteMenuItem
}) {
  const isEditing = Boolean(menuForm.id);

  return (
    <section className="view active">
      <div className="section-heading">
        <p className="eyebrow">Menu Management</p>
        <h2>Edit BBQ Menu</h2>
        <p>Add, remove, and update menu items shown to customers.</p>
      </div>

      <div className="menu-manager-layout">
        <form className="panel-card menu-manager-form" onSubmit={onSaveMenuItem}>
          <label htmlFor="menuNameInput">Item Name</label>
          <input
            id="menuNameInput"
            type="text"
            placeholder="Brisket Plate"
            value={menuForm.name}
            onChange={(event) => onFormChange("name", event.target.value)}
            required
          />

          <label htmlFor="menuCategoryInput">Category</label>
          <select
            id="menuCategoryInput"
            value={menuForm.category}
            onChange={(event) => onFormChange("category", event.target.value)}
            required
          >
            <option value="">Choose category</option>

            {categories
              .filter((category) => category !== "All")
              .map((category) => (
                <option key={category}>{category}</option>
              ))}
          </select>

          <label htmlFor="menuPriceInput">Price</label>
          <input
            id="menuPriceInput"
            type="number"
            step="0.01"
            min="0"
            placeholder="18.99"
            value={menuForm.price}
            onChange={(event) => onFormChange("price", event.target.value)}
            required
          />

          <label htmlFor="menuDescriptionInput">Description</label>
          <textarea
            id="menuDescriptionInput"
            rows="5"
            placeholder="Describe the menu item..."
            value={menuForm.description}
            onChange={(event) => onFormChange("description", event.target.value)}
            required
          ></textarea>

          <label htmlFor="menuImageInput">Menu Image</label>
          <input
            id="menuImageInput"
            type="file"
            accept="image/*"
            onChange={onImageChange}
          />

          <div className="menu-image-preview">
            {menuImagePreview ? (
              <img src={menuImagePreview} alt="Menu item preview" />
            ) : (
              "No image selected"
            )}
          </div>

          <div className="menu-form-actions">
            <button className="primary-action" type="submit">
              {isEditing ? "Update Menu Item" : "Add Menu Item"}
            </button>

            {isEditing && (
              <button
                className="secondary-action"
                type="button"
                onClick={onResetMenuForm}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>

        <div className="panel-card">
          <div className="panel-header">
            <h3>Current Menu Items</h3>
          </div>

          <div className="manager-menu-list">
            {menuItems.length === 0 ? (
              <EmptyState message="No menu items yet." />
            ) : (
              menuItems.map((item) => (
                <article className="manager-menu-card" key={item.id}>
                  <div className="manager-menu-preview">
                    {item.image ? (
                      <img src={item.image} alt={item.name} />
                    ) : (
                      item.icon || "🔥"
                    )}
                  </div>

                  <div>
                    <h4>{item.name}</h4>
                    <p>{item.description}</p>

                    <div className="manager-menu-meta">
                      <span>{item.category}</span>
                      <span>{formatCurrency(item.price)}</span>
                    </div>
                  </div>

                  <div className="manager-menu-actions">
                    <button
                      className="edit-menu-button"
                      type="button"
                      onClick={() => onEditMenuItem(item)}
                    >
                      Edit
                    </button>

                    <button
                      className="delete-menu-button"
                      type="button"
                      onClick={() => onDeleteMenuItem(item.id)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function AdminInvoice({
  orders,
  selectedInvoiceId,
  setSelectedInvoiceId,
  selectedInvoice
}) {
  return (
    <section className="view active">
      <div className="section-heading">
        <p className="eyebrow">Invoice Generator</p>
        <h2>Order Receipt</h2>
        <p>Select an order and generate a clean printable receipt.</p>
      </div>

      <div className="invoice-layout">
        <div className="panel-card">
          <label htmlFor="invoiceSelect">Choose Order</label>

          <select
            id="invoiceSelect"
            value={selectedInvoiceId}
            onChange={(event) => setSelectedInvoiceId(event.target.value)}
          >
            {orders.length === 0 ? (
              <option>No orders available</option>
            ) : (
              orders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.id} - {order.customer.name}
                </option>
              ))
            )}
          </select>

          <button
            className="primary-action"
            type="button"
            onClick={() => window.print()}
          >
            Print Invoice
          </button>
        </div>

        <div id="invoicePreview" className="invoice-preview">
          {!selectedInvoice ? (
            <p>No invoice available yet.</p>
          ) : (
            <>
              <h3>SmokeHouse OS</h3>

              <p>
                <strong>Receipt:</strong> {selectedInvoice.id}
              </p>

              <p>
                <strong>Customer:</strong> {selectedInvoice.customer.name}
              </p>

              <p>
                <strong>Phone:</strong> {selectedInvoice.customer.phone}
              </p>

              <p>
                <strong>Email:</strong> {selectedInvoice.customer.email}
              </p>

              <p>
                <strong>Pickup:</strong> {selectedInvoice.pickupTime}
              </p>

              <p>
                <strong>Status:</strong> {selectedInvoice.status}
              </p>

              <br />

              {selectedInvoice.items.map((item) => (
                <div
                  className="invoice-line"
                  key={`${selectedInvoice.id}-${item.id}`}
                >
                  <span>
                    {item.name} x{item.quantity}
                  </span>

                  <strong>{formatCurrency(item.price * item.quantity)}</strong>
                </div>
              ))}

              <br />

              <div className="invoice-line">
                <span>Subtotal</span>
                <strong>{formatCurrency(selectedInvoice.subtotal)}</strong>
              </div>

              <div className="invoice-line">
                <span>Tax</span>
                <strong>{formatCurrency(selectedInvoice.tax)}</strong>
              </div>

              <div className="invoice-line">
                <span>Total</span>
                <strong>{formatCurrency(selectedInvoice.total)}</strong>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function AdminUploads({
  uploadFiles,
  fileInputRef,
  onUploadFiles,
  onRemoveUpload,
  onClearUploads,
  onMarkFilesReady
}) {
  function handleDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove("dragging");
    onUploadFiles(event.dataTransfer.files);
  }

  return (
    <section className="view active">
      <div className="section-heading">
        <p className="eyebrow">File Upload Preview</p>
        <h2>Admin Uploads</h2>
        <p>Preview menu images, receipts, vendor invoices, or documents before upload.</p>
      </div>

      <div
        className="drop-zone"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          event.currentTarget.classList.add("dragging");
        }}
        onDragLeave={(event) => {
          event.currentTarget.classList.remove("dragging");
        }}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          onChange={(event) => {
            onUploadFiles(event.target.files);
            event.target.value = "";
          }}
        />

        <div>
          <strong>Drag files here</strong>
          <p>or click to browse files</p>
        </div>
      </div>

      <div className="admin-actions">
        <button className="secondary-action" type="button" onClick={onClearUploads}>
          Clear Uploads
        </button>

        <button className="primary-action" type="button" onClick={onMarkFilesReady}>
          Mark Files Ready
        </button>
      </div>

      <div className="upload-grid">
        {uploadFiles.length === 0 ? (
          <EmptyState message="No files selected yet." />
        ) : (
          uploadFiles.map((file) => (
            <article className="upload-card" key={file.id}>
              <div className="upload-preview">
                {file.isImage && <img src={file.url} alt={`${file.name} preview`} />}
                {file.isVideo && <video src={file.url} controls></video>}
                {!file.isImage && !file.isVideo && <div className="file-icon">📄</div>}
              </div>

              <div className="upload-info">
                <strong>{file.name}</strong>
                <p>{file.type}</p>
                <p>{formatBytes(file.size)}</p>

                <button type="button" onClick={() => onRemoveUpload(file.id)}>
                  Remove
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function EmptyState({ message }) {
  return <div className="empty-state">{message}</div>;
}

function Toast({ message }) {
  return <div className={`toast ${message ? "show" : ""}`}>{message}</div>;
}

function getCartTotals(cart, menuItems) {
  const subtotal = cart.reduce((sum, entry) => {
    const item = menuItems.find((menuItem) => menuItem.id === entry.id);

    if (!item) {
      return sum;
    }

    return sum + item.price * entry.quantity;
  }, 0);

  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  return { subtotal, tax, total };
}

function getTopItems(orders) {
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

function createOrderId(orders) {
  const numbers = orders
    .map((order) => Number(String(order.id).replace("SH-", "")))
    .filter(Number.isFinite);

  const nextNumber = Math.max(1000, ...numbers) + 1;

  return `SH-${nextNumber}`;
}

function loadFromStorage(key, fallback) {
  const saved = localStorage.getItem(key);

  if (!saved) {
    return Array.isArray(fallback) ? [...fallback] : fallback;
  }

  try {
    return JSON.parse(saved);
  } catch {
    return Array.isArray(fallback) ? [...fallback] : fallback;
  }
}

function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getDemoOrders() {
  return [
    {
      id: "SH-1001",
      customer: {
        name: "Maya Johnson",
        phone: "555-123-4455",
        email: "maya@email.com"
      },
      pickupTime: "Today, 6:00 PM",
      orderType: "Pickup",
      notes: "Extra sauce",
      items: [
        {
          id: 1,
          name: "Brisket Plate",
          category: "Plates",
          price: 18.99,
          quantity: 2
        },
        {
          id: 7,
          name: "Mac & Cheese",
          category: "Sides",
          price: 5.99,
          quantity: 2
        }
      ],
      subtotal: 49.96,
      tax: 3.25,
      total: 53.21,
      status: "Preparing",
      date: new Date().toISOString()
    },
    {
      id: "SH-1002",
      customer: {
        name: "Chris Walker",
        phone: "555-888-1099",
        email: "chris@email.com"
      },
      pickupTime: "Today, 7:00 PM",
      orderType: "Pickup",
      notes: "",
      items: [
        {
          id: 6,
          name: "Family Feast",
          category: "Family Packs",
          price: 54.99,
          quantity: 1
        }
      ],
      subtotal: 54.99,
      tax: 3.57,
      total: 58.56,
      status: "New",
      date: new Date().toISOString()
    }
  ];
}

function formatCurrency(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function formatBytes(bytes) {
  if (bytes === 0) {
    return "0 Bytes";
  }

  const units = ["Bytes", "KB", "MB", "GB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, index);

  return `${value.toFixed(1)} ${units[index]}`;
}

function csvSafe(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
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

export default App;
