(function () {
    function ready(fn) {
        if (document.readyState !== "loading") {
            fn();
        } else {
            document.addEventListener("DOMContentLoaded", fn);
        }
    }

    function normalize(value) {
        return String(value || "").toLowerCase().trim();
    }

    function runSearch(input) {
        var targetSelector = input.getAttribute("data-target");
        var target = targetSelector ? document.querySelector(targetSelector) : document;
        if (!target) {
            return;
        }
        var query = normalize(input.value);
        var cards = Array.prototype.slice.call(target.querySelectorAll(".searchable-card"));
        var visible = 0;
        cards.forEach(function (card) {
            var haystack = normalize([
                card.getAttribute("data-title"),
                card.getAttribute("data-tags"),
                card.getAttribute("data-year"),
                card.getAttribute("data-region")
            ].join(" "));
            var matched = !query || haystack.indexOf(query) !== -1;
            card.classList.toggle("is-hidden", !matched);
            if (matched) {
                visible += 1;
            }
        });
        var empty = document.querySelector(".empty-message");
        if (empty) {
            empty.classList.toggle("visible", visible === 0);
        }
    }

    function runSelect(select) {
        var targetSelector = select.getAttribute("data-target");
        var target = targetSelector ? document.querySelector(targetSelector) : document;
        if (!target) {
            return;
        }
        var filter = select.getAttribute("data-filter");
        var value = normalize(select.value);
        var cards = Array.prototype.slice.call(target.querySelectorAll(".searchable-card"));
        var visible = 0;
        cards.forEach(function (card) {
            var current = normalize(card.getAttribute("data-" + filter));
            var matched = !value || current === value;
            card.classList.toggle("is-hidden", !matched);
            if (matched) {
                visible += 1;
            }
        });
        var empty = document.querySelector(".empty-message");
        if (empty) {
            empty.classList.toggle("visible", visible === 0);
        }
    }

    function initHero() {
        var carousel = document.querySelector("[data-hero-carousel]");
        if (!carousel) {
            return;
        }
        var slides = Array.prototype.slice.call(carousel.querySelectorAll(".hero-slide"));
        var dots = Array.prototype.slice.call(carousel.querySelectorAll(".hero-dot"));
        if (slides.length <= 1) {
            return;
        }
        var index = 0;
        var timer = null;

        function show(next) {
            index = (next + slides.length) % slides.length;
            slides.forEach(function (slide, i) {
                slide.classList.toggle("active", i === index);
            });
            dots.forEach(function (dot, i) {
                dot.classList.toggle("active", i === index);
            });
        }

        function start() {
            stop();
            timer = window.setInterval(function () {
                show(index + 1);
            }, 5200);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
            }
        }

        dots.forEach(function (dot, i) {
            dot.addEventListener("click", function () {
                show(i);
                start();
            });
        });
        carousel.addEventListener("mouseenter", stop);
        carousel.addEventListener("mouseleave", start);
        start();
    }

    window.initMoviePlayer = function (videoId, hlsUrl, coverId) {
        var video = document.getElementById(videoId);
        var cover = document.getElementById(coverId);
        if (!video || !cover) {
            return;
        }
        var hls = null;
        var loaded = false;

        function attach() {
            if (loaded) {
                return;
            }
            loaded = true;
            if (window.Hls && window.Hls.isSupported()) {
                hls = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });
                hls.loadSource(hlsUrl);
                hls.attachMedia(video);
            } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = hlsUrl;
            } else {
                video.src = hlsUrl;
            }
            video.load();
        }

        function playVideo() {
            attach();
            cover.classList.add("is-hidden");
            var action = video.play();
            if (action && typeof action.catch === "function") {
                action.catch(function () {
                    cover.classList.remove("is-hidden");
                });
            }
        }

        cover.addEventListener("click", playVideo);
        video.addEventListener("click", function () {
            if (video.paused) {
                playVideo();
            }
        });
        video.addEventListener("play", function () {
            cover.classList.add("is-hidden");
        });
        window.addEventListener("beforeunload", function () {
            if (hls) {
                hls.destroy();
            }
        });
    };

    ready(function () {
        initHero();
        Array.prototype.slice.call(document.querySelectorAll(".site-search")).forEach(function (input) {
            var params = new URLSearchParams(window.location.search);
            var q = params.get("q");
            if (q && !input.value) {
                input.value = q;
                runSearch(input);
            }
            input.addEventListener("input", function () {
                runSearch(input);
            });
        });
        Array.prototype.slice.call(document.querySelectorAll(".site-select")).forEach(function (select) {
            select.addEventListener("change", function () {
                runSelect(select);
            });
        });
    });
})();
