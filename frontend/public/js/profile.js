const profileNav = document.querySelector(".profile-nav");

const userData = {
  personalInfo: {},
  addressInfo: {},
  orderInfo: [],
  primaryOtp: "",
  updateOtp: "",
  phoneNumberToUpdate: "",
};

const sectionToShow = urlParams.get("section");
if (sectionToShow) {
  if (["profile", "orders", "addresses"].includes(sectionToShow)) {
    toggleClass(sectionToShow + "-section");
  } else {
    toggleClass("profile-section");
  }
} else {
  toggleClass("profile-section");
}

async function asyncHandler() {
  const userInfo = await getUserInfo();
  userData.personalInfo = userInfo;

  for (const address of userInfo.addresses) {
    userData.addressInfo[address._id] = address;
  }

  userData.orderInfo = await getOrderDetails();

  /*-------------- Toggle sections ----------------*/
  profileNav.addEventListener("click", (event) => {
    if (
      event.target.id === "profile-section" ||
      event.target.parentElement.id === "profile-section"
    ) {
      toggleClass("profile-section");
    } else if (
      event.target.id === "orders-section" ||
      event.target.parentElement.id === "orders-section"
    ) {
      toggleClass("orders-section");
    } else if (
      event.target.id === "addresses-section" ||
      event.target.parentElement.id === "addresses-section"
    ) {
      toggleClass("addresses-section");
    }
  });

  /* --------- profile handler ----------- */
  renderUserInfo(userInfo);

  const personalInfoDiv = document.querySelector(".personal-info");
  document
    .querySelector(".my-profile-section")
    .addEventListener("click", async (event) => {
      if (event.target.id === "personal-info-edit-element") {
        toggleEditOrSaveBtn("edit", "personal-info");

        const inputElements = personalInfoDiv.querySelectorAll("input");
        for (const element of inputElements) {
          element.toggleAttribute("disabled");
        }
      } else if (event.target.id === "personal-info-save") {
        const personalInfoToChange = {
          firstName: "",
          lastName: "",
          gender: "",
        };

        const inputElements = personalInfoDiv.querySelectorAll("input");
        for (const element of inputElements) {
          if (element.type === "radio" && element.checked) {
            personalInfoToChange[element.name] = element.value;
          } else if (element.type !== "radio") {
            personalInfoToChange[element.name] = element.value;
          }
        }
        if (await updatePersonalInfo(personalInfoToChange)) {
          toggleEditOrSaveBtn("save", "personal-info");

          for (const element of inputElements) {
            element.toggleAttribute("disabled");
          }
        }

        window.location.href = "/profile";
      } else if (event.target.id === "personal-info-cancel") {
        const inputElements = personalInfoDiv.querySelectorAll("input");
        for (const element of inputElements) {
          element.toggleAttribute("disabled");
        }
        toggleEditOrSaveBtn("save", "personal-info");
        renderUserInfo(userData.personalInfo);
      } else if (event.target.id === "phone-number-edit-element") {
        toggleEditOrSaveBtn("edit", "phone-number");

        document.querySelector("#phone-number").toggleAttribute("disabled");
        document.querySelector("#phone-number").focus();
      } else if (event.target.id === "phone-number-save") {
        try {
          const phoneNumber = validatePhoneNumber(phoneNumberInput.value);
          const inputNumberSameAsPhoneNumber =
            userData.personalInfo.phoneNumber === +phoneNumber;

          if (!inputNumberSameAsPhoneNumber) {
            userData.phoneNumberToUpdate = phoneNumber;
            const response = await sendOtpOnEmail(phoneNumber);
            if (response.success) {
              showOtpPopup();
            } else {
              getAlertPopup(response.message);
              toggleEditOrSaveBtn("save", "phone-number");
              document
                .querySelector("#phone-number")
                .toggleAttribute("disabled");
              renderUserInfo(userData.personalInfo);
            }
          } else {
            toggleEditOrSaveBtn("save", "phone-number");
            document.querySelector("#phone-number").toggleAttribute("disabled");
          }
        } catch (error) {
          showValidationError(error.message, "#number-field-alert");
        }
      } else if (event.target.id === "phone-number-cancel") {
        toggleEditOrSaveBtn("save", "phone-number");
        document.querySelector("#phone-number").toggleAttribute("disabled");
        renderUserInfo(userData.personalInfo);
      }
    });

  function validatePhoneNumber(phoneNumber) {
    phoneNumber = phoneNumber.split("+91").pop().trim();

    const phoneNumberRegex = /^\d+$/;
    if (!phoneNumber) {
      throw new Error("Phone number not provided!");
    }
    if (!phoneNumberRegex.test(phoneNumber)) {
      throw new Error("Phone number is not valid");
    }
    if (phoneNumber.length !== 10) {
      throw new Error("Phone number length should be 10");
    }

    return phoneNumber;
  }

  function showValidationError(message, messageElementSelector) {
    const messageElement = document.querySelector(messageElementSelector);
    messageElement.classList.remove("fade-out-hidden");
    messageElement.style.display = "block";
    messageElement.innerText = message;

    setTimeout(() => {
      messageElement.classList.add("fade-out-hidden");
      setTimeout(() => {
        messageElement.style.display = "none";
      }, 500);
    }, 2000);
  }

  /* ---------------- address Handler ---------------- */
  let edit = false;
  let addressId = "";
  const myAddressesSection = document.querySelector(".my-addresses-section");

  displayCorrectAddressDiv();

  myAddressesSection.addEventListener("click", (event) => {
    if (event.target.classList.contains("add-new-address-btn")) {
      displayAddressForm();
      edit = false;
    }
  });

  function renderAddressInfo(addressData) {
    const addressDiv = document.querySelector(".address-div");
    addressDiv.innerHTML = "";
    let prevDefaultAddressId = null;
    for (const address in addressData) {
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
      } = addressData[address];
      if (defaultAddress) {
        prevDefaultAddressId = _id;
      }
      const addressHtml = `<div class="edit-delete-btn">
      <div class="edit-delete-div"></div>
      </div>
      <p id="my-name-phone">
        <span id="address-div-name">${name}</span>
        <span id="address-div-phone">${phoneNumber}</span>
      </p>
      <p id="my-address">${
        addressLine1 + " " + addressLine2 + " " + district + " " + state
      } - <span style="font-weight:bold;">${pinCode}</span></p>`;

      const div = document.createElement("div");
      div.classList.add("addresses");
      div.innerHTML = addressHtml;

      const editDeleteDiv = div.querySelector(".edit-delete-div");
      const deleteBtn = document.createElement("button");
      deleteBtn.innerText = "Delete";
      deleteBtn.onclick = async () => {
        if (await deleteAddress(address)) {
          delete userData.addressInfo[address];
          displayCorrectAddressDiv();
        }
      };
      const editBtn = document.createElement("button");
      editBtn.innerText = "edit";
      editBtn.onclick = () => {
        displayAddressForm(userData.addressInfo[address]);
        edit = true;
        addressId = address;
      };
      editDeleteDiv.appendChild(deleteBtn);
      editDeleteDiv.appendChild(editBtn);

      if (!defaultAddress) {
        const setDefaultButton = document.createElement("button");
        setDefaultButton.innerText = "Set to default";

        setDefaultButton.onclick = async () => {
          await setDefaultAddress(_id, prevDefaultAddressId);
          userData.addressInfo[prevDefaultAddressId].defaultAddress = false;
          userData.addressInfo[_id].defaultAddress = true;
          renderAddressInfo(userData.addressInfo);
        };

        div.querySelector(".edit-delete-btn").appendChild(setDefaultButton);
      }

      addressDiv.appendChild(div);
    }
  }

  function displayCorrectAddressDiv() {
    for (const child of myAddressesSection.children) {
      child.style.display = "none";
    }
    if (Object.keys(userData.addressInfo).length) {
      myAddressesSection.querySelector(".address-container").style.display =
        "block";
      renderAddressInfo(userData.addressInfo);
    } else {
      myAddressesSection.querySelector(".no-address-div").style.display =
        "flex";
    }
  }

  function displayAddressForm(addressData) {
    for (const child of myAddressesSection.children) {
      child.style.display = "none";
    }
    document.querySelector(".add-new-address-div").style.display = "block";

    if (addressData) {
      for (const input of addressForm) {
        if (input.name !== "pinCode") input.value = addressData[input.name];
      }
    }
  }

  // form handler
  const pinCodeInput = document.querySelector("#pincode");
  let state = "";
  let district = "";

  pinCodeInput.addEventListener("input", async (event) => {
    if (pinCodeInput.value.length === 6) {
      const pinCode = pinCodeInput.value;

      if (pinCode.length === 6) {
        const cityTownsRequest = await fetch(
          `https://api.postalpincode.in/pincode/${pinCode}`
        );

        const cityTownData = await cityTownsRequest.json();
        if (cityTownData[0].Status !== "Error") {
          district = cityTownData[0].PostOffice[0].District;
          state = cityTownData[0].PostOffice[0].State;
          document.querySelector("#city").value = district;
          const options = document.querySelector("#state").options;

          for (let i = 0; i < options.length; i++) {
            if (options[i].value === state) {
              options[i].selected = true;
              break;
            }
          }
        }
      }
    }
  });

  const addressForm = document.querySelector(".address-form");
  const formAlerts = document.querySelector("#form-alerts");
  addressForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const addressData = new FormData(addressForm);
    if (addressData.get("state").toLowerCase() !== state.toLowerCase()) {
      formAlerts.innerText = "State selected do not have given pincode";
      formAlerts.style.display = "block";
    } else if (
      addressData.get("district").toLowerCase() !== district.toLowerCase()
    ) {
      formAlerts.innerText = "District selected do not have given pincode";
      formAlerts.style.display = "block";
    } else {
      formAlerts.style.display = "none";

      if (edit) {
        const address = await editAddress(addressId, addressData);
        if (address) userData.addressInfo[address._id] = address;
      } else {
        const address = await addNewAddress(addressData);
        if (address) userData.addressInfo[address._id] = address;
      }
      displayCorrectAddressDiv();
      const goToCheckoutPage = urlParams.get("from");
      if (goToCheckoutPage === "checkout") {
        window.location.href = "/sell/checkout";
      }
      addressForm.reset();
    }
  });
  addressForm
    .querySelector("#cancel-btn")
    .addEventListener("click", (event) => {
      event.preventDefault();
      displayCorrectAddressDiv();
      addressForm.reset();
    });

  displayCorrectOrderDiv();
  renderOrderInfo(userData.orderInfo);
}

asyncHandler();

function toggleEditOrSaveBtn(editOrSave, editSection) {
  if (editOrSave === "edit") {
    document.querySelector(`#${editSection}-edit-element`).style.display =
      "none";
    document.querySelector(`#${editSection}-save-element`).style.display =
      "flex";
  } else if (editOrSave === "save") {
    document.querySelector(`#${editSection}-save-element`).style.display =
      "none";
    document.querySelector(`#${editSection}-edit-element`).style.display =
      "block";
  }
}

function toggleClass(currentDiv) {
  const sections = profileNav.children;
  for (const section of sections) {
    section.classList.remove("nav-active");
    document.querySelector(`.my-${section.id}`).style.display = "none";
  }

  if (window.innerWidth > 799) {
    profileNav.querySelector(`#${currentDiv}`).classList.add("nav-active");
  }
  document.querySelector(`.my-${currentDiv}`).style.display = "flex";
}

function renderUserInfo(userData) {
  const { firstName, lastName, email, phoneNumber, gender } = userData;

  document.querySelector("#user-name").innerText = `${firstName} ${lastName}`;
  document.querySelector("#user-email").innerText = email;

  document.querySelector("#fname").value = firstName;
  document.querySelector("#lname").value = lastName;
  document.querySelector("#email").value = email;
  document.querySelector("#phone-number").value = phoneNumber
    ? `+91 ${phoneNumber}`
    : "+91 ";

  document.querySelector(`#${gender}`).checked = true;
  document.querySelector("#gender-field-alert").style.display = gender
    ? "none"
    : "block";

  const numberFieldAlert = document.querySelector("#number-field-alert");
  numberFieldAlert.style.display = phoneNumber ? "none" : "block";
  if (!phoneNumber) {
    numberFieldAlert.innerText = "! Please fill out this field";
  }
}

/*-------------- OTP POPUP HANDLER ----------------*/
const otpPopup = document.querySelector("#otp-container");
const otpInputElements = document.querySelectorAll(".primary-otp input");
const otpErrorDiv = document.querySelector(".otp-errors");
const phoneNumberInput = document.querySelector("#phone-number");
const otpTimeElement = document.querySelector(".otp-not-rec span");
const otpButtonsArray = [
  document.querySelector("#otp-submit-btn"),
  document.querySelector("#otp-resend-btn"),
];

let backspaceCount = 0;
let otpTimeIntervalId = null;

function showOtpPopup() {
  otpPopup.style.display = "flex";
  otpInputElements[0].focus();
  otpPopup.querySelector(".user-email").innerText = userData.personalInfo.email;
  toggleSubmitOrResendBtn("submit");
  otpTimeElement.innerText = "120 sec";
  startOtpExpireTimer();
}

document
  .querySelector(".otp-value-container")
  .addEventListener("keyup", (event) => {
    if (event.target.tagName === "INPUT") {
      const id = event.target.id.split("-");
      const index = +id[1];
      handleOtpControl(otpInputElements, event, index);
    }
  });

async function submitOtp() {
  const otp = getOtp();
  const response = await updatePhoneNumber(userData.phoneNumberToUpdate, otp);
  if (response.success) {
    closeOtpDiv();
    renderUserInfo(response.user);
    userData.personalInfo = response.user;
    clearOtpInputValues();
  } else {
    showOtpError(response.message);
  }
}

async function resendOtp() {
  const response = await sendOtpOnEmail(userData.phoneNumberToUpdate);
  if (response.success) {
    showOtpPopup();
  } else {
    getAlertPopup(response.message);
    toggleEditOrSaveBtn("save", "phone-number");
    document.querySelector("#phone-number").toggleAttribute("disabled");
    renderUserInfo(userData.personalInfo);
  }
}

function getOtp() {
  return Array.from(otpInputElements)
    .map((input) => input.value)
    .join("");
}

function startOtpExpireTimer() {
  let timeRemaining = 120;
  otpTimeIntervalId = setInterval(() => {
    timeRemaining--;
    otpTimeElement.innerText = `${timeRemaining} sec`;

    if (timeRemaining === 0) {
      clearInterval(otpTimeIntervalId);
      toggleSubmitOrResendBtn("showBoth");
    }
  }, 1000);
}

function showOtpError(message) {
  otpErrorDiv.style.display = "block";
  otpErrorDiv.innerText = message;
  setTimeout(() => {
    otpErrorDiv.style.display = "none";
  }, 2000);
}

function clearOtpInputValues() {
  otpInputElements.forEach((input) => {
    input.value = "";
  });
  clearInterval(otpTimeIntervalId);
}

function handleOtpControl(inputsArray, event, index) {
  if (event.key >= "0" && event.key <= "9") {
    if (event.target.value.length === 1 && index + 1 < 6) {
      inputsArray[index + 1].focus();
    }
    backspaceCount = index + 1 < 5 ? 1 : 0;
  } else if (event.key === "Backspace") {
    backspaceCount++;
    if (index - 1 >= 0 && backspaceCount === 2) {
      inputsArray[index - 1].focus();
      backspaceCount = 0;
    }
  } else if (
    event.key === "Tab" &&
    index !== 0 &&
    inputsArray[index - 1].value === ""
  ) {
    inputsArray[index - 1].focus();
    backspaceCount = index + 1 < 5 ? 1 : 0;
  }
}

function closeOtpDiv() {
  otpPopup.style.display = "none";
  toggleEditOrSaveBtn("save", "phone-number");
  document.querySelector("#phone-number").toggleAttribute("disabled");
  renderUserInfo(userData.personalInfo);
}

function toggleSubmitOrResendBtn(buttonToShow) {
  otpButtonsArray.forEach((e) => (e.style.display = "none"));

  if (buttonToShow === "submit") {
    otpButtonsArray[0].style.display = "inline-block";
  } else if (buttonToShow === "resend") {
    otpButtonsArray[1].style.display = "inline-block";
  } else if (buttonToShow === "showBoth") {
    otpButtonsArray[0].style.display = "inline-block";
    otpButtonsArray[1].style.display = "inline-block";
  }
}

async function logout() {
  let response = await fetch("/api/user/logout");
  window.location.href = response.url;
}

/*------------- Order Js-------------*/

function displayCorrectOrderDiv() {
  const ordersDiv = document.querySelector(".my-orders-section");

  for (child of ordersDiv.children) {
    child.style.display = "none";
  }
  if (userData.orderInfo.length > 0) {
    ordersDiv.querySelector(".orders-div").style.display = "flex";
  } else {
    ordersDiv.querySelector(".no-orders-div").style.display = "flex";
  }
}

const orderListDiv = document.querySelector(".orders-list");

const itemStatus = {
  Processing: {
    message: "Item processing, on its way to shipping",
    icon: "bx-cog",
  },
  Shipped: {
    message: "Item shipped, on its way to delivery",
    icon: "bxs-package",
  },
  Delivered: {
    message: "Delivery successful! Enjoy your purchase!",
    icon: "bx-check",
  },
};

function renderOrderInfo(orders) {
  orderListDiv.innerHTML = "";
  for (const order of orders) {
    const orderDate = new Date(order.createdAt);
    const orderDateString = `${orderDate.getDate()}-${
      orderDate.getMonth() + 1
    }-${orderDate.getFullYear()}`;
    for (const item of order.items) {
      let message = itemStatus[item.status].message;
      let icon = itemStatus[item.status].icon;
      const date = new Date(item.updatedAt);
      let shippedOrDeliveredDate = "";

      if (item.status !== "Processing" && item.updatedAt) {
        shippedOrDeliveredDate = `${item.status} on: ${date.getDate()}-${
          date.getMonth() + 1
        }-${date.getFullYear()}, ${date.toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
        })}`;
      } else {
        shippedOrDeliveredDate = "";
      }
      const itemHtml = `<div class="order">
                        <div class="order-info">
                          <div class="order-img">
                            <img
                              src="${item.product.image
                                .split("/")
                                .splice(2)
                                .join("/")}"
                              alt="${item.product.name}"
                            />
                          </div>
                          <div class="ordered-product-info">
                            <p id="ordered-product-name">${
                              item.product.name
                            }</p>
                            <p id="ordered-product-size">Size: ${
                              item.productSize
                            }</p>
                            <p id="ordered-product-prize">Rs. ${
                              item.product.sellPrice
                            }</p>
                            <p id="ordered-product-quantity">Quantity: ${
                              item.quantity
                            }</p>
                          </div>
                        </div>
                        <div class="order-delivery-info">
                          <div id="ordered-date">
                            Order Date: <span style="margin-left:10px;">${orderDateString}</span>
                          </div>
                          <div>
                            <p id="order-status">
                              <i class="bx ${icon}"></i><span>${
                                item.status
                              }</span>
                            </p>
                            <p id="order-alert">
                              ${message}
                            </p>
                            <p class="shipped-or-delivered-date">${shippedOrDeliveredDate}</p>
                          </div>
                        </div>
                      </div>`;
      orderListDiv.innerHTML += itemHtml;
    }
  }
}

/*-------------------- Fetch Data ------------------*/
async function getUserInfo() {
  const res = await fetch("/api/user/info");

  if (res.ok) {
    const data = await res.json();
    return data.user;
  }
  return false;
}

async function updatePersonalInfo(info) {
  const res = await fetch("/api/user/info", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(info),
  });

  return res.ok;
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

async function sendOtpOnEmail(phoneNumber) {
  const res = await fetch("/api/user/otp/email/send-otp", {
    method: "Post",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      phoneNumber,
    }),
  });
  const data = await res.json();
  return data;
}

async function updatePhoneNumber(phoneNumber, otp) {
  const res = await fetch("/api/user/phone-number/email", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      phoneNumber,
      otp,
    }),
  });
  return await res.json();
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

async function getOrderDetails() {
  try {
    const res = await fetch("/api/order");
    const data = await res.json();
    return res.ok ? data.orders : false;
  } catch (error) {
    return false;
  }
}
