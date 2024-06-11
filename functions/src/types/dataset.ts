export type DatasetConfig = {
    datasetId: string;
    tables: Array<{
        tableId: string;
        metadata: any;
    }>;
};
