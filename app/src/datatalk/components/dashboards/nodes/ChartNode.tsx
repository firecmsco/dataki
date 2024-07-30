import React, { ComponentType, memo, useState } from "react";
import { NodeProps, NodeResizer, useOnViewportChange, Viewport } from "reactflow";
import { DashboardWidgetConfig, DateParams, DryWidgetConfig, WidgetSize } from "../../../types";
import { DEFAULT_WIDGET_SIZE } from "../../../utils/widgets";
import { DryChartConfigView } from "../../widgets/DryChartConfigView";
import { useDataTalk } from "../../../DataTalkProvider";
import { ErrorBoundary, mergeDeep } from "@firecms/core";
import { DryTableConfigView } from "../../widgets/DryTableConfigView";
import { Button, ForumIcon } from "@firecms/ui";
import { WidgetChatSession } from "../../widgets/WidgetChatSession";

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
    const widgetConfig = data.widgetConfig;
    const [size, setSize] = useState<WidgetSize>(widgetConfig.size ?? DEFAULT_WIDGET_SIZE);

    const [zoom, setZoom] = useState<number>(1);

    const [chatDialogOpen, setChatDialogOpen] = React.useState(false);

    useOnViewportChange({
        // onStart: (viewport: Viewport) => console.log("start", viewport),
        // onChange: (viewport: Viewport) => setZoom(viewport.zoom),
        onEnd: (viewport: Viewport) => setZoom(viewport.zoom),
    });

    const actions = <Button variant={"outlined"} size={"small"}
                            onClick={() => setChatDialogOpen(true)}>
        <ForumIcon size="small"/>
        Edit
    </Button>;

    const onUpdated = (newConfig: DryWidgetConfig) => {
        const updatedConfig = mergeDeep(widgetConfig, newConfig);
        console.log("onUpdated", updatedConfig, newConfig);
        dataTalk.onWidgetUpdate(data.dashboardId, data.pageId, widgetConfig.id, updatedConfig);
    };
    return (
        <div
            key={widgetConfig.id}
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
                             dataTalk.onWidgetMove(data.dashboardId, data.pageId, widgetConfig.id, position);
                             setSize(updatedSize);
                             dataTalk.onWidgetResize(data.dashboardId, data.pageId, widgetConfig.id, updatedSize);
                         }}
            />

            {widgetConfig.type === "chart" && <DryChartConfigView dryConfig={widgetConfig}
                                                                  actions={actions}
                                                                  params={data.params}
                                                                  selected={props.selected}
                                                                  zoom={zoom}
                                                                  largeAddToDashboardButton={false}
                                                                  className={props.selected ? "" : ""}
                                                                  onRemoveClick={() => data.onRemoveClick(widgetConfig.id)}
                                                                  onUpdated={onUpdated}/>}

            {widgetConfig.type === "table" && <DryTableConfigView dryConfig={widgetConfig}
                                                                  actions={actions}
                                                                  params={data.params}
                                                                  selected={props.selected}
                                                                  className={props.selected ? "" : ""}
                                                                  zoom={zoom}
                                                                  largeAddToDashboardButton={false}
                                                                  onRemoveClick={() => data.onRemoveClick(widgetConfig.id)}
                                                                  onUpdated={onUpdated}/>}

            <ErrorBoundary>
                {widgetConfig && <WidgetChatSession open={chatDialogOpen}
                                                    setOpen={setChatDialogOpen}
                                                    dryConfig={widgetConfig}
                                                    onUpdate={onUpdated}
                />}
            </ErrorBoundary>

        </div>
    );
}

export default memo(ChartNode) as ComponentType<NodeProps>;
