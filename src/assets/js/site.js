/* PsychPhiDims — small site behaviours (no libraries) */
(function () {
  "use strict";

  /* Mobile menu */
  var toggle = document.querySelector(".menu-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) { nav.classList.remove("is-open"); toggle.setAttribute("aria-expanded", "false"); }
    });
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function niceDate(value) {
    var d = value ? new Date(value) : new Date();
    if (isNaN(d)) return "";
    try {
      return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Lagos" });
    } catch (e) { return d.toDateString(); }
  }

  /* Today's Affirmation */
  var aff = document.querySelector("[data-affirmation]");
  if (aff) {
    var dateEl = aff.querySelector("[data-affirmation-date]");
    var textEl = aff.querySelector("[data-affirmation-text]");
    if (dateEl) dateEl.textContent = niceDate();
    fetch("/api/affirmation", { headers: { Accept: "application/json" } })
      .then(function (r) { return r.ok && r.status !== 204 ? r.json() : null; })
      .then(function (data) {
        if (data && data.text && textEl) textEl.textContent = "“" + data.text + "”";
      })
      .catch(function () { /* keep the fallback affirmation */ });
  }

  /* Latest Substack posts */
  var lists = document.querySelectorAll("[data-substack-list]");
  if (lists.length) {
    fetch("/api/substack", { headers: { Accept: "application/json" } })
      .then(function (r) { if (!r.ok) throw new Error("feed"); return r.json(); })
      .then(function (data) {
        var posts = (data && data.posts) || [];
        lists.forEach(function (el) { render(el, posts, data && data.home); });
      })
      .catch(function () {
        lists.forEach(function (el) { render(el, [], null); });
      });
  }

  function render(el, posts, home) {
    var count = parseInt(el.getAttribute("data-count") || "3", 10);
    var offset = parseInt(el.getAttribute("data-offset") || "0", 10);
    var variant = el.getAttribute("data-variant") || "card";
    var items = posts.slice(offset, offset + count);

    if (!items.length) {
      if (offset > 0) { el.innerHTML = ""; return; }
      el.innerHTML = '<p class="feed-note">New writing is on its way. Read the latest on ' +
        '<a href="' + esc(home || "#") + '" target="_blank" rel="noopener">Substack</a>.</p>';
      el.classList.remove("grid", "grid-3");
      return;
    }

    el.innerHTML = items.map(function (p) {
      var img = p.image ? '<img src="' + esc(p.image) + '" alt="" loading="lazy">' : "";
      if (variant === "featured") {
        return '<article class="featured">' +
          '<a class="post" href="' + esc(p.link) + '" target="_blank" rel="noopener"><div class="thumb">' + img + '</div></a>' +
          '<div class="body"><span class="eyebrow">Latest essay</span>' +
          '<h2>' + esc(p.title) + '</h2>' +
          (p.subtitle ? '<p class="lead">' + esc(p.subtitle) + '</p>' : "") +
          '<span class="form-note">' + esc(niceDate(p.date)) + '</span>' +
          '<a class="btn btn-primary" href="' + esc(p.link) + '" target="_blank" rel="noopener">Read on Substack</a></div></article>';
      }
      return '<a class="post" href="' + esc(p.link) + '" target="_blank" rel="noopener">' +
        '<div class="thumb">' + img + '</div>' +
        '<span class="date">' + esc(niceDate(p.date)) + '</span>' +
        '<h3>' + esc(p.title) + '</h3>' +
        (p.subtitle ? '<p>' + esc(p.subtitle) + '</p>' : "") + '</a>';
    }).join("");
  }

  /* Contact form: if no form key is set yet, fall back to the visitor's email app */
  var form = document.querySelector("[data-contact]");
  if (form) {
    form.addEventListener("submit", function (e) {
      var key = form.querySelector('[name="access_key"]');
      if (key && key.value) return; // normal submission to the form service
      e.preventDefault();
      var get = function (n) { var f = form.querySelector('[name="' + n + '"]'); return f ? f.value : ""; };
      var body = [
        "Name: " + get("name"), "Email: " + get("email"), "Phone: " + get("phone"),
        "Organisation: " + get("organisation"), "About: " + get("enquiry_type"),
        "Event date: " + get("event_date"), "Location: " + get("location"), "", get("message")
      ].join("\n");
      var to = (document.querySelector('a[href^="mailto:"]') || {}).href || "mailto:";
      window.location.href = to + "?subject=" + encodeURIComponent("Website enquiry: " + get("enquiry_type")) + "&body=" + encodeURIComponent(body);
    });
  }
})();
