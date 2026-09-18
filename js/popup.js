(function () {
  "use strict";

  var config = (window.SITE_CONFIG && window.SITE_CONFIG.popup) || {
    trigger: "manual",
    delaySeconds: 30,
    scrollPercent: 50,
    suppressDays: 7,
    formEndpoint: "",
    mailtoFallback: "",
  };

  var overlay = document.getElementById("popup-overlay");
  var popup = document.getElementById("popup");
  var closeBtn = document.getElementById("popup-close");
  var successCloseBtn = document.getElementById("popup-success-close");
  var form = document.getElementById("popup-form");
  var errorEl = document.getElementById("popup-error");
  var formView = document.getElementById("popup-form-view");
  var successView = document.getElementById("popup-success-view");

  if (!overlay || !popup || !form) return;

  var STORAGE_KEY = "hrgv_popup_suppressed_until";
  var lastFocusedElement = null;

  function isSuppressed() {
    try {
      var until = window.localStorage.getItem(STORAGE_KEY);
      return !!until && Date.now() < parseInt(until, 10);
    } catch (e) {
      return false; // localStorage unavailable (e.g. private mode) — fail open
    }
  }

  function suppressForConfiguredDays() {
    try {
      var days = Number(config.suppressDays) || 7;
      var until = Date.now() + days * 24 * 60 * 60 * 1000;
      window.localStorage.setItem(STORAGE_KEY, String(until));
    } catch (e) {
      /* no-op */
    }
  }

  function getFocusable() {
    return Array.prototype.slice.call(
      popup.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')
    ).filter(function (el) { return el.offsetParent !== null; });
  }

  function trapFocus(e) {
    if (e.key !== "Tab") return;
    var focusable = getFocusable();
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function onKeydown(e) {
    if (e.key === "Escape") closePopup(true);
    trapFocus(e);
  }

  function openPopup() {
    if (!overlay.hidden) return;
    lastFocusedElement = document.activeElement;
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeydown);
    var focusable = getFocusable();
    if (focusable.length) focusable[0].focus();
  }

  function closePopup(remember) {
    if (overlay.hidden) return;
    overlay.hidden = true;
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onKeydown);
    if (remember) suppressForConfiguredDays();
    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
      lastFocusedElement.focus();
    }
  }

  window.openContactPopup = openPopup; // exposed for manual triggers (e.g. a "Talk to us" button)

  closeBtn.addEventListener("click", function () { closePopup(true); });
  successCloseBtn.addEventListener("click", function () { closePopup(true); });
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) closePopup(true);
  });

  /* -----------------------------------------------------------------------
   * Trigger scheduling
   * ------------------------------------------------------------------- */
  function scheduleTrigger() {
    if (isSuppressed()) return;

    switch (config.trigger) {
      case "delay": {
        var ms = (Number(config.delaySeconds) || 30) * 1000;
        window.setTimeout(function () {
          if (!isSuppressed()) openPopup();
        }, ms);
        break;
      }
      case "scroll": {
        var triggered = false;
        var onScroll = function () {
          if (triggered) return;
          var scrolled = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
          if (scrolled >= (Number(config.scrollPercent) || 50)) {
            triggered = true;
            window.removeEventListener("scroll", onScroll);
            if (!isSuppressed()) openPopup();
          }
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        break;
      }
      case "exitIntent": {
        var exitTriggered = false;
        document.addEventListener("mouseout", function (e) {
          if (exitTriggered || e.clientY > 0 || e.relatedTarget) return;
          exitTriggered = true;
          if (!isSuppressed()) openPopup();
        });
        break;
      }
      case "manual":
      default:
        // No auto-trigger; call window.openContactPopup() from a page control.
        break;
    }
  }
  scheduleTrigger();

  /* -----------------------------------------------------------------------
   * Submission
   * ------------------------------------------------------------------- */
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    errorEl.hidden = true;

    var name = form.elements["name"].value.trim();
    var email = form.elements["email"].value.trim();
    var enquiryType = form.elements["enquiryType"].value;
    var consent = form.elements["consent"].checked;

    if (!name || !email || !enquiryType || !consent) {
      errorEl.hidden = false;
      return;
    }

    var submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    var endpoint = config.formEndpoint;
    var showSuccess = function () {
      formView.hidden = true;
      successView.hidden = false;
      suppressForConfiguredDays();
      submitBtn.disabled = false;
    };

    if (!endpoint || endpoint.indexOf("REPLACE_WITH_YOUR_FORM_ID") !== -1) {
      // Placeholder endpoint not yet configured — fall back to mailto so the
      // enquiry is never silently lost. See README for wiring a real form.
      window.location.href =
        "mailto:" + config.mailtoFallback + "?subject=" + encodeURIComponent("Website enquiry: " + enquiryType) +
        "&body=" + encodeURIComponent("Name: " + name + "\nEmail: " + email + "\n\n" + form.elements["message"].value);
      showSuccess();
      return;
    }

    fetch(endpoint, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: new FormData(form),
    })
      .then(function (res) {
        if (res.ok) {
          showSuccess();
        } else {
          throw new Error("Form endpoint returned an error");
        }
      })
      .catch(function () {
        errorEl.textContent = "Something went wrong sending that. Please email us directly at " + config.mailtoFallback + ".";
        errorEl.hidden = false;
        submitBtn.disabled = false;
      });
  });
})();
