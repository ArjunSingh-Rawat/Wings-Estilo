function displayCorrectOrderDiv() {
  const ordersDiv = document.querySelector(".my-orders-section");
  const noOrdersDiv = ordersDiv.querySelector(".no-orders-div");
  const ordersDivContent = ordersDiv.querySelector(".orders-div");

  if (userData.orderInfo.length > 0) {
    ordersDivContent.style.display = "flex";
    noOrdersDiv.style.display = "none";
  } else {
    ordersDivContent.style.display = "none";
    noOrdersDiv.style.display = "flex";
  }
}

const orderListDiv = document.querySelector(".orders-list");

const itemStatus = {
  Processing: {
    message: "Item processing, on its way to shipping",
    icon: "bx-cog",
  },
  Shipped: {
    message: "Item shipped, on its way to delivery",
    icon: "bxs-package",
  },
  Delivered: {
    message: "Delivery successful! Enjoy your purchase!",
    icon: "bx-check",
  },
  canceled: {
    icon: "bx-question-mark",
    message: "Your order has been canceled.",
  },
  "On Rent": {
    icon: "bx-question-mark",
    message: "Your order is currently on rent.",
  },
  Returning: {
    icon: "bx-question-mark",
    message: "Your order is in the process of returning.",
  },
  Returned: {
    icon: "bx-check",
    message: "Your order has been returned successfully.",
  },
};

function formatDate(dateString) {
  const date = new Date(dateString);
  return `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
}

function createOrderItemHtml(order, item) {
  const orderDateString = formatDate(order.createdAt);
  const dateUpdated = item.updatedAt ? formatDate(item.updatedAt) : "";

  let shippedOrDeliveredDate = "";
  if (item.status !== "Processing" && item.updatedAt) {
    shippedOrDeliveredDate = `${item.status} on: ${dateUpdated}`;
  }
  const price =
    order.orderType === "sell"
      ? `Rs. ${item.product.sellPrice}`
      : `${item.product.rentPrice}/day`;

  return `
    <div class="order">
      <div class="order-info">
        <div class="order-img">
          <img
            src="${item.product.image.split("/").slice(2).join("/")}"
            alt="${item.product.name}"
          />
        </div>
        <div class="ordered-product-info">
          <p id="ordered-product-name">${item.product.name}</p>
          <p id="ordered-product-size">Size: ${item.productSize}</p>
          <p id="ordered-product-prize">Rs. ${price}</p>
          <p id="ordered-product-quantity">Quantity: ${item.quantity}</p>
        </div>
      </div>
      <div class="order-delivery-info">
        <div id="ordered-date">
          Order Date: <span style="margin-left:10px;">${orderDateString}</span>
        </div>
        <div>
          <p id="order-status">
            <i class="bx ${itemStatus[item.status].icon}"></i><span>${
              item.status
            }</span>
          </p>
          <p id="order-alert">${itemStatus[item.status].message}</p>
          <p class="shipped-or-delivered-date">${shippedOrDeliveredDate}</p>
        </div>
      </div>
    </div>
  `;
}

function renderOrderInfo(orders) {
  orderListDiv.innerHTML = "";
  const orderItemsHtml = orders
    .map((order) =>
      order.items.map((item) => createOrderItemHtml(order, item)).join("")
    )
    .join("");

  orderListDiv.innerHTML = orderItemsHtml;
}

async function getOrderDetails() {
  try {
    const res = await fetch("/api/order");
    const data = await res.json();
    return res.ok ? data.orders : false;
  } catch (error) {
    return false;
  }
}

export async function initUserOrders(userData) {
  const orders = await getOrderDetails();
  if (orders) {
    userData.orderInfo = orders;
  }
  renderOrderInfo(orders);
  displayCorrectOrderDiv();
}
