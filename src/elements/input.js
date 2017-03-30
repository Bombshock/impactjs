(function (namespace, global) {
    "use strict";

    global.input = (props) => {
        var keyPressListener = props.onkeypress || {};
        delete props.onkeypress;

        var apply = impact.createElement("input", props);
        var el = apply();

        el.onkeypress = (event) => {
            if (keyPressListener[event.keyCode]) {
                keyPressListener[event.keyCode].call(el, event);
                impact.apply();
            }
        }

        el.$value = (val) => {
            if (typeof val !== "undefined") {
                el.value = `${val}`;
            } else {
                return `${el.value}`.trim();
            }
        }

        return apply;
    };

})(typeof module !== "undefined" ? module.exports : window.impact, typeof module !== "undefined" ? global : window);