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

/*----------- fetch data ---------------*/
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
