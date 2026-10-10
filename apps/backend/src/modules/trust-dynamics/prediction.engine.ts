import { Injectable } from '@nestjs/common';

@Injectable()
export class PredictionEngine {
    /**
     * Predicts the next value in a series using simple linear regression.
     * @param data Array of historical numerical values
     * @returns The predicted next value
     */
    predictNext(data: number[]): number {
        if (data.length < 2) {
            return data[0] || 0;
        }

        const n = data.length;
        let sumX = 0;
        let sumY = 0;
        let sumXY = 0;
        let sumXX = 0;

        for (let i = 0; i < n; i++) {
            sumX += i;
            sumY += data[i];
            sumXY += i * data[i];
            sumXX += i * i;
        }

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        return slope * n + intercept;
    }

    /**
     * Generates a forecast for N days.
     */
    generateForecast(historicalData: number[], days: number = 30): number[] {
        const forecast: number[] = [];
        let data = [...historicalData];

        for (let i = 0; i < days; i++) {
            const next = this.predictNext(data);
            forecast.push(next);
            data = [...data.slice(1), next]; // Moving window
        }

        return forecast;
    }
}
