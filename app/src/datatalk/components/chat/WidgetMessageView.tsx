import React, { useEffect, useState } from "react";
import JSON5 from "json5";
import { CircularProgress } from "@firecms/ui";
import { DryWidgetConfig } from "../../types";
import { DEFAULT_WIDGET_SIZE } from "../../utils/widgets";
import { DryWidgetConfigView } from "../widgets/DryWidgetConfigView";

export function WidgetMessageView({
                                      rawDryConfig,
                                      maxWidth,
                                      loading,
                                      onContentModified
                                  }: {
    rawDryConfig?: string,
    loading?: boolean,
    maxWidth?: number,
    onContentModified?: (rawDryConfig: string) => void,
}) {

    const [dryConfig, setDryConfig] = useState<DryWidgetConfig | null>(null);
    useEffect(() => {
        if (rawDryConfig && !loading) {
            try {
                const newDryConfig = JSON5.parse(rawDryConfig);
                setDryConfig(newDryConfig);
            } catch (e) {
                console.error(rawDryConfig);
                console.error("Error parsing dry config", e);
            }
        }
    }, [loading, rawDryConfig]);

    const widgetHeight = dryConfig?.size?.height ?? DEFAULT_WIDGET_SIZE.height;
    const widgetMaxWidth = dryConfig?.type === "table" ? undefined : dryConfig?.size?.width ?? DEFAULT_WIDGET_SIZE.width;

    return (
        <div className={"flex flex-col gap-2 mb-6"}
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
                    <DryWidgetConfigView
                        dryConfig={dryConfig}
                        onUpdated={(newConfig) => {
                            setDryConfig(newConfig);
                            onContentModified?.(JSON5.stringify(newConfig, null, 2));
                        }}
                        maxWidth={maxWidth}
                    />)}


        </div>
    );
}

