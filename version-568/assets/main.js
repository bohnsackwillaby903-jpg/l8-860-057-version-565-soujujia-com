(function () {
    function setupHero() {
        var slides = Array.prototype.slice.call(document.querySelectorAll("[data-hero-slide]"));
        var dots = Array.prototype.slice.call(document.querySelectorAll("[data-hero-dot]"));
        var prev = document.querySelector("[data-hero-prev]");
        var next = document.querySelector("[data-hero-next]");
        if (!slides.length) {
            return;
        }
        var current = 0;
        var timer = null;
        function show(index) {
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, position) {
                slide.classList.toggle("is-active", position === current);
            });
            dots.forEach(function (dot, position) {
                dot.classList.toggle("is-active", position === current);
            });
        }
        function move(step) {
            show(current + step);
        }
        function restart() {
            if (timer) {
                clearInterval(timer);
            }
            timer = setInterval(function () {
                move(1);
            }, 5200);
        }
        if (prev) {
            prev.addEventListener("click", function () {
                move(-1);
                restart();
            });
        }
        if (next) {
            next.addEventListener("click", function () {
                move(1);
                restart();
            });
        }
        dots.forEach(function (dot, index) {
            dot.addEventListener("click", function () {
                show(index);
                restart();
            });
        });
        restart();
    }

    function setupSearchForms() {
        var forms = Array.prototype.slice.call(document.querySelectorAll("[data-search-form]"));
        forms.forEach(function (form) {
            form.addEventListener("submit", function (event) {
                event.preventDefault();
                var input = form.querySelector("input[name='q']");
                var query = input ? input.value.trim() : "";
                var url = "./search.html";
                if (query) {
                    url += "?q=" + encodeURIComponent(query);
                }
                window.location.href = url;
            });
        });
    }

    function setupFilter() {
        var input = document.querySelector("[data-filter-input]");
        var cards = Array.prototype.slice.call(document.querySelectorAll("[data-search-card]"));
        var empty = document.querySelector("[data-empty-state]");
        if (!input || !cards.length) {
            return;
        }
        var params = new URLSearchParams(window.location.search);
        var startQuery = params.get("q") || "";
        input.value = startQuery;
        function cardText(card) {
            return [
                card.getAttribute("data-title") || "",
                card.getAttribute("data-tags") || "",
                card.getAttribute("data-year") || "",
                card.getAttribute("data-region") || "",
                card.getAttribute("data-genre") || ""
            ].join(" ").toLowerCase();
        }
        function applyFilter() {
            var query = input.value.trim().toLowerCase();
            var visible = 0;
            cards.forEach(function (card) {
                var matched = !query || cardText(card).indexOf(query) !== -1;
                card.hidden = !matched;
                if (matched) {
                    visible += 1;
                }
            });
            if (empty) {
                empty.hidden = visible !== 0;
            }
        }
        input.addEventListener("input", applyFilter);
        applyFilter();
    }

    document.addEventListener("DOMContentLoaded", function () {
        setupHero();
        setupSearchForms();
        setupFilter();
    });
})();
