# Travel Schedule Tracker

Visual tracker for travel, meetings, and schedule adjustments.

This repository is intentionally static and GitHub Pages friendly:

- `data/schedule.json` is the source of truth for trips and meetings.
- The UI reads the JSON file and renders a timeline.
- Schedule changes can be exported as JSON or Markdown and committed back to Git.

No private booking references, passport numbers, or immigration details should be committed here.

## Local Preview

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Data Model

Events are grouped into:

- `travel`: flights and lodging blocks
- `meetings`: calendar meetings and reminders

Adjustments are exported by the browser and can be saved under `data/adjustments/`.

