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
const orderListSection = document.querySelector(".ordered-list-section");
const orderedProductDetailsSection = document.querySelector(
  ".ordered-product-detail-section"
);
const orderDetailsSections = [orderListSection, orderedProductDetailsSection];
const orderListTable = document.querySelector(".od-table");
const orderedProductDetailTable = document.querySelector(
  ".product-detail-table"
);
const orderUserDetailsDiv = document.querySelector(".user-name-phone");
const orderShippingAddressDiv = document.querySelector(".Shipping-address-div");

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
let orders = [];
let showDetailsOfOrder = {};
let updateOrderProduct = [];
let orderSelectedToUpdate = {};
let statusChangedOfProducts = {};

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

/*-------------- Order Details --------------*/
toggleOrderDetailsSections("order-list");

getOrders()
  .then((data) => {
    renderOrderListTable(data);
    orders = data;
  })
  .catch((error) => console.log(error));

orderListTable.addEventListener("click", (event) => {
  const element = event.target;
  if (element.classList.contains("show-details")) {
    const orderIndex = element.dataset.orderIndex - 1;

    orderSelectedToUpdate = orders[orderIndex];
    renderOrderDetails(orders[orderIndex]);
    toggleOrderDetailsSections("order-details");
  }
});

document
  .querySelector("#search-order-id")
  .addEventListener("keyup", (event) => {
    const valueToSearch = event.target.value;
    searchOrderByIdOrEmail(valueToSearch);
  });

orderedProductDetailsSection.addEventListener("click", async (event) => {
  const element = event.target;
  if (element.classList.contains("back-button")) {
    toggleOrderDetailsSections("order-list");
  } else if (element.classList.contains("edit-product-status-btn")) {
    enableOrDisableProductStatusUpdate("enable");
    toggleEditOrUpdateDiv("edit");
  } else if (element.classList.contains("update")) {
    if (statusChangedOfProducts) {
      startOrStopLoader("start");
      const response = await updateOrderProductStatus(
        orderSelectedToUpdate._id,
        statusChangedOfProducts
      );
      startOrStopLoader("stop");

      if (response.success) {
        for (const productChangedIndex in statusChangedOfProducts) {
          orderSelectedToUpdate.items[productChangedIndex].status =
            statusChangedOfProducts[productChangedIndex];
        }
        renderOrderProductDetails(orderSelectedToUpdate.items);
        toggleEditOrUpdateDiv("update");
        getAlertPopup("Updated Successfully!");
      } else {
        cancelUpdateAndResetProductStatus();
        getAlertPopup(response.message);
      }
    }
  } else if (element.classList.contains("cancel")) {
    cancelUpdateAndResetProductStatus();
    statusChangedOfProducts = {};
  }
});

orderedProductDetailTable.addEventListener("change", (event) => {
  const element = event.target;
  const index = element.dataset.itemIndex - 1;
  statusChangedOfProducts[index] = element.value;
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

function toggleOrderDetailsSections(section) {
  for (const section of orderDetailsSections) {
    section.style.display = "none";
  }
  if (section === "order-list") {
    orderListSection.style.display = "block";
  } else if (section === "order-details") {
    orderedProductDetailsSection.style.display = "block";
  }
}

function renderOrderListTable(orders) {
  let i = 1;
  for (const order of orders) {
    const { _id, orderStatus, createdAt } = order;
    const { firstName, lastName, email } = order.user;
    const date = new Date(createdAt);

    const row = orderListTable.insertRow(i);
    row.innerHTML = `
    <td>${i}.</td>
    <td>${_id}</td>
    <td>${firstName + " " + lastName}</td>
    <td>${email}</td>
    <td>${date.toLocaleDateString()}</td>
    <td>${orderStatus}</td>
    <td data-order-index="${i}" class="show-details">Show Details</td>`;
    i++;
  }
}

function renderOrderDetails(order) {
  renderOrderUserDetails(order);
  renderOrderProductDetails(order.items);
}

function renderOrderUserDetails(orderDetails) {
  orderUserDetailsDiv.innerHTML = "";
  document.querySelector("#order-id").innerHTML = orderDetails._id;
  const { firstName, lastName, email, phoneNumber } = orderDetails.user;
  const obj = {
    Name: firstName + " " + lastName,
    "Phone Number": phoneNumber,
    Email: email,
  };

  for (const element in obj) {
    const p = document.createElement("p");
    p.innerText = `${element}: `;
    const span = document.createElement("span");
    span.innerText = obj[element];
    p.appendChild(span);
    orderUserDetailsDiv.appendChild(p);
  }

  //shipping address
  orderShippingAddressDiv.innerHTML = "";
  const {
    name,
    phoneNumber: number,
    addressLine1,
    addressLine2,
    district,
    state,
    pinCode,
  } = orderDetails.shippingAddress;
  const p1 = document.createElement("p");
  p1.id = "my-name-phone";
  const span1 = document.createElement("span");
  span1.innerText = name;
  const span2 = document.createElement("span");
  span2.innerText = number;
  p1.appendChild(span1);
  p1.appendChild(span2);
  orderShippingAddressDiv.appendChild(p1);

  const p2 = document.createElement("p");
  p2.innerText =
    addressLine1 + " " + addressLine2 + " " + district + " " + state;
  const span3 = document.createElement("span");
  span3.innerText = `- ${pinCode}`;
  p2.appendChild(span3);
  orderShippingAddressDiv.appendChild(p2);
}

function renderOrderProductDetails(products) {
  console.log(products);
  const rows = orderedProductDetailTable.rows;

  while (rows.length > 1) {
    orderedProductDetailTable.deleteRow(1);
  }
  let i = 1;
  for (const item of products) {
    const row = orderedProductDetailTable.insertRow(i);
    const image = "/" + item.product.image.split("/").splice(2).join("/");
    const productName = item.product.name;
    const { productSize, quantity } = item;
    row.innerHTML = `
    <td>${i}.</td>
    <td id="op-img">
      <img
        src="${image}"
        alt="${productName}"
      />
    </td>
    <td id="op-name">${productName}</td>
    <td id="op-size">${productSize}</td>
    <td id="op-quantity">${quantity}</td>
    <td id="op-status">${item.status}</td>
    <td onclick="window.location.href = '/sell/${productName
      .split(" ")
      .join("-")}/${item.product._id}/buy'" id="op-open">Open product page</td>
    <td id="update-product-status">
      <select disabled data-item-index="${i}" name="productStatus">
        <option value="Processing">Processing</option>
        <option value="Shipped">Shipped</option>
        <option value="Delivered">Delivered</option>
      </select>
    </td>
    `;
    i++;
    // pre select current status of product in selection options
    const options = row.querySelector("select").options;
    for (const option of options) {
      if (option.value === item.status) {
        option.selected = true;
      } else {
        option.selected = false;
      }
    }
  }
}

function resetProductStatusInSelectElement() {
  const selectElements = orderedProductDetailTable.querySelectorAll("select");
  const items = orderSelectedToUpdate.items;
  for (let i = 0; i < items.length; i++) {
    const options = selectElements[i].options;
    for (const option of options) {
      if (items[i].status === option.value) {
        option.selected = true;
      } else {
        option.selected = false;
      }
    }
  }
}

function enableOrDisableProductStatusUpdate(enableOrDisable) {
  const selectElements = orderedProductDetailTable.querySelectorAll("select");
  if (enableOrDisable === "enable") {
    for (const element of selectElements) {
      element.disabled = false;
    }
  } else if (enableOrDisable === "disable") {
    for (const element of selectElements) {
      element.disabled = true;
    }
  }
}

function toggleEditOrUpdateDiv(editOrUpdateOrCancel) {
  if (editOrUpdateOrCancel === "edit") {
    document.querySelector(".edit-product-status-btn").style.display = "none";
    document.querySelector("#update-order-btns").style.display = "block";
  } else if (
    editOrUpdateOrCancel === "update" ||
    editOrUpdateOrCancel === "cancel"
  ) {
    document.querySelector(".edit-product-status-btn").style.display = "block";
    document.querySelector("#update-order-btns").style.display = "none";
  }
}

function cancelUpdateAndResetProductStatus() {
  resetProductStatusInSelectElement();
  enableOrDisableProductStatusUpdate("disable");
  toggleEditOrUpdateDiv("cancel");
}

function searchOrderByIdOrEmail(valueToSearch) {
  valueToSearch = valueToSearch.toUpperCase();
  const rows = orderListTable.rows;
  for (let i = 1; i < rows.length; i++) {
    const orderId = rows[i].cells[1].innerText.toUpperCase();
    const email = rows[i].cells[3].innerText.toUpperCase();

    if (
      orderId.indexOf(valueToSearch) > -1 ||
      email.indexOf(valueToSearch) > -1
    ) {
      rows[i].style.display = "";
    } else {
      rows[i].style.display = "none";
    }
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
    return resData.products;
  }
  return false;
}

async function getOrders() {
  const res = await fetch("/api/order");
  if (res.ok) {
    const data = await res.json();
    return data.orders;
  }
  return false;
}

async function updateOrderProductStatus(orderId, changedItemIndexAndValue) {
  const res = await fetch(`/api/order/${orderId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      itemsDetailsToChange: changedItemIndexAndValue,
    }),
  });
  const response = await res.json();
  return response;
}
