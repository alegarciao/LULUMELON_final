(() => {
    "use strict";

    const pantalla = document.querySelector("#home-splash");
    const portada = document.querySelector(".collection__hero");
    const clave = "lulu-melon-inicio-visto";

    if (!pantalla || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
    }

    try {
        if (sessionStorage.getItem(clave) === "1") return;
        sessionStorage.setItem(clave, "1");
    } catch {
        // La presentación también funciona si el almacenamiento está bloqueado.
    }

    const contenido = [...document.querySelectorAll("main, .site-footer")]
        .filter((elemento) => !elemento.inert);

    pantalla.hidden = false;
    document.body.classList.add("home-splash-active");

    for (const elemento of contenido) {
        elemento.inert = true;
    }

    const pausaBreve = new Promise((resolver) => {
        window.setTimeout(resolver, 2200);
    });

    const portadaLista = portada?.decode
        ? portada.decode().catch(() => { })
        : Promise.resolve();

    const tiempoMaximo = new Promise((resolver) => {
        window.setTimeout(resolver, 2800);
    });

    Promise.race([
        Promise.all([pausaBreve, portadaLista]),
        tiempoMaximo
    ]).then(() => {
        pantalla.hidden = true;
        document.body.classList.remove("home-splash-active");

        for (const elemento of contenido) {
            elemento.inert = false;
        }
    });
})();

// pantalla de carga lulu