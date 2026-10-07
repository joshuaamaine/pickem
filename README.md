# NFL Pick'em 2026

Josh's group chat pick'em, live at https://joshuaamaine.github.io/pickem/

Friends open the page, tap a winner for each game, and paste the generated message into the iMessage group chat. Josh pastes those messages to Claude, which adds them to the board. Results and next week's games are filled in by a scheduled task on Monday and Tuesday mornings (Mountain time).

## Files

- `index.html`: the page. It reads everything from `state.json`; don't put data in the page.
- `state.json`: all weeks, games, picks and results. This is the only file that changes week to week.
- `og.png`: the link preview image iMessage shows.
- `tools/parse.js`: reads pasted picks messages. `node tools/parse.js < pasted.txt` prints `[{name, p, tb}]` for the current week.

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

## Adding picks

1. Save the pasted messages to a file and run `node tools/parse.js < file`.
2. Check each result against the message (hand-typed messages can be messy), then write each entry into `weeks[currentWeek].picks` with `tb` as a number or null.
3. Commit and push to `main`. GitHub Pages updates within a minute or two.

## Weekly scoring

Most correct picks wins the week. Ties go to the tiebreaker guess closest to `mnfTotal`; if still tied, they share the win.
