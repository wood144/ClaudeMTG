# Everything Must Go / Mahadi, Emporium Master — Deck Primer

Commander: **Ayara, Widow of the Realm** ({1}{B}{B} 3/3 — `{T}, Sac another creature or artifact:` X damage to target opponent + gain X, X = sacrificed permanent's MV. `{5}{R/P}:` transform, sorcery-speed → **Ayara, Furnace Queen** 4/4: at the beginning of combat on your turn, reanimate an artifact/creature from GY with haste, exiled at next end step) | Colors: Rakdos (identity from the {R/P}; she casts off mono-black mana)
Commander swapped 2026-08-14 after game 123, replacing Mahadi, Emporium Master. Mahadi left the deck entirely — his Treasures duplicated 7 rocks + 3 Treasure spells, his trigger was end-step/own-turn/must-survive, and game 123 was won at 49–2 with him dead since T12. The 99 is unchanged.
v2 of the Claude-style deck (replaces The Nightly Toll / Braids, retired 2026-08-01). Built from collection.db. Full list rationale in `assets/mahadi_proposal.txt`.

## Strategy
- **Every body pings on the way in** (Impact Tremors, Witty Roastmaster, Shocking Sharpshooter, Agate Instigator, Ayara) **and drains on the way out** (Blood Artist, Zulaport, Vraan, Falkenrath Noble, Judith, Garna). Recursive fodder (Skeleton, Bloodghast, Cult Conscript, Persistent Specimen, Fleshless Gladiator, Silversmote Ghoul, Haunt) loops through both trigger sets.
- **Ayara is the guaranteed sac outlet.** The 99 has seven repeatable outlets (Ashnod's Altar, Vampiric Rites, Yahenni, Smothering Abomination, Chthonian Nightmare, High Market, Sidisi; Westvale needs 5 bodies) — ~7%, so drawing one on time was a coin flip. Command-zone access is the whole point of the swap; do NOT add an eighth outlet to the 99.
- **Ayara math:** X = the sacrificed permanent's mana value, so cheap fodder pings for 1–2 and the fatties are the payload. **Kokusho = 6 from Ayara + 5 from his own trigger = 11 in one tap, no combat.** Harvester and Smothering Abomination are 6 and 5. Treasures are MV 0 — they are NOT Ayara food.
- **Free every-turn loop: Bloodghast** (returns on each land drop) and **Silversmote Ghoul** (returns on gain-3 turns) → tap Ayara, 2 damage + 2 life, zero mana, every turn.
- **She taps** — one sacrifice per turn, and she's summoning-sick the turn she lands. On burst turns, sac through Ashnod's Altar instead and save her tap for the highest-MV body.
- **Furnace Queen ({5}{R/P}, sorcery speed; the {R/P} can be paid with 2 life) is the answer to getting swept.** Reanimate a body each combat, sacrifice it in response to the end-step exile trigger — the engine moves from the battlefield to the graveyard, where this deck's losses (g119 Klauth's Will, g121 Hullbreaker) can't reach it. Kokusho every turn = 11/turn that ignores creature removal.
- **Win standing still:** drains + pings + Gray Merchant/Kokusho, Treasures + Jeska's Will into lethal Exsanguinate. No combat math.
- **Real removal this time:** Terminate, Bedevil, Abrade, Rakdos Charm at instant speed; Blasphemous Act / Chain Reaction / BSZ wipes (near one-sided with a recursive board + drains out).

## Wipe math cheat sheet (learned the hard way, Game 119)
- **Yahenni's Expertise -3/-3 kills toughness ≤3 ONLY.** Check every toughness on board before casting. A 4/4 survives at 1/1.
- **BSZ needs X ≥ highest toughness** you want dead. X=4 = 6 mana. Counters are permanent — this is the clean answer to 4-toughness boards and it reshuffles for reuse.
- **Blasphemous Act costs {8}{R} minus {1} per creature** — with only 2 creatures out it's 7 mana. Don't count on it early against low-to-the-ground boards.
- **Chain Reaction X = ALL creatures including mine** — needs a wide board (anyone's) to kill anything.

## Swaps Made 2026-08-14 (v3 "Ayara build" — in decks.json, pick list at `Everything-Must-Go-picklist.docx`)
Six swaps, all from owned stock, chosen against Ben's four pillars (sac-wanting bodies / ETB-LTB payoffs / sac engine / recursion, plus draw) — the deck's real problem is setup time, so every add doubles up on two pillars at once.
- **IN Vermin Gorger** ({1}{B} 2/2, `{T}, sac another: EACH opponent loses 2, you gain 2`) / OUT Headless Rider. Gorger is Ayara's ability on a two-drop — outlet AND payoff, and it scales per opponent in a pod. Headless Rider only triggers on nontoken **Zombies**, and the only other Zombie in the deck was Silversmote Ghoul (Doomed Dissenter is a Human and its token is a token) — it was a near-blank.
- **IN Phyrexian Ghoul** ({2}{B} 2/2, free unlimited sac) / OUT Shocking Sharpshooter (worst pinger — 1 damage to ONE opponent, where Impact Tremors and Witty Roastmaster hit each).
- **IN Not Dead After All** ({B} instant: sac it, it returns) / OUT Rise of the Dark Realms (9 mana; this deck kills at 6–8 or not at all). Doubles a Gray Merchant ETB, re-triggers Ayara-First-of-Locthwain, and dodges targeted removal for one mana.
- **IN Bushmeat Poacher** ({3}{B} 2/4: sac → gain life = toughness + draw) / OUT Yahenni's Expertise (-3/-3 whiffed completely in g119). The lifegain also switches on Silversmote Ghoul's "gained 3+ life" recursion, which had almost no enablers.
- **IN Agent Venom** ({1}{B}{B} 2/3 flash menace, draw on each nontoken death) / OUT **Unexpected Windfall**. Originally this cut was Big Score, but Ben couldn't find Unexpected Windfall physically and subbed Big Score back in — a straight upgrade: identical text (discard a card, draw two, two Treasures) at **{3}{R} instead of {2}{R}{R}**, and a double-red pip was the worst caster in the deck once the basics went to 7 Mountains. Unexpected Windfall's row was deleted from `collection.db` (7,673 → 7,672 distinct; backup at `collection.db.bak`).
- **IN Spirit of Malevolence** ({1}{B} 2/1, dies → each opponent loses 1) / OUT Corrupted Conviction (four one-shot sac spells was one too many against zero repeatable outlets).
- **Basics: Swamp 10 → 12, Mountain 9 → 7.** Mahadi's cost demanded {R}; Ayara is {1}{B}{B} and her flip's {R/P} is payable with 2 life, so red is now a splash (13 red cards, only Bedevil needs {R}{R}) while black wants double pips on turn three plus Gray Merchant devotion. 9 of the 16 nonbasics make both colours, so red still sees 16 sources.
- **REJECTED: Bringer of the Last Gift** (6/6 flier, {6}{B}{B}). Ben's read, and correct: this graveyard is deliberately transient — Bloodghast, Reassembling Skeleton, Persistent Specimen, Cult Conscript and Silversmote all leave the yard on their own — so the reanimation half often returns little for me while refilling three opponents in a pod.
- **CAUTION: the tracker's deck-sync strips the `*CMDR*` marker and rewrites the commander to its full DFC name.** Re-check `decks.json` after any tracker session.

## Swaps Made 2026-08-02 (v2.1, in decks.json — not yet sleeved)
- Necrodominance → Morbid Opportunist (Ben's call: Necro's exile-replacement shuts off the entire recursion package)
- Fleshless Gladiator → Greedy Freebooter (dead poison clause → dies-into-Treasure+scry)
- Ravenous Amulet → Sidisi, Regent of the Mire (repeatable sac+reanimate ladder — the engine restart button g119 lacked)
- Seize the Spoils → Demonic Tutor (Ben explicitly waived his no-tutors guideline for this deck — his guidelines are for HIS decks/fun; Lagomos's tutor mode also fair game)
- Chain Reaction → Buried Alive (4 wipes → 3; Buried Alive stacks Kokusho + recursive bodies for Reanimate/Victimize/Sidisi)
- Rogue's Passage → 10th Swamp (deck never attacks)
Bench (owned, on-theme, future cuts): Final Parting, Vile Entomber, Burnished Hart x3, Lively Dirge, Night's Whisper x4, Cruel Celebrant, Vindictive Vampire x2.
Key new line: Buried Alive → Reanimate Kokusho (T3-4); Kokusho + sac outlet + recursion = repeatable 5-drain.

## Game History

### Game 119: Everything Must Go/Mahadi (Claude) vs. Meteor Apes/Roxanne (Human)
**Result:** Human wins, sides 23 (T12) via combat damage. 39–1. Dominance 3. Claude conceded to guaranteed Meteorite-ping lethal.

**Key plays:**
- Bedevil killed Roxanne T8 in her tapped-out window (correct, clean).
- BSZ X=4 killed Mandrills + Towering Gibbon in one card (the deck's best turn).
- **BLOWOUT: Klauth's Will X=3 cast in RESPONSE to Victimize** — killed Mahadi + Haunt (the sac fodder), and Victimize resolved into "no creature to sacrifice" = total blank. One card ate commander + engine + spell.
- **MISPLAY: Yahenni's Expertise into a 4-toughness board** — nothing died. Only salvage was the free Commander's Sphere rider.
- Tamiyo's Safekeeping ({G}!) blanked Terminate on recast Roxanne; Kogla ETB-fought Blood Artist; Roxanne + Meteorite pings closed from there.

**Lessons (playtest #1 for this build):**
- **"Gruul has no instant-speed interaction" is FALSE for Meteor Apes.** Magmaquake, Klauth's Will, and Starstorm are INSTANT X-sweepers. Open {R}{R} = assume X-burn. Never mid-combo into it — cast sac-payoff spells (Victimize, Chthonian loops) only when they're tapped out, or bait the sweeper first with recastable fodder.
- **The engine has no bootstrap without a creature.** After the KW blowout, Haunt recursion (needs a legend), Victimize (needs a sac body), and Chthonian Nightmare (needs a sac body) were ALL dead — 3 recursion cards stranded by having zero creatures. The 1-mana recursive fodder (Bloodghast, Skeleton, Conscript) is the deck's actual backbone; mulligan/dig toward it, deploy it before payoffs.
- **Mahadi made 0 Treasures all game.** Every death on my turn happened while he was dead or arriving. Protect the end-step window.
- **Drew zero card draw** (Arena, Necrodominance, Windfall trio never seen in ~12 cards). Grind plan needs the draw engine; consider whether 23 lands... (land count fine — 31+; variance).
- Life as shield worked: drains + Safekeeping-style incidental gains kept a 10-damage/turn board from closing for 3 extra turns. But 40 → 1 with zero pressure back means the deck MUST establish the ping/drain board by T8-10 or it's just a life total.

### Game 120: Everything Must Go/Mahadi (Human) vs. Meteor Apes/Roxanne (Claude)
**Result:** Human wins, sides 17 (T9), 26–0 via Kokusho death drain. Dominance 3. Deck's first win — piloted by Ben, one game after Claude lost with it.

**Key plays (this is the deck's textbook game):**
- Curve: T5 Mahadi → Harvester of Souls → Kokusho → Big Score → Judith → Vraan. Attacked with the value bodies early (Mahadi/Harvester/Kokusho beat down to CDMG 9 + forced Claude to 19) — the deck CAN race while assembling.
- Never over-traded: declined bad blocks, let Claude's alpha through (took 16 in one turn, banked at 24), because life is the resource the deck defends LAST.
- **The kill: BSZ X=5 on HIS OWN full board at Claude's 3 life — Kokusho dies too, death trigger drains 5.** Kokusho + any wipe = burn spell. Claude had zero outs (KW can't hit fliers; no counter, no lifegain).
- Claude's best sequence against it: Port Razer connect → extra combat → Meteorite ping killing damaged Mahadi (marked-damage + ping arithmetic) — cost Ben the commander but not the game.

**Lessons:**
- Kokusho is not (just) a beater — treat him as a 5-point drain rider on every wipe. Sequence wipes AFTER he's deployed.
- Judith's death-pings (hers + other dying nontokens) execute 3-toughness commanders through X=2 sweeps — opponents can't cleanly Breathe Flame her while their commander's out.
- Harvester of Souls turned Claude's every chump/trade into a card. Opponents stop blocking, which feeds the beatdown line instead.

### Game 121: Everything Must Go/Mahadi (Claude) vs. Fblthp (Human)
**Result:** Human wins T22 via combo (Sensei's Top + Omniscience = free-recast Top loop → draws the deck → wincon). 32–23. Dominance 3. First v2.1 outing (tutor build).

**Key plays:**
- Mulled to 6 (free first mull — remember it). One-B-source hands haunted the early game; Treasures (Windfall) were the only reason Arena/Mahadi landed on time.
- Demonic Tutor → Abrade → killed Gauntlet of Power T11: right call, bought ~4 turns of ETI delay.
- **MISPLAY PATTERN: recast Kokusho twice into an active Hullbreaker Horror (~12 mana bounced away).** With HB + Omniscience out, every free cast of his bounced my best permanent. The correct line was Bone Shards/removal on HB FIRST, bodies after — I paid two Kokusho casts to learn it.
- Bone Shards (discard Bloodghast — it landfalls back) killed Hullbreaker; board finally stuck after that.
- Kokusho blocking Katara (his 4-xp draw engine by then) was correct but ~8 turns late; she'd already dug him half his deck.

**Lessons (v2.1 playtest #1):**
- **Omniscience resolving ≈ the real loss point.** BR's only answer in the 99 is Feed the Swarm (never drawn). DT was already spent on Abrade→Gauntlet (defensible — Gauntlet was the live threat then). vs enchantment-combo shells: DT's default fetch is Feed the Swarm, not Abrade, unless an artifact is lethal NOW.
- **vs an active bounce engine (Hullbreaker-class): stop deploying threats, kill the engine.** Every cast he makes undoes my best permanent — tempo math is unwinnable until it's dead.
- **Tidal Barracuda turns my instants into sorceries** (can't cast on his turn). Held removal has no "combo response" mode — fire it proactively at the best target on my own turn.
- **Kill their DRAW/SELECTION pieces, not their mana, once Omniscience is out** (mana denial goes dead). Katara (opp-turn xp), Sindbad, Top: cheap, cast early, and they assembled everything. My removal kept aiming at mana rocks/doublers one threat-generation behind.
- Deck showed its floor without a sac outlet: Kokusho hardcasts with no Rites/Abomination online = just a blocker. Sequence sac outlet BEFORE the dragon when both are in hand.

### Game 122: Everything Must Go/Mahadi (Claude) vs. I Call Him Big Booty/Doran (Human)
**Result:** Claude wins T15 (round 8), 43–0 via Blood Artist + Vraan sac-chain drain. Dominance 3. Deck's first Claude-piloted win (deck 2-2 overall).

**Key plays:**
- Race read was right: their deck sets up slowly (no creature until T10 Doran) — 3 pingers by T5 (double Agate via Offspring) put them to 12 by T9 while my life never dropped below 35.
- **Gray Merchant at devotion 4 + Exsanguinate X=6 did 17 of the 40** — life loss, immune to everything they had.
- **The Wanderer (prevents all NONCOMBAT damage to controller + their permanents) blanked the entire ping board AND made Blasphemous Act one-sided against me.** The outs that ignore her: life loss (drains, Exsang, Kokusho) and combat. Check for her class of effect before leaning on ping lethality.
- **The kill (8 mana, 3 energy): Buried Alive (Kokusho/Artist/Vraan) → Chthonian Nightmare loop.** Each recast = +3 energy (net +2/cycle): sac Merchant → Artist back; sac Mahadi (Artist −1) → Vraan back; sac Artist (Artist −1 + Vraan −2) = 0. Kokusho never needed — the MV-1/2 ladder was cheaper than X=6.
- Nightmare ladder mana math: Buried is 3 mana not 2, and Sol Ring wastes a {C} on {1}{B} recasts — Treasures are the cleaner recast mana. Nearly whiffed the chain by miscounting; ledger the sources before announcing.
- Fed blanked pingers (post-Wanderer Roastmaster/Instigator) to forced blocks at Ben-4 life → 2 Treasures that paid for the final recast. Dead cards → mana.

**Lessons:**
- **Doran 0/5 blocks as 5/10 and their Toxicrene (40K: 2/4 reach deathtouch) eats anything** — never attack into them with keepers; recursives and blanked cards only.
- **Sorcery-speed sac chains are safe vs Abzan tapped out** — count their open mana, then combo on my own turn freely. Their interaction (StP, Anguished Unmaking) is spot removal; the chain's response windows only matter if mana is open.
- Their 40K Toxicrene's Hypertoxic Miasma (all lands tap any color) fixed MY colors too — made {B}{B}+{X} casts trivial. Read statics for upside, not just threat.

### Game 123: Everything Must Go/Mahadi (Human) vs. Meteor Apes/Roxanne (Claude)
**Result:** Human wins, sides 15 (round 8), 49–2 via Kokusho → Vampiric Rites drain. Dominance 3. Deck now 3-2 (Ben 2-0, Claude 1-2).

**Key plays — this is the deck's best game so far:**
- **T1 Sol Ring → T3 Mahadi → T5 Jeska's Will BOTH MODES** (6 red off a 6-card opposing hand) deploying Etched Familiar + Fellwar Stone + Charcoal Diamond in one turn. Jeska's Will scales off the *opponent's* hand size — it's at its best cast early, before they empty their hand.
- **Plumb the Forbidden as instant-speed protection:** in response to a Meteorite's targeted 2-damage trigger, sacrificed the targeted Etched Familiar as the additional cost. Trigger fizzled for no damage, one copy per creature sacrificed → drew 2, +1 off Harvester = **3 cards, and the Familiar's death drain paid for the 2 life.** Generalize: any targeted removal/ping aimed at a creature can be blanked into card advantage.
- **The kill: Vampiric Rites sacrificing Kokusho at their 8 life** — 5 (Kokusho) + 1 (Blood Artist) = 6 loss, +7 gain (Rites gains 1 too). No combat, no response window they could use. Rites is a *free* outlet, so this is reach available every turn.
- **Held Harvester/Ayara/Totentanz home and attacked with Kokusho alone** once they built a 15-power wall (Flopsie counters). Correct: the deck doesn't need combat, and Harvester as a 5/5 deathtouch blocker taxes every attack.
- Rakdos Charm destroying their Meteorite token cut Roxanne's mana-doubling engine — remember Charm's artifact mode hits *tokens*.

**Lessons:**
- The ping/drain shell doesn't need Mahadi. He died in a T12 block and the game was never in doubt — Ayara/Blood Artist/Totentanz/Kokusho carried it. Consistent with the design goal: **win standing still.**
- Kokusho + a free sac outlet is the deck's real finisher, not Exsanguinate. Neither Gray Merchant nor a big X-drain was needed.
- Deploying a sac outlet (Vampiric Rites, {B}) BEFORE the fat is what g121 said was missing; doing it in the right order this game converted Kokusho from a blocker into 6 points of reach.

### Game 124: Everything Must Go/**Ayara, Widow of the Realm** (Human) vs. Boros Equipment/Kellan (Claude)
**Result:** Human wins, sides 14 (round 7), 44–7 by combat damage. Dominance 3. **First game with the new commander; deck 4-2.**

**Key plays:**
- **The edict package won the game outright.** Vraska's Fall (round 3) and Sheoldred's Edict (round 6, in response to the attack trigger) each ate Kellan when he was the only creature on board. Two 2-3 mana instants taxed a commander from 3 → 5 → 7 mana against a 5-land board. Voltron decks have no answer: hexproof, indestructible and phasing (Haystack) all fail to a sacrifice.
- **Ayara flipped on round 7** ({5} + 2 life via {R/P}). Furnace Queen immediately reanimated Doomed Dissenter with haste, attacked with it, then **High Market sacrificed it in Main 2 before the end-step exile trigger** — squeezing a Zombie token + Judith ping + Vraan drain out of a body that was going to be exiled anyway. That sac-before-exile line is the engine's core trick; the reanimated creature is free value twice.
- Judith's +1/+0 anthem quietly did more than the pings: it pushed Vraan and the Zombie tokens to 3 power, which mattered because Kellan's Wrecking Ball Arm plan reads "can't be blocked by creatures with power 2 or less."
- Alpha at round 7 was 15 power across five bodies.

**Lessons:**
- **The commander swap worked, but not the way I expected.** Ayara's sac-outlet mode was never activated once — she won as a 3/3 body that flipped into a recursion engine. The value was the *flip*, exactly the reason I picked her over Anje.
- Timing note for the flip: {5}{R/P} is 6 mana, but the Phyrexian red means it's castable off pure black mana + 2 life. Don't hold it waiting for a Mountain.
- **vs voltron/single-creature decks, lead with edicts, not spot removal.** Save Terminate/Bedevil for creatures that dodge sacrifice (they had none) and let the edicts do commander-tax damage.

## Matchup Notes
- **vs. Boros Equipment/Kellan (1-0):** Their deck is one creature (Kellan) wearing everything, backed by ~16 equipment and only ~14 real creatures. **Edicts are the answer — Sheoldred's Edict and Vraska's Fall blank the entire deck** because Champion's Helm (hexproof) and Dragonfire Blade (hexproof from monocolored) don't stop a sacrifice. **Their one out is Haystack** ({2}, {T}: phase a creature out) — a phased-out Kellan doesn't exist, so the edict finds nothing and they pay no tax. So: fire edicts when Haystack is absent, tapped, or they're tapped out, and treat 2 open white mana with an untapped Haystack as "the edict is dead this turn." Fire them when Kellan is their only body; each one adds {2} of tax and they're on a Boros mana base with no ramp beyond Sword of the Animist. Do NOT waste Abrade/Rakdos Charm on equipment — the equipment is harmless without a creature, and killing it just makes their deck's dead draws live. Watch for: Wrecking Ball Arm (base 7/7, can't be blocked by power ≤2 — Judith's anthem pushing my bodies to 3 power turns that off), Maul of the Skyclaves (free ETB attach, grants flying — my only fliers are Kokusho and Falkenrath Noble), and Blackblade Reforged (+1/+1 per land). Kellan has DOUBLE STRIKE, so all commander damage counts twice: a 13/13 Kellan is 26 CDMG in one connect. Keep a 3+ power blocker up and they can't profitably swing without evasion.
- **vs. I Call Him Big Booty/Doran (1-0):** Pure race, their walls can't pressure early — pings hit face over 0-power bodies for the first ~9 rounds. Jaws of Defeat drains me per their creature ETB (|P−T|: Doran cost 5); their real damage is enchantment ETBs, not combat. The Wanderer is their ping-hoser — win through life loss/combat. Never cast Blasphemous while she's out (their side protected, mine not). Doran + Toxicrene block-wall eats 2 attackers/turn; only feed it recursives (Silversmote returns on gain-3 turns, Specimen for {2}{B}) or blanked bodies.
- **vs. Fblthp (0-1):** Can't race a protected combo from 38 with a 2-3/turn drain board — need the sac-loop online by ~T12 or interaction that actually hits the win. Kill order learned: draw/selection engines (Katara Waterbending Master ON SIGHT — every flash-cast gives her xp; Sindbad; Sensei's Top) > Hullbreaker the moment it lands > mana doublers ONLY before Omniscience. Feed the Swarm is the only Omniscience answer in the 99 — DT should fetch it, not artifact removal, once they're past ~8 mana. Tidal Barracuda = my instants are sorceries; stop banking them. Thoracle at 0-library wins even if killed in response (0 ≥ 0); LabMan/Jace CAN be killed with the draw trigger on the stack — but Barracuda blocks even that, so those outs need Barracuda dead first.
- **vs. Meteor Apes/Roxanne (deck 2-1 overall; 0-1 as Claude pilot, 2-0 as Ben):** Gruul has NO fliers and NO reach — **Kokusho attacks unblocked every turn and closes alone.** They also have no exile and no way to interact with a death trigger, so Kokusho + any sac outlet is unanswerable reach; play to their life − 6. Their only real outs are instant X-sweepers (Magmaquake spares fliers; Starstorm X=5 does not) and Tyvar's Stand X=0 for {G} making a blocked Roxanne indestructible — assume one green open means a block goes badly. Blood Artist is the lock piece once they're low: it turns their own combat into lethal, so protect it over bigger bodies. Roxanne's Meteorite tokens tap for 2 under her — Rakdos Charm's artifact mode kills tokens and cuts their ramp.
- **vs. Meteor Apes/Roxanne (historical, Claude-pilot notes):** Their instants: Magmaquake / Klauth's Will (X-burn, KW both-modes only WITH commander out), Heroic Intervention {1}{G}, Tamiyo's Safekeeping {G}, Great Train Heist. Kill Roxanne in her tapped-out cast window (Bedevil worked; Terminate into {G} open got Safekeeping'd — wait for 0 open, or force two protection spells with back-to-back removal). BSZ X=4 is the wipe that actually kills apes (4-toughness everywhere: Mandrills, Gibbon, Kogla is 7/6 — X=6). Kogla ETB-fights: don't rely on a lone drain body surviving. Their damage sweepers can't kill what's already recursive — Bloodghast/Skeleton boards blank them; PRIORITIZE fodder over payoffs vs this deck.
