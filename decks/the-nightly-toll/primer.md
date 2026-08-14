# The Nightly Toll / Braids, Arisen Nightmare — Deck Primer

**RETIRED 2026-08-01** after playtest #1 — superseded by v2 "Everything Must Go" (Mahadi, Rakdos; see `decks/everything-must-go/primer.md`). Kept for Game 118 history.

Commander: Braids, Arisen Nightmare | Colors: Mono-Black
Built 2026-08-01 entirely from collection.db as "the deck Claude's win-style data says Claude should pilot" (engines, asymmetric destruction, no combat math).

## Strategy
- **Braids is the engine:** end step, sac a recursive/replaceable permanent → opponent sacrifices a permanent sharing a card type OR loses 2 and I draw. My sacs are fake (Reassembling Skeleton, Bloodghast, Cult Conscript, Persistent Specimen, Fleshless Gladiator recur; Doomed Dissenter leaves a Zombie); theirs are real. Either branch profits.
- **Sac a creature to make the choice hurt most** — opponents with only premium creatures (a lone commander, big threats) won't match the sac; that's drain + draw every turn. Sac a LAND only when flooded or the opponent is land-light; never below 5 lands on board (wipe mana matters).
- **Death-drain shell:** Blood Artist, Zulaport Cutthroat, Vraan, Ayara, Falkenrath Noble, Etched Familiar convert every death (both sides of wipes!) into reach.
- **Removal is edicts + minus-X/exile wipes** — this deck answers hexproof/indestructible/protection via sacrifice and mass effects. Nightmare Unmaking's "power greater than cards in hand" mode is usually a one-sided exile wipe (my board is small-power chaff). Targeted black removal is the WEAKEST slice — many decks blank it (protection from black, recursion).
- **Finishers:** Gray Merchant, Kokusho, Exsanguinate (+Nirkana doubling), Ormendahl flip, Rise of the Dark Realms after both GYs fill. CDMG is NOT this deck's path — don't pretend Braids is a clock.
- **Life is a resource but also the shield** — Reanimate/Arena/Necrodominance spend it; drains recover it. Against CDMG decks lifegain is IRRELEVANT — 21 commander damage ignores life total.

## Game History

### Game 118: The Nightly Toll/Braids (Claude) vs. Dargons/Scion (Human)
**Result:** Human wins T6 (11 sides) via commander damage — 21 exactly. Claude 30 life (irrelevant), CDMG 7+4+10. Dominance 3.

**Key plays:**
- Mull #1 correct (1 land). Kept 4-land + Signet + Bloodghast + Dissenter.
- T8 (Claude): Yahenni's Expertise into free Vraska's Fall — killed BoP (wipe), forced Terror of the Peaks sac (edict), traded 2 own recursive bodies. Best turn of the game; 3-for-1.
- T9-11 (Human): Defossilize reanimated the whiffed Ureni of the Unwritten → Ureni ETB found Utvara Hellkite free → Ureni attack found Atarka free. Board went 1 dragon → 4 dragons in two turns without casting a dragon.
- T11: Sol Ring + Scion → Earthquake Dragon (10/10 flying), 11+10 = exactly 21 CDMG.

**Lessons (playtest #1):**
- **MISPLAY: declared Doomed Dissenter as a blocker on a FLYING attacker** (Ureni-copy). Re-read evasion keywords on the attacker BEFORE announcing blocks — the deck has ZERO fliers/reach, so vs flying attackers the answer is never blocks; it's edicts/wipes at sorcery speed or death.
- **Mono-B chaff cannot interact with a flying CDMG race.** Scion needs only 2-3 connects. The edict plan works ONLY while their board is thin — reanimator decks (Defossilize, Ureni chain) rebuild sac-shields faster than one edict per turn cycle strips them. Needed the second wipe (Nightmare Unmaking/BSZ) by T10-12 and never found it: 2 extra cards seen all game (one Braids draw) wasn't enough dig.
- **Braids T10 was too late.** Vs T5 Scion ramp starts, Braids wants to be down T6 (turn 3) with fodder — engine draws compound. Weigh Signet-first vs fodder-first openers by opponent speed: vs fast commanders, Braids ASAP.
- **Yahenni's Expertise free-cast is HAND ONLY** — cannot free-cast the commander from the CZ. Nearly misplayed this; caught pre-announcement.
- **vs Dargons specifically:** edict Scion's chaff EARLY so Fall/Sheoldred's actually hits Scion; targeted removal is blanked by {2} → Ureni Song Unending. Utvara Hellkite is a must-kill on sight (token engine per attack). Their zero instant-speed interaction means my sorcery turns are always safe — but their clock is faster than my grind unless a wipe lands by T10.

## Matchup Notes
- **vs. Dargons/Scion (0-1):** Race is unwinnable — their fliers outclock the drain grind. Win path: wipe at 6+ mana (BSZ X≥5 / Nightmare Unmaking with hand ≤2) + edict every rebuild, make every Scion recast cost +2. Kill Utvara Hellkite immediately. Keep hand SMALL for Unmaking mode 1. Don't bother with targeted removal.
