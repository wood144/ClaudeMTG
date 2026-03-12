# MTG Rules Quick Reference — AI Opponent Cheat Sheet

## ⛔ BEFORE EVERY COMBAT — MANDATORY CHECK
- **Summoning sickness:** A creature CANNOT attack or use {T} abilities if it entered the battlefield THIS turn (or any turn after my last untap step). **Exception: haste grants immediate attack and {T} ability eligibility regardless of ETB turn.** Check ETB turn before declaring ANY attacker — if it has haste, it's legal. *Violated in Games 2, 3, and 5.*

---

## TIMING & THE STACK
- **Lands** are special actions — no stack, no response window. Never ask "any responses?" to a land play.
- **Mana abilities** (tap a land/rock for mana) don't use the stack. Cannot be responded to.
- **Sorcery-speed** (creatures, sorceries, enchantments, artifacts, planeswalkers): only during MY Main 1 or Main 2 when the stack is empty.
- **Equip** is sorcery-speed. Opponent cannot equip in response to my spells.
- **Instants and flash** can be played any time I have priority.
- A spell only resolves after BOTH players pass priority. Don't treat it as resolved until opponent confirms or passes.

---

## MANA & PRODUCING COLORLESS
- **Forsaken Monument:** "Whenever you tap a permanent for {C}, add an additional {C}." Adds exactly ONE {C} per tap — not per {C} produced.
  - Ancient Tomb ({C}{C}) + Forsaken Monument → {C}{C}{C}, not {C}{C}{C}{C}
  - Thran Dynamo ({C}{C}{C}) + Forsaken Monument → {C}{C}{C}{C}, not {C}{C}{C}{C}{C}{C}
- **Basic lands** always enter the battlefield untapped unless a card explicitly says otherwise.
- **Colorless ≠ Artifact.** Eldrazi are colorless creatures, not artifacts. Don't count them for Metalworker, Affinity, etc.

---

## SPECIFIC CARD RULINGS
- **Bident of Thassa:** draw trigger fires at end of COMBAT step, not end of turn. Play lands/spells in Main 2 before discard.
- **Sun Titan ETB/attack:** returns permanents only (creatures, artifacts, enchantments, lands, planeswalkers). NOT instants or sorceries.
- **Bruenor Battlehammer:** +2/+0 per equipment attached to HIM specifically. Free equip applies once per turn for the controller.
- **Drakuseth (3-target trigger):** in 1v1, if no second/third valid target exists, only the 4-damage hit fires. The "other targets" must be different from the first.
- **Grave Titan:** creates TWO 2/2 Zombie tokens on ETB and on each attack, not one.
- **Go-Shintai of Life's Origin:** trigger is "nontoken Shrine entering" — tokens don't chain-trigger it.
- **Shield counters:** when damage would be dealt, remove the counter instead. Damage does NOT get through. Control effect ends immediately even mid-combat.
- **Platinum Emperion:** prevents life loss/gain, but commander damage still accumulates — damage is "dealt" even if life total doesn't change.

---

## COMBAT & DAMAGE
- Always complete combat math BEFORE declaring attackers. Account for blocks and combat tricks.
- When a creature with a shield counter takes damage: counter removed, no damage dealt, control effect ends immediately.
- When stealing a creature: attached equipment stays on it but is still controlled by the original owner. They can re-equip it freely.
- **Butcher of Malakir:** if opponent's creature dies for ANY reason (including me killing it), Butcher triggers → I must sacrifice. Factor this into blocking decisions.

---

## DRAW & HAND MANAGEMENT
- **Bident of Thassa:** draw window is end of COMBAT, not end of turn. Use Main 2 before discarding.
- Don't discard interaction spells pre-emptively. Hold until end step when hand limit applies.
- Draw step happens BEFORE Main 1. If the user sends a board state mid-turn, the draw has already been logged. Don't announce drawing again.

---

## COMMANDER-SPECIFIC
- **Commander Tax:** +{2} per previous cast from Command Zone.
- **Commander Damage:** 21 cumulative combat damage from a single commander = game loss, regardless of life total.
- If commander would go to graveyard or exile, I may return it to Command Zone instead. Always announce.
- Color identity applies to every card in the deck.

---

## HIDDEN INFORMATION
- **My hand is hidden information.** When playing a card, identify it by [#UID] AND name — e.g. "Casting [#4] Sol Ring."
- Never speculate about opponent's hand. Infer only from visible zones (graveyard, exile, battlefield, cast/used spells).
- CLD_H in the board state is tracker data, not public game information.

---

## RESPONSE WINDOW CHECKLIST
Before passing priority on ANY spell or ability:
> "Checking responses — [X mana] open, [instants/abilities available by #UID]. Response: [yes/no + reason if yes]."
