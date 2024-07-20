import { DashboardParams, DryWidgetConfig, WidgetConfig } from "../types/dashboards";
import { DataRow } from "../types/sql";
import * as util from "util";

export function hydrateWidgetConfig(config: DryWidgetConfig, data: DataRow[], filters?: DashboardParams): WidgetConfig {

    console.log("Hydrating widget config", util.inspect(config, false, null, true /* enable colors */) + "\n\n", data);

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

    function replacePlaceholders(str: string, data: DataRow[]): string | string[] {
        const replaced = str.replace(/\[\[|]]/g, "");
        if (replaced === str) return str; // No placeholders found
        return data.map(row => {
            const value = getIn(row, replaced);
            if (value === undefined || value === null) {
                return null;
            }

            if (value instanceof Date) {
                //if time is 00:00:00, return only date
                if (value.getHours() === 0 && value.getMinutes() === 0 && value.getSeconds() === 0) {
                    return value.toISOString().split("T")[0];
                }

                return value.toISOString();
            }
            if (typeof value === "object" && "value" in value) {
                return value.value;
            }
            return value;
        });
    }

    const res = hydrateObject(config, data);
    if (res.table) {
        res.table.data = data;
    }
    return res;
}

// export function hydrateWidgetConfig(config: DryWidgetConfig, data: DataRow[]): WidgetConfig {
//
//     console.log("Hydrating widget config", util.inspect(config, false, null, true /* enable colors */) + "\n\n", data);
//
//     // Extract the keys for labels and data from the LLM output
//     const labelKey = config.chart?.data?.labels?.replace(/\[\[|]]/g, "");
//
//     // Map the data to the corresponding keys
//     const labels = labelKey
//         ? data.map(row => getIn(row, labelKey))
//         : [];
//
//     // Map data for each dataset
//     const datasets = config.chart?.data.datasets.map(dataset => {
//         const dataKey = dataset.data.replace(/\[\[|]]/g, "");
//         return {
//             ...dataset,
//             data: data.map(row => getIn(row, dataKey))
//         };
//     }) || [];
//
//     // Create the final JSON with the mapped data
//     return {
//         ...config,
//         chart: config.chart
//             ? {
//                 ...config.chart,
//                 data: {
//                     ...config.chart.data,
//                     labels,
//                     datasets
//                 }
//             }
//             : undefined,
//         table: config.table
//             ? {
//                 ...config.table,
//                 data
//             }
//             : undefined
//     };
// }

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


