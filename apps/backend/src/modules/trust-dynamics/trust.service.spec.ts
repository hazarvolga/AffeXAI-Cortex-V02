import { TrustService } from "./trust.service";

jest.mock("../brand/brand.service", () => ({ BrandService: class {} }));

const intelligence = {
  resonance: { value: "2.50%" },
  convergence: {
    subtitle: "Average Open Rate: 25.0% across 3 active campaigns.",
  },
  friction: { openTickets: 10 },
};

describe("TrustService", () => {
  it("weights real components and reports a single snapshot, not an invented trend", async () => {
    const brand = { getBrandIntelligence: jest.fn(async () => intelligence) };
    const result = await new TrustService(brand as never).getTrustMetrics(
      "acme",
    );
    // resonance 50, convergence 50, friction 20 -> 50*0.4 + 50*0.35 + 80*0.25 = 57.5
    expect(result.trustIndex).toBe(58);
    expect(result.components).toEqual({
      resonance: 50,
      convergence: 50,
      friction: 20,
    });
    expect(result.forecast).toEqual({ current: [58], projected: [] });
    expect(result.history).toBe("snapshot");
  });

  it("fails instead of returning a sample score", async () => {
    const brand = {
      getBrandIntelligence: jest.fn(async () => {
        throw new Error("unavailable");
      }),
    };
    await expect(
      new TrustService(brand as never).getTrustMetrics("acme"),
    ).rejects.toThrow("unavailable");
  });

  it("refuses to score when a source is unavailable", async () => {
    const brand = {
      getBrandIntelligence: jest.fn(async () => ({
        ...intelligence,
        resonance: null,
      })),
    };
    await expect(
      new TrustService(brand as never).getTrustMetrics("acme"),
    ).rejects.toThrow("needs resonance");
  });
});
