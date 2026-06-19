(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  function escapeHTML(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getQuery() {
    return new URLSearchParams(window.location.search).get('q') || '';
  }

  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  function movieCard(movie) {
    var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
      return '<span class="tag">' + escapeHTML(tag) + '</span>';
    }).join('');

    return '' +
      '<article class="movie-card">' +
        '<a class="poster-link" href="' + escapeHTML(movie.url) + '" aria-label="观看' + escapeHTML(movie.title) + '">' +
          '<img src="' + escapeHTML(movie.cover) + '" alt="' + escapeHTML(movie.title) + '封面" loading="lazy">' +
          '<span class="poster-overlay"><span class="play-mark">▶</span><span>立即观看</span></span>' +
        '</a>' +
        '<div class="movie-card-body">' +
          '<div class="movie-card-meta">' +
            '<span>' + escapeHTML(movie.year) + '</span>' +
            '<span>' + escapeHTML(movie.region) + '</span>' +
            '<span>★ ' + escapeHTML(movie.rating) + '</span>' +
          '</div>' +
          '<h3><a href="' + escapeHTML(movie.url) + '">' + escapeHTML(movie.title) + '</a></h3>' +
          '<p>' + escapeHTML(movie.one_line || movie.summary || '') + '</p>' +
          '<div class="movie-tags">' + tags + '</div>' +
        '</div>' +
      '</article>';
  }

  function initImages() {
    document.querySelectorAll('img').forEach(function (img) {
      img.addEventListener('error', function () {
        img.classList.add('is-missing');
        img.removeAttribute('src');
      }, { once: true });
    });
  }

  function initMobileMenu() {
    var button = document.querySelector('.js-mobile-menu-button');
    var nav = document.querySelector('.js-mobile-nav');
    if (!button || !nav) {
      return;
    }
    button.addEventListener('click', function () {
      nav.classList.toggle('is-open');
    });
  }

  function initSearchForms() {
    document.querySelectorAll('.js-site-search').forEach(function (form) {
      form.addEventListener('submit', function (event) {
        var input = form.querySelector('input[name="q"]');
        var query = input ? input.value.trim() : '';
        if (!query) {
          event.preventDefault();
          if (input) {
            input.focus();
          }
        }
      });
    });
  }

  function initHero() {
    var slider = document.querySelector('.js-hero-slider');
    if (!slider) {
      return;
    }
    var slides = Array.prototype.slice.call(slider.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(slider.querySelectorAll('.hero-dot'));
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

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.dataset.slide || 0));
      });
    });

    if (slides.length > 1) {
      window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }
  }

  function initCardFilter() {
    var input = document.querySelector('.js-card-filter');
    var cards = Array.prototype.slice.call(document.querySelectorAll('.js-filter-card'));
    var count = document.querySelector('.js-filter-count');
    if (!input || !cards.length) {
      return;
    }

    function applyFilter() {
      var query = normalize(input.value);
      var visible = 0;
      cards.forEach(function (card) {
        var haystack = normalize(card.dataset.search || card.textContent);
        var shouldShow = !query || haystack.indexOf(query) !== -1;
        card.classList.toggle('is-hidden', !shouldShow);
        if (shouldShow) {
          visible += 1;
        }
      });
      if (count) {
        count.textContent = '显示 ' + visible + ' / ' + cards.length + ' 部';
      }
    }

    input.addEventListener('input', applyFilter);
    applyFilter();
  }

  function initSearchPage() {
    var results = document.querySelector('.js-search-results');
    var status = document.querySelector('.js-search-status');
    var input = document.querySelector('.js-search-page-input');
    if (!results || !status || !input) {
      return;
    }

    var query = getQuery();
    input.value = query;

    if (!query.trim()) {
      status.textContent = '请输入关键词开始搜索。';
      return;
    }

    status.textContent = '正在搜索“' + query + '”…';

    fetch('assets/movies-index.json')
      .then(function (response) {
        return response.json();
      })
      .then(function (movies) {
        var q = normalize(query);
        var matched = movies.filter(function (movie) {
          var haystack = normalize([
            movie.title,
            movie.year,
            movie.region,
            movie.type,
            movie.genre,
            movie.site_category_name,
            (movie.tags || []).join(' '),
            movie.one_line,
            movie.summary
          ].join(' '));
          return haystack.indexOf(q) !== -1;
        }).slice(0, 120);

        status.textContent = matched.length ? '找到 ' + matched.length + ' 条相关结果。' : '没有找到相关影片，请换一个关键词。';
        results.innerHTML = matched.map(movieCard).join('');
        initImages();
      })
      .catch(function () {
        status.textContent = '搜索索引加载失败，请通过分类或全部影片页面浏览。';
      });
  }

  function initPlayer() {
    var video = document.querySelector('.js-hls-player');
    var button = document.querySelector('.js-player-start');
    if (!video || !button) {
      return;
    }

    function attachSource() {
      if (video.dataset.ready === '1') {
        return;
      }
      var src = video.dataset.src;
      if (!src) {
        return;
      }
      if (window.Hls && window.Hls.isSupported()) {
        var hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.ERROR, function (event, data) {
          if (!data || !data.fatal) {
            return;
          }
          if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad();
          } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            hls.destroy();
          }
        });
        video._hls = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
      } else {
        video.src = src;
      }
      video.dataset.ready = '1';
    }

    button.addEventListener('click', function () {
      attachSource();
      button.classList.add('is-hidden');
      var playPromise = video.play();
      if (playPromise && playPromise.catch) {
        playPromise.catch(function () {
          button.classList.remove('is-hidden');
        });
      }
    });

    video.addEventListener('play', function () {
      button.classList.add('is-hidden');
    });
  }

  ready(function () {
    initImages();
    initMobileMenu();
    initSearchForms();
    initHero();
    initCardFilter();
    initSearchPage();
    initPlayer();
  });
}());
