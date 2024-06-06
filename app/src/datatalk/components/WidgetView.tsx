import React, { useEffect, useState } from "react";
import { Button, CircularProgress, useDebounceValue } from "@firecms/ui";
import { enrichWidgetConfig } from "../api";
import { useDataTalk } from "../DataTalkProvider";
import JSON5 from "json5";
import { DryWidgetConfig, WidgetConfig, WidgetSize } from "../types";
import { ResizableChartView } from "./widgets/ChartView";
import { ResizableDataTable } from "./widgets/DataTable";
import { mergeDeep } from "@firecms/core";

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

export function WidgetView({
                               initialCode,
                               maxWidth,
                               loading,
                               onContentModified,
                               size,
                           }: {
    initialCode?: string,
    loading?: boolean,
    maxWidth?: number,
    size?: WidgetSize
    onContentModified?: (code: string) => void,
}) {

    const { apiEndpoint, getAuthToken } = useDataTalk();
    const [code, setCode] = useState<string | undefined>(initialCode);
    const [dryConfig, setDryConfig] = useState<DryWidgetConfig | null>(null);
    const [config, setConfig] = useState<WidgetConfig | null>(null);
    const [loadingConfig, setLoadingConfig] = useState<boolean>(false);

    // const [executionError, setExecutionError] = useState<Error | null>(null);

    const queryRunInitially = React.useRef(false);

    const deferredCode = useDebounceValue(code, 500);
    useEffect(() => {
        if (onContentModified) {
            onContentModified(deferredCode ?? "");
        }
    }, [deferredCode]);

    useEffect(() => {
        if (!loading && initialCode && !queryRunInitially.current) {
            executeQuery();
        }
    }, [initialCode, loading]);

    const handleCodeChange = (value?: string) => {
        setCode(value);
    };

    const executeQuery = async () => {
        queryRunInitially.current = true;

        const firebaseToken = await getAuthToken();
        if (!code) {
            throw Error("No code provided");
        }
        setLoadingConfig(true);
        const dry = JSON5.parse(code);
        setDryConfig(dry);
        console.log("Executing query", dry);
        enrichWidgetConfig(firebaseToken, apiEndpoint, dry)
            .then((config) => {
                console.log("Config", mergeDeep(dry, config));
                setConfig(config);
            })
            .finally(() => setLoadingConfig(false));
    };

    const onResize = (size: WidgetSize) => {
        if (!dryConfig) return;
        const newConfig: DryWidgetConfig = { ...dryConfig, size };
        setDryConfig(newConfig);
        onContentModified?.(JSON5.stringify(newConfig, null, 2));
    }

    return (
        <div className={"flex flex-col my-4 gap-2"}
             style={{
                 maxWidth: maxWidth ? maxWidth + "px" : undefined
             }}>
            {dryConfig?.sql && (
                <div className={"flex flex-row w-full gap-4"}>
                    <code
                        className={" w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs text-gray-600 dark:text-gray-300 overflow-auto"}>
                        {dryConfig.sql}
                    </code>
                    <Button size="small"
                            variant={"outlined"}
                            onClick={executeQuery}
                            disabled={!code}>Update</Button>
                </div>
            )}

            {config?.chart && (<ResizableChartView config={config.chart} size={size} onResize={onResize}/>)}

            {config?.table && (<ResizableDataTable config={config.table} size={size} onResize={onResize}/>)}

            {(loading || loadingConfig) && (
                <CircularProgress/>
            )}
            {/*{executionError && (*/}
            {/*    <ExecutionErrorView executionError={executionError}/>*/}
            {/*)}*/}

        </div>
    );
}
