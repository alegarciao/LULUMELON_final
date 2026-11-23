const controlsTemplate = document.querySelector("#catalog-carousel-controls");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

document.querySelectorAll(".catalog-carousel").forEach((carousel) => {
    const track = carousel.querySelector(".catalog-carousel__track");
    const heading = document.getElementById(carousel.getAttribute("aria-labelledby"));
    const category = heading.textContent.trim();
    const controls = controlsTemplate.content.firstElementChild.cloneNode(true);
    const [previous, next] = controls.querySelectorAll("button");

    previous.setAttribute("aria-label", `Anterior en ${category}`);
    next.setAttribute("aria-label", `Siguiente en ${category}`);
    previous.setAttribute("aria-controls", track.id);
    next.setAttribute("aria-controls", track.id);

    const body = document.createElement("div");
    body.className = "catalog-carousel__body";
    track.before(body);
    body.append(track, controls);
    carousel.classList.add("catalog-carousel--ready");

    function updateControls() {
        const maxScroll = track.scrollWidth - track.clientWidth;

        previous.setAttribute("aria-disabled", String(track.scrollLeft <= 1));
        next.setAttribute("aria-disabled", String(track.scrollLeft >= maxScroll - 1));
    }

    controls.addEventListener("click", (event) => {
        const button = event.target.closest("button");

        if (!button || button.getAttribute("aria-disabled") === "true") {
            return;
        }

        const [firstCard, secondCard] = track.children;
        const step = secondCard.getBoundingClientRect().left
            - firstCard.getBoundingClientRect().left;

        track.scrollBy({
            left: step * Number(button.dataset.direction),
            behavior: reducedMotion.matches ? "auto" : "smooth"
        });
    });

    track.addEventListener("scroll", updateControls, { passive: true });
    new ResizeObserver(updateControls).observe(track);
    updateControls();
});
document.querySelectorAll(".catalog-card__figure").forEach((figure) => {
    const imagen = figure.querySelector(".catalog-card__image");
    if (!(imagen instanceof HTMLImageElement) || !imagen.src) return;

    const ruta = imagen.getAttribute("src");
    const archivo = ruta.split("/").pop();
    const id = archivo.replace(/\.[^.]+$/, "");

    const enlace = document.createElement("a");
    enlace.className = "catalog-card__link";
    enlace.href = `prenda.html?id=${encodeURIComponent(id)}`;

    figure.before(enlace);
    enlace.append(figure);
});