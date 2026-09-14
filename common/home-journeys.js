/* Guided reading and question preparation, not a scientific answer engine. */
(() => {
  "use strict";
  const journeys = {
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
      links: [["Historical Core", "#core-evidence"], ["Prospective validation", "/evidence/#prospective-validation"], ["Longitudinal evidence", "/evidence/longitudinal/"], ["Methods and provenance", "/platform/"]],
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
      context: "Explore physician and biomechanics documentation, DOT/FTA and BART history, DMV records, airline arrangements, and the continuing access problem. A setting-specific decision is not universal approval or legal advice.",
      links: [["Documented recognition and access", "/access/"], ["The case and scoped decisions", "/case/"], ["History and source context", "/story/"]],
      question: "What documented recognition and access history exists for this mobility aid, including physician/biomechanics records, DOT/FTA, BART, DMV, and airlines? Distinguish source records, personal accounts, and setting-specific decisions; do not claim universal legal recognition."
    }
  };
  const panel = document.getElementById("home-journey-panel");
  if (!panel) return;
  const heading = document.getElementById("home-journey-title");
  const question = document.getElementById("home-journey-question");
  const feedback = panel.querySelector("[role=status]");
  const triggers = [...document.querySelectorAll("[data-home-journey]")];
  let activeTrigger = null;
  function close() {
    panel.hidden = true;
    triggers.forEach(link => link.setAttribute("aria-expanded", "false"));
    activeTrigger?.focus();
  }
  triggers.forEach(link => {
    const journey = journeys[link.dataset.homeJourney];
    if (!journey) return;
    link.setAttribute("role", "button");
    link.setAttribute("aria-controls", panel.id);
    link.setAttribute("aria-expanded", "false");
    link.addEventListener("keydown", event => {
      if (event.key === " ") { event.preventDefault(); link.click(); }
    });
    link.addEventListener("click", event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      activeTrigger = link;
      triggers.forEach(item => item.setAttribute("aria-expanded", String(item === link)));
      heading.textContent = journey.title;
      panel.querySelector("[data-journey-context]").textContent = journey.context;
      panel.querySelector("[data-journey-links]").replaceChildren(...journey.links.map(([label, href]) => {
        const anchor = document.createElement("a");
        anchor.href = href;
        anchor.textContent = label;
        return anchor;
      }));
      question.value = journey.question;
      feedback.textContent = "";
      panel.querySelector("details").open = false;
      panel.hidden = false;
      heading.focus({ preventScroll: true });
      heading.scrollIntoView({ block: "start", behavior: "instant" });
    });
  });
  panel.querySelector(".home-journey-close").addEventListener("click", close);
  panel.addEventListener("keydown", event => { if (event.key === "Escape") close(); });
  panel.querySelector("[data-copy-journey]").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(question.value);
      feedback.textContent = "Question copied. Open Ask Evidence and paste it into the question box.";
    } catch {
      question.focus();
      question.select();
      feedback.textContent = "Select and copy the question above, then paste it into Ask Evidence.";
    }
  });
})();
