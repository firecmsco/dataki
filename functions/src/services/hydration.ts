import { DataSet, DryDataset, DryWidgetConfig, WidgetConfig } from "../types/dashboards";
import { DataRow } from "../types/sql";
import * as util from "util";

export function hydrateTableConfig(config: DryWidgetConfig, data: DataRow[]): WidgetConfig {

    console.log("Hydrating widget config", util.inspect(config, false, null, true /* enable colors */) + "\n\n", data);

    if (config.type === "chart") {
        return hydrateChartConfig(config, data);
    }

    const res = hydrateObject(config, data);
    if (res.table) {
        res.table.data = data;
    }
    return res;
}

export const hydrateChartConfig = (config: DryWidgetConfig, data: DataRow[]): WidgetConfig => {
    if (config.type !== "chart" || !config.chart) {
        throw new Error("Invalid widget type or missing chart config");
    }

    const labels = replacePlaceholders(config.chart.data.labels, data);
    const dedupedLabels = Array.isArray(labels)
        ? deduplicateStrings(labels as string[])
        : [labels];

    const datasets = config.chart.data.datasets.map(dataset => {
        if (Array.isArray(dataset.data)) {
           return dataset as unknown as DataSet;
        }
        return processDataSet(dataset, data);

    }).flat();

    return {
        title: config.title,
        description: config.description,
        sql: config.sql,
        type: config.type,
        chart: {
            ...config.chart,
            type: config.chart.type,
            data: {
                labels: dedupedLabels,
                datasets: datasets
            }
        }
    };
}

function convertValueForChart(value: any) {
    if (value === undefined || value === null) {
        return null;
    }

    if (value instanceof Date) {
        // if time is 00:00:00, return only date
        if (value.getHours() === 0 && value.getMinutes() === 0 && value.getSeconds() === 0) {
            return value.toISOString().split("T")[0];
        }

        return value.toISOString();
    }
    if (typeof value === "object" && "value" in value) {
        return value.value;
    }
    return value;
}

function replacePlaceholders(str: string, data: DataRow[]): string | string[] {
    if (typeof str !== "string") return str;
    const replacedKey = str.replace(/\[\[|]]/g, "");
    if (replacedKey === str) return str; // No placeholders found
    return data.map(row => {
        const value = getIn(row, replacedKey);
        return convertValueForChart(value);
    });
}

export function processDataSet(dataset: DryDataset, data: DataRow[]): DataSet[] {
    const result: DataSet[] = [];
    const dataMap = new Map<string, any[]>();

    const patternMatch = dataset.data.match(/\[\[(.*?)\]\](?:\(\((.*?)\)\))?/);
    if (!patternMatch) {
        throw new Error("Invalid dataset format");
    }

    const dataKey = patternMatch[1];
    const categoryKey = patternMatch[2] || null;

    data.forEach(item => {
        const category = categoryKey
            ? getIn(item, categoryKey)
            : dataset.label;
        const dailySales = getIn(item, dataKey);
        if (!dataMap.has(category)) {
            dataMap.set(category, []);
        }
        dataMap.get(category)?.push(convertValueForChart(dailySales));
    });

    dataMap.forEach((extractedValues, category) => {
        result.push({
            ...dataset,
            data: extractedValues,
            label: category?.toString()
        });
    });

    return result;
}

function hydrateObject(obj: any, data: DataRow[]): any {
    if (typeof obj === "string") {
        // Replace placeholders in strings with mapped array values
        return replacePlaceholders(obj, data);
    } else if (Array.isArray(obj)) {
        return obj.map(item => hydrateObject(item, data));
    } else if (typeof obj === "object" && obj !== null) {
        const hydratedObj = {};
        for (const key in obj) {
            // @ts-ignore
            hydratedObj[key] = hydrateObject(obj[key], data);
        }
        return hydratedObj;
    } else {
        return obj;
    }
}

function toPath(value: string | string[]) {
    if (Array.isArray(value)) return value; // Already in path array form.
    // Replace brackets with dots, remove leading/trailing dots, then split by dot.
    return value.replace(/\[(\d+)]/g, ".$1").replace(/^\./, "").replace(/\.$/, "").split(".");
}

/**
 * Deeply get a value from an object via its path.
 */
export function getIn(
    obj: any,
    key: string | string[],
    def?: any,
    p = 0
) {
    const path = toPath(key);
    while (obj && p < path.length) {
        obj = obj[path[p++]];
    }

    // check if path is not in the end
    if (p !== path.length && !obj) {
        return def;
    }

    return obj === undefined
        ? def
        : obj;
}

function deduplicateStrings(array: string[]): string[] {
    const seen: Set<string> = new Set();
    const result: string[] = [];

    for (const str of array) {
        if (!seen.has(str)) {
            seen.add(str);
            result.push(str);
        }
    }

    return result;
}
