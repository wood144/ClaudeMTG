# MTG Commander — Project To-Do

## Active
- [ ] Remove `N` keyboard shortcut (accidental triggers when typing)
- [ ] Better error handling — user-facing toasts for Scryfall/import failures
- [ ] Merge duplicate functions — `moveHandCard()`/`moveOppHandCard()`, context menu builders (~100+ LoC savings)
- [ ] Split CSS out of index.html into separate files (layout, theme, components)
- [ ] Fisher-Yates shuffle — replace biased `.sort(random)` with proper shuffle (code done, needs commit)

## Undecided
- [ ] Token search caching — slight lag on high-art tokens (foods, clues, treasures). Tradeoff: scrape everything vs ~2s lag per activation. Thinking on it.
- [ ] Game state URL sharing — end-of-turn snapshot approach only (not per-action). Needs design work.

## Won't Do
- [x] ~~Undo system~~ — not needed for personal desktop tool
- [x] ~~Library search/filter~~ — already implemented
- [x] ~~Mulligan UI~~ — manual redraw is fast enough, bottleneck is Claude's new-game setup
- [x] ~~More keyboard shortcuts~~ — too many accidental triggers when typing to Claude
- [x] ~~Virtual scrolling~~ — not needed
- [x] ~~ARIA/accessibility~~ — not needed for personal tool
- [x] ~~Action log export~~ — not needed
