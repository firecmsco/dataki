import React, { useEffect, useState } from "react";
import { hydrateWidgetConfig } from "../../api";
import { useDataTalk } from "../../DataTalkProvider";
import { DryWidgetConfig, WidgetConfig } from "../../types";
import { DataTable } from "./DataTable";
import { CircularProgressCenter, mergeDeep, useModeController } from "@firecms/core";
import { format } from "sql-formatter";
import { DEFAULT_WIDGET_SIZE } from "../../utils/widgets";
import { ChartView } from "./ChartView";
import {
    AddIcon,
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

export function DryWidgetConfigView({
                                        dryConfig,
                                        onUpdated,
                                        onRemoveClick,
                                        zoom,
                                        maxWidth
                                    }: {
    dryConfig: DryWidgetConfig,
    onUpdated?: (newConfig: DryWidgetConfig) => void,
    onRemoveClick?: () => void,
    maxWidth?: number,
    zoom?: number
}) {

    const {
        apiEndpoint,
        getAuthToken
    } = useDataTalk();

    const { mode } = useModeController();

    const [config, setConfig] = useState<WidgetConfig | null>(null);
    const [hydrationInProgress, setHydrationInProgress] = useState<boolean>(false);
    const [hydrationError, setHydrationError] = useState<Error | null>(null);
    const [configDialogOpen, setConfigDialogOpen] = React.useState(false);
    const [addToDashboardDialogOpen, setAddToDashboardDialogOpen] = React.useState(false);

    const viewRef = React.useRef<HTMLDivElement>(null);

    const initialised = React.useRef(false);

    useEffect(() => {
        if (dryConfig && !initialised.current) {
            try {
                const formattedDrySQL = format(dryConfig.sql, { language: "bigquery" })
                onUpdated?.({
                    ...dryConfig,
                    sql: formattedDrySQL
                });
                makeHydrationRequest(dryConfig);
            } catch (e) {
                console.error(dryConfig);
                console.error("Error parsing dry config", e);
            }
            initialised.current = true;
        }
    }, [dryConfig]);

    const makeHydrationRequest = async (newDryConfig: DryWidgetConfig) => {
        const firebaseToken = await getAuthToken();
        if (!newDryConfig) {
            throw Error("makeHydrationRequest: No code provided");
        }
        setConfig(null);
        setHydrationInProgress(true);
        setHydrationError(null);
        console.log("Hydrating config", newDryConfig);
        hydrateWidgetConfig(firebaseToken, apiEndpoint, newDryConfig)
            .then((config) => {
                setConfig(mergeDeep(newDryConfig, config));
            })
            .catch(setHydrationError)
            .finally(() => setHydrationInProgress(false));
    };

    const downloadFile = () => {
        toPng(viewRef.current as HTMLElement, {
            backgroundColor: mode === "dark" ? "#18181c" : "#fff",
            width: viewRef.current?.scrollWidth,
            height: viewRef.current?.scrollHeight,
        }).then((url) => downloadImage(url, "chart.png"));
    }
    // const onResize = (size: WidgetSize) => {
    //     if (!dryConfig) return;
    //     const newConfig: DryWidgetConfig = { ...dryConfig, size };
    //     setDryConfig(newConfig);
    //     onContentModified?.(JSON5.stringify(newConfig, null, 2));
    // }

    return <>


        <div
            className={"group flex flex-col w-full h-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 dark:border-opacity-80 rounded-lg overflow-hidden"}>

            {hydrationInProgress && <CircularProgressCenter/>}
            {!hydrationInProgress && <>
                <div
                    className={"flex flex-row w-full border-b border-gray-100 dark:border-gray-800 dark:border-opacity-80"}>
                    <Typography variant={"label"}
                                className={"grow pl-4 py-4 line-clamp-1 h-10"}>{config?.title}</Typography>
                    <div className={"m-2.5 mr-0 flex-row gap-1 hidden group-hover:flex nodrag"}>

                        <Tooltip title={"Download"}>
                            <IconButton size={"small"} onClick={downloadFile}>
                                <DownloadIcon size={"small"}/>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={"Refresh data"}>
                            <IconButton size={"small"} onClick={() => makeHydrationRequest(dryConfig)}>
                                <RefreshIcon size={"small"}/>
                            </IconButton>
                        </Tooltip>
                        {onRemoveClick && <Tooltip title={"Remove this view"}>
                            <IconButton size={"small"} onClick={onRemoveClick}>
                                <RemoveIcon size={"small"}/>
                            </IconButton>
                        </Tooltip>}
                    </div>

                    <div className={"m-2.5 ml-1 flex flex-row gap-1 nodrag"}>
                        <Tooltip title={"Edit widget configuration"}>
                            <IconButton size={"small"} onClick={() => setConfigDialogOpen(true)}>
                                <SettingsIcon size={"small"}/>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={"Add this view to a dashboard"}>
                            <IconButton size={"small"} onClick={() => setAddToDashboardDialogOpen(true)}>
                                <AddIcon size={"small"}/>
                            </IconButton>
                        </Tooltip>
                    </div>
                </div>

                {!hydrationError && <>
                    {config?.type === "chart" && config?.chart && (
                        <ChartView
                            ref={viewRef}
                            size={dryConfig?.size ?? DEFAULT_WIDGET_SIZE}
                            config={config?.chart}/>
                    )}

                    {config?.type === "table" && config?.table && (
                        <DataTable
                            ref={viewRef}
                            config={config?.table}
                            zoom={zoom}
                            maxWidth={maxWidth}/>
                    )}
                </>}

                {hydrationError && (
                    <ExecutionErrorView executionError={hydrationError}/>
                )}

                {dryConfig && <ConfigViewDialog open={configDialogOpen}
                                                setOpen={setConfigDialogOpen}
                                                dryConfig={dryConfig}
                                                onUpdate={(newConfig) => {
                                                    if (!newConfig) return;
                                                    makeHydrationRequest(newConfig);
                                                    onUpdated?.(newConfig)
                                                }}
                />}
            </>}
        </div>

        {config && <AddToDashboardDialog open={addToDashboardDialogOpen}
                                         setOpen={setAddToDashboardDialogOpen}
                                         widgetConfig={dryConfig}/>}
    </>;
}

function ExecutionErrorView(props: { executionError: Error }) {
    const message = props.executionError.message;
    const urlRegex = /https?:\/\/[^\s]+/g;
    const htmlContent = message.replace(urlRegex, (url) => {
        // For each URL found, replace it with an HTML <a> tag
        return `<a href="${url}" target="_blank" class="underline">LINK</a><br/>`;
    });

    return <div className={"w-full text-sm bg-red-100 dark:bg-red-800 p-4 rounded-lg"}>
        <code className={"text-red-700 dark:text-red-300 break-all"} dangerouslySetInnerHTML={{ __html: htmlContent }}/>
    </div>;
}


