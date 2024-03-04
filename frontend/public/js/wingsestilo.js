const urlParams = new URLSearchParams(window.location.search);

if (urlParams.get("logged") === "n") {
  togglePopup();
}

// user login and profile logic

const profileBtn = document.querySelector("#profile-btn");

profileBtn.addEventListener("click", async () => {
  const res = await fetch("/api/user/ping-me");
  if (!res.ok) {
    togglePopup();
  } else {
    if (window.location.href.split("/").pop() !== "profile") {
      window.location.href = "/profile";
    }
  }
});

// login popup

function togglePopup() {
  const Popup = document.getElementById("popup-1");
  if (Popup.classList.toggle("active")) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "visible";
  }
}

document.querySelector(".google-btn").addEventListener("click", () => {
  window.location.href = `/api/user/sign-in?pathName=${window.location.pathname}`;
});

// alert popup

const alertPopup = document.getElementById("alert-popup");
function getAlertPopup(message) {
  document.querySelector(".alert-message").innerText = message;

  alertPopup.classList.remove("hidden");
  setTimeout(function () {
    alertPopup.classList.add("hidden");
  }, 2000);
}

window.addEventListener("scroll", function () {
  const rect = alertPopup.getBoundingClientRect();

  if (rect.top < 0) {
    alertPopup.style.top = "20px";
  } else {
    alertPopup.style.top = "";
  }
});
