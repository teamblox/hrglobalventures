(function () {
  "use strict";

  var STORAGE_KEY = "hrgv_cookie_consent"; // "accepted" | "declined"
  var banner = document.getElementById("cookie-consent");
  var acceptBtn = document.getElementById("cookie-accept");
  var declineBtn = document.getElementById("cookie-decline");

  function getConsent() {
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function setConsent(value) {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch (e) {
      /* no-op */
    }
  }

  function loadGA4() {
    var id = window.SITE_CONFIG && window.SITE_CONFIG.ga4MeasurementId;
    if (!id || document.getElementById("ga4-script")) return;

    var script = document.createElement("script");
    script.id = "ga4-script";
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + id;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag("js", new Date());
    gtag("config", id, { anonymize_ip: true });
  }

  var consent = getConsent();

  if (consent === "accepted") {
    loadGA4();
  } else if (consent !== "declined" && banner) {
    banner.hidden = false;
    document.body.classList.add("has-cookie-banner");
  }

  if (acceptBtn) {
    acceptBtn.addEventListener("click", function () {
      setConsent("accepted");
      if (banner) banner.hidden = true;
      document.body.classList.remove("has-cookie-banner");
      loadGA4();
    });
  }

  if (declineBtn) {
    declineBtn.addEventListener("click", function () {
      setConsent("declined");
      if (banner) banner.hidden = true;
      document.body.classList.remove("has-cookie-banner");
    });
  }
})();
