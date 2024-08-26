const checkoutDetails = {
  userData: null,
  products: [],
  deliveryCharge: 0,
};

async function getCheckoutDetails() {
  const userInfo = await getUserInfo();
  const productsInfo = await getProductInfo();
  checkoutDetails.userData = userInfo;

  for (const productData of productsInfo) {
    const product = productData.product;
    for (const {
      productSize,
      quantity,
    } of productData.productSizesAndQuantity) {
      checkoutDetails.products.push({ product, productSize, quantity });
    }
  }
  if (checkoutDetails.userData.addresses.length) {
    const state = checkoutDetails.userData.addresses[0].state;
    const response = await getDeliveryCharge(state);
    if (response.success) {
      checkoutDetails.deliveryCharge = response.deliveryCharge;
      document.querySelector(
        ".delivery-charge"
      ).innerText = `Rs. ${response.deliveryCharge}`;
    } else {
      getAlertPopup(response.message);
    }
    document.querySelector(
      ".deposit-charge"
    ).innerText = `Rs. ${checkoutDetails.products[0].product.depositCharge}`;
  }

  if (!userInfo.addresses.length) {
    showAddAddressBtn();
  } else {
    showChangeAddressBtn();
    renderUserInfo(checkoutDetails.userData);
  }

  renderTotalPrice(checkoutDetails.products, checkoutDetails.deliveryCharge);
}
getCheckoutDetails();

document
  .querySelector("#add-change-address-button")
  .addEventListener("click", (event) => {
    if (event.target.classList.contains("add-address")) {
      window.location.href = "/profile?section=addresses&from=checkout";
    } else if (event.target.classList.contains("change-address")) {
      getAlertPopup("Change default address to use another address!");
    }
  });

const itemsDiv = document.querySelector(".ordered-product-div");
itemsDiv.addEventListener("click", async (event) => {
  const element = event.target;
  if (element.classList.contains("quantity-toggle")) {
    const itemId = element.parentElement.dataset.itemId;
    const itemDiv = document.querySelector(`#${itemId}`);
    let { productId, productSize, productQuantity } = itemDiv.dataset;
    productQuantity = Number(productQuantity);

    if (element.classList.contains("q-plus")) {
      const response = await checkQuantity(
        productId,
        productSize,
        productQuantity + 1
      );
      if (response.success) {
        itemDiv.dataset.productQuantity = productQuantity + 1;
        itemDiv.querySelector(".product-quantity").innerText =
          productQuantity + 1;
        const index = +itemId.slice(-1);
        checkoutDetails.products[index].quantity = productQuantity + 1;
        renderTotalPrice(
          checkoutDetails.products,
          checkoutDetails.deliveryCharge
        );
      } else {
        getAlertPopup(response.message);
      }
    } else if (element.classList.contains("q-minus")) {
      const response = await checkQuantity(
        productId,
        productSize,
        productQuantity - 1
      );
      if (response.success) {
        itemDiv.dataset.productQuantity = productQuantity - 1;
        itemDiv.querySelector(".product-quantity").innerText =
          productQuantity - 1;
        const index = +itemId.slice(-1);
        checkoutDetails.products[index].quantity = productQuantity - 1;
        renderTotalPrice(
          checkoutDetails.products,
          checkoutDetails.deliveryCharge
        );
      } else {
        getAlertPopup(response.message);
      }
    }
  }
});

document
  .querySelector("#checkout-continue-btn")
  .addEventListener("click", async () => {
    const products = getOrderProductsDetail();
    if (!checkoutDetails.userData.addresses.length) {
      getAlertPopup("Please add delivery address!");
      return;
    }
    if (checkoutDetails.userData) {
      const data = await startPaymentProcess(
        products,
        checkoutDetails.userData.addresses[0]
      );
      payWithRazorpay(data.key, data.order, checkoutDetails.userData);
    }
  });

function getOrderProductsDetail() {
  const itemsDiv = document.querySelector(".ordered-product-div");
  const products = [];

  for (const item of itemsDiv.children) {
    const { productId, productSize } = item.dataset;
    const quantity = item.querySelector(".product-quantity").innerText;
    products.push({ productId, productSize, quantity });
  }
  return products;
}

function payWithRazorpay(key, razorpayOrder, user) {
  const options = {
    key,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    name: "Wings Estilo",
    description: "Best service from our boutique",
    image: "/Images/general-img/favicon.png",
    order_id: razorpayOrder.id,
    callback_url: "/api/order/create-rent-order",
    prefill: {
      name: user.name,
      email: user.email,
      contact: user.phoneNumber,
    },
    theme: {
      color: "#3399cc",
    },
    modal: {
      ondismiss: function () {
        window.location.replace("/rent/checkout");
      },
    },
  };
  const razor = new window.Razorpay(options);
  razor.open();
}

function renderUserInfo(userData) {
  const {
    name,
    phoneNumber,
    addressLine1,
    addressLine2,
    district,
    state,
    pinCode,
  } = userData.addresses[0];
  const addressDiv = document.querySelector("#delivery-address");

  let p = document.createElement("p");
  p.id = "my-name-phone";
  p.innerHTML = `<span id="address-div-name">${name}</span>
  <span id="address-div-phone">${phoneNumber}</span>`;
  addressDiv.appendChild(p);

  p = document.createElement("p");
  p.innerText = `${addressLine1 + addressLine2 + district + state} - `;

  const span = document.createElement("span");
  span.style.fontWeight = "bold";
  span.innerText = `${pinCode}`;
  p.appendChild(span);
  addressDiv.appendChild(p);
  document.querySelector("#user-email").innerText = userData.email;
}

function renderTotalPrice(products, deliveryCharge) {
  let totalAmount = 0;
  let totalItems = 0;
  for (const productData of products) {
    const productPrice = productData.product.rentPrice;
    totalAmount += productPrice * productData.quantity;
    totalItems++;
  }
  document.querySelector(".total-items").innerText = totalItems;
  document.querySelector(".total-amount").innerText = `Rs. ${totalAmount}`;
  if (deliveryCharge === 0) {
    document.querySelector(".net-amount").innerText = `....`;
  } else {
    document.querySelector(".net-amount").innerText = `Rs. ${
      totalAmount + deliveryCharge
    }`;
  }
  document.querySelector(".net-amount").innerText = `Rs. ${
    totalAmount + deliveryCharge + products[0].product.depositCharge
  }`;
}

function showAddAddressBtn() {
  const btn = document.querySelector("#add-change-address-button");
  btn.classList.add("add-address");
  btn.innerText = "Add Address";
}

function showChangeAddressBtn() {
  const btn = document.querySelector("#add-change-address-button");
  btn.classList.add("change-address");
  btn.innerText = "Change";
}

/*------------- fetch data ------------*/
async function getUserInfo() {
  try {
    const res = await fetch("/api/user/info");
    const data = await res.json();
    if (res.ok) {
      return data.user;
    }
    return false;
  } catch (error) {
    return false;
  }
}

async function getProductInfo() {
  try {
    const res = await fetch("/api/order/products");
    const data = await res.json();

    return res.ok ? data.products : false;
  } catch (error) {
    return false;
  }
}

async function checkQuantity(productId, productSize, quantity) {
  try {
    const res = await fetch("/api/order/quantity", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        quantity,
        productId,
        productSize,
      }),
    });

    const data = await res.json();
    return data;
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function startPaymentProcess(products, shippingAddress) {
  try {
    const res = await fetch("/api/order/rent/start-payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        products,
        shippingAddress: {
          _id: shippingAddress._id,
          state: shippingAddress.state,
        },
      }),
    });

    const data = await res.json();
    return data;
  } catch (error) {
    return false;
  }
}

async function getDeliveryCharge(state) {
  try {
    const res = await fetch(`/api/order/delivery-charge/${state}`);
    const data = await res.json();
    return data;
  } catch (error) {
    return false;
  }
}
