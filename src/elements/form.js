(function (namespace, global) {
    "use strict";

    global.form = (...args) => {
        var apply = impact.createElement("form", ...args);
        var el = apply();

        if (typeof el.onsubmit !== "function") {
            el.onsubmit = (event) => event.preventDefault();
        }

        return apply;
    };

})(typeof module !== "undefined" ? module.exports : window.impact, typeof module !== "undefined" ? global : window);