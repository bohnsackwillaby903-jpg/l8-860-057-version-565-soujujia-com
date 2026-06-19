(function () {
    window.initMoviePlayer = function (source) {
        var video = document.querySelector(".movie-player");
        var shell = document.querySelector(".player-shell");
        var button = document.querySelector(".player-start");
        var started = false;
        var hls = null;
        if (!video || !shell || !source) {
            return;
        }
        function hideButton() {
            shell.classList.add("is-playing");
            if (button) {
                button.setAttribute("hidden", "hidden");
            }
        }
        function safePlay() {
            var request = video.play();
            if (request && typeof request.catch === "function") {
                request.catch(function () {});
            }
        }
        function start() {
            hideButton();
            if (started) {
                safePlay();
                return;
            }
            started = true;
            if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = source;
                safePlay();
                return;
            }
            if (window.Hls && window.Hls.isSupported()) {
                hls = new Hls();
                hls.loadSource(source);
                hls.attachMedia(video);
                hls.on(Hls.Events.MANIFEST_PARSED, function () {
                    safePlay();
                });
                return;
            }
            video.src = source;
            safePlay();
        }
        if (button) {
            button.addEventListener("click", start);
        }
        shell.addEventListener("click", function (event) {
            if (event.target === shell || event.target === video) {
                start();
            }
        });
        video.addEventListener("play", hideButton);
        window.addEventListener("pagehide", function () {
            if (hls) {
                hls.destroy();
            }
        });
    };
})();
