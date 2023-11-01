// category js

function changeImage(anything) {
    document.getElementById("slider").src = anything;
}

function navigateToURL(location) {
    switch (location) {
        case "login":
            window.location.href = "/login";
            break;
        case "signup":
            window.location.href = "/sign-up";
        default:
            return;
    }
}
