import { showOtpPopup, sendOtpOnEmail } from "./userOtp.js";
import { displayAddresses } from "./userAddress.js";

const personalInfoDiv = document.querySelector(".personal-info");

const toggleInputsState = (inputs, state) => {
  inputs.forEach((input) => (input.disabled = state));
};

const gatherPersonalInfo = () => {
  const personalInfo = {
    firstName: document.querySelector("#fname").value,
    lastName: document.querySelector("#lname").value,
    gender: document.querySelector("input[name='gender']:checked")?.value || "",
  };
  return personalInfo;
};

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

export const toggleEditOrSaveBtn = (action, section) => {
  const editBtn = document.querySelector(`#${section}-edit-element`);
  const saveBtn = document.querySelector(`#${section}-save-element`);
  editBtn.style.display = action === "edit" ? "none" : "block";
  saveBtn.style.display = action === "edit" ? "flex" : "none";
};

export const renderUserInfo = (userData) => {
  const { firstName, lastName, email, phoneNumber, gender } = userData;

  document.querySelector("#user-name").innerText = `${firstName} ${lastName}`;
  document.querySelector("#user-email").innerText = email;
  document.querySelector("#fname").value = firstName;
  document.querySelector("#lname").value = lastName;
  document.querySelector("#email").value = email;
  document.querySelector("#phone-number").value = phoneNumber
    ? `+91 ${phoneNumber}`
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
};

// Main event listener for personal info section
const addPersonalInfoEventListeners = (userData) => {
  document
    .querySelector(".my-profile-section")
    .addEventListener("click", async (event) => {
      const targetId = event.target.id;

      switch (targetId) {
        case "personal-info-edit-element":
          toggleEditOrSaveBtn("edit", "personal-info");
          toggleInputsState(personalInfoDiv.querySelectorAll("input"), false);
          break;

        case "personal-info-save":
          const personalInfoToUpdate = gatherPersonalInfo();
          if (await updatePersonalInfo(personalInfoToUpdate)) {
            toggleEditOrSaveBtn("save", "personal-info");
            toggleInputsState(personalInfoDiv.querySelectorAll("input"), true);
          }
          window.location.href = "/profile";
          break;

        case "personal-info-cancel":
          toggleInputsState(personalInfoDiv.querySelectorAll("input"), true);
          toggleEditOrSaveBtn("save", "personal-info");
          renderUserInfo(userData.personalInfo);
          break;

        case "phone-number-edit-element":
          toggleEditOrSaveBtn("edit", "phone-number");
          document.querySelector("#phone-number").disabled = false;
          document.querySelector("#phone-number").focus();
          break;

        case "phone-number-save":
          try {
            const phoneNumber = validatePhoneNumber(
              document.querySelector("#phone-number").value
            );
            if (userData.personalInfo.phoneNumber !== +phoneNumber) {
              userData.phoneNumberToUpdate = phoneNumber;
              const response = await sendOtpOnEmail(phoneNumber);
              if (response.success) {
                showOtpPopup();
              } else {
                getAlertPopup(response.message);
                toggleEditOrSaveBtn("save", "phone-number");
                document.querySelector("#phone-number").disabled = true;
                renderUserInfo(userData.personalInfo);
              }
            } else {
              toggleEditOrSaveBtn("save", "phone-number");
              document.querySelector("#phone-number").disabled = true;
            }
          } catch (error) {
            showValidationError(error.message, "#number-field-alert");
          }
          break;

        case "phone-number-cancel":
          toggleEditOrSaveBtn("save", "phone-number");
          document.querySelector("#phone-number").disabled = true;
          renderUserInfo(userData.personalInfo);
          break;
      }
    });
};

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

// Function to initialize user information
export const initUserInfo = async (userData) => {
  const userInfo = await getUserInfo();
  if (userInfo) {
    userData.personalInfo = userInfo; // Update global userData
    for (const address of userInfo.addresses) {
      userData.addressInfo[address._id] = address;
    }

    renderUserInfo(userInfo);
    displayAddresses();
    addPersonalInfoEventListeners(userData); // Add event listeners after user data is loaded
  }
};
