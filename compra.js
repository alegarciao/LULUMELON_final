(() => {
    "use strict";

    const pedido = (() => {
        try {
            return JSON.parse(localStorage.getItem("lulu-melon-ultima-compra") ?? "null");
        } catch {
            return null;
        }
    })();

    if (!pedido) {
        document.querySelector(".purchase__receipt").hidden = true;
        document.querySelector(".purchase__title").textContent = "No hay una compra reciente";
        return;
    }

    const formato = new Intl.NumberFormat("es-BO", { maximumFractionDigits: 2 });
    document.querySelector("#purchase-code").textContent = `Solicitud ${pedido.codigo}`;
    const metodos = {
        efectivo: "Efectivo",
        tarjeta: "Tarjeta",
        qr: "QR",
        delivery: "Delivery",
        recojo: "Recojo"
    };
    document.querySelector("#purchase-method").textContent = `Método: ${metodos[pedido.metodo] ?? pedido.metodo}`;
    document.querySelector("#purchase-total").textContent = `Total: ${formato.format(pedido.total)} Bs`;

    const preview = document.querySelector("#purchase-preview");
    pedido.items.slice(0, 4).forEach((item) => {
        const elemento = document.createElement("li");
        elemento.className = "purchase__preview-item";
        const imagen = document.createElement("img");
        imagen.src = item.imagen;
        imagen.alt = item.nombre;
        elemento.append(imagen);
        preview.append(elemento);
    });
})();
