import React, { useRef } from "react";
import equal from "react-fast-compare";
import { CellRendererParams, VirtualTable } from "@firecms/core";

export type DataTableProps = {

    data: object[];
}

export const DataTable = React.memo<DataTableProps>(
    function DataTable<M extends Record<string, any>>
    ({
         data
     }: DataTableProps) {

        const ref = useRef<HTMLDivElement>(null);

        // const loadNextPage = () => {
        //     if (!paginationEnabled || dataLoading || noMoreToLoad)
        //         return;
        //     if (itemCount !== undefined)
        //         setItemCount?.(itemCount + pageSize);
        // };
        //
        // const resetPagination = useCallback(() => {
        //     setItemCount?.(pageSize);
        // }, [pageSize]);

        function cellRenderer<M extends Record<string, any>>({
                                                                 columns,
                                                                 column,
                                                                 columnIndex,
                                                                 rowData,
                                                                 rowIndex,
                                                                 isScrolling
                                                             }:CellRendererParams) {
            return (
                <div className="px-4 py-2">
                    {cellData}
                </div>
            );
        }


        return (
            <div className="h-full w-full flex flex-col bg-white dark:bg-gray-950"
                 ref={ref}>

                <VirtualTable
                    data={data}
                    columns={columns}
                    cellRenderer={cellRenderer}
                    onEndReached={loadNextPage}
                    onResetPagination={resetPagination}
                    error={dataLoadingError}
                    paginationEnabled={paginationEnabled}
                    onColumnResize={onColumnResize}
                    size={size}
                    loading={dataLoading}
                    filter={filterValues}
                    sortBy={sortBy}
                    onSortByUpdate={setSortBy as ((sortBy?: [string, "asc" | "desc"]) => void)}
                    hoverRow={hoverRow}
                    checkFilterCombination={checkFilterCombination}
                    className="flex-grow"
                    emptyComponent={emptyComponent}
                    endAdornment={endAdornment}
                    AddColumnComponent={AddColumnComponent}
                />

            </div>
        );

    },
    equal
);
