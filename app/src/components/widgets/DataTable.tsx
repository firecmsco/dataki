import React from "react";
import { CellRendererParams, VirtualTable, VirtualTableColumn } from "@firecms/core";
import { getIn } from "@firecms/formex";
import { DataRow, DataType, TableColumn } from "../../types";

export type DataTableProps = {
    columns: TableColumn[];
    data?: DataRow[];
    zoom?: number;
    maxWidth?: number;
    ref: React.RefObject<HTMLDivElement | null>,
    onEndReached?: () => void;
    loading?: boolean;
}

export function DataTable({
                              data,
                              columns,
                              ref,
                              zoom = 1,
                              maxWidth,
                              onEndReached,
                              loading
                          }: DataTableProps) {

    function cellRenderer({
                              columns,
                              column,
                              columnIndex,
                              rowData,
                              rowIndex,
                              isScrolling
                          }: CellRendererParams) {

        const entry = getIn(rowData, column.key);
        return (
            <div className="px-3 py-0.5 flex items-center max-h-full" style={{ width: column.width }}>
                {entry}
            </div>
        );
    }

    const tableColumns: VirtualTableColumn[] = columns.map(col => {
        return {
            key: col.key,
            title: col.name,
            width: getColumnWidth(col.dataType)
        };
    })

    return (
        <>
            <div className="nowheel nodrag flex h-full w-full flex-col bg-white dark:bg-gray-950"
                 style={{
                     maxWidth
                 }}
                 ref={ref}>

                <VirtualTable
                    loading={loading}
                    data={data}
                    rowHeight={48}
                    columns={tableColumns}
                    cellRenderer={cellRenderer}
                    onEndReached={onEndReached}
                    endOffset={2000}
                />

            </div>

        </>
    );

};

function getColumnWidth(dataType: DataType) {
    switch (dataType) {
        case "object":
            return 300;
        case "string":
            return 300;
        case "number":
            return 180;
        case "date":
            return 240;
        case "array":
            return 240;
        default:
            return 200;
    }
}
