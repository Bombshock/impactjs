
(function () {
    "use strict";

    let items = [];
    let editedTodo;
    let status = "";
    let completeCount = 0;

    for (let i = 0; i < 10; i++) {
        items.push({ label: `${i}` });
    }

    impact.watch(() => items, sortItems, true);

    function sortItems() {
        console.log('sortItems');
        items = items.sort((a, b) => {
            if (a.label < b.label) {
                return -1;
            } else if (a.label > b.label) {
                return 1;
            } else if (a.$$hash && b.$$hash) {
                return a.$$hash - b.$$hash;
            } else {
                return 0;
            }
        });

        completeCount = items.filter((item) => item.completed).length;
    }

    impact.component("app", () => {
        return section(
            {
                id: "todoapp",
                animation: { add: true }
            },
            header({ id: "header" },
                h1("todos"),
                TodoInput()
            ),
            impact.if(() => items.length,
                section({ id: "main" },
                    input({
                        id: "toggle-all",
                        type: "checkbox",
                        onchange: toggleAll,
                        checked: () => completeCount == items.length
                    }),
                    label({ for: "toggle-all" },
                        "Mark all as complete"),
                    ul({ id: "todo-list" },
                        impact.repeat(() => items, TodoItem)
                    )
                )
            ),
            TodoFooter()
        );
    });

    function TodoFooter() {
        return impact.if(() => items.length,
            footer({ id: "footer" },
                span({ id: "todo-count" },
                    strong(impact.text(() => items.length)),
                    impact.text(() => items.length > 1 ? ' items left' : ' item left')
                ),
                ul({ id: "filters" },
                    li(
                        a({ href: "#/", class: { selected: () => status === "" } }, "All")
                    ),
                    li(
                        a({ href: "#/active", class: { selected: () => status === "active" } }, "Active")
                    ),
                    li(
                        a({ href: "#/completed", class: { selected: () => status === "completed" } }, "Completed")
                    )
                ),
                impact.if(() => { console.log("completeCount", completeCount); return completeCount; },
                    button({ id: "clear-completed", onclick: clearCompleted }, "Clear completed")
                )
            )
        );
    }

    function clearCompleted() {
        items = items.filter((item) => !item.completed);
    }

    function toggleAll() {
        //jshint -W040
        const val = this.checked;
        items.forEach((item) => {
            item.completed = val;
        });
    }

    function TodoItem(todo) {

        function removeItemFromList() {
            items.splice(items.indexOf(todo), 1);
        }

        function activateTodo() {
            editedTodo = todo;
            //jshint -W040
            this.parentNode.parentNode.broadcast("focus");
        }

        function toogle() {
            //jshint -W040
            todo.completed = !!this.checked;
        }

        return li(
            {
                class: { completed: () => todo.completed, editing: () => todo == editedTodo },
                animation: { add: true, remove: true }
            },
            div({ class: "view" },
                input({ class: "toggle", type: "checkbox", onchange: toogle, checked: () => todo.completed }),
                label(
                    { ondblclick: activateTodo },
                    impact.text(() => todo.label)
                ),
                button({ class: "destroy", onclick: removeItemFromList })
            ),
            TodoItemEditForm(todo)
        );
    }

    function TodoItemEditForm(todo) {
        function finishEdit() {
            editedTodo = null;
            //jshint -W040
            todo.label = this.value;
        }

        function onFocus() {
            setTimeout(() => {
                this.focus();
            });
        }

        return form(
            input({
                class: "edit",
                onblur: finishEdit,
                onkeypress: {
                    13: finishEdit
                },
                value: () => todo.label,
                event: {
                    focus: onFocus
                }
            })
        );
    }

    function TodoInput() {
        return div(
            {
                id: "todo-form"
            },
            input({
                id: "new-todo",
                placeholder: "What needs to be done?",
                autofocus: true,
                onkeypress: {
                    13: function () {
                        var val = this.$value();
                        if (val) {
                            items.push({ label: val });
                            this.$value("");
                        }
                    }
                }
            })
        );
    }

})();