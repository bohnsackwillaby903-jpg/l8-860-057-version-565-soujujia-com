(function () {
    var mobileToggle = document.querySelector('.mobile-toggle');
    var mobilePanel = document.querySelector('.mobile-panel');

    if (mobileToggle && mobilePanel) {
        mobileToggle.addEventListener('click', function () {
            mobilePanel.hidden = !mobilePanel.hidden;
        });
    }

    var hero = document.querySelector('[data-hero-slider]');

    if (hero) {
        var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero-slide'));
        var dots = Array.prototype.slice.call(hero.querySelectorAll('.hero-dot'));
        var active = 0;
        var timer = null;

        var showSlide = function (index) {
            active = (index + slides.length) % slides.length;
            slides.forEach(function (slide, i) {
                slide.classList.toggle('is-active', i === active);
            });
            dots.forEach(function (dot, i) {
                dot.classList.toggle('is-active', i === active);
            });
        };

        var start = function () {
            if (timer) {
                clearInterval(timer);
            }
            timer = setInterval(function () {
                showSlide(active + 1);
            }, 5200);
        };

        dots.forEach(function (dot, i) {
            dot.addEventListener('click', function () {
                showSlide(i);
                start();
            });
        });

        if (slides.length > 1) {
            start();
        }
    }

    var filterInputs = Array.prototype.slice.call(document.querySelectorAll('.card-filter, .global-filter'));

    var normalize = function (value) {
        return (value || '').toString().trim().toLowerCase();
    };

    var filterCards = function (input, category) {
        var grid = input.closest('section').querySelector('.filter-grid') || document.querySelector('.filter-grid');
        if (!grid) {
            return;
        }
        var query = normalize(input.value);
        var cards = Array.prototype.slice.call(grid.querySelectorAll('.movie-card'));
        cards.forEach(function (card) {
            var haystack = normalize([
                card.getAttribute('data-title'),
                card.getAttribute('data-region'),
                card.getAttribute('data-type'),
                card.getAttribute('data-year'),
                card.getAttribute('data-genre'),
                card.textContent
            ].join(' '));
            var categoryMatched = !category || card.getAttribute('data-category') === category;
            var queryMatched = !query || haystack.indexOf(query) !== -1;
            card.classList.toggle('is-filtered-out', !(categoryMatched && queryMatched));
        });
    };

    filterInputs.forEach(function (input) {
        input.addEventListener('input', function () {
            filterCards(input, document.body.getAttribute('data-active-category') || '');
        });
    });

    var urlParams = new URLSearchParams(window.location.search);
    var queryValue = urlParams.get('q');
    var globalInput = document.querySelector('.global-filter');

    if (queryValue && globalInput) {
        globalInput.value = queryValue;
        filterCards(globalInput, '');
    }

    var clearButton = document.querySelector('[data-clear-filter]');

    if (clearButton && globalInput) {
        clearButton.addEventListener('click', function () {
            globalInput.value = '';
            document.body.removeAttribute('data-active-category');
            document.querySelectorAll('[data-category]').forEach(function (button) {
                button.classList.remove('is-active');
            });
            filterCards(globalInput, '');
        });
    }

    document.querySelectorAll('.filter-pills [data-category]').forEach(function (button) {
        button.addEventListener('click', function () {
            var selected = button.getAttribute('data-category');
            var current = document.body.getAttribute('data-active-category');
            var next = current === selected ? '' : selected;
            document.body.setAttribute('data-active-category', next);
            if (!next) {
                document.body.removeAttribute('data-active-category');
            }
            document.querySelectorAll('.filter-pills [data-category]').forEach(function (item) {
                item.classList.toggle('is-active', item.getAttribute('data-category') === next);
            });
            if (globalInput) {
                filterCards(globalInput, next);
            }
        });
    });

    document.querySelectorAll('[data-sort="year"]').forEach(function (button) {
        button.addEventListener('click', function () {
            var grid = button.closest('section').querySelector('.filter-grid');
            if (!grid) {
                return;
            }
            Array.prototype.slice.call(grid.querySelectorAll('.movie-card'))
                .sort(function (a, b) {
                    return parseInt(b.getAttribute('data-year') || '0', 10) - parseInt(a.getAttribute('data-year') || '0', 10);
                })
                .forEach(function (card) {
                    grid.appendChild(card);
                });
        });
    });
})();

function initMoviePlayer(videoId, videoUrl) {
    var video = document.getElementById(videoId);

    if (!video || !videoUrl) {
        return;
    }

    var shell = video.closest('.player-shell');
    var overlay = shell ? shell.querySelector('.player-overlay') : null;
    var started = false;
    var hlsInstance = null;

    var attach = function () {
        if (started) {
            return;
        }

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = videoUrl;
        } else if (window.Hls && window.Hls.isSupported()) {
            hlsInstance = new Hls({
                enableWorker: true,
                lowLatencyMode: true
            });
            hlsInstance.loadSource(videoUrl);
            hlsInstance.attachMedia(video);
        } else {
            video.src = videoUrl;
        }

        video.controls = true;
        started = true;
    };

    var play = function () {
        attach();

        if (overlay) {
            overlay.classList.add('is-hidden');
        }

        var promise = video.play();

        if (promise && promise.catch) {
            promise.catch(function () {});
        }
    };

    if (overlay) {
        overlay.addEventListener('click', play);
    }

    video.addEventListener('click', function () {
        if (!started) {
            play();
        }
    });

    video.addEventListener('ended', function () {
        if (overlay) {
            overlay.classList.remove('is-hidden');
        }
    });

    window.addEventListener('pagehide', function () {
        if (hlsInstance) {
            hlsInstance.destroy();
        }
    });
}
