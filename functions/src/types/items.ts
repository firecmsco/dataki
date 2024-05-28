import { DataRow } from "./sql";

export type Item = LoadingItem | ChartConfigItem | MarkdownTextItem;

export type LoadingItem = {
    type: "loading";
}

export type MarkdownTextItem = {
    type: "text";
    text: string;
}

export type ChartConfigItem = {
    sql: string;
    type: "chart" | "table";
    chart?: {
        type: string;
        data: {
            labels: string;
            datasets: Array<{
                label: string;
                data: string;
                backgroundColor: string[];
            }>;
        }
    };
}

export type EnrichedChartConfigItem = {
    sql: string;
    type: "chart" | "table";
    data: DataRow[];
    chart?: {
        type: string;
        data: {
            labels: string[];
            datasets: Array<{
                label: string;
                data: string[];
                backgroundColor: string[];
            }>;
        }
    };
}
