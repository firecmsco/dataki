import { BigQuery } from "@google-cloud/bigquery";

export async function getProjectDataContext(projectId: string, datasetId?: string): Promise<string> {
    console.log("getting project data context", projectId, datasetId);
    if (datasetId) {
        return fetchTablesMetadata(projectId, datasetId).then((res) => generateContextForLLM([res]));
    }
    return fetchAllDatasetsAndTablesMetadata(projectId).then(generateContextForLLM);
}

export type DatasetConfig = {
    datasetId: string;
    tables: Array<{
        tableId: string;
        metadata: any;
    }>;
};

async function fetchAllDatasetsAndTablesMetadata(projectId: string): Promise<DatasetConfig[]> {
    const bigquery = new BigQuery({ projectId });

    try {
        // Get the list of datasets in the project
        const [datasets] = await bigquery.getDatasets();

        // Fetch metadata for each dataset and its tables
        const datasetsMetadata = await Promise.all(
            datasets.map(async (dataset) => {
                const datasetId = dataset.id;
                if (!datasetId) throw new Error("Dataset ID not found");
                const [tables] = await dataset.getTables();

                const tablesMetadata = await Promise.all(
                    tables.map(async (table) => {
                        const [metadata] = await table.getMetadata();
                        return {
                            tableId: table.id as string,
                            metadata
                        };
                    })
                );

                return {
                    datasetId,
                    tables: tablesMetadata
                };
            })
        );

        return datasetsMetadata;
    } catch (error) {
        console.error("Error fetching datasets and tables metadata:", error);
        throw error;
    }
}

async function fetchTablesMetadata(projectId: string, datasetId: string): Promise<DatasetConfig> {
    const bigquery = new BigQuery({ projectId });

    try {
        // Get a reference to the dataset
        const dataset = bigquery.dataset(datasetId);

        // Get the list of tables in the dataset
        const [tables] = await dataset.getTables();

        // Fetch metadata for each table
        const tablesMetadata = await Promise.all(
            tables.map(async (table) => {
                const [metadata] = await table.getMetadata();
                return {
                    tableId: table.id as string,
                    metadata
                };
            })
        );

        return { datasetId, tables: tablesMetadata };
    } catch (error) {
        console.error("Error fetching table metadata:", error);
        throw error;
    }
}


function generateContextForLLM(datasets: Array<DatasetConfig>): string {
    let context = "BigQuery dataset contains the following datasets, tables and their metadata:\n\n";

    datasets.forEach((dataset) => {

        context += `*** Dataset: ${dataset.datasetId}\n`;
        dataset.tables.forEach((table) => {
            context += `*** Table: ${dataset.datasetId}.${table.tableId}\n`;
            context += `Description: ${table.metadata.description || "No description"}\n`;
            context += "Columns:\n";

            table.metadata.schema.fields.forEach((field: any) => {
                context += `  - Name: ${field.name}, Type: ${field.type} ${field.description ? ", Description: " + field.description : ""}\n`;
            });

            context += "\n";
        });
    });


    return context;
}

