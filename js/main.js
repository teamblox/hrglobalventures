(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------------------
   * Sticky header shadow
   * ------------------------------------------------------------------- */
  var header = document.getElementById("site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------------------------------------------------------------------
   * Mobile nav toggle
   * ------------------------------------------------------------------- */
  var navToggle = document.getElementById("nav-toggle");
  var primaryNav = document.getElementById("primary-nav");
  if (navToggle && primaryNav) {
    navToggle.addEventListener("click", function () {
      var isOpen = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!isOpen));
      primaryNav.classList.toggle("is-open", !isOpen);
      document.body.style.overflow = !isOpen ? "hidden" : "";
    });

    // Close mobile nav when a link is clicked
    primaryNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        if (window.innerWidth < 960) {
          navToggle.setAttribute("aria-expanded", "false");
          primaryNav.classList.remove("is-open");
          document.body.style.overflow = "";
        }
      });
    });
  }

  /* ---------------------------------------------------------------------
   * Services dropdown — click/keyboard for touch + mobile, hover on desktop
   * (hover handled in CSS). This adds click support and Escape-to-close.
   * ------------------------------------------------------------------- */
  var dropdownToggle = document.querySelector(".dropdown-toggle");
  var dropdownParent = dropdownToggle ? dropdownToggle.closest(".has-dropdown") : null;
  if (dropdownToggle && dropdownParent) {
    dropdownToggle.addEventListener("click", function () {
      var isOpen = dropdownParent.classList.toggle("is-open");
      dropdownToggle.setAttribute("aria-expanded", String(isOpen));
    });
    document.addEventListener("click", function (e) {
      if (!dropdownParent.contains(e.target)) {
        dropdownParent.classList.remove("is-open");
        dropdownToggle.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        dropdownParent.classList.remove("is-open");
        dropdownToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------------------------------------------------------------------
   * Active nav link (aria-current), driven by body[data-nav-key]
   * ------------------------------------------------------------------- */
  var navKey = document.body.getAttribute("data-nav-key");
  if (navKey) {
    document.querySelectorAll('[data-nav="' + navKey + '"]').forEach(function (el) {
      el.setAttribute("aria-current", "page");
    });
  }

  /* ---------------------------------------------------------------------
   * Dynamic copyright year
   * ------------------------------------------------------------------- */
  var yearEl = document.getElementById("copyright-year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------------------------------------------------------------------
   * Stat counters — animate once when scrolled into view
   * ------------------------------------------------------------------- */
  var statNumbers = document.querySelectorAll(".stat__number[data-count-to]");
  if (statNumbers.length) {
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      statNumbers.forEach(function (el) {
        el.textContent = el.getAttribute("data-prefix") + el.getAttribute("data-count-to") + el.getAttribute("data-suffix");
      });
    } else {
      var animateCount = function (el) {
        var target = parseInt(el.getAttribute("data-count-to"), 10) || 0;
        var prefix = el.getAttribute("data-prefix") || "";
        var suffix = el.getAttribute("data-suffix") || "";
        var duration = 1200;
        var start = null;

        function step(ts) {
          if (start === null) start = ts;
          var progress = Math.min((ts - start) / duration, 1);
          var eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = prefix + Math.round(eased * target).toLocaleString("en-US") + suffix;
          if (progress < 1) window.requestAnimationFrame(step);
        }
        window.requestAnimationFrame(step);
      };

      var statObserver = new IntersectionObserver(
        function (entries, observer) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              animateCount(entry.target);
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.4 }
      );
      statNumbers.forEach(function (el) { statObserver.observe(el); });
    }
  }

  /* ---------------------------------------------------------------------
   * Restrained scroll reveal — one subtle fade/slide per section, respects
   * reduced-motion. Applied only to elements explicitly marked .reveal.
   * ------------------------------------------------------------------- */
  var revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length && !prefersReducedMotion && "IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }
})();
