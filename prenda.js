const PALABRAS = {
    blanco: ["Blanco", "#fffaf5"],
    negro: ["Negro", "#232126"],
    marino: ["Azul marino", "#12253b"],
    celeste: ["Celeste", "#a8c8e2"],
    rosa: ["Rosa", "#eda8bd"],
    amarillo: ["Amarillo suave", "#e9df7d"],
    crema: ["Crema", "#e9dbbe"],
    cafe: ["Café", "#685043"],
    rojo: ["Rojo", "#a32c38"],
    verde: ["Verde", "#747d59"],
    azul: ["Azul", "#3f6491"],
};

const archivos = [
    ["vac-edit", "napoleaon", "Napoleon"], ["vac-edit", "napoleon jacket", "Napoleon Jacket"],
    ["vac-edit", "Broderie", "Broderie"], ["vac-edit", "Smocked", "Smocked"], ["vac-edit", "Shangai", "Shangai"],
    ["basicos", "basics long sleeve", "Basics Long Sleeve"], ["basicos", "basics t-shirt", "Basics T-Shirt"],
    ["basicos", "blackless top", "Blackless Top"], ["basicos", "manga cero", "Manga Cero"],
    ["basicos", "solera basica", "Solera Básica"],
    ["bodys", "Esteem", "Esteem"], ["bodys", "V neck", "V Neck"], ["bodys", "Mil usos", "Mil Usos"],
    ["bodys", "escote cuadrado manga larga", "Escote Cuadrado Manga Larga"],
    ["bodys", "escote cuadrado", "Escote Cuadrado"],
    ["tops", "off shouldder", "Off Shoulder"], ["tops", "Halter Mao", "Halter Mao"],
    ["tops", "BRODERIE strapless", "Broderie Strapless"], ["tops", "LACE TRIM", "Lace Trim"],
    ["tops", "Smocked", "Smocked"],
    ["jeans", "mid low waisted", "Mid-Low Waisted"], ["jeans", "belted", "Belted"],
    ["jeans", "barrel jean", "Barrel Jean"], ["jeans", "high-waisted", "High-Waisted"],
    ["jeans", "mom classic", "Mom Classic"],
    ["faldas", "maxi skirt", "Maxi Skirt"], ["faldas", "mini skirt", "Mini Skirt"],
    ["faldas", "folded mini", "Folded Mini"], ["faldas", "pleated skirt", "Pleated Skirt"],
    ["faldas", "satin lace midi", "Satin Lace Midi"],
    ["shorts", "gingham short", "Gingham Short"], ["shorts", "mini-short", "Mini-short"],
    ["shorts", "bermuda cali", "Bermuda Cali"],
    ["pantalones", "low-waisted", "Low Waisted"], ["pantalones", "high-waisted", "High Waisted"],
    ["pantalones", "barrel-pants", "Barrel Pants"],
    ["sweaters", "Washington", "Washington"], ["sweaters", "London", "London"],
    ["sweaters", "Preppy", "Preppy"], ["sweaters", "OKLAHOMA", "Oklahoma"],
    ["sweaters", "Mini Striped", "Mini Striped"],
    ["jackets", "Asymmetrical jacket", "Asymmetrical Jacket"],
    ["jackets", "Gingham jacket", "Gingham Jacket"], ["jackets", "denim", "Denim"],
    ["sets", "Alad", "Alad"], ["sets", "lace", "Lace"], ["sets", "Lace Mesh", "Lace Mesh"],
    ["sets", "lace summer", "Lace Summer"], ["sets", "mini dots", "Mini Dots"],
    ["sets", "satin", "Satin"], ["sets", "kyoto", "Kyoto"], ["sets", "tailored", "Tailored"],
    ["vestidos", "lengerie dress", "Lengerie Rosa"], ["vestidos", "lengerie dress (1)", "Lengerie Blanco"],
    ["vestidos", "lengerie dress (2)", "Lengerie Café"],
];

function nombreArchivo(carpeta, archivo) {
    return `${carpeta}/${archivo}.png`;
}

function clave(texto) {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function precioDeterminista(claveProducto, carpeta, indice) {
    if (carpeta === "basicos") return 89;
    if (carpeta === "bolsos") return 209 + (indice % 5) * 14;
    let valor = 0;
    for (const caracter of claveProducto) valor = (valor * 31 + caracter.charCodeAt(0)) % 162;
    return 119 + valor;
}

const productos = new Map();

archivos.forEach(([carpeta, archivo, nombre], indice) => {
    const id = clave(archivo);
    const carpetaEsBolso = carpeta === "bolsos";
    const paletas = carpetaEsBolso
        ? ["cafe", "crema", "negro"]
        : carpeta === "basicos"
            ? ["blanco", "negro", "celeste"]
            : ["blanco", "negro", "marino", "rosa"];

    productos.set(id, {
        id,
        nombre,
        titulo: nombre,
        precio: precioDeterminista(id, carpeta, indice),
        descripcion: carpetaEsBolso
            ? `${nombre}: un bolso versátil con diseño práctico, cómodo de llevar y fácil de combinar.`
            : `${nombre}: una prenda versátil con detalles cuidados, cómoda para el día a día y pensada para combinar con tu estilo.`,
        colores: paletas,
        tipo: "prenda",
        imagen: nombreArchivo(carpeta, archivo),
    });
    productos.set(archivo, productos.get(id));
});

const params = new URLSearchParams(window.location.search);
const solicitado = params.get("id") ?? "lace";
const solicitadoNormalizado = clave(solicitado);
const producto = productos.get(solicitado)
    ?? productos.get(solicitadoNormalizado)
    ?? [...productos.values()].find((item, indice, lista) =>
        lista.findIndex((candidato) => candidato.id === item.id) === indice
    );
const ficha = document.querySelector(".product-detail");
const formulario = document.querySelector("#prenda-form");
const estado = document.querySelector("#prenda-estado");
const swatches = document.querySelector("#prenda-colores");
const colorElegido = document.querySelector("#prenda-color-elegido");

function mostrarColores() {
    swatches.replaceChildren();
    const disponibles = producto.colores.map((claveColor) => PALABRAS[claveColor]);

    disponibles.forEach(([nombre, muestra], indice) => {
        const etiqueta = document.createElement("label");
        etiqueta.className = "product-detail__option";

        const input = document.createElement("input");
        input.className = "visually-hidden";
        input.type = "radio";
        input.name = "color";
        input.value = nombre;
        input.checked = indice === 0;

        const muestraColor = document.createElement("span");
        muestraColor.className = "product-detail__swatch";
        muestraColor.style.setProperty("--swatch-color", muestra);

        const texto = document.createElement("span");
        texto.className = "visually-hidden";
        texto.textContent = nombre;

        etiqueta.append(input, muestraColor, texto);
        swatches.append(etiqueta);
    });

    colorElegido.textContent = disponibles[0][0];
    swatches.addEventListener("change", (event) => {
        colorElegido.textContent = event.target.value;
    });
}

function mostrarRecomendaciones() {
    const lista = document.querySelector("#prendas-recomendadas");
    lista.replaceChildren();
    const disponibles = [...productos.values()]
        .filter((item, indice, listaCompleta) =>
            listaCompleta.findIndex((candidato) => candidato.id === item.id) === indice
        )
        .filter((item) => item.tipo === "prenda" && item.id !== producto.id);

    disponibles.slice(0, 6).forEach((recomendado) => {
        const item = document.createElement("li");
        item.className = "recommendations__item";
        if (recomendado.tipo === "prenda") item.classList.remove("recommendations__item--bag");

        const enlace = document.createElement("a");
        enlace.className = "recommendations__link";
        enlace.href = `prenda.html?id=${encodeURIComponent(recomendado.id)}`;

        const nombre = document.createElement("span");
        nombre.className = "recommendations__name";
        nombre.textContent = recomendado.nombre;

        const imagen = document.createElement("img");
        imagen.className = "recommendations__image";
        imagen.src = recomendado.imagen;
        imagen.alt = recomendado.nombre;
        imagen.loading = "lazy";

        enlace.append(nombre, imagen);
        item.append(enlace);
        lista.append(item);
    });
    document.querySelector(".recommendations").hidden = false;
}

function agregarAlCarrito(event) {
    event.preventDefault();
    const datos = new FormData(formulario);
    const claveCarrito = "lulu-melon-carrito";
    const talla = datos.get("talla");

    if (!talla) {
        estado.className = "product-detail__status product-detail__status--message";
        estado.textContent = "Selecciona tu talla antes de agregar la prenda.";
        formulario.querySelector('[name="talla"]')?.closest("fieldset")?.scrollIntoView({
            block: "nearest",
            behavior: "smooth"
        });
        return;
    }

    try {
        const carrito = JSON.parse(localStorage.getItem(claveCarrito) ?? "[]");
        const color = datos.get("color");
        const existente = carrito.find((item) =>
            item.id === producto.id && item.color === color && item.talla === talla
        );

        if (existente) existente.cantidad += 1;
        else carrito.push({
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            imagen: producto.imagen,
            color,
            talla,
            cantidad: 1,
        });

        const lineaGuardada = existente ?? carrito[carrito.length - 1];
        lineaGuardada.descripcion = producto.descripcion;
        localStorage.setItem(claveCarrito, JSON.stringify(carrito));
        window.dispatchEvent(new Event("lulu:carrito-actualizado"));
        estado.className = "product-detail__status product-detail__status--success";
        estado.textContent = `✓ ${producto.nombre} fue añadida al carrito en talla ${talla}.`;
    } catch {
        estado.textContent = "No se pudo guardar la prenda. Vuelve a intentarlo.";
    }
}

if (producto) {
    document.title = `${producto.titulo} | Lulu Melón`;
    document.querySelector("#prenda-nombre").textContent = producto.titulo;
    document.querySelector("#prenda-precio").textContent = `${producto.precio} Bs`;
    document.querySelector("#prenda-descripcion").textContent = producto.descripcion;

    const imagen = document.querySelector("#prenda-imagen");
    imagen.src = producto.imagen;
    imagen.alt = producto.titulo;

    mostrarColores();
    mostrarRecomendaciones();
    formulario.addEventListener("submit", agregarAlCarrito);
    ficha.hidden = false;
} else {
    document.querySelector("#prenda-no-encontrada").hidden = false;
}
