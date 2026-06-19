(function () {
  "use strict";

  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function escapeHTML(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function initializeMobileMenu() {
    var button = document.querySelector(".mobile-menu-button");
    var menu = document.querySelector(".mobile-menu");

    if (!button || !menu) {
      return;
    }

    button.addEventListener("click", function () {
      var isOpen = menu.classList.toggle("open");
      button.setAttribute("aria-expanded", isOpen ? "true" : "false");
      button.textContent = isOpen ? "×" : "☰";
    });
  }

  function initializeCardFilters() {
    var scopes = document.querySelectorAll(".card-filter-scope");

    scopes.forEach(function (scope) {
      var root = scope.parentElement || document;
      var input = root.querySelector(".card-filter-input");
      var select = root.querySelector(".year-filter-select");
      var count = root.querySelector(".filter-count");
      var cards = Array.prototype.slice.call(scope.querySelectorAll(".movie-card-item"));

      function applyFilter() {
        var keyword = input ? input.value.trim().toLowerCase() : "";
        var year = select ? select.value : "";
        var visible = 0;

        cards.forEach(function (card) {
          var text = card.getAttribute("data-search") || "";
          var cardYear = card.getAttribute("data-year") || "";
          var matchedKeyword = !keyword || text.indexOf(keyword) !== -1;
          var matchedYear = !year || cardYear === year;
          var matched = matchedKeyword && matchedYear;

          card.classList.toggle("is-hidden", !matched);
          if (matched) {
            visible += 1;
          }
        });

        if (count) {
          count.textContent = "当前显示 " + visible + " / " + cards.length + " 部影片。";
        }
      }

      if (input) {
        input.addEventListener("input", applyFilter);
      }

      if (select) {
        select.addEventListener("change", applyFilter);
      }

      applyFilter();
    });
  }

  function initializeSearchPage() {
    var resultBox = document.getElementById("search-results");
    var input = document.getElementById("search-page-input");
    var summary = document.getElementById("search-summary");
    var defaultSection = document.getElementById("search-default-section");

    if (!resultBox || !input || !window.MOVIE_INDEX) {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var query = (params.get("q") || "").trim();
    input.value = query;

    if (!query) {
      resultBox.innerHTML = "";
      return;
    }

    var keywords = query.toLowerCase().split(/\s+/).filter(Boolean);
    var results = window.MOVIE_INDEX.filter(function (movie) {
      var haystack = [
        movie.title,
        movie.year,
        movie.region,
        movie.type,
        movie.genre,
        movie.category,
        movie.oneLine,
        (movie.tags || []).join(" ")
      ].join(" ").toLowerCase();

      return keywords.every(function (keyword) {
        return haystack.indexOf(keyword) !== -1;
      });
    });

    if (summary) {
      summary.textContent = "“" + query + "” 找到 " + results.length + " 部相关影片。";
    }

    if (defaultSection) {
      defaultSection.style.display = "none";
    }

    if (!results.length) {
      resultBox.innerHTML = '<div class="search-empty">没有找到匹配影片，请尝试更换关键词。</div>';
      return;
    }

    resultBox.innerHTML = results.map(function (movie) {
      return [
        '<a href="' + escapeHTML(movie.url) + '" class="group movie-card-item">',
        '  <div class="relative aspect-[3/4] overflow-hidden rounded-lg mb-3">',
        '    <img src="' + escapeHTML(movie.cover) + '" alt="' + escapeHTML(movie.title) + '" loading="lazy" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">',
        '    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>',
        '    <div class="absolute bottom-0 left-0 right-0 p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">',
        '      <p class="text-white text-sm line-clamp-2">' + escapeHTML(movie.oneLine) + '</p>',
        '    </div>',
        '    <div class="absolute top-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded">' + escapeHTML(movie.year) + '</div>',
        '  </div>',
        '  <h3 class="text-white font-medium line-clamp-2 mb-1 group-hover:text-amber-400 transition-colors">' + escapeHTML(movie.title) + '</h3>',
        '  <p class="text-slate-400 text-sm">' + escapeHTML(movie.category) + '</p>',
        '</a>'
      ].join("");
    }).join("");
  }

  function initializePlayers() {
    var players = document.querySelectorAll("[data-hls-player]");

    players.forEach(function (player) {
      var video = player.querySelector("video[data-hls-src]");
      var button = player.querySelector("[data-play-button]");

      if (!video) {
        return;
      }

      var hlsInstance = null;
      var source = video.getAttribute("data-hls-src");

      function attachSource() {
        if (!source || video.getAttribute("data-player-ready") === "true") {
          return;
        }

        if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });

          hlsInstance.loadSource(source);
          hlsInstance.attachMedia(video);
          hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
            if (!data || !data.fatal) {
              return;
            }

            if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
              hlsInstance.startLoad();
            } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
              hlsInstance.recoverMediaError();
            } else {
              hlsInstance.destroy();
            }
          });
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = source;
        } else {
          video.insertAdjacentHTML("afterend", '<p class="text-slate-400 text-sm p-4">当前浏览器不支持 HLS 播放，请使用新版 Chrome、Edge、Firefox 或 Safari。</p>');
        }

        video.setAttribute("data-player-ready", "true");
      }

      function playVideo() {
        attachSource();
        if (button) {
          button.classList.add("is-hidden");
        }
        video.play().catch(function () {
          video.controls = true;
        });
      }

      if (button) {
        button.addEventListener("click", playVideo);
      }

      video.addEventListener("play", function () {
        if (button) {
          button.classList.add("is-hidden");
        }
      });

      video.addEventListener("click", function () {
        attachSource();
      });

      window.addEventListener("beforeunload", function () {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
      });
    });
  }

  function initializeShareButtons() {
    document.querySelectorAll(".share-button").forEach(function (button) {
      button.addEventListener("click", function () {
        var title = button.getAttribute("data-share-title") || document.title;
        var text = button.getAttribute("data-share-text") || "";
        var url = window.location.href;

        if (navigator.share) {
          navigator.share({ title: title, text: text, url: url }).catch(function () {});
        } else if (navigator.clipboard) {
          navigator.clipboard.writeText(url).then(function () {
            button.textContent = "已复制";
            setTimeout(function () {
              button.textContent = "分享";
            }, 1400);
          });
        }
      });
    });
  }

  ready(function () {
    initializeMobileMenu();
    initializeCardFilters();
    initializeSearchPage();
    initializePlayers();
    initializeShareButtons();
  });
})();
