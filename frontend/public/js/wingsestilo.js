window.addEventListener("load", () => {
  const urlParams = new URLSearchParams(window.location.search);

  if (urlParams.get("logged") === "n") {
    togglePopup();
  }

  // user login and profile logic

  const profileBtn = document.querySelector("#profile-btn");

  profileBtn.addEventListener("click", async () => {
    const res = await fetch("/api/user/ping-me");
    if (!res.ok) {
      if (await refreshAccessToken()) {
        window.location.href = "/profile";
      } else {
        togglePopup();
      }
    } else {
      renderName();
      window.location.href = "/profile";
    }
  });

  async function refreshAccessToken() {
    const res = await fetch("/api/user/refresh-access-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    return res.ok;
  }

  //set name in header if logged in
  function renderName() {
    const cookieData = parseCookies();

    if (cookieData.profile_name) {
      const i = document.createElement("i");
      const span = document.createElement("span");
      i.classList.add("bx", "bx-check");
      span.classList.add("login-name");

      span.innerText = `Hello ${cookieData.profile_name}`;
      profileBtn.appendChild(i);
      profileBtn.appendChild(span);
    }
  }

  renderName();
});

function parseCookies() {
  var cookies = document.cookie.split(";");
  var cookieObject = {};

  cookies.forEach(function (cookie) {
    var parts = cookie.split("=");
    var key = parts[0].trim();
    var value = parts[1];

    value = decodeURIComponent(value);

    cookieObject[key] = value;
  });

  return cookieObject;
}
