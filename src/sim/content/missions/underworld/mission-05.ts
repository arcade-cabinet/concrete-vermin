import { defineMission, type Mission } from "../../../factories/mission";

export const mission05: Mission = defineMission({
  id: "underworld-05-subway",
  act: "underworld",
  weapon: "smg",
  cutscene: {
    interstitial: {
      title: "ACT II — UNDERWORLD · 1 of 3",
      body: "Canal Street platform. The MTA is not running tonight. Whatever is on the third rail is not commuter.",
      skipAfterMs: 800,
    },
    collectibles: [
      {
        id: "transfer-stub",
        label: "Transfer Stub",
        anchor: "turnstile",
        prose:
          "Punched for a station that doesn't exist. The route map below it has been clawed off and replaced with a rosary diagram in chalk.",
      },
    ],
  },
  encounters: [
    {
      id: "platform-skitter",
      isCheckpoint: false,
      spawns: [
        { variant: "rat-engorged", count: 3, pattern: "left-flood" },
        { variant: "rat-mangy", count: 6, pattern: "right-flood" },
      ],
    },
    {
      id: "tunnel-mouth",
      isCheckpoint: true,
      spawns: [
        { variant: "roach-massive", count: 4, pattern: "pop-from-vent" },
        { variant: "feral-cat-baseline", count: 4, pattern: "mixed-wave" },
        { variant: "rat-engorged", count: 2, pattern: "left-flood" },
      ],
    },
  ],
  events: [
    {
      id: "third-rail-arc",
      trigger: { kind: "at-time", seconds: 6 },
      effect: {
        kind: "environmental-hazard",
        label: "THIRD RAIL ARCS",
        detail: "Sparks light the platform. Rats panic.",
      },
    },
    {
      id: "pawn-mac10-warning",
      trigger: { kind: "at-time", seconds: 2 },
      effect: { kind: "boss-bark", text: 'Pawnbroker: "Mac-10 dumps the mag fast. Pace it."' },
    },
    {
      id: "tunnel-cats",
      trigger: { kind: "at-encounter-start", index: 1 },
      effect: { kind: "boss-bark", text: "Cats from both tunnel mouths. Watch your six." },
    },
    {
      id: "lights-flicker",
      trigger: { kind: "at-kill-count", threshold: 12 },
      effect: {
        kind: "environmental-hazard",
        label: "PLATFORM LIGHTS DIE",
        detail: "Sodium-only for the next ten seconds.",
      },
    },
    {
      id: "tunnel-roach-extra",
      trigger: { kind: "at-kill-count", threshold: 18 },
      effect: {
        kind: "surprise-wave",
        variant: "roach-massive",
        count: 3,
        pattern: "pop-from-vent",
      },
    },
  ],
  seed: 1979_02_05,
  cashAward: 250,
});
