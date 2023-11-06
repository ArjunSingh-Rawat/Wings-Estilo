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
    console.log(data);
    data.forEach((element) => {
      const productHtml = `<a href="/${path}/title/name/${element.id}/buy" target = "_blank">
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
