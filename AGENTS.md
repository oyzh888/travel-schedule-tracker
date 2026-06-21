# AGENTS.md - Travel Schedule Tracker

This repo tracks Steve's South America -> China -> U.S. travel schedule in a public-safe form.

## First Read

Start here:

1. `README.md` - repo purpose and local preview.
2. `data/schedule.json` - travel blocks, meetings, and reschedule candidates.
3. `data/flight-details.json` - airline/airport/check-in/baggage notes.
4. `data/trip-plan.json` - China route, weather assumptions, packing plan.

Important: some JSON data may be older than Steve's live Google Calendar. Before making scheduling decisions, verify live calendar state and then update the JSON.

## Privacy Boundary

This repo may be pushed to GitHub. Do not commit:

- PNRs, booking references, ticket numbers, passport details, date of birth, payment details, visa document numbers, private phone numbers, or private contact details.
- Full private lodging access instructions, door codes, or host contact info.
- Sensitive email bodies. Summarize only the public-safe operational facts.

Use placeholders such as `[PRIVATE BOOKING REF]` or describe where to find the private source, for example "Trip.com email in Steve's personal Gmail".

## Steve's Travel Preferences

- Steve wants fast, operational answers while traveling. Lead with what to do now, then give backup context.
- Use Chinese by default unless Steve asks for English text to send someone.
- Always show time zones explicitly when proposing times. Include Steve's local travel city time, PT, and China/HK time when relevant.
- Steve prefers 30-minute options for external scheduling unless the meeting type clearly needs more time.
- Avoid early morning, overnight, flight windows, airport-transfer windows, and heavy sightseeing/tour windows.
- Do not over-optimize. Give 2-4 best options, with a short "most recommended" call.
- For airport questions, prioritize immediate navigation: terminal, signs to follow, airline/flight number, what to ask staff.
- For visa/entry questions, distinguish "international transit airside" from "entering the country"; Steve usually needs the practical risk verdict more than exhaustive policy.

## Current High-Signal Context

As of 2026-06-21:

- Steve has landed in Rio from Buenos Aires on GOL `G37609` AEP -> GIG Terminal 2.
- Rio stay is around Ipanema: `R. Prudente de Morais, 326`.
- Airbnb Experience is booked for 2026-06-23 07:30-14:00 Rio time:
  - `Airbnb Experience: Get to know the main attractions in Rio`
  - Meeting point: Mangotree Hostel Ipanema, Rua Prudente de Morais 594.
  - Steve should leave the Airbnb around 07:15.
- Bruce discussion is scheduled for 2026-06-23 16:00-16:45 PT:
  - Rio: 2026-06-23 20:00-20:45.
  - Beijing/HK: 2026-06-24 07:00-07:45.
  - Bruce email: `brucechenun@gmail.com`.
  - Meet: `https://meet.google.com/fzp-qtxu-skc`.
  - Calendar invite asks Bruce to send Steve the meeting summary afterward.
- PAW was moved to 2026-06-22 17:00-18:00 PT:
  - HK/Beijing: 2026-06-23 08:00-09:00.
  - Rio: 2026-06-22 21:00-22:00.
- Haoqing is scheduled for 2026-06-22 18:00-19:00 PT:
  - Beijing: 2026-06-23 09:00-10:00.
  - Rio: 2026-06-22 22:00-23:00.
- When2Buy follows at 2026-06-22 19:00-19:45 PT:
  - Beijing: 2026-06-23 10:00-10:45.
  - Rio: 2026-06-22 23:00-23:45.
- Airacle Tech Sync is 2026-06-23 17:00-17:30 PT:
  - Rio: 2026-06-23 21:00-21:30.
  - Beijing/HK: 2026-06-24 08:00-08:30.
- Sync Steve <-> Hui is 2026-06-23 17:35-18:15 PT:
  - Rio: 2026-06-23 21:35-22:15.

## Near-Term Trip Logic

- 2026-06-22 Rio: best flexible day for calls and light sightseeing. Evening is packed from Rio 21:00 onward.
- 2026-06-23 Rio: morning/early afternoon is blocked by Airbnb tour; evening is packed from Rio 20:00 onward.
- 2026-06-24: Rio -> Sao Paulo flight `G31447`, GIG -> CGH, 14:20-15:25 Rio/Sao Paulo time. Avoid afternoon meetings.
- 2026-06-25: Sao Paulo GRU -> Addis Ababa ADD -> Shanghai PVG via Ethiopian:
  - `ET507` GRU T3 01:45 -> ADD T2 19:45.
  - `ET684` ADD T2 23:30 -> PVG T2 15:15 on 2026-06-26.
  - ADD layover is 3h45. Do not recommend leaving the airport; use International Transfer and video call if meeting a friend.
  - Trip.com says no need to collect and re-check baggage during the ADD transfer; confirm checked-bag tag says PVG at GRU.

## Scheduling Rules

- For China-based calls, prefer Beijing/HK 08:00-22:00, ideally morning.
- For U.S. East Coast lawyer calls while Steve is in Rio:
  - Best current options are 2026-06-22 09:30-10:00 ET / Rio 10:30-11:00, or 2026-06-22 10:30-11:00 ET / Rio 11:30-12:00.
  - Avoid 2026-06-23 U.S. East morning because it overlaps the Rio Airbnb tour.
- If Steve asks for "latest options", re-query Google Calendar and recalculate rather than relying on stale JSON.
- When adding a calendar event, use Steve's usual calendar account `oyzhouyang@gmail.com` unless instructed otherwise.
- For external sends/invites, Steve's explicit request is enough authorization; otherwise ask before sending.

## Updating This Repo

- Keep data public-safe and commit changes when they are useful to another thread.
- If changing schedule data, update `data/schedule.json` and, when relevant, `data/flight-details.json` or `data/trip-plan.json`.
- If only adding operational context for future agents, update this `AGENTS.md`.
- After edits, run at least:

```bash
python3 -m json.tool data/schedule.json >/dev/null
python3 -m json.tool data/flight-details.json >/dev/null
python3 -m json.tool data/trip-plan.json >/dev/null
git diff --check
```

Do not use this repo as the only source of truth for private travel documents. Use it as the public-safe working tracker.
