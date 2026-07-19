(function () {
  const host = window.location.hostname.replace(/^www\./, "");
  const mount = document.getElementById("site-footer");
  if (!mount) return;

  const footers = {
    "handicapskater.com": `
<style type="text/css">
.linkedin-link {
  position: relative;
  top: -5px;
}
.social-icon {
  width: 22px;
  height: 22px;
  fill: currentColor;
}
.small-caps {
  font-variant: small-caps;
  font-variant-caps: small-caps;
  letter-spacing: 0.05em;
}
</style>
<footer class="site-footer">
    <div class="footer-inner">
    <nav class="footer-nav" aria-label="Footer navigation">
      <a href="/story/">Story</a>
      <a href="/biomechanics/">Movement</a>
      <a href="/evidence/">Evidence</a>
      <a href="/access/">Access</a>
      <a href="/platform/">Evidence Observatory</a>
      <a href="/health-ai/">Health AI</a>
      <a href="https://handicapskater.org/standards/" target="_blank" rel="noopener noreferrer">Standards &amp; Reviewer Guidance</a>
    </nav>
    <div class="footer-social" aria-label="Support and social links">
      <a href="https://www.gofundme.com/f/handicapskater-revolutionizing-health-mobility-through-ai" target="_blank" rel="noopener noreferrer">
        <svg xmlns="http://www.w3.org/2000/svg"
             width="24"
             height="24"
             viewBox="0 0 48 48"
             aria-label="GoFundMe style icon">
        
          <circle cx="24" cy="24" r="24" fill="#02A95C"/>
        
          <path fill="#FFFFFF"
                d="M24 35.2s-11-6.8-11-14.1c0-4.2 3.1-7.1 7-7.1
                   2.2 0 3.4 1.1 4 2.2.6-1.1 1.8-2.2 4-2.2
                   3.9 0 7 2.9 7 7.1 0 7.3-11 14.1-11 14.1z"/>
        </svg>
      </a>
      <a href="http://www.facebook.com/group.php?gid=44036411369" target="_blank" rel="noopener noreferrer">
        <svg xmlns="http://www.w3.org/2000/svg"
             width="24"
             height="24"
             viewBox="0 0 24 24"
             aria-label="Facebook">
          <circle cx="12" cy="12" r="12" fill="#1877F2"/>
          <path fill="#FFFFFF"
                d="M13.67 24V14.71h3.12l.47-3.62h-3.59V8.78c0-1.05.29-1.76 1.8-1.76H17.4V3.78c-.33-.04-1.46-.14-2.77-.14-2.74 0-4.62 1.67-4.62 4.75v2.7H6.9v3.62h3.11V24h3.66z"/>
        </svg>
      </a>
      <a href="https://twitter.com/handicapskater" target="_blank" rel="noopener noreferrer">
        <svg xmlns="http://www.w3.org/2000/svg"
             viewBox="0 0 1200 1227"
             width="24"
             height="24"
             fill="currentColor">
          <path d="M714.163 519.284L1160.89 0H1055.36L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.528L515.239 750.594L842.672 1226.37H1200L714.137 519.284H714.163ZM568.71 688.315L521.397 620.617L145.224 82.7532H307.849L611.396 516.983L658.709 584.681L1055.41 1151.89H892.787L568.71 688.341V688.315Z"/>
        </svg>
      </a>
      <a href="https://www.youtube.com/channel/UCv8NPazTzuPxE_YM8-MIReQ" alt="YouTube" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
        <svg xmlns="http://www.w3.org/2000/svg"
             viewBox="0 0 24 24"
             width="24"
             height="24"
             fill="currentColor"
             aria-label="YouTube">
          <path d="M23.5 6.2a2.9 2.9 0 0 0-2-2C19.7 3.7 12 3.7 12 3.7s-7.7 0-9.5.5a2.9 2.9 0 0 0-2 2A30.2 30.2 0 0 0 0 12a30.2 30.2 0 0 0 .5 5.8 2.9 2.9 0 0 0 2 2c1.8.5 9.5.5 9.5.5s7.7 0 9.5-.5a2.9 2.9 0 0 0 2-2A30.2 30.2 0 0 0 24 12a30.2 30.2 0 0 0-.5-5.8zM9.8 15.5V8.5L16 12l-6.2 3.5z"/>
        </svg>
      </a>
      <a href="https://rumble.com/c/c-1635644" target="_blank" rel="noopener noreferrer">
        <svg xmlns="http://www.w3.org/2000/svg"
             viewBox="0 0 24 24"
             width="24"
             height="24"
             fill="currentColor">
          <path d="M14.4528 13.5458c.8064-.6542.9297-1.8381.2756-2.6445a1.8802 1.8802 0 0 0-.2756-.2756 21.2127 21.2127 0 0 0-4.3121-2.776c-1.066-.51-2.256.2-2.4261 1.414a23.5226 23.5226 0 0 0-.14 5.5021c.116 1.23 1.292 1.964 2.372 1.492a19.6285 19.6285 0 0 0 4.5062-2.704v-.008zm6.9322-5.4002c2.0335 2.228 2.0396 5.637.014 7.8723A26.1487 26.1487 0 0 1 8.2946 23.846c-2.6848.6713-5.4168-.914-6.1662-3.5781-1.524-5.2002-1.3-11.0803.17-16.3045.772-2.744 3.3521-4.4661 6.0102-3.832 4.9242 1.174 9.5443 4.196 13.0764 8.0121v.002z"/>
        </svg>
      </a>
      <a href="https://instagram.com/handicapskater" target="_blank" rel="noopener noreferrer">
      <svg xmlns="http://www.w3.org/2000/svg"
           viewBox="0 0 24 24"
           width="24"
           height="24"
           fill="currentColor">
        <path d="M7.75 2C4.57 2 2 4.57 2 7.75v8.5C2 19.43 4.57 22 7.75 22h8.5C19.43 22 22 19.43 22 16.25v-8.5C22 4.57 19.43 2 16.25 2h-8.5zm0 2h8.5A3.75 3.75 0 0 1 20 7.75v8.5A3.75 3.75 0 0 1 16.25 20h-8.5A3.75 3.75 0 0 1 4 16.25v-8.5A3.75 3.75 0 0 1 7.75 4zm8.75 1a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5zM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"/>
      </svg>
      </a>
      <a
        href="https://www.linkedin.com/company/103320223/"
        class="social-link linkedin-link"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Visit LinkedIn profile"
      >
        <svg
          class="social-icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.95v5.66H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.32 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.1 20.45H3.54V9H7.1v11.45ZM22.23 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.21 0 22.23 0Z"
          />
        </svg>
      </a>      
    </div>

    <p class="footer-copy">Copyright © 2004 to 2026 <span class="small-caps">HandicapSkater</span>.</p>
    <p class="footer-description"><span class="small-caps">HandicapSkater</span> separates physiologic burden, mechanical motion exposure, and body coupling so mobility aid review can preserve context. This site presents an individual within person evidence record and public case study.</p>
  </div>
</footer>
`,
    "handicapskater.org": `
<footer class="site-footer">
  <div class="footer-inner">
    <nav class="footer-nav" aria-label="Footer navigation">
      <a href="/">Home</a>
      <a href="/standards.html">Standards</a>
      <a href="/non-standard-mobility-aids.html">Mobility Review</a>
      <a href="/evidence-standards.html">Evidence</a>
      <a href="/fsi-css-platform.html">FSI/CSS</a>
      <a href="/references.html">References</a>
    </nav>

    <div class="footer-social">
      <a href="https://handicapskater.com/" target="_blank" rel="noopener noreferrer">Case Study</a>
    </div>

    <p class="footer-copy">Copyright © 2004 to 2026 <span class="small-caps">HandicapSkater</span>.org.</p>
    <p class="footer-description"><span class="small-caps">HandicapSkater</span> separates physiologic burden, mechanical motion exposure, and body coupling so mobility aid review can preserve context. This site presents generalized review standards and evidence frameworks.</p>
  </div>
</footer>
`
  };

  mount.innerHTML = footers[host] || footers["handicapskater.com"];
})();
