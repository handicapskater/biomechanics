/* Guided reading and question preparation, not a scientific answer engine. */
(() => {
  "use strict";
  const journeys = {
    lifelong: {
      title: "What does this mean for lifelong mobility?",
      context: "Mobility is not just about whether a person can walk. It is about preserving useful function while managing the mechanical demands placed on the body over time. HandicapSkater compares walking with controlled rolling mobility to ask whether different movement strategies can preserve function with different mechanical patterns. What would you like to understand?",
      links: [["How does walking load the body?", "/lifelong-mobility/#walking"], ["How does skating change the movement?", "/lifelong-mobility/#skating"], ["What has actually been measured?", "/lifelong-mobility/#measured"], ["What could this mean over a lifetime?", "/lifelong-mobility/#lifetime"], ["Show me the evidence", "/lifelong-mobility/#evidence"], ["Back to the main questions", "/#audience-routing"]],
      question: "",
      publicReadingOnly: true
    },
    walking: {
      title: "Start with what walking allows—and what it costs.",
      context: "Would you like the personal pain-and-function context, or the repeated same-day Mall skating → Walking → PT skating comparison? Sensors do not read pain.",
      links: [["Pain and function", "/pain/"], ["The same-day comparison", "/evidence/repeated-protocol/"], ["Distance evidence", "/evidence/mobility-comparison/"]],
      question: "What does the governed Mall skating → Walking → PT skating protocol show about functional distance and pain-limited walking? Separate reported pain from measured function, and historical Core from prospective PVC-01 evidence."
    },
    rolling: {
      title: "Start with the movement, then the measurements.",
      context: "Explore repeated stepping versus controlled rolling, then vertical motion, jerk, and PT skating’s functional role. The measurements do not identify internal joint forces or pain.",
      links: [["Walking and controlled rolling", "/biomechanics/"], ["Measured biomechanics and boundaries", "/evidence/#mobility-biomechanics-evidence"]],
      question: "What distinguishes Walking from Mall skating and PT skating in functional distance, vertical RMS, and jerk? Explain controlled rolling in plain language and preserve the boundaries: chest shock is not pelvic or SI-joint load, and pain is not measured."
    },
    evidence: {
      title: "Which evidence would you like to inspect first?",
      context: "Follow the historical controlled comparison, the separate frozen prospective test, or the longer-term record. Each has its own scope and sources.",
      links: [["Historical Core", "/evidence/#mobility-biomechanics-evidence"], ["Prospective validation", "/evidence/#prospective-validation"], ["Longitudinal evidence", "/evidence/longitudinal/"], ["Methods and provenance", "/platform/"]],
      question: "What replicated prospectively in PVC-01, and how does it compare with historical Core and longitudinal evidence? Report endpoint-specific directions and qualifications, including Walking→PT shock non-replication; do not assign a family-level pass."
    },
    transport: {
      title: "A mobility aid and a transport service solve different tasks.",
      context: "Start with the individual’s transportation history, or inspect the measured modes separately. Wheelchair use is not skating; bus, van, sedan/taxi, and SilverRide are not one pooled mode. Skates can remain worn during vehicle travel.",
      links: [["Transportation and access history", "/access/#transportation-environment"], ["Mode-specific evidence", "/evidence/transportation/"], ["Personal mobility story", "/story/"]],
      question: "How do mobility aids differ from transport modes in this case? Distinguish wheelchair/PT context, skating, motorcycle, paratransit bus, van, sedan/taxi, and SilverRide using available evidence. Do not assume skates were removed during vehicle travel or infer pain from telemetry."
    },
    recognition: {
      title: "Read the record, including what each decision does not establish.",
      context: "Troy’s personal account: public transportation refused skates on safety grounds without an initially usable alternative, so the motorcycle became part of his mobility solution. He pursued Civil Rights action to obtain ParaTransit access. Explore the documented DOT/FTA and BART history, physician and biomechanics support, DMV records, airline arrangements, and continuing disputes. Personal history, policy, legal arguments and setting-specific decisions are distinct—not universal approval or legal advice.",
      links: [["Documented recognition and access", "/access/"], ["The case and scoped decisions", "/case/"], ["History and source context", "/story/"]],
      question: "What documented recognition and access history exists for this mobility aid, including physician/biomechanics records, DOT/FTA, BART, DMV, and airlines? Distinguish source records, personal accounts, and setting-specific decisions; do not claim universal legal recognition."
    }
  };
  // The tour owns its presentation: homepage story sections are not required.
  // Reuse an older embedded panel when present, but otherwise create it here.
  const panel = document.getElementById("home-journey-panel") || document.createElement("section");
  if (!panel.id) {
    panel.id = "home-journey-panel";
    panel.className = "home-journey-panel";
    panel.hidden = true;
    panel.setAttribute("aria-labelledby", "home-journey-title");
    panel.innerHTML = '<h3 id="home-journey-title" tabindex="-1"></h3><p data-journey-context></p><nav class="home-journey-followups" aria-label="Explore this question" data-journey-links></nav><div data-guided-frame></div><p class="home-journey-feedback" role="status" aria-live="polite"></p><p><a data-demo-signin>Sign in for the guided demo</a></p><button class="home-journey-close" type="button">← All questions</button>';
  }
  const WELCOME_MODAL_STORAGE_KEY = "handicapskater_welcome_modal";
  const WELCOME_MODAL_VERSION = 2;
  const WELCOME_MODAL_EXPIRATION_MS = 30 * 24 * 60 * 60 * 1000;
  const heading = panel.querySelector("#home-journey-title");
  const feedback = panel.querySelector("[role=status]");
  const triggers = [...document.querySelectorAll('main [data-home-journey]')];
  const portal = "https://hs-portal-324477223314.us-central1.run.app";
  const entries = {walking:"PUBLIC_WALKING", rolling:"PUBLIC_SKATING", evidence:"PUBLIC_EVIDENCE", lifelong:"PUBLIC_LIFELONG_MOBILITY", recognition:"PUBLIC_LEGAL"};
  const guidedJourneys = [
    {key:"walking", title:"Why can’t he just walk?", subtitle:"Walking limits and everyday function", href:"/pain/"},
    {key:"rolling", title:"Why do skates help?", subtitle:"How controlled rolling changes the task", href:"/biomechanics/"},
    {key:"evidence", title:"Is there actual evidence?", subtitle:"From repeated comparisons to independent review", href:"/evidence/"},
    {key:"lifelong", title:"What does this mean for lifelong mobility?", subtitle:"Mobility should evolve with us", href:"/lifelong-mobility/"},
    {key:"recognition", title:"Is this legally recognized?", subtitle:"Documented decisions and their limits", href:"/access/"},
    {key:"accommodation", title:"I need a mobility-aid accommodation", subtitle:"Start a mobility-aid review →", href:"https://handicapskater.org/review-tools/"}
  ];
  const dialog = document.createElement("dialog");
  if (typeof dialog.showModal !== "function") return; // Reading links still work.
  dialog.id = "heroModal";
  dialog.className = "home-guided-dialog";
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-labelledby", "guided-tour-label");
  dialog.setAttribute("aria-describedby", "guided-tour-subtitle");
  dialog.innerHTML = '<header class="guided-modal-header"><button type="button" data-all-questions hidden>← All questions</button><div class="guided-modal-identity"><strong id="guided-tour-label">HANDICAPSKATER · GUIDED TOUR</strong><span id="guided-tour-subtitle">Watch the video. Read the Human Story. Or choose what you want to understand.</span></div><button type="button" data-modal-close aria-label="Close Guided Tour">Close ×</button></header><div class="guided-modal-scroll"><section data-modal-landing><h2 id="guided-modal-title" tabindex="-1">Riding a Motorcycle with Skates</h2><div class="guided-modal-hook"><div data-modal-video></div><div><p>My skates function as a prosthetic mobility device. Because of my disability, reaching down to remove them or put them back on is extremely painful.</p><p>Public transportation refused to let me ride with my skates, citing safety concerns, while initially providing no alternative transportation. I began riding a motorcycle with my skates because I still needed a way to get around.</p><p><strong class="guided-modal-continuity">Shop. Skate. Ride. Continuous mobility.</strong> The transportation changes, but my need for the mobility device doesn’t.</p><div class="guided-modal-actions"><a data-modal-video-text>Watch the public video ↗</a><a data-modal-story href="/#story">Read the Human Story →</a></div></div></div><h3>What do you want to understand?</h3><nav class="home-journey-grid" aria-label="Six guided perspectives" data-modal-choices></nav></section></div><div class="guided-modal-preference"><input type="checkbox" id="guided-modal-suppress"><label for="guided-modal-suppress">Don\'t show this again</label></div>';
  const landing = dialog.querySelector("[data-modal-landing]");
  const scroll = dialog.querySelector(".guided-modal-scroll");
  const allQuestions = dialog.querySelector("[data-all-questions]");
  const suppressAutoOpen = dialog.querySelector("#guided-modal-suppress");
  const opener = document.querySelector(".home-guided-open");
  const storyLink = dialog.querySelector("[data-modal-story]");
  const imageLink = document.createElement("a");
  imageLink.href = "https://www.reddit.com/r/HandicapSkater/s/6pPCv2k02t";
  imageLink.target = "_blank";
  imageLink.rel = "noopener noreferrer";
  const image = document.createElement("img");
  image.src = "/common/images/HandicapSkater-H2-Skates.png";
  image.alt = "Troy wearing inline skates while seated on his motorcycle";
  imageLink.append(image);
  imageLink.setAttribute("aria-label", "Watch Troy ride a motorcycle while wearing his mobility skates");
  dialog.querySelector("[data-modal-video]").append(imageLink);
  const videoText = dialog.querySelector("[data-modal-video-text]");
  videoText.href = imageLink.href; videoText.target = imageLink.target; videoText.rel = imageLink.rel;
  storyLink.addEventListener("click", event => {
    const story = document.getElementById("story");
    if (!story) return;
    event.preventDefault();
    window.history.pushState(window.history.state, "", "/#story");
    const storyHeading = story.querySelector("h1, h2");
    dialog.addEventListener("close", () => {
      if (storyHeading) {
        const hadTabindex = storyHeading.hasAttribute("tabindex");
        storyHeading.setAttribute("tabindex", "-1");
        storyHeading.focus({preventScroll:true});
        if (!hadTabindex) storyHeading.addEventListener("blur", () => storyHeading.removeAttribute("tabindex"), {once:true});
      }
      story.scrollIntoView({block:"start"});
    }, {once:true});
    dialog.close();
  });
  // Move, rather than duplicate, the existing client and its one shared iframe.
  scroll.append(panel);
  document.body.append(dialog);
  const menuLinks = guidedJourneys.map(journey => {
    const link = document.createElement("a");
    link.href = journey.href;
    link.dataset.homeJourney = journey.key;
    if (journey.key === "accommodation") link.className = "home-journey-accommodation";
    const title = document.createElement("strong"), subtitle = document.createElement("span");
    title.textContent = journey.title; subtitle.textContent = journey.subtitle;
    link.append(title, subtitle);
    dialog.querySelector("[data-modal-choices]").append(link);
    return link;
  });
  let frame = null, ready = false, initialEntry = null, activeKey = null;
  let activeTrigger = null, savedOverflow = "", backgroundState = [];
  function hasCurrentSuppression() {
    try {
      const preference = JSON.parse(window.localStorage.getItem(WELCOME_MODAL_STORAGE_KEY));
      const age = Date.now() - preference.suppressedAt;
      return preference.suppressAutoOpen === true && preference.version === WELCOME_MODAL_VERSION && Number.isFinite(preference.suppressedAt) && age >= 0 && age < WELCOME_MODAL_EXPIRATION_MS;
    } catch {
      return false;
    }
  }
  function saveSuppressionChoice() {
    try {
      if (suppressAutoOpen.checked) {
        if (!hasCurrentSuppression()) window.localStorage.setItem(WELCOME_MODAL_STORAGE_KEY, JSON.stringify({suppressAutoOpen:true, suppressedAt:Date.now(), version:WELCOME_MODAL_VERSION}));
      } else {
        window.localStorage.removeItem(WELCOME_MODAL_STORAGE_KEY);
      }
    } catch {}
  }
  function open(trigger) {
    if (!dialog.open) {
      activeTrigger = trigger && !dialog.contains(trigger) ? trigger : null;
      suppressAutoOpen.checked = hasCurrentSuppression();
      savedOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      backgroundState = [...document.body.children].filter(node => node !== dialog).map(node => [node, node.inert]);
      backgroundState.forEach(([node]) => { node.inert = true; });
      dialog.showModal();
    }
  }
  function landingView() {
    landing.hidden = false; panel.hidden = true; allQuestions.hidden = true;
    scroll.scrollTop = 0;
    dialog.querySelector("#guided-modal-title").focus({preventScroll:true});
  }
  function dismiss() {
    saveSuppressionChoice();
    dialog.close();
  }
  function restorePage() {
    if (dialog.open) return;
    document.body.style.overflow = savedOverflow;
    backgroundState.forEach(([node, inert]) => { node.inert = inert; });
    backgroundState = [];
    [...triggers, ...menuLinks].forEach(link => link.setAttribute("aria-expanded", "false"));
    if (activeTrigger) {
      activeTrigger.focus();
    } else {
      const main = document.getElementById("main");
      if (main) {
        const hadTabindex = main.hasAttribute("tabindex");
        main.setAttribute("tabindex", "-1");
        main.focus({preventScroll:true});
        if (!hadTabindex) main.addEventListener("blur", () => main.removeAttribute("tabindex"), {once:true});
      }
    }
  }
  dialog.addEventListener("close", restorePage);
  dialog.addEventListener("cancel", event => { event.preventDefault(); dismiss(); });
  dialog.querySelector("[data-modal-close]").addEventListener("click", dismiss);
  dialog.addEventListener("click", event => { if (event.target === dialog) dismiss(); });
  allQuestions.addEventListener("click", landingView);
  dialog.addEventListener("keydown", event => {
    if (event.key !== "Tab") return;
    const controls = [...dialog.querySelectorAll('button, a[href], input, iframe')].filter(node => node.getClientRects().length && !node.disabled);
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement.tabIndex === -1)) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first.focus();
    }
  });
  if (opener) {
    opener.hidden = false;
    opener.textContent = "Explore HandicapSkater";
    opener.setAttribute("aria-haspopup", "dialog");
    opener.setAttribute("aria-controls", dialog.id);
    opener.addEventListener("click", () => { open(opener); landingView(); });
  }
  document.addEventListener("click", event => {
    const manualOpener = event.target.closest("[data-welcome-modal]");
    if (!manualOpener || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    open(manualOpener);
    landingView();
  });
  suppressAutoOpen.addEventListener("change", saveSuppressionChoice);
  [...triggers, ...menuLinks].forEach(link => {
    const journey = journeys[link.dataset.homeJourney];
    if (!journey) return;
    link.setAttribute("role", "button");
    link.setAttribute("aria-controls", dialog.id);
    link.setAttribute("aria-haspopup", "dialog");
    link.setAttribute("aria-expanded", "false");
    link.addEventListener("keydown", event => {
      if (event.key === " ") { event.preventDefault(); link.click(); }
    });
    link.addEventListener("click", event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      open(link);
      [...triggers, ...menuLinks].forEach(item => item.setAttribute("aria-expanded", String(item.dataset.homeJourney === link.dataset.homeJourney)));
      heading.textContent = guidedJourneys.find(item => item.key === link.dataset.homeJourney).title;
      panel.querySelector("[data-journey-context]").textContent = journey.context;
      panel.querySelector("[data-journey-links]").replaceChildren(...journey.links.map(([label, href]) => {
        const anchor = document.createElement("a");
        anchor.href = href;
        anchor.textContent = label;
        if (href === "/#audience-routing") anchor.addEventListener("click", event => { event.preventDefault(); landingView(); });
        return anchor;
      }));
      feedback.textContent = "";
      panel.hidden = false;
      landing.hidden = true; allQuestions.hidden = false;
      const key = link.dataset.homeJourney;
      activeKey = key;
      const returnTo = window.location.origin + "/?journey=" + key + "#audience-routing";
      panel.querySelector("[data-demo-signin]").href = portal + "/signin?return_to=" + encodeURIComponent(returnTo);
      if (!frame) {
        initialEntry = key;
        frame = document.createElement("iframe"); frame.title = "Guided HandicapSkater experience";
        const requestedRoute = new URL(window.location.href).searchParams.get("route");
        frame.src = portal + "/embed/cx?parent_origin=" + encodeURIComponent(window.location.origin) + "&entry=" + entries[key] + (requestedRoute && /^[A-Z_]{1,50}$/.test(requestedRoute) ? "&route=" + requestedRoute : "");
        frame.referrerPolicy = "no-referrer"; frame.allow = "storage-access";
        frame.style.cssText = "width:100%;border:0;min-height:460px;display:none";
        panel.querySelector("[data-guided-frame]").append(frame);
      } else if (ready) frame.contentWindow.postMessage({type:"hs-journey", entry:entries[key]}, portal);
      panel.querySelector("[data-journey-context]").hidden = ready && key !== "recognition";
      panel.querySelector("[data-journey-links]").hidden = ready;
      heading.focus({ preventScroll: true });
      scroll.scrollTop = 0;
    });
  });
  panel.querySelector(".home-journey-close").textContent = "← All questions";
  panel.querySelector(".home-journey-close").addEventListener("click", landingView);
  window.addEventListener("message", (event) => {
    if (!frame || event.origin !== portal || event.source !== frame.contentWindow) return;
    if (event.data?.type === "hs-escape" && dialog.open) dismiss();
    if (event.data?.type === "hs-close" && dialog.open) landingView();
    if (event.data?.type === "hs-size" && Number.isFinite(event.data.height)) frame.style.height = Math.max(250, Math.min(4000, event.data.height + 24)) + "px";
    if (event.data?.type === "hs-ready") {
      ready = true; frame.style.display = "block";
      if (activeKey && activeKey !== initialEntry)
        frame.contentWindow.postMessage({type:"hs-journey", entry:entries[activeKey]}, portal);
      panel.querySelector("[data-journey-context]").hidden = activeKey !== "recognition";
      panel.querySelector("[data-journey-links]").hidden = true;
    }
  });
  const requestedUrl = new URL(window.location.href);
  const requested = requestedUrl.searchParams.get("journey");
  const welcomeRequested = requestedUrl.searchParams.get("welcome") === "1";
  if (entries[requested]) {
    (triggers.find(link => link.dataset.homeJourney === requested) || menuLinks.find(link => link.dataset.homeJourney === requested))?.click();
  } else if (welcomeRequested) {
    requestedUrl.searchParams.delete("welcome");
    window.history.replaceState(window.history.state, "", requestedUrl.pathname + requestedUrl.search + requestedUrl.hash);
    open(document.querySelector("[data-welcome-modal]") || null);
    landingView();
  } else if (!hasCurrentSuppression()) {
    requestAnimationFrame(() => { open(null); landingView(); });
  }
})();
