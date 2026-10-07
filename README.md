# NFL Pick'em 2026

Josh's group chat pick'em, live at https://joshuaamaine.github.io/pickem/

Friends open the page, tap a winner for each game, and save with their name and a 4-digit PIN. Picks go to a Supabase database (see `supabase/schema.sql`); the page reads them back and scores the board in the browser. Results and next week's games are filled in by a scheduled task on Monday and Tuesday mornings (Mountain time), which only edits `state.json`.

## Where data lives

- **Games and results:** `state.json` in this repo.
- **Picks:** Supabase table `pick_log`, written only through the `submit_picks` function (checks the PIN). Every save is a new row; the page counts each person's latest pick saved before that game's kickoff (server timestamps), so changes after kickoff never count. The tiebreaker is stored as game id `tb` and locks at the tiebreaker game's kickoff.
- **Supabase URL and publishable key** are set near the top of the script in `index.html`. They are public by design; never put the secret or service_role key in this repo.

## Files

- `index.html`: the page. It reads everything from `state.json`; don't put data in the page.
- `state.json`: all weeks, games, picks and results. This is the only file that changes week to week.
- `og.png`: the link preview image iMessage shows.
- `supabase/schema.sql`: the database setup, plus how to reset a forgotten PIN.
- `tools/parse.js`: reads pasted picks messages. `node tools/parse.js < pasted.txt` prints `[{name, p, tb}]` for the current week. Only needed for someone who can't use the page.

## state.json

```
{
  "v": 1,
  "season": 2026,
  "currentWeek": 5,
  "weeks": {
    "5": {
      "week": 5,
      "byes": ["KC", "CAR"],
      "tiebreaker": "g15",          // game id whose total points break ties
      "mnfTotal": null,             // that game's final total, once known
      "games": [
        {"id": "g1", "away": "TB", "home": "DAL", "kickoff": "2026-10-09T00:15:00Z",
         "slot": "TNF", "winner": null, "as": null, "hs": null, "fid": "feed game id"}
      ],
      "picks": {
        "Josh": {"p": {"g1": "DAL"}, "tb": 47}
      }
    }
  }
}
```

- `winner` is a team code, `"TIE"`, or `null` until final. `as`/`hs` are away/home scores.
- `slot` is `"TNF"`, `"SNF"`, `"MNF"` or `""`.
- Team codes: ARI ATL BAL BUF CAR CHI CIN CLE DAL DEN DET GB HOU IND JAC KC LV LAC LA (Rams) MIA MIN NE NO NYG NYJ PHI PIT SF SEA TB TEN WAS.
- Picks are keyed by the name people type. Match names case-insensitively and replace an existing entry rather than adding a duplicate.

## Adding picks by hand

Normally nobody does this. For someone who can't use the page: run `node tools/parse.js < file` on their message, check it, and write the entry into `weeks[currentWeek].picks` in `state.json` (`tb` as a number or null). The page merges these with database picks; a database entry with the same name wins.

## Weekly scoring

Most correct picks wins the week. Ties go to the tiebreaker guess closest to `mnfTotal`; if still tied, they share the win.
