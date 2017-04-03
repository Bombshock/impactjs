let namespace = {};

if (typeof module !== "undefined") {
    module.exports = namespace;
    namespace.global = global;
} else {
    window.impact = namespace;
    namespace.global = window;
}