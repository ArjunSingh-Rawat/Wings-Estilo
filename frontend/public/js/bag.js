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

  if (element.classList.contains("q-plus")) {
    if (await addOrRemoveQuantity(productId, "inc")) {
      await updateProductDetails(itemsDiv.children[itemIndex], productId);
      await updateTotalPrice();
    }
  } else if (element.classList.contains("q-minus")) {
    if (await addOrRemoveQuantity(productId, "dec")) {
      await updateProductDetails(itemsDiv.children[itemIndex], productId);
      await updateTotalPrice();
    }
  }
});

function renderBagPage(items) {
  let i = 0;
  for (const item of items) {
    const { product, quantity } = item;
    const { name, image, price, isOnRent, _id } = product;

    let html = `
    <div class="item" data-product-Id = "${_id}">
            <div class="item-img" >
              <img src="${image}" alt="" />
            </div>
            <div class="item-details">
              <p class="item-name">${name}</p>
              <p class="item-price">Rs.${price * quantity}</p>
              <div class="item-buttons" data-item-Id = "${i++}">
                <div class="quantity-button">
                  <button class="q-minus">-</button>
                  <p class="q-number">${quantity}</p>
                  <button class="q-plus">+</button>
                </div>
                <button class="remove-button">REMOVE</button>
              </div>
            </div>
          </div>`;
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
  console.log(itemsToUpdate);
  itemsToUpdate.forEach((item) => {
    item.innerText = numberOfItems;
  });
}

async function updateProductDetails(item, productId) {
  const productData = await getItemDetails(productId);

  const price = productData.product.price;
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

// Api data fetching

async function getBagItems() {
  const res = await fetch("/api/bag");

  if (res.ok) {
    const resData = await res.json();
    return resData.data.items;
  }
  return false;
}

async function addOrRemoveQuantity(productId, incOrDecFlag) {
  const res = await fetch("/api/bag/add-quantity", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      productId,
      incOrDecFlag,
    }),
  });
  return res.ok ? true : false;
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
