(() => {
    "use strict";

    const claveCarrito = "lulu-melon-carrito";
    const claveFavoritos = "lulu-melon-favoritos";
    const whatsappTienda = "59171764894";

    // Añade aquí los datos que te entregue tu proveedor de pagos.
    const pagos = {
        imagenQr: "",
        urlTarjeta: ""
    };

    const metodos = {
        efectivo: {
            titulo: "Pago en efectivo",
            mensaje: "Pasa por la tienda para pagar en efectivo. Envía tu pedido por WhatsApp para que la tienda confirme la reserva y lo deje en espera."
        },
        tarjeta: {
            titulo: "Pago con tarjeta",
            mensaje: "Ingresa los datos de tu tarjeta en la pasarela de pago."
        },
        qr: {
            titulo: "Pago por QR",
            mensaje: "Escanea el QR con tu app bancaria y paga el importe indicado. Después, abre tu pedido en WhatsApp y adjunta el comprobante."
        },
        delivery: {
            titulo: "Pedido por delivery",
            mensaje: "Completa tus datos. La tienda confirmará por WhatsApp el costo del envío, el plazo y la forma de pago."
        },
        recojo: {
            titulo: "Recojo en tienda",
            mensaje: "Completa tus datos para coordinar el recojo. El mapa muestra la dirección de la sucursal de Santa Cruz."
        }
    };

    const moneda = new Intl.NumberFormat("es-BO", {
        maximumFractionDigits: 2
    });

    function precio(valor) {
        return `${moneda.format(valor)} Bs`;
    }

    function leerLista(clave) {
        try {
            const lista = JSON.parse(localStorage.getItem(clave) ?? "[]");
            return Array.isArray(lista) ? lista : [];
        } catch {
            return [];
        }
    }

    function leerCarrito() {
        return leerLista(claveCarrito).filter((item) =>
            item &&
            typeof item.id === "string" &&
            typeof item.nombre === "string" &&
            Number.isFinite(item.precio) &&
            item.precio >= 0 &&
            Number.isSafeInteger(item.cantidad) &&
            item.cantidad > 0
        );
    }

    function cantidadTotal(items) {
        return items.reduce((total, item) => total + item.cantidad, 0);
    }

    function importeTotal(items) {
        return items.reduce((total, item) => total + item.precio * item.cantidad, 0);
    }

    const enlacesCarrito = document.querySelectorAll('.site-header__action[href="carrito.html"]');

    for (const enlace of enlacesCarrito) {
        enlace.classList.add("site-header__action--cart");

        const contador = document.createElement("span");
        contador.className = "site-header__cart-count";
        contador.setAttribute("aria-hidden", "true");
        enlace.append(contador);
    }

    function actualizarContadores(items = leerCarrito()) {
        const unidades = cantidadTotal(items);
        const etiqueta = unidades === 1 ? "producto" : "productos";

        for (const enlace of enlacesCarrito) {
            const contador = enlace.querySelector(".site-header__cart-count");

            contador.hidden = unidades === 0;
            contador.textContent = unidades > 99 ? "99+" : String(unidades);
            enlace.setAttribute("aria-label", `Carrito, ${unidades} ${etiqueta}`);
        }
    }

    actualizarContadores();
    window.addEventListener("pageshow", () => actualizarContadores());
    window.addEventListener("lulu:carrito-actualizado", () => actualizarContadores());

    const lista = document.querySelector("#cart-items");

    // En las otras páginas solo se necesita el contador.
    if (!lista) {
        window.addEventListener("storage", (event) => {
            if (event.key === claveCarrito || event.key === null) {
                actualizarContadores();
            }
        });
        return;
    }

    const vacio = document.querySelector("#cart-empty");
    const contenido = document.querySelector("#cart-content");
    const estado = document.querySelector("#cart-status");
    const plantilla = document.querySelector("#cart-item-template");
    const formularioPago = document.querySelector("#cart-checkout");
    const dialogo = document.querySelector("#checkout-dialog");
    const formularioPedido = document.querySelector("#checkout-form");
    const campos = document.querySelector("#checkout-fields");
    const direccion = document.querySelector("#checkout-address");
    const etiquetaDireccion = document.querySelector("#checkout-address-label");
    const qr = document.querySelector("#checkout-qr");
    const mapa = document.querySelector("#checkout-map");
    const enlaceTarjeta = document.querySelector("#checkout-card-link");
    const camposTarjeta = document.querySelector("#checkout-card-fields");
    const listaProductosPago = document.querySelector("#checkout-products");
    const botonCompraLista = document.querySelector("#checkout-ready");
    const dialogoCompra = document.querySelector("#purchase-dialog");

    let carrito = leerCarrito();
    let favoritos = new Set(leerLista(claveFavoritos));
    let pedido = null;

    function identificar(item) {
        return JSON.stringify([item.id, item.color ?? null, item.talla ?? null]);
    }

    function variantes(item) {
        return [item.color, item.talla && `Talla ${item.talla}`]
            .filter(Boolean)
            .join(" · ");
    }

    function renderizarCarrito() {
        const tarjetas = document.createDocumentFragment();

        for (const item of carrito) {
            const tarjeta = plantilla.content.firstElementChild.cloneNode(true);
            tarjeta.dataset.item = identificar(item);

            const imagen = tarjeta.querySelector(".cart-item__image");
            if (item.imagen) {
                imagen.src = item.imagen;
            }

            tarjeta.querySelector(".cart-item__name").textContent = item.nombre;
            tarjeta.querySelector(".cart-item__price").textContent = `${precio(item.precio)} c/u`;

            const datos = tarjeta.querySelector(".cart-item__variants");
            datos.textContent = variantes(item);
            datos.hidden = !datos.textContent;

            const descripcion = tarjeta.querySelector(".cart-item__description");
            descripcion.textContent = item.descripcion ?? "";
            descripcion.hidden = !descripcion.textContent;

            tarjeta.querySelector(".cart-item__count").textContent = item.cantidad;
            tarjeta.querySelector('[data-action="decrease"]').disabled = item.cantidad <= 1;

            const corazon = tarjeta.querySelector('[data-action="favorite"]');
            const esFavorito = favoritos.has(item.id);
            corazon.setAttribute("aria-pressed", String(esFavorito));
            corazon.querySelector("i").className =
                `${esFavorito ? "fa-solid" : "fa-regular"} fa-heart`;

            tarjetas.append(tarjeta);
        }

        lista.replaceChildren(tarjetas);
        vacio.hidden = carrito.length > 0;
        contenido.hidden = carrito.length === 0;

        document.querySelector("#cart-units").textContent = cantidadTotal(carrito);
        document.querySelector("#cart-subtotal").textContent = precio(importeTotal(carrito));
        document.querySelector("#cart-total").textContent = precio(importeTotal(carrito));
        actualizarContadores(carrito);
    }

    lista.addEventListener("click", (event) => {
        const boton = event.target.closest("button[data-action]");
        if (!boton || boton.disabled) return;

        const tarjeta = boton.closest(".cart-item");
        const clave = tarjeta.dataset.item;
        const accion = boton.dataset.action;
        const botonesDeAccion = [...tarjeta.querySelectorAll(`[data-action="${accion}"]`)];
        const indiceBoton = botonesDeAccion.indexOf(boton);

        // Lee el estado más reciente, incluso si cambió desde otra pestaña.
        const actual = leerCarrito();
        const indice = actual.findIndex((item) => identificar(item) === clave);
        if (indice < 0) return;

        const item = actual[indice];

        try {
            if (accion === "favorite") {
                const nuevos = new Set(leerLista(claveFavoritos));
                const guardado = nuevos.delete(item.id);

                if (!guardado) nuevos.add(item.id);

                localStorage.setItem(claveFavoritos, JSON.stringify([...nuevos]));
                favoritos = nuevos;
                estado.textContent = guardado
                    ? `${item.nombre} se quitó de favoritos.`
                    : `${item.nombre} se guardó en favoritos.`;
            } else {
                if (accion === "remove") {
                    actual.splice(indice, 1);
                } else if (accion === "increase") {
                    item.cantidad += 1;
                } else {
                    item.cantidad = Math.max(1, item.cantidad - 1);
                }

                localStorage.setItem(claveCarrito, JSON.stringify(actual));
                estado.textContent = accion === "remove"
                    ? `${item.nombre} se quitó del carrito.`
                    : `${item.nombre}, cantidad ${item.cantidad}.`;
            }
        } catch {
            estado.textContent = "No se pudo guardar el cambio. Inténtalo de nuevo.";
            return;
        }

        carrito = actual;
        renderizarCarrito();

        if (accion === "remove") {
            const siguiente = lista.children[Math.min(indice, lista.children.length - 1)];
            const destino = siguiente?.querySelector(".cart-item__close") ?? vacio.querySelector("a");
            destino.focus();
        } else {
            const actualizada = lista.children[indice];
            const destino = actualizada.querySelectorAll(`[data-action="${accion}"]`)[indiceBoton];

            if (destino.disabled) {
                actualizada.querySelector('[data-action="increase"]').focus();
            } else {
                destino.focus();
            }
        }
    });

    formularioPago.addEventListener("submit", (event) => {
        event.preventDefault();

        if (carrito.length === 0) return;

        const metodo = new FormData(formularioPago).get("metodo");
        if (!metodo) {
            estado.textContent = "Elige una forma de pago o recogida para continuar.";
            estado.className = "cart-status cart-status--message";
            formularioPago.querySelector('[name="metodo"]').focus();
            return;
        }
        const datos = metodos[metodo];

        if (!datos) return;

        const items = carrito.map((item) => ({ ...item }));
        const codigo = `LM-${crypto.getRandomValues(new Uint32Array(1))[0].toString(36).toUpperCase()}`;

        pedido = {
            codigo,
            metodo,
            items,
            total: importeTotal(items)
        };

        formularioPedido.reset();

        const esRecojo = metodo === "recojo";
        const esDelivery = metodo === "delivery";
        const esTarjeta = metodo === "tarjeta";

        campos.hidden = !(esRecojo || esDelivery);
        campos.disabled = campos.hidden;
        direccion.hidden = !esDelivery;
        direccion.disabled = !esDelivery;
        direccion.required = esDelivery;
        etiquetaDireccion.hidden = !esDelivery;

        camposTarjeta.hidden = !esTarjeta;
        camposTarjeta.disabled = !esTarjeta;
        camposTarjeta.querySelectorAll("input").forEach((input) => {
            input.required = esTarjeta;
        });

        qr.hidden = metodo !== "qr";
        if (!qr.hidden) {
            const datosQr = `Lulu Melon | Solicitud ${pedido.codigo} | ${pedido.total} Bs`;
            qr.src = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(datosQr)}`;
        }

        enlaceTarjeta.hidden = true;

        mapa.hidden = !esRecojo;
        if (esRecojo && !mapa.hasAttribute("src")) {
            const ubicacion = "Calle Los Jazmines y Avenida San Martín, Equipetrol, Santa Cruz de la Sierra, Bolivia";
            mapa.src = `https://maps.google.com/maps?q=${encodeURIComponent(ubicacion)}&output=embed`;
        }

        let mensaje = datos.mensaje;

        document.querySelector("#checkout-title").textContent = datos.titulo;
        document.querySelector("#checkout-reference").textContent =
            `Solicitud ${pedido.codigo} · ${precio(pedido.total)}`;
        document.querySelector("#checkout-message").textContent = mensaje;

        listaProductosPago.replaceChildren();
        pedido.items.slice(0, 4).forEach((item) => {
            const fila = document.createElement("li");
            fila.className = "checkout-dialog__product";

            const imagen = document.createElement("img");
            imagen.className = "checkout-dialog__product-image";
            imagen.src = item.imagen;
            imagen.alt = item.nombre;

            const nombre = document.createElement("span");
            nombre.className = "checkout-dialog__product-name";
            nombre.textContent = `${item.cantidad} × ${item.nombre}`;

            const precioProducto = document.createElement("span");
            precioProducto.className = "checkout-dialog__product-price";
            precioProducto.textContent = precio(item.precio * item.cantidad);

            fila.append(imagen, nombre, precioProducto);
            listaProductosPago.append(fila);
        });

        dialogo.showModal();
    });

    document.querySelector("#checkout-close").addEventListener("click", () => {
        dialogo.close();
    });

    let inicioFuera = false;

    dialogo.addEventListener("pointerdown", (event) => {
        inicioFuera = event.target === dialogo;
    });

    dialogo.addEventListener("click", (event) => {
        if (inicioFuera && event.target === dialogo) dialogo.close();
        inicioFuera = false;
    });

    dialogo.addEventListener("close", () => {
        pedido = null;
        formularioPago.querySelector('[type="submit"]').focus();
    });

    botonCompraLista.addEventListener("click", () => {
        if (!pedido) return;

        if (!formularioPedido.checkValidity()) {
            const vacio = formularioPedido.querySelector(":invalid");
            formularioPedido.querySelectorAll(":invalid").forEach((campo) => {
                campo.setAttribute("aria-invalid", "true");
            });
            document.querySelector("#checkout-message").className =
                "checkout-dialog__message";
            document.querySelector("#checkout-message").textContent =
                pedido.metodo === "tarjeta"
                    ? "Completa los datos de tu tarjeta para continuar."
                    : "Completa tus datos de contacto para finalizar.";
            vacio?.focus();
            return;
        }

        const datos = new FormData(formularioPedido);
        const compra = {
            ...pedido,
            nombre: datos.get("nombre")?.toString().trim() ?? "",
            telefono: datos.get("telefono")?.toString().trim() ?? "",
            direccion: datos.get("direccion")?.toString().trim() ?? "",
            fecha: new Date().toISOString()
        };

        try {
            localStorage.setItem("lulu-melon-ultima-compra", JSON.stringify(compra));
            localStorage.setItem(claveCarrito, JSON.stringify([]));
            localStorage.setItem("lulu-melon-ultima-compra-fecha", compra.fecha);
            window.dispatchEvent(new Event("lulu:carrito-actualizado"));
            carrito = [];
            renderizarCarrito();
        } catch {
            estado.textContent = "No se pudo finalizar la compra. Inténtalo de nuevo.";
            return;
        }

        dialogo.close();
        dialogoCompra.showModal();
    });

    document.querySelector("#purchase-close").addEventListener("click", () => {
        dialogoCompra.close();
    });

    let inicioFueraCompra = false;
    dialogoCompra.addEventListener("pointerdown", (event) => {
        inicioFueraCompra = event.target === dialogoCompra;
    });
    dialogoCompra.addEventListener("click", (event) => {
        if (inicioFueraCompra && event.target === dialogoCompra) dialogoCompra.close();
        inicioFueraCompra = false;
    });

    formularioPedido.addEventListener("input", (event) => {
        const campo = event.target.closest("input, textarea");
        if (!campo) return;

        campo.removeAttribute("aria-invalid");

        if (formularioPedido.checkValidity()) {
            const mensaje = document.querySelector("#checkout-message");
            mensaje.className = "";
            mensaje.textContent = "";
        }
    });

    formularioPedido.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!pedido) return;

        const datos = new FormData(formularioPedido);
        const detalle = pedido.items.map((item) => {
            const opcion = variantes(item);
            const nombre = opcion ? `${item.nombre} (${opcion})` : item.nombre;
            return `• ${item.cantidad} × ${nombre} — ${precio(item.precio * item.cantidad)}`;
        });

        const mensaje = [
            `Hola, Lulu Melón. Quiero confirmar mi solicitud ${pedido.codigo}.`,
            `Modalidad: ${metodos[pedido.metodo].titulo}`,
            "",
            ...detalle,
            "",
            `Total de productos: ${precio(pedido.total)}`
        ];

        if (datos.has("nombre")) {
            mensaje.push(`Nombre: ${datos.get("nombre").trim()}`);
            mensaje.push(`Celular: ${datos.get("telefono").trim()}`);
        }
        if (datos.has("direccion")) {
            mensaje.push(`Dirección: ${datos.get("direccion").trim()}`);
        }

        const url = `https://wa.me/${whatsappTienda}?text=${encodeURIComponent(mensaje.join("\n"))}`;
        window.open(url, "_blank", "noopener,noreferrer");
    });

    function sincronizarCarrito() {
        if (dialogo.open) dialogo.close();
        carrito = leerCarrito();
        favoritos = new Set(leerLista(claveFavoritos));
        renderizarCarrito();
    }

    window.addEventListener("pageshow", sincronizarCarrito);
    window.addEventListener("storage", (event) => {
        if ([claveCarrito, claveFavoritos, null].includes(event.key)) {
            sincronizarCarrito();
        }
    });

    renderizarCarrito();
})();