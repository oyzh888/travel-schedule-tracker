# Travel Schedule Tracker

Visual tracker for travel, meetings, and schedule adjustments.

This repository is intentionally static and GitHub Pages friendly:

- `data/schedule.json` is the source of truth for flights, stays, meetings, and schedule changes.
- `data/trip-plan.json` tracks the city route, weather assumptions, and packing baseline.
- `data/flight-details.json` tracks public-safe flight details, check-in links, baggage notes, and pending confirmed ticket gaps.
- The UI reads the JSON file and renders a timeline.
- Schedule changes can be exported as JSON or Markdown and committed back to Git.

No private booking references, passport numbers, or immigration details should be committed here.

## Local Preview

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Data Model

Schedule events are grouped into:

- `travel`: flights and lodging blocks
- `meetings`: calendar meetings and reminders

Adjustments are exported by the browser and can be saved under `data/adjustments/`.

Trip planning data is grouped into:

- `route`: city/date level China route through the return flight on 2026-07-05
- `weatherAssumptions`: planning-level weather notes for each region
- `packingPlan`: baseline clothing, carry-on, and open questions

Flight detail data is grouped into:

- `itineraries`: airline-level groups with check-in URL, baggage note, and legs
- `legs`: flight number, airports, local departure/arrival time, and terminal hints
- `pending confirmation`: placeholders for known route items whose confirmed ticket details are not available yet
