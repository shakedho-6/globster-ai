(function () {
  var root = document.documentElement;
  var storageKey = "globster-theme";

  function getStoredTheme() {
    try {
      return localStorage.getItem(storageKey);
    } catch (e) {
      return null;
    }
  }

  function setTheme(theme) {
    if (theme === "dark") {
      root.setAttribute("data-theme", "dark");
    } else {
      root.setAttribute("data-theme", "light");
    }
    try {
      localStorage.setItem(storageKey, theme);
    } catch (e) {}
  }

  function initTheme() {
    var stored = getStoredTheme();
    if (stored === "dark" || stored === "light") {
      setTheme(stored);
      return;
    }
    root.setAttribute("data-theme", "dark");
  }

  initTheme();

  document.getElementById("theme-toggle")?.addEventListener("click", function () {
    var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    setTheme(next);
  });

  /* ─── Nav scroll state ──────────────────────────────────────────────────── */
  var siteHeader = document.getElementById("site-header");
  function updateNavScroll() {
    if (!siteHeader) return;
    siteHeader.classList.toggle("is-scrolled", window.scrollY > 12);
  }
  window.addEventListener("scroll", updateNavScroll, { passive: true });
  updateNavScroll();

  /* ─── Mobile navigation ──────────────────────────────────────────────────── */
  var menuBtn = document.getElementById("menu-btn");
  var mobileNav = document.getElementById("mobile-nav");
  var mobileNavClose = document.getElementById("mobile-nav-close");
  var mobileNavOverlay = document.getElementById("mobile-nav-overlay");

  function openMobileNav() {
    if (!mobileNav || !menuBtn) return;
    mobileNav.classList.add("is-open");
    mobileNav.setAttribute("aria-hidden", "false");
    menuBtn.setAttribute("aria-expanded", "true");
    if (mobileNavOverlay) mobileNavOverlay.classList.add("is-visible");
    document.body.style.overflow = "hidden";
  }

  function closeMobileNav() {
    if (!mobileNav || !menuBtn) return;
    mobileNav.classList.remove("is-open");
    mobileNav.setAttribute("aria-hidden", "true");
    menuBtn.setAttribute("aria-expanded", "false");
    if (mobileNavOverlay) mobileNavOverlay.classList.remove("is-visible");
    document.body.style.overflow = "";
  }

  if (menuBtn) {
    menuBtn.addEventListener("click", openMobileNav);
  }
  if (mobileNavClose) {
    mobileNavClose.addEventListener("click", closeMobileNav);
  }
  if (mobileNavOverlay) {
    mobileNavOverlay.addEventListener("click", closeMobileNav);
  }

  /* Close drawer when any mobile nav link is clicked */
  if (mobileNav) {
    mobileNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMobileNav);
    });

    /* Trap focus inside drawer when open (Esc to close) */
    mobileNav.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        closeMobileNav();
        if (menuBtn) menuBtn.focus();
      }
    });
  }

  /* ─── Scroll reveal ──────────────────────────────────────────────────────── */
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches && typeof IntersectionObserver !== "undefined") {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".reveal").forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    /* Reduced-motion or no IntersectionObserver: show everything immediately */
    document.querySelectorAll(".reveal").forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* ─── Testimonials carousel ──────────────────────────────────────────────── */
  var shell = document.getElementById("testimonial-shell");
  var track = document.getElementById("testimonial-track");
  var slides = document.querySelectorAll(".testimonial-slide");
  var dotsWrap = document.getElementById("testimonial-dots");
  var index = 0;
  var total = slides.length;

  function layoutTestimonialTrack() {
    if (!track || !total) return;
    track.style.width = total * 100 + "%";
    slides.forEach(function (slide) {
      slide.style.flex = "0 0 " + 100 / total + "%";
      slide.style.width = 100 / total + "%";
    });
  }

  function goTo(i) {
    index = (i + total) % total;
    /* translate % is relative to the track box; one slide = 100/total of track */
    if (track) track.style.transform = "translateX(-" + (index * 100) / total + "%)";
    if (dotsWrap) {
      var dots = dotsWrap.querySelectorAll("button");
      dots.forEach(function (d, j) {
        d.setAttribute("aria-current", j === index ? "true" : "false");
      });
    }
  }

  layoutTestimonialTrack();

  if (dotsWrap && total) {
    for (var d = 0; d < total; d++) {
      (function (j) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "testimonial-seg";
        b.setAttribute("aria-label", "Show testimonial " + (j + 1) + " of " + total);
        b.addEventListener("click", function () {
          goTo(j);
        });
        dotsWrap.appendChild(b);
      })(d);
    }
    /* Middle slide active on load (matches design) */
    goTo(total > 1 ? 1 : 0);
  }

  /* Auto-advance (pause when tab hidden or hovering carousel) */
  var testimonialTimer = null;
  function stopTestimonialAuto() {
    if (testimonialTimer) {
      window.clearInterval(testimonialTimer);
      testimonialTimer = null;
    }
  }
  function startTestimonialAuto() {
    stopTestimonialAuto();
    if (!total || total < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (document.hidden) return;
    testimonialTimer = window.setInterval(function () {
      if (document.hidden) return;
      goTo(index + 1);
    }, 7000);
  }
  if (dotsWrap && total > 1) {
    startTestimonialAuto();
    if (shell) {
      shell.addEventListener("mouseenter", stopTestimonialAuto);
      shell.addEventListener("mouseleave", startTestimonialAuto);
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stopTestimonialAuto();
      else startTestimonialAuto();
    });
  }

  /* Swipe to change slide */
  var touchStartX = null;
  if (shell) {
    shell.addEventListener(
      "touchstart",
      function (e) {
        if (!e.touches || !e.touches[0]) return;
        touchStartX = e.touches[0].clientX;
      },
      { passive: true }
    );
    shell.addEventListener(
      "touchend",
      function (e) {
        if (touchStartX == null || !e.changedTouches || !e.changedTouches[0]) return;
        var dx = e.changedTouches[0].clientX - touchStartX;
        touchStartX = null;
        if (Math.abs(dx) < 48) return;
        if (dx < 0) goTo(index + 1);
        else goTo(index - 1);
      },
      { passive: true }
    );
    shell.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goTo(index - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goTo(index + 1);
      }
    });
  }

  /* ─── FAQ accordion ──────────────────────────────────────────────────────── */
  var faqItems = document.querySelectorAll(".faq-item[data-faq]");
  faqItems.forEach(function (item) {
    var trigger = item.querySelector(".faq-trigger");
    if (!trigger) return;
    trigger.addEventListener("click", function () {
      var isOpen = item.classList.contains("is-open");
      // Close all
      faqItems.forEach(function (other) {
        other.classList.remove("is-open");
        var t = other.querySelector(".faq-trigger");
        if (t) t.setAttribute("aria-expanded", "false");
      });
      // Toggle the clicked one
      if (!isOpen) {
        item.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
      }
    });
  });

  /* ─── Pricing: monthly / yearly ─────────────────────────────────────────── */
  var pricingSection = document.getElementById("pricing");
  if (pricingSection) {
    var billingStorageKey = "globster-pricing-billing";
    var billingBtns = pricingSection.querySelectorAll(".js-pricing-billing");
    function applyBilling(mode) {
      if (mode !== "monthly" && mode !== "yearly") mode = "monthly";
      pricingSection.setAttribute("data-billing", mode);
      billingBtns.forEach(function (btn) {
        var on = btn.getAttribute("data-value") === mode;
        btn.classList.toggle("is-active", on);
        btn.setAttribute("aria-pressed", on ? "true" : "false");
      });
      try {
        localStorage.setItem(billingStorageKey, mode);
      } catch (err) {}
    }
    billingBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        applyBilling(btn.getAttribute("data-value") || "monthly");
      });
    });
    var initialBilling = "monthly";
    try {
      var storedBilling = localStorage.getItem(billingStorageKey);
      if (storedBilling === "yearly" || storedBilling === "monthly") initialBilling = storedBilling;
    } catch (eBilling) {}
    applyBilling(initialBilling);
  }

  /* ─── Hero background video: respect prefers-reduced-motion ─────────────── */
  var heroBgVideo = document.querySelector(".hero__bg-video");
  if (heroBgVideo) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      heroBgVideo.pause();
      heroBgVideo.removeAttribute("autoplay");
    }
  }

  /* ─── Features Wall: build marquee icon rows ────────────────────────────── */
  (function () {
    var fwRows = document.getElementById("fw-rows");
    if (!fwRows) return;

    var CDN = "https://cdn.simpleicons.org/";

    var ICONS = [
      { n: "Gmail",            slug: "gmail",            bg: "#EA4335" },
      { n: "GitHub",           slug: "github",           bg: "#181717" },
      { n: "Slack",            slug: "slack",            bg: "#4A154B" },
      { n: "Salesforce",       slug: "salesforce",       bg: "#00A1E0" },
      { n: "Jira",             slug: "jira",             bg: "#0052CC" },
      { n: "Monday.com",       slug: "monday",           bg: "#FF3D57" },
      { n: "Google Calendar",  slug: "googlecalendar",   bg: "#1967D2" },
      { n: "Figma",            slug: "figma",            bg: "#F24E1E" },
      { n: "LinkedIn",         slug: "linkedin",         bg: "#0A66C2" },
      { n: "Notion",           slug: "notion",           bg: "#000000" },
      { n: "HubSpot",          slug: "hubspot",          bg: "#FF7A59" },
      { n: "Zoom",             slug: "zoom",             bg: "#2D8CFF" },
      { n: "Stripe",           slug: "stripe",           bg: "#635BFF" },
      { n: "Discord",          slug: "discord",          bg: "#5865F2" },
      { n: "YouTube",          slug: "youtube",          bg: "#FF0000" },
      { n: "X",                slug: "x",                bg: "#000000" },
      { n: "Reddit",           slug: "reddit",           bg: "#FF4500" },
      { n: "Facebook",         slug: "facebook",         bg: "#1877F2" },
      { n: "Linear",           slug: "linear",           bg: "#5E6AD2" },
      { n: "Intercom",         slug: "intercom",         bg: "#1F8DED" },
      { n: "Zendesk",          slug: "zendesk",          bg: "#03363D" },
      { n: "Pipedrive",        slug: "pipedrive",        bg: "#052D49" },
      { n: "Bitbucket",        slug: "bitbucket",        bg: "#205081" },
      { n: "Klaviyo",          slug: "klaviyo",          bg: "#F76B15" },
      { n: "Google Drive",     slug: "googledrive",      bg: "#4285F4" },
      { n: "Google Docs",      slug: "googledocs",       bg: "#4285F4" },
      { n: "Google Sheets",    slug: "googlesheets",     bg: "#34A853" },
      { n: "Microsoft Excel",  slug: "microsoftexcel",   bg: "#217346" },
      { n: "WhatsApp",         slug: "whatsapp",         bg: "#25D366" },
      { n: "Telegram",         slug: "telegram",         bg: "#2CA5E0" },
    ];

    var N = ICONS.length; // 30

    /* 7 rows: alternating direction, varied speed, offset start per row */
    var ROWS = [
      { offset: 0,  dir: "ltr", dur: "55s",  delay: "0s"    },
      { offset: 21, dir: "rtl", dur: "48s",  delay: "-8s"   },
      { offset: 4,  dir: "ltr", dur: "63s",  delay: "-15s"  },
      { offset: 14, dir: "rtl", dur: "45s",  delay: "-4s"   },
      { offset: 8,  dir: "ltr", dur: "70s",  delay: "-20s"  },
      { offset: 17, dir: "rtl", dur: "52s",  delay: "-12s"  },
      { offset: 25, dir: "ltr", dur: "58s",  delay: "-25s"  },
    ];

    ROWS.forEach(function (cfg) {
      var row = document.createElement("div");
      row.className = "fw-row fw-row--" + cfg.dir;
      row.style.setProperty("--fw-dur", cfg.dur);
      row.style.animationDelay = cfg.delay;

      /* 21 unique icons per set × 2 repetitions = seamless loop */
      for (var repeat = 0; repeat < 2; repeat++) {
        for (var i = 0; i < 21; i++) {
          var idx = (cfg.offset + i) % N;
          var ic = ICONS[idx];
          var cell = document.createElement("div");
          cell.className = "fw-cell";
          cell.style.background = ic.bg;
          var img = document.createElement("img");
          img.src = CDN + ic.slug + "/ffffff";
          img.alt = repeat === 0 ? ic.n : "";
          img.width = 36;
          img.height = 36;
          img.loading = "lazy";
          cell.appendChild(img);
          row.appendChild(cell);
        }
      }

      fwRows.appendChild(row);
    });
  })();

  /* ─── Agent card channel toggles ────────────────────────────────────────── */
  document.querySelectorAll(".agent-card__channel").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var on = btn.classList.toggle("is-on");
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  });

  /* ─── Agent card 3D tilt ─────────────────────────────────────────────────── */
  var agentCard3d = document.getElementById("agent-card-3d");
  if (agentCard3d && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var shine = agentCard3d.querySelector(".agent-card__shine");
    var rafId = null;
    var targetRX = 0, targetRY = 0, currentRX = 0, currentRY = 0;

    agentCard3d.addEventListener("mousemove", function (e) {
      var rect = agentCard3d.getBoundingClientRect();
      var dx = (e.clientX - rect.left) / rect.width  - 0.5; /* -0.5 to 0.5 */
      var dy = (e.clientY - rect.top)  / rect.height - 0.5;
      targetRY =  dx * 18;
      targetRX = -dy * 12;

      /* Move glare to cursor position */
      if (shine) {
        var px = ((e.clientX - rect.left) / rect.width  * 100).toFixed(1);
        var py = ((e.clientY - rect.top)  / rect.height * 100).toFixed(1);
        shine.style.background = "radial-gradient(circle at " + px + "% " + py + "%, rgba(255,255,255,.18) 0%, transparent 60%)";
      }

      if (!rafId) {
        rafId = requestAnimationFrame(function loop() {
          currentRX += (targetRX - currentRX) * 0.12;
          currentRY += (targetRY - currentRY) * 0.12;
          agentCard3d.style.transform =
            "perspective(900px) rotateX(" + currentRX.toFixed(2) + "deg) rotateY(" + currentRY.toFixed(2) + "deg) scale3d(1.03,1.03,1.03)";
          agentCard3d.style.boxShadow =
            "0 2px 0 rgba(255,255,255,.06) inset, " +
            "0 " + (50 + currentRX * 1.5) + "px " + (100 + Math.abs(currentRY) * 2) + "px rgba(0,0,0,.85), " +
            "0 " + (20 + currentRX) + "px 40px rgba(0,0,0,.5)";
          if (Math.abs(targetRX - currentRX) > 0.05 || Math.abs(targetRY - currentRY) > 0.05) {
            rafId = requestAnimationFrame(loop);
          } else { rafId = null; }
        });
      }
    });

    agentCard3d.addEventListener("mouseleave", function () {
      targetRX = 0; targetRY = 0;
      if (shine) shine.style.background = "";
      var reset = requestAnimationFrame(function ease() {
        currentRX += (0 - currentRX) * 0.1;
        currentRY += (0 - currentRY) * 0.1;
        agentCard3d.style.transform =
          "perspective(900px) rotateX(" + currentRX.toFixed(2) + "deg) rotateY(" + currentRY.toFixed(2) + "deg) scale3d(1,1,1)";
        if (Math.abs(currentRX) > 0.05 || Math.abs(currentRY) > 0.05) {
          reset = requestAnimationFrame(ease);
        } else {
          agentCard3d.style.transform = "";
          agentCard3d.style.boxShadow = "";
        }
      });
    });
  }

  /* ─── Notification card 3D tilt ────────────────────────────────────────── */
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    [
      { id: "notif-card-tg", baseRot: -3 },
      { id: "notif-card-wa", baseRot:  3 }
    ].forEach(function (cfg) {
      var card = document.getElementById(cfg.id);
      if (!card) return;
      var shine = card.querySelector(".notif-float__shine");
      var rafId = null;
      var targetRX = 0, targetRY = 0, currentRX = 0, currentRY = 0;
      var isHovered = false;

      card.addEventListener("mouseenter", function () {
        isHovered = true;
        card.style.animationPlayState = "paused";
      });

      card.addEventListener("mousemove", function (e) {
        var rect = card.getBoundingClientRect();
        var dx = (e.clientX - rect.left) / rect.width  - 0.5;
        var dy = (e.clientY - rect.top)  / rect.height - 0.5;
        targetRY = dx * 16;
        targetRX = -dy * 10;

        if (shine) {
          var px = ((e.clientX - rect.left) / rect.width  * 100).toFixed(1);
          var py = ((e.clientY - rect.top)  / rect.height * 100).toFixed(1);
          shine.style.background = "radial-gradient(circle at " + px + "% " + py + "%, rgba(255,255,255,.16) 0%, transparent 60%)";
        }

        if (!rafId) {
          rafId = requestAnimationFrame(function loop() {
            currentRX += (targetRX - currentRX) * 0.12;
            currentRY += (targetRY - currentRY) * 0.12;
            card.style.transform =
              "perspective(800px) rotate(" + cfg.baseRot + "deg) rotateX(" + currentRX.toFixed(2) + "deg) rotateY(" + currentRY.toFixed(2) + "deg) scale3d(1.04,1.04,1.04)";
            card.style.boxShadow =
              "0 2px 0 rgba(255,255,255,.06) inset, " +
              "0 " + (40 + currentRX * 2) + "px " + (90 + Math.abs(currentRY) * 2) + "px rgba(0,0,0,.9), " +
              "0 " + (16 + currentRX) + "px 36px rgba(0,0,0,.6)";
            if (Math.abs(targetRX - currentRX) > 0.05 || Math.abs(targetRY - currentRY) > 0.05) {
              rafId = requestAnimationFrame(loop);
            } else { rafId = null; }
          });
        }
      });

      card.addEventListener("mouseleave", function () {
        isHovered = false;
        targetRX = 0; targetRY = 0;
        if (shine) shine.style.background = "";
        var reset = requestAnimationFrame(function ease() {
          currentRX += (0 - currentRX) * 0.1;
          currentRY += (0 - currentRY) * 0.1;
          card.style.transform =
            "perspective(800px) rotate(" + cfg.baseRot + "deg) rotateX(" + currentRX.toFixed(2) + "deg) rotateY(" + currentRY.toFixed(2) + "deg) scale3d(1,1,1)";
          if (Math.abs(currentRX) > 0.05 || Math.abs(currentRY) > 0.05) {
            reset = requestAnimationFrame(ease);
          } else {
            card.style.transform = "";
            card.style.boxShadow = "";
            card.style.animationPlayState = "";
          }
        });
      });
    });
  }



  /* ─── Stats bento 3D tilt ───────────────────────────────────────────── */
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    ['stat-hero', 'stat-accent', 'stat-muted'].forEach(function (id) {
      var card = document.getElementById(id);
      if (!card) return;
      var shine = card.querySelector('.about-stat__shine');
      var rafId = null;
      var targetRX = 0, targetRY = 0, currentRX = 0, currentRY = 0;

      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var dx = (e.clientX - rect.left) / rect.width  - 0.5;
        var dy = (e.clientY - rect.top)  / rect.height - 0.5;
        targetRY =  dx * 18;
        targetRX = -dy * 12;

        if (shine) {
          var px = ((e.clientX - rect.left) / rect.width  * 100).toFixed(1);
          var py = ((e.clientY - rect.top)  / rect.height * 100).toFixed(1);
          shine.style.background = 'radial-gradient(circle at ' + px + '% ' + py + '%, rgba(255,255,255,.18) 0%, transparent 60%)';
        }

        if (!rafId) {
          rafId = requestAnimationFrame(function loop() {
            currentRX += (targetRX - currentRX) * 0.12;
            currentRY += (targetRY - currentRY) * 0.12;
            card.style.transform =
              'perspective(900px) rotateX(' + currentRX.toFixed(2) + 'deg) rotateY(' + currentRY.toFixed(2) + 'deg) scale3d(1.03,1.03,1.03)';
            card.style.boxShadow =
              '0 2px 0 rgba(255,255,255,.06) inset, ' +
              '0 ' + (30 + currentRX * 2) + 'px ' + (70 + Math.abs(currentRY) * 2) + 'px rgba(0,0,0,.7), ' +
              '0 ' + (12 + currentRX) + 'px 30px rgba(0,0,0,.4)';
            if (Math.abs(targetRX - currentRX) > 0.05 || Math.abs(targetRY - currentRY) > 0.05) {
              rafId = requestAnimationFrame(loop);
            } else { rafId = null; }
          });
        }
      });

      card.addEventListener('mouseleave', function () {
        targetRX = 0; targetRY = 0;
        if (shine) shine.style.background = '';
        var reset = requestAnimationFrame(function ease() {
          currentRX += (0 - currentRX) * 0.1;
          currentRY += (0 - currentRY) * 0.1;
          card.style.transform =
            'perspective(900px) rotateX(' + currentRX.toFixed(2) + 'deg) rotateY(' + currentRY.toFixed(2) + 'deg) scale3d(1,1,1)';
          if (Math.abs(currentRX) > 0.05 || Math.abs(currentRY) > 0.05) {
            reset = requestAnimationFrame(ease);
          } else {
            card.style.transform = '';
            card.style.boxShadow = '';
          }
        });
      });
    });
  }

  /* ─── Hero notification cards 3D tilt ───────────────────────────────── */
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    ['hero-card-tg', 'hero-card-wa'].forEach(function (id) {
      var card = document.getElementById(id);
      if (!card) return;
      var shine = card.querySelector('.notif-float__shine');
      var rafId = null;
      var targetRX = 0, targetRY = 0, currentRX = 0, currentRY = 0;

      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var dx = (e.clientX - rect.left) / rect.width  - 0.5;
        var dy = (e.clientY - rect.top)  / rect.height - 0.5;
        targetRY =  dx * 18;
        targetRX = -dy * 12;

        if (shine) {
          var px = ((e.clientX - rect.left) / rect.width  * 100).toFixed(1);
          var py = ((e.clientY - rect.top)  / rect.height * 100).toFixed(1);
          shine.style.background = 'radial-gradient(circle at ' + px + '% ' + py + '%, rgba(255,255,255,.18) 0%, transparent 60%)';
        }

        if (!rafId) {
          rafId = requestAnimationFrame(function loop() {
            currentRX += (targetRX - currentRX) * 0.12;
            currentRY += (targetRY - currentRY) * 0.12;
            card.style.transform =
              'perspective(800px) rotateX(' + currentRX.toFixed(2) + 'deg) rotateY(' + currentRY.toFixed(2) + 'deg) scale3d(1.04,1.04,1.04)';
            card.style.boxShadow =
              '0 2px 0 rgba(255,255,255,.06) inset, ' +
              '0 ' + (40 + currentRX * 2) + 'px ' + (90 + Math.abs(currentRY) * 2) + 'px rgba(0,0,0,.9), ' +
              '0 ' + (16 + currentRX) + 'px 36px rgba(0,0,0,.6)';
            if (Math.abs(targetRX - currentRX) > 0.05 || Math.abs(targetRY - currentRY) > 0.05) {
              rafId = requestAnimationFrame(loop);
            } else { rafId = null; }
          });
        }
      });

      card.addEventListener('mouseleave', function () {
        targetRX = 0; targetRY = 0;
        if (shine) shine.style.background = '';
        var reset = requestAnimationFrame(function ease() {
          currentRX += (0 - currentRX) * 0.1;
          currentRY += (0 - currentRY) * 0.1;
          card.style.transform =
            'perspective(800px) rotateX(' + currentRX.toFixed(2) + 'deg) rotateY(' + currentRY.toFixed(2) + 'deg) scale3d(1,1,1)';
          if (Math.abs(currentRX) > 0.05 || Math.abs(currentRY) > 0.05) {
            reset = requestAnimationFrame(ease);
          } else {
            card.style.transform = '';
            card.style.boxShadow = '';
          }
        });
      });
    });
  }

  /* ─── Parallax plugin grid (blurred bg) ─────────────────────────────────── */
  (function () {
    var ppSection = document.getElementById("features");
    var ppBg      = document.getElementById("pp-grid"); /* id stays pp-grid on .pp-bg el */
    if (!ppSection || !ppBg) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    function scrubPlugins() {
      var rect   = ppSection.getBoundingClientRect();
      var vh     = window.innerHeight;
      /* Smooth continuous parallax: grid drifts at 0.35× scroll relative to section center */
      var offset = (rect.top - vh * 0.5) * -0.35;
      ppBg.style.transform = "translateY(" + offset.toFixed(1) + "px)";
    }

    window.addEventListener("scroll", scrubPlugins, { passive: true });
    scrubPlugins();
  })();

  /* ─── Interstitial: vertical parallax "throw" ──────────────────────────── */
  var interstitialSection = document.getElementById("interstitial-section");
  var interstitialInner   = interstitialSection?.querySelector(".interstitial__inner");

  if (interstitialSection && interstitialInner && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    function scrubInterstitial() {
      var rect       = interstitialSection.getBoundingClientRect();
      var sectionH   = interstitialSection.offsetHeight;
      var vh         = window.innerHeight;

      /* Distance of section centre from viewport centre (positive = below) */
      var sectionMid = rect.top + sectionH * 0.5;
      var offset     = sectionMid - vh * 0.5;

      /* Text moves at 0.45× of that offset — rushes through faster than page */
      var throw_ = offset * -0.45;

      /* Fade: full opacity when centred, softly dimmed at edges */
      var maxDist   = (vh + sectionH) * 0.55;
      var opacity   = Math.max(0, 1 - Math.abs(offset) / maxDist);
      opacity       = 0.25 + opacity * 0.75; /* floor 0.25 so it never disappears */

      interstitialInner.style.transform = "translateY(" + throw_.toFixed(1) + "px)";
      interstitialInner.style.opacity   = opacity.toFixed(3);
    }

    window.addEventListener("scroll", scrubInterstitial, { passive: true });
    scrubInterstitial();
  }

  /* ─── Video modal ───────────────────────────────────────────────────────── */
  var VIMEO_URL = "https://player.vimeo.com/video/1184514407?badge=0&autoplay=1&player_id=0&app_id=58479";
  var videoModal      = document.getElementById("video-modal");
  var videoModalIframe = document.getElementById("video-modal-iframe");
  var videoModalClose  = document.getElementById("video-modal-close");
  var videoModalBackdrop = document.getElementById("video-modal-backdrop");

  function openVideoModal() {
    if (!videoModal || !videoModalIframe) return;
    videoModalIframe.src = VIMEO_URL;
    videoModal.removeAttribute("hidden");
    document.body.style.overflow = "hidden";
    videoModalClose?.focus();
  }

  function closeVideoModal() {
    if (!videoModal || !videoModalIframe) return;
    videoModalIframe.src = "";
    videoModal.setAttribute("hidden", "");
    document.body.style.overflow = "";
  }

  document.getElementById("watch-demo-btn")?.addEventListener("click", openVideoModal);
  document.getElementById("about-video-btn")?.addEventListener("click", openVideoModal);
  videoModalClose?.addEventListener("click", closeVideoModal);
  videoModalBackdrop?.addEventListener("click", closeVideoModal);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && videoModal && !videoModal.hasAttribute("hidden")) {
      closeVideoModal();
    }
  });

  /* ─── Features: tool tabs + preview panel ───────────────────────────────── */
  var featureTabs = Array.prototype.slice.call(document.querySelectorAll(".feature-tab"));
  var showcase = document.getElementById("features-showcase");
  var fpanel = document.getElementById("fpanel");

  if (featureTabs.length && showcase) {
    var previewVideos = Array.prototype.slice.call(showcase.querySelectorAll(".features-phone-video"));

    function syncPreviewVideo(toolKey) {
      previewVideos.forEach(function (v) {
        v.pause();
      });
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      if (!toolKey) return;
      var active = showcase.querySelector('.features-phone-video[data-preview-for="' + toolKey + '"]');
      if (active) active.play().catch(function () {});
    }

    function activateFeatureTab(tabBtn) {
      featureTabs.forEach(function (b) {
        var on = b === tabBtn;
        b.setAttribute("aria-selected", on ? "true" : "false");
        b.setAttribute("tabindex", on ? "0" : "-1");
      });
      var key = tabBtn.getAttribute("data-tool");
      if (key) showcase.setAttribute("data-active-tool", key);
      if (fpanel) fpanel.setAttribute("aria-labelledby", tabBtn.id);
      syncPreviewVideo(key);
      tabBtn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    }

    featureTabs.forEach(function (btn) {
      btn.addEventListener("click", function () {
        activateFeatureTab(btn);
      });
    });

    /* Keyboard navigation (arrow keys within tablist) */
    var tablist = document.querySelector(".features-tabs");
    if (tablist) {
      tablist.addEventListener("keydown", function (e) {
        var k = e.key;
        if (k !== "ArrowDown" && k !== "ArrowUp" && k !== "ArrowLeft" && k !== "ArrowRight") return;
        var i = featureTabs.indexOf(document.activeElement);
        if (i < 0) return;
        e.preventDefault();
        var delta = k === "ArrowDown" || k === "ArrowRight" ? 1 : -1;
        var next = featureTabs[(i + delta + featureTabs.length) % featureTabs.length];
        next.focus();
        activateFeatureTab(next);
      });
    }

    /* Activate initial tab */
    syncPreviewVideo(showcase.getAttribute("data-active-tool") || "gmail");
  }

  /* ─── Hero orbit: elbow polylines from badge center to iPhone frame ─────── */
  var heroOrbit = document.querySelector(".hero__orbit");
  var heroWiresSvg = heroOrbit?.querySelector(".hero__orbit-wires");
  var heroWiresGroup = heroOrbit?.querySelector(".hero__orbit-wires-inner");

  function layoutHeroOrbitWires() {
    if (!heroOrbit || !heroWiresSvg || !heroWiresGroup) return;
    if (!window.matchMedia("(min-width: 900px)").matches) {
      heroWiresGroup.innerHTML = "";
      return;
    }
    var phone = heroOrbit.querySelector(".hero__visual-device");
    var badges = heroOrbit.querySelectorAll(".hero__orbit-badge");
    if (!phone || !badges.length) return;

    var w = heroOrbit.clientWidth;
    var h = heroOrbit.clientHeight;
    if (w < 2 || h < 2) return;

    heroWiresSvg.setAttribute("viewBox", "0 0 " + w + " " + h);
    heroWiresSvg.setAttribute("width", String(w));
    heroWiresSvg.setAttribute("height", String(h));
    heroWiresGroup.innerHTML = "";

    var o = heroOrbit.getBoundingClientRect();
    var p = phone.getBoundingClientRect();
    var phoneLeft = p.left - o.left;
    var phoneRight = p.right - o.left;
    var phoneTop = p.top - o.top;
    var phoneBottom = p.bottom - o.top;
    var phoneMidX = (phoneLeft + phoneRight) / 2;

    function clamp(n, lo, hi) {
      return Math.max(lo, Math.min(hi, n));
    }

    var minVertStub = 14;

    badges.forEach(function (badge) {
      var b = badge.getBoundingClientRect();
      var cx = b.left - o.left + b.width / 2;
      var cy = b.top - o.top + b.height / 2;
      var yLo = phoneTop + 0.5;
      var yHi = phoneBottom - 0.5;
      var edgeY = clamp(cy, yLo, yHi);
      if (Math.abs(edgeY - cy) < minVertStub) {
        var roomBelow = yHi - cy;
        var roomAbove = cy - yLo;
        if (roomBelow >= minVertStub) {
          edgeY = clamp(cy + minVertStub, yLo, yHi);
        } else if (roomAbove >= minVertStub) {
          edgeY = clamp(cy - minVertStub, yLo, yHi);
        } else if (roomBelow > 2 || roomAbove > 2) {
          edgeY =
            roomBelow >= roomAbove
              ? clamp(cy + Math.max(6, roomBelow * 0.55), yLo, yHi)
              : clamp(cy - Math.max(6, roomAbove * 0.55), yLo, yHi);
        }
      }
      var frameX;
      var turnX;
      if (cx <= phoneMidX) {
        frameX = phoneLeft;
      } else {
        frameX = phoneRight;
      }
      /* Bend sits on the horizontal midpoint between badge and frame */
      turnX = (cx + frameX) / 2;
      var pts;
      if (Math.abs(edgeY - cy) < 1) {
        var phoneMidY = (yLo + yHi) / 2;
        var turnY = clamp((cy + phoneMidY) / 2, yLo, yHi);
        if (Math.abs(turnY - cy) < 1) {
          turnY = clamp(cy + (yHi - cy >= cy - yLo ? minVertStub : -minVertStub), yLo, yHi);
        }
        pts = [
          [Math.round(cx), Math.round(cy)],
          [Math.round(cx), Math.round(turnY)],
          [Math.round(frameX), Math.round(turnY)],
        ];
      } else {
        pts = [
          [Math.round(cx), Math.round(cy)],
          [Math.round(turnX), Math.round(cy)],
          [Math.round(turnX), Math.round(edgeY)],
          [Math.round(frameX), Math.round(edgeY)],
        ];
      }
      var poly = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
      poly.setAttribute(
        "points",
        pts
          .map(function (pt) {
            return pt[0] + "," + pt[1];
          })
          .join(" ")
      );
      poly.setAttribute("fill", "none");
      poly.setAttribute("stroke", "currentColor");
      poly.setAttribute("stroke-width", "1");
      poly.setAttribute("stroke-linejoin", "miter");
      poly.setAttribute("stroke-linecap", "square");
      poly.setAttribute("vector-effect", "non-scaling-stroke");
      heroWiresGroup.appendChild(poly);
    });
  }

  layoutHeroOrbitWires();
  window.addEventListener("resize", layoutHeroOrbitWires);
  window.addEventListener("load", layoutHeroOrbitWires);
  if (heroOrbit && typeof ResizeObserver !== "undefined") {
    var heroOrbitRo = new ResizeObserver(function () {
      layoutHeroOrbitWires();
    });
    heroOrbitRo.observe(heroOrbit);
    var heroPhone = heroOrbit.querySelector(".hero__visual-device");
    if (heroPhone) heroOrbitRo.observe(heroPhone);
  }
  window.requestAnimationFrame(function () {
    layoutHeroOrbitWires();
    window.requestAnimationFrame(layoutHeroOrbitWires);
  });

  /* ─── Memory brain — outcome cycling ────────────────────────────────────── */
  (function () {
    var svg      = document.getElementById("mem-brain-svg");
    if (!svg) return;
    var outcomes = svg.querySelectorAll(".moutcome");
    if (!outcomes.length) return;

    var current  = 0;
    var timer    = null;

    function activate(idx) {
      outcomes.forEach(function (o, i) {
        var wasActive = o.classList.contains("is-active");
        o.classList.toggle("is-active", i === idx);
        if (i === idx && !wasActive) {
          /* restart the traveling particle for this outcome */
          var motion = o.querySelector("animateMotion");
          if (motion) {
            try { motion.beginElement(); } catch (e) {}
          }
          /* reset line dash so draw animation replays */
          var line = o.querySelector(".mout-line");
          if (line) {
            line.style.transition = "none";
            line.style.strokeDashoffset = "260";
            /* force reflow then re-enable transition */
            void line.getBoundingClientRect();
            line.style.transition = "";
          }
        }
      });
      current = idx;
    }

    function startCycle() {
      activate(0);
      timer = setInterval(function () {
        activate((current + 1) % outcomes.length);
      }, 2800);
    }

    /* Trigger when the SVG enters the viewport */
    if (typeof IntersectionObserver === "undefined") {
      startCycle();
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          startCycle();
          io.disconnect();
        }
      });
    }, { threshold: 0.2 });
    io.observe(svg);
  }());

  /* ─── Testimonials carousel ──────────────────────────────────────────────── */
  (function () {
    var viewport = document.getElementById("testi-viewport");
    var track    = document.getElementById("testi-track");
    var prevBtn  = document.getElementById("testi-prev");
    var nextBtn  = document.getElementById("testi-next");
    var dots     = document.querySelectorAll(".testi-dot");
    if (!viewport || !track) return;

    var cards   = track.querySelectorAll(".testi-card");
    var total   = cards.length;
    var current = 0;
    var timer;

    function goTo(idx) {
      current = (idx + total) % total;
      track.style.transform = "translateX(-" + (viewport.offsetWidth * current) + "px)";
      dots.forEach(function (d, i) { d.classList.toggle("is-active", i === current); });
    }

    function startAuto() { timer = setInterval(function () { goTo(current + 1); }, 5000); }
    function stopAuto()  { clearInterval(timer); }

    goTo(0);
    startAuto();

    if (prevBtn) prevBtn.addEventListener("click", function () { stopAuto(); goTo(current - 1); startAuto(); });
    if (nextBtn) nextBtn.addEventListener("click", function () { stopAuto(); goTo(current + 1); startAuto(); });
    dots.forEach(function (d) {
      d.addEventListener("click", function () { stopAuto(); goTo(+d.dataset.index); startAuto(); });
    });

    var wrap = document.querySelector(".testi-wrap");
    if (wrap) {
      wrap.addEventListener("mouseenter", stopAuto);
      wrap.addEventListener("mouseleave", startAuto);
    }

    window.addEventListener("resize", function () { goTo(current); });
  }());

  /* --- Hero sequential animation ----------------------------------------------------------------- */
  (function () {
    var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var panels    = Array.prototype.slice.call(document.querySelectorAll('#ip-model, #ip-nemo, #ip-config, #ip-tools'));
    var lines     = Array.prototype.slice.call(document.querySelectorAll('.hc-line'));
    var particles = Array.prototype.slice.call(document.querySelectorAll('.hc-particle'));
    var cardTg    = document.getElementById('hero-card-tg');
    var cardWa    = document.getElementById('hero-card-wa');
    var msgTg     = document.getElementById('hero-msg-tg');
    var msgWa     = document.getElementById('hero-msg-wa');
    var curTg     = document.getElementById('hero-cursor-tg');
    var curWa     = document.getElementById('hero-cursor-wa');
    var tasksWa   = document.getElementById('hero-tasks-wa');
    var toolsTg   = document.getElementById('hero-tools-tg');
    var toolsWa   = document.getElementById('hero-tools-wa');
    var chipGcal  = document.getElementById('hero-chip-gcal');
    var chipGh       = document.getElementById('hero-chip-gh');
    var chipWhatsapp = document.getElementById('hero-chip-whatsapp');
    var chipMonday   = document.getElementById('hero-chip-monday');
    var chipWaGmail  = document.getElementById('hero-chip-wa-gmail');
    var chipSheets   = document.getElementById('hero-chip-sheets');
    var arrow     = document.getElementById('hero-arrow');
    var visual    = document.querySelector('.hero__visual');

    if (!cardTg || !cardWa) return;

    var TG_MSG   = 'Daily is done — here\'s the summary. Sending tasks to the WhatsApp group now 🌸';
    var WA_MSG   = 'Hey team! Here are your tasks for today';
    var WA_TASKS = ['1. Finalize Q3 report — @James', '2. Follow up with client — @Sarah'];

    function wait(ms) {
      return new Promise(function (res) { setTimeout(res, ms); });
    }

    function typeWriter(el, text, duration) {
      return new Promise(function (res) {
        el.textContent = '';
        var delay = Math.max(18, duration / text.length);
        var i = 0;
        function step() {
          if (i < text.length) {
            el.textContent += text[i++];
            setTimeout(step, delay);
          } else {
            res();
          }
        }
        step();
      });
    }

    function addTaskLine(container, text) {
      return new Promise(function (res) {
        var line = document.createElement('div');
        line.className = 'hero-seq-task-line';
        line.textContent = text;
        container.appendChild(line);
        void line.getBoundingClientRect();
        line.classList.add('is-visible');
        setTimeout(res, 280);
      });
    }

    function activateRow(cls) {
      var row = document.querySelector('.ip-row--' + cls);
      if (row) row.classList.add('is-active');
    }
    function deactivateRow(cls) {
      var row = document.querySelector('.ip-row--' + cls);
      if (row) row.classList.remove('is-active');
    }

    function exitCard(card) {
      return new Promise(function (res) {
        card.classList.add('is-exiting');
        setTimeout(res, 420);
      });
    }

    function resetCards() {
      [cardTg, cardWa].forEach(function (c) {
        c.classList.remove('is-visible', 'is-exiting');
        void c.getBoundingClientRect();
      });
      [msgTg, msgWa].forEach(function (m) { m.textContent = ''; });
      [curTg, curWa].forEach(function (c) { c.classList.remove('is-done'); });
      [chipGcal, chipGh, chipWhatsapp, chipMonday, chipWaGmail, chipSheets].forEach(function (c) { if (c) c.classList.remove('is-active'); });
      if (tasksWa) tasksWa.innerHTML = '';
      deactivateRow('gcal');
      deactivateRow('github');
    }

    function showAllStatic() {
      [cardTg, cardWa].forEach(function (c) { c.classList.add('is-visible'); });
      msgTg.textContent = TG_MSG;
      msgWa.textContent = WA_MSG;
      [curTg, curWa].forEach(function (c) { c.classList.add('is-done'); });
      [chipGcal, chipGh, chipWhatsapp, chipMonday, chipWaGmail, chipSheets].forEach(function (c) { if (c) c.classList.add('is-active'); });
      WA_TASKS.forEach(function (t) {
        var l = document.createElement('div');
        l.className = 'hero-seq-task-line is-visible';
        l.textContent = t;
        tasksWa.appendChild(l);
      });
      activateRow('gcal');
      activateRow('github');
    }

    async function runCards() {
      if (prefersReduced) { showAllStatic(); return; }

      resetCards();
      await wait(1500);

      // Card 1: Telegram notification drops in with spring entrance
      cardTg.classList.add('is-visible');
      await wait(580);
      activateRow('gcal');
      await typeWriter(msgTg, TG_MSG, 1800);
      curTg.classList.add('is-done');
      chipGcal.classList.add('is-active');
      if (chipWhatsapp) chipWhatsapp.classList.add('is-active');
      if (chipMonday)   chipMonday.classList.add('is-active');
      await wait(2000);

      // Card 2: WhatsApp notification springs in on top of Telegram
      cardWa.classList.add('is-visible');
      await wait(580);
      deactivateRow('gcal');
      activateRow('github');
      await typeWriter(msgWa, WA_MSG, 900);
      for (var i = 0; i < WA_TASKS.length; i++) {
        await addTaskLine(tasksWa, WA_TASKS[i]);
      }
      curWa.classList.add('is-done');
      chipGh.classList.add('is-active');
      if (chipWaGmail) chipWaGmail.classList.add('is-active');
      if (chipSheets)  chipSheets.classList.add('is-active');
      // Animation complete — stay in final state, no loop
    }

    runCards();
  }());

})();