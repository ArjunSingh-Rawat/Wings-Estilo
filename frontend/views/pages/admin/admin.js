// admin js

const adminToggle = document.querySelector("#admin-toggle");

adminToggle.addEventListener("click", (event) => {
  if (event.target.id === "product-section") {
    document.querySelector("#product-editor").style.display = "block";
    document.querySelector("#category-editor").style.display = "none";
  }
  if (event.target.id === "category-section") {
    document.querySelector("#product-editor").style.display = "none";
    document.querySelector("#category-editor").style.display = "block";
  }
});

// product functionality

document.querySelector("#category").addEventListener("change", (event) => {
  setSelectSubCategory(event.target.value);
});

async function setSelectSubCategory(catId) {
  const categories = await getAllSubCategory(catId);
  const categoryDiv = document.querySelector("#sub-category");

  categoryDiv.innerHTML = `<option disabled selected value="">select</option>`;

  for (const category of categories) {
    const option = document.createElement("option");
    option.value = category._id;
    option.innerText = category.categoryName;
    categoryDiv.appendChild(option);
  }
}

async function setSelectCategory() {
  const categories = await getAllCategories();
  const categoryDiv = document.querySelector("#category");
  for (const category of categories) {
    const option = document.createElement("option");
    option.value = category._id;
    option.innerText = category.categoryName;
    categoryDiv.appendChild(option);
  }
}

setSelectCategory();

const fileInput = document.querySelector("#input-image");
const inputMoreImage = document.querySelector("#input-more-image");

fileInput.addEventListener("change", async () => {
  const file = fileInput.files[0];
  const arrayBuffer = await file.arrayBuffer();

  if (arrayBuffer.byteLength > 0) {
    const blob = new Blob([file], { type: file.type });

    const objectURL = URL.createObjectURL(blob);
    setProductImage(objectURL);
  } else {
    console.log("ArrayBuffer is empty.");
  }
});

inputMoreImage.addEventListener("change", () => {
  const files = inputMoreImage.files;
  for (const file of files) {
    if (file.type === "image/jpeg") {
      getFile(file);
    }
  }
});

function setProductImage(objectURL) {
  const noImage = document.querySelector("#no-image-added");

  if (noImage.style.display === "block") {
    noImage.style.display = "none";
    document.querySelector("#main-image").style.display = "block";

    document.querySelector("#main-image").src = objectURL;

    const imgdiv = document.createElement("div");
    imgdiv.classList.add("img");

    const img = new Image();
    img.src = objectURL;

    imgdiv.appendChild(img);
    document.querySelector("#more-img").appendChild(imgdiv);
  }
}

async function getFile(file) {
  const arrayBuffer = await file.arrayBuffer();
  if (arrayBuffer.byteLength > 0) {
    const blob = new Blob([file], { type: file.type });

    const objectURL = URL.createObjectURL(blob);

    const imgdiv = document.createElement("div");
    imgdiv.classList.add("img");

    const img = new Image();
    img.src = objectURL;

    imgdiv.appendChild(img);
    console.log(imgdiv);
    document.querySelector("#more-img").appendChild(imgdiv);
  } else {
    console.log("ArrayBuffer is empty.");
  }
}

// submit product

const submitForm = document.querySelector("#submit-product");

submitForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const productData = new FormData(submitForm);
  const res = await fetch("/api/products", {
    method: "POST",
    body: productData,
  });

  if (res.ok) {
    submitForm.reset();
  }
});

// categories functionality

const mainCategorydiv = document.querySelector("#main-cat #b");

const subCategoryDiv = document.querySelector("#sub-cat #b");

let categoryId = "";
let previousActive = "";

async function asyncHandler() {
  await setMainCategorydiv();
  await setSubCategorydiv(categoryId);
}
asyncHandler();

mainCategorydiv.addEventListener("click", (event) => {
  if (
    event.target.classList.contains("cat-box") &&
    !event.target.classList.contains("new") &&
    !event.target.classList.contains("active-cat")
  ) {
    previousActive.classList.remove("active-cat");
    event.target.classList.add("active-cat");

    previousActive = event.target;
    document.querySelector("#sub-cat-name").innerText = event.target.innerText;
    setSubCategorydiv(event.target.dataset.catId);
  }
  if (event.target.classList.contains("cancleBtn")) {
    mainCategorydiv.removeChild(categoryActiveDiv);
    allowAddingCategory = true;
  }
});

let allowAddingCategory = true;
const cancleBtn = document.createElement("div");
cancleBtn.classList.add("cancleBtn");
cancleBtn.innerText = "X";
let categoryActiveDiv = "";

document.querySelector("#main-toggle").addEventListener("click", (event) => {
  if (
    (event.target.innerText === "Add" && allowAddingCategory) ||
    event.target.classList.contains("cancleBtn")
  ) {
    if (event.target.innerText === "Add") {
      allowAddingCategory = false;
      const addBtn = event.target;
      addBtn.classList.add("not-allowed");

      const div = document.createElement("div");

      div.classList.add("cat-box");
      div.classList.add("new");
      div.contentEditable = true;
      mainCategorydiv.appendChild(div);
      div.focus();
      document.querySelector("#main-toggle").appendChild(cancleBtn);
      categoryActiveDiv = div;

      div.addEventListener("keydown", async (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          const data = await addNewCategory(div.innerText);
          if (data) {
            div.blur();
            div.contentEditable = false;
            div.classList.remove("new");
            div.dataset.catId = data.newCategory._id;
            addBtn.classList.remove("not-allowed");
            allowAddingCategory = true;
          }
        }
      });
    }

    if (event.target.classList.contains("cancleBtn")) {
      mainCategorydiv.removeChild(categoryActiveDiv);
      allowAddingCategory = true;

      document
        .querySelector("#main-toggle #add-cat")
        .classList.remove("not-allowed");
      document.querySelector("#main-toggle").removeChild(cancleBtn);
    }
  }
  if (event.target.innerText === "Delete") {
    let delteCat = "";
    for (const catdiv of mainCategorydiv.children) {
      if (catdiv.classList.contains("active-cat")) {
        delteCat = catdiv;
        break;
      }
    }
  }
});

async function setMainCategorydiv() {
  const categories = await getAllCategories();
  let first = true;
  for (const category of categories) {
    const div = document.createElement("div");

    if (first) {
      categoryId = category._id;
      div.classList.add("active-cat");
      previousActive = div;
      first = false;
    }

    div.classList.add("cat-box");
    div.innerText = category.categoryName;
    div.dataset.catId = category._id;

    mainCategorydiv.appendChild(div);
  }
}

async function setSubCategorydiv(categoryId) {
  const categories = await getAllSubCategory(categoryId);

  subCategoryDiv.innerHTML = "";
  if (categories.length) {
    for (const category of categories) {
      const div = document.createElement("div");

      div.classList.add("cat-box");
      div.innerText = category.categoryName;
      div.dataset.catId = category._id;

      subCategoryDiv.appendChild(div);
    }
  } else {
    subCategoryDiv.innerText = "No Sub Categories Yet!!!";
  }
}

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

async function addNewCategory(categoryName) {
  const res = await fetch("/api/categories", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      categoryName: categoryName,
      isParentCategory: true,
    }),
  });
  if (res.ok) {
    return res.json();
  } else {
    return false;
  }
}
