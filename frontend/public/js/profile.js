// toggle profile sections

let previousNav = "profile-section";
let previousSection = "my-profile-section";

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
  }
});

function toggleClass(currentDiv, previousDiv) {
  console.log(currentDiv, previousDiv);
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

// editing user info
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
      const personalInfoToChange = { firstName: "", lastName: "", gender: "" };

      const inputElements = personalInfoDiv.querySelectorAll("input");
      for (const element of inputElements) {
        if (element.type === "radio" && element.checked) {
          console.log(element);
          personalInfoToChange[element.name] = element.value;
        } else if (element.type !== "radio") {
          personalInfoToChange[element.name] = element.value;
        }
      }
      console.log(personalInfoToChange);
      if (await updatePersonalInfo(personalInfoToChange)) {
        event.target.parentElement.querySelector(
          "#personal-info-edit"
        ).style.display = "block";
        event.target.style.display = "none";

        for (const element of inputElements) {
          element.toggleAttribute("disabled");
        }
      }
      renderUserInfo();
    }
  });

renderUserInfo();

async function renderUserInfo() {
  const userData = await getUserInfo();

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
