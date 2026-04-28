/**
 * Reassemble the decomposed JSON lore back into readable prose.
 * Run with: pnpm tsx scripts/lore-print.ts
 *
 * For editorial review only. The game itself reads the JSON directly.
 */

import {
  ALL_MISSION_LORE,
  barks,
  characters,
  endings,
  frame,
  setting,
  talismans,
} from "../src/sim/content/lore";

const out: string[] = [];
const w = (s = "") => out.push(s);

w("# Concrete Vermin — Lore (assembled)");
w();
w(`*${setting.era} · ${setting.city}*`);
w();
w(setting.premise);
w();
w(`> Tone: ${setting.tone}`);
w(`> Anti: ${setting.antiTone}`);
w();

w("## The Three Acts");
w();
for (const [actId, act] of Object.entries(setting.acts)) {
  w(`### ${act.title}  (${actId})`);
  w();
  w(act.intro);
  w();
}

w("## Characters");
w();
w("### The Pawnbroker");
w();
w(`**Name:** ${characters.pawnbroker.fullName}`);
w(`**Born:** ${characters.pawnbroker.born}`);
w();
w(characters.pawnbroker.background);
w();
w(`**Voice.** ${characters.pawnbroker.voice}`);
w();
w(`**Why he sells you guns.** ${characters.pawnbroker.motive}`);
w();
w(`**Reveal.** ${characters.pawnbroker.firstActReveal}`);
w();
w("### The Player");
w();
w(`**Name:** ${characters.player.name}`);
w(`**Age:** ${characters.player.age}`);
w();
w(characters.player.background);
w();
w(`**Frame.** ${characters.player.frame}`);
w();

w("## Mission Briefings");
w();
for (const m of ALL_MISSION_LORE) {
  w(`### ${m.title}  (\`${m.id}\`)`);
  w();
  w(`> *${m.epigraph}*`);
  w();
  w(`**Blurb.** ${m.blurb}`);
  w();
  w(`**Briefing.** ${m.briefing}`);
  w();
}

w("## Endings");
w();
w(`### ${endings.goodEnd.title}`);
w();
w(endings.goodEnd.vignette);
w();
w(`### ${endings.badEnd.title}`);
w();
w(endings.badEnd.vignette);
w();
w("### Victory lines (by grade)");
for (const [g, line] of Object.entries(endings.victoryByGrade)) {
  w(`- **${g}** — ${line}`);
}
w();
w("### Defeat lines (by cause)");
for (const [c, line] of Object.entries(endings.defeatByCause)) {
  w(`- **${c}** — ${line}`);
}
w();

w("## Talismans");
w();
for (const [id, t] of Object.entries(talismans)) {
  w(`### ${t.displayName}  (\`${id}\`)`);
  w();
  w(t.story);
  w();
}

w("## Pawnbroker barks");
w();
for (const b of barks.pawnbroker) w(`- ${b}`);
w();
w("## Rumor mill");
w();
for (const r of barks.rumorMill) w(`- ${r}`);
w();

w("## Frame narrative");
w();
w(`**Year:** ${frame.year}`);
w();
w(frame.premise);
w();
w("**Cabinet plaque:**");
w("```");
for (const line of frame.cabinetPlaque) w(line);
w("```");
w();
w("**Easter eggs:**");
for (const e of frame.easterEggs) w(`- ${e}`);
w();

process.stdout.write(out.join("\n"));
