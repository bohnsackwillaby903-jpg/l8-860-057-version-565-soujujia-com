(function () {
    var menuButton = document.querySelector('.menu-toggle');
    var mobilePanel = document.querySelector('.mobile-panel');

    if (menuButton && mobilePanel) {
        menuButton.addEventListener('click', function () {
            var isOpen = mobilePanel.classList.toggle('is-open');
            menuButton.setAttribute('aria-expanded', String(isOpen));
        });
    }

    var params = new URLSearchParams(window.location.search);
    var query = params.get('q') || '';
    var searchInputs = document.querySelectorAll('.site-search-input');

    searchInputs.forEach(function (input) {
        input.value = query;
    });

    var hero = document.querySelector('[data-hero]');

    if (hero) {
        var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
        var active = 0;

        function showSlide(index) {
            active = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('is-active', slideIndex === active);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('is-active', dotIndex === active);
            });
        }

        dots.forEach(function (dot, index) {
            dot.addEventListener('click', function () {
                showSlide(index);
            });
        });

        if (slides.length > 1) {
            window.setInterval(function () {
                showSlide(active + 1);
            }, 6500);
        }
    }

    document.querySelectorAll('.filter-scope').forEach(function (scope) {
        var archiveSearch = scope.querySelector('.archive-search');
        var typeSelect = scope.querySelector('.filter-type');
        var yearSelect = scope.querySelector('.filter-year');
        var regionInput = scope.querySelector('.filter-region');
        var cards = Array.prototype.slice.call(scope.querySelectorAll('[data-movie-card]'));

        if (archiveSearch && query) {
            archiveSearch.value = query;
        }

        function normalize(value) {
            return String(value || '').trim().toLowerCase();
        }

        function applyFilters() {
            var keyword = normalize(archiveSearch ? archiveSearch.value : '');
            var type = normalize(typeSelect ? typeSelect.value : '');
            var year = normalize(yearSelect ? yearSelect.value : '');
            var region = normalize(regionInput ? regionInput.value : '');

            cards.forEach(function (card) {
                var searchable = normalize(card.getAttribute('data-search'));
                var cardType = normalize(card.getAttribute('data-type'));
                var cardYear = normalize(card.getAttribute('data-year'));
                var cardRegion = normalize(card.getAttribute('data-region'));
                var matched = true;

                if (keyword && searchable.indexOf(keyword) === -1) {
                    matched = false;
                }

                if (type && cardType.indexOf(type) === -1) {
                    matched = false;
                }

                if (year && cardYear !== year) {
                    matched = false;
                }

                if (region && cardRegion.indexOf(region) === -1) {
                    matched = false;
                }

                card.classList.toggle('is-hidden', !matched);
            });
        }

        [archiveSearch, typeSelect, yearSelect, regionInput].forEach(function (control) {
            if (control) {
                control.addEventListener('input', applyFilters);
                control.addEventListener('change', applyFilters);
            }
        });

        if (query) {
            applyFilters();
            if (window.location.hash === '') {
                var top = scope.getBoundingClientRect().top + window.pageYOffset - 90;
                window.setTimeout(function () {
                    window.scrollTo({ top: top, behavior: 'smooth' });
                }, 150);
            }
        }
    });
})();

function initVideoPlayer(playerId, sourceUrl) {
    var player = document.getElementById(playerId);

    if (!player) {
        return;
    }

    var video = player.querySelector('video');
    var overlay = player.querySelector('.player-overlay');
    var loaded = false;
    var hlsInstance = null;

    function loadSource() {
        if (loaded || !video) {
            return;
        }

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = sourceUrl;
        } else if (window.Hls && window.Hls.isSupported()) {
            hlsInstance = new Hls({ enableWorker: true });
            hlsInstance.loadSource(sourceUrl);
            hlsInstance.attachMedia(video);
        } else {
            video.src = sourceUrl;
        }

        loaded = true;
    }

    function startPlayback() {
        loadSource();
        video.controls = true;

        if (overlay) {
            overlay.classList.add('hidden');
        }

        var result = video.play();

        if (result && typeof result.catch === 'function') {
            result.catch(function () {
                if (overlay) {
                    overlay.classList.remove('hidden');
                }
            });
        }
    }

    if (overlay) {
        overlay.addEventListener('click', startPlayback);
    }

    video.addEventListener('click', function () {
        if (!loaded || video.paused) {
            startPlayback();
        } else {
            video.pause();
        }
    });

    window.addEventListener('beforeunload', function () {
        if (hlsInstance) {
            hlsInstance.destroy();
        }
    });
}
