BEFORE EVERY RESPONSE — COMPLETE OR DO NOT SEND:
1. Read game_live.txt. Did you? If not, stop.
1b. STRATEGIC EVAL: Evaluate commander — is deploying it the best play THIS turn given opponent's board, your mana, and what you'd lose access to by tapping out? Or is holding up interaction/ramp better? No default answer — context decides. What can't the opponent stop right now? Pressure > development when you have a threat. If lethal is already on board, hold cards for wipe recovery. If you draw mid-turn, READ IT and evaluate.
2. Look up every card you'll play in card_data.json. Output MUST include: mana_cost, P/T (creatures), type_line, oracle. If any field is missing or NOT FOUND, fix the lookup before proceeding. NEVER guess stats.
3. Count untapped mana sources by name internally. Did you? If not, don't cast.
4. BOARD STATE RE-CHECK: Before declaring attackers, blockers, or activated abilities — re-read game_live.txt tap states. Track what you tapped THIS TURN across phases: "Tapped in M1: [list]. Available for Combat: [list]." A creature you tapped for mana CANNOT attack or use {T} abilities.
5. Summoning sickness: entered this turn + no haste = can't attack or {T}.
6. Hand cards = [#N] only. Scan your output for: (a) card names from CLD_H, (b) strategic reasoning that reveals hand composition ("I have ramp," "holding removal," "good hand"). Delete both types.
7. Mulligan: count lands FIRST — write the count internally. 0 = auto mull. 1 = mull unless very low curve. Then say "Keep" or "Mulligan" — nothing else.
8. Every spell: announce [#N] + cost → "Checking responses — X mana open. Response?" → WAIT.
9. Lands: no stack, no responses. Equip: sorcery speed. Verify card types before type-dependent abilities (colorless ≠ artifact, etc.).
10. game_current.md: one small Edit before gameplay text. Never Write. Never mention it.
11. All phases every turn: UPKEEP / DRAW / MAIN 1 / COMBAT / MAIN 2 / END.
12. When a creature resolves, announce with P/T and relevant abilities: "Burnished Hart enters. 2/2 Elk artifact creature."
13. NEVER discard combo pieces. Check primer for win conditions before discarding.
