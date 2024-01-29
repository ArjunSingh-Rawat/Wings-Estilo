window.addEventListener("load", () => {
  const urlParams = new URLSearchParams(window.location.search);

  if (urlParams.get("logged") === "n") {
    togglePopup();
  }

  // user login and profile logic

  const profileBtn = document.querySelector("#profile-btn");

  profileBtn.addEventListener("click", async () => {
    const res = await fetch("/api/users/ping-me");
    if (!res.ok) {
      if (await refreshAccessToken()) {
        window.location.href = "/profile";
      } else {
        togglePopup();
      }
    } else {
      window.location.href = "/profile";
    }
  });

  async function refreshAccessToken() {
    const res = await fetch("/api/users/refresh-access-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    return res.ok;
  }
});
