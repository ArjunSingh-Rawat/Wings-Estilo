$(document).ready(function () {
  $(".img-slider").slick({
    autoplay: true,
    autoplaySpeed: 3000,
    pauseOnHover: false,
    dots: true,
    arrows: false,
    slidesToShow: 1,
  });
});

$(document).ready(function () {
  $(".m-gown-slider").slick({
    autoplay: true,
    autoplaySpeed: 3000,
    pauseOnHover: false,
    dots: true,
    slidesToShow: 1,
    speed: 500,
    fade: true,
    cssEase: "linear",
  });
});
