const productsDiv = document.querySelector(".update-product-div");
const submitForm = document.querySelector("#product-info-form");

let selectedProducts = [];
let updatedImageIndexes = [];

/*--------- Display correct section ------------*/
const adminNav = document.querySelector(".admin-sidebar-btn");

const sectionToShow = urlParams.get("section");
if (sectionToShow) {
  if (
    ["add-product", "update-product", "order-details"].includes(sectionToShow)
  ) {
    toggleClass(sectionToShow + "-section");
  } else {
    toggleClass("add-product-section");
  }
} else {
  toggleClass("add-product-section");
}

adminNav.addEventListener("click", (event) => {
  if (
    event.target.id === "add-product-section" ||
    event.target.parentElement.id === "add-product-section"
  ) {
    toggleClass("add-product-section");
    changeFormForAddOrUpdate("add", "");
    clearForm();
  } else if (
    event.target.id === "update-product-section" ||
    event.target.parentElement.id === "update-product-section"
  ) {
    toggleClass("update-product-section");
    updateSectionToDisplay("prompt-category");
    clearForm();
  } else if (
    event.target.id === "order-details-section" ||
    event.target.parentElement.id === "order-details-section"
  ) {
    toggleClass("order-details-section");
  }
});

function toggleClass(currentDiv) {
  const sections = adminNav.children;
  for (const section of sections) {
    section.classList.remove("nav-active");
    document.querySelector(`.${section.id}`).style.display = "none";
  }
  adminNav.querySelector(`#${currentDiv}`).classList.add("nav-active");
  document.querySelector(`.${currentDiv}`).style.display = "block";
}

/*---------------- Add product functionality --------------*/

// set Category and subCategory inside select element
const categoryDiv = document.querySelector("#main-category");
const subCategoryDiv = document.querySelector("#sub-category");
document.querySelector("#main-category").addEventListener("change", (event) => {
  setSelectSubCategory(event.target.value, subCategoryDiv);
});

setSelectCategory(categoryDiv);

// inputs for product images
const productImageSection = document.querySelector(".product-img-section");

productImageSection.addEventListener("change", async (event) => {
  const imageTypes = ["image/jpeg", "image/png"];
  if (imageTypes.includes(event.target.files[0].type)) {
    setImageInDiv(event.target.files[0], event.target.parentElement);
    const index = +event.target.id.split("-")[1];
    updatedImageIndexes.push(index);
  }
});

async function setImageInDiv(file, parentDiv) {
  const arrayBuffer = await file.arrayBuffer();

  if (arrayBuffer.byteLength > 0) {
    const blob = new Blob([file], { type: file.type });
    const imageSrc = URL.createObjectURL(blob);

    const image = document.createElement("img");
    image.src = imageSrc;
    image.classList.add("product-images");
    parentDiv.parentElement.children[1].innerHTML = "";
    parentDiv.parentElement.children[1].appendChild(image);
  } else {
    console.log("ArrayBuffer is empty");
  }
}

// toggle sellPrice and rentPrice input

document.querySelector(".rent-sell").addEventListener("change", (event) => {
  const sellPriceInput = document.querySelector("#sell-price");
  const rentPriceInput = document.querySelector("#rent-price");
  if (event.target.id === "sell") {
    sellPriceInput.toggleAttribute("disabled");
  } else if (event.target.id === "rent") {
    rentPriceInput.toggleAttribute("disabled");
  }
});

/*---------- submitting form -----------*/

submitForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const productData = new FormData(submitForm);

  if (!productData.get("forSell")) {
    productData.append("forSell", "false");
  }

  if (!productData.get("forRent")) {
    productData.append("forRent", "false");
  }

  productData.append("indexes", updatedImageIndexes);
  let res = null;
  startOrStopLoader("start");
  if (submitForm.dataset.addOrUpdate === "add") {
    res = await fetch("/api/products", {
      method: "POST",
      body: productData,
    });
  } else if (submitForm.dataset.addOrUpdate === "update") {
    res = await fetch(`/api/products/${submitForm.dataset.productId}`, {
      method: "PUT",
      body: productData,
    });
  }
  startOrStopLoader("stop");

  if (res.ok) {
    clearForm();
  } else {
    getAlertPopup(res.message);
  }
});

function clearForm() {
  if (submitForm.dataset.addOrUpdate === "add") {
    console.log("coming");
    submitForm.reset();
    submitForm.querySelectorAll(".product-images").forEach((image) => {
      image.parentElement.innerHTML = "";
    });
  } else if (submitForm.dataset.addOrUpdate === "update") {
    submitForm.reset();
    submitForm.querySelectorAll(".product-images").forEach((image) => {
      image.parentElement.innerHTML = "";
    });
    const productId = submitForm.dataset.productId;
    const product = selectedProducts.find(
      (product) => product._id === productId
    );
    renderUpdateProductForm(product);
  }
}

const loader = document.querySelector(".loader-container");
function startOrStopLoader(startOrStop) {
  if (startOrStop === "start") {
    loader.style.display = "flex";
  } else {
    loader.style.display = "none";
  }
}

/*-------------- Update product functionalities ------------*/
const updateProductCategoryDiv = document.querySelector(
  "#update-product-main-category"
);
const updateProductSubCategoryDiv = document.querySelector(
  "#update-product-sub-category"
);

setSelectCategory(updateProductCategoryDiv);
document
  .querySelector("#update-product-main-category")
  .addEventListener("change", (event) => {
    setSelectSubCategory(event.target.value, updateProductSubCategoryDiv);
  });

document
  .querySelector("#find-products-to-update")
  .addEventListener("click", async () => {
    let products = null;
    if (updateProductCategoryDiv.value) {
      if (updateProductSubCategoryDiv.value) {
        products = await getProductsByCategory(
          updateProductSubCategoryDiv.value
        );
      } else {
        products = await getProductsByCategory(updateProductCategoryDiv.value);
      }
    }

    if (products) {
      renderProducts(products);
      updateSectionToDisplay("products-to-update");
      selectedProducts = products;
    } else {
      getAlertPopup("Products Not Found!!");
    }
  });

document.querySelector(".up-back-btn").addEventListener("click", () => {
  updateSectionToDisplay("prompt-category");
});

productsDiv.addEventListener("click", (event) => {
  if (event.target.classList.contains("update-product")) {
    const productId = event.target.parentElement.dataset.productId;
    const product = selectedProducts.find(
      (product) => product._id === productId
    );
    changeFormForAddOrUpdate("update", product._id);
    renderUpdateProductForm(product);
  }
});

const updateProductSections = document.querySelector(
  ".update-product-section"
).children;
function updateSectionToDisplay(section) {
  for (const section of updateProductSections) {
    section.style.display = "none";
  }
  document.querySelector(`.${section}`).style.display = "block";
}

function renderProducts(products) {
  productsDiv.innerHTML = "";
  for (const product of products) {
    const div = document.createElement("div");
    div.classList.add("up-item");

    div.innerHTML = `<img
                    class="up-img"
                    loading="lazy"
                    src="${product.image}"
                    alt=""
                  />
                  <div class="up-item-info">
                    <div class="name-price">
                      <p class="name"></p>
                      <p class="price">Rs. 2000</p>
                    </div>
                  </div>
                  <div class="update-delete-product" data-product-id="${product._id}"><button class="update-product">Update</button><button>Delete</button></div>`;
    div.querySelector(".name").innerText = product.name;
    if (product.sellPrice) {
      div.querySelector(".price").innerText = `Rs. ${product.sellPrice}`;
    } else {
      div.querySelector(".price").innerText = `Rs. ${product.rentPrice}/day`;
    }
    productsDiv.appendChild(div);
  }
}

async function renderUpdateProductForm(product) {
  const images = [product.image, ...product.images];
  console.log("product after reset", product);
  let i = 0;
  for (input of submitForm) {
    if (input.name === "file") {
      const img = document.createElement("img");
      img.classList.add("product-images");
      img.src = images[i];

      input.parentElement.parentElement.children[1].appendChild(img);
      i++;
      input.value = "";
    } else if (input.type === "checkbox") {
      console.log("coming in checkbox");
      input.value = product[input.name];
      input.checked = product[input.name];
      console.log(input.value, input.checked);
    } else if (input.name === "sellPrice") {
      if (product.sellPrice !== 0) {
        input.value = product.sellPrice;
        input.disabled = false;
      } else {
        input.disabled = true;
      }
    } else if (input.name === "rentPrice") {
      if (product.rentPrice !== 0) {
        input.value = product.rentPrice;
        input.disabled = false;
      } else {
        input.disabled = true;
      }
    } else if (input.name === "category") {
      await setSelectSubCategory(product.category[0], subCategoryDiv);
      input.value = product.category[0];
    } else if (input.name === "subCategory") {
      input.value = product.category[1];
    } else if (input.id === "size") {
      input.value = product.sizeAvailable[input.name];
    } else if (input.type !== "submit" && input.type !== "reset") {
      input.value = product[input.name];
    }
  }

  document.querySelector(".products-to-update").style.display = "none";
  document.querySelector(".add-product-section").style.display = "block";
}

/*---------------------------*/
async function setSelectSubCategory(catId, categoryDiv) {
  const categories = await getAllSubCategory(catId);
  categoryDiv.innerHTML = `<option disabled selected value="">--Select sub category--</option>`;

  for (const category of categories) {
    const option = document.createElement("option");
    option.value = category._id;
    option.innerText = category.categoryName;
    categoryDiv.appendChild(option);
  }
}

async function setSelectCategory(categoryDiv) {
  const categories = await getAllCategories();
  categoryDiv.innerHTML = `<option disabled selected value="">--Select main category--</option>`;

  for (const category of categories) {
    const option = document.createElement("option");
    option.value = category._id;
    option.innerText = category.categoryName;
    categoryDiv.appendChild(option);
  }
}

function changeFormForAddOrUpdate(addOrUpdate, productId) {
  if (addOrUpdate === "add") {
    document.querySelector("#file-0").setAttribute("required", "true");
    document.querySelector("#file-1").setAttribute("required", "true");

    document.querySelector("#main-category").disabled = false;
    document.querySelector("#sub-category").disabled = false;
    submitForm.dataset.productId = "";
    submitForm.dataset.addOrUpdate = "add";
  } else if (addOrUpdate === "update") {
    document.querySelector("#file-0").removeAttribute("required");
    document.querySelector("#file-1").removeAttribute("required");

    document.querySelector("#main-category").disabled = true;
    document.querySelector("#sub-category").disabled = true;
    submitForm.dataset.productId = productId;
    submitForm.dataset.addOrUpdate = "update";
  }
}

/*---------- fetching data -----------*/

async function getAllCategories() {
  const res = await fetch("/api/categories", {
    method: "GET",
  });

  if (res.ok) {
    const resData = await res.json();
    const categories = resData.categories;
    return categories;
  } else {
    return false;
  }
}

async function getAllSubCategory(categoryName) {
  const res = await fetch(`/api/categories/${categoryName}`);

  if (res.ok) {
    const resData = await res.json();
    return resData.subCategories;
  } else {
    return false;
  }
}

async function getProductsByCategory(categoryId) {
  const res = await fetch(`/api/products/category/${categoryId}/admin`);

  if (res.ok) {
    const resData = await res.json();
    console.log(resData.products);
    return resData.products;
  }
  return false;
}
