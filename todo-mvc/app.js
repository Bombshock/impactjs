(function () {
    "use strict";

    impact.render(document.body,
        impact.component("app")(),
        footer({
                id: "info"
            },
            a({
                href: "https://github.com/tastejs/todomvc",
                target: "_blank"
            }, "todo mvc project")
        )
    );

})();