import React, { useRef, useState } from "react";

import { makeSQLQuery } from "../api";
import { useDataki } from "../DatakiProvider";
import { DataRow, DataSource, DataType, DateParams, TableColumn } from "../types";
import { DataTable } from "./DataTable";
import { ExecutionErrorView } from "./widgets/ExecutionErrorView";

export type SQLTableConfigParams = {
    dataSources: DataSource[];
    sql: string;
    params?: DateParams;
    columns?: TableColumn[];
}

export type SQLTableConfig = {
    viewRef: React.RefObject<HTMLDivElement | null>;
    limit: number;
    columns?: TableColumn[];
    resetPagination: () => void;
    desiredOffset: React.RefObject<number>;
    currentOffset: React.RefObject<number>;
    data: DataRow[];
    setData: React.Dispatch<React.SetStateAction<DataRow[]>>;
    dataLoading: boolean;
    dataLoadingError: Error | null;
    refreshData: () => void;
    onEndReached: () => void;
}

export function useSQLTableConfig({
                                      dataSources,
                                      sql,
                                      params,
                                      columns
                                  }: SQLTableConfigParams): SQLTableConfig {
    const viewRef = React.useRef<HTMLDivElement>(null);

    const [usedColumns, setUsedColumns] = useState<TableColumn[] | undefined>(columns);

    const {
        apiEndpoint,
        getAuthToken
    } = useDataki();

    const limit = 100;

    const desiredOffset = useRef<number>(0);
    const currentOffset = useRef<number>(0);

    const [data, setData] = useState<DataRow[]>([]);
    const [dataLoading, setDataLoading] = useState<boolean>(false);
    const [dataLoadingError, setDataloadingError] = useState<Error | null>(null);

    const ongoingRequest = useRef(false);

    function resetPagination() {
        desiredOffset.current = 0;
        currentOffset.current = 0;
    }

    function updateColumns(newData: DataRow[]) {
        // if (usedColumns && usedColumns.length > 0) {
        //     return;
        // }
        setUsedColumns(extractColumns(newData));
    }

    const fetchData = async (offset: number) => {
        if (ongoingRequest.current) {
            return;
        }
        ongoingRequest.current = true;
        const firebaseToken = await getAuthToken();
        setDataLoading(true);
        setDataloadingError(null);
        console.log("Fetching SQL data", offset);
        makeSQLQuery({
            firebaseAccessToken: firebaseToken,
            dataSources,
            apiEndpoint,
            sql,
            params,
            limit,
            offset
        })
            .then((newData) => {
                console.debug("Data fetched", newData);
                currentOffset.current = offset;
                updateColumns(newData);
                setData((existingData) => [...existingData, ...newData]);
            })
            .catch(setDataloadingError)
            .finally(() => {
                ongoingRequest.current = false;
                setDataLoading(false);
            });
    };

    const onEndReached = () => {
        console.log("End reached", currentOffset.current, desiredOffset.current);
        if (currentOffset.current === desiredOffset.current) {
            desiredOffset.current = currentOffset.current + limit;
            fetchData(desiredOffset.current);
        }
    };

    const refreshData = () => {
        console.log("refresh data", sql);
        setData([]);
        resetPagination();
        fetchData(0);
    }

    return {
        viewRef,
        limit,
        columns: usedColumns,
        resetPagination,
        desiredOffset,
        currentOffset,
        data,
        setData,
        dataLoading,
        dataLoadingError,
        refreshData,
        onEndReached
    };
}

export function SQLDataView({
                                sqlTableConfig
                            }: {
    sqlTableConfig: SQLTableConfig,
}) {

    const {
        viewRef,
        columns,
        data,
        dataLoading,
        dataLoadingError,
        onEndReached
    } = sqlTableConfig;

    return <>

        {!dataLoading && dataLoadingError && (
            <ExecutionErrorView executionError={dataLoadingError}/>
        )}

        {data && !dataLoadingError && columns && <>
            <DataTable
                ref={viewRef}
                data={data}
                columns={columns}
                // zoom={zoom}
                // maxWidth={maxWidth}
                loading={dataLoading}
                onEndReached={onEndReached}/>
        </>}
    </>;
}

function determineDataType(values: any[]): DataType {
    const typeCounts: { [key in DataType]?: number } = {};

    values.forEach((value) => {
        let type: DataType;

        if (typeof value === "string") {
            // Check if the string is a date
            if (!isNaN(Date.parse(value))) {
                type = "date";
            } else {
                type = "string";
            }
        } else if (typeof value === "number") {
            type = "number";
        } else if (Array.isArray(value)) {
            type = "array";
        } else if (typeof value === "object" && value !== null) {
            type = "object";
        } else {
            type = "string";
        }

        typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    // Find the most frequent type
    const mostFrequentType = Object.keys(typeCounts).reduce((a, b) =>
        typeCounts[a as DataType]! > typeCounts[b as DataType]! ? a : b
    );

    return mostFrequentType as DataType;
}

function extractColumns(newData: DataRow[]): TableColumn[] {
    if (!newData || newData.length === 0) {
        return [];
    }

    const sampleSize = Math.min(newData.length, 10);
    const sampleData = newData.slice(0, sampleSize);

    const columns = Object.keys(sampleData[0]).map((key) => {
        const sampleValues = sampleData.map((row) => row[key]);
        const type = determineDataType(sampleValues);

        return {
            key,
            name: key,
            type
        };
    });

    return columns;
}
