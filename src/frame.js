let namespace = {};
namespace.global = {};

if (typeof module !== "undefined") {
    module.exports = namespace;
} else {
    window.impact = namespace;
    namespace.global = window;
}