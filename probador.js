(() => {
    "use strict";

    const claveCarrito = "lulu-melon-carrito";
    const limiteVisible = 5;

    const prendasCompletas = new Set([
        "broderie-amarillo",
        "mini-dots",
        "image-72",
        "lace-mesh",
        "set-lino",
        "set-rib",
        "set-floral",
        "tailored",
        "kyoto",
        "alad",
        "lengerie-rosa",
        "lengerie-blanco",
        "lengerie-cafe",
        "vestido-midi",
        "slip-dress",
        "vestido-floral",
        "vestido-summer"
    ]);

    const contenido = document.querySelector("#probador-contenido");
    const vacio = document.querySelector("#probador-vacio");
    const lista = document.querySelector("#probador-prendas");
    const anterior = document.querySelector("#probador-anterior");
    const siguiente = document.querySelector("#probador-siguiente");
    const recuadros = document.querySelector("#outfit-recuadros");
    const limpiar = document.querySelector("#outfit-limpiar");
    const estado = document.querySelector("#probador-estado");

    const slots = Object.fromEntries(
        [...recuadros.querySelectorAll("[data-slot]")]
            .map((boton) => [boton.dataset.slot, boton])
    );

    const outfit = {
        superior: null,
        inferior: null,
        completo: null
    };

    let prendas = [];
    let inicio = 0;
    let seleccionada = null;
    let arrastrada = null;
    let gestoTactil = null;
    let ignorarClickHasta = 0;

    function clavePrenda(prenda) {
        return JSON.stringify([
            prenda.id,
            prenda.color ?? null,
            prenda.talla ?? null
        ]);
    }

    function etiquetaPrenda(prenda) {
        return [prenda.nombre, prenda.color, prenda.talla && `talla ${prenda.talla}`]
            .filter(Boolean)
            .join(", ");
    }

    function leerPrendas() {
        try {
            const carrito = JSON.parse(localStorage.getItem(claveCarrito) ?? "[]");

            if (!Array.isArray(carrito)) return [];

            return carrito
                .filter((prenda) =>
                    prenda &&
                    typeof prenda.id === "string" &&
                    typeof prenda.nombre === "string" &&
                    typeof prenda.imagen === "string" &&
                    prenda.imagen.length > 0 &&
                    prenda.cantidad > 0
                )
                .map((prenda) => ({ ...prenda, clave: clavePrenda(prenda) }));
        } catch {
            return [];
        }
    }

    function crearImagen(prenda, clase) {
        const imagen = document.createElement("img");
        imagen.className = clase;
        imagen.src = prenda.imagen;
        imagen.alt = "";
        imagen.draggable = false;
        return imagen;
    }

    function actualizarSeleccion() {
        for (const boton of lista.querySelectorAll("button")) {
            boton.setAttribute(
                "aria-pressed",
                String(boton.dataset.prenda === seleccionada)
            );
        }
    }

    function mostrarPrendas() {
        const tarjetas = document.createDocumentFragment();
        const visibles = prendas.slice(inicio, inicio + limiteVisible);

        for (const prenda of visibles) {
            const item = document.createElement("li");
            const boton = document.createElement("button");
            boton.type = "button";
            boton.className = "fitting-rack__product";
            boton.dataset.prenda = prenda.clave;
            boton.draggable = true;
            boton.setAttribute("aria-label", etiquetaPrenda(prenda));
            boton.title = etiquetaPrenda(prenda);
            boton.append(crearImagen(prenda, "fitting-rack__image"));
            item.append(boton);
            tarjetas.append(item);
        }

        lista.replaceChildren(tarjetas);
        lista.dataset.visible = String(visibles.length);
        actualizarSeleccion();

        anterior.setAttribute("aria-disabled", String(inicio === 0));
        siguiente.setAttribute(
            "aria-disabled",
            String(inicio + limiteVisible >= prendas.length)
        );
        ajustarFlechas();
    }

    function ajustarFlechas() {
        anterior.hidden = false;
        siguiente.hidden = false;
        anterior.style.removeProperty("top");
        anterior.style.removeProperty("bottom");
        siguiente.style.removeProperty("top");
        siguiente.style.removeProperty("bottom");
    }

    window.addEventListener("resize", ajustarFlechas);

    function mostrarOutfit() {
        for (const [nombre, boton] of Object.entries(slots)) {
            const prenda = outfit[nombre];

            boton.hidden = nombre === "completo"
                ? !outfit.completo
                : Boolean(outfit.completo);

            boton.replaceChildren();

            if (prenda) {
                boton.setAttribute("aria-label", `${nombre}: ${etiquetaPrenda(prenda)}`);
                boton.append(crearImagen(prenda, "outfit-board__image"));
            } else {
                const texto = nombre === "superior" ? "Parte superior" : "Parte inferior";
                const marcador = document.createElement("span");
                marcador.className = "outfit-board__placeholder";
                marcador.textContent = texto;
                boton.setAttribute("aria-label", `${texto}, recuadro vacío`);
                boton.append(marcador);
            }
        }

        limpiar.hidden = !Object.values(outfit).some(Boolean);
    }

    function colocarPrenda(clave, destino) {
        const prenda = prendas.find((item) => item.clave === clave);
        if (!prenda) return;

        let recuadro = destino;

        if (prendasCompletas.has(prenda.id)) {
            outfit.superior = null;
            outfit.inferior = null;
            recuadro = "completo";
        } else {
            outfit.completo = null;

            if (destino === "completo") {
                recuadro = "superior";
            }

            // Si mueves la misma variante a otro recuadro, quítala del anterior.
            for (const posicion of ["superior", "inferior"]) {
                if (outfit[posicion]?.clave === clave) outfit[posicion] = null;
            }
        }

        outfit[recuadro] = prenda;
        seleccionada = null;
        arrastrada = null;

        actualizarSeleccion();
        mostrarOutfit();
        slots[recuadro].focus();
        estado.textContent = `${prenda.nombre} colocada en el outfit.`;
    }

    function moverLista(paso) {
        const maximo = Math.max(0, prendas.length - limiteVisible);
        const nuevoInicio = Math.min(maximo, Math.max(0, inicio + paso));

        if (nuevoInicio === inicio) return;

        inicio = nuevoInicio;
        mostrarPrendas();
        estado.textContent = `Prendas ${inicio + 1} a ${Math.min(
            inicio + limiteVisible,
            prendas.length
        )} de ${prendas.length}.`;
    }

    anterior.addEventListener("click", () => moverLista(-1));
    siguiente.addEventListener("click", () => moverLista(1));

    lista.addEventListener("click", (event) => {
        const boton = event.target.closest("[data-prenda]");
        if (!boton) return;

        const clave = boton.dataset.prenda;
        seleccionada = seleccionada === clave ? null : clave;
        actualizarSeleccion();

        estado.textContent = seleccionada
            ? `${boton.getAttribute("aria-label")} seleccionada. Elige un recuadro.`
            : "Selección cancelada.";
    });

    document.addEventListener("click", (event) => {
        if (performance.now() > ignorarClickHasta) return;

        ignorarClickHasta = 0;
        event.preventDefault();
        event.stopImmediatePropagation();
    }, true);

    lista.addEventListener("pointerdown", (event) => {
        if (event.pointerType !== "touch" || !event.isPrimary) return;

        const boton = event.target.closest("[data-prenda]");
        if (!boton) return;

        gestoTactil = {
            pointerId: event.pointerId,
            clave: boton.dataset.prenda,
            inicioX: event.clientX,
            inicioY: event.clientY,
            arrastrando: false
        };
    });

    document.addEventListener("pointermove", (event) => {
        if (!gestoTactil || event.pointerId !== gestoTactil.pointerId) return;

        if (!gestoTactil.arrastrando) {
            const desplazamiento = Math.hypot(
                event.clientX - gestoTactil.inicioX,
                event.clientY - gestoTactil.inicioY
            );
            if (desplazamiento < 8) return;

            gestoTactil.arrastrando = true;
            arrastrada = gestoTactil.clave;
        }

        event.preventDefault();
        const destino = document.elementFromPoint(event.clientX, event.clientY)
            ?.closest("[data-slot]");

        for (const boton of Object.values(slots)) {
            boton.classList.toggle("outfit-board__slot--over", boton === destino);
        }
    });

    document.addEventListener("pointerup", (event) => {
        if (!gestoTactil || event.pointerId !== gestoTactil.pointerId) return;

        const gesto = gestoTactil;
        gestoTactil = null;
        if (!gesto.arrastrando) return;

        event.preventDefault();
        ignorarClickHasta = performance.now() + 250;

        const destino = document.elementFromPoint(event.clientX, event.clientY)
            ?.closest("[data-slot]");

        for (const boton of Object.values(slots)) {
            boton.classList.remove("outfit-board__slot--over");
        }

        if (destino) {
            colocarPrenda(gesto.clave, destino.dataset.slot);
        } else {
            arrastrada = null;
            estado.textContent = "Suelta la prenda sobre un recuadro para añadirla.";
        }
    });

    document.addEventListener("pointercancel", (event) => {
        if (!gestoTactil || event.pointerId !== gestoTactil.pointerId) return;

        gestoTactil = null;
        arrastrada = null;
        for (const boton of Object.values(slots)) {
            boton.classList.remove("outfit-board__slot--over");
        }
    });

    lista.addEventListener("dragstart", (event) => {
        const boton = event.target.closest("[data-prenda]");
        if (!boton || !event.dataTransfer) return;

        arrastrada = boton.dataset.prenda;
        event.dataTransfer.effectAllowed = "copy";
        event.dataTransfer.setData("text/plain", arrastrada);
    });

    lista.addEventListener("dragend", () => {
        arrastrada = null;
        for (const boton of Object.values(slots)) {
            boton.classList.remove("outfit-board__slot--over");
        }
    });

    for (const [nombre, boton] of Object.entries(slots)) {
        boton.addEventListener("click", () => {
            if (seleccionada) {
                colocarPrenda(seleccionada, nombre);
            } else {
                estado.textContent = "Primero elige una prenda de la lista.";
            }
        });

        boton.addEventListener("dragover", (event) => {
            if (!arrastrada) return;

            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
            boton.classList.add("outfit-board__slot--over");
        });

        boton.addEventListener("dragleave", (event) => {
            if (!boton.contains(event.relatedTarget)) {
                boton.classList.remove("outfit-board__slot--over");
            }
        });

        boton.addEventListener("drop", (event) => {
            event.preventDefault();
            boton.classList.remove("outfit-board__slot--over");
            if (arrastrada) colocarPrenda(arrastrada, nombre);
        });
    }

    limpiar.addEventListener("click", () => {
        outfit.superior = null;
        outfit.inferior = null;
        outfit.completo = null;
        seleccionada = null;

        actualizarSeleccion();
        mostrarOutfit();
        slots.superior.focus();
        estado.textContent = "Outfit limpio.";
    });

    function sincronizarPrendas() {
        prendas = leerPrendas();
        const disponibles = new Map(prendas.map((prenda) => [prenda.clave, prenda]));

        inicio = Math.min(inicio, Math.max(0, prendas.length - limiteVisible));

        if (!disponibles.has(seleccionada)) seleccionada = null;

        for (const nombre of Object.keys(outfit)) {
            const clave = outfit[nombre]?.clave;
            outfit[nombre] = disponibles.get(clave) ?? null;
        }

        vacio.hidden = prendas.length > 0;
        contenido.hidden = prendas.length === 0;

        mostrarPrendas();
        mostrarOutfit();
    }

    window.addEventListener("pageshow", sincronizarPrendas);
    window.addEventListener("storage", (event) => {
        if (event.key === claveCarrito || event.key === null) {
            sincronizarPrendas();
        }
    });

    sincronizarPrendas();
})();