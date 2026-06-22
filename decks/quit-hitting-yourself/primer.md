# Quit Hitting Yourself / Wayta — Deck Primer
<!-- summary reconciled 2026-06-21 -->
> **PATH OF ANCESTRY CHECK:** Before using Path of Ancestry mana to cast a creature, verify the creature shares a creature type with your commander. No shared type = no scry.

Commander: Wayta, Trainer Prodigy | Colors: Red/Green/White (Naya)

## Strategy & Key Mechanics
- **Wayta** (1/5 haste) has a fight ability: {2}{G},{T} to make two creatures fight. Costs {2} less if both are yours. If a creature you control being dealt damage causes a triggered ability of a permanent you control to trigger, that ability triggers an additional time.
- **Core gameplan:** Play indestructible or damage-reflecting creatures, then use board wipes (Blasphemous Act, Star of Extinction, Earthquake) to deal massive damage to them — which they redirect to the opponent's face.
- **Damage reflection creatures:** Boros Reckoner, Brash Taunter (indestructible), Stuffy Doll (indestructible), Spitemare, Mogg Maniac, Screaming Nemesis, Spiteful Sliver
- **Protection to survive wipes:** Darksteel Plate, Shielded by Faith (indestructible aura, moves on creature ETB)
- **Damage amplifiers:** Blazing Sunsteel (equipped creature reflects damage dealt to it), Fiendlash (equipped creature deals power as damage when dealt damage), Pain for All (aura that reflects damage)
- **en-Kor creatures** (Nomads, Shaman, Warrior, Outrider, Spirit): {0} activated ability redirects 1 damage at a time to another creature you control. Allows funneling ALL damage from a board wipe onto one indestructible reflector.
- **Stormwild Capridor:** Flying, prevents noncombat damage, gains +1/+1 counters instead. Grows enormous from board wipes.
- **Wrathful Raptors / Wrathful Red Dragon:** When a Dinosaur/Dragon you control is dealt damage, it deals that much to any target. Not many Dinosaurs/Dragons in deck besides these.

## Key Combos
- **Guilty Conscience + Boros Reckoner (or any reflector):** Infinite damage loop. Reflector is dealt damage → deals that much to any target → Guilty Conscience deals that damage back to it → repeat infinitely. Sequence protection (Heroic Intervention for hexproof+indestructible) BEFORE Guilty Conscience, or the loop kills your own reflector.
- **Wheel of Misfortune + Gideon's Sacrifice + Boros Reckoner:** 4-mana kill on the trigger turn (Reckoner deployed earlier). GS redirects your Wheel damage to Reckoner → reflection → you pick "one million," opp is forced to pick low and can't outpick. Live as early as T5 with ramp. Only out: kill Reckoner before Wheel resolves — assume opp has 2+ mana of removal.
- **Wayta-fight + en-Kor + 2 reflectors (e.g. Spiteful Sliver + Screaming Nemesis):** Repeatable chain kill, ~10 dmg/cycle for ~3 mana. en-Kor's {0} redirect funnels fight damage onto one reflector then redistributes 1 dmg to keep every creature alive. **en-Kor is the keystone** — without it the reflector dies to fight damage and the chain stops. Activated abilities aren't spells → counterspell decks can't stop it.
- **Blasphemous Act + Donna Noble (soulbonded to Wayta):** Mass-damage spell → 4× reflection (Donna fires + Wayta amp doubles, on BOTH Wayta and Donna). 13 dmg → 52. Earthquake / Star of Extinction / Pyrohemia scale identically. Without paired Donna, Blasphemous Act deals 0 to opp. Donna re-pairs on ANY creature ETB (rule 702.93c) — Wayta recast from CZ re-triggers the pair. Opp must NEVER double-block a Donna-paired Wayta (2 damage events × amp = 4× trigger).
- **Pariah / Pariah's Shield + Darksteel Plate on Wayta:** Triple lock — all damage to you redirected to indestructible Wayta; double redundancy means exiling Wayta is the only clean answer. It's a replacement effect: combat damage is never "dealt to a player," so "deals combat damage to a player" triggers (Cruelclaw, Scytheclaw) never fire. Finish through the lock with Star of Extinction + Blazing Sunsteel (Wayta-doubled reflection = one-shot).
- **Blasphemous Act + Brash Taunter:** 13 to Taunter → 13 to opp; with en-Kor, funnel multiple creatures' 13 into one reflector. Brash is a high-priority removal target — give it redundant indestructible (Darksteel Plate), not just Wayta.
- **Pain for All (cheapest amp, {2}{R}):** Cast on Screaming Nemesis ASAP. Adds a "deals damage to each opp" reflection trigger per damage event; Wayta amp doubles it. With Donna paired = 4× reflection on a fight.
- **Wayta fight as finisher:** Once the engine is online, fight opponent's own big creatures into your reflector — all damage reflected back, amplified. Wayta's ability doubles every reflection trigger.

## Weaknesses
- Relies on creatures sticking around — removal before board wipes disrupts the plan
- Exile-based removal (Path to Exile, Swords to Plowshares) bypasses indestructible
- Enchantment/artifact removal hits the protection pieces (Darksteel Plate, Shielded by Faith, Pariah)
- **No reflector in hand = no deck.** Without the combo engine, Wayta is just a 1/5 blocker that dies to fight triggers; board wipes hurt the Wayta player too. (Lost Games 50, 73 this way.)
- Slow setup — needs both a reflector AND protection before pulling the trigger
- **Sacrifice effects bypass the lock.** Force-sac-greatest-power (Shadowgrange Archfiend) and edicts go around indestructible and break the Pariah lock — race to the kill once assembled.
- **Damage reflection is dodged by:** commander-damage clocks (Zhulodok), protection-from-each-color finishers (Akroma's Will both modes makes multicolored Wayta useless as a blocker), and damage-prevention walls (Platinum Emperion). Fast-ramp decks also simply outrace the setup.
- **Opponent-side reflectors backfire:** enemy Wrathful Raptors turns your Star of Extinction wipe into massive damage to YOU — neutralize before any board wipe.

## Game History

### Game 80 (piloted by Human): Quit Hitting Yourself vs. Squirrel Food/Chatterfang (Claude)
**Result:** Human wins T6 via Wheel of Misfortune + Gideon's Sacrifice + Boros Reckoner reflection. Human life 37, Claude life 0. Dominance 1.
- T2: Wooded Foothills → Temple Garden (paid 2 life shock) + Birds of Paradise. Smooth open.
- T3: Mountain + Boros Reckoner on curve at 3 mana via BoP + Temple Garden + Mountain.
- T6: Wheel of Misfortune ({2}{R}) → held priority → Gideon's Sacrifice ({W}) targeting Reckoner. Wheel resolves: opponent picked 0, Human picked one million. Wheel damage to Human redirected to Reckoner via Gideon's Sacrifice → Reckoner reflection → one million damage to Claude. Lethal.
- **Key lesson — Wheel + GS + Reckoner is a fast win condition.** Total cost for the combo: 3 + 1 = 4 mana on the kill turn, plus Reckoner (3 mana) deployed earlier. Live as early as T5 with Sol Ring/BoP ramp. Don't underestimate this line.
- **Key lesson — opponent number choice is forced low.** Any number ≥1 they pick → I match it via Wheel reflection. They cannot outpick because I'm protected by GS. Opp's only escape is killing Reckoner before Wheel resolves.
- **Key lesson — opponent had Feed the Cycle in hand.** Would have killed Reckoner on the stack before Wheel resolved, but they were 1 mana short due to a missed land drop. Always assume opp has 2+ mana of removal — this combo lives or dies on Reckoner survival.
- **MVP: Boros Reckoner** — single body enabled the entire kill at 4 mana cost.

### Game 28 (piloted by Human): Quit Hitting Yourself vs. Avatar Allies/Sokka (Claude)
**Result:** Human wins T12 (23 sides). Human life 8, Claude life 17→-7.
- Early game: Claude ramped into Sokka T7, attacked freely while opponent built reflection engine. Blazing Sunsteel equipped to Wayta T8.
- T10: Guilty Conscience + Heroic Intervention attempted — but opponent cast GC first, then HI. Claude responded to HI with Firebending Lesson on Wayta, starting the loop without indestructible. Wayta died, GC to GY. Claude took 12 from the loop (40→28). **Key lesson: HI should have come first for hexproof+indestructible before GC.**
- T12: Savage Twister X=4 cleared Sokka/Iroh. T14: Swords to Plowshares exiled Sokka (2nd removal). Wayta recast.
- T15: Sokka recast 3rd time. T17: Combat with Wayta blocking — Sunsteel kills Sun Warriors.
- T18: Path to Exile exiled Sokka again. Fiendlash cast + equipped to Wayta alongside Sunsteel. Double reflection engine online.
- T20: Neyith of the Dire Hunt cast, then Wayta fights Sokka (4th cast). Claude sacced Commander's Sphere + Mind Stone, drew Acrobatic Leap. Leap buffed Sokka to 5/7, killing Wayta in the fight. But Sunsteel+Fiendlash triggers killed Sokka anyway. Both commanders dead.
- T22: Equipment moved to Neyith (6/3 reach). Attacked for 6 unblocked.
- **T23 (lethal):** Claude swung for exactly 8 with 4 creatures. Opponent cast Gideon's Sacrifice targeting Neyith — all combat damage redirected. 4 sources = 4 Fiendlash triggers × 6 power = 24 damage. Lethal from 17.
- **MVP: Fiendlash** — power-based reflection (not just damage reflection) was the key multiplier. Each trigger dealt Neyith's full power (6) regardless of the actual damage taken.
- **Dominance: 3** — deck was humming despite the T10 sequencing error.

### Game 10 (piloted by Human): Quit Hitting Yourself vs. Avatar Allies/Sokka (Claude)
**Result:** Human wins T29 (57 sides). Human life 16, Claude life 14→-14.
- Assembled Pariah + Darksteel Plate lock on Wayta by ~T30. Added Pariah's Shield on Kellan for redundancy, later moved to Wayta after Kellan died to Blasphemous Act.
- Blasphemous Act and Reckless Blaze wiped Claude's board twice, clearing all resistance.
- Pain for All + Donna Noble (soulbonded to Wayta) created 4x reflection engine. Fighting Wayta into Appa (7 power) dealt 28 damage — lethal.
- Claude drew aggressively (Waterbend x3 in one turn) but Swords to Plowshares was 14th from top.
- MVP: Pain for All — turned the defensive lock into a lethal weapon.

### Game 30 (piloted by Claude): Quit Hitting Yourself vs. The Claw/Cruelclaw (Human)
**Result:** Claude wins T13 (25 sides). Claude life 4, Human life 25→dead.
- Opener: Forest, Mountain, Pariah's Shield, Savage Twister, Boros Signet, Star of Extinction, Fear Fire Foes. Ramp plan: Signet T2, Wayta T3 with haste.
- T3: Wayta deployed with haste. Opponent played Cruelclaw + Lightning Greaves same turn — connected immediately via menace, flipping free Ancient Stone Idol (10/10 trample).
- T5: Eladamri's Call tutored Boros Reckoner for a second body to block menace. Critical — without two blockers, Cruelclaw connects every turn.
- T7: Darksteel Plate cast + equipped to Wayta. Indestructible online.
- T9: Boros Reckoner deployed. Menace now blockable. Life bleeding stopped but already at low teens.
- T11: Pariah's Shield cast ({5}). One turn from lock completion. Opponent's window closing.
- T13: Pariah's Shield equipped to Wayta at 4 life. Lock complete — all damage redirected to indestructible Wayta. Cruelclaw's "deals combat damage to a player" trigger neutralized (Pariah's Shield is a replacement effect — damage is NEVER dealt to player, so "deals combat damage to a player" never occurs).
- Opponent played Crabomination, stealing Wrathful Raptors from Claude's GY. Tried Scytheclaw (life loss angle) — also doesn't work since "deals combat damage to a player" never fires through Pariah's Shield.
- Opponent deployed Drakuseth + Lightning Greaves, dealing 3/3/4 breath damage each combat — all harmlessly redirected to indestructible Wayta.
- T21: Opponent moved Lightning Greaves from Cruelclaw to Drakuseth. Claude responded with Fear Fire Foes X=3 to kill the now-targetable Cruelclaw (recast cost {7}{B}{R}). Enlightened Tutor put Blazing Sunsteel on top.
- **T25 (lethal):** Star of Extinction — 20 damage to each creature. Wayta takes 20, Blazing Sunsteel reflects 20, Wayta's ability doubles it = 40 damage to opponent from 25 life. Lethal from behind the lock at 4 life.
- **Comeback:** Survived at 4 life. Opponent's top card was Shadowgrange Archfiend (force sacrifice greatest power) — one draw away from breaking the lock entirely.
- **MVP: Blazing Sunsteel** — turned Star of Extinction into a one-shot kill via Wayta-doubled reflection.
- **Dominance: 3** — both decks did their thing.

### Game 50 (piloted by Claude): Quit Hitting Yourself vs. Eldrazi/Zhulodok (Human)
**Result:** Human wins T7 (14 sides) via commander damage (Zhulodok 27/21). Human life 44, Claude life 16.
- Mulliganed 1-land hand (colorless only). Kept 7 with 2 lands, Talisman, Farseek — solid ramp curve.
- T7: Wayta deployed. T8: Opponent exploded — Metalworker revealed 3 artifacts (6 mana), Forsaken Monument, then Zhulodok + Platinum Angel cascade (Introduction to Annihilation exiled Wayta, Lightning Greaves). 9 commander damage.
- T9: Drew Spitemare — deployed as blocker/reflector.
- T11: Blasphemous Act for {2}{R} (6 creatures) wiped the board. Spitemare reflected 13 to opponent (53→40). Followed with Bonds of Mortality (drew Shielded by Faith).
- T12: Opponent assembled Tron + Forsaken Monument (10 mana from 3 lands). Recast Zhulodok (8 with tax) + Burnished Hart. 9 more commander damage (18/21).
- T13: Drew Screaming Nemesis — deployed as blocker. But Kozilek cascade hit Zuko's Exile targeting Nemesis, removing the only blocker. No mana for Boros Fury-Shield (spent 3 on Nemesis, only 2 open). Commander damage lethal.
- **Key mistake:** Should have held mana for Fury-Shield instead of deploying Nemesis. With 5 mana, needed to choose between a blocker and holding Fury-Shield — chose wrong.
- **MVP: Blasphemous Act** — the one bright spot, wiping 5 creatures and reflecting 13.
- **Dominance: 3** — Eldrazi was humming. Tron + Monument + cascade is overwhelming mana.

### Game 73 (piloted by Claude): Quit Hitting Yourself vs. Bears/Ayula (Human)
**Result:** Human wins T15 via lethal combat damage. Final life: Human 38, Claude 17→dead. Dominance 3.
- T6: Wayta deployed. T8: Banishing Light exiled Ayula (reset +2/+2 counters) + Warrior en-Kor deployed. Tapped out.
- T9: Opponent recast Ayula, attacked with Bear Token. Staggering Size punched 2 trample through Wayta block. Wayta to CZ.
- T10: Recast Wayta (5 mana), attacked with Wayta + en-Kor for 2 damage. But opponent deployed S&G T11 with full board — 8 damage unblocked.
- T12: Savage Twister X=4 cleared Ayula, Bear Token, Earth King, en-Kor. S&G survived at 1 toughness. Critical — couldn't reach X=5 for the kill.
- T13: Opponent rebuilt instantly — recast Ayula + Ruxa. S&G gave counters+haste. 16 trample damage, Wayta died blocking.
- T14: Recast Wayta (7 mana, tapped out). T15: Ayula fight trigger via S&G killed Wayta. Alpha strike lethal.
- **MVP: Savage Twister** — only bright spot, wiping 3 creatures. But S&G surviving negated the reset.
- **Key lesson:** Never drew a reflector or protection piece. Without the combo engine, Wayta is just a 1/5 blocker that dies to fight triggers.
- **Key lesson:** S&G at 6/5 is the priority kill target — it gives everything trample and turbocharges new creatures with counters+haste. Savage Twister X=5 would have been the game-changer but needed 7 mana.
- **Key lesson:** Banishing Light on Ayula is only a tempo play — mono-G has enchantment removal and Ayula recast at {5}{G} is still affordable with Earth King ramp.

### Game 77 (piloted by Claude): Quit Hitting Yourself vs. Dinosaur Eggs/Atla Palani (Human)
**Result:** Human wins T7 (14 sides) via lethal combat damage. Human life 23, Claude 19→0. Dominance 3.
- Opener: Forest, Wooded Foothills, Brash Taunter, Shielded by Faith, Wild Growth, Arcane Signet, Sacred Foundry. Strong keep — both halves of reflection combo + ramp.
- T1-T3: Smooth ramp curve. Wild Growth on Forest T1, Sacred Foundry + Arcane Signet T2, Wooded Foothills→Stomping Ground (tapped) + Wayta (haste) T3. Wayta swung for 1 cmdr damage T3.
- T4: Shielded by Faith on Wayta. Wayta indestructible. Attacked, Atla blocked, both survived.
- T5: Brash Taunter cast, no attack (preserved Wayta to block trample T6).
- T6 (T11): Brash Taunter fight Trumpeting Carnosaur. Brash takes 7, indestructible survives, reflects 7, Wayta amp doubles to 14 dmg. Opp 39→25.
- **CATASTROPHE T6 (opp's T12):** Mosswort Bridge hideaway → Ghalta Stampede Tyrant (free). In response to Ghalta's "put creatures from hand to BF" trigger, sac'd Ghalta to Greater Good (drew 12). Ghalta ETB still resolved → dumped Pantlaza, Ripjaw Raptor, Gishath, Silverclad. Marauding Raptor +2/+0 per dino, Pantlaza discover hit Xenagos. Silverclad enrage forced sac (chose Wild Growth).
- Combat T6: Wayta blocked Gishath (5 absorbed + 9 trample). Carnosaur 7 trample unblocked. 16 damage. Gishath flip trigger revealed 9 → Regisaur Alpha + Palani's Hatcher + Rampaging Brontodon. Hatcher's eggs auto-died to Marauding Raptor → Atla flips → Zetalpa + Wrathful Raptors. Took 2 from Wrathful Raptors enrage. Life 37→19.
- Opp M2: Sac'd 26-power Marauding Raptor (UEOT buffed from 12 dino entries) to Greater Good → drew 26 cards. Sac'd Hammerskull → drew 6, discard 3. Found Path to Exile → killed Brash Taunter (lost reflection win con). Search basic Plains.
- T7 (my T13): Eladamri's Call → tutored Stuffy Doll (new reflection plan). Banishing Light Wrathful Raptors (would have backfired any SoE wipe — 20 dmg per dino dealt damage = 240+ to me).
- Opp T14: Akroma's Will (BOTH modes — flying, vigilance, double strike, lifelink, indestructible, protection from each color). Wayta multicolored, can't block. 12 attackers, 74 power × double strike = 148 damage. Lethal.
- **MVP loser: Brash Taunter** — 14 dmg via fight reflection before exiled.
- **Key lesson:** Wrathful Raptors on opp's side WRECKS the reflection plan — Star of Extinction wipes opp's dinos, each triggers Wrathful Raptors to deal 20 to non-Dino target (me). 12 dinos = 240 dmg backfire. Banishing Light Wrathful Raptors must be priority before any board wipe.
- **Key lesson:** UEOT buffs on Marauding Raptor (from dino entries) carry to Greater Good's "draw cards equal to sacrificed creature's power." 26 cards from one sac is opp's panic-button.
- **Key lesson:** Akroma's Will both modes is unstoppable lethal vs. monocreature defenses. Wayta as the only blocker can't handle protection from each color (multicolored herself).
- **Key lesson:** Brash Taunter is high-priority removal target for opp. Once exiled, the entire reflection win con dies. Need redundant indestructible protection (Darksteel Plate, Timely Ward) on Brash, not just Wayta.

### Game 86 (piloted by Human): Quit Hitting Yourself/Wayta vs Faeries/Tegwyll (Claude)
**Result: Human wins T18 (sides 18) via Wayta-fight reflection chain. Final life: Human 34, Claude -1. Dominance 1.**
- T2-T3: Smooth ramp — Temple Garden shock, Sol Ring, Arcane Signet on curve.
- T3-T4: Spiteful Sliver, then Screaming Nemesis. Claude held counter on both (correct call for them — both were cheap reflectors, neither lethal alone).
- T5: Pain for All on Nemesis (key amp — turns Nemesis into "deals damage to each opp" reflector via the Aura's trigger). Pain for All ETB-3 killed Tegwyll on entry. Timely Ward on Sliver added indestructibility.
- T6: Wayta cast {R}{G}{W}=3 via Sol Ring + Signet + BoP.
- T7: First Wayta-fight chain — Nemesis fights Talion's Messenger. Pain for All + Nemesis own + Wayta amp = 4 dmg + no-life-gain rider on Claude. Killed Messenger.
- T8: Claude Murder on Wayta + Cyclonic Rift on Sliver. Both removal pieces spent, Wayta to CZ, Timely Ward to GY.
- T9: Wayta recast at +2 tax (5 mana). 
- T10: Sliver recast {2}{R} + **Shaman en-Kor cast {1}{W} (the keystone).** Claude tapped out from Archmage cast prior turn — couldn't counter either.
- **T11+ (lethal sequence):** End of Claude T17 + opp upkeep T18: Wayta fight Sliver vs Nemesis ({G}, T because both opp's). en-Kor {1}{W} redirects Sliver-incoming damage to itself. en-Kor {0} (free) redistributes 1 to Sliver / 1 to Wayta / 1 stays on en-Kor. Triggers: Sliver own (1+amp=2), Pain for All on Nemesis (2+amp=4), Nemesis own (2+amp=4) = 10 dmg per cycle. Two cycles killed Claude (19 → 9 → -1).

**Key lessons:**
- **Wayta-fight + en-Kor + 2 reflectors = clean repeatable kill.** 10 dmg per cycle, 3 mana cost ({G} + {1}{W}). Once assembled, opponent's race window is 1-2 turns.
- **en-Kor is the keystone.** Without en-Kor's redirector, Sliver dies to fight damage and the chain stops. With en-Kor, damage funnels to one reflector and gets distributed to keep all alive.
- **Pain for All is the cheapest amp.** Without Pain for All, Nemesis only triggers its own reflection (2+amp=4, not 8). Pain for All adds +4 dmg per Nemesis hit. Cast on Nemesis ASAP.
- **Wayta amp doubles every reflection trigger.** 5 dmg becomes 10. Lethal scales fast with multiple reflectors.
- **Don't fear losing Wayta to removal.** Recast at 5 mana (+2 tax) was fine — opp burned Murder for tempo, the chain still won.
- **Faeries' counters are dead vs the chain.** Activated abilities aren't spells. Drain/Denial/Ice Out useless. Claude needed bounce/removal on en-Kor.
- **Timely Ward bait.** Used on Sliver T5, got Cyclonic Rift'd off T6. Worth casting anyway — bought 4 turns of indestructibility and forced opp to commit removal.

### Game 92 (piloted by Claude): Quit Hitting Yourself/Wayta vs Cats/Mirri (Human)
**Result: Claude wins T13 (sides 25) via Blasphemous Act + Donna Noble reflection. Final life: Claude 38, Human -28. Dominance 2.**
- Opener: KEEP 3 lands (Forest, Plains, Stomp), Donna Noble, Chromatic Lantern, Shaman en-Kor, Neyith. Strong color fix for Wayta T5.
- T3: Plains + Shaman en-Kor ({1}{W}) — keystone deployed early.
- T5: Stomping Ground shock (38), Wayta on curve. Attacked en-Kor + Wayta for 2 unblocked (opp tapped, Lion Sash artifact mode).
- T7: Mountain + Donna Noble ({3}{R}), soulbond paired with Wayta on ETB. Attack Wayta — opp let through for 1 (Donna+amp = 6 reflect would've fired on block).
- T9: Jetmir's Garden tapped + Birthright Boon adventure ({1}{W}) tutored Shielded by Faith. Wayta attack 1 CDMG unblocked again.
- T9 combat: Opp double-blocked Wayta with Mirri+JT. Wayta died, but two damage events × Donna paired × Wayta amp = 12 dmg to opp (37→25). Wayta to CZ.
- T11: Mountain + Spectator Seating (tapped) + Wayta recast at 5 mana (+2 tax). **Donna soulbond RE-PAIRED with new Wayta** (rule 702.93c — soulbond fires when ANY creature enters under your control while soulbond creature is unpaired). Opp disputed, looked up rule, accepted; retracted double-block, took 1 CDMG instead.
- T13: Drew Blasphemous Act. 6 creatures on board (Wayta, Donna, en-Kor, Mirri, JT, Warleader) reduced cost to {2}{R} = 3 mana. **Wayta + Donna paired = 13 dmg to Wayta (Donna fires + amp = 2× 13) + 13 dmg to Donna (Donna fires own + amp = 2× 13) = 4 triggers × 13 = 52 dmg lethal from 24.**
- **MVP: Donna Noble** — without paired Donna, Blasphemous Act is 0 damage to opp. Soulbond on Wayta + Wayta amp = quadruple reflection on every damage event.
- **Key lesson — Blasphemous Act + Donna+Wayta = 4× quadrupled reflection.** Every creature-damage spell becomes 4× lethal multiplier. Earthquake / Star of Extinction / Pyrohemia all scale the same way.
- **Key lesson — Donna soulbond re-pairs on any creature ETB.** Rule 702.93c: when an unpaired creature enters under your control, you may pair it with an unpaired soulbond creature you control. Wayta recast from CZ triggers re-pair. Cite rules to opp if disputed.
- **Key lesson — Wayta double-block ALSO triggers 2 damage events × amp = 4× total.** Opp double-blocking Wayta to kill him deals 2 separate damage events, each amp'd, = 4× Donna trigger. Major lesson for opp: NEVER double-block a Wayta paired with Donna.
- **Key lesson — Birthright Boon (Kellan adventure) is a 2-mana tutor for any aura/equipment.** Strong utility for the deck — tutors Shielded by Faith, Darksteel Plate, Pariah, Pariah's Shield, Blazing Sunsteel, Fiendlash. Worth running multiple tutors.

## Matchup Notes
- **vs. Cats/Mirri:** 1-0. Cats' threat is incremental — Mirri 3/2 FS as restrictor commander, JT 3/3 vig/trample, Warleader 4/4 with cat tokens. None individually scary, but combined alpha strikes hurt. Key tactics: (1) Wayta has 5 toughness — survives single Mirri/JT block via Donna reflection. (2) Donna paired = trades damage taken for opp life. EVERY block on Wayta becomes 6 dmg to opp (3 + amp 3). Opp's best play is NOT BLOCKING. (3) Aura Shards on opp's side is dangerous — destroys my artifact/enchantment every time opp deploys a creature. Don't deploy Shielded/Darksteel Plate when Aura Shards is live unless Blasphemous Act is in hand. (4) Blasphemous Act with Donna paired = instant lethal at 3 mana once 6+ creatures on board (52 dmg). Mass damage spells are the kill button. (5) Cats deck has Path/Swords but uses them sparingly; Treasure tokens enable instant-speed removal but opp must spend the treasure. Don't bait removal pointlessly. (6) Mirri's "1 blocker" restriction on her attack isn't relevant if I'm not blocking — only matters if I'm forced to defend.
- **vs. Squirrel Food/Chatterfang:** 1-0. The deck doesn't have early instant-speed creature removal in most opening hands, which gives Reckoner time to live. Wheel of Misfortune + Gideon's Sacrifice on Reckoner is a 4-mana kill once Reckoner is live — Reckoner online by T3-T4 with BoP ramp makes the combo achievable T5-T6. Watch for: Feed the Cycle ({1}{B} forage, instant) and Bake into a Pie ({2}{B}{B}) — both kill Reckoner cleanly. Spider Food doesn't hit creatures. Chatterfang's forestwalk through Temple Garden is unblockable but a 3/3 commander is slow vs the combo clock. Priority: deploy Reckoner ASAP, threaten Wheel + GS as the finisher.
- **vs. Eldrazi/Zhulodok:** 0-1. Eldrazi outramps this deck badly. Forsaken Monument + Tron = 10+ mana from 3 lands. Cascade into removal (Introduction to Annihilation, Zuko's Exile) strips key pieces. Platinum Emperion blocks all damage-based win conditions until removed. Priority: (1) Keep a blocker for Zhulodok at all times — commander damage is the real clock. (2) Don't tap out for creatures when Boros Fury-Shield in hand — the shield buys a full turn. (3) Blasphemous Act is the best answer but needs a reflector to profit. (4) Kozilek's discard-to-counter shuts down most answers — bait it or play around MV matching.
- **vs. The Claw/Cruelclaw:** 1-0. Cruelclaw's menace requires TWO blockers — Eladamri's Call or early creature deployment is essential to stop the trigger engine. Lightning Greaves gives shroud, so removal must target Cruelclaw when Greaves moves to another creature (opponent will move Greaves for equip — that's the window). Pariah's Shield + Darksteel Plate on Wayta completely shuts down the deck: (1) combat damage never reaches player, so Cruelclaw's trigger never fires, (2) Scytheclaw's "loses half their life" also requires combat damage to a player. Without the trigger engine, The Claw has no card advantage and grinds to a halt. Star of Extinction + Blazing Sunsteel is the finisher through the lock. Key danger: sacrifice effects (Shadowgrange Archfiend, Flare of Malice) bypass indestructible and break the lock — race to the kill once lock is assembled.
- **vs. Bears/Ayula:** 0-1. Ayula's fight trigger is a huge problem — it removes Wayta before the reflection engine assembles. S&G (6/5) fights Wayta (1/5) cleanly. Without a reflector, Wayta is just a bad blocker. Earth King gives Bears explosive mana — by T15 they had 10+ forests and could deploy their entire hand. Priority: (1) Kill S&G first — it gives trample, counters, and haste. Without it, bears are just vanilla beaters. (2) Save board wipes for when they can kill S&G (X=5 minimum for Savage Twister). (3) Need to find reflectors early — the deck does nothing without the combo engine. (4) Banishing Light on Ayula is tempo, not permanent removal — have backup. (5) Gideon's Sacrifice + a reflector could turn the bear army's damage against them, but we never found the reflector.
- **vs. Dinosaur Eggs/Atla Palani:** 0-1. Atla + Marauding Raptor = free flip engine snowballs hard. Mosswort Bridge + Ghalta is a panic-button: Ghalta sac'd in response to her own ETB trigger empties opp's hand onto board for free. Greater Good turns dino-pile into 26+ card draws using Marauding Raptor's UEOT buffs. KEY DANGER: Wrathful Raptors triggers on opp's dinos taking damage — every dino in a Star of Extinction wipe deals 20 to non-Dino target (240+ dmg back to me with full board). Priority: (1) Banishing Light Wrathful Raptors BEFORE any board wipe attempt. (2) Remove Atla early via Banishing Light or fight to deny flip engine. (3) Protect Brash Taunter with redundant indestructible (Darksteel Plate equipped) — opp finds Path to Exile easily via Greater Good draws. (4) Akroma's Will is the panic finisher — protection from each color makes Wayta useless as blocker. Need to race before opp finds it.
- **vs. Avatar Allies/Sokka:** 2-0 in the matchup. Sokka's menace prevents profitable blocking with a single reflector, forcing the deck to use removal (Swords, Path, Savage Twister) to clear Sokka repeatedly. Commander tax eventually prices Sokka out (5th cast = 12 mana). Key tactics: (1) Sequence protection BEFORE combo pieces — cast Heroic Intervention first for hexproof+indestructible, then Guilty Conscience. (2) Fiendlash on any creature turns Gideon's Sacrifice into a lethal counter — multiple damage sources = multiple triggers at POWER (not reflected amount). (3) Neyith is a strong backup equipment carrier — fight draws cards, reach blocks flyers, and she's a real body. (4) Don't underestimate chip damage from equipped creatures — even without Wayta's doubling, Sunsteel + Fiendlash on any creature creates dangerous reflection.
- **vs. Faeries/Tegwyll:** 1-0. Faeries' counter package is dead vs Wayta's ability-based combo (fight + en-Kor redirects aren't spells). Forces them to use removal/bounce, which they have limited copies of (Murder, Cyclonic Rift, Snap, Go for the Throat). Priority: (1) Land Pain for All on Nemesis early — cheapest amp at {2}{R}. (2) Don't extend Wayta into Murder range without backup; tax recast at 5 mana is fine. (3) en-Kor is the keystone — protect with Heroic Intervention or Plaza of Heroes activation if available. (4) Spiteful Sliver as lord-style anthem (gives reflection to all Slivers) is bonus utility. (5) Tegwyll's deathtouch is annoying for Wayta-fighting (deathtouch kills Wayta on any damage), so target Tegwyll first via fight or save Brash Taunter for it.
