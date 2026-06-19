function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function initMobileMenu() {
  var button = document.querySelector("[data-menu-toggle]");
  var menu = document.querySelector("[data-mobile-menu]");
  if (!button || !menu) {
    return;
  }
  button.addEventListener("click", function () {
    menu.classList.toggle("open");
  });
}

function initHeroCarousel() {
  var slides = Array.prototype.slice.call(document.querySelectorAll("[data-hero-slide]"));
  var dots = Array.prototype.slice.call(document.querySelectorAll("[data-hero-dot]"));
  var next = document.querySelector("[data-hero-next]");
  var prev = document.querySelector("[data-hero-prev]");
  if (!slides.length) {
    return;
  }
  var current = 0;
  var timer = null;

  function show(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach(function (slide, slideIndex) {
      slide.classList.toggle("active", slideIndex === current);
    });
    dots.forEach(function (dot, dotIndex) {
      dot.classList.toggle("active", dotIndex === current);
    });
  }

  function play() {
    clearInterval(timer);
    timer = setInterval(function () {
      show(current + 1);
    }, 5200);
  }

  dots.forEach(function (dot) {
    dot.addEventListener("click", function () {
      show(Number(dot.getAttribute("data-hero-dot")) || 0);
      play();
    });
  });

  if (next) {
    next.addEventListener("click", function () {
      show(current + 1);
      play();
    });
  }

  if (prev) {
    prev.addEventListener("click", function () {
      show(current - 1);
      play();
    });
  }

  show(0);
  play();
}

function renderSearchResults(panel, query) {
  var list = window.movieSearchIndex || [];
  var value = String(query || "").trim().toLowerCase();
  if (!panel) {
    return;
  }
  if (!value) {
    panel.classList.remove("open");
    panel.innerHTML = "";
    return;
  }
  var results = list.filter(function (item) {
    var text = [item.title, item.category, item.genre, item.region, item.year, item.tags].join(" ").toLowerCase();
    return text.indexOf(value) !== -1;
  }).slice(0, 12);
  if (!results.length) {
    panel.innerHTML = '<div class="search-result-item"><div></div><div><strong>暂无匹配内容</strong><span>换个关键词再试试</span></div></div>';
    panel.classList.add("open");
    return;
  }
  panel.innerHTML = results.map(function (item) {
    return '<a class="search-result-item" href="' + escapeHtml(item.url) + '">' +
      '<img src="' + escapeHtml(item.image) + '" alt="' + escapeHtml(item.title) + '">' +
      '<div><strong>' + escapeHtml(item.title) + '</strong><span>' +
      escapeHtml([item.year, item.region, item.category].filter(Boolean).join(" · ")) +
      '</span></div></a>';
  }).join("");
  panel.classList.add("open");
}

function initGlobalSearch() {
  var forms = Array.prototype.slice.call(document.querySelectorAll("[data-global-search]"));
  forms.forEach(function (form) {
    var input = form.querySelector("input[type='search']");
    var panel = form.querySelector("[data-search-results]");
    if (!input || !panel) {
      return;
    }
    input.addEventListener("input", function () {
      renderSearchResults(panel, input.value);
    });
    input.addEventListener("focus", function () {
      renderSearchResults(panel, input.value);
    });
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      renderSearchResults(panel, input.value);
    });
  });
  document.addEventListener("click", function (event) {
    forms.forEach(function (form) {
      if (!form.contains(event.target)) {
        var panel = form.querySelector("[data-search-results]");
        if (panel) {
          panel.classList.remove("open");
        }
      }
    });
  });
}

function initPageFilters() {
  var filterInput = document.querySelector("[data-page-filter]");
  var sortSelect = document.querySelector("[data-page-sort]");
  var grid = document.querySelector("[data-card-grid]");
  if (!grid || (!filterInput && !sortSelect)) {
    return;
  }
  var cards = Array.prototype.slice.call(grid.querySelectorAll("[data-movie-card]"));

  function apply() {
    var query = filterInput ? filterInput.value.trim().toLowerCase() : "";
    cards.forEach(function (card) {
      var text = [
        card.getAttribute("data-title"),
        card.getAttribute("data-category"),
        card.getAttribute("data-genre"),
        card.getAttribute("data-year"),
        card.getAttribute("data-tags")
      ].join(" ").toLowerCase();
      card.style.display = text.indexOf(query) === -1 ? "none" : "";
    });
    var sortValue = sortSelect ? sortSelect.value : "default";
    if (sortValue !== "default") {
      var sorted = cards.slice().sort(function (a, b) {
        var av = Number(a.getAttribute("data-" + sortValue)) || 0;
        var bv = Number(b.getAttribute("data-" + sortValue)) || 0;
        return bv - av;
      });
      sorted.forEach(function (card) {
        grid.appendChild(card);
      });
    }
  }

  if (filterInput) {
    filterInput.addEventListener("input", apply);
  }
  if (sortSelect) {
    sortSelect.addEventListener("change", apply);
  }
}

function initializeMoviePlayer(sourceUrl) {
  var video = document.querySelector("[data-player='main']");
  var cover = document.querySelector("[data-player-cover]");
  var toggle = document.querySelector("[data-player-toggle]");
  var mute = document.querySelector("[data-player-mute]");
  var fullscreen = document.querySelector("[data-player-fullscreen]");
  var status = document.querySelector("[data-player-status]");
  var hlsInstance = null;
  var sourceAttached = false;

  if (!video || !sourceUrl) {
    return;
  }

  function showStatus(message) {
    if (!status) {
      return;
    }
    status.textContent = message;
    status.classList.add("show");
    window.setTimeout(function () {
      status.classList.remove("show");
    }, 1800);
  }

  function attachSource() {
    if (sourceAttached) {
      return;
    }
    sourceAttached = true;
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = sourceUrl;
      return;
    }
    if (window.Hls && window.Hls.isSupported()) {
      hlsInstance = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hlsInstance.loadSource(sourceUrl);
      hlsInstance.attachMedia(video);
      hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
        if (!data || !data.fatal) {
          return;
        }
        if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
          hlsInstance.startLoad();
          return;
        }
        if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
          hlsInstance.recoverMediaError();
          return;
        }
        showStatus("播放暂时不可用");
      });
      return;
    }
    video.src = sourceUrl;
  }

  function startPlayback() {
    attachSource();
    video.setAttribute("controls", "controls");
    if (cover) {
      cover.classList.add("is-hidden");
    }
    var playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(function () {
        showStatus("点击视频继续播放");
      });
    }
  }

  function togglePlayback() {
    if (video.paused) {
      startPlayback();
    } else {
      video.pause();
    }
  }

  if (cover) {
    cover.addEventListener("click", startPlayback);
  }
  if (toggle) {
    toggle.addEventListener("click", togglePlayback);
  }
  if (mute) {
    mute.addEventListener("click", function () {
      video.muted = !video.muted;
      mute.textContent = video.muted ? "静音" : "音量";
    });
  }
  if (fullscreen) {
    fullscreen.addEventListener("click", function () {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else if (video.requestFullscreen) {
        video.requestFullscreen();
      }
    });
  }
  video.addEventListener("click", function () {
    if (!sourceAttached || video.paused) {
      startPlayback();
    }
  });
  video.addEventListener("play", function () {
    if (toggle) {
      toggle.textContent = "暂停";
    }
  });
  video.addEventListener("pause", function () {
    if (toggle) {
      toggle.textContent = "▶";
    }
  });
  window.addEventListener("pagehide", function () {
    if (hlsInstance) {
      hlsInstance.destroy();
    }
  });
}

window.initializeMoviePlayer = initializeMoviePlayer;

document.addEventListener("DOMContentLoaded", function () {
  initMobileMenu();
  initHeroCarousel();
  initGlobalSearch();
  initPageFilters();
});
