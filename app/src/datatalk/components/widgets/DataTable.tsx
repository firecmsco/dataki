import React, { useRef } from "react";
import { CellRendererParams, VirtualTable, VirtualTableColumn } from "@firecms/core";
import { getIn } from "@firecms/formex";
import { DataType, TableConfig } from "../../types";
import { useResizeObserver } from "../../utils/useResizeObserver";

export type DataTableProps = {
    config: TableConfig;
    zoom?: number;
    maxWidth?: number;
    ref?: React.RefObject<HTMLDivElement | null>,
}

export function DataTable({
                              config: {
                                  data,
                                  columns
                              },
                              ref: refProp,
                              zoom = 1,
                              maxWidth
                          }: DataTableProps) {

    const ref = refProp ?? useRef<HTMLDivElement>(null);
    const size = useResizeObserver(ref);

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
            <div className="px-3 py-1 flex items-center max-h-full overflow-scroll" style={{ width: column.width }}>
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
                    data={data}
                    columns={tableColumns}
                    cellRenderer={cellRenderer}
                    // rowHeight={40}
                    // style={{
                    //     width: size.width / zoom,
                    //     height: size.height / zoom
                    // }}
                    // onEndReached={loadNextPage}
                    // onResetPagination={resetPagination}
                    // error={dataLoadingError}
                    // paginationEnabled={paginationEnabled}
                    // onColumnResize={onColumnResize}
                    // loading={dataLoading}
                    // filter={filterValues}
                    // sortBy={sortBy}
                    // onSortByUpdate={setSortBy as ((sortBy?: [string, "asc" | "desc"]) => void)}
                    // hoverRow={hoverRow}
                    // checkFilterCombination={checkFilterCombination}
                    // className="flex-grow "
                    // emptyComponent={emptyComponent}
                    // endAdornment={endAdornment}
                    // AddColumnComponent={AddColumnComponent}
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
