import { initUserInfo } from "./userInfo.js";
import {
  resendOtp,
  submitOtp,
  clearOtpInputValues,
  closeOtpDiv,
} from "./userOtp.js";
import { initUserOrders } from "./userOrders.js";
import { setupNavigation } from "./profileNav.js";

const userData = {
  personalInfo: {},
  addressInfo: {},
  orderInfo: [],
  primaryOtp: "",
  updateOtp: "",
  phoneNumberToUpdate: "",
};

// Initialization function
async function initProfilePage() {
  setupNavigation();
  await initUserInfo(userData);

  initUserOrders(userData);
}
initProfilePage();

window.userData = userData;
window.resendOtp = resendOtp;
window.submitOtp = submitOtp;
window.closeOtpDiv = closeOtpDiv;
window.clearOtpInputValues = clearOtpInputValues;

window.logout = async () => {
  let response = await fetch("/api/user/logout");
  window.location.href = response.url;
};
