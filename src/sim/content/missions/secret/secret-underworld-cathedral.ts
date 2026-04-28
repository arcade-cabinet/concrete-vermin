import { defineMission, type Mission } from "../../../factories/mission";

export const secretUnderworldCathedral: Mission = defineMission({
  id: "underworld-secret-cathedral",
  act: "underworld",
  weapon: "smg",
  secret: true,
  sGradeUnlockFrom: "underworld-07-river-mutant",
  cutscene: {
    interstitial: {
      title: "UNDERWORLD · SECRET — CHALK CATHEDRAL",
      body: "The transfer stub punched for a station that doesn't exist. The chalk diagram on the platform wall was a route, not a rosary. Tonight you ride it to the end.",
      skipAfterMs: 1200,
    },
    collectibles: [
      {
        id: "cathedral-pew-rivets",
        label: "Subway Pew, Riveted",
        anchor: "tunnel-altar",
        prose:
          "Rust-pitted bench bolted into the tunnel wall in the shape of a pew. The rivets are MTA-stamped. The pattern is not.",
      },
    ],
  },
  encounters: [
    {
      id: "approach",
      isCheckpoint: false,
      spawns: [
        { variant: "rat-engorged", count: 4, pattern: "left-flood" },
        { variant: "feral-cat-skittish", count: 4, pattern: "right-flood" },
      ],
    },
    {
      id: "nave",
      isCheckpoint: true,
      spawns: [
        { variant: "roach-radioactive", count: 6, pattern: "pop-from-vent" },
        { variant: "sewer-fish-radioactive", count: 4, pattern: "surface-from-grate" },
        { variant: "feral-cat-tough", count: 3, pattern: "mixed-wave" },
      ],
    },
  ],
  events: [
    {
      id: "chalk-warning",
      trigger: { kind: "at-time", seconds: 4 },
      effect: { kind: "boss-bark", text: 'Pawnbroker: "Don\'t touch the walls."' },
    },
    {
      id: "third-rail-glow",
      trigger: { kind: "at-time", seconds: 12 },
      effect: {
        kind: "environmental-hazard",
        label: "RAIL GLOWS COLD",
        detail: "Blue arc, no heat. Not electrical.",
      },
    },
    {
      id: "nave-ambush",
      trigger: { kind: "at-encounter-start", index: 1 },
      effect: { kind: "boss-bark", text: "PEWS empty. Whatever sat in them is moving." },
    },
    {
      id: "fish-from-altar",
      trigger: { kind: "at-kill-count", threshold: 10 },
      effect: {
        kind: "surprise-wave",
        variant: "sewer-fish-engorged",
        count: 3,
        pattern: "surface-from-grate",
      },
    },
    {
      id: "altar-rises",
      trigger: { kind: "at-kill-count", threshold: 16 },
      effect: {
        kind: "environmental-hazard",
        label: "ALTAR RISES",
        detail: "The chalk closes. Don't look at the back wall.",
      },
    },
  ],
  seed: 1979_02_99,
  livesAllowance: 4,
  cashAward: 1500,
});
