import { ChartConfigItem, EnrichedChartConfigItem } from "../types/items";
import { DataRow } from "../types/sql";

export function mapDataToJSON(config: ChartConfigItem, data: DataRow[]): EnrichedChartConfigItem {
    // Extract the keys for labels and data from the LLM output
    const labelKey = config.chart?.data.labels.replace(/{{|}}/g, '');

    // Map the data to the corresponding keys
    const labels = labelKey ? data.map(row => row[labelKey]) : [];

    // Map data for each dataset
    const datasets = config.chart?.data.datasets.map(dataset => {
        const dataKey = dataset.data.replace(/{{|}}/g, '');
        return {
            ...dataset,
            data: data.map(row => row[dataKey])
        };
    }) || [];

    // Create the final JSON with the mapped data
    return {
        ...config,
        chart: config.chart ? {
            ...config.chart,
            data: {
                ...config.chart.data,
                labels,
                datasets
            }
        } : undefined
    };
}

