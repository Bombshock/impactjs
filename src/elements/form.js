(function () {
    "use strict";

    namespace.global.form = (...args) => {
        var apply = namespace.createElement("form", ...args);
        var el = apply();

        if (typeof el.onsubmit !== "function") {
            el.onsubmit = (event) => event.preventDefault();
        }

        return apply;
    };

})();