const emptyBagPage = document.querySelector(".wishlist-section");
const bagPage = document.querySelector(".wishlist-item-section");
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

itemsDiv.addEventListener("click", async (event) => {
  const element = event.target;

  if (element.id === "remove-item") {
    event.preventDefault();
    const toRemoveItem = getParentElement(element.dataset.itemId);
    const productId = toRemoveItem.dataset.productId;
    const success = await removeItemFromWishlist(productId);

    if (success) {
      itemsDiv.removeChild(toRemoveItem);
      displayQuantityOfItem(itemsDiv.children.length);
    }
  } else if (element.classList.contains("move-btn")) {
    const productId = getParentElement(element.dataset.itemId).dataset
      .productId;
    await addProductToBag(productId);
    window.location.href = "/my-bag";
  }

  if (itemsDiv.children.length === 0) {
    displayEmptyPage();
  }
});

function renderBagPage(items) {
  itemsDiv.innerHTML = "";

  items.forEach((item, index) => {
    const { name, image, sellPrice, rentPrice, _id, forRent, forSell } = item;
    const price =
      forRent && forSell ? sellPrice : forSell ? sellPrice : rentPrice;
    const sellOrRent = forSell ? "sell" : "rent";

    const itemBox = document.createElement("div");
    itemBox.className = "item-box";
    itemBox.id = `item${index}`;
    itemBox.dataset.productId = _id;

    const itemImg = document.createElement("div");
    itemImg.className = "item-img";

    const imgLink = document.createElement("a");
    imgLink.href = `/${sellOrRent}/${name}/${_id}/buy`;

    const imgElement = document.createElement("img");
    imgElement.src = `${"/" + image.split("/").splice(2).join("/")}`;
    imgElement.alt = name;

    const removeIcon = document.createElement("i");
    removeIcon.id = "remove-item";
    removeIcon.className = "bx bx-x";
    removeIcon.dataset.itemId = `item${index}`;

    imgLink.appendChild(imgElement);
    itemImg.appendChild(imgLink);
    itemImg.appendChild(removeIcon);

    const imgInfo = document.createElement("div");
    imgInfo.className = "img-info";

    const itemName = document.createElement("p");
    itemName.className = "item-name";
    itemName.textContent = name;

    const itemPrice = document.createElement("p");
    itemPrice.className = "item-price";
    itemPrice.textContent = `Rs.${price}${sellOrRent === "rent" ? "/day" : ""}`;

    const rentOrSellSpan = document.createElement("span");
    rentOrSellSpan.className = "item-rent-or-sell";

    if (forSell) {
      const sellIcon = document.createElement("i");
      sellIcon.className = "bx bxs-purchase-tag-alt";
      sellIcon.onclick = () =>
        (window.location.href = `/sell/${name}/${_id}/buy`);
      rentOrSellSpan.appendChild(sellIcon);
    }

    if (forRent) {
      const rentIcon = document.createElement("img");
      rentIcon.className = "item-rent-img rent-icon";
      rentIcon.src = "/Images/general-img/for-rent.png";
      rentIcon.alt = "Rent";
      rentIcon.onclick = () =>
        (window.location.href = `/rent/${name}/${_id}/buy`);
      rentOrSellSpan.appendChild(rentIcon);
    }

    imgInfo.appendChild(itemName);
    imgInfo.appendChild(itemPrice);
    itemPrice.appendChild(rentOrSellSpan);
    itemBox.appendChild(itemImg);
    itemBox.appendChild(imgInfo);

    itemsDiv.appendChild(itemBox);
  });

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
  return itemsDiv.querySelector(`#${itemId}`);
}

function displayQuantityOfItem(quantity) {
  document.querySelector("#total-items").innerText = `${quantity} Items`;
}

// api data fetching

async function getWishlistItems() {
  const res = await fetch("/api/wishlist");
  if (res.ok) {
    const { data } = await res.json();
    return data;
  }
  return null;
}

async function removeItemFromWishlist(productId) {
  const res = await fetch("/api/wishlist", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ productId }),
  });
  return res.ok;
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
