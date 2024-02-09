/*---------------- product functionality --------------*/

// set Category and subCategory inside select element
document.querySelector("#main-category").addEventListener("change", (event) => {
  setSelectSubCategory(event.target.value);
});

async function setSelectSubCategory(catId) {
  const categories = await getAllSubCategory(catId);
  const categoryDiv = document.querySelector("#sub-category");

  categoryDiv.innerHTML = `<option disabled selected value="">--Select sub category--</option>`;

  for (const category of categories) {
    const option = document.createElement("option");
    option.value = category._id;
    option.innerText = category.categoryName;
    categoryDiv.appendChild(option);
  }
}

async function setSelectCategory() {
  const categories = await getAllCategories();
  const categoryDiv = document.querySelector("#main-category");
  categoryDiv.innerHTML = `<option disabled selected value="">--Select main category--</option>`;

  for (const category of categories) {
    const option = document.createElement("option");
    option.value = category._id;
    option.innerText = category.categoryName;
    categoryDiv.appendChild(option);
  }
}
setSelectCategory();

// inputs for product images

const productImageSection = document.querySelector(".product-img-section");

productImageSection.addEventListener("change", async (event) => {
  const imageTypes = ["image/jpeg", "image/png"];
  if (imageTypes.includes(event.target.files[0].type)) {
    setImageInDiv(event.target.files[0], event.target.parentElement);
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
    parentDiv.style.display = "none";
    parentDiv.parentElement.appendChild(image);
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

const submitForm = document.querySelector("#product-info-form");
submitForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const productData = new FormData(submitForm);

  if (!productData.get("forSell")) {
    productData.append("forSell", "false");
  }

  if (!productData.get("forRent")) {
    productData.append("forRent", "false");
  }

  const res = await fetch("/api/products", {
    method: "POST",
    body: productData,
  });

  if (res.ok) {
    clearForm();
  }
});

function clearForm() {
  submitForm.reset();
  submitForm.querySelectorAll(".product-images").forEach((image) => {
    const parentDiv = image.parentElement;
    parentDiv.removeChild(image);
    parentDiv.children[0].style.display = "block";
  });
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
