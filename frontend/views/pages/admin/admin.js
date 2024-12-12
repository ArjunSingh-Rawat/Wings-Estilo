const adminNav = document.querySelector(".admin-sidebar-btn");
const addProductSection = document.querySelector(".add-product-section");
const updateProductSection = document.querySelector(".update-product-section");
const orderDetailsSection = document.querySelector(".order-details-section");

const loader = document.querySelector(".loader-container");

const addProductForm = document.querySelector("#add-product-form");
const addFormMainCategoryElement = document.querySelector(
  "#add-product-form #main-category"
);
const addFormSubCategoryElement = document.querySelector(
  "#add-product-form #sub-category"
);
const addProductImageSection = document.querySelector(
  ".add-product-img-section"
);
const sellPriceInputElement = document.querySelector(
  "#add-product-form #sell-price"
);
const rentPriceInputElement = document.querySelector(
  "#add-product-form #rent-price"
);
const depositChargeInputElement = document.querySelector(
  "#add-product-form #deposit-charge"
);
const updateFormMainCategoryElement = document.querySelector(
  "#update-product-form #main-category"
);
const updateFormSubCategoryElement = document.querySelector(
  "#update-product-form #sub-category"
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
  "#update-product-form #sell-price"
);
const updateProductRentPriceInput = document.querySelector(
  "#update-product-form #rent-price"
);
const updateProductDepositChargeInput = document.querySelector(
  "#update-product-form #deposit-charge"
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
const orderFilterDiv = document.querySelector(".od-sort-filter-div");
const deleteOrCancelProductDiv = document.querySelector(
  ".confirm-product-delete-div"
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
let orders = [];
let showDetailsOfOrder = {};
let updateOrderProduct = [];
let orderSelectedToUpdate = {};
let statusChangedOfProducts = {};
let arrayToSort = [];
let incompleteOrdersArray = [];
let completeOrdersArray = [];
const maxSizeInBytes = 500 * 1024; // 500kb

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
    if (imageFile.size > maxSizeInBytes) {
      alert("File size exceeds 500kb MB. Please choose a smaller file.");
      event.target.value = "";
      return;
    }
    const imageUrl = imageFileToBlobToUrl(imageFile);
    if (imageUrl) {
      setImageInDiv(imageUrl, event.target.parentElement);
    }
  }
});

const sellDescription = document.querySelector(
  "#add-product-form #sell-main-description"
);
const rentDescription = document.querySelector(
  "#add-product-form #rent-main-description"
);

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

  if (productData.get("forSell") === "true" && !sellDescription.value) {
    sellDescription.setCustomValidity("Please provide a description for sale.");
  }

  if (productData.get("forRent") === "true" && !rentDescription.value) {
    rentDescription.setCustomValidity("Please provide a description for rent.");
  }

  if (!addProductForm.checkValidity()) {
    addProductForm.reportValidity();
    return;
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

sellDescription.addEventListener("input", (event) => {
  if (sellDescription.value) {
    sellDescription.setCustomValidity("");
  }
});

rentDescription.addEventListener("input", () => {
  if (rentDescription.value) {
    rentDescription.setCustomValidity("");
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
let selectedProductIdToUpdateOrDelete = null;
updateProductsDiv.addEventListener("click", (event) => {
  const element = event.target;
  selectedProductIdToUpdateOrDelete = element.parentElement.dataset.productId;
  if (element.classList.contains("update-product")) {
    const product = foundProductsForUpdate.find(
      (product) => product._id === selectedProductIdToUpdateOrDelete
    );
    productSelectedForUpdate = product;
    preFillUpdateProductForm(product);
    toggleUpdateProductSections(u_pFormSection);
  }
  if (element.classList.contains("delete-product")) {
    toggleDisplayOfConfirmDeletePopup("flex");
  }
});

//input for update product images
updateProductImageSection.addEventListener("change", (event) => {
  const imageFile = event.target.files[0];
  if (imageTypes.includes(imageFile.type)) {
    if (imageFile.size > maxSizeInBytes) {
      alert("File size exceeds 500kb MB. Please choose a smaller file.");
      event.target.value = "";
      return;
    }
    const imageUrl = imageFileToBlobToUrl(imageFile);
    const index = +event.target.id.split("-").pop();
    updatedImageIndexes.push(index);
    if (imageUrl) {
      setImageInDiv(imageUrl, event.target.parentElement);
    }
  }
});

const updateSellDescription = document.querySelector(
  "#update-product-form #sell-main-description"
);
const updateRentDescription = document.querySelector(
  "#update-product-form #rent-main-description"
);

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

  if (
    updateProductFormData.get("forSell") === "true" &&
    !updateSellDescription.value
  ) {
    updateSellDescription.setCustomValidity(
      "Please provide a description for sale."
    );
  }

  if (
    updateProductFormData.get("forRent") === "true" &&
    !updateRentDescription.value
  ) {
    updateRentDescription.setCustomValidity(
      "Please provide a description for rent."
    );
  }

  if (!updateProductForm.checkValidity()) {
    updateProductForm.reportValidity();
    return;
  }

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

updateSellDescription.addEventListener("input", (event) => {
  if (updateSellDescription.value) {
    updateSellDescription.setCustomValidity("");
  }
});

updateRentDescription.addEventListener("input", () => {
  if (updateRentDescription.value) {
    updateRentDescription.setCustomValidity("");
  }
});

// delete product
deleteOrCancelProductDiv.addEventListener("click", async (event) => {
  const element = event.target;
  if (element.classList.contains("delete")) {
    startOrStopLoader("start");
    const response = await deleteProduct(selectedProductIdToUpdateOrDelete);
    startOrStopLoader("stop");

    if (response.success) {
      toggleDisplayOfConfirmDeletePopup("none");
      deleteProductFormFoundProducts(selectedProductIdToUpdateOrDelete);
      renderUpdateProducts(foundProductsForUpdate);
      getAlertPopup("product deleted successfully!");
    } else {
      toggleDisplayOfConfirmDeletePopup("none");
      getAlertPopup(response.message);
    }
  } else if (element.classList.contains("cancel")) {
    toggleDisplayOfConfirmDeletePopup("none");
  }
});

/*-------------- Order Details --------------*/
toggleOrderDetailsSections("order-list");

getOrders()
  .then((data) => {
    renderOrderListTable(data);
    orders = data;
    changeFilterOrdersArray(orders);
  })
  .catch((error) => console.log(error));

orderListTable.addEventListener("click", (event) => {
  const element = event.target;
  if (element.classList.contains("show-details")) {
    indexOfOrderSelectedToUpdate = element.dataset.orderIndex - 1;

    orderSelectedToUpdate = orders[indexOfOrderSelectedToUpdate];
    renderOrderDetails(orders[indexOfOrderSelectedToUpdate]);
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
    changeFilterOrdersArray(orders);
    renderOrderListTable(orders);
  } else if (element.classList.contains("edit-product-status-btn")) {
    enableOrDisableProductStatusUpdate("enable");
    toggleEditOrUpdateDiv("edit");
  } else if (element.classList.contains("update")) {
    if (statusChangedOfProducts) {
      startOrStopLoader("start");
      const response = await updateOrderProductStatus(
        orderSelectedToUpdate._id,
        statusChangedOfProducts,
        orderSelectedToUpdate.orderType
      );
      startOrStopLoader("stop");

      if (response.success) {
        for (const productChangedIndex in statusChangedOfProducts) {
          orderSelectedToUpdate.items[productChangedIndex].status =
            statusChangedOfProducts[productChangedIndex];
        }
        orderSelectedToUpdate.orderStatus = response.orderStatus;

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

let currentFilter = "";
orderFilterDiv.addEventListener("change", (event) => {
  const element = event.target;
  if (element.value === "latest") {
    sortFilterArrays(sortByLatest);
  } else if (element.value === "oldest") {
    sortFilterArrays(sortByOldest);
  } else if (element.value === "complete") {
    currentFilter = "complete";
    renderOrderListTable([...completeOrdersArray, ...incompleteOrdersArray]);
  } else if (element.value === "incomplete") {
    currentFilter = "incomplete";
    renderOrderListTable([...incompleteOrdersArray, ...completeOrdersArray]);
  } else if (element.id === "clear-all-btn") {
    renderOrderListTable(orders);
    element.checked = false;
    orderFilterDiv.querySelectorAll("option").forEach((option) => {
      option.value === "none"
        ? (option.selected = true)
        : (option.selected = false);
    });
    currentFilter = "";
  }
});

/*-------- Functions ---------*/
function toggleAddProductPriceInputElements(event) {
  if (event.target.id === "sell") {
    sellPriceInputElement.toggleAttribute("disabled");
    sellDescription.toggleAttribute("disabled");
  } else if (event.target.id === "rent") {
    rentPriceInputElement.toggleAttribute("disabled");
    depositChargeInputElement.toggleAttribute("disabled");
    rentDescription.toggleAttribute("disabled");
  }
}

function toggleUpdateProductPriceInputElements(event) {
  if (event.target.id === "sell") {
    updateProductSellPriceInput.toggleAttribute("disabled");
    updateSellDescription.toggleAttribute("disabled");
  } else if (event.target.id === "rent") {
    updateProductRentPriceInput.toggleAttribute("disabled");
    updateProductDepositChargeInput.toggleAttribute("disabled");
    updateRentDescription.toggleAttribute("disabled");
  }
}

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
  selectElement.innerHTML = `<option disabled selected value="">Select main category</option>`;
  for (const category of categories) {
    const option = document.createElement("option");
    option.value = category._id;
    option.innerText = category.categoryName;
    selectElement.appendChild(option);
  }
}

async function setSubCategories(categoryId, selectElement) {
  const categories = await getAllSubCategory(categoryId);
  selectElement.innerHTML = `<option disabled selected value="">Select sub category</option>`;
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
  if (e) {
    e.preventDefault();
  }
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
                      <p class="price"></p>
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
    } else if (input.name === "depositCharge") {
      product.forRent ? (input.disabled = false) : (input.display = true);
      input.value = product.depositCharge;
    } else if (input.name === "category") {
      await setSubCategories(product.category[0], updateFormSubCategoryElement);
      input.disabled = true;
      input.value = product.category[0];
    } else if (input.name === "subCategory") {
      input.value = product.category[1];
      input.disabled = true;
    } else if (input.classList.contains("size-input")) {
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

function deleteProductFormFoundProducts(productId) {
  const index = foundProductsForUpdate.findIndex(
    (product) => product._id === productId
  );
  foundProductsForUpdate.splice(index, 1);
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
  while (orderListTable.rows.length > 1) {
    orderListTable.deleteRow(1);
  }
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
  const rows = orderedProductDetailTable.rows;
  const tableBody = document.createDocumentFragment();

  while (rows.length > 1) {
    orderedProductDetailTable.deleteRow(1);
  }

  const orderType = orderSelectedToUpdate.orderType;
  let i = 1;

  for (const item of products) {
    const row = document.createElement("tr");
    const image = "/" + item.product.image.split("/").slice(2).join("/");

    const optionsHtml =
      orderType === "sell"
        ? `<option value="Processing">Processing</option>
         <option value="Shipped">Shipped</option>
         <option value="Delivered">Delivered</option>`
        : `<option value="Processing">Processing</option>
         <option value="Shipped">Shipped</option>
         <option value="canceled">Canceled</option>
         <option value="On Rent">On Rent</option>
         <option value="Returning">Returning</option>
         <option value="Returned">Returned</option>`;

    row.innerHTML = `
      <td>${i}.</td>
      <td id="op-img">
        <img src="${image}" alt="${item.product.name}" />
      </td>
      <td id="op-name">${item.product.name}</td>
      <td id="op-size">${item.productSize}</td>
      <td id="op-quantity">${item.quantity}</td>
      <td id="op-status">${item.status}</td>
      <td id="op-open" onclick="window.location.href='/sell/${item.product.name
        .split(" ")
        .join("-")}/${item.product._id}/buy'">
        Open product page
      </td>
      <td id="update-product-status">
        <select disabled data-item-index="${i}" name="productStatus">
          ${optionsHtml}
        </select>
      </td>
    `;

    const options = row.querySelector("select").options;
    for (const option of options) {
      option.selected = option.value === item.status;
    }

    tableBody.appendChild(row);
    i++;
  }
  orderedProductDetailTable.appendChild(tableBody);
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

function sortByLatest(a, b) {
  const x = new Date(a.createdAt);
  const y = new Date(b.createdAt);
  return y.getTime() - x.getTime();
}

function sortByOldest(a, b) {
  const x = new Date(a.createdAt);
  const y = new Date(b.createdAt);
  return x.getTime() - y.getTime();
}

function sortFilterArrays(sortByFunc) {
  if (currentFilter === "incomplete") {
    const x = incompleteOrdersArray.sort(sortByFunc);
    const y = completeOrdersArray.sort(sortByFunc);
    renderOrderListTable([...x, ...y]);
  } else if (currentFilter === "complete") {
    const x = incompleteOrdersArray.sort(sortByFunc);
    const y = completeOrdersArray.sort(sortByFunc);
    renderOrderListTable([...y, ...x]);
  } else {
    arrayToSort.sort(sortByFunc);
    renderOrderListTable(arrayToSort);
  }
}

function toggleDisplayOfConfirmDeletePopup(flexOrNone) {
  deleteOrCancelProductDiv.style.display = flexOrNone;
}

function changeFilterOrdersArray(orders) {
  arrayToSort = [...orders];
  incompleteOrdersArray = orders.filter(
    (order) => order.orderStatus === "incomplete"
  );
  completeOrdersArray = orders.filter(
    (order) => order.orderStatus === "complete"
  );
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

async function updateOrderProductStatus(
  orderId,
  changedItemIndexAndValue,
  sellOrRent
) {
  const res = await fetch(`/api/order/${orderId}/${sellOrRent}`, {
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

async function deleteProduct(productId) {
  const res = await fetch(`api/products/${productId}`, {
    method: "DELETE",
  });

  const response = await res.json();
  return response;
}
