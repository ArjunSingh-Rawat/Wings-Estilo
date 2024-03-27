const contentBox = document.querySelector(".dress-grid");

const path = window.location.href.split("/");
const categoryName = path.pop();
const rentOrSell = path.pop();

renderProducts(categoryName);

async function renderProducts(categoryName) {
  const products = await getProducts(categoryName, rentOrSell);
  const wishList = await getWishlistItems();
  document.querySelector(".total-products").innerText = products
    ? `${products.length} Products`
    : "0 Products";

  if (products) {
    products.forEach((product) => {
      let productInWishlist = false;
      if (wishList) {
        for (const item of wishList) {
          if (product._id === item._id) {
            productInWishlist = true;
            break;
          }
        }
      }
      createProductHtml(product, productInWishlist);
    });
  }
}

function createProductHtml(product, productInWishlist) {
  const classOfHeart = productInWishlist ? "bxs-heart" : "bx-heart";
  const productName = product.name.replace(/ /g, "-");

  const price = rentOrSell === "sell" ? product.sellPrice : product.rentPrice;
  const priceSuffix = rentOrSell === "rent" ? "/day" : "";

  const productHtml = `
      <div class="item">
        <a class="item-img" href="/${rentOrSell}/${productName}/${product._id}/buy" >
          <img src="${product.image}" alt="" />
        </a>
        <div class="item-info">
            <div class="name-price">
              <a class="name" href="/${productName}/${product._id}/buy" target = "_blank">${product.name}</a>
              <p class="price">&#8377;<span>${price}<span>${priceSuffix}</span></p>
            </div>

            <div class="add">
              <i class="bx ${classOfHeart} heart" data-product-id=${product._id}></i>
            </div>
        </div>
      </div>`;
  contentBox.innerHTML += productHtml;
}

document
  .querySelector(".dress-grid")
  .addEventListener("click", async (event) => {
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

// fetching api data
async function getProducts(categoryName, rentOrSell) {
  const res = await fetch(
    `/api/products/category/${categoryName}/${rentOrSell}`
  );
  if (res.ok) {
    const data = await res.json();
    return data.products;
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

async function getWishlistItems() {
  const res = await fetch("/api/wishlist");

  if (res.ok) {
    const resData = await res.json();
    return resData.data;
  }
  return false;
}
