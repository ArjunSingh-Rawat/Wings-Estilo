const mainProdctImage = document.querySelector("#productImg");
const moreImagesDiv = document.querySelector(".more-img");

moreImagesDiv.addEventListener("click", (event) => {
  if (event.target.classList.contains("smallImg")) {
    const imageSrc = event.target.src;
    mainProdctImage.src = imageSrc;
  }
});
