import React, { useEffect } from "react";
import { DateParams, DryWidgetConfig, TableColumn, WidgetConfig } from "../../types";
import { ErrorBoundary, useModeController } from "@firecms/core";
import {
    AddIcon,
    Button,
    CircularProgress,
    cls,
    DownloadIcon,
    IconButton,
    RefreshIcon,
    RemoveIcon,
    SettingsIcon,
    Tooltip,
    Typography
} from "@firecms/ui";
import { ConfigViewDialog } from "./ConfigViewDialog";
import { AddToDashboardDialog } from "../dashboards/AddToDashboardDialog";
import { toPng } from "html-to-image";
import { downloadImage } from "../../utils/downloadImage";
import { format } from "sql-formatter";
import { SQLDataView, useSQLTableConfig } from "../SQLDataView";
import equal from "react-fast-compare";
import { getDialectFromDataSources } from "../../utils/sql";

export function DryTableConfigView({
                                       dryConfig,
                                       params,
                                       onUpdated,
                                       onRemoveClick,
                                       zoom,
                                       maxWidth,
                                       selected,
                                       largeAddToDashboardButton,
                                       actions,
                                       className
                                   }: {
    dryConfig: DryWidgetConfig,
    params: DateParams,
    onUpdated?: (newConfig: DryWidgetConfig) => void,
    onRemoveClick?: () => void,
    maxWidth?: number,
    zoom?: number,
    selected?: boolean,
    largeAddToDashboardButton?: boolean,
    actions?: React.ReactNode,
    className?: string
}) {

    const dialect = getDialectFromDataSources(dryConfig.dataSources);

    const { mode } = useModeController();

    const [configDialogOpen, setConfigDialogOpen] = React.useState(false);
    const [addToDashboardDialogOpen, setAddToDashboardDialogOpen] = React.useState(false);

    const config = dryConfig as WidgetConfig;

    const downloadFile = () => {
        // TODO: download as CSV
        toPng(viewRef.current as HTMLElement, {
            backgroundColor: mode === "dark" ? "#18181c" : "#fff",
            width: viewRef.current?.scrollWidth,
            height: viewRef.current?.scrollHeight
        }).then((url) => downloadImage(url, "chart.png"));
    }

    const columns = config?.table?.columns;
    const sql = config?.sql;
    const dataSources = config.dataSources;

    const sqlTableConfig = useSQLTableConfig({
        dataSources,
        sql,
        params,
        columns
    });

    const {
        viewRef,
        setData,
        dataLoading,
        dataLoadingError,
        refreshData,
    } = sqlTableConfig;

    const onConfigUpdated = (newConfig: DryWidgetConfig) => {
        if (!newConfig) return;
        refreshData();
        onUpdated?.(newConfig)
    };

    const loadedConfig = React.useRef<{
        sql: string,
        columns?: TableColumn[],
        params?: DateParams
    } | null>(null);

    useEffect(() => {
        const currentConfig = {
            sql,
            columns,
            params
        };
        if (loadedConfig.current && equal(loadedConfig.current, currentConfig)) {
            return;
        }

        if (sql) {
            setData([]);
            loadedConfig.current = currentConfig;
            try {
                const formattedDrySQL = format(dryConfig.sql, { language: dialect })
                onUpdated?.({
                    ...dryConfig,
                    sql: formattedDrySQL
                });
            } catch (e) {
                console.error("Error formatting SQL", e);
            }
            refreshData();
        }
    }, [sql, columns, params]);

    return <>

        <div
            className={cls("group flex flex-col w-full h-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 dark:border-opacity-80 rounded-lg overflow-hidden",
                selected ? "ring-offset-transparent ring-2 ring-primary ring-opacity-75 ring-offset-2" : "",
                className)}>

            <div
                className={"min-h-[54px] flex flex-row w-full border-b border-gray-100 dark:border-gray-800 dark:border-opacity-80"}>
                <Typography variant={"label"}
                            className={"grow px-3 py-4 line-clamp-1 h-10"}>{config?.title ?? dryConfig.title}</Typography>

                {dataLoading && <div className={"m-3"}><CircularProgress size={"small"}/></div>}

                <div className={"m-2.5 flex-row gap-1 hidden group-hover:flex"}>
                    <Tooltip title={"Download"}>
                        <IconButton size={"small"} onClick={downloadFile}>
                            <DownloadIcon size={"small"}/>
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={"Refresh data"}>
                        <IconButton size={"small"} onClick={() => {
                            setData([]);
                            refreshData();
                        }}>
                            <RefreshIcon size={"small"}/>
                        </IconButton>
                    </Tooltip>
                    {onRemoveClick && <Tooltip title={"Remove this view"}>
                        <IconButton size={"small"} onClick={onRemoveClick}>
                            <RemoveIcon size={"small"}/>
                        </IconButton>
                    </Tooltip>}

                    {onUpdated && <Tooltip title={"Edit widget configuration"}>
                        <IconButton size={"small"} onClick={() => setConfigDialogOpen(true)}>
                            <SettingsIcon size={"small"}/>
                        </IconButton>
                    </Tooltip>}

                    <Tooltip title={"Add this view to a dashboard"}>
                        {largeAddToDashboardButton
                            ? <Button variant={"outlined"}
                                      size={"small"}
                                      onClick={() => setAddToDashboardDialogOpen(true)}>
                                Add to dashboard
                            </Button>
                            : <IconButton size={"small"}
                                          onClick={() => setAddToDashboardDialogOpen(true)}>
                                <AddIcon size={"small"}/>
                            </IconButton>}
                    </Tooltip>

                    {actions}

                </div>
            </div>

            {config?.table && (<SQLDataView sqlTableConfig={sqlTableConfig}/>)}

            <ErrorBoundary>
                {dryConfig && <ConfigViewDialog open={configDialogOpen}
                                                setOpen={setConfigDialogOpen}
                                                dryConfig={dryConfig}
                                                params={params}
                                                onUpdate={onConfigUpdated}
                />}
            </ErrorBoundary>
        </div>

        {largeAddToDashboardButton && config && <AddToDashboardDialog open={addToDashboardDialogOpen}
                                                                      setOpen={setAddToDashboardDialogOpen}
                                                                      widget={dryConfig}/>}
    </>;
}
