(function (namespace, global) {
    "use strict";

    global.a = (...args) => {
        var apply = impact.createElement("a", ...args);
        var el = apply();

        el.addEventListener("click", (event) => {
            event.preventDefault();

            let prefix = namespace.router.isHtml5Mode() ? "" : "#";
            let href = el.attributes.item("href").nodeValue;
            window.history.pushState({}, "", prefix + href);
        });

        if (typeof el.onclick === "function") {
            el.addEventListener("click", el.onclick);
            el.onclick = undefined;
        }

        return apply;
    };

})(typeof module !== "undefined" ? module.exports : window.impact, typeof module !== "undefined" ? global : window);