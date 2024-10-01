const descriptionDiv = document.querySelector("#description");
renderDescription(descriptionDiv.children[0].innerText, descriptionDiv);

function renderDescription(des, parentDiv) {
  parentDiv.innerHTML = "";
  const arr = des.split("**");
  arr.forEach((s) => {
    if (s[0] === "*") {
      const b = document.createElement("strong");
      b.innerText = s.split("*").join("");
      parentDiv.appendChild(b);
    } else {
      const p = document.createElement("p");
      p.innerText = s;
      parentDiv.appendChild(p);
    }
  });
}

/*--------- sizes selection -----------*/
let sizeSelected = "";
const sizesDiv = document.querySelector(".sizes");
let previousSizeSelected = "";
sizesDiv.addEventListener("click", (event) => {
  if (event.target.tagName === "LI") {
    if (previousSizeSelected) {
      previousSizeSelected.classList.remove("selected");
    }

    if (
      previousSizeSelected &&
      previousSizeSelected.innerText === event.target.innerText
    ) {
      sizeSelected = "";
      previousSizeSelected = "";
      event.target.classList.remove("selected");
    } else {
      event.target.classList.add("selected");
      sizeSelected = event.target.innerText;
      previousSizeSelected = event.target;
    }
  }
});

/*---------- add to cart or wishlist and buy ----------*/
const bagWishlistBuyDiv = document.querySelector(".add-button");
const heart = document.querySelector(".heart");
const productId = bagWishlistBuyDiv.dataset.productId;

bagWishlistBuyDiv.addEventListener("click", async (event) => {
  if (
    event.target.classList.contains("wishlist-btn") ||
    event.target.parentElement.classList.contains("wishlist-btn")
  ) {
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
  } else if (event.target.classList.contains("rent-now-btn")) {
    if (!sizeSelected) {
      getAlertPopup("Please select product size!!");
    } else {
      const response = await initiateOrder(productId, sizeSelected);

      if (response.success) {
        window.location.href = "/rent/checkout";
      } else {
        getAlertPopup(response.message);
      }
    }
  }
});

function heartTransform(heart) {
  heart.style.transform = "scale(2,2)";

  setTimeout(() => {
    heart.style.transform = "";
  }, 300);
}

function changeHeartClass(addCls, removeCls, heart) {
  heart.classList.add(addCls);
  heart.classList.remove(removeCls);
}

// render similar products
const relatedProductsSection = document.querySelector(".more-product-section");
const relatedProductsDiv = document.querySelector(".more-product-div");
let wishlist = null;

async function renderSimilarProducts() {
  wishlist = await getWishlistItems();
  const similarProducts = await getSimilarProducts("rent", productId);

  if (similarProducts) {
    relatedProductsSection.style.display = "block";
    createSimilarProductsHtml(similarProducts);
  }
}

renderSimilarProducts();

function createSimilarProductsHtml(products) {
  relatedProductsDiv.innerHTML = "";
  products.forEach((product) => {
    const productInWishlist = isProductInWishlist(product._id);
    const classOfHeart = productInWishlist ? "bxs-heart" : "bx-heart";
    const productName = product.name.replace(/ /g, "-");

    const div = document.createElement("div");
    div.classList.add("more-product-item");

    const productLinkElement = document.createElement("a");
    productLinkElement.classList.add("more-product-img");
    productLinkElement.href = `/rent/${productName}/${product._id}/buy`;

    const productImage = document.createElement("img");
    productImage.src = product.image;
    productImage.alt = productName;

    productLinkElement.appendChild(productImage);

    const infoDiv = document.createElement("div");
    infoDiv.classList.add("more-product-info");

    const namePriceDiv = document.createElement("div");
    namePriceDiv.classList.add("name-price");

    const productNameElement = document.createElement("a");
    productNameElement.classList.add("name");
    productNameElement.textContent = product.name;
    productNameElement.href = `/rent/${productName}/${product._id}/buy`;
    const productPriceElement = document.createElement("p");
    productPriceElement.classList.add("price");
    productPriceElement.innerHTML = `&#8377;${product.rentPrice}/day`;

    namePriceDiv.appendChild(productNameElement);
    namePriceDiv.appendChild(productPriceElement);

    const heartIcon = document.createElement("i");
    heartIcon.classList.add("bx", classOfHeart, "heart");
    heartIcon.dataset.productId = product._id;

    infoDiv.appendChild(namePriceDiv);
    infoDiv.append(heartIcon);

    div.appendChild(productLinkElement);
    div.appendChild(infoDiv);
    relatedProductsDiv.appendChild(div);
  });
}

function isProductInWishlist(productId) {
  return wishlist && wishlist.some((item) => item._id === productId);
}

relatedProductsDiv.addEventListener("click", async (event) => {
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

/*----------- fetch data ---------------*/
async function getWishlistItems() {
  const res = await fetch("/api/wishlist");
  if (res.ok) {
    const { data } = await res.json();
    return data;
  }
  return false;
}

async function addToWishlist(productId) {
  const res = await fetch("/api/wishlist", {
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

async function removeFromWishlist(productId) {
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

async function initiateOrder(productId, productSize) {
  try {
    const res = await fetch("/api/order/initiate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        products: [
          {
            productId,
            productSize,
            quantity: 1,
          },
        ],
      }),
    });
    const data = await res.json();
    return data;
  } catch (error) {
    const data = {
      success: false,
      message: error.message,
    };
    return data;
  }
}

async function getSimilarProducts(rentOrSell, productId) {
  const res = await fetch(`/api/products/similar/${rentOrSell}/${productId}`);
  if (res.ok) {
    const { products } = await res.json();
    return products;
  }
  return false;
}
