import React, { useRef } from "react";
import { CellRendererParams, VirtualTable, VirtualTableColumn } from "@firecms/core";
import { getIn } from "@firecms/formex";
import { DataType, TableConfig, WidgetSize } from "../../types";
// @ts-ignore
import { ResizableBox } from "react-resizable";

export type DataTableProps = {
    config: TableConfig;
    size?: WidgetSize,
    onResize?: (size: WidgetSize) => void
}

export function ResizableDataTable({ config, size, onResize }: DataTableProps) {
    return <ResizableBox width={size?.width ?? 800}
                         height={size?.height ?? 400}
                         onResize={(event: any, { node, size, handle }: any) => {
                             onResize?.(size);
                         }}
                         minConstraints={[300, 300]}
                         maxConstraints={[1200, 700]}
                         className={"bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4"}>
        <DataTable config={config}/>
    </ResizableBox>;
}

export const DataTable = function DataTable({
                                                config: {
                                                    data,
                                                    columns
                                                }
                                            }: DataTableProps) {

    const ref = useRef<HTMLDivElement>(null);

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
            <div className="px-4 py-2 flex items-center" style={{ width: column.width }}>
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
        <div className="h-full w-full flex flex-col bg-white dark:bg-gray-950"
             ref={ref}>

            <VirtualTable
                data={data}
                columns={tableColumns}
                cellRenderer={cellRenderer}
                // onEndReached={loadNextPage}
                // onResetPagination={resetPagination}
                // error={dataLoadingError}
                // paginationEnabled={paginationEnabled}
                // onColumnResize={onColumnResize}
                size={"xs"}
                // loading={dataLoading}
                // filter={filterValues}
                // sortBy={sortBy}
                // onSortByUpdate={setSortBy as ((sortBy?: [string, "asc" | "desc"]) => void)}
                // hoverRow={hoverRow}
                // checkFilterCombination={checkFilterCombination}
                className="flex-grow"
                // emptyComponent={emptyComponent}
                // endAdornment={endAdornment}
                // AddColumnComponent={AddColumnComponent}
            />

        </div>
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
