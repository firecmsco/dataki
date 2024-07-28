import React, { ComponentType, memo, useState } from "react";
import { NodeProps, NodeResizer, useOnViewportChange, Viewport } from "reactflow";
import { DashboardWidgetConfig, DateParams, WidgetSize } from "../../../types";
import { DEFAULT_WIDGET_SIZE } from "../../../utils/widgets";
import { DryChartConfigView } from "../../widgets/DryChartConfigView";
import { useDataTalk } from "../../../DataTalkProvider";
import { mergeDeep } from "@firecms/core";
import { DryTableConfigView } from "../../widgets/DryTableConfigView";
import { CheckBoxIcon } from "@firecms/ui";

export type ChartNodeProps = {
    widgetConfig: DashboardWidgetConfig;
    params?: DateParams;
    dashboardId: string;
    pageId: string;
    onRemoveClick: (widgetId: string) => void;
};

function ChartNode(props: NodeProps<ChartNodeProps>) {

    const { data } = props;
    const dataTalk = useDataTalk();
    const [size, setSize] = useState<WidgetSize>(data.widgetConfig.size ?? DEFAULT_WIDGET_SIZE);

    const [zoom, setZoom] = useState<number>(1);

    useOnViewportChange({
        // onStart: (viewport: Viewport) => console.log("start", viewport),
        // onChange: (viewport: Viewport) => setZoom(viewport.zoom),
        onEnd: (viewport: Viewport) => setZoom(viewport.zoom),
    });
    return (
        <div
            key={data.widgetConfig.id}
            style={{
                width: size.width,
                height: size.height
            }}>

            <NodeResizer minWidth={200}
                         minHeight={200}
                         onResize={(event, params) => {
                             console.log("chart resize", {
                                 params,
                                 event
                             });
                             const updatedSize = {
                                 width: params.width,
                                 height: params.height
                             };
                             const position = {
                                 x: params.x,
                                 y: params.y
                             };
                             dataTalk.onWidgetMove(data.dashboardId, data.pageId, data.widgetConfig.id, position);
                             setSize(updatedSize);
                             dataTalk.onWidgetResize(data.dashboardId, data.pageId, data.widgetConfig.id, updatedSize);
                         }}
            />

            {data.widgetConfig.type === "chart" && <DryChartConfigView dryConfig={data.widgetConfig}
                                                                       params={data.params}
                                                                       selected={props.selected}
                                                                       zoom={zoom}
                                                                       onRemoveClick={() => data.onRemoveClick(data.widgetConfig.id)}
                                                                       onUpdated={(newConfig) => {
                                                                           const widgetConfig = mergeDeep(data.widgetConfig, newConfig);
                                                                           dataTalk.onWidgetUpdate(data.dashboardId, data.pageId, data.widgetConfig.id, widgetConfig);
                                                                       }}/>}
            {data.widgetConfig.type === "table" && <DryTableConfigView dryConfig={data.widgetConfig}
                                                                       params={data.params}
                                                                       selected={props.selected}
                                                                       zoom={zoom}
                                                                       onRemoveClick={() => data.onRemoveClick(data.widgetConfig.id)}
                                                                       onUpdated={(newConfig) => {
                                                                           const widgetConfig = mergeDeep(data.widgetConfig, newConfig);
                                                                           dataTalk.onWidgetUpdate(data.dashboardId, data.pageId, data.widgetConfig.id, widgetConfig);
                                                                       }}/>}

        </div>
    );
}

export default memo(ChartNode) as ComponentType<NodeProps>;
