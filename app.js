const events = [
  {
    id: "food-pantry",
    icon: "▣",
    title: "Food Pantry Shift",
    organizer: "New River Community Action",
    verified: true,
    date: "Saturday, Nov. 21",
    time: "10:00 AM–12:00 PM",
    duration: "2 hours",
    travel: "12-minute walk",
    transport: "Walkable",
    spots: 4,
    category: "Food support",
    description: "Sort donated food and prepare family pickup boxes with a small volunteer team.",
    attire: "Comfortable clothes",
    meeting: "Main lobby welcome desk"
  },
  {
    id: "church-cleanup",
    icon: "⌂",
    title: "Community Center Cleanup",
    organizer: "Blacksburg Community Church",
    verified: true,
    date: "Saturday, Nov. 21",
    time: "1:00–3:00 PM",
    duration: "2 hours",
    travel: "10-minute walk",
    transport: "Walkable",
    spots: 0,
    category: "Community cleanup",
    description: "Move donation boxes, organize recreation supplies, and reset shared rooms for weekend programs.",
    attire: "Closed-toe shoes required",
    meeting: "Recreation entrance • blue welcome sign"
  },
  {
    id: "park-restoration",
    icon: "♣",
    title: "Park Restoration Morning",
    organizer: "Friends of Blacksburg Parks",
    verified: false,
    date: "Sunday, Nov. 22",
    time: "9:00 AM–12:00 PM",
    duration: "3 hours",
    travel: "18 minutes by bus",
    transport: "Bus route",
    spots: 9,
    category: "Outdoor",
    description: "Remove invasive plants and refresh trail markers with the parks volunteer crew.",
    attire: "Long pants and sturdy shoes",
    meeting: "Shelter 2 near the north entrance"
  }
];

const state = {
  view: "discover",
  activeEventId: "church-cleanup",
  filters: { query: "", day: "Saturday", duration: "Under 3 hours", transport: "Walkable" },
  saved: new Set(),
  accountCreated: false,
  waitlisted: false,
  spotAvailable: false,
  registered: false
};

const app = document.querySelector("#app");
const toast = document.querySelector("#toast");

function activeEvent() {
  return events.find((event) => event.id === state.activeEventId) || events[1];
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  }[char]));
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => toast.classList.remove("show"), 2600);
}

function setView(view, options = {}) {
  state.view = view;
  if (options.eventId) state.activeEventId = options.eventId;
  window.location.hash = view;
  render();
  // Each prototype screen starts at its heading. Immediate scrolling avoids
  // carrying a previous screen's position into the next task step.
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  requestAnimationFrame(() => app.focus({ preventScroll: true }));
}

function updateNavigation() {
  const navMap = {
    discover: "discover",
    details: "discover",
    waitlist: "discover",
    account: "profile",
    "waitlist-confirmed": "my-events",
    "spot-open": "my-events",
    registration: "my-events",
    preparation: "my-events",
    arrival: "my-events",
    saved: "saved",
    "my-events": "my-events",
    profile: "profile"
  };
  const current = navMap[state.view] || "discover";
  document.querySelectorAll("[data-nav]").forEach((button) => {
    if (button.dataset.nav === current) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
}

function render() {
  const views = {
    discover: renderDiscover,
    details: renderDetails,
    waitlist: renderWaitlist,
    account: renderAccount,
    "waitlist-confirmed": renderWaitlistConfirmed,
    "spot-open": renderSpotOpen,
    registration: renderRegistration,
    preparation: renderPreparation,
    arrival: renderArrival,
    saved: renderSaved,
    "my-events": renderMyEvents,
    profile: renderProfile
  };
  app.innerHTML = (views[state.view] || renderDiscover)();
  updateNavigation();
}

function renderDiscover() {
  const query = state.filters.query.toLowerCase().trim();
  const filtered = events.filter((event) => {
    const matchesQuery = !query || `${event.title} ${event.organizer} ${event.category}`.toLowerCase().includes(query);
    const matchesDay = state.filters.day === "Any day" || event.date.startsWith(state.filters.day);
    const matchesDuration = state.filters.duration === "Any length" ||
      (state.filters.duration === "Under 3 hours" && Number(event.duration[0]) < 3) ||
      (state.filters.duration === "3 hours or more" && Number(event.duration[0]) >= 3);
    const matchesTransport = state.filters.transport === "Any option" || event.transport === state.filters.transport;
    return matchesQuery && matchesDay && matchesDuration && matchesTransport;
  });

  return `
    <section class="page-shell">
      <div class="hero">
        <div>
          <p class="eyebrow">One place to find your place</p>
          <h1>A free Saturday can become something meaningful.</h1>
          <p>Find local opportunities with the schedule, transportation, attire, and arrival details you need before committing.</p>
        </div>
        <div class="hero-stat-grid" aria-label="Platform highlights">
          <div class="hero-stat"><span aria-hidden="true">⌖</span><span><strong>Near campus</strong><small>Travel information on every event</small></span></div>
          <div class="hero-stat"><span aria-hidden="true">✓</span><span><strong>Clear expectations</strong><small>Attire, supplies, and meeting points</small></span></div>
          <div class="hero-stat"><span aria-hidden="true">◉</span><span><strong>Current capacity</strong><small>Spots and waitlist status up front</small></span></div>
        </div>
      </div>
    </section>

    <form class="search-panel" id="filter-form" aria-label="Filter volunteer events">
      <div class="search-grid">
        <div class="field">
          <label for="query">Search opportunities</label>
          <input id="query" name="query" type="search" value="${escapeHtml(state.filters.query)}" placeholder="Try food pantry or cleanup">
        </div>
        <div class="field">
          <label for="day">Day</label>
          <select id="day" name="day">${optionList(["Any day", "Saturday", "Sunday"], state.filters.day)}</select>
        </div>
        <div class="field">
          <label for="duration">Time commitment</label>
          <select id="duration" name="duration">${optionList(["Any length", "Under 3 hours", "3 hours or more"], state.filters.duration)}</select>
        </div>
        <div class="field">
          <label for="transport">Transportation</label>
          <select id="transport" name="transport">${optionList(["Any option", "Walkable", "Bus route"], state.filters.transport)}</select>
        </div>
        <button class="btn btn-primary" type="submit">Show events</button>
      </div>
    </form>

    <section class="page-shell" aria-labelledby="event-heading">
      <div class="section-header">
        <div><h2 id="event-heading">Opportunities that fit</h2><p>Browse freely—no account or club connection required.</p></div>
        <span class="result-count">${filtered.length} result${filtered.length === 1 ? "" : "s"}</span>
      </div>
      ${filtered.length ? `<div class="event-grid">${filtered.map(renderEventCard).join("")}</div>` : `
        <div class="empty-state"><span aria-hidden="true">⌕</span><h2>No matching events</h2><p>Try expanding a filter to see more opportunities.</p><button class="btn btn-secondary" type="button" data-action="reset-filters">Reset filters</button></div>`}
    </section>`;
}

function optionList(options, selected) {
  return options.map((option) => `<option ${option === selected ? "selected" : ""}>${escapeHtml(option)}</option>`).join("");
}

function renderEventCard(event) {
  const saved = state.saved.has(event.id);
  return `
    <article class="event-card">
      <div class="event-art">
        <span class="event-icon" aria-hidden="true">${event.icon}</span>
        <span class="availability ${event.spots === 0 ? "full" : ""}">${event.spots === 0 ? "Event full" : `${event.spots} spots left`}</span>
      </div>
      <div class="event-body">
        ${event.verified ? `<span class="verified">✓ Verified organizer</span>` : `<span class="tag">Verification pending</span>`}
        <h3>${event.title}</h3>
        <p class="organizer">${event.organizer}</p>
        <ul class="meta-list">
          <li><strong>${event.date}</strong>Date</li>
          <li><strong>${event.time}</strong>Time</li>
          <li><strong>${event.travel}</strong>Travel</li>
          <li><strong>${event.duration}</strong>Commitment</li>
        </ul>
        <div class="event-actions">
          <button class="btn btn-primary" type="button" data-action="view-event" data-event-id="${event.id}">View details</button>
          <button class="save-button" type="button" data-action="save-event" data-event-id="${event.id}" aria-pressed="${saved}" aria-label="${saved ? "Remove from" : "Add to"} saved events">${saved ? "♥" : "♡"}</button>
        </div>
      </div>
    </article>`;
}

function renderDetails() {
  const event = activeEvent();
  const isTarget = event.id === "church-cleanup";
  return `
    <section class="page-shell">
      <button class="back-button" type="button" data-nav="discover">← Back to opportunities</button>
      <div class="detail-layout">
        <div>
          <article class="panel">
            <p class="eyebrow">${event.category}</p>
            <h1 class="detail-title">${event.title}</h1>
            <p class="organizer">Hosted by ${event.organizer}</p>
            <div class="tag-row">
              ${event.verified ? `<button class="tag green" type="button" data-action="explain-verification">✓ Verified organizer</button>` : `<span class="tag">Verification pending</span>`}
              <span class="tag maroon">First-time friendly</span>
              <span class="tag">${event.transport}</span>
            </div>
            <p>${event.description}</p>
            <div class="detail-grid">
              <div class="detail-item"><small>Date and time</small><strong>${event.date}<br>${event.time}</strong></div>
              <div class="detail-item"><small>Total commitment</small><strong>${event.duration}</strong></div>
              <div class="detail-item"><small>Transportation</small><strong>${event.travel}<br>${event.transport}</strong></div>
              <div class="detail-item"><small>What to wear</small><strong>${event.attire}</strong></div>
              <div class="detail-item"><small>Address</small><strong>725 Patrick Henry Drive</strong></div>
              <div class="detail-item"><small>Meeting point</small><strong>${event.meeting}</strong></div>
            </div>
          </article>
          <article class="panel">
            <h2>What you will do</h2>
            <ul class="check-list">
              <li><span class="check-icon">✓</span><span>Move and sort lightweight donation boxes.</span></li>
              <li><span class="check-icon">✓</span><span>Organize supplies with a small volunteer team.</span></li>
              <li><span class="check-icon">✓</span><span>Reset shared rooms before weekend programs.</span></li>
            </ul>
          </article>
        </div>

        <aside>
          <div class="panel sticky-card">
            <p class="eyebrow">Registration status</p>
            <div class="status-number">${event.spots}</div>
            <h2>${event.spots === 0 ? "No spots left" : "spots available"}</h2>
            <p>${event.spots === 0 ? "The event is full, but you can join the waitlist and receive an update if a spot opens." : "Registration is open. Confirm the details before reserving your spot."}</p>
            <div class="price-line"><span>Registration deadline</span><strong>Friday, 6:00 PM</strong></div>
            <div class="price-line"><span>Cancellation policy</span><strong>Cancel up to 12 hours before</strong></div>
            <div class="action-stack">
              ${isTarget ? `<button class="btn btn-primary btn-wide" type="button" data-action="join-waitlist">Join waitlist</button>` : `<button class="btn btn-primary btn-wide" type="button" data-action="open-registration">Register</button>`}
              <button class="btn btn-secondary btn-wide" type="button" data-action="contact-organizer">Contact organizer</button>
            </div>
          </div>
        </aside>
      </div>
    </section>`;
}

function renderWaitlist() {
  const event = activeEvent();
  return flowPage(2, `
    <p class="eyebrow">Before you join</p>
    <h1>Know what the waitlist means.</h1>
    <p>The event is full. Joining saves your place in line and lets the organizer notify you if a spot opens.</p>
    <div class="choice-card"><h3>${event.title}</h3><p>${event.date} • ${event.time}</p></div>
    <div class="info-callout warning"><h3>You would be third in line</h3><p>A place is not guaranteed. If a spot opens, you will have until the stated deadline to respond.</p></div>
    <div class="action-stack">
      <button class="btn btn-primary btn-wide" type="button" data-action="continue-account">Continue to account</button>
      <button class="btn btn-secondary btn-wide" type="button" data-action="back-details">Not now</button>
    </div>`);
}

function renderAccount() {
  return flowPage(3, `
    <p class="eyebrow">Account required at action point</p>
    <h1>Save your waitlist position.</h1>
    <p>You can browse without an account. We only ask for one now so your place and notifications can be connected to you.</p>
    <form id="account-form" class="form-grid">
      <div class="field"><label for="name">Name</label><input id="name" name="name" autocomplete="name" value="Guest User" required></div>
      <div class="field"><label for="email">Virginia Tech email</label><input id="email" name="email" type="email" autocomplete="email" value="guest@vt.edu" required></div>
      <div class="field"><label for="password">Password</label><input id="password" name="password" type="password" value="prototype" required></div>
      <button class="btn btn-purple btn-wide" type="submit">Create account and join</button>
    </form>
    <p class="prototype-note"><strong>Prototype note:</strong> This form does not store or send information. It demonstrates when an account would be requested.</p>`);
}

function renderWaitlistConfirmed() {
  return flowPage(4, `
    <div class="success-mark" aria-hidden="true">✓</div>
    <div class="centered">
      <p class="eyebrow">Waitlist confirmed</p>
      <h1>You are in line.</h1>
      <p>Your position is saved for Community Center Cleanup.</p>
      <div class="position-badge" aria-label="Waitlist position 3">3</div>
    </div>
    <div class="timeline">
      <div class="timeline-item"><div class="timeline-dot">✓</div><div><h3>Waitlist joined</h3><p>We saved your position and notification preference.</p></div></div>
      <div class="timeline-item pending"><div class="timeline-dot">2</div><div><h3>Wait for an opening</h3><p>You do not need to keep checking the event page.</p></div></div>
      <div class="timeline-item pending"><div class="timeline-dot">3</div><div><h3>Respond before the deadline</h3><p>If a spot opens, confirm it before the offer expires.</p></div></div>
    </div>
    <div class="action-stack">
      <button class="btn btn-primary btn-wide" type="button" data-action="simulate-opening">Prototype: simulate a spot opening</button>
      <button class="btn btn-secondary btn-wide" type="button" data-nav="my-events">View My Events</button>
    </div>`);
}

function renderSpotOpen() {
  const event = activeEvent();
  return flowPage(5, `
    <p class="eyebrow">A spot is available</p>
    <h1>Your wait is over.</h1>
    <p>A place opened for ${event.title}. Confirm it before the offer moves to the next person.</p>
    <div class="choice-card"><h3>Respond by 6:00 PM today</h3><p>${event.date} • ${event.time} • ${event.travel}</p></div>
    <div class="info-callout danger"><h3>Your waitlist position expires after the deadline</h3><p>Declining or missing the deadline removes you from this event’s waitlist.</p></div>
    <div class="action-stack">
      <button class="btn btn-primary btn-wide" type="button" data-action="claim-spot">Claim this spot</button>
      <button class="btn btn-secondary btn-wide" type="button" data-action="decline-spot">Decline</button>
    </div>`);
}

function renderRegistration() {
  const event = activeEvent();
  return flowPage(6, `
    <p class="eyebrow">Final confirmation</p>
    <h1>Confirm your spot.</h1>
    <p>Review the event and choose how you want to receive urgent updates.</p>
    <div class="choice-card"><h3>${event.title}</h3><p>${event.date} • ${event.time}<br>${event.travel} • ${event.attire}</p></div>
    <form id="registration-form" class="form-grid">
      <label class="choice-card"><input type="checkbox" checked> Email confirmation and reminder</label>
      <label class="choice-card"><input type="checkbox"> Optional urgent text updates</label>
      <button class="btn btn-primary btn-wide" type="submit">Confirm registration</button>
    </form>`);
}

function renderPreparation() {
  const event = activeEvent();
  return `
    <section class="page-shell">
      <div class="page-heading"><p class="eyebrow">My Event • Tomorrow</p><h1>You are registered.</h1><p>The event page now prioritizes preparation so the most important information is easy to find again.</p></div>
      <div class="info-callout success"><h3>✓ ${event.title} is confirmed</h3><p>${event.date} from ${event.time}. A reminder will be sent to your selected email.</p></div>
      <div class="prep-layout">
        <article class="panel">
          <h2>What to bring</h2>
          <ul class="check-list">
            <li><span class="check-icon">✓</span><span><strong>Closed-toe shoes</strong><br>Required for moving boxes.</span></li>
            <li><span class="check-icon">○</span><span><strong>Water bottle</strong><br>Recommended for the two-hour shift.</span></li>
            <li><span class="check-icon">✓</span><span><strong>Gloves</strong><br>The organizer will provide them.</span></li>
          </ul>
        </article>
        <article class="panel">
          <h2>Plan your trip</h2>
          <div class="detail-grid">
            <div class="detail-item"><small>Address</small><strong>725 Patrick Henry Drive</strong></div>
            <div class="detail-item"><small>Walking time</small><strong>10 minutes from campus</strong></div>
            <div class="detail-item"><small>Entrance</small><strong>Recreation entrance</strong></div>
            <div class="detail-item"><small>Meet at</small><strong>Blue welcome sign</strong></div>
          </div>
        </article>
      </div>
      <div class="action-stack">
        <button class="btn btn-primary" type="button" data-action="open-arrival">Open arrival view</button>
        <button class="btn btn-secondary" type="button" data-action="contact-organizer">Contact organizer</button>
      </div>
    </section>`;
}

function renderArrival() {
  return `
    <section class="page-shell">
      <button class="back-button" type="button" data-action="back-preparation">← Back to preparation</button>
      <div class="detail-layout">
        <article class="panel">
          <p class="eyebrow">Today • Community Center Cleanup</p>
          <h1 class="detail-title">You are almost there.</h1>
          <p>Use the recreation entrance and look for the blue welcome sign. Alex will check you in with the volunteer group.</p>
          <div class="map-card" role="img" aria-label="Simplified route to the recreation entrance">
            <div class="map-route"></div><div class="map-pin"><span>•</span></div><div class="map-label">Recreation entrance</div>
          </div>
        </article>
        <aside class="panel sticky-card">
          <p class="eyebrow">Arrival instruction</p>
          <h2>Meet at the blue welcome sign</h2>
          <div class="price-line"><span>Arrive by</span><strong>12:50 PM</strong></div>
          <div class="price-line"><span>Check-in contact</span><strong>Alex • Organizer</strong></div>
          <div class="price-line"><span>Entrance</span><strong>Recreation entrance</strong></div>
          <div class="action-stack">
            <button class="btn btn-primary btn-wide" type="button" data-action="directions">Open directions</button>
            <button class="btn btn-secondary btn-wide" type="button" data-action="contact-organizer">Contact Alex</button>
          </div>
        </aside>
      </div>
    </section>`;
}

function flowPage(step, content) {
  return `<section class="flow-shell"><div class="stepper" aria-label="Prototype progress">${Array.from({ length: 6 }, (_, index) => `<span class="${index < step ? "done" : ""}"></span>`).join("")}</div><div class="flow-card">${content}</div></section>`;
}

function renderSaved() {
  const savedEvents = events.filter((event) => state.saved.has(event.id));
  return `<section class="page-shell"><div class="page-heading"><p class="eyebrow">Saved opportunities</p><h1>Come back when you are ready.</h1><p>Saving an event does not register you or reserve a spot.</p></div>${savedEvents.length ? `<div class="event-grid">${savedEvents.map(renderEventCard).join("")}</div>` : `<div class="empty-state"><span aria-hidden="true">♡</span><h2>No saved events yet</h2><p>Use the heart button while browsing to keep an opportunity here.</p><button class="btn btn-primary" type="button" data-nav="discover">Browse events</button></div>`}</section>`;
}

function renderMyEvents() {
  if (state.registered) return renderPreparation();
  if (state.spotAvailable) return renderSpotOpen();
  if (state.waitlisted) return renderWaitlistConfirmed();
  return `<section class="page-shell"><div class="page-heading"><p class="eyebrow">My Events</p><h1>Your volunteer plans, in one place.</h1></div><div class="empty-state"><span aria-hidden="true">✓</span><h2>No active events</h2><p>Registered events and waitlist updates will appear here.</p><button class="btn btn-primary" type="button" data-nav="discover">Find an opportunity</button></div></section>`;
}

function renderProfile() {
  return `<section class="page-shell"><div class="page-heading"><p class="eyebrow">Profile</p><h1>Guest</h1></div><article class="panel profile-card"><span class="avatar" aria-hidden="true">G</span><div><h2>${state.accountCreated ? "Prototype account created" : "Browsing as a guest"}</h2><p>${state.accountCreated ? "guest@vt.edu • Email notifications enabled" : "You can explore the platform before creating an account."}</p></div></article><article class="panel"><h2>Prototype boundaries</h2><p>This medium-fidelity prototype uses generated event data. It does not create real accounts, send notifications, contact organizers, or provide live directions.</p></article></section>`;
}

document.addEventListener("click", (event) => {
  const nav = event.target.closest("[data-nav]");
  if (nav) {
    setView(nav.dataset.nav);
    return;
  }

  const control = event.target.closest("[data-action]");
  if (!control) return;
  const action = control.dataset.action;

  if (action === "view-event") setView("details", { eventId: control.dataset.eventId });
  if (action === "save-event") {
    const id = control.dataset.eventId;
    if (state.saved.has(id)) { state.saved.delete(id); showToast("Removed from saved events."); }
    else { state.saved.add(id); showToast("Saved for later."); }
    render();
  }
  if (action === "reset-filters") {
    state.filters = { query: "", day: "Any day", duration: "Any length", transport: "Any option" };
    render();
  }
  if (action === "join-waitlist") setView("waitlist");
  if (action === "continue-account") setView("account");
  if (action === "back-details") setView("details");
  if (action === "simulate-opening") { state.spotAvailable = true; setView("spot-open"); }
  if (action === "claim-spot") setView("registration");
  if (action === "decline-spot") { state.spotAvailable = false; state.waitlisted = false; showToast("The spot was declined for this prototype."); setView("discover"); }
  if (action === "open-registration") { state.activeEventId = control.dataset.eventId || state.activeEventId; setView("registration"); }
  if (action === "open-arrival") setView("arrival");
  if (action === "back-preparation") setView("preparation");
  if (action === "explain-verification") showToast("Verified means the team reviewed the organizer’s identity and contact information. It is not a guarantee of event quality.");
  if (action === "contact-organizer") showToast("Contacting an organizer is simulated in this prototype.");
  if (action === "directions") showToast("Live directions are outside this prototype’s scope.");
});

document.addEventListener("submit", (event) => {
  event.preventDefault();
  if (event.target.id === "filter-form") {
    const data = new FormData(event.target);
    state.filters = { query: data.get("query") || "", day: data.get("day"), duration: data.get("duration"), transport: data.get("transport") };
    render();
    document.querySelector("#event-heading")?.scrollIntoView({ behavior: "smooth" });
  }
  if (event.target.id === "account-form") {
    state.accountCreated = true;
    state.waitlisted = true;
    setView("waitlist-confirmed");
  }
  if (event.target.id === "registration-form") {
    state.registered = true;
    state.waitlisted = false;
    state.spotAvailable = false;
    setView("preparation");
    showToast("Registration confirmed.");
  }
});

window.addEventListener("hashchange", () => {
  const requested = window.location.hash.replace("#", "");
  if (requested && requested !== state.view) {
    state.view = requested;
    render();
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }
});

const initialView = window.location.hash.replace("#", "");
if (initialView) state.view = initialView;
render();
