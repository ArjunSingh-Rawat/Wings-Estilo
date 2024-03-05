function payWithRazorpay(key, razorpayOrder, user) {
  const options = {
    key,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    name: "Wings Estilo",
    description: "Best service from our boutique",
    image: "/Images/general-img/favicon.png",
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
    const res = await fetch("/api/order/products");
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

async function startPaymentProcess(products, shippingAddress) {
  try {
    const res = await fetch("/api/order/start-payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        products,
        shippingAddress,
      }),
    });

    const data = await res.json();
    return data;
  } catch (error) {
    return false;
  }
}
