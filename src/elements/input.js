(function () {
    "use strict";

    namespace.global.input = (props) => {
        var keyPressListener = props.onkeypress || {};
        delete props.onkeypress;

        var apply = namespace.createElement("input", props);
        var el = apply();

        el.onkeypress = (event) => {
            if (keyPressListener[event.keyCode]) {
                keyPressListener[event.keyCode].call(el, event);
                namespace.apply();
            }
        };

        el.$value = (val) => {
            if (typeof val !== "undefined") {
                el.value = `${val}`;
            } else {
                return `${el.value}`.trim();
            }
        };

        return apply;
    };

})();