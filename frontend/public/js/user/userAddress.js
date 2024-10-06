let editMode = false;
let currentAddressId = "";
const myAddressesSection = document.querySelector(".my-addresses-section");
const addressForm = document.querySelector(".address-form");
const pinCodeInput = document.querySelector("#pincode");
const formAlerts = document.querySelector("#form-alerts");
const addressContainer = myAddressesSection.querySelector(".address-container");
const noAddressDiv = myAddressesSection.querySelector(".no-address-div");

let district = "";
let state = "";

// Event Listeners
myAddressesSection.addEventListener("click", (event) => {
  if (event.target.classList.contains("add-new-address-btn")) {
    displayAddressForm();
  }
});

pinCodeInput.addEventListener("input", handlePinCodeInput);
addressForm.addEventListener("submit", handleAddressFormSubmit);
addressForm
  .querySelector("#cancel-btn")
  .addEventListener("click", cancelAddressForm);

function displayAddresses() {
  for (const child of myAddressesSection.children) {
    child.style.display = "none";
  }
  if (Object.keys(userData.addressInfo).length) {
    renderAddressInfo(userData.addressInfo);
    addressContainer.style.display = "block";
    noAddressDiv.style.display = "none";
  } else {
    addressContainer.style.display = "none";
    noAddressDiv.style.display = "flex";
  }
}

const addressDiv = document.querySelector(".address-div");

function renderAddressInfo(addressData) {
  addressDiv.innerHTML = "";
  let previousDefaultId = null;

  for (const address of Object.values(addressData)) {
    const {
      _id,
      name,
      phoneNumber,
      addressLine1,
      addressLine2,
      district,
      state,
      pinCode,
      defaultAddress,
    } = address;
    if (defaultAddress) previousDefaultId = _id;

    const div = document.createElement("div");
    div.classList.add("addresses");

    createAddressHtml(
      name,
      phoneNumber,
      addressLine1,
      addressLine2,
      district,
      state,
      pinCode,
      _id,
      div
    );
    const editDeleteDiv = div.querySelector(".edit-delete-div");
    editDeleteDiv.appendChild(createDeleteButton(_id));
    editDeleteDiv.appendChild(createEditButton(_id));

    if (!defaultAddress) {
      const setDefaultBtn = document.createElement("button");
      setDefaultBtn.innerText = "Set to default";
      setDefaultBtn.onclick = async () => {
        await setDefaultAddress(_id, previousDefaultId);
        userData.addressInfo[previousDefaultId].defaultAddress = false;
        userData.addressInfo[_id].defaultAddress = true;
        renderAddressInfo(userData.addressInfo);
      };
      div.querySelector(".edit-delete-btn").appendChild(setDefaultBtn);
    }
    addressDiv.appendChild(div);
  }
}

function createAddressHtml(
  name,
  phoneNumber,
  addressLine1,
  addressLine2,
  district,
  state,
  pinCode,
  _id,
  div
) {
  const editDeleteBtn = document.createElement("div");
  editDeleteBtn.classList.add("edit-delete-btn");
  const editDeleteDiv = document.createElement("div");
  editDeleteDiv.classList.add("edit-delete-div");
  editDeleteBtn.appendChild(editDeleteDiv);

  const p = document.createElement("p");
  p.id = "my-name-phone";

  const span1 = document.createElement("span");
  span1.id = "address-div-name";
  span1.innerText = name;

  const span2 = document.createElement("span");
  span2.id = "address-div-phone";
  span2.innerText = phoneNumber;

  p.appendChild(span1);
  p.appendChild(span2);

  const p2 = document.createElement("p");
  p2.id = "my-address";
  p2.innerText = `${addressLine1} ${addressLine2} ${district} ${state} - `;
  const pinCodeSpan = document.createElement("span");
  pinCodeSpan.style.fontWeight = "bold";
  pinCodeSpan.innerText = pinCode;

  p2.appendChild(pinCodeSpan);

  div.appendChild(editDeleteBtn);
  div.appendChild(p);
  div.appendChild(p2);
}

function createDeleteButton(addressId) {
  const deleteBtn = document.createElement("button");
  deleteBtn.innerText = "Delete";
  deleteBtn.onclick = async () => {
    if (await deleteAddress(addressId)) {
      delete userData.addressInfo[addressId];
      displayAddresses();
    }
  };
  return deleteBtn;
}

function createEditButton(addressId) {
  const editBtn = document.createElement("button");
  editBtn.innerText = "Edit";
  editBtn.onclick = () => {
    displayAddressForm(userData.addressInfo[addressId]);
    editMode = true;
    currentAddressId = addressId;
  };
  return editBtn;
}

function displayAddressForm(addressData) {
  for (const child of myAddressesSection.children) {
    child.style.display = "none";
  }
  document.querySelector(".add-new-address-div").style.display = "block";

  if (addressData) {
    for (const input of addressForm.elements) {
      if (input.name !== "pinCode") input.value = addressData[input.name] || "";
    }
  }
}

async function handlePinCodeInput() {
  if (pinCodeInput.value.length === 6) {
    const pinCode = pinCodeInput.value;
    const cityTownsRequest = await fetch(
      `https://api.postalpincode.in/pincode/${pinCode}`
    );
    const cityTownData = await cityTownsRequest.json();

    if (cityTownData[0].Status !== "Error") {
      district = cityTownData[0].PostOffice[0].District;
      state = cityTownData[0].PostOffice[0].State;
      document.querySelector("#city").value = district;
      document.querySelector("#state").value = state;
    }
  }
}

async function handleAddressFormSubmit(event) {
  event.preventDefault();
  const addressData = new FormData(addressForm);

  if (addressData.get("state").toLowerCase() !== state.toLowerCase()) {
    showFormAlert("State selected does not match the given pincode");
  } else if (
    addressData.get("district").toLowerCase() !== district.toLowerCase()
  ) {
    showFormAlert("District selected does not match the given pincode");
  } else {
    hideFormAlert();

    if (editMode) {
      const address = await editAddress(currentAddressId, addressData);
      if (address) userData.addressInfo[address._id] = address;
    } else {
      const address = await addNewAddress(addressData);
      if (address) userData.addressInfo[address._id] = address;
    }
    displayAddresses();
    redirectToCheckout();
    addressForm.reset();
  }
}

function showFormAlert(message) {
  formAlerts.innerText = message;
  formAlerts.style.display = "block";
}

function hideFormAlert() {
  formAlerts.style.display = "none";
}

function cancelAddressForm(event) {
  event.preventDefault();
  displayAddresses();
  addressForm.reset();
}

function redirectToCheckout() {
  const goToCheckoutPage = urlParams.get("from");
  if (goToCheckoutPage === "checkout") {
    window.location.href = "/sell/checkout";
  }
}

async function addNewAddress(addressData) {
  const addressFormData = new URLSearchParams(addressData).toString();

  const res = await fetch("/api/user/addresses/add-new", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: addressFormData,
  });

  if (res.ok) {
    const data = await res.json();
    return data.address;
  } else {
    return false;
  }
}

async function editAddress(addressId, addressData) {
  const addressFormData = new URLSearchParams(addressData).toString();

  const res = await fetch(`/api/user/addresses/${addressId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: addressFormData,
  });

  if (res.ok) {
    const data = await res.json();
    return data.address;
  }
  return false;
}

async function deleteAddress(addressId) {
  const res = await fetch(`/api/user/addresses/${addressId}`, {
    method: "DELETE",
  });
  return res.ok;
}

async function setDefaultAddress(addressId, prevDefaultAddressId) {
  try {
    const res = await fetch(`/api/user/addresses/set-default/${addressId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prevDefaultAddressId,
      }),
    });
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export { displayAddresses, displayAddressForm };
