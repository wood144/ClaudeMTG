# MTG Commander — Project To-Do

## Active
- [ ] Better error handling — user-facing toasts for Scryfall/import failures
- [ ] Merge duplicate functions — `moveHandCard()`/`moveOppHandCard()`, context menu builders (~100+ LoC savings)
- [ ] Split CSS out of index.html into separate files (layout, theme, components)

## Undecided
- [ ] Token search caching — slight lag on high-art tokens (foods, clues, treasures). Tradeoff: scrape everything vs ~2s lag per activation. Thinking on it.
- [ ] Game state URL sharing — end-of-turn snapshot approach only (not per-action). Needs design work.

## Won't Do
- [x] ~~Undo system~~ — not needed for personal desktop tool
- [x] ~~Library search/filter~~ — implemented and committed
- [x] ~~Fisher-Yates shuffle~~ — replaced biased .sort(random), committed
- [x] ~~Remove N keyboard shortcut~~ — removed, committed
- [x] ~~Mulligan UI~~ — manual redraw is fast enough, bottleneck is Claude's new-game setup
- [x] ~~More keyboard shortcuts~~ — too many accidental triggers when typing to Claude
- [x] ~~Virtual scrolling~~ — not needed
- [x] ~~ARIA/accessibility~~ — not needed for personal tool
- [x] ~~Action log export~~ — not needed
