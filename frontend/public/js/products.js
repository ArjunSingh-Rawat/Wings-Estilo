const contentBox = document.querySelector(".dress-grid");

let path = window.location.href.split("/");
path = path[path.length - 1];

fetch(`/${path}/products`)
  .then((response) => {
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    return response.json();
  })
  .then((data) => {
    data.forEach((element) => {
      const productHtml = `<a href="/${path}/title/name/${element.id}/buy" target = "_blank" class="product">
                                    <div class="dress-div">
                                        <div class="dress-img">
                                            <img src="${element.image[0]}" alt="" />
                                        </div>
                                        <div class="dress-info">
                                            <div class="dress-np">
                                                <p class="name">${element.name}</p>
                                                <p class="price">&#8377;<span>${element.price}</span></p>
                                            </div>
                                            <div class="add">
                                                <i class="bx bx-heart heart"></i>
                                            </div>
                                        </div>
                                    </div>
                                </a>`;
      contentBox.innerHTML += productHtml;
    });
  })
  .catch((error) => {
    console.error("Fetch error:", error);
  });

document.querySelector(".dress-grid").addEventListener("click", (event) => {
  if (event.target.classList.contains("heart")) {
    event.preventDefault();

    const heart = event.target;

    if (heart.classList.contains("bx-heart")) {
      heart.classList.remove("bx-heart");
      heart.classList.add("bxs-heart");
      heartTransform(heart);
    } else {
      heart.classList.remove("bxs-heart");
      heart.classList.add("bx-heart");
      heartTransform(heart);
    }
  }
});

function heartTransform(heart) {
  heart.style.transform = "scale(2,2)";

  setTimeout(() => {
    heart.style.transform = "";
  }, 300);
}
