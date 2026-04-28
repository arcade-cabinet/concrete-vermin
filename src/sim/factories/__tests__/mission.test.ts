import { describe, expect, it } from "vitest";
import { defineMission, type MissionSpec, missionSpecSchema } from "../mission";

const VALID: MissionSpec = {
  id: "m01-tutorial",
  act: "streets",
  weapon: "shotgun",
  cutscene: {
    interstitial: {
      title: "OPENING NIGHT",
      body: "The streets stink of trash and tomorrow. You're hired help. Do the work.",
    },
    collectibles: [
      {
        id: "newspaper-01",
        label: "Crumpled Daily News",
        anchor: "stoop-A",
        prose:
          "BIG APPLE BIG MESS — Sanitation strike enters week three. Mayor calls in private extermination crews. ",
      },
    ],
  },
  encounters: [
    {
      id: "tutorial-zone-1",
      spawns: [{ variant: "sewer-rat", count: 4, pattern: "left-flood" }],
    },
  ],
};

describe("missionSpecSchema", () => {
  it("accepts a fully valid mission", () => {
    expect(() => missionSpecSchema.parse(VALID)).not.toThrow();
  });

  it("rejects missing id", () => {
    const bad = { ...VALID } as Partial<MissionSpec>;
    delete bad.id;
    expect(() => missionSpecSchema.parse(bad)).toThrow();
  });

  it("rejects missing act", () => {
    const bad = { ...VALID } as Partial<MissionSpec>;
    delete bad.act;
    expect(() => missionSpecSchema.parse(bad)).toThrow();
  });

  it("rejects unknown weapon archetype", () => {
    expect(() => missionSpecSchema.parse({ ...VALID, weapon: "raygun" })).toThrow();
  });

  it("rejects mission without an interstitial", () => {
    const cs = { ...VALID.cutscene } as Partial<typeof VALID.cutscene>;
    delete cs.interstitial;
    expect(() => missionSpecSchema.parse({ ...VALID, cutscene: cs })).toThrow();
  });

  it("rejects empty encounters list", () => {
    expect(() => missionSpecSchema.parse({ ...VALID, encounters: [] })).toThrow();
  });

  it("rejects unknown spawn pattern inside an encounter", () => {
    expect(() =>
      missionSpecSchema.parse({
        ...VALID,
        encounters: [
          {
            id: "e",
            spawns: [{ variant: "sewer-rat", count: 1, pattern: "warp" }],
          },
        ],
      }),
    ).toThrow();
  });

  it("requires non-trivial prose on collectibles (>=20 chars)", () => {
    expect(() =>
      missionSpecSchema.parse({
        ...VALID,
        cutscene: {
          ...VALID.cutscene,
          collectibles: [{ id: "x", label: "x", anchor: "x", prose: "too short" }],
        },
      }),
    ).toThrow();
  });

  it("defaults collectibles to [] when omitted", () => {
    const parsed = missionSpecSchema.parse({
      ...VALID,
      cutscene: { interstitial: VALID.cutscene.interstitial },
    });
    expect(parsed.cutscene.collectibles).toEqual([]);
  });
});

describe("defineMission", () => {
  it("returns a frozen mission object", () => {
    const m = defineMission(VALID);
    expect(Object.isFrozen(m)).toBe(true);
    expect(m.id).toBe(VALID.id);
  });

  it("throws with mission id in the message on validation failure", () => {
    expect(() => defineMission({ ...VALID, weapon: "raygun" } as unknown as MissionSpec)).toThrow(
      /m01-tutorial/,
    );
  });
});
