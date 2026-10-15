import { InsightService } from "./insight.service";
import { SignalType } from "./interfaces/signal.interface";

const signal = (type: SignalType, intensity: number) => ({
  type,
  intensity,
  createdAt: new Date(),
});

describe("InsightService", () => {
  it("says there is not enough signal instead of reporting calm when nothing arrived", async () => {
    const repo = { find: jest.fn(async () => []) };
    const [insight] = await new InsightService(repo as never).getLatestInsights(
      "acme",
    );
    expect(insight.title).toBe("Yeterli sinyal yok");
    expect(insight.intensity).toBe(0);
    expect(repo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: "acme" }),
      }),
    );
  });

  it("reports detected patterns from the tenant signals", async () => {
    const repo = {
      find: jest.fn(async () => [signal(SignalType.INTENT, 0.5)]),
    };
    const insights = await new InsightService(repo as never).getLatestInsights(
      "acme",
    );
    expect(insights.map((i) => i.title)).toEqual([
      "Conversion Pipeline Active",
    ]);
  });
});
