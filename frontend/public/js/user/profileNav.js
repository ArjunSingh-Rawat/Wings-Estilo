export function setupNavigation() {
  const profileNav = document.querySelector(".profile-nav");

  const urlParams = new URLSearchParams(window.location.search);
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
}

function toggleClass(currentDiv) {
  const sections = document.querySelectorAll(
    ".my-profile-section, .my-orders-section, .my-addresses-section"
  );

  sections.forEach((section) => {
    section.style.display = "none";
  });

  const activeSection = document.querySelector(`.my-${currentDiv}`);
  if (activeSection) {
    activeSection.style.display = "flex";
  }

  // Manage active navigation class
  const navItems = document.querySelectorAll(".nav");
  navItems.forEach((item) => item.classList.remove("nav-active")); // Remove active class from all
  document.getElementById(currentDiv).classList.add("nav-active"); // Add active class to current
}
