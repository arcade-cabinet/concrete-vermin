import { defineMission, type Mission } from "../../../factories/mission";

export const secretAboveGrandfather: Mission = defineMission({
  id: "above-secret-grandfather",
  act: "above",
  weapon: "tesla",
  secret: true,
  sGradeUnlockFrom: "above-09-pigeon-king",
  cutscene: {
    interstitial: {
      title: "ABOVE · SECRET — THE OTHER ROOFTOP",
      body: "Your grandfather's rooftop. Where he made the king wait. The court remembers him. They remember you, now, too. One more time, on the roof he started on.",
      skipAfterMs: 1500,
    },
    collectibles: [
      {
        id: "grandfather-shell-casing",
        label: "Brass Shell Casing, 1949",
        anchor: "chimney-stack",
        prose:
          "Stamped Winchester '49. Found in the gravel where the chimney meets the roof. Your grandfather's last shot. He didn't take a second.",
      },
      {
        id: "grandfather-ledger-page",
        label: "Ledger Page",
        anchor: "tar-bucket",
        prose:
          "Torn from a Pawnbroker's ledger, dated June 1949. Single line in pencil: \"Made it wait. Couldn't finish. Tell the boy.\"",
      },
    ],
  },
  encounters: [
    {
      id: "court-returns",
      isCheckpoint: false,
      spawns: [
        { variant: "pigeon-rabid", count: 6, pattern: "dive-from-sky" },
        { variant: "pigeon-soot", count: 6, pattern: "ceiling-drop" },
      ],
    },
    {
      id: "old-court",
      isCheckpoint: false,
      spawns: [
        { variant: "pigeon-rabid", count: 4, pattern: "dive-from-sky" },
        { variant: "seagull-aggressive", count: 4, pattern: "dive-from-sky" },
      ],
    },
    {
      id: "what-grandfather-left",
      isCheckpoint: true,
      spawns: [{ variant: "boss-pigeon-king-classic", count: 1, pattern: "boss-scripted" }],
    },
  ],
  events: [
    {
      id: "grandfather-line",
      trigger: { kind: "at-time", seconds: 5 },
      effect: { kind: "boss-bark", text: 'Pawnbroker: "He stood where you\'re standing."' },
    },
    {
      id: "chimney-dust",
      trigger: { kind: "at-time", seconds: 18 },
      effect: {
        kind: "environmental-hazard",
        label: "CHIMNEY DUST",
        detail: "Tar paper kicks up. Sight lines drop.",
      },
    },
    {
      id: "old-court-bark",
      trigger: { kind: "at-encounter-start", index: 1 },
      effect: {
        kind: "boss-bark",
        text: "Gulls came up from the harbor. They're not on his side.",
      },
    },
    {
      id: "boss-bark-king",
      trigger: { kind: "at-encounter-start", index: 2 },
      effect: { kind: "boss-bark", text: "He recognizes the rifle. Finish what he couldn't." },
    },
    {
      id: "rabid-extra",
      trigger: { kind: "at-kill-count", threshold: 18 },
      effect: {
        kind: "surprise-wave",
        variant: "pigeon-rabid",
        count: 5,
        pattern: "dive-from-sky",
      },
    },
  ],
  seed: 1979_03_99,
  livesAllowance: 5,
  cashAward: 3000,
});
