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
  const panel = document.getElementById("home-journey-panel");
  if (!panel) return;
  const heading = document.getElementById("home-journey-title");
  const feedback = panel.querySelector("[role=status]");
  const homeGrid = document.querySelector(".home-journey-grid");
  // Authored homepage links are the single source of labels, subtitles and
  // reading destinations, including the distinct .org accommodation handoff.
  const triggers = [...homeGrid.querySelectorAll("a")];
  const portal = "https://hs-portal-324477223314.us-central1.run.app";
  const entries = {walking:"PUBLIC_WALKING", rolling:"PUBLIC_SKATING", evidence:"PUBLIC_EVIDENCE", lifelong:"PUBLIC_LIFELONG_MOBILITY", recognition:"PUBLIC_LEGAL"};
  const guidedJourneys = triggers.map(link => ({link, key:link.dataset.homeJourney,
    entry:entries[link.dataset.homeJourney], title:link.querySelector("strong").textContent,
    subtitle:link.querySelector("span").textContent, href:link.href}));
  const dialog = document.createElement("dialog");
  if (typeof dialog.showModal !== "function") return; // Reading links still work.
  dialog.id = "heroModal";
  dialog.className = "home-guided-dialog";
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-labelledby", "guided-modal-title");
  dialog.innerHTML = '<header class="guided-modal-header"><button type="button" data-all-questions hidden>← All questions</button><span>HandicapSkater · Guided experience</span><button type="button" data-modal-close aria-label="Close guided experience">Close ×</button></header><div class="guided-modal-scroll"><section data-modal-landing><h2 id="guided-modal-title" tabindex="-1">Riding a Motorcycle with Skates</h2><div class="guided-modal-hook"><div data-modal-video></div><div><p>Public transportation refused to carry me with my skates because of safety concerns, initially offering no usable alternative. I began riding a motorcycle because I still needed a way to get around.</p><p>Shop. Skate. Ride. Continuous mobility. The skates stay with me because the mobility need doesn’t end at the motorcycle.</p><p>My skates function as a prosthetic mobility device. Reaching down to remove and put them on is painful because of my disability.</p><a data-modal-video-text>Watch the public video ↗</a></div></div><h3>What do you want to understand?</h3><nav class="home-journey-grid" aria-label="Six guided perspectives" data-modal-choices></nav></section></div>';
  const landing = dialog.querySelector("[data-modal-landing]");
  const scroll = dialog.querySelector(".guided-modal-scroll");
  const allQuestions = dialog.querySelector("[data-all-questions]");
  const opener = document.querySelector(".home-guided-open");
  const video = document.querySelector(".home-motorcycle-hook figure a");
  const imageLink = video.cloneNode(true);
  imageLink.setAttribute("aria-label", "Watch Troy ride a motorcycle while wearing his mobility skates");
  dialog.querySelector("[data-modal-video]").append(imageLink);
  const videoText = dialog.querySelector("[data-modal-video-text]");
  videoText.href = video.href; videoText.target = video.target; videoText.rel = video.rel;
  // Move, rather than duplicate, the existing client and its one shared iframe.
  scroll.append(panel);
  document.body.append(dialog);
  const menuLinks = guidedJourneys.map(journey => {
    const link = journey.link.cloneNode(true);
    dialog.querySelector("[data-modal-choices]").append(link);
    return link;
  });
  let frame = null, ready = false, initialEntry = null, activeKey = null;
  let activeTrigger = null, savedOverflow = "";
  function open(trigger) {
    if (!dialog.open) {
      activeTrigger = trigger;
      savedOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      dialog.showModal();
    }
  }
  function landingView() {
    landing.hidden = false; panel.hidden = true; allQuestions.hidden = true;
    dialog.setAttribute("aria-labelledby", "guided-modal-title");
    scroll.scrollTop = 0;
    dialog.querySelector("#guided-modal-title").focus({preventScroll:true});
  }
  function close() {
    dialog.close();
    restorePage();
  }
  function restorePage() {
    if (dialog.open) return;
    document.body.style.overflow = savedOverflow;
    [...triggers, ...menuLinks].forEach(link => link.setAttribute("aria-expanded", "false"));
    activeTrigger?.focus();
  }
  dialog.addEventListener("close", restorePage);
  dialog.addEventListener("cancel", event => { event.preventDefault(); close(); });
  dialog.querySelector("[data-modal-close]").addEventListener("click", close);
  allQuestions.addEventListener("click", landingView);
  dialog.addEventListener("keydown", event => {
    if (event.key !== "Tab") return;
    const controls = [...dialog.querySelectorAll('button, a[href], iframe')].filter(node => node.getClientRects().length && !node.disabled);
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement.tabIndex === -1)) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first.focus();
    }
  });
  opener.hidden = false;
  opener.setAttribute("aria-haspopup", "dialog");
  opener.addEventListener("click", () => { open(opener); landingView(); });
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
      dialog.setAttribute("aria-labelledby", heading.id);
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
    if (event.data?.type === "hs-escape" && dialog.open) close();
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
  const requested = new URL(window.location.href).searchParams.get("journey");
  if (entries[requested]) triggers.find(link => link.dataset.homeJourney === requested)?.click();
})();
