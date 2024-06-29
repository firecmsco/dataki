import { TextField } from "@firecms/ui";
import { DataSource } from "../types";

export type DataSourceSelectionProps = {
    dataSources: DataSource[];
    updateDataSources: (dataSources: DataSource[]) => void;
}

export function DataSourceSelection({}: DataSourceSelectionProps) {
    return (
        <div>
         <TextField></TextField>
        </div>
    );
}
