const snacks = [
  {
    id: "chips",
    name: "Classic Chips",
    price: 1.50,
    image: "assets/chips.png",
    alt: "A red and yellow bag of chips",
    description: "Crunchy, salty, and fast.",
    stock: 12
  },
  {
    id: "cookie",
    name: "Big Cookie",
    price: 1.25,
    image: "assets/cookie.png",
    alt: "A large chocolate chip cookie",
    description: "Soft chocolate chip cookie.",
    stock: 9
  },
  {
    id: "juice",
    name: "Cold Juice Pouch",
    price: 1.00,
    image: "assets/juice.png",
    alt: "A colorful juice pouch with a straw",
    description: "Cold, fruity, and ready to drink.",
    stock: 15
  },
  {
    id: "gummies",
    name: "Gummy Cup",
    price: 1.75,
    image: "assets/gummies.png",
    alt: "A clear cup filled with gummy candy",
    description: "Mixed gummies in a small cup.",
    stock: 7
  }
];

const pickupInfo = "Pickup outside Room 214 by the blue lockers after 4th period or during lunch.";
const phoneNumber = "+15550143782";
const menuGrid = document.querySelector("#menuGrid");
const cartItems = document.querySelector("#cartItems");
const cartTotal = document.querySelector("#cartTotal");
const cartCount = document.querySelector("#cartCount");
const textOrder = document.querySelector("#textOrder");
const copyOrder = document.querySelector("#copyOrder");
const clearCart = document.querySelector("#clearCart");
const cartNote = document.querySelector("#cartNote");
const toast = document.querySelector("#toast");
const copyPickup = document.querySelector("#copyPickup");
const shareMenu = document.querySelector("#shareMenu");
const cart = {};
let toastTimer;

function money(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(amount);
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("show");
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2400);
}

async function copyText(text, successMessage) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(successMessage);
  } catch {
    window.prompt("Copy this:", text);
  }
}

function getOrderSummary() {
  const selected = snacks.filter((snack) => cart[snack.id]);
  if (!selected.length) {
    return "";
  }

  const lines = selected.map((snack) => {
    const quantity = cart[snack.id];
    return `${quantity} ${snack.name} (${money(snack.price * quantity)})`;
  });
  const total = selected.reduce((sum, snack) => sum + snack.price * cart[snack.id], 0);

  return `Snack Shack order:\n${lines.join("\n")}\nTotal: ${money(total)}\n${pickupInfo}`;
}

function renderMenu() {
  menuGrid.innerHTML = snacks.map((snack) => `
    <article class="snack-card">
      <img src="${snack.image}" alt="${snack.alt}">
      <div class="snack-body">
        <div class="snack-title-row">
          <h3>${snack.name}</h3>
          <span class="price">${money(snack.price)}</span>
        </div>
        <p>${snack.description}</p>
        <div class="snack-actions">
          <button class="add-button" type="button" data-add="${snack.id}">Add to cart</button>
          <span class="stock" data-stock="${snack.id}">${snack.stock} left</span>
        </div>
      </div>
    </article>
  `).join("");
}

function renderMenuStock() {
  snacks.forEach((snack) => {
    const quantity = cart[snack.id] || 0;
    const remaining = snack.stock - quantity;
    const addButton = document.querySelector(`[data-add="${snack.id}"]`);
    const stockLabel = document.querySelector(`[data-stock="${snack.id}"]`);

    if (!addButton || !stockLabel) {
      return;
    }

    addButton.disabled = remaining === 0;
    addButton.textContent = remaining === 0 ? "Sold out" : "Add to cart";
    stockLabel.textContent = `${remaining} left`;
    stockLabel.classList.toggle("sold-out", remaining === 0);
  });
}

function renderCart() {
  const selected = snacks.filter((snack) => cart[snack.id]);
  const totalItems = selected.reduce((sum, snack) => sum + cart[snack.id], 0);
  const totalPrice = selected.reduce((sum, snack) => sum + snack.price * cart[snack.id], 0);
  const summary = getOrderSummary();

  cartCount.textContent = totalItems;
  cartTotal.textContent = money(totalPrice);

  if (!selected.length) {
    cartItems.innerHTML = '<p class="empty-cart">No snacks yet.</p>';
    textOrder.classList.add("disabled");
    textOrder.setAttribute("aria-disabled", "true");
    textOrder.href = "#menu";
    cartNote.textContent = "Add something from the menu to start.";
    renderMenuStock();
    return;
  }

  cartItems.innerHTML = selected.map((snack) => `
    <div class="cart-item">
      <div>
        <strong>${snack.name}</strong>
        <small>${money(snack.price)} each</small>
      </div>
      <div class="quantity-controls" aria-label="${snack.name} quantity">
        <button type="button" data-minus="${snack.id}" aria-label="Remove one ${snack.name}">-</button>
        <span>${cart[snack.id]}</span>
        <button type="button" data-plus="${snack.id}" aria-label="Add one ${snack.name}" ${cart[snack.id] >= snack.stock ? "disabled" : ""}>+</button>
      </div>
    </div>
  `).join("");

  textOrder.classList.remove("disabled");
  textOrder.removeAttribute("aria-disabled");
  textOrder.href = `sms:${phoneNumber}?&body=${encodeURIComponent(summary)}`;
  cartNote.textContent = "Text the order and bring payment at pickup.";
  renderMenuStock();
}

function addSnack(id) {
  const snack = snacks.find((item) => item.id === id);
  const currentQuantity = cart[id] || 0;

  if (currentQuantity >= snack.stock) {
    showToast(`Only ${snack.stock} ${snack.name} available.`);
    return;
  }

  cart[id] = currentQuantity + 1;
  renderCart();
  showToast(`${snack.name} added.`);
}

function changeQuantity(id, amount) {
  const snack = snacks.find((item) => item.id === id);
  const nextQuantity = (cart[id] || 0) + amount;

  if (nextQuantity > snack.stock) {
    showToast(`Only ${snack.stock} ${snack.name} available.`);
    return;
  }

  cart[id] = nextQuantity;
  if (cart[id] <= 0) {
    delete cart[id];
  }
  renderCart();
}

menuGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-add]");
  if (button) {
    addSnack(button.dataset.add);
  }
});

cartItems.addEventListener("click", (event) => {
  const plus = event.target.closest("[data-plus]");
  const minus = event.target.closest("[data-minus]");

  if (plus) {
    changeQuantity(plus.dataset.plus, 1);
  }

  if (minus) {
    changeQuantity(minus.dataset.minus, -1);
  }
});

clearCart.addEventListener("click", () => {
  Object.keys(cart).forEach((id) => delete cart[id]);
  renderCart();
  showToast("Cart cleared.");
});

copyOrder.addEventListener("click", () => {
  const summary = getOrderSummary();
  if (!summary) {
    showToast("Add a snack first.");
    return;
  }
  copyText(summary, "Order copied.");
});

copyPickup.addEventListener("click", () => {
  copyText(pickupInfo, "Pickup info copied.");
});

shareMenu.addEventListener("click", async () => {
  const shareData = {
    title: "Snack Shack",
    text: "Check the Snack Shack menu.",
    url: window.location.href
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return;
    } catch {
      showToast("Share cancelled.");
      return;
    }
  }

  copyText(window.location.href, "Menu link copied.");
});

document.querySelectorAll("[data-scroll-target]").forEach((button) => {
  button.addEventListener("click", () => {
    document.getElementById(button.dataset.scrollTarget).scrollIntoView({ behavior: "smooth" });
  });
});

renderMenu();
renderCart();
renderMenuStock();
