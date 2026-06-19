(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function normalize(value) {
    return String(value || "").toLowerCase().trim();
  }

  ready(function () {
    var toggle = document.querySelector(".nav-toggle");
    var menu = document.querySelector(".mobile-menu");
    if (toggle && menu) {
      toggle.addEventListener("click", function () {
        var open = menu.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
    }

    var slides = Array.prototype.slice.call(document.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(document.querySelectorAll("[data-hero-dot]"));
    if (slides.length > 1) {
      var current = 0;
      var show = function (index) {
        current = (index + slides.length) % slides.length;
        slides.forEach(function (slide, slideIndex) {
          slide.classList.toggle("is-active", slideIndex === current);
        });
        dots.forEach(function (dot, dotIndex) {
          dot.classList.toggle("is-active", dotIndex === current);
        });
      };
      dots.forEach(function (dot, dotIndex) {
        dot.addEventListener("click", function () {
          show(dotIndex);
        });
      });
      window.setInterval(function () {
        show(current + 1);
      }, 5200);
      show(0);
    }

    var jumpSelect = document.querySelector("[data-category-jump]");
    if (jumpSelect) {
      jumpSelect.addEventListener("change", function () {
        if (jumpSelect.value) {
          window.location.href = jumpSelect.value;
        }
      });
    }

    var filterInput = document.querySelector("[data-filter-input]");
    var categorySelect = document.querySelector("[data-category-select]");
    var filterGrid = document.querySelector("[data-filter-grid]");
    var emptyState = document.querySelector("[data-empty-state]");
    var params = new URLSearchParams(window.location.search);
    var initialQuery = params.get("q") || "";
    if (filterInput && initialQuery) {
      filterInput.value = initialQuery;
    }
    var applyFilter = function () {
      if (!filterGrid) {
        return;
      }
      var query = normalize(filterInput ? filterInput.value : "");
      var category = categorySelect ? categorySelect.value : "";
      var visible = 0;
      Array.prototype.slice.call(filterGrid.querySelectorAll(".movie-card")).forEach(function (card) {
        var text = normalize(card.getAttribute("data-filter-text"));
        var cardCategory = card.getAttribute("data-category") || "";
        var matchedQuery = !query || text.indexOf(query) !== -1;
        var matchedCategory = !category || cardCategory === category;
        var matched = matchedQuery && matchedCategory;
        card.style.display = matched ? "grid" : "none";
        if (matched) {
          visible += 1;
        }
      });
      if (emptyState) {
        emptyState.classList.toggle("is-visible", visible === 0);
      }
    };
    if (filterInput) {
      filterInput.addEventListener("input", applyFilter);
    }
    if (categorySelect) {
      categorySelect.addEventListener("change", applyFilter);
    }
    applyFilter();
  });

  window.initializeMoviePlayer = function (sourceUrl) {
    var video = document.getElementById("movieVideo");
    var overlay = document.getElementById("playerOverlay");
    if (!video || !sourceUrl) {
      return;
    }
    var hlsInstance = null;
    var bound = false;
    var bindSource = function () {
      if (bound) {
        return;
      }
      bound = true;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = sourceUrl;
      } else if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          maxBufferLength: 30,
          enableWorker: true
        });
        hlsInstance.loadSource(sourceUrl);
        hlsInstance.attachMedia(video);
      } else {
        video.src = sourceUrl;
      }
    };
    var startPlayback = function () {
      bindSource();
      if (overlay) {
        overlay.classList.add("is-hidden");
      }
      video.controls = true;
      var playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(function () {});
      }
    };
    if (overlay) {
      overlay.addEventListener("click", startPlayback);
    }
    video.addEventListener("click", function () {
      if (video.paused) {
        startPlayback();
      }
    });
    video.addEventListener("play", function () {
      if (overlay) {
        overlay.classList.add("is-hidden");
      }
    });
    window.addEventListener("pagehide", function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  };
})();
