import React, { ComponentType, memo, useState } from "react";
import { NodeProps, NodeResizer, useOnViewportChange, Viewport } from "reactflow";
import { DashboardWidgetConfig, WidgetSize } from "../../../types";
import { DEFAULT_WIDGET_SIZE } from "../../../utils/widgets";
import { DryWidgetConfigView } from "../../widgets/DryWidgetConfigView";
import { useDataTalk } from "../../../DataTalkProvider";
import { mergeDeep } from "@firecms/core";

export type ChartNodeProps = {
    widgetConfig: DashboardWidgetConfig;
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
                             const updatedSize = {
                                 width: params.width,
                                 height: params.height
                             };
                             setSize(updatedSize);
                             dataTalk.onWidgetResize(data.dashboardId, data.pageId, data.widgetConfig.id, updatedSize);
                         }}
            />

            <DryWidgetConfigView dryConfig={data.widgetConfig}
                                 zoom={zoom}
                                 onRemoveClick={() => data.onRemoveClick(data.widgetConfig.id)}
                                 onUpdated={(newConfig) => {
                                     const widgetConfig = mergeDeep(data.widgetConfig, newConfig);
                                     dataTalk.onWidgetUpdate(data.dashboardId, data.pageId, data.widgetConfig.id, widgetConfig);
                                 }}

            />
            {/*{data.chart && <ChartView title={data.title} config={data.chart} size={data.size}/>}*/}
            {/*{data.table && <DataTable title={data.title} config={data.table}/>}*/}
        </div>
    );
}

export default memo(ChartNode) as ComponentType<NodeProps>;
