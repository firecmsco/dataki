import React, { useEffect, useState } from "react";
import JSON5 from "json5";
import { Button, CircularProgress } from "@firecms/ui";
import { DryWidgetConfig } from "../../types";
import { DEFAULT_WIDGET_SIZE } from "../../utils/widgets";
import { DryChartConfigView } from "../widgets/DryChartConfigView";
import { ErrorBoundary } from "@firecms/core";
import { DryTableConfigView } from "../widgets/DryTableConfigView";
import { useChatSession } from "./DatakiChatSession";
import { format } from "sql-formatter";

export function WidgetMessageView({
                                      rawDryConfig,
                                      maxWidth,
                                      loading,
                                      onContentModified,
                                      language
                                  }: {
    rawDryConfig?: string,
    loading?: boolean,
    maxWidth?: number,
    onContentModified?: (rawDryConfig: string) => void,
    language: "bigquery"
}) {

    const {
        projectId,
        dataSources,
        params,
        initialWidgetConfig,
        onInitialWidgetConfigChange
    } = useChatSession();

    const [dryConfig, setDryConfig] = useState<DryWidgetConfig | null>(null);
    const [parsingError, setParsingError] = useState<Error | null>(null);
    useEffect(() => {
        if (rawDryConfig && !loading) {
            try {
                console.log("Parsing dry config", rawDryConfig);
                setParsingError(null);
                const newDryConfig = JSON5.parse(rawDryConfig) as DryWidgetConfig;
                if (!newDryConfig.projectId && projectId) {
                    newDryConfig.sql = format(newDryConfig.sql, { language });
                    newDryConfig.projectId = projectId;
                    newDryConfig.dataSources = dataSources;
                    onChange(newDryConfig);
                }
                setDryConfig(newDryConfig satisfies DryWidgetConfig);
            } catch (e: any) {
                console.error(rawDryConfig);
                console.error("Error parsing dry config", e);
                setParsingError(e);
            }
        }
    }, [loading, rawDryConfig]);

    const widgetHeight = dryConfig?.size?.height ?? DEFAULT_WIDGET_SIZE.height;
    const widgetMaxWidth = dryConfig?.type === "table" ? undefined : dryConfig?.size?.width ?? DEFAULT_WIDGET_SIZE.width;

    function onChange(newConfig: DryWidgetConfig) {
        console.log("onChange", newConfig);
        onContentModified?.(JSON5.stringify(newConfig, null, 2));
    }

    const actions = initialWidgetConfig && dryConfig
        ? <Button variant={"outlined"}
                  size={"small"}
                  onClick={() => {
                      onInitialWidgetConfigChange?.(dryConfig);
                  }}>
            Update widget
        </Button>
        : null;

    return (
        <div className={"flex flex-col gap-2 mb-4"}
             style={{
                 maxWidth: widgetMaxWidth,
                 height: widgetHeight + 92
             }}>

            {loading && (
                <div style={{
                    height: widgetHeight + 92,
                    width: widgetMaxWidth
                }}>
                    <CircularProgress/>
                </div>
            )}

            {!loading && dryConfig && (
                <ErrorBoundary>
                    {dryConfig.type === "chart" && <DryChartConfigView
                        dryConfig={dryConfig}
                        params={params}
                        largeAddToDashboardButton={!initialWidgetConfig}
                        actions={actions}
                        onUpdated={(newConfig) => {
                            setDryConfig(newConfig);
                            onChange(newConfig);
                        }}
                        maxWidth={maxWidth}
                    />}
                    {dryConfig.type === "table" && <DryTableConfigView
                        dryConfig={dryConfig}
                        params={params}
                        actions={actions}
                        largeAddToDashboardButton={!initialWidgetConfig}
                        onUpdated={(newConfig) => {
                            setDryConfig(newConfig);
                            onChange(newConfig);
                        }}
                        maxWidth={maxWidth}
                    />}
                </ErrorBoundary>)}

            {parsingError && (
                <div className={"text-red-500"}>
                    {parsingError.message}
                </div>
            )}
        </div>
    );
}

