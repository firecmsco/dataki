import React, { useEffect, useState } from "react";
import { CircularProgressCenter } from "@firecms/core";
import { cn, Paper, useDebounceValue } from "@firecms/ui";
import { AutoHeightEditor } from "./AutoHeightEditor";
import { enrichDataTalkItem } from "../api";
import { useDataTalk } from "../DataTalkProvider";
import JSON5 from "json5";
import { EnrichedChartConfigItem } from "../types";
import { ChartView } from "./Chart";


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

export function ChartBlock({
                               initialCode,
                               maxWidth,
                               loading,
                               onCodeModified,
                           }: {
    initialCode?: string,
    loading?: boolean,
    maxWidth?: number,
    onCodeModified?: (code: string) => void,
}) {


    const { apiEndpoint, getAuthToken } = useDataTalk();
    const textAreaRef = React.useRef<HTMLDivElement>(null);
    const [code, setCode] = useState<string | undefined>(initialCode);
    const [enrichedData, setEnrichedData] = useState<EnrichedChartConfigItem | null>(null);

    const [loadingQuery, setLoadingQuery] = useState<boolean>(false);

    const [consoleOutput, setConsoleOutput] = useState<string>("");

    const [executionError, setExecutionError] = useState<Error | null>(null);

    const queryRunInitially = React.useRef(false);

    const deferredCode = useDebounceValue(code, 500);
    useEffect(() => {
        if (onCodeModified) {
            onCodeModified(deferredCode ?? "");
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
        console.log("Executing query");
        queryRunInitially.current = true;

        const firebaseToken = await getAuthToken();
        if (!code) {
            throw Error("No code provided");
        }
        enrichDataTalkItem(firebaseToken, apiEndpoint, JSON5.parse(code))
            .then(setEnrichedData);
    };

    return (
        <div className={"flex flex-col my-4 gap-2"}
             style={{
                 maxWidth: maxWidth ? maxWidth + "px" : undefined
             }}>

            <div className={"flex flex-row w-full gap-4"}
                 ref={textAreaRef}>
                <AutoHeightEditor
                    value={code}
                    loading={loading}
                    maxWidth={maxWidth ? maxWidth - 96 : undefined}
                    onChange={handleCodeChange}
                />
                {/*<Button size="small"*/}
                {/*        variant={codeHasBeenRun ? "outlined" : "filled"}*/}
                {/*        onClick={executeQuery}*/}
                {/*        disabled={!code}>Run Code</Button>*/}
            </div>

            {enrichedData && (<ChartView {...enrichedData}/>)}

            {executionError && (
                <ExecutionErrorView executionError={executionError}/>
            )}

            {(loadingQuery || consoleOutput) && (
                <div
                    className={cn("w-full rounded-lg shadow-sm overflow-hidden transition-all")}>
                    {loadingQuery && <CircularProgressCenter/>}

                    {(consoleOutput) && (
                        <Paper className={"w-full p-4 min-h-[92px] font-mono text-xs overflow-auto rounded-lg"}>
                            {consoleOutput && <pre className={"text-sm font-mono text-gray-700 dark:text-gray-200"}>
                                {consoleOutput}
                            </pre>}
                        </Paper>
                    )}
                </div>
            )}

        </div>
    );
}
