(function () {
  function ready(callback) {
    if (document.readyState !== 'loading') {
      callback();
      return;
    }
    document.addEventListener('DOMContentLoaded', callback);
  }

  function initMenu() {
    var button = document.querySelector('.menu-toggle');
    var panel = document.querySelector('.mobile-panel');
    if (!button || !panel) {
      return;
    }
    button.addEventListener('click', function () {
      var open = panel.classList.toggle('is-open');
      button.setAttribute('aria-expanded', open ? 'true' : 'false');
      button.textContent = open ? '×' : '☰';
    });
  }

  function initHero() {
    var hero = document.querySelector('.hero');
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('.hero-dot'));
    if (slides.length <= 1) {
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
    }, 5200);
  }

  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  function initFilter() {
    var grid = document.querySelector('.filter-grid');
    if (!grid) {
      return;
    }
    var input = document.querySelector('.filter-input');
    var category = document.querySelector('.category-filter');
    var sort = document.querySelector('.sort-select');
    var cards = Array.prototype.slice.call(grid.querySelectorAll('.movie-card'));
    function apply() {
      var keyword = normalize(input ? input.value : '');
      var categoryValue = category ? category.value : '';
      cards.forEach(function (card) {
        var haystack = normalize([
          card.getAttribute('data-title'),
          card.getAttribute('data-year'),
          card.getAttribute('data-type'),
          card.getAttribute('data-genre')
        ].join(' '));
        var categoryMatch = !categoryValue || card.getAttribute('data-category') === categoryValue;
        var keywordMatch = !keyword || haystack.indexOf(keyword) !== -1;
        card.style.display = categoryMatch && keywordMatch ? '' : 'none';
      });
    }
    function order() {
      var mode = sort ? sort.value : 'rating';
      var sorted = cards.slice().sort(function (a, b) {
        if (mode === 'year') {
          return Number(b.getAttribute('data-year')) - Number(a.getAttribute('data-year'));
        }
        if (mode === 'title') {
          return String(a.getAttribute('data-title')).localeCompare(String(b.getAttribute('data-title')), 'zh-Hans-CN');
        }
        return Number(b.getAttribute('data-rating')) - Number(a.getAttribute('data-rating'));
      });
      sorted.forEach(function (card) {
        grid.appendChild(card);
      });
    }
    if (input) {
      input.addEventListener('input', apply);
    }
    if (category) {
      category.addEventListener('change', apply);
    }
    if (sort) {
      sort.addEventListener('change', function () {
        order();
        apply();
      });
      order();
    }
    apply();
  }

  function cardMarkup(movie) {
    var title = escapeHtml(movie.title);
    var text = escapeHtml(movie.text);
    var category = escapeHtml(movie.categoryName);
    var year = escapeHtml(movie.year);
    var type = escapeHtml(movie.type);
    var rating = escapeHtml(movie.rating);
    return [
      '<article class="movie-card">',
      '<a href="./' + movie.file + '" aria-label="观看' + title + '">',
      '<div class="poster-box">',
      '<img src="' + movie.cover + '" alt="' + title + '" loading="lazy">',
      '<span class="duration-badge">' + escapeHtml(movie.duration) + '</span>',
      '<span class="category-badge">' + category + '</span>',
      '</div>',
      '<div class="card-content">',
      '<h3>' + title + '</h3>',
      '<p>' + text + '</p>',
      '<div class="card-meta">',
      '<span>★ ' + rating + '</span>',
      '<span>' + year + '</span>',
      '<span>' + type + '</span>',
      '</div>',
      '</div>',
      '</a>',
      '</article>'
    ].join('');
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function initSearch() {
    var mount = document.querySelector('[data-search-results]');
    if (!mount || !window.movieIndex) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var input = document.querySelector('[data-search-input]');
    var initial = params.get('q') || '';
    if (input) {
      input.value = initial;
    }
    function render(query) {
      var keyword = normalize(query);
      var pool = window.movieIndex.filter(function (movie) {
        if (!keyword) {
          return true;
        }
        return normalize([movie.title, movie.text, movie.categoryName, movie.genre, movie.year, movie.type].join(' ')).indexOf(keyword) !== -1;
      }).slice(0, 120);
      if (!pool.length) {
        mount.innerHTML = '<div class="empty-message">没有找到相关影片</div>';
        return;
      }
      mount.innerHTML = pool.map(cardMarkup).join('');
    }
    if (input) {
      input.addEventListener('input', function () {
        render(input.value);
      });
    }
    render(initial);
  }

  function initPlayer() {
    var video = document.querySelector('#movie-player');
    if (!video) {
      return;
    }
    var overlay = document.querySelector('.play-overlay');
    var stream = video.getAttribute('data-stream');
    var loaded = false;
    var hlsInstance = null;
    function attach() {
      if (loaded || !stream) {
        return;
      }
      loaded = true;
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = stream;
        return;
      }
      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hlsInstance.loadSource(stream);
        hlsInstance.attachMedia(video);
        return;
      }
      video.src = stream;
    }
    function start() {
      attach();
      if (overlay) {
        overlay.classList.add('is-hidden');
      }
      var play = video.play();
      if (play && typeof play.catch === 'function') {
        play.catch(function () {});
      }
    }
    if (overlay) {
      overlay.addEventListener('click', start);
    }
    video.addEventListener('click', function () {
      if (video.paused) {
        start();
      }
    });
    video.addEventListener('play', function () {
      if (overlay) {
        overlay.classList.add('is-hidden');
      }
    });
    window.addEventListener('pagehide', function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  }

  ready(function () {
    initMenu();
    initHero();
    initFilter();
    initSearch();
    initPlayer();
  });
})();
