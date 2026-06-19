(function () {
    function ready(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    }

    function normalize(value) {
        return String(value || '').toLowerCase().trim();
    }

    ready(function () {
        var toggle = document.querySelector('[data-mobile-toggle]');
        var nav = document.querySelector('[data-mobile-nav]');
        if (toggle && nav) {
            toggle.addEventListener('click', function () {
                nav.classList.toggle('is-open');
            });
        }

        document.querySelectorAll('[data-search-form]').forEach(function (form) {
            form.addEventListener('submit', function (event) {
                event.preventDefault();
                var input = form.querySelector('input[name="q"]');
                var keyword = input ? input.value.trim() : '';
                if (keyword) {
                    window.location.href = './index.html?q=' + encodeURIComponent(keyword) + '#movie-list';
                } else {
                    window.location.href = './index.html#movie-list';
                }
            });
        });

        document.querySelectorAll('[data-hero]').forEach(function (hero) {
            var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
            var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
            if (!slides.length) {
                return;
            }
            var current = 0;
            function show(index) {
                current = (index + slides.length) % slides.length;
                slides.forEach(function (slide, slideIndex) {
                    slide.classList.toggle('is-active', slideIndex === current);
                });
                dots.forEach(function (dot, dotIndex) {
                    dot.classList.toggle('is-active', dotIndex === current);
                });
            }
            dots.forEach(function (dot, index) {
                dot.addEventListener('click', function () {
                    show(index);
                });
            });
            window.setInterval(function () {
                show(current + 1);
            }, 5600);
        });

        document.querySelectorAll('[data-filter-area]').forEach(function (area) {
            var cards = Array.prototype.slice.call(area.querySelectorAll('[data-card]'));
            var searchInput = area.querySelector('[data-local-search]');
            var filterButtons = Array.prototype.slice.call(area.querySelectorAll('[data-filter]'));
            var typeButtons = Array.prototype.slice.call(area.querySelectorAll('[data-type-filter]'));
            var empty = area.querySelector('[data-empty-state]');
            var activeCategory = 'all';
            var activeType = 'all';

            function applyFilters() {
                var keyword = normalize(searchInput ? searchInput.value : '');
                var visible = 0;
                cards.forEach(function (card) {
                    var haystack = normalize(card.getAttribute('data-search'));
                    var category = card.getAttribute('data-category') || '';
                    var type = card.getAttribute('data-type') || '';
                    var matchText = !keyword || haystack.indexOf(keyword) !== -1;
                    var matchCategory = activeCategory === 'all' || category === activeCategory;
                    var matchType = activeType === 'all' || type === activeType;
                    var isVisible = matchText && matchCategory && matchType;
                    card.classList.toggle('is-filtered-out', !isVisible);
                    if (isVisible) {
                        visible += 1;
                    }
                });
                if (empty) {
                    empty.classList.toggle('is-visible', visible === 0);
                }
            }

            if (searchInput) {
                searchInput.addEventListener('input', applyFilters);
                var params = new URLSearchParams(window.location.search);
                var q = params.get('q');
                if (q) {
                    searchInput.value = q;
                }
            }

            filterButtons.forEach(function (button) {
                button.addEventListener('click', function () {
                    activeCategory = button.getAttribute('data-filter') || 'all';
                    filterButtons.forEach(function (item) {
                        item.classList.toggle('is-active', item === button);
                    });
                    applyFilters();
                });
            });

            typeButtons.forEach(function (button) {
                button.addEventListener('click', function () {
                    activeType = button.getAttribute('data-type-filter') || 'all';
                    typeButtons.forEach(function (item) {
                        item.classList.toggle('is-active', item === button);
                    });
                    applyFilters();
                });
            });

            applyFilters();
        });

        document.querySelectorAll('[data-player]').forEach(function (player) {
            var video = player.querySelector('video[data-play-url]');
            var button = player.querySelector('[data-play-button]');
            var hlsInstance = null;

            function attachAndPlay() {
                if (!video) {
                    return;
                }
                var url = video.getAttribute('data-play-url');
                if (!url) {
                    return;
                }
                if (!video.getAttribute('src')) {
                    if (video.canPlayType('application/vnd.apple.mpegurl')) {
                        video.setAttribute('src', url);
                    } else if (window.Hls && window.Hls.isSupported()) {
                        hlsInstance = hlsInstance || new window.Hls({ enableWorker: true });
                        hlsInstance.loadSource(url);
                        hlsInstance.attachMedia(video);
                    } else {
                        video.setAttribute('src', url);
                    }
                }
                if (button) {
                    button.classList.add('is-hidden');
                }
                video.controls = true;
                var playPromise = video.play();
                if (playPromise && typeof playPromise.catch === 'function') {
                    playPromise.catch(function () {});
                }
            }

            if (button) {
                button.addEventListener('click', attachAndPlay);
            }
            if (video) {
                video.addEventListener('click', function () {
                    if (video.paused) {
                        attachAndPlay();
                    }
                });
            }
        });
    });
}());
