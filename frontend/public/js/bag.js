const emptyBagPage = document.querySelector(".bag-section");
const bagPage = document.querySelector(".bag-item-section");
const itemsDiv = document.querySelector(".items");

async function loadBagPage() {
  const items = await getBagItems();

  if (!items) {
    displayEmptyPage();
    return;
  }
  renderBagPage(items);
}

loadBagPage();

itemsDiv.addEventListener("click", async (event) => {
  const element = event.target;

  const itemIndex = getItemIdex(element);
  const productId = itemsDiv.children[itemIndex].dataset.productId;
  const productSize = itemsDiv.children[itemIndex].dataset.productSize;

  if (element.classList.contains("q-plus")) {
    const response = await addOrRemoveQuantity(productId, productSize, "inc");
    if (response.success) {
      await updateProductDetails(itemsDiv.children[itemIndex], productId);
      await updateTotalPrice();
    } else {
      getAlertPopup(response.message);
    }
  } else if (element.classList.contains("q-minus")) {
    const response = await addOrRemoveQuantity(productId, productSize, "dec");
    if (response.success) {
      await updateProductDetails(itemsDiv.children[itemIndex], productId);
      await updateTotalPrice();
    } else {
      getAlertPopup(response.message);
    }
  } else if (element.classList.contains("remove-button")) {
    if (await removeItemFromBag(productId, productSize)) {
      const itemToRemove = itemsDiv.children[itemIndex];
      itemsDiv.removeChild(itemToRemove);

      await updateItemsQuantity(itemsDiv.children);
      await updateTotalPrice();
    }
  }
  if (itemsDiv.children.length <= 0) {
    displayEmptyPage();
  }
});

function renderBagPage(items) {
  let i = 0;
  for (const item of items) {
    const { product, quantity, productSize } = item;
    const { name, image, sellPrice, _id } = product;

    let html = `
    <div id="item${i}" class="item" data-product-Id = "${_id}" data-product-size="${productSize}">
            <div class="item-img" >
              <img src="${image}" alt="" />
            </div>
            <div class="item-details">
              <p class="item-name">${name}</p>
              <p class="item-price">Rs.${sellPrice * quantity}</p>
              <p class="item-size">${productSize}</p>
              <div class="item-buttons" data-item-Id = "item${i}">
                <div class="quantity-button">
                  <button class="q-minus">-</button>
                  <p class="q-number">${quantity}</p>
                  <button class="q-plus">+</button>
                </div>
                <button class="remove-button">REMOVE</button>
              </div>
            </div>
          </div>`;
    i++;
    itemsDiv.innerHTML += html;
  }

  displayBagPage();
  updateItemsQuantity(items);
}

function displayEmptyPage() {
  emptyBagPage.style.display = "flex";
  bagPage.style.display = "none";
}

function displayBagPage() {
  emptyBagPage.style.display = "none";
  bagPage.style.display = "flex";
}

function getItemIdex(item) {
  let index = -1;
  if (item.classList.contains("q-plus") || item.classList.contains("q-minus")) {
    index = item.parentElement.parentElement.dataset.itemId;
    return index;
  }
  if (item.classList.contains("remove-button")) {
    index = item.parentElement.dataset.itemId;
    return index;
  }
}

async function updateItemsQuantity(items) {
  numberOfItems = items.length;
  const itemsToUpdate = document.querySelectorAll(".total-items");

  itemsToUpdate.forEach((item) => {
    item.innerText = numberOfItems;
  });
}

async function updateProductDetails(item, productId) {
  const productData = await getItemDetails(productId);

  const price = productData.product.sellPrice;
  const quantity = productData.quantity;

  item.querySelector(".q-number").innerText = quantity;
  item.querySelector(".item-price").innerText = `Rs.${price * quantity}`;
}

async function updateTotalPrice() {
  const totalAmount = await getTotalAmount();
  document.querySelector(".total-amount").innerText = `Rs.${totalAmount}`;
  document.querySelector(".net-amount").innerText = `Rs.${totalAmount + 80}`;
}
updateTotalPrice();

/*------------- place order ------------*/
document
  .querySelector(".place-order button")
  .addEventListener("click", async () => {
    const bagItems = await getBagItems();
    console.log(bagItems);

    const products = [];

    for (const item of bagItems) {
      products.push({
        productId: item.product._id,
        productSize: item.productSize,
        quantity: item.quantity,
      });
    }

    if (await initiateOrder(products)) {
      window.location.href = "/sell/checkout";
    }
  });

// Api data fetching

async function getBagItems() {
  const res = await fetch("/api/bag");

  if (res.ok) {
    const resData = await res.json();
    return resData.data;
  }
  return false;
}

async function addOrRemoveQuantity(productId, productSize, incOrDecFlag) {
  const res = await fetch("/api/bag/add-quantity", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      productId,
      productSize,
      incOrDecFlag,
    }),
  });
  const data = await res.json();
  return data;
}

async function getItemDetails(productId) {
  const res = await fetch(`/api/bag/${productId}`);

  if (res.ok) {
    const data = await res.json();
    return data.item;
  }
  return false;
}

async function getTotalAmount() {
  const res = await fetch("/api/bag/totalAmount");

  if (res.ok) {
    const data = await res.json();
    return data.totalAmount;
  }
  return false;
}

async function removeItemFromBag(productId, productSize) {
  const res = await fetch("/api/bag", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      productId,
      productSize,
    }),
  });
  return res.ok ? true : false;
}

async function initiateOrder(products) {
  try {
    const res = await fetch("/api/order/initiate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        products,
      }),
    });

    return res.ok ? true : false;
  } catch (error) {
    return false;
  }
}
