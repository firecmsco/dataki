import React, { useCallback, useEffect } from "react";
import ReactFlow, { Background, BackgroundVariant, MiniMap, Node, Panel, useNodesState } from "reactflow";

import "reactflow/dist/style.css";
import { cls, defaultBorderMixin, useInjectStyles } from "@firecms/ui";
import { Dashboard, DashboardPage, DashboardWidgetConfig, WidgetSize } from "../../types";
import ChartNode, { ChartNodeProps } from "./nodes/ChartNode";
import { useDataTalk } from "../../DataTalkProvider";
import PaperNode from "./nodes/PaperNode";
import { DEFAULT_PAPER_SIZE } from "../../utils/widgets";
import { DashboardMenubar } from "./DashboardMenubar";

function convertWidgetsToNodes(widgets: DashboardWidgetConfig[], paperSize: WidgetSize, dashboardId: string, pageId: string, onRemoveClick: (id: string) => void): Node<ChartNodeProps>[] {
    const paperNode: Node<any> = {
        id: "paper",
        type: "paper",
        draggable: false,
        position: {
            x: 0,
            y: 0,
        },
        data: {
            width: paperSize.width,
            height: paperSize.height,
            dashboardId: dashboardId,
            pageId: pageId,
        },
        // style: {
        //     width: 800,
        //     height: 1200,
        //     border: "none !important",
        //     backgroundColor: "rgba(127, 127, 127, .1)",
        // },
    };

    const widgetNodes = widgets.map((widget) => ({
        id: widget.id,
        type: "chart",
        draggable: true,
        selectable: true,
        data: {
            widgetConfig: widget,
            dashboardId: dashboardId,
            pageId: pageId,
            onRemoveClick,
        },
        position: widget.position,
        parentId: "paper",
    }));

    return [
        // {
        //     id: "2",
        //     data: { label: "Node 2" },
        //     position: {
        //         x: 100,
        //         y: -50
        //     },
        // },
        // {
        //     id: "3",
        //     data: { label: "Node 3" },
        //     position: {
        //         x: 400,
        //         y: -50
        //     },
        // },
        paperNode, ...widgetNodes];
}

const nodeTypes = {
    paper: PaperNode,
    chart: ChartNode,
};

export const DashboardPageView = function DashboardPageView({
                                                                page,
                                                                dashboard,
                                                                containerSize,
                                                            }: {
    page: DashboardPage,
    dashboard: Dashboard,
    containerSize: WidgetSize
}) {

    const dataTalk = useDataTalk();

    const onRemoveClick = useCallback((id: string) => {
        dataTalk.onWidgetRemove(dashboard.id, page.id, id);
        setNodes((nodes) => nodes.filter((node) => node.id !== id));
    }, [dashboard.id, page.id])

    const paperSize = page.paper?.size ?? DEFAULT_PAPER_SIZE;

    const [nodes, setNodes, onNodesChange] = useNodesState(convertWidgetsToNodes(
        page.widgets,
        paperSize,
        dashboard.id,
        page.id,
        onRemoveClick,));

    useEffect(() => {
        console.log("Page widgets changed", page.widgets);
        setNodes(convertWidgetsToNodes(
            page.widgets,
            paperSize,
            dashboard.id,
            page.id,
            onRemoveClick));
    }, [page.widgets]);

    console.log("DashboardPageView", { nodes });

    useInjectStyles("dashboard", styles);

    const onNodeDragStop = useCallback((_: any, node: Node, nodes: Node[]) => {
        // console.log("Node moved:", node);
        dataTalk.onWidgetMove(dashboard.id, page.id, node.id, node.position);
    }, []);

    return (

        <ReactFlow
            className={"relative w-full h-full bg-gray-50 dark:bg-gray-950 dark:bg-opacity-80"}
            // translateExtent={[
            //     [0, 0],
            //     [900, 1200]
            // ]}
            // selectionKeyCode={"Shift"}
            panOnScroll={true}
            // multiSelectionKeyCode={"Shift"}
            nodes={nodes}
            selectionOnDrag={true}
            snapToGrid={true}
            snapGrid={[25, 25]}
            zoomOnScroll={false}
            zoomOnPinch={true}
            minZoom={1}
            maxZoom={1}
            defaultViewport={{
                x: Math.max((containerSize.width - paperSize.width) / 2, 25),
                y: 100,
                zoom: 1
            }}
            preventScrolling={false}
            // edges={edges}
            onNodeDragStop={onNodeDragStop}
            onNodesChange={(change) => {
                // console.log("change", change);
                onNodesChange(change)
            }}
            nodeTypes={nodeTypes}
            // onEdgesChange={onEdgesChange}
            // onConnect={onConnect}
            // fitView={true}
            // fitViewOptions={{
            //     minZoom: 1,
            //     maxZoom: 1,
            // }}
        >
            <Panel position="top-left">
                <div className={cls("w-full flex flex-row bg-white dark:bg-gray-900 rounded-2xl border", defaultBorderMixin)}>
                    <DashboardMenubar dashboard={dashboard}/>
                </div>
            </Panel>
            <Background gap={[25, 25]}
                        color="#888"
                        variant={BackgroundVariant.Dots}/>

            <MiniMap nodeStrokeWidth={3}
                     className={"dark:bg-gray-900"}
                     maskColor={"#88888822"}
                     nodeColor={"#66666622"}/>

        </ReactFlow>
    );
};

const styles = `

.react-flow__resize-control.line {
    border-color: transparent;
}
.react-flow__resize-control.handle {
    border: none;
    width: 10px;
    height: 10px;
    background-color: transparent;
}
.react-flow__resize-control.line.right {
    border-right-width: 10px;
}
.react-flow__resize-control.line.left {
    border-left-width: 10px;
}
.react-flow__resize-control.line.top {
    border-top-width: 10px;
}
.react-flow__resize-control.line.bottom {
    border-bottom-width: 10px;
}
// .react-flow__renderer {
//     overflow: hidden;
// }
// .react-flow__panel.top.center {
//     top: -50px;
//     z-index: 100;
// }
`;
