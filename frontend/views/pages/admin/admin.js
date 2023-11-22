// admin js

const adminToggle = document.querySelector("#admin-toggle");

adminToggle.addEventListener("click", (event) => {
  if (event.target.id === "product-section") {
    document.querySelector("#product-editor").style.display = "block";
    document.querySelector("#category-editor").style.display = "none";
  }
  if (event.target.id === "category-section") {
    document.querySelector("#product-editor").style.display = "none";
    document.querySelector("#category-editor").style.display = "flex";
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
    document.querySelector("#more-img").appendChild(imgdiv);
  } else {
    console.log("ArrayBuffer is empty.");
  }
}

document.querySelector("#form-reset").addEventListener("click", () => {
  imagesDivReset();
});

function imagesDivReset() {
  document.querySelector("#main-image").style.display = "none";
  document.querySelector("#no-image-added").style.display = "block";
  document.querySelector("#more-img").innerHTML = "";
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
    imagesDivReset();
  }
});

// categories functionality

const mainCategorydiv = document.querySelector("#main-cat #b");

const subCategoryDiv = document.querySelector("#sub-cat #b");

let categoryId = "";
let previousActive = "";
let selectedParentCategoryId;

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
    if (previousActive) previousActive.classList.remove("active-cat");
    event.target.classList.add("active-cat");
    selectedParentCategoryId = event.target.dataset.catId;

    previousActive = event.target;
    document.querySelector("#sub-cat-name").innerText = event.target.innerText;
    setSubCategorydiv(event.target.dataset.catId);
  }
});
subCategoryDiv.addEventListener("click", (event) => {
  if (
    event.target.classList.contains("cat-box") &&
    !event.target.classList.contains("new") &&
    !event.target.classList.contains("active-cat")
  ) {
    previousActive.classList.remove("active-cat");
    event.target.classList.add("active-cat");

    previousActive = event.target;
  }
});

let allowAddingCategory = true;
const cancleBtn = document.createElement("div");
cancleBtn.classList.add("cancleBtn");
cancleBtn.innerText = "X";
let categoryActiveDiv = "";

document
  .querySelector("#main-toggle")
  .addEventListener("click", async (event) => {
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
            const data = await addNewCategory(div.innerText, true);
            if (data) {
              div.blur();
              div.contentEditable = false;
              div.classList.remove("new");
              div.dataset.catId = data.newCategory._id;
              addBtn.classList.remove("not-allowed");
              allowAddingCategory = true;
              document.querySelector("#main-toggle").removeChild(cancleBtn);
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
      if (delteCat) {
        const catId = delteCat.dataset.catId;
        if (await deleteCategory(catId)) {
          mainCategorydiv.removeChild(delteCat);
        }

        document.querySelector("#sub-cat-name").innerText = "Select Categor";
      }
    }
  });

document
  .querySelector("#sub-toggle")
  .addEventListener("click", async (event) => {
    if (
      (event.target.innerText === "Add" && allowAddingCategory) ||
      event.target.classList.contains("cancleBtn")
    ) {
      if (subCategoryDiv.innerText === "No Sub Categories Yet!!!")
        subCategoryDiv.innerText = "";

      if (event.target.innerText === "Add") {
        allowAddingCategory = false;
        const addBtn = event.target;
        addBtn.classList.add("not-allowed");

        const div = document.createElement("div");
        div.classList.add("cat-box");
        div.classList.add("new");
        div.contentEditable = true;

        subCategoryDiv.appendChild(div);
        div.focus();
        document.querySelector("#sub-toggle").appendChild(cancleBtn);
        categoryActiveDiv = div;

        div.addEventListener("keydown", async (event) => {
          if (event.key === "Enter") {
            event.preventDefault();

            const data = await addNewSubCategory(
              div.innerText,
              selectedParentCategoryId
            );

            if (data) {
              div.blur();
              div.contentEditable = false;
              div.classList.remove("new");
              addBtn.classList.remove("not-allowed");
              div.dataset.catId = data.newCategory._id;
              allowAddingCategory = true;
              document.querySelector("#sub-toggle").removeChild(cancleBtn);
            }
          }
        });
      }

      if (event.target.classList.contains("cancleBtn")) {
        subCategoryDiv.removeChild(categoryActiveDiv);
        allowAddingCategory = true;

        document
          .querySelector("#sub-toggle #add-cat")
          .classList.remove("not-allowed");
        document.querySelector("#sub-toggle").removeChild(cancleBtn);
      }
    }

    if (event.target.innerText === "Delete") {
      let delteCat = "";
      for (const catdiv of subCategoryDiv.children) {
        if (catdiv.classList.contains("active-cat")) {
          delteCat = catdiv;
          break;
        }
      }
      if (delteCat) {
        const catId = delteCat.dataset.catId;
        if (await deleteSubCategory(catId, selectedParentCategoryId)) {
          subCategoryDiv.removeChild(delteCat);
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
      div.classList.add("active-cat");
      selectedParentCategoryId = category._id;

      categoryId = category._id;
      previousActive = div;
      first = false;
      document.querySelector("#sub-cat-name").innerText = category.categoryName;
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
  if (categories !== undefined && categories.length) {
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

async function addNewCategory(categoryName, isParentCategory) {
  const res = await fetch("/api/categories", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      categoryName: categoryName,
      isParentCategory: isParentCategory,
    }),
  });
  if (res.ok) {
    return res.json();
  } else {
    return false;
  }
}

async function addNewSubCategory(categoryName, parentCategoryId) {
  const category = await addNewCategory(categoryName, false);
  if (category) {
    const catId = category.newCategory._id;
    const res = await fetch(`/api/categories/subCategory/${parentCategoryId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subCategory: catId,
      }),
    });

    return res.ok ? category : false;
  } else {
    return false;
  }
}

async function deleteCategory(id) {
  const res = await fetch(`/api/categories/${id}`, {
    method: "DELETE",
  });
  if (res.ok) {
    return true;
  } else {
    return false;
  }
}
async function deleteSubCategory(id, parentCatId) {
  const res = await fetch(`/api/categories/subCategory/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      parentCategoryId: parentCatId,
    }),
  });
  if (res.ok) {
    return true;
  } else {
    return false;
  }
}
