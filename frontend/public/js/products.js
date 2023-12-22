const contentBox = document.querySelector(".dress-grid");

let path = window.location.href.split("/");
path = path[path.length - 1];

renderProducts(path);

async function renderProducts(categoryName) {
  const products = await getProducts(categoryName);
  const wishList = await getWishlistItems();

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

function createProductHtml(product, productInWishlist) {
  const classOfHeart = productInWishlist ? "bxs-heart" : "bx-heart";
  const productName = product.name.replace(/ /g, "-");

  const productHtml = `
    <a href="/${productName}/${product._id}/buy" target = "_blank" class="product">
      <div class="dress-div">
          <div class="dress-img">
              <img src="${product.image}" alt="" />
          </div>
          <div class="dress-info">
              <div class="dress-np">
                  <p class="name">${product.name}</p>
                  <p class="price">&#8377;<span>${product.price}</span></p>
              </div>
              <div class="add">
                  <i class="bx ${classOfHeart} heart" data-product-id=${product._id}></i>
              </div>
          </div>
      </div>
    </a>`;
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
async function getProducts(categoryName) {
  const res = await fetch(`/api/products/category/${categoryName}`);
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
