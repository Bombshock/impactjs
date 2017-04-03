"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/*!
impact-js - v0.0.1
03.04.2017
License: MIT
*/
//src/frame.js
var namespace = {};
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

    var events = {};
    var hashBase = 0;

    var types = [
    //https://developer.mozilla.org/en-US/docs/Web/HTML/Element
    //Main root
    "html",
    //Document metadata
    "base", "head", "link", "meta", "style", "title",
    //Content sectioning
    "address", "article", "aside", "footer", "h1", "h2", "h3", "h4", "h5", "h6", "header", "hgroup", "nav", "section",
    //Text content
    "dd", "div", "dl", "dt", "figcaption", "figure", "hr", "li", "main", "ol", "p", "pre", "ul",
    //Inline text semantics
    "a", "abbr", "b", "bdi", "bdo", "br", "cite", "code", "data", "dfn", "em", "i", "kbd", "mark", "q", "rp", "rt", "rtc", "ruby", "s", "samp", "small", "span", "strong", "sub", "sup", "time", "u", "var", "wbr",
    //Image and multimedia
    "area", "audio", "img", "map", "track", "video",
    //Embedded content
    "embed", "object", "param", "source",
    //Scripting
    "canvas", "noscript", "script",
    //Demarcating edits
    "del", "ins",
    //Table content
    "caption", "cal", "colgroup", "table", "tbody", "td", "tfoot", "th", "thead", "tr",
    //Forms
    "button", "datalist", "fieldset", "form", "input", "label", "legend", "meter", "optgroup", "option", "output", "progress", "select", "textarea",
    //Interactive elements
    "details", "dialog", "menu", "menuitem", "summary",
    //Web Components
    "shadow", "slot", "template"];

    var attributeTranslations = {
        for: "htmlFor"
    };

    var attributeSetterFunctions = ["value"];

    function createNode(type) {
        return document.createElement(type);
    }

    function createTextNode(text) {
        return document.createTextNode(text);
    }

    function setProps(el, props) {
        Object.keys(props).forEach(function (propName) {
            var value = props[propName];

            if (propName === "class") {
                setClass(el, value);
            } else if (propName === "style") {
                setStyles(el, value);
            } else if (value) {
                propName = attributeTranslations[propName] || propName;

                if (typeof value === "function" && propName.indexOf("on") === 0) {
                    el[propName] = function () {
                        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                            args[_key] = arguments[_key];
                        }

                        return elNoop.apply(undefined, [el, value].concat(args));
                    };
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
        var targetClassList = [];
        var actualClassList = Array.prototype.slice.call(el.classList);

        if (typeof cls === "string") {
            targetClassList = cls.split(" ");
        } else if (typeof cls === "function") {
            setClass(el, cls());
        } else if ((typeof cls === "undefined" ? "undefined" : _typeof(cls)) === "object") {
            Object.getOwnPropertyNames(cls).forEach(function (key) {
                var property = key;
                var value = cls[key];
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

        targetClassList.forEach(function (cls) {
            if (!actualClassList.includes(cls)) {
                el.classList.add(cls);
            }
        });
    }

    function setStyles(el, styles) {
        if (!styles) {
            el.removeAttribute("styles");
            return;
        }

        Object.keys(styles).forEach(function (styleName) {
            if (styleName in el.style) {
                if (typeof styles[styleName] === "function") {
                    el.style[styleName] = styles[styleName]();
                } else {
                    el.style[styleName] = styles[styleName];
                }
            }
        });
    }

    function createElement(type, propsOrChild) {
        for (var _len2 = arguments.length, children = Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
            children[_key2 - 2] = arguments[_key2];
        }

        var el = impact.createNode(type);
        var props = {};
        var listener = {};

        if (Array.isArray(propsOrChild)) {
            children.unshift(propsOrChild);
        } else if (typeof propsOrChild === "function") {
            children.unshift(propsOrChild);
        } else if ((typeof propsOrChild === "undefined" ? "undefined" : _typeof(propsOrChild)) === "object") {
            props = propsOrChild;
        } else if (typeof propsOrChild !== "undefined") {
            children.unshift(propsOrChild);
        }

        children = flatten(children);

        children = children.map(function (child) {
            if (typeof child !== "function") {
                return dynamicTextNode(function () {
                    return "" + child;
                });
            } else {
                return child;
            }
        });

        el.$apply = function () {
            setProps(el, props);
            handleChildren(el, children);
            return el;
        };

        el.$apply.el = el;

        el.broadcast = function (event) {
            for (var _len3 = arguments.length, args = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
                args[_key3 - 1] = arguments[_key3];
            }

            var currentChildNodes = Array.prototype.slice.call(el.childNodes);
            listener[event] = listener[event] || [];
            listener[event].forEach(function (fn) {
                setTimeout(function () {
                    fn.call.apply(fn, [el].concat(args));
                });
            });
            currentChildNodes.forEach(function (node) {
                if (typeof node.broadcast === "function") {
                    node.broadcast.apply(node, [event].concat(args));
                }
            });
        };

        el.on = function (event, fn) {
            listener[event] = listener[event] || [];
            if (typeof fn === "function") {
                listener[event].push(fn);
            }
        };

        if (props.event) {
            Object.getOwnPropertyNames(props.event).forEach(function (eventName) {
                var listener = props.event[eventName];
                el.on(eventName, listener);
            });
            delete props.event;
        }

        return el.$apply;
    }

    function handleChildren(el, children, preventDelete) {
        var init = !el.init;
        var currentChildNodes = Array.prototype.slice.call(el.childNodes);
        var targetChildNodes = [];
        var needsResort = false;

        el.init = true;

        flattenChildren(children);

        if (!preventDelete) {
            currentChildNodes.forEach(removeChild);
        }

        targetChildNodes.forEach(addChild);
        targetChildNodes.forEach(sortChild);

        function sortChild(node, wantedIndex) {
            currentChildNodes = Array.prototype.slice.call(el.childNodes);

            var currentIndex = currentChildNodes.indexOf(node);
            var swapNode = currentChildNodes[wantedIndex];

            if (currentIndex !== wantedIndex) {
                el.insertBefore(node, swapNode);
            }
        }

        function addChild(node, index) {
            if (!currentChildNodes.includes(node)) {
                var nextNode = el.children[index + 1];

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
            children.forEach(function (child) {
                if (typeof child === "function") {
                    var childNode = child();
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

        cb = cb || function () {};

        if (animation[key]) {
            (function () {
                var duration = animation[key].duration || defaultDuration;

                el.style.transitionDuration = duration + "ms";
                el.classList.remove(actionClass);
                el.classList.add(baseClass);

                namespace.global.requestAnimationFrame(function () {
                    el.classList.add(actionClass);
                    setTimeout(function () {
                        namespace.global.requestAnimationFrame(function () {
                            el.classList.remove(baseClass);
                            el.classList.remove(actionClass);
                            el.style.transitionDuration = "";
                            cb();
                        });
                    }, duration);
                });
            })();
        } else {
            cb();
        }
    }

    function flatten(arr) {
        var out = [];

        handleItem(arr);

        return out;

        function handleItem(item) {
            if (Array.isArray(item)) {
                item.forEach(function (item) {
                    return handleItem(item);
                });
            } else {
                out.push(item);
            }
        }
    }

    function dynamicTextNode(fn) {
        var node = namespace.createTextNode("");
        return function () {
            node.nodeValue = "" + fn();
            return node;
        };
    }

    function render(node) {
        var start = Date.now();

        for (var _len4 = arguments.length, children = Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
            children[_key4 - 1] = arguments[_key4];
        }

        handleChildren(node, children, true);

        setTimeout(function () {
            var end = Date.now();
            console.log("impact :: render: " + (end - start) + "ms");
        });

        function appendArray(arr) {
            arr.forEach(function (child) {
                if (Array.isArray(child)) {
                    appendArray(child);
                } else {
                    node.appendChild(child());
                }
            });
        }
    }

    function elNoop(el, fn) {
        for (var _len5 = arguments.length, args = Array(_len5 > 2 ? _len5 - 2 : 0), _key5 = 2; _key5 < _len5; _key5++) {
            args[_key5 - 2] = arguments[_key5];
        }

        setTimeout(function () {
            fn.call.apply(fn, [el].concat(args));
            applyRoot();
        });
    }

    function applyRoot() {
        var start = Date.now();
        applyElement(namespace.root);
        var end = Date.now();
        eventEmit("apply");
        console.log("impact :: cycle: " + (end - start) + "ms");
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

        childNodes.filter(function (node) {
            return typeof node.$apply === "function";
        }).forEach(applyElement);
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

    function eventEmit(event) {
        for (var _len6 = arguments.length, data = Array(_len6 > 1 ? _len6 - 1 : 0), _key6 = 1; _key6 < _len6; _key6++) {
            data[_key6 - 1] = arguments[_key6];
        }

        events[event] = events[event] || [];
        events[event].forEach(function (fn) {
            return fn.apply(undefined, data);
        });
    }

    //http://stackoverflow.com/questions/10073699/pad-a-number-with-leading-zeros-in-javascript    
    function padDigits(number, digits) {
        return Array(Math.max(digits - String(number).length + 1, 0)).join(0) + number;
    }

    function getHash(obj) {
        if ((typeof obj === "undefined" ? "undefined" : _typeof(obj)) === "object" && obj !== null) {
            obj.$$hash = obj.$$hash || padDigits(++hashBase, 5);
            return obj.$$hash;
        } else {
            return "" + obj;
        }
    }

    function repeat(arr, fn, trackBy) {
        if (typeof arr === "function") {
            var _ret2 = function () {
                var shadow = shadowArray(fn);
                return {
                    v: function v() {
                        return shadow(arr());
                    }
                };
            }();

            if ((typeof _ret2 === "undefined" ? "undefined" : _typeof(_ret2)) === "object") return _ret2.v;
        } else {
            return arr.map(function (item) {
                return fn(item);
            });
        }
    }

    function shadowArray(fn) {
        var shadowTree = {};

        return function (arr) {
            var hashMap = arr.map(getHash);

            Object.keys(shadowTree).forEach(function (hash) {
                if (!hashMap.includes(hash)) {
                    delete shadowTree[hash];
                }
            });

            return arr.map(function (item) {
                var hash = getHash(item);
                shadowTree[hash] = shadowTree[hash] || fn(item);
                return shadowTree[hash];
            });
        };
    }

    function impIf(fn, child) {
        return function () {
            var out = [];
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

    types.forEach(function (type) {
        namespace.global[type] = function () {
            for (var _len7 = arguments.length, args = Array(_len7), _key7 = 0; _key7 < _len7; _key7++) {
                args[_key7] = arguments[_key7];
            }

            return createElement.apply(undefined, [type].concat(args));
        };
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

    global.a = function () {
        var _impact;

        for (var _len8 = arguments.length, args = Array(_len8), _key8 = 0; _key8 < _len8; _key8++) {
            args[_key8] = arguments[_key8];
        }

        var apply = (_impact = impact).createElement.apply(_impact, ["a"].concat(args));
        var el = apply();

        el.addEventListener("click", function (event) {
            event.preventDefault();

            var prefix = namespace.router.isHtml5Mode() ? "" : "#";
            var href = el.attributes.item("href").nodeValue;
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

    global.form = function () {
        var _impact2;

        for (var _len9 = arguments.length, args = Array(_len9), _key9 = 0; _key9 < _len9; _key9++) {
            args[_key9] = arguments[_key9];
        }

        var apply = (_impact2 = impact).createElement.apply(_impact2, ["form"].concat(args));
        var el = apply();

        if (typeof el.onsubmit !== "function") {
            el.onsubmit = function (event) {
                return event.preventDefault();
            };
        }

        return apply;
    };
})(typeof module !== "undefined" ? module.exports : window.impact, typeof module !== "undefined" ? global : window);

//src/elements/input.js
(function (namespace, global) {
    "use strict";

    global.input = function (props) {
        var keyPressListener = props.onkeypress || {};
        delete props.onkeypress;

        var apply = impact.createElement("input", props);
        var el = apply();

        el.onkeypress = function (event) {
            if (keyPressListener[event.keyCode]) {
                keyPressListener[event.keyCode].call(el, event);
                impact.apply();
            }
        };

        el.$value = function (val) {
            if (typeof val !== "undefined") {
                el.value = "" + val;
            } else {
                return ("" + el.value).trim();
            }
        };

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
            var err = new Error("impact.component(name), can't find component with name '" + name + "'");
            console.error(err);
            return function () {};
        }

        if (controller) {
            namespace.components[name] = controller;
        } else {
            return namespace.components[name];
        }
    }

    function watch(item, cb, deep) {
        var last = void 0;

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
            var now = getComparatorValue(item);
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
        return function () {
            namespace.off("apply", watcher);
        };
    }

    namespace.watch = watch;
    namespace.component = component;
    namespace.components = {};
})();
//# sourceMappingURL=impact.es5.js.map
