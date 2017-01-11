
(function (namespace) {
    "use strict";

    window.form = (...args) => {
        var apply = impact.createElement("form", ...args);
        var el = apply();

        if (typeof el.onsubmit !== "function") {
            el.onsubmit = (event) => event.preventDefault();
        }

        return apply;
    };

})(impact);