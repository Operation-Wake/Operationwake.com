<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="Operation Wake is a family mission built around faith, freedom, education, exploration, and the journey toward life on the water." />
  <title>Operation Wake | Leave More Than a Wake</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <header class="site-header">
    <a class="brand" href="#top" aria-label="Operation Wake home">
      <img src="assets/operation-wake-logo.png" alt="Operation Wake logo" />
      <span>OPERATION WAKE</span>
    </a>

    <button class="menu-toggle" aria-label="Open navigation" aria-expanded="false">☰</button>

    <nav class="nav-links" aria-label="Primary navigation">
      <a href="#mission">Mission</a>
      <a href="#journey">Journey</a>
      <a href="#watch">Watch</a>
      <a href="#support">Support</a>
    </nav>
  </header>

  <main id="top">
    <section class="hero">
      <div class="hero-overlay"></div>
      <div class="hero-grid"></div>

      <div class="hero-content">
        <p class="eyebrow">A FAMILY MISSION IN MOTION</p>
        <img class="hero-logo" src="assets/operation-wake-logo.png" alt="Operation Wake emblem" />
        <h1>LEAVE MORE THAN A WAKE.</h1>
        <p class="hero-copy">
          We are building a future shaped by faith, family, freedom, education, and life on the water.
          This is the story of how we get there.
        </p>
        <div class="hero-actions">
          <a class="button button-primary" href="#journey">Enter the Journey</a>
          <a class="button button-secondary" href="#watch">Watch the Story</a>
        </div>
      </div>

      <a class="scroll-cue" href="#mission" aria-label="Scroll to mission">
        <span>SCROLL</span>
        <span class="scroll-line"></span>
      </a>
    </section>

    <section id="mission" class="section section-light">
      <div class="section-heading">
        <p class="eyebrow dark">WHY WE STARTED</p>
        <h2>The journey begins before the boat.</h2>
      </div>

      <div class="mission-grid">
        <div class="mission-copy">
          <p>
            Operation Wake follows one family as we simplify our lives, strengthen our finances,
            learn the skills of seamanship, and work toward a future of exploration and education afloat.
          </p>
          <p>
            We are not waiting for life to happen to us. We are building it deliberately, one decision,
            one sacrifice, and one mile at a time.
          </p>
        </div>

        <aside class="mission-card">
          <span class="card-number">01</span>
          <h3>Our North Star</h3>
          <p>
            Create a life where our children learn from the world itself, where family time is protected,
            and where adventure becomes part of the curriculum.
          </p>
        </aside>
      </div>
    </section>

    <section id="journey" class="section section-dark">
      <div class="section-heading">
        <p class="eyebrow">MISSION STATUS</p>
        <h2>Every voyage has a departure date.</h2>
      </div>

      <div class="countdown-panel">
        <div class="countdown-copy">
          <span class="status-pill">TARGET DEPARTURE</span>
          <h3>January 1, 2032</h3>
          <p>
            The countdown is not pressure. It is a compass. Every day between now and then is part of the story.
          </p>
        </div>

        <div class="countdown" aria-label="Countdown to January 1, 2032">
          <div><strong id="days">0</strong><span>Days</span></div>
          <div><strong id="hours">0</strong><span>Hours</span></div>
          <div><strong id="minutes">0</strong><span>Minutes</span></div>
          <div><strong id="seconds">0</strong><span>Seconds</span></div>
        </div>
      </div>

      <div class="progress-grid">
        <article>
          <span>01</span>
          <h3>Prepare</h3>
          <p>Reduce debt, grow income, build the platform, and protect the family plan.</p>
        </article>
        <article>
          <span>02</span>
          <h3>Learn</h3>
          <p>Gain sailing experience, complete training, inspect boats, and sharpen seamanship.</p>
        </article>
        <article>
          <span>03</span>
          <h3>Launch</h3>
          <p>Acquire the right boat, begin coastal cruising, and let the classroom widen to the horizon.</p>
        </article>
      </div>
    </section>

    <section id="watch" class="section section-light">
      <div class="section-heading split-heading">
        <div>
          <p class="eyebrow dark">FOLLOW THE BUILD</p>
          <h2>The story is already underway.</h2>
        </div>
        <a class="text-link" href="#" aria-label="YouTube link placeholder">YouTube channel coming soon ↗</a>
      </div>

      <div class="video-placeholder">
        <div class="play-button">▶</div>
        <div>
          <p class="eyebrow">LATEST EPISODE</p>
          <h3>Welcome to Operation Wake</h3>
          <p>Our first episode will live here once the channel launches.</p>
        </div>
      </div>
    </section>

    <section id="support" class="section support-section">
      <div class="support-content">
        <p class="eyebrow">JOIN THE CREW</p>
        <h2>Help us turn the horizon into a home.</h2>
        <p>
          Follow the mission, share the story, wear the mark, or connect with us through real estate.
          Every contribution to the journey moves the wake a little farther.
        </p>
        <div class="hero-actions">
          <a class="button button-primary" href="mailto:hello@operationwake.com">Contact Operation Wake</a>
          <a class="button button-secondary" href="#">Merch store coming soon</a>
        </div>
      </div>
    </section>
  </main>

  <footer>
    <div class="footer-brand">
      <img src="assets/operation-wake-logo.png" alt="" />
      <div>
        <strong>OPERATION WAKE</strong>
        <span>Leave More Than a Wake.</span>
      </div>
    </div>
    <p>© <span id="year"></span> Operation Wake. All rights reserved.</p>
  </footer>

  <script src="script.js"></script>
</body>
</html>
