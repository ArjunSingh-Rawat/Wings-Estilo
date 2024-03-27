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
      if (event.target.id === "personal-info-edit") {
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
      } else if (event.target.id === "phone-number-edit") {
        toggleEditOrSaveBtn("edit", "phone-number");

        document.querySelector("#phone-number").toggleAttribute("disabled");
        document.querySelector("#phone-number").focus();
      } else if (event.target.id === "phone-number-save") {
        const phoneNumberInput = document.querySelector("#phone-number");

        try {
          const phoneNumber = validatePhoneNumber(phoneNumberInput.value);

          if (userData.personalInfo.phoneNumber !== +phoneNumber) {
            userData.phoneNumberToUpdate = phoneNumber;

            const response = await sendPhoneOtp(phoneNumber);
            if (response.success) {
              showOtpPopup(
                userData.personalInfo.phoneNumber ? true : false,
                phoneNumber,
                userData.personalInfo
              );
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
      }
    });

  function validatePhoneNumber(phoneNumber) {
    phoneNumber = phoneNumber.split("+91");
    phoneNumber = phoneNumber[phoneNumber.length - 1].split(" ");
    phoneNumber = phoneNumber[phoneNumber.length - 1];
    try {
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
    } catch (error) {
      throw error;
    }
  }

  function showValidationError(message, messageElementSelector) {
    const messageElement = document.querySelector(messageElementSelector);
    messageElement.style.display = "block";
    messageElement.innerText = message;

    setTimeout(() => {
      messageElement.style.display = "none";
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
        addressLine1 + addressLine2 + district + state
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
}

asyncHandler();

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

function toggleEditOrSaveBtn(editOrSave, editSection) {
  if (editOrSave === "edit") {
    document.querySelector(`#${editSection}-${editOrSave}`).style.display =
      "none";
    document.querySelector(`#${editSection}-save`).style.display = "block";
  } else if (editOrSave === "save") {
    document.querySelector(`#${editSection}-${editOrSave}`).style.display =
      "none";
    document.querySelector(`#${editSection}-edit`).style.display = "block";
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

  document.querySelector("#user-name").innerText = firstName + " " + lastName;
  document.querySelector("#user-email").innerText = email;

  document.querySelector("#fname").value = firstName;
  document.querySelector("#lname").value = lastName;
  document.querySelector("#email").value = email;
  document.querySelector("#phone-number").value = phoneNumber
    ? "+91 " + phoneNumber
    : "+91 ";

  if (gender) {
    document.querySelector(`#${gender}`).checked = true;
    document.querySelector("#gender-field-alert").style.display = "none";
  } else {
    document.querySelector("#gender-field-alert").style.display = "block";
  }

  const numberFieldAlert = document.querySelector("#number-field-alert");
  if (phoneNumber) {
    numberFieldAlert.style.display = "none";
  } else {
    numberFieldAlert.innerText = "! Please fill out this field";
    numberFieldAlert.style.display = "block";
  }
}

/*-------------- OTP POPUP HANDLER ----------------*/
const otpPopup = document.querySelector("#otp-container");
const primaryOtpInputs = document.querySelectorAll(".primary-otp input");
const updateOtpInputs = document.querySelectorAll(".update-otp input");

function showOtpPopup(updateNumber, phoneNumber, userInfo) {
  const primaryOtpDiv = document.querySelector(".primary-otp");
  const updateOtpDiv = document.querySelector(".update-otp");

  primaryOtpDiv.style.display = "none";
  updateOtpDiv.style.display = "none";

  if (!updateNumber) {
    otpPopup.style.display = "flex";
    primaryOtpDiv.style.display = "block";
    primaryOtpDiv.children[0].children[0].innerText = phoneNumber;
  } else {
    otpPopup.style.display = "flex";
    primaryOtpDiv.style.display = "block";
    updateOtpDiv.style.display = "block";
    primaryOtpDiv.children[0].children[0].innerText = userInfo.phoneNumber;
    updateOtpDiv.children[0].children[0].innerText = phoneNumber;
  }
}

document
  .querySelector(".otp-value-container")
  .addEventListener("keyup", (event) => {
    if (event.target.tagName === "INPUT") {
      const id = event.target.id.split("-");
      const index = +id[1];
      const otpType = id[0];
      if (otpType === "p") {
        handOtpControl(primaryOtpInputs, event, index);
      } else if (otpType === "u") {
        handOtpControl(updateOtpInputs, event, index);
      }
    }
  });

async function submitOtp() {
  const { primaryOtp, updateOtp } = getOtps();
  const response = await updatePhoneNumber(
    userData.phoneNumberToUpdate,
    primaryOtp,
    updateOtp
  );

  if (response.success) {
    closeOtpDiv();
    renderUserInfo(response.user);
    userData.personalInfo = response.user;
    clearOtpInputValues();
  } else {
    showOtpError(response.message);
  }
}

function getOtps() {
  let primaryOtp = "";
  let updateOtp = "";
  primaryOtpInputs.forEach((input) => {
    primaryOtp += input.value;
  });
  updateOtpInputs.forEach((input) => {
    updateOtp += input.value;
  });
  return { primaryOtp, updateOtp };
}

function showOtpError(message) {
  const otpErrorDiv = document.querySelector(".otp-errors");

  otpErrorDiv.style.display = "block";
  otpErrorDiv.innerText = message;
  setTimeout(() => {
    otpErrorDiv.style.display = "none";
  }, 2000);
}

function clearOtpInputValues() {
  primaryOtpInputs.forEach((input) => {
    input.value = "";
  });
  updateOtpInputs.forEach((input) => {
    input.value = "";
  });
}

let backspaceCount = 0;
function handOtpControl(inputsArray, event, index) {
  if (event.key >= "0" && event.key <= "9") {
    if (event.target.value.length === 1 && index + 1 < 6) {
      inputsArray[index + 1].focus();
    }
    index + 1 < 5 ? (backspaceCount = 1) : (backspaceCount = 0);
  } else if (event.key === "Backspace") {
    backspaceCount++;
    if (index - 1 >= 0) {
      if (backspaceCount === 2) {
        inputsArray[index - 1].focus();
        backspaceCount = 0;
      }
    }
  } else if (event.key === "Tab") {
    if (index !== 0 && inputsArray[index - 1].value === "") {
      inputsArray[index - 1].focus();
    }
    index + 1 < 5 ? (backspaceCount = 1) : (backspaceCount = 0);
  }
}

function showOtpCloseConfirm() {
  document.querySelector(".confirm-close-otp").style.display = "flex";
}

function closeOtpDiv() {
  otpPopup.style.display = "none";
  document.querySelector(".confirm-close-otp").style.display = "none";
  toggleEditOrSaveBtn("save", "phone-number");
  document.querySelector("#phone-number").toggleAttribute("disabled");
  renderUserInfo(userData.personalInfo);
}

function closeConfirmDiv() {
  document.querySelector(".confirm-close-otp").style.display = "none";
}

async function logout() {
  let response = await fetch("/api/user/logout");
  window.location.href = response.url;
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

async function sendPhoneOtp(phoneNumber) {
  const res = await fetch("/api/user/otp/phone/send-otp", {
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

async function updatePhoneNumber(phoneNumber, primaryOtp, updateOtp) {
  const res = await fetch("/api/user/phone-number", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      phoneNumber,
      primaryOtp,
      updateOtp,
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
