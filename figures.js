const viewer = document.querySelector("dialog");
const image = viewer.querySelector(".viewer-image");
const caption = viewer.querySelector("#figure-caption");
const original = viewer.querySelector(".original");

if (typeof viewer.showModal === "function") {
  for (const link of document.querySelectorAll(".figure-link")) {
    link.addEventListener("click", (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      const thumbnail = link.querySelector("img");
      image.src = link.href;
      image.alt = thumbnail.alt;
      caption.textContent = thumbnail.alt;
      original.href = link.href;
      viewer.showModal();
    });
  }
  viewer.querySelector("button").addEventListener("click", () => viewer.close());
}
