import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import React, { useEffect, useRef, useState } from "react";
import { Button, CheckIcon, DragHandleIcon, IconButton, Paper, SaveIcon, Tooltip, Typography } from "@firecms/ui";

import { format } from "sql-formatter";
import { DataSource, DateParams, SQLDialect } from "../types";
import { SQLDataView, useSQLTableConfig } from "./SQLDataView";

import { DatePickerWithRange } from "./DateRange";
import { getDialectFromDataSources } from "../utils/sql";
import { CodeEditor } from "./CodeEditor";

function formatSQL(sql: string, dialect: SQLDialect) {
    try {
        return format(sql, { language: dialect });
    } catch (e) {
        console.error("Error formatting SQL", e);
        return sql;
    }
}

/**
 * This view allows you to run SQL queries and see the output
 * @constructor
 */
export function SQLQueryView({
                                 initialSql,
                                 dataSources,
                                 params,
                                 onSaved,
                                 onDirtyChange
                             }: {
    initialSql?: string,
    onSaved?: (sql?: string) => Promise<void>
    dataSources: DataSource[],
    params?: DateParams,
    onDirtyChange?: (dirty: boolean) => void
}) {

    const dialect = getDialectFromDataSources(dataSources);

    const initialFormatted = useRef(initialSql ? formatSQL(initialSql, dialect) : undefined);
    const [dateRange, setDateRange] = useState<[Date | null, Date | null]>(params ? [params.dateStart ?? null, params.dateEnd ?? null] : [null, null]);

    const [sql, setSql] = useState<string | undefined>(initialFormatted.current);
    const [dirty, setDirty] = useState<boolean>(false);

    const [saved, setSaved] = useState<boolean>(false);

    // Reset saved state when initialSql changes or after 2 seconds
    useEffect(() => {
        if (initialSql) {
            setSaved(false);
        }
    }, [initialSql]);

    useEffect(() => {
        if (saved) {
            const timeout = setTimeout(() => {
                setSaved(false);
            }, 2000);
            return () => clearTimeout(timeout);
        }
    }, [saved]);

    const doSave = () => {
        onSaved?.(sql).then(() => {
            initialFormatted.current = sql ? formatSQL(sql, dialect) : sql;
            setSql(initialFormatted.current);
            setDirty(false);
            onDirtyChange?.(false);
            setSaved(true);
        });
    }

    const updateSql = (newSql?: string) => {
        setSql(newSql);
        const newDirty = !initialSql || newSql !== initialFormatted.current;
        setDirty(newDirty);
        onDirtyChange?.(newDirty);
    }

    const sqlTableConfig = useSQLTableConfig({
        dataSources,
        sql: sql ?? "",
        params
    });

    useEffect(() => {
        if (initialSql) {
            sqlTableConfig.refreshData();
        }
    }, []);

    return <div className={"flex flex-col h-full w-full px-4 sm:px-8 md:px-16 lg:px-24 xl:px-32 2xl:px-64 py-4"}>

        <div className={"flex flex-row gap-4 mt-8 mb-2 items-center"}>
            <Typography className={"flex-grow "} variant={"label"}>
                SQL Editor
            </Typography>

            <Button variant={"text"}
                    className={"text-text-secondary dark:text-text-secondary-dark"}
                    onClick={() => {
                        updateSql(formatSQL(sql ?? "", dialect));
                    }}>
                Format
            </Button>
            <Tooltip
                open={saved}
                side={"top"}
                title={"Updated!"}>

                <IconButton variant={"ghost"} shape={"square"} disabled={!dirty}
                            onClick={doSave}>
                    {saved ? <CheckIcon/> : <SaveIcon/>}
                </IconButton>
            </Tooltip>
            <DatePickerWithRange dateRange={dateRange} setDateRange={setDateRange}/>
            <Button variant={"outlined"} onClick={sqlTableConfig.refreshData}>
                Run
            </Button>
        </div>

        <PanelGroup direction="vertical" className={"flex-grow"}>
            <Panel maxSize={75} defaultSize={40}>
                <CodeEditor
                    defaultLanguage={"sql"}
                    value={sql}
                    onChange={updateSql}
                    sqlDialect={dialect}
                />
            </Panel>
            <PanelResizeHandle className={"h-4 flex justify-center items-center"}>
                <DragHandleIcon size="small" color={"disabled"}/>
            </PanelResizeHandle>
            <Panel maxSize={75}>
                <Paper className={"h-full"}>
                    <SQLDataView sqlTableConfig={sqlTableConfig}/>
                </Paper>
            </Panel>
        </PanelGroup>

    </div>
}
