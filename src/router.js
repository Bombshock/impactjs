
(function (namespace) {
    "use strict";

    let html5Mode = false;
    const routes = {};

    function getCurrentURL() {
        if (html5Mode) {
            return window.location.pathname;
        } else {
            return window.location.hash.substr(1);
        }
    }

    /**
     * @param key the key for this Configuration. Causes the nesting with a dotnotation.
     * @param config the confugration for this state. Can have the following options:
     *          # url <string>: url chunk for the given state. Trailing and leading slashes will be stripped
     *          # component <string>: name of the component to be rendered
     *          # args <fn|array|object>: arguments for the component to be instantiated with
     *          # views <key, object>: named objects for sub views, can have `component` and `args` attributes
     */

    function add(key, config) {
        var keys = key.split(".");
    }

    namespace.html5Mode = (val) => html5Mode = !!val;
    namespace.isHtml5Mode = () => html5Mode;
    namespace.add = add;
    namespace.getCurrentURL = getCurrentURL;

})(window.impact.router = {});