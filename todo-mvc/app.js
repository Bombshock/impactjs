
(function () {
    "use strict";

    impact.render(impact.root,
        impact.component("app")(),
        footer({ id: "info" },
            a({
                href: "https://github.com/tastejs/todomvc",
                target: "_blank"
            }, "todo mvc project")
        )
    );

})();