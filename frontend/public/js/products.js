const contentBox = document.querySelector(".dress-grid");
const paginationDiv = document.querySelector(".pagination");
const pageNumberElements = document.querySelectorAll(".page-link");
const previousArrowButton = document.querySelector(".pagination .btn1");
const nextArrowButton = document.querySelector(".pagination .btn2");

const path = window.location.href.split("/");
const categoryName = path.pop().split("?")[0];
const rentOrSell = path.pop();

let wishList = null;
const u = new URLSearchParams(window.location.search);
let currentPage = +u.get("page") || 1;

initializeWishlist();
displayCorrectArrowBtn(currentPage);
markActivePageNumber(currentPage);

contentBox.addEventListener("click", async (event) => {
  if (event.target.classList.contains("heart")) {
    event.preventDefault();

    const heart = event.target;
    const productId = heart.dataset.productId;

    if (heart.classList.contains("bx-heart")) {
      if (await addToWishlist(productId)) {
        changeHeartClass("bxs-heart", "bx-heart", heart);
        heartTransform(heart);
      } else {
        getAlertPopup("Please login to perform this task!");
      }
    } else {
      if (await removeFromWishlist(productId)) {
        changeHeartClass("bx-heart", "bxs-heart", heart);
        heartTransform(heart);
      }
    }
  }
});

paginationDiv.addEventListener("click", (e) => {
  const element = e.target;
  if (element.classList.contains("page-link")) {
    const pageNumber = +element.value;

    if (currentPage !== pageNumber) {
      loadProductsByPage(pageNumber);
      currentPage = pageNumber;
    }
  } else if (
    element.classList.contains("btn1") ||
    element.classList.contains("bx-left-arrow-alt")
  ) {
    loadProductsByPage(currentPage - 1);
    currentPage -= 1;
  } else if (
    element.classList.contains("btn2") ||
    element.classList.contains("bx-right-arrow-alt")
  ) {
    loadProductsByPage(currentPage + 1);
    currentPage += 1;
  }

  markActivePageNumber(currentPage);
  displayCorrectArrowBtn(currentPage);
});

//functions

async function initializeWishlist() {
  wishList = await getWishlistItems();
  if (wishList) {
    markWishListItems();
  }
}
function isProductInWishlist(productId) {
  return wishList && wishList.some((item) => item._id === productId);
}

function heartTransform(heart) {
  heart.style.transform = "scale(2,2)";
  setTimeout(() => {
    heart.style.transform = "";
  }, 300);
}

function markWishListItems() {
  const items = document.querySelectorAll(".heart");
  items.forEach((item) => {
    const productId = item.dataset.productId;
    if (isProductInWishlist(productId)) {
      item.classList.remove("bx-heart");
      item.classList.add("bxs-heart");
    }
  });
}

function changeHeartClass(addCls, removeCls, heart) {
  heart.classList.add(addCls);
  heart.classList.remove(removeCls);
}

async function renderProductByPage(pageNumber) {
  const products = await getProducts(categoryName, rentOrSell, pageNumber);
  contentBox.innerHTML = "";
  if (products) {
    products.forEach((product) => {
      const productElement = createProductHtml(product);
      contentBox.appendChild(productElement);
    });
  }
}

function createProductHtml(product) {
  const productInWishlist = isProductInWishlist(product._id);
  const classOfHeart = productInWishlist ? "bxs-heart" : "bx-heart";
  const productName = product.name.replace(/ /g, "-");

  const price = rentOrSell === "sell" ? product.sellPrice : product.rentPrice;
  const priceSuffix = rentOrSell === "rent" ? "/day" : "";

  const itemDiv = document.createElement("div");
  itemDiv.classList.add("item");

  const productLink = document.createElement("a");
  productLink.classList.add("item-img");
  productLink.href = `/${rentOrSell}/${productName}/${product._id}/buy`;

  const productImage = document.createElement("img");
  productImage.loading = "lazy";
  productImage.src = product.image;
  productImage.alt = productName;

  productLink.appendChild(productImage);

  // info div
  const itemInfoDiv = document.createElement("div");
  itemInfoDiv.classList.add("item-info");

  const namePriceDiv = document.createElement("div");
  namePriceDiv.classList.add("name-price");

  const productNameLink = document.createElement("a");
  productNameLink.classList.add("name");
  productNameLink.href = `/${productName}/${product._id}/buy`;
  productNameLink.target = "_blank";
  productNameLink.textContent = product.name;

  // price element
  const priceElement = document.createElement("p");
  priceElement.classList.add("price");
  priceElement.innerHTML = `&#8377;<span>${price}</span><span>${priceSuffix}</span>`;

  namePriceDiv.appendChild(productNameLink);
  namePriceDiv.appendChild(priceElement);

  // wishlist heart
  const addDiv = document.createElement("div");
  addDiv.classList.add("add");

  const heartIcon = document.createElement("i");
  heartIcon.classList.add("bx", classOfHeart, "heart");
  heartIcon.dataset.productId = product._id;

  addDiv.appendChild(heartIcon);

  itemInfoDiv.appendChild(namePriceDiv);
  itemInfoDiv.appendChild(addDiv);

  itemDiv.appendChild(productLink);
  itemDiv.appendChild(itemInfoDiv);

  return itemDiv;
}

function loadProductsByPage(pageNumber) {
  history.pushState(
    null,
    "",
    `/${rentOrSell}/${categoryName}?page=${pageNumber}`
  );
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });

  renderProductByPage(pageNumber);
}

function markActivePageNumber(pageNumber) {
  let elementToActive = null;
  pageNumberElements.forEach((e) => {
    e.classList.remove("activePage");
    if (e.value === pageNumber) elementToActive = e;
  });
  elementToActive.classList.add("activePage");
}

function displayCorrectArrowBtn(currentPage) {
  if (currentPage === 2) {
    previousArrowButton.style.display = "flex";
  } else if (currentPage <= 1) {
    previousArrowButton.style.display = "none";
  }
  if (currentPage >= pageNumberElements.length) {
    nextArrowButton.style.display = "none";
  } else if (currentPage === pageNumberElements.length - 1) {
    nextArrowButton.style.display = "flex";
  }
}

// fetching api data
async function getProducts(categoryName, rentOrSell, pageNumber) {
  const res = await fetch(
    `/api/products/category/${categoryName}/${rentOrSell}?page=${pageNumber}`
  );
  if (res.ok) {
    const { products } = await res.json();
    return products;
  }
  return false;
}

async function addToWishlist(productId) {
  return addOrRemoveInWishlist("/api/wishlist", "POST", productId);
}

async function removeFromWishlist(productId) {
  return addOrRemoveInWishlist("/api/wishlist", "DELETE", productId);
}

async function addOrRemoveInWishlist(url, method, productId) {
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ productId }),
  });
  return res.ok;
}

async function getWishlistItems() {
  const res = await fetch("/api/wishlist");
  if (res.ok) {
    const { data } = await res.json();
    return data;
  }
  return false;
}
