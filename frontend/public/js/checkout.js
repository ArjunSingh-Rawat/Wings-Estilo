function payWithRazorpay(key, razorpayOrder, user, productInfo) {
  const options = {
    key,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    name: productInfo.name,
    description: productInfo.shortDescription,
    image: productInfo.image,
    order_id: razorpayOrder.id,
    callback_url: "/api/order/create-order",
    prefill: {
      name: user.name,
      email: user.email,
      contact: user.phoneNumber,
    },
    notes: {
      address: user.address,
    },
    theme: {
      color: "#3399cc",
    },
    modal: {
      ondismiss: function () {
        window.location.replace("/sell/checkout");
      },
    },
  };
  const razor = new window.Razorpay(options);
  razor.open();
}

/*------------- fetch data ------------*/
async function getUserInfo() {
  try {
    const res = await fetch("/api/user/info");
    const data = await res.json();

    if (res.ok) {
      return data;
    }
    return false;
  } catch (error) {
    return false;
  }
}

async function getProductInfo() {
  try {
    const res = await fetch("/api/order/product");
    const data = await res.json();

    return res.ok ? data.product : false;
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
    return false;
  }
}

async function verifyOrderCredentials(
  productId,
  productSize,
  quantity,
  shippingAddress
) {
  try {
    const res = await fetch("/api/order/verify-order-details", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId,
        productSize,
        quantity,
        shippingAddress,
      }),
    });

    return res.ok ? true : false;
  } catch (error) {
    return false;
  }
}

async function startPaymentProcess(
  productId,
  productSize,
  quantity,
  shippingAddress
) {
  try {
    const res = await fetch("/api/order/start-payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId,
        productSize,
        quantity,
        shippingAddress,
      }),
    });

    const data = await res.json();
    return data;
  } catch (error) {
    return false;
  }
}
