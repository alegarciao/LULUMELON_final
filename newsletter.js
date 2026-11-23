(() => {
    "use strict";

    const formulario = document.querySelector("#newsletter-form");
    const registro = document.querySelector("#newsletter-registro");
    const confirmacion = document.querySelector("#newsletter-confirmada");
    const tituloConfirmacion = document.querySelector("#confirmacion-titulo");
    const estado = document.querySelector("#newsletter-estado");
    const boton = formulario.querySelector('[type="submit"]');
    const correo = formulario.querySelector("#newsletter-email");

    correo.addEventListener("input", () => {
        correo.removeAttribute("aria-invalid");
        estado.className = "newsletter__status";
        estado.textContent = "";
    });

    formulario.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (boton.disabled) return;

        const valor = correo.value.trim();

        if (!valor) {
            correo.setAttribute("aria-invalid", "true");
            estado.className = "newsletter__status newsletter__status--error";
            estado.textContent = "Ingresa un correo";
            correo.focus();
            return;
        }

        if (!correo.validity.valid) {
            correo.setAttribute("aria-invalid", "true");
            estado.className = "newsletter__status newsletter__status--error";
            estado.textContent = "Ingresa un correo válido";
            correo.focus();
            return;
        }

        correo.removeAttribute("aria-invalid");
        estado.className = "newsletter__status";

        const destino = new URL(formulario.action);

        if (destino.pathname.endsWith("/TU_ID")) {
            formulario.reset();
            registro.hidden = true;
            confirmacion.hidden = false;
            tituloConfirmacion.focus();
            return;
        }

        boton.disabled = true;
        boton.textContent = "Enviando…";
        estado.textContent = "";

        try {
            const respuesta = await fetch(destino, {
                method: "POST",
                headers: { Accept: "application/json" },
                body: new FormData(formulario)
            });

            if (!respuesta.ok) {
                estado.textContent = respuesta.status === 429
                    ? "Hubo demasiados intentos. Espera un momento y vuelve a intentar."
                    : "No pudimos registrar tu correo. Inténtalo de nuevo.";
                return;
            }

            formulario.reset();
            registro.hidden = true;
            confirmacion.hidden = false;
            tituloConfirmacion.focus();
        } catch {
            estado.textContent = "No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.";
        } finally {
            boton.disabled = false;
            boton.textContent = "¡Listo!";
        }
    });
})();