/*!
impact-js - v0.0.1
03.04.2017
License: MIT
*/
//src/frame.js
let namespace = {};
namespace.global = {};

if (typeof module !== "undefined") {
    module.exports = namespace;
} else {
    window.impact = namespace;
    namespace.global = window;
};

//src/core.js
(function () {
    "use strict";

    const events = {};
    let hashBase = 0;

    const types = [
        //https://developer.mozilla.org/en-US/docs/Web/HTML/Element
        //Main root
        "html",
        //Document metadata
        "base",
        "head",
        "link",
        "meta",
        "style",
        "title",
        //Content sectioning
        "address",
        "article",
        "aside",
        "footer",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "header",
        "hgroup",
        "nav",
        "section",
        //Text content
        "dd",
        "div",
        "dl",
        "dt",
        "figcaption",
        "figure",
        "hr",
        "li",
        "main",
        "ol",
        "p",
        "pre",
        "ul",
        //Inline text semantics
        "a",
        "abbr",
        "b",
        "bdi",
        "bdo",
        "br",
        "cite",
        "code",
        "data",
        "dfn",
        "em",
        "i",
        "kbd",
        "mark",
        "q",
        "rp",
        "rt",
        "rtc",
        "ruby",
        "s",
        "samp",
        "small",
        "span",
        "strong",
        "sub",
        "sup",
        "time",
        "u",
        "var",
        "wbr",
        //Image and multimedia
        "area",
        "audio",
        "img",
        "map",
        "track",
        "video",
        //Embedded content
        "embed",
        "object",
        "param",
        "source",
        //Scripting
        "canvas",
        "noscript",
        "script",
        //Demarcating edits
        "del",
        "ins",
        //Table content
        "caption",
        "cal",
        "colgroup",
        "table",
        "tbody",
        "td",
        "tfoot",
        "th",
        "thead",
        "tr",
        //Forms
        "button",
        "datalist",
        "fieldset",
        "form",
        "input",
        "label",
        "legend",
        "meter",
        "optgroup",
        "option",
        "output",
        "progress",
        "select",
        "textarea",
        //Interactive elements
        "details",
        "dialog",
        "menu",
        "menuitem",
        "summary",
        //Web Components
        "shadow",
        "slot",
        "template"
    ];

    const attributeTranslations = {
        for: "htmlFor"
    };

    const attributeSetterFunctions = [
        "value"
    ];

    function createNode(type) {
        return document.createElement(type);
    }

    function createTextNode(text) {
        return document.createTextNode(text);
    }

    function setProps(el, props) {
        Object.keys(props).forEach((propName) => {
            let value = props[propName];

            if (propName === "class") {
                setClass(el, value);
            } else if (propName === "style") {
                setStyles(el, value);
            } else if (value) {
                propName = attributeTranslations[propName] || propName;

                if (typeof value === "function" && propName.indexOf("on") === 0) {
                    el[propName] = (...args) => elNoop(el, value, ...args);
                } else {
                    if (typeof value === "function") {
                        value = value();
                    }

                    if (attributeSetterFunctions.includes(propName)) {
                        el.setAttribute(propName, value);
                    } else {
                        el[propName] = value;
                    }
                }
            }
        });
    }

    function setClass(el, cls) {
        let targetClassList = [];
        let actualClassList = Array.prototype.slice.call(el.classList);

        if (typeof cls === "string") {
            targetClassList = cls.split(" ");
        } else if (typeof cls === "function") {
            setClass(el, cls());
        } else if (typeof cls === "object") {
            Object.getOwnPropertyNames(cls).forEach((key) => {
                const property = key;
                let value = cls[key];
                if (typeof value === "function") {
                    value = value();
                }

                value = !!value;

                if (value === true) {
                    targetClassList.push(property);
                } else {
                    el.classList.remove(property);
                }
            });
        }

        targetClassList.forEach((cls) => {
            if (!actualClassList.includes(cls)) {
                el.classList.add(cls);
            }
        });
    }

    function setStyles(el, styles) {
        if (!styles) {
            el.removeAttribute(`styles`);
            return;
        }

        Object.keys(styles).forEach((styleName) => {
            if (styleName in el.style) {
                if (typeof styles[styleName] === "function") {
                    el.style[styleName] = styles[styleName]();
                } else {
                    el.style[styleName] = styles[styleName];
                }
            }
        });
    }

    function createElement(type, propsOrChild, ...children) {
        var el = impact.createNode(type);
        var props = {};
        var listener = {};

        if (Array.isArray(propsOrChild)) {
            children.unshift(propsOrChild);
        } else if (typeof propsOrChild === "function") {
            children.unshift(propsOrChild);
        } else if (typeof propsOrChild === "object") {
            props = propsOrChild;
        } else if (typeof propsOrChild !== "undefined") {
            children.unshift(propsOrChild);
        }

        children = flatten(children);

        children = children.map((child) => {
            if (typeof child !== "function") {
                return dynamicTextNode(() => `${child}`);
            } else {
                return child;
            }
        });

        el.$apply = () => {
            setProps(el, props);
            handleChildren(el, children);
            return el;
        };

        el.$apply.el = el;

        el.broadcast = (event, ...args) => {
            const currentChildNodes = Array.prototype.slice.call(el.childNodes);
            listener[event] = listener[event] || [];
            listener[event].forEach((fn) => {
                setTimeout(() => {
                    fn.call(el, ...args);
                });
            });
            currentChildNodes.forEach((node) => {
                if (typeof node.broadcast === "function") {
                    node.broadcast(event, ...args);
                }
            });
        };

        el.on = (event, fn) => {
            listener[event] = listener[event] || [];
            if (typeof fn === "function") {
                listener[event].push(fn);
            }
        };

        if (props.event) {
            Object.getOwnPropertyNames(props.event).forEach((eventName) => {
                let listener = props.event[eventName];
                el.on(eventName, listener);
            });
            delete props.event;
        }

        return el.$apply;
    }

    function handleChildren(el, children, preventDelete) {
        var init = !el.init;
        let currentChildNodes = Array.prototype.slice.call(el.childNodes);
        let targetChildNodes = [];
        let needsResort = false;

        el.init = true;

        flattenChildren(children);

        if (!preventDelete) {
            currentChildNodes.forEach(removeChild);
        }

        targetChildNodes.forEach(addChild);
        targetChildNodes.forEach(sortChild);

        function sortChild(node, wantedIndex) {
            currentChildNodes = Array.prototype.slice.call(el.childNodes);

            let currentIndex = currentChildNodes.indexOf(node);
            let swapNode = currentChildNodes[wantedIndex];

            if (currentIndex !== wantedIndex) {
                el.insertBefore(node, swapNode);
            }
        }

        function addChild(node, index) {
            if (!currentChildNodes.includes(node)) {
                let nextNode = el.children[index + 1];

                if (nextNode) {
                    el.insertBefore(node, nextNode);
                } else {
                    el.appendChild(node);
                }

                if (init) {
                    animateElement(node, "init");
                } else {
                    animateElement(node, "add");
                }
            }
        }

        function removeChild(node, index) {
            if (!targetChildNodes.includes(node)) {
                if (!node.willBeRemoved) {
                    node.willBeRemoved = true;
                    animateElement(node, "remove", function () {
                        el.removeChild(node);
                        node.willBeRemoved = false;
                    });
                }

                if (node.willBeRemoved) {
                    targetChildNodes.splice(index, 0, node);
                }
            }
        }

        function flattenChildren(children) {
            children.forEach((child) => {
                if (typeof child === "function") {
                    let childNode = child();
                    if (Array.isArray(childNode)) {
                        flattenChildren(childNode);
                    } else {
                        targetChildNodes.push(childNode);
                    }
                }
            });
        }
    }

    function animateElement(el, key, cb) {
        var animation = el.animation || {};
        var defaultDuration = 300;
        var baseClass = "animation-" + key;
        var actionClass = "animating";

        cb = cb || (() => {});

        if (animation[key]) {
            let duration = animation[key].duration || defaultDuration;

            el.style.transitionDuration = duration + "ms";
            el.classList.remove(actionClass);
            el.classList.add(baseClass);

            namespace.global.requestAnimationFrame(() => {
                el.classList.add(actionClass);
                setTimeout(() => {
                    namespace.global.requestAnimationFrame(() => {
                        el.classList.remove(baseClass);
                        el.classList.remove(actionClass);
                        el.style.transitionDuration = "";
                        cb();
                    });
                }, duration);
            });
        } else {
            cb();
        }
    }

    function flatten(arr) {
        let out = [];

        handleItem(arr);

        return out;

        function handleItem(item) {
            if (Array.isArray(item)) {
                item.forEach((item) => handleItem(item));
            } else {
                out.push(item);
            }
        }
    }

    function dynamicTextNode(fn) {
        var node = namespace.createTextNode("");
        return () => {
            node.nodeValue = `${fn()}`;
            return node;
        };
    }

    function render(node, ...children) {
        const start = Date.now();

        handleChildren(node, children, true);

        setTimeout(() => {
            const end = Date.now();
            console.log(`impact :: render: ${end - start}ms`);
        });

        function appendArray(arr) {
            arr.forEach((child) => {
                if (Array.isArray(child)) {
                    appendArray(child);
                } else {
                    node.appendChild(child());
                }
            });
        }
    }

    function elNoop(el, fn, ...args) {
        setTimeout(() => {
            fn.call(el, ...args);
            applyRoot();
        });
    }

    function applyRoot() {
        const start = Date.now();
        applyElement(namespace.root);
        const end = Date.now();
        eventEmit("apply");
        console.log(`impact :: cycle: ${end - start}ms`);
    }

    function applyOne(el) {
        if (typeof el.$apply === "function" && !el.$$phase) {
            el.$$phase = true;
            el.$apply();
            el.$$phase = false;
        }
    }

    function applyElement(el) {
        var childNodes = Array.prototype.slice.call(el.childNodes);

        applyOne(el);

        childNodes
            .filter((node) => typeof node.$apply === "function")
            .forEach(applyElement);
    }

    function eventOn(event, fn) {
        events[event] = events[event] || [];
        events[event].push(fn);
    }

    function eventOff(event, fn) {
        events[event] = events[event] || [];
        if (events[event].includes(fn)) {
            events[event].splice(events[event].indexOf(fn), 1);
        }
    }

    function eventEmit(event, ...data) {
        events[event] = events[event] || [];
        events[event].forEach((fn) => fn(...data));
    }

    //http://stackoverflow.com/questions/10073699/pad-a-number-with-leading-zeros-in-javascript    
    function padDigits(number, digits) {
        return Array(Math.max(digits - String(number).length + 1, 0)).join(0) + number;
    }

    function getHash(obj) {
        if (typeof obj === "object" && obj !== null) {
            obj.$$hash = obj.$$hash || padDigits(++hashBase, 5);
            return obj.$$hash;
        } else {
            return `${obj}`;
        }
    }

    function repeat(arr, fn, trackBy) {
        if (typeof arr === "function") {
            const shadow = shadowArray(fn);
            return () => shadow(arr());
        } else {
            return arr.map((item) => fn(item));
        }
    }

    function shadowArray(fn) {
        var shadowTree = {};

        return (arr) => {
            let hashMap = arr.map(getHash);

            Object.keys(shadowTree).forEach((hash) => {
                if (!hashMap.includes(hash)) {
                    delete shadowTree[hash];
                }
            });

            return arr.map((item) => {
                var hash = getHash(item);
                shadowTree[hash] = shadowTree[hash] || fn(item);
                return shadowTree[hash];
            });
        };
    }

    function impIf(fn, child) {
        return () => {
            let out = [];
            if (fn()) {
                out.push(child);
            }
            return out;
        };
    }

    function debounce(fn, delay) {
        var timer = null;
        return function () {
            var context = this,
                args = arguments;
            clearTimeout(timer);
            timer = setTimeout(function () {
                fn.apply(context, args);
            }, delay);
        };
    }

    types.forEach((type) => {
        namespace.global[type] = (...args) => createElement(type, ...args);
    });

    namespace.repeat = repeat;
    namespace.if = impIf;
    namespace.createNode = createNode;
    namespace.createTextNode = createTextNode;
    namespace.render = render;
    namespace.text = dynamicTextNode;
    namespace.on = eventOn;
    namespace.off = eventOff;
    namespace.emit = eventEmit;
    namespace.createElement = createElement;
    namespace.debounce = debounce;
    namespace.apply = debounce(applyRoot, 5);

})();

//src/elements/a.js
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

//src/elements/form.js
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

//src/elements/input.js
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

//src/util.js
(function () {
    "use strict";

    function component(name, controller) {

        if (controller && typeof controller !== "function") {
            throw new Error("impact.component(name, controller), argument 2 must be typeof function");
        }

        if (!controller && !namespace.components[name]) {
            let err = new Error("impact.component(name), can't find component with name '" + name + "'");
            console.error(err);
            return () => {};
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

        function watcher(apply) {
            let now = getComparatorValue(item);
            if (last != now) {
                last = now;
                cb();
                if (apply !== false) {
                    namespace.apply();
                }
            }
        }

        watcher(false);
        namespace.on("apply", watcher);
        return () => {
            namespace.off("apply", watcher);
        };
    }

    namespace.watch = watch;
    namespace.component = component;
    namespace.components = {};

})();