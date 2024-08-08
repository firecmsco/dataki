import React, { ComponentType, memo, useEffect, useState } from "react";
import { NodeProps, NodeResizer, useOnViewportChange, Viewport } from "reactflow";
import { DashboardWidgetConfig, DateParams, DryWidgetConfig, WidgetSize } from "../../../types";
import { DEFAULT_WIDGET_SIZE } from "../../../utils/widgets";
import { DryChartConfigView } from "../../widgets/DryChartConfigView";
import { useDataki } from "../../../DatakiProvider";
import { ErrorBoundary, mergeDeep } from "@firecms/core";
import { DryTableConfigView } from "../../widgets/DryTableConfigView";
import { Button, ForumIcon } from "@firecms/ui";
import { WidgetChatSession } from "../../widgets/WidgetChatSession";
import { useDashboardStateContext } from "../DashboardPageView";

export type ChartNodeProps = {
    widget: DashboardWidgetConfig;
    dashboardId: string;
    pageId: string;
};

function ChartNode(props: NodeProps<ChartNodeProps>) {

    const { data } = props;
    const datakiConfig = useDataki();
    const dashboardState = useDashboardStateContext();
    const widget = data.widget;

    useEffect(() => {
        setSize(widget.size ?? DEFAULT_WIDGET_SIZE);
    }, [widget.size]);
    const [size, setSize] = useState<WidgetSize>(widget.size ?? DEFAULT_WIDGET_SIZE);

    const [zoom, setZoom] = useState<number>(1);

    const [chatDialogOpen, setChatDialogOpen] = React.useState(false);

    const [resizing, setResizing] = useState<boolean>(false);
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
        const updatedConfig = mergeDeep(widget, newConfig);
        datakiConfig.onWidgetUpdate(data.dashboardId, data.pageId, widget.id, updatedConfig);
    };

    // const pendingChangeRef = useRef<{ size: WidgetSize, position: Position }>(null);
    return (
        <div
            key={widget.id}
            style={{
                width: size.width,
                height: size.height
            }}>

            <NodeResizer minWidth={200}
                         minHeight={200}
                         onResizeStart={() => setResizing(true)}
                         onResizeEnd={(event, params) => {
                             const updatedSize = {
                                 width: params.width,
                                 height: params.height
                             };
                             const position = {
                                 x: params.x,
                                 y: params.y
                             };

                             setSize(updatedSize);
                             setResizing(false);
                             dashboardState.onNodeResize(widget.id, {
                                 size: updatedSize,
                                 position
                             });
                             // datakiConfig.onWidgetUpdate(data.dashboardId, data.pageId, widget.id, {
                             //     ...widget,
                             //     size: updatedSize,
                             //     position
                             // });
                         }}
                         onResize={(event, params) => {
                             const updatedSize = {
                                 width: params.width,
                                 height: params.height
                             };
                             setSize(updatedSize);
                         }}
            />

            {widget.type === "chart" && <DryChartConfigView dryConfig={widget}
                                                            actions={actions}
                                                            params={dashboardState.params}
                                                            selected={props.selected}
                                                            zoom={zoom}
                                                            largeAddToDashboardButton={false}
                                                            className={props.selected ? "" : ""}
                                                            onRemoveClick={() => dashboardState.onNodesDelete([widget.id])}
                                                            onUpdated={onUpdated}/>}

            {widget.type === "table" && <DryTableConfigView dryConfig={widget}
                                                            actions={actions}
                                                            params={dashboardState.params}
                                                            selected={props.selected}
                                                            className={props.selected ? "" : ""}
                                                            zoom={zoom}
                                                            largeAddToDashboardButton={false}
                                                            onRemoveClick={() => dashboardState.onNodesDelete([widget.id])}
                                                            onUpdated={onUpdated}/>}

            <ErrorBoundary>
                {widget && <WidgetChatSession open={chatDialogOpen}
                                              setOpen={setChatDialogOpen}
                                              dryConfig={widget}
                                              onUpdate={onUpdated}
                />}
            </ErrorBoundary>

        </div>
    );
}

export default memo(ChartNode) as ComponentType<NodeProps>;
