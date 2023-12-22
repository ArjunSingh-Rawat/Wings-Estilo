const emptyBagPage = document.querySelector(".wishlist-section");
const bagPage = document.querySelector(".whishlist-item-section");
const itemsDiv = document.querySelector(".wishlist-items");

async function loadBagPage() {
  const items = await getWishlistItems();
  if (!items) {
    displayEmptyPage();
    return;
  }
  renderBagPage(items);
}
loadBagPage();

const wishlistItemsDiv = document.querySelector(".wishlist-items");
wishlistItemsDiv.addEventListener("click", async (event) => {
  const element = event.target;

  if (element.id === "remove-item") {
    event.preventDefault();
    const toRemoveItem = getParentElement(element.dataset.itemId);
    const productId = toRemoveItem.dataset.productId;
    const res = await removeItemFromWishlist(productId);

    if (res) {
      wishlistItemsDiv.removeChild(toRemoveItem);
      displayQuantityOfItem(wishlistItemsDiv.children.length);
    }
  } else if (element.classList.contains("move-btn")) {
    const productId = getParentElement(element.dataset.itemId).dataset
      .productId;
    await addProductToBag(productId);
    window.location.href = "/my-bag";
  }

  if (wishlistItemsDiv.children.length <= 0) {
    displayEmptyPage();
  }
});

function renderBagPage(items) {
  let i = 0;
  for (const item of items) {
    const { name, image, price, _id } = item;

    let html = `
    <div id="item${i}" class="item-box" data-product-id="${_id}">
      <div class="item-img">
        <img src="${image}" alt="#" />
        <i id="remove-item" class="bx bx-x" data-item-id="item${i}"></i>
      </div>
      <div class="img-info">
        <p class="item-name">${name}</p>
        <p class="item-price">Rs.${price} <del>Rs.${price + 500}</del></p>
        <button class="move-btn" data-item-id="item${i}">Move to bag</button>
      </div>
    </div>`;
    i++;
    itemsDiv.innerHTML += html;
  }

  displayWishlistPage();
  displayQuantityOfItem(items.length);
}

function displayEmptyPage() {
  emptyBagPage.style.display = "flex";
  bagPage.style.display = "none";
}

function displayWishlistPage() {
  emptyBagPage.style.display = "none";
  bagPage.style.display = "block";
}

function getParentElement(itemId) {
  return wishlistItemsDiv.querySelector(`#${itemId}`);
}

function displayQuantityOfItem(quantity) {
  document.querySelector("#total-items").innerText = `${quantity} Items`;
}

// api data fetching

async function getWishlistItems() {
  const res = await fetch("/api/wishlist");

  if (res.ok) {
    const resData = await res.json();
    return resData.data;
  }
  return false;
}

async function removeItemFromWishlist(productId) {
  const res = await fetch("/api/wishlist", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      productId,
    }),
  });
  return res.ok ? true : false;
}

async function addProductToBag(productId) {
  const res = await fetch("/api/bag/add-to-bag", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      productId,
    }),
  });
  return res.ok ? true : false;
}
