const mainProdctImage = document.querySelector("#productImg");
const moreImagesDiv = document.querySelector(".more-img");

moreImagesDiv.addEventListener("click", (event) => {
  if (event.target.classList.contains("smallImg")) {
    const imageSrc = event.target.src;
    mainProdctImage.src = imageSrc;
  }
});

document.querySelector(".btns").addEventListener("click", async (event) => {
  const element = event.target;
  const productId = element.parentNode.dataset.productId;

  if (element.id === "add-to-wishlist") {
    const res = await addToWishlist(productId);
    if (!res) {
      window.location.href = "/login";
    } else {
      window.open("/my-wishlist", "_blank");
    }
  } else if (element.id === "add-to-bag") {
    const res = await addToBag(productId);
  }
});

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

async function addToBag(productId) {
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
