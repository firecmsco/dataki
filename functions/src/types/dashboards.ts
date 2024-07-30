import { DataRow } from "./sql";

export type DataSource = BigQueryDataSource;
export type BigQueryDataSource = {
    projectId: string;
    datasetId: string;
    location: string;
}

export type DryDataset = {
    label: string;
    data: string;
    backgroundColor?: string[];
};

export type DryWidgetConfig = {
    id?: string;
    sql: string;
    projectId: string;
    dataSources: DataSource[];
    type: "chart" | "table";
    title: string;
    description: string;
    chart?: {
        type: string;
        data: {
            labels: string;
            datasets: Array<DryDataset>;
        }
    };
    table?: {
        columns: TableColumn[]
    }
}

export type DataSet = {
    label: string;
    data: string[];
    backgroundColor?: string[];
};

export type WidgetConfig = {
    title: string;
    description: string;
    sql: string;
    type: "chart" | "table";
    chart?: {
        type: string;
        data: {
            labels: string[];
            datasets: Array<DataSet>;
        },
        options?: {
            plugins?: {
                legend?: {
                    position: string;
                }
            }
        }
    },
    table?: {
        data: DataRow[];
        columns: TableColumn[]
    }
}

export type TableColumn = { key: string, name: string, dataType: DataType };

export type DataType = "string" | "number" | "date" | "object" | "array";

export type DateParams = {
    dateStart?: Date | null;
    dateEnd?: Date | null;
}
