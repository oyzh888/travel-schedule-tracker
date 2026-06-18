const state = {
  schedule: null,
  filter: "all",
  adjustments: loadAdjustments()
};

const riskLabels = {
  fixed: "fixed",
  low: "keep",
  late: "late",
  early: "early",
  overlap: "overlap",
  blocked: "blocked"
};

const timeline = document.querySelector("#timeline");
const summary = document.querySelector("#summary");
const eventSelect = document.querySelector("#event-select");
const adjustmentForm = document.querySelector("#adjustment-form");
const adjustmentsContainer = document.querySelector("#adjustments");
const proposalsContainer = document.querySelector("#proposals");
const playWindowsContainer = document.querySelector("#play-windows");
const timeFocusContainer = document.querySelector("#time-focus");

init();

async function init() {
  const response = await fetch("data/schedule.json");
  state.schedule = await response.json();
  renderFilters();
  renderSummary();
  renderTimeFocus();
  renderProposals();
  renderPlayWindows();
  renderTimeline();
  renderEventSelect();
  renderAdjustments();
  bindActions();
}

function bindActions() {
  adjustmentForm.addEventListener("submit", handleAdjustmentSubmit);
  document.querySelector("#export-json").addEventListener("click", exportJson);
  document.querySelector("#export-md").addEventListener("click", exportMarkdown);
  document.querySelector("#clear-adjustments").addEventListener("click", () => {
    if (!window.confirm("Clear all draft adjustments from this browser?")) return;
    state.adjustments = [];
    persistAdjustments();
    renderAdjustments();
  });
  document.querySelector("#add-all-proposals").addEventListener("click", addAllProposals);
}

function renderFilters() {
  document.querySelectorAll(".filter").forEach((button) => {
    button.addEventListener("click", () => {
      state.filter = button.dataset.filter;
      document.querySelectorAll(".filter").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      renderTimeline();
    });
  });
}

function renderSummary() {
  const travel = state.schedule.travel.length;
  const meetings = state.schedule.meetings.filter((event) => event.type === "meeting").length;
  const blocked = state.schedule.meetings.filter((event) => event.risk === "blocked").length;
  const overlap = state.schedule.meetings.filter((event) => event.risk === "overlap").length;
  const proposals = state.schedule.proposals.length;
  const cards = [
    ["Travel blocks", travel],
    ["Meetings", meetings],
    ["Blocked", blocked],
    ["Overlaps", overlap],
    ["Proposals", proposals]
  ];
  summary.innerHTML = cards
    .map(([label, value]) => `<article class="summary-card"><strong>${value}</strong><span>${label}</span></article>`)
    .join("");
}

function renderTimeFocus() {
  const zones = [
    {
      label: "Calendar source",
      date: "All meetings",
      place: "Pacific Time",
      offset: "PT / UTC-7",
      note: "Original Google Calendar time"
    },
    {
      label: "Layover",
      date: "Jun 18-19",
      place: "Mexico City",
      offset: "UTC-6",
      note: "Only matters for the MEX overnight layover"
    },
    {
      label: "Argentina",
      date: "Jun 19-21",
      place: "Buenos Aires",
      offset: "UTC-3",
      note: "Primary check for first weekend meetings"
    },
    {
      label: "Brazil",
      date: "Jun 21-25",
      place: "Rio / Sao Paulo",
      offset: "UTC-3",
      note: "Primary check for batch meeting changes"
    },
    {
      label: "After flight",
      date: "Jun 26-27",
      place: "Shanghai",
      offset: "UTC+8",
      note: "Use after PVG arrival"
    },
    {
      label: "Participants",
      date: "Many PAW / Haoqing / Aitist calls",
      place: "China time",
      offset: "UTC+8",
      note: "Prefer Beijing morning when Steve is in South America"
    }
  ];

  timeFocusContainer.innerHTML = zones
    .map((zone) => `
      <article class="time-zone-card ${["Brazil", "Argentina", "Participants"].includes(zone.label) ? "primary-zone" : ""}">
        <span>${escapeHtml(zone.label)}</span>
        <strong>${escapeHtml(zone.place)}</strong>
        <div>${escapeHtml(zone.date)} · ${escapeHtml(zone.offset)}</div>
        <p>${escapeHtml(zone.note)}</p>
      </article>
    `)
    .join("");
}

function renderProposals() {
  proposalsContainer.innerHTML = [...state.schedule.proposals]
    .sort((a, b) => new Date(a.to || a.from) - new Date(b.to || b.from))
    .map((proposal) => {
      const priority = proposal.priority || "medium";
      const sourceEvent = state.schedule.meetings.find((event) => event.id === proposal.eventId);
      return `
        <article class="proposal-card ${priority}">
          <div class="proposal-topline">
            <span class="badge ${priority === "high" ? "blocked" : priority === "low" ? "low" : "late"}">${priority}</span>
            <span>${proposal.action}</span>
          </div>
          <h3>${escapeHtml(proposal.eventTitle)}</h3>
          ${renderProposalTime(proposal, sourceEvent)}
          <p>${escapeHtml(proposal.reason)}</p>
          <button type="button" data-proposal-id="${proposal.id}" class="add-proposal">Add to Draft</button>
        </article>
      `;
    })
    .join("");

  proposalsContainer.querySelectorAll(".add-proposal").forEach((button) => {
    button.addEventListener("click", () => {
      const proposal = state.schedule.proposals.find((item) => item.id === button.dataset.proposalId);
      addProposal(proposal);
    });
  });
}

function renderPlayWindows() {
  playWindowsContainer.innerHTML = state.schedule.playWindows
    .map((item) => `
      <article class="window-card">
        <strong>${formatDate(item.date)} · ${escapeHtml(item.location)}</strong>
        <span>${escapeHtml(item.window)}</span>
        <p>${escapeHtml(item.note)}</p>
      </article>
    `)
    .join("");
}

function renderTimeline() {
  const events = combinedEvents().filter((event) => {
    if (state.filter === "all") return true;
    if (state.filter === "travel") return event.kind === "travel";
    if (state.filter === "meeting") return event.kind === "meeting";
    if (state.filter === "risk") return ["late", "early", "overlap", "blocked"].includes(event.risk);
    return true;
  });

  const groups = groupByDate(events);
  timeline.innerHTML = Object.entries(groups)
    .map(([date, items]) => renderDay(date, items))
    .join("");
}

function combinedEvents() {
  const travel = state.schedule.travel.map((event) => ({
    ...event,
    kind: "travel",
    sortTime: event.departLocal || event.from || event.date,
    risk: event.status || "fixed"
  }));

  const meetings = state.schedule.meetings.map((event) => ({
    ...event,
    kind: "meeting",
    sortTime: event.startPT,
    date: event.startPT.slice(0, 10)
  }));

  return [...travel, ...meetings].sort((a, b) => new Date(a.sortTime) - new Date(b.sortTime));
}

function groupByDate(events) {
  return events.reduce((acc, event) => {
    const key = event.date || event.sortTime.slice(0, 10);
    acc[key] ||= [];
    acc[key].push(event);
    return acc;
  }, {});
}

function renderDay(date, items) {
  return `
    <section class="day-group">
      <div class="day-heading">
        <h3>${formatDate(date)}</h3>
        <span>${items.length} items</span>
      </div>
      ${items.map(renderEvent).join("")}
    </section>
  `;
}

function renderEvent(event) {
  const time = event.kind === "travel" ? travelTime(event) : meetingTime(event);
  const detail = event.kind === "travel" ? travelDetail(event) : meetingDetail(event);
  const badgeClass = event.kind === "travel" ? "travel" : event.risk;
  const badge = event.kind === "travel" ? event.type : riskLabels[event.risk] || event.risk;

  return `
    <article class="event">
      <div class="time">${time}</div>
      <div>
        <div class="event-title">${escapeHtml(event.title)}</div>
        <div class="event-detail">${detail}</div>
      </div>
      <span class="badge ${badgeClass}">${badge}</span>
    </article>
  `;
}

function travelTime(event) {
  if (event.type === "lodging") {
    return `
      <span class="time-label">Stay dates</span>
      <strong>${formatDate(event.from)} -> ${formatDate(event.to)}</strong>
    `;
  }
  return `
    <span class="time-label">${escapeHtml(event.from)} local</span>
    <strong>${formatTime(event.departLocal)}</strong>
    <span class="time-label">${escapeHtml(event.to)} local</span>
    <strong>${formatTime(event.arriveLocal)}</strong>
  `;
}

function meetingTime(event) {
  return `
    <span class="time-label">Calendar PT</span>
    <strong>${formatDateTimePT(event.startPT)}-${formatTime(event.endPT)}</strong>
    <span class="time-label">Travel local</span>
    <strong>${escapeHtml(event.localTimeLabel)}</strong>
  `;
}

function travelDetail(event) {
  if (event.type === "lodging") {
    return `${escapeHtml(event.location || "")}${event.notes ? ` · ${escapeHtml(event.notes)}` : ""}`;
  }
  return `${event.carrier} ${event.flightNumber} · ${event.from} -> ${event.to}${event.notes ? ` · ${escapeHtml(event.notes)}` : ""}`;
}

function meetingDetail(event) {
  return `
    <span class="recommendation">${escapeHtml(event.recommendation)}</span>
  `;
}

function renderEventSelect() {
  const options = state.schedule.meetings
    .map((event) => `<option value="${event.id}">${formatDate(event.startPT.slice(0, 10))} · ${escapeHtml(event.title)}</option>`)
    .join("");
  eventSelect.innerHTML = options;
}

function handleAdjustmentSubmit(event) {
  event.preventDefault();
  const selected = state.schedule.meetings.find((item) => item.id === eventSelect.value);
  const newDate = document.querySelector("#new-date").value;
  const newTime = document.querySelector("#new-time").value;
  const action = document.querySelector("#action-select").value;
  const reason = document.querySelector("#reason").value.trim();
  const to = newDate && newTime ? `${newDate}T${newTime}:00` : "";

  state.adjustments.push({
    eventId: selected.id,
    eventTitle: selected.title,
    action,
    from: selected.startPT,
    to,
    fromDisplay: `${formatDateTimePT(selected.startPT)} PT · ${selected.localTimeLabel || "Local time not set"}`,
    toDisplay: to ? `${formatDateTimePT(`${to}-07:00`)} PT · Local time TBD` : "No new time",
    reason,
    createdAt: new Date().toISOString()
  });

  persistAdjustments();
  adjustmentForm.reset();
  renderAdjustments();
}

function addProposal(proposal) {
  const exists = state.adjustments.some((item) => item.proposalId === proposal.id);
  if (exists) return;
  const sourceEvent = state.schedule.meetings.find((event) => event.id === proposal.eventId);

  state.adjustments.push({
    proposalId: proposal.id,
    eventId: proposal.eventId,
    eventTitle: proposal.eventTitle,
    action: proposal.action,
    from: proposal.from,
    to: proposal.to,
    fromDisplay: formatProposalFrom(proposal, sourceEvent),
    toDisplay: formatProposalTo(proposal),
    reason: proposal.reason,
    createdAt: new Date().toISOString()
  });

  persistAdjustments();
  renderAdjustments();
}

function addAllProposals() {
  [...state.schedule.proposals]
    .sort((a, b) => new Date(a.to || a.from) - new Date(b.to || b.from))
    .forEach(addProposal);
}

function renderAdjustments() {
  if (state.adjustments.length === 0) {
    adjustmentsContainer.innerHTML = `<p class="event-detail">No draft adjustments yet.</p>`;
    return;
  }

  const template = document.querySelector("#adjustment-template");
  adjustmentsContainer.innerHTML = "";

  state.adjustments.forEach((adjustment, index) => {
    const node = template.content.cloneNode(true);
    node.querySelector(".adjustment-title").textContent = adjustment.eventTitle;
    node.querySelector(".adjustment-meta").textContent = humanAdjustmentMeta(adjustment);
    node.querySelector(".adjustment-reason").textContent = adjustment.reason || "No reason added.";
    node.querySelector(".remove-adjustment").addEventListener("click", () => {
      state.adjustments.splice(index, 1);
      persistAdjustments();
      renderAdjustments();
    });
    adjustmentsContainer.appendChild(node);
  });
}

function exportJson() {
  download("schedule-adjustments.json", JSON.stringify(state.adjustments, null, 2), "application/json");
}

function exportMarkdown() {
  const lines = [
    "# Schedule Adjustments",
    "",
    `Generated: ${new Date().toISOString()}`,
    ""
  ];

  if (state.adjustments.length === 0) {
    lines.push("No adjustments drafted.");
  } else {
    state.adjustments.forEach((item) => {
      lines.push(`- ${item.eventTitle}`);
      lines.push(`  - Action: ${item.action}`);
      lines.push(`  - From: ${item.fromDisplay || item.from}`);
      lines.push(`  - To: ${item.toDisplay || item.to || "TBD"}`);
      lines.push(`  - Reason: ${item.reason || "TBD"}`);
    });
  }

  download("schedule-adjustments.md", lines.join("\n"), "text/markdown");
}

function renderProposalTime(proposal, sourceEvent) {
  return `
    <div class="proposal-time-block">
      <div>
        <span>Current</span>
        <strong>${escapeHtml(formatProposalFrom(proposal, sourceEvent))}</strong>
      </div>
      <div>
        <span>Proposal</span>
        <strong>${escapeHtml(formatProposalTo(proposal))}</strong>
      </div>
      ${proposal.newParticipantTime ? `
        <div>
          <span>China participants</span>
          <strong>${escapeHtml(proposal.newParticipantTime)}</strong>
        </div>
      ` : ""}
    </div>
  `;
}

function formatProposalFrom(proposal, sourceEvent) {
  const pt = formatDateTimePT(proposal.from);
  const local = sourceEvent?.localTimeLabel || "Local time not set";
  return `${pt} PT · ${local}`;
}

function formatProposalTo(proposal) {
  if (!proposal.to) return "No new time";
  const local = proposal.newLocalTime ? ` · ${proposal.newLocalTime}` : "";
  return `${formatDateTimePT(proposal.to)} PT${local}`;
}

function humanAdjustmentMeta(adjustment) {
  const from = adjustment.fromDisplay || adjustment.from;
  const to = adjustment.toDisplay || adjustment.to || "No new time";
  return `${adjustment.action}: ${from} -> ${to}`;
}

function download(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function loadAdjustments() {
  try {
    return JSON.parse(localStorage.getItem("travelScheduleAdjustments") || "[]");
  } catch {
    return [];
  }
}

function persistAdjustments() {
  localStorage.setItem("travelScheduleAdjustments", JSON.stringify(state.adjustments));
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric"
  }).format(new Date(`${value}T12:00:00Z`));
}

function formatTime(value) {
  if (!value) return "";
  const match = value.match(/T(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : value;
}

function formatDateTimePT(value) {
  if (!value) return "";
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Los_Angeles"
  }).format(date);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
