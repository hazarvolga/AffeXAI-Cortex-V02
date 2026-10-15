/** Fewer real points than this and no trajectory is drawn. */
export const MIN_HISTORY_POINTS = 5;
const CURRENT_WINDOW = 4;
const FORECAST_HORIZON = 6;
const round = (value: number) => Number(value.toFixed(3));

export interface TrajectorySeries {
  sufficientData: boolean;
  historical: number[];
  current: number[];
  projected: number[];
}

/** Least-squares line through the series, extended `horizon` steps; never below zero. */
export function linearForecast(
  series: readonly number[],
  horizon: number,
): number[] {
  const n = series.length;
  if (n < 2) return [];
  const sumX = (n * (n - 1)) / 2;
  const sumY = series.reduce((acc, y) => acc + y, 0);
  const sumXY = series.reduce((acc, y, x) => acc + x * y, 0);
  const sumXX = series.reduce((acc, _y, x) => acc + x * x, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return Array.from({ length: horizon }, (_v, i) =>
    round(Math.max(0, slope * (n + i) + intercept)),
  );
}

/**
 * Real daily engagement split into earlier and recent windows plus a linear
 * projection. Nothing is synthesised: too little history yields empty series.
 */
export function splitTrajectory(values: readonly number[]): TrajectorySeries {
  if (values.length < MIN_HISTORY_POINTS) {
    return {
      sufficientData: false,
      historical: [],
      current: [],
      projected: [],
    };
  }
  const max = Math.max(...values, 1);
  const normalised = values.map((value) => round(value / max));
  const split = normalised.length - CURRENT_WINDOW;
  return {
    sufficientData: true,
    historical: normalised.slice(0, split),
    current: normalised.slice(split),
    projected: linearForecast(normalised, FORECAST_HORIZON),
  };
}
