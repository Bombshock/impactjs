
(function (namespace) {
    "use strict";

    function component(name, controller) {

        if (controller && typeof controller !== "function") {
            throw new Error("impact.component(name, controller), argument 2 must be typeof function");
        }

        if (!controller && !namespace.components[name]) {
            throw new Error("impact.component(name, controller), can't find component with name '" + name + "'");
        }

        if (controller) {
            namespace.components[name] = controller;
        } else {
            return namespace.components[name];
        }
    }

    function watch(item, cb, deep) {
        let last;

        function getComparatorValue(obj) {
            if (typeof obj === "function") {
                obj = obj();
            }

            if (deep) {
                return JSON.stringify(obj);
            }

            if (Array.isArray(obj)) {
                return obj.length;
            } else if (typeof obj === "string") {
                return obj.toString ? obj.toString() : JSON.stringify(obj);
            } else {
                return obj;
            }
        }

        function watcher() {
            let now = getComparatorValue(item);
            if (last != now) {
                last = now;
                cb();
                namespace.apply();
            }
        }

        watcher();
        namespace.on("apply", watcher);
        return () => {
            namespace.off("apply", watcher);
        };
    }

    namespace.watch = watch;
    namespace.component = component;
    namespace.components = {};

})(impact);