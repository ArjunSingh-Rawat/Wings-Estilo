// toggle profile sections

const userData = {
  addressInfo: {},
  orderInfo: [],
};

let previousNav = "profile-section";
let previousSection = "my-profile-section";

async function asyncHandler() {
  const userInfo = await getUserInfo();

  for (const address of userInfo.addresses) {
    userData.addressInfo[address._id] = address;
  }

  handleMyProfile(userInfo);

  document.querySelector(".profile-nav").addEventListener("click", (event) => {
    if (
      event.target.id === "profile-section" ||
      event.target.parentElement.id === "profile-section"
    ) {
      toggleClass("profile-section", previousNav);
      previousNav = "profile-section";
    } else if (
      event.target.id === "orders-section" ||
      event.target.parentElement.id === "orders-section"
    ) {
      toggleClass("orders-section", previousNav);
      previousNav = "orders-section";
    } else if (
      event.target.id === "addresses-section" ||
      event.target.parentElement.id === "addresses-section"
    ) {
      toggleClass("addresses-section", previousNav);
      previousNav = "addresses-section";
      handleAddresses();
    }
  });
}

asyncHandler();

function handleMyProfile(userData) {
  renderUserInfo(userData);

  const personalInfoDiv = document.querySelector(".personal-info");
  document
    .querySelector(".my-profile-section")
    .addEventListener("click", async (event) => {
      if (event.target.id === "personal-info-edit") {
        event.target.parentElement.querySelector(
          "#personal-info-save"
        ).style.display = "block";
        event.target.style.display = "none";

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
          event.target.parentElement.querySelector(
            "#personal-info-edit"
          ).style.display = "block";
          event.target.style.display = "none";

          for (const element of inputElements) {
            element.toggleAttribute("disabled");
          }
        }

        window.location.href = "/profile";
      }
    });
}

function handleAddresses() {
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
    console.log(addressData, "comminggggg");
    const addressDiv = document.querySelector(".address-div");
    addressDiv.innerHTML = "";

    for (const address in addressData) {
      const { name, phoneNumber, addressLine1, addressLine2, district, state } =
        addressData[address];

      const p = document.createElement("p");
      p.innerText = addressLine1 + addressLine2 + district + state;
      addressDiv.appendChild(p);

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

      addressDiv.appendChild(deleteBtn);
      addressDiv.appendChild(editBtn);
    }
  }

  function displayCorrectAddressDiv() {
    for (const child of myAddressesSection.children) {
      child.style.display = "none";
    }
    if (Object.keys(userData.addressInfo).length) {
      myAddressesSection.querySelector(".address-container").style.display =
        "flex";
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
        console.log(cityTownData);
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
}

function toggleClass(currentDiv, previousDiv) {
  if (currentDiv !== previousDiv) {
    document
      .querySelector(`#${currentDiv}`)
      .classList.toggle("nav-active", true);
    if (previousDiv !== "") {
      document
        .querySelector(`#${previousDiv}`)
        .classList.toggle("nav-active", false);
    } else {
      document
        .querySelector(`#profile-section  `)
        .classList.toggle("nav-active", false);
    }

    document.querySelector(`.my-${currentDiv}`).style.display = "flex";
    document.querySelector(`.my-${previousDiv}`).style.display = "none";
  }
}

function renderUserInfo(userData) {
  const { firstName, lastName, email, phoneNumber, gender } = userData;

  document.querySelector("#user-name").innerText = firstName + " " + lastName;
  document.querySelector("#user-email").innerText = email;

  document.querySelector("#fname").value = firstName;
  document.querySelector("#lname").value = lastName;
  document.querySelector("#email").value = email;
  document.querySelector("#phone-number").value = phoneNumber
    ? phoneNumber
    : "+91";

  if (gender) {
    document.querySelector(`#${gender}`).checked = true;
    document.querySelector("#gender-field-alert").style.display = "none";
  } else {
    document.querySelector("#gender-field-alert").style.display = "block";
  }
}

async function logout() {
  let response = await fetch("/api/user/logout");
  window.location.href = response.url;
}

// fetch data

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
