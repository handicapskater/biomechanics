# Video card pattern

Use the existing `.video-card` structure on `/videos/` for each approved public video.

Required fields:

- title;
- date, or the literal `Date not supplied` when the public source has no reviewed date;
- one approved category: Story, Access, Transportation, Movement, Routes, Evidence, or Documentary Record;
- one concise context summary;
- linked thumbnail treatment with an accessible watch label;
- transcript or summary availability;
- related canonical page;
- source platform;
- working public source URL.

Do not add a card until the public source URL is supplied and approved. Do not infer a date, invent a transcript, expose a private file, or replace an existing source link with a placeholder.

```html
<article class="video-card">
  <a class="video-card-thumbnail" href="APPROVED_PUBLIC_URL" target="_blank" rel="noopener noreferrer" aria-label="Watch VIDEO_TITLE on SOURCE_PLATFORM">
    <span class="video-card-category">APPROVED_CATEGORY</span>
    <span class="video-play" aria-hidden="true">▶</span>
  </a>
  <div class="video-card-body">
    <p class="video-card-meta"><time datetime="YYYY-MM-DD">REVIEWED_DATE</time> · APPROVED_CATEGORY</p>
    <h3>VIDEO_TITLE</h3>
    <p>CONCISE_CONTEXT</p>
    <dl>
      <dt>Summary</dt><dd>SUMMARY_OR_TRANSCRIPT_STATUS</dd>
      <dt>Related page</dt><dd><a href="CANONICAL_ROUTE">RELATED_PAGE</a></dd>
      <dt>Source</dt><dd>SOURCE_PLATFORM</dd>
    </dl>
    <a class="text-link" href="APPROVED_PUBLIC_URL" target="_blank" rel="noopener noreferrer">Watch the public video</a>
  </div>
</article>
```
