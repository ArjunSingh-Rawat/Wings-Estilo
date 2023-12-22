const contentBox = document.querySelector(".dress-grid");

let path = window.location.href.split("/");
path = path[path.length - 1];

renderProducts(path);

async function renderProducts(categoryName) {
  const products = await getProducts(categoryName);

  products.forEach((product) => {
    const productHtml = `
    <a href="/${product.name}/${product._id}/buy" target = "_blank" class="product">
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
                  <i class="bx bx-heart heart"></i>
              </div>
          </div>
      </div>
    </a>`;
    contentBox.innerHTML += productHtml;
  });
}

document.querySelector(".dress-grid").addEventListener("click", (event) => {
  if (event.target.classList.contains("heart")) {
    event.preventDefault();

    const heart = event.target;

    if (heart.classList.contains("bx-heart")) {
      heart.classList.remove("bx-heart");
      heart.classList.add("bxs-heart");
      heartTransform(heart);
    } else {
      heart.classList.remove("bxs-heart");
      heart.classList.add("bx-heart");
      heartTransform(heart);
    }
  }
});

function heartTransform(heart) {
  heart.style.transform = "scale(2,2)";

  setTimeout(() => {
    heart.style.transform = "";
  }, 300);
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
