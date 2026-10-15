import {
  MIN_HISTORY_POINTS,
  linearForecast,
  splitTrajectory,
} from "./trajectory";

describe("brand trajectory", () => {
  it("normalises real history and keeps the latest points as the current window", () => {
    const result = splitTrajectory([2, 4, 6, 8, 10, 12, 14, 16, 18, 20]);
    expect(result.sufficientData).toBe(true);
    expect(result.historical).toEqual([0.1, 0.2, 0.3, 0.4, 0.5, 0.6]);
    expect(result.current).toEqual([0.7, 0.8, 0.9, 1]);
  });

  it("reports insufficient data instead of inventing a series", () => {
    const result = splitTrajectory([3, 4]);
    expect(MIN_HISTORY_POINTS).toBeGreaterThan(2);
    expect(result).toEqual({
      sufficientData: false,
      historical: [],
      current: [],
      projected: [],
    });
  });

  it("projects with a deterministic linear fit", () => {
    expect(linearForecast([0.1, 0.2, 0.3, 0.4, 0.5], 3)).toEqual([
      0.6, 0.7, 0.8,
    ]);
    expect(linearForecast([0.1, 0.2, 0.3, 0.4, 0.5], 3)).toEqual(
      linearForecast([0.1, 0.2, 0.3, 0.4, 0.5], 3),
    );
    expect(
      linearForecast([0.5, 0.4, 0.3, 0.2, 0.1], 10).every((v) => v >= 0),
    ).toBe(true);
  });

  it("does not project from a series too short to fit", () => {
    expect(linearForecast([0.3], 3)).toEqual([]);
  });
});
