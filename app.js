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

init();

async function init() {
  const response = await fetch("data/schedule.json");
  state.schedule = await response.json();
  renderFilters();
  renderSummary();
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
  const cards = [
    ["Travel blocks", travel],
    ["Meetings", meetings],
    ["Blocked", blocked],
    ["Overlaps", overlap]
  ];
  summary.innerHTML = cards
    .map(([label, value]) => `<article class="summary-card"><strong>${value}</strong><span>${label}</span></article>`)
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
  if (event.type === "lodging") return `${event.from} -> ${event.to}`;
  return `${formatTime(event.departLocal)} -> ${formatTime(event.arriveLocal)}`;
}

function meetingTime(event) {
  return `${formatTime(event.startPT)} -> ${formatTime(event.endPT)} PT`;
}

function travelDetail(event) {
  if (event.type === "lodging") {
    return `${escapeHtml(event.location || "")}${event.notes ? ` · ${escapeHtml(event.notes)}` : ""}`;
  }
  return `${event.carrier} ${event.flightNumber} · ${event.from} -> ${event.to}${event.notes ? ` · ${escapeHtml(event.notes)}` : ""}`;
}

function meetingDetail(event) {
  return `${escapeHtml(event.localTimeLabel)} · ${escapeHtml(event.recommendation)}`;
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
    reason,
    createdAt: new Date().toISOString()
  });

  persistAdjustments();
  adjustmentForm.reset();
  renderAdjustments();
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
    node.querySelector(".adjustment-meta").textContent = `${adjustment.action}: ${adjustment.from} -> ${adjustment.to || "no new time"}`;
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
      lines.push(`  - From: ${item.from}`);
      lines.push(`  - To: ${item.to || "TBD"}`);
      lines.push(`  - Reason: ${item.reason || "TBD"}`);
    });
  }

  download("schedule-adjustments.md", lines.join("\n"), "text/markdown");
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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

