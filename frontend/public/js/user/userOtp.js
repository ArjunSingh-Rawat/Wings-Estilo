import { renderUserInfo, toggleEditOrSaveBtn } from "./userInfo.js";

const otpPopup = document.querySelector("#otp-container");
const otpInputElements = document.querySelectorAll(".primary-otp input");
const otpErrorDiv = document.querySelector(".otp-errors");
const otpTimeElement = document.querySelector(".otp-not-rec span");
const phoneNumberInput = document.querySelector("#phone-number");
const otpButtonsArray = [
  document.querySelector("#otp-submit-btn"),
  document.querySelector("#otp-resend-btn"),
];

let backspaceCount = 0;
let otpTimeIntervalId = null;

export function showOtpPopup() {
  otpPopup.style.display = "flex";
  otpInputElements[0].focus();
  otpPopup.querySelector(".user-email").innerText = userData.personalInfo.email;
  toggleSubmitOrResendBtn("submit");
  otpTimeElement.innerText = "120 sec";
  startOtpExpireTimer();
}

export async function submitOtp() {
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

export async function resendOtp() {
  const response = await sendOtpOnEmail(userData.phoneNumberToUpdate);
  if (response.success) {
    showOtpPopup();
  } else {
    getAlertPopup(response.message);
    toggleEditOrSaveBtn("save", "phone-number");
    phoneNumberInput.toggleAttribute("disabled");
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

export function clearOtpInputValues() {
  otpInputElements.forEach((input) => (input.value = ""));
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

export function closeOtpDiv() {
  otpPopup.style.display = "none";
  toggleEditOrSaveBtn("save", "phone-number");
  phoneNumberInput.toggleAttribute("disabled");
  renderUserInfo(userData.personalInfo);
}

function toggleSubmitOrResendBtn(buttonToShow) {
  otpButtonsArray.forEach((btn) => (btn.style.display = "none"));

  if (buttonToShow === "submit") {
    otpButtonsArray[0].style.display = "inline-block";
  } else if (buttonToShow === "resend") {
    otpButtonsArray[1].style.display = "inline-block";
  } else if (buttonToShow === "showBoth") {
    otpButtonsArray.forEach((btn) => (btn.style.display = "inline-block"));
  }
}

export async function sendOtpOnEmail(phoneNumber) {
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

// Event listener for OTP input control
document
  .querySelector(".otp-value-container")
  .addEventListener("keyup", (event) => {
    if (event.target.tagName === "INPUT") {
      const index = Array.from(otpInputElements).indexOf(event.target);
      handleOtpControl(otpInputElements, event, index);
    }
  });
