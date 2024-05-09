const adminNav = document.querySelector(".admin-sidebar-btn");
const addProductSection = document.querySelector(".add-product-section");
const updateProductSection = document.querySelector(".update-product-section");
const orderDetailsSection = document.querySelector(".order-details-section");

const loader = document.querySelector(".loader-container");

const addProductForm = document.querySelector("#add-product-form");
const addFormMainCategoryElement = document.querySelector(
  "#add-product-main-category"
);
const addFormSubCategoryElement = document.querySelector(
  "#add-product-sub-category"
);
const addProductImageSection = document.querySelector(
  ".add-product-img-section"
);
const sellPriceInputElement = document.querySelector("#sell-price");
const rentPriceInputElement = document.querySelector("#rent-price");
const updateFormMainCategoryElement = document.querySelector(
  "#update-product-form-main-category"
);
const updateFormSubCategoryElement = document.querySelector(
  "#update-product-form-sub-category"
);
const updateProductCategoryElement = document.querySelector(
  "#update-product-main-category"
);
const updateProductSubCategoryElement = document.querySelector(
  "#update-product-sub-category"
);
const updateProductsDiv = document.querySelector(".update-product-div");
const u_pPromptCategorySection = document.querySelector(".prompt-category");
const u_pProductsSection = document.querySelector(".products-to-update");
const u_pFormSection = document.querySelector(".update-product-form-section");
const updateProductSections = [
  u_pPromptCategorySection,
  u_pProductsSection,
  u_pFormSection,
];
const updateProductForm = document.querySelector("#update-product-form");
const updateProductImageSection = document.querySelector(
  ".update-product-img-section"
);
const updateProductSellPriceInput = document.querySelector(
  "#update-product-sell-price"
);
const updateProductRentPriceInput = document.querySelector(
  "#update-product-rent-price"
);

const sectionsButtonArray = adminNav.children;
const sections = {
  "add-product": {
    button: sectionsButtonArray[0],
    section: addProductSection,
  },
  "update-product": {
    button: sectionsButtonArray[1],
    section: updateProductSection,
  },
  "order-details": {
    button: sectionsButtonArray[2],
    section: orderDetailsSection,
  },
};
const imageTypes = ["image/jpeg", "image/png"];
let foundProductsForUpdate = null;
let productSelectedForUpdate = null;
let updatedImageIndexes = [];

/*--------- Display correct section ------------*/

const sectionToShowOnPageLoad = urlParams.get("section");
if (sectionToShowOnPageLoad) {
  if (
    ["add-product", "update-product", "order-details"].includes(
      sectionToShowOnPageLoad
    )
  ) {
    toggleSections(sectionToShowOnPageLoad);
  } else {
    toggleSections("add-product");
  }
} else {
  toggleSections("add-product");
}

adminNav.addEventListener("click", (event) => {
  if (event.target.id === "add-product-section") {
    toggleSections("add-product");
  } else if (event.target.id === "update-product-section") {
    toggleSections("update-product");
  } else if (event.target.id === "order-details-section") {
    toggleSections("order-details");
  }
});

/*---------------- Add product section logic --------------*/
//set categories in select element in form
setMainCategories(addFormMainCategoryElement);
addFormMainCategoryElement.addEventListener("change", (event) => {
  setSubCategories(event.target.value, addFormSubCategoryElement);
});

// inputs for product images
addProductImageSection.addEventListener("change", (event) => {
  const imageFile = event.target.files[0];
  if (imageTypes.includes(imageFile.type)) {
    const imageUrl = imageFileToBlobToUrl(imageFile);
    if (imageUrl) {
      setImageInDiv(imageUrl, event.target.parentElement);
    }
  }
});

// toggle sellPrice and rentPrice input
document
  .querySelector(".add-product-rent-sell")
  .addEventListener("change", (event) => {
    if (event.target.id === "sell") {
      sellPriceInputElement.toggleAttribute("disabled");
    } else if (event.target.id === "rent") {
      rentPriceInputElement.toggleAttribute("disabled");
    }
  });

//submit add product form
addProductForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const productData = new FormData(addProductForm);
  if (!productData.get("forSell")) {
    productData.append("forSell", "false");
  }
  if (!productData.get("forRent")) {
    productData.append("forRent", "false");
  }

  startOrStopLoader("start");
  const res = await fetch("/api/products", {
    method: "POST",
    body: productData,
  });
  startOrStopLoader("stop");

  if (res.ok) {
    clearForm("add-product-form");
  } else {
    getAlertPopup(res.message);
  }
});

/*------------- Update Product Section Logic ------------*/
setMainCategories(updateProductCategoryElement);
updateProductCategoryElement.addEventListener("change", (event) => {
  setSubCategories(event.target.value, updateProductSubCategoryElement);
});
toggleUpdateProductSections(u_pPromptCategorySection);

//find products for selected category and show then in products section
document
  .querySelector("#find-products-to-update")
  .addEventListener("click", async () => {
    let products = null;
    const mainCategoryId = updateProductCategoryElement.value;
    const subCategoryId = updateProductSubCategoryElement.value;

    if (mainCategoryId) {
      if (subCategoryId) {
        products = await getProductsByCategory(subCategoryId);
      } else {
        products = await getProductsByCategory(mainCategoryId);
      }
    }
    if (products) {
      renderUpdateProducts(products);
      toggleUpdateProductSections(u_pProductsSection);
      foundProductsForUpdate = products;
    } else {
      getAlertPopup("Products Not Found!!");
    }
  });

setMainCategories(updateFormMainCategoryElement);

// open update form with selected product or delete product
updateProductsDiv.addEventListener("click", async (event) => {
  const element = event.target;
  const productId = element.parentElement.dataset.productId;
  if (element.classList.contains("update-product")) {
    const product = foundProductsForUpdate.find(
      (product) => product._id === productId
    );
    productSelectedForUpdate = product;
    preFillUpdateProductForm(product);
    toggleUpdateProductSections(u_pFormSection);
  }
});

//input for update product images
updateProductImageSection.addEventListener("change", (event) => {
  const imageFile = event.target.files[0];
  if (imageTypes.includes(imageFile.type)) {
    const imageUrl = imageFileToBlobToUrl(imageFile);
    const index = +event.target.id.split("-").pop();
    updatedImageIndexes.push(index);
    if (imageUrl) {
      setImageInDiv(imageUrl, event.target.parentElement);
    }
  }
});

document
  .querySelector(".update-product-rent-sell")
  .addEventListener("change", (event) => {
    if (event.target.id === "sell") {
      updateProductSellPriceInput.toggleAttribute("disabled");
    } else if (event.target.id === "rent") {
      updateProductRentPriceInput.toggleAttribute("disabled");
    }
  });

updateProductForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const updateProductFormData = new FormData(updateProductForm);
  if (!updateProductFormData.get("forSell")) {
    updateProductFormData.append("forSell", "false");
  }
  if (!updateProductFormData.get("forRent")) {
    updateProductFormData.append("forRent", "false");
  }

  updateProductFormData.append("indexes", updatedImageIndexes);

  startOrStopLoader("start");
  const res = await fetch(`/api/products/${productSelectedForUpdate._id}`, {
    method: "PUT",
    body: updateProductFormData,
  });
  startOrStopLoader("stop");

  if (res.ok) {
    toggleUpdateProductSections(u_pProductsSection);
    getAlertPopup("product updated successfully!");
    const data = await res.json();
    updateFoundProductsData(data.newItem);
  } else {
    getAlertPopup(res.message);
  }
});

/*-------- Functions ---------*/
function toggleSections(sectionToShow) {
  for (const section in sections) {
    sections[section].button.classList.remove("nav-active");
    sections[section].section.style.display = "none";
  }
  sections[sectionToShow].button.classList.add("nav-active");
  sections[sectionToShow].section.style.display = "block";
}

function startOrStopLoader(startOrStop) {
  if (startOrStop === "start") {
    loader.style.display = "flex";
  } else {
    loader.style.display = "none";
  }
}

async function setMainCategories(selectElement) {
  const categories = await getAllCategories();
  selectElement.innerHTML = `<option disabled selected value="">--Select main category--</option>`;
  for (const category of categories) {
    const option = document.createElement("option");
    option.value = category._id;
    option.innerText = category.categoryName;
    selectElement.appendChild(option);
  }
}

async function setSubCategories(categoryId, selectElement) {
  const categories = await getAllSubCategory(categoryId);
  selectElement.innerHTML = `<option disabled selected value="">--Select sub category--</option>`;
  for (const category of categories) {
    const option = document.createElement("option");
    option.value = category._id;
    option.innerText = category.categoryName;
    selectElement.appendChild(option);
  }
}

function imageFileToBlobToUrl(imageFile) {
  const blob = new Blob([imageFile], { type: imageFile.type });
  if (blob.size > 0) {
    const imageUrl = URL.createObjectURL(blob);
    return imageUrl;
  }
  getAlertPopup("File is empty!!");
  return false;
}

async function setImageInDiv(imageUrl, noImageDiv) {
  const image = document.createElement("img");
  image.src = imageUrl;
  image.classList.add("product-images");

  const imageDiv = noImageDiv.parentElement.children[1];
  imageDiv.innerHTML = "";
  if (imageUrl) imageDiv.appendChild(image);
}

function clearForm(addOrUpdateForm, e) {
  e.preventDefault();
  if (addOrUpdateForm === "add-product-form") {
    addProductForm.reset();
    addProductForm.querySelectorAll(".product-images").forEach((image) => {
      image.parentElement.innerHTML = "";
    });
  } else if (addOrUpdateForm === "update-product-form") {
    preFillUpdateProductForm(productSelectedForUpdate);
    updatedImageIndexes = [];
  }
}

function toggleUpdateProductSections(section) {
  for (const section of updateProductSections) {
    section.style.display = "none";
  }
  section.style.display = "block";
}

function renderUpdateProducts(products) {
  updateProductsDiv.innerHTML = "";
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
                  <div class="update-delete-product" data-product-id="${product._id}"><button class="update-product">Update</button><button class="delete-product">Delete</button></div>`;
    div.querySelector(".name").innerText = product.name;
    if (product.sellPrice) {
      div.querySelector(".price").innerText = `Rs. ${product.sellPrice}`;
    } else {
      div.querySelector(".price").innerText = `Rs. ${product.rentPrice}/day`;
    }
    updateProductsDiv.appendChild(div);
  }
}

function u_pGoBackToSection(section) {
  if (section === "prompt-category") {
    toggleUpdateProductSections(u_pPromptCategorySection);
  } else if (section === "products-to-update") {
    toggleUpdateProductSections(u_pProductsSection);
  }
}

async function preFillUpdateProductForm(product) {
  const images = [product.image, ...product.images];
  let i = 0;
  for (input of updateProductForm) {
    if (input.name === "file") {
      const imageUrl = images[i];
      setImageInDiv(imageUrl, input.parentElement);
      i++;
      input.value = "";
    } else if (input.type === "checkbox") {
      input.checked = product[input.name];
    } else if (input.name === "sellPrice") {
      product.forSell ? (input.disabled = false) : (input.display = true);
      input.value = product.sellPrice;
    } else if (input.name === "rentPrice") {
      product.forRent ? (input.disabled = false) : (input.display = true);
      input.value = product.rentPrice;
    } else if (input.name === "category") {
      await setSubCategories(product.category[0], updateFormSubCategoryElement);
      input.disabled = true;
      input.value = product.category[0];
    } else if (input.name === "subCategory") {
      input.value = product.category[1];
      input.disabled = true;
    } else if (input.id === "size") {
      input.value = product.sizeAvailable[input.name];
    } else if (input.type !== "submit" && input.type !== "reset") {
      input.value = product[input.name];
    }
  }
}

function updateFoundProductsData(updatedProduct) {
  const index = foundProductsForUpdate.findIndex(
    (product) => product._id === updatedProduct._id
  );
  cleanUpUpdatedProductDetails(updatedProduct);
  foundProductsForUpdate[index] = updatedProduct;
}

function cleanUpUpdatedProductDetails(updatedProduct) {
  // image path for local folder
  updatedProduct.image =
    "/" + updatedProduct.image.split("/").splice(2).join("/");
  let arr = [];
  for (const image of updatedProduct.images) {
    let src = "/" + image.split("/").splice(2).join("/");
    arr.push(src);
  }
  updatedProduct.images = arr;
  // need only categoryId not full details of category
  arr = [];
  for (const category of updatedProduct.category) {
    arr.push(category._id);
  }
  updatedProduct.category = arr;
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
    return resData.products;
  }
  return false;
}
