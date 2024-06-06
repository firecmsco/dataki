import { DataRow } from "./sql";

export type Item = LoadingItem | DryWidgetConfig | MarkdownTextItem;

export type LoadingItem = {
    type: "loading";
}

export type MarkdownTextItem = {
    type: "text";
    text: string;
}

export type DryWidgetConfig = {
    sql: string;
    type: "chart" | "table";
    title: string;
    description: string;
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
    table?: {
        columns: TableColumn[]
    }
}

export type WidgetConfig = {
    title: string;
    description: string;
    sql: string;
    type: "chart" | "table";
    chart?: {
        type: string;
        data: {
            labels: string[];
            datasets: Array<{
                label: string;
                data: string[];
                backgroundColor: string[];
            }>;
        },
        options?: {
            plugins?: {
                legend?: {
                    position: string;
                }
            },
            scales?: {}
        }
    },
    table?: {
        data: DataRow[];
        columns: TableColumn[]
    }
}

export type TableColumn = { key: string, name: string, dataType: DataType };

export type DataType = "string" | "number" | "date" | "object" | "array";

