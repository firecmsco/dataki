import React, { useCallback, useEffect, useMemo, useState } from "react";
import ReactFlow, {
    Background,
    BackgroundVariant,
    Node,
    NodeChange,
    NodePositionChange,
    Panel, SelectionMode,
    useNodesState
} from "reactflow";

import "reactflow/dist/style.css";
import { cls, defaultBorderMixin, useInjectStyles } from "@firecms/ui";
import { Dashboard, DashboardItem, DashboardPage, DateParams, Position, WidgetSize } from "../../types";
import ChartNode, { ChartNodeProps } from "./nodes/ChartNode";
import { useDataTalk } from "../../DataTalkProvider";
import PaperNode, { PaperNodeProps } from "./nodes/PaperNode";
import { DEFAULT_GRID_SIZE, DEFAULT_PAPER_SIZE } from "../../utils/widgets";
import { DashboardMenubar } from "./DashboardMenubar";
import { DatePickerWithRange } from "../DateRange";
import { getInitialDateRange } from "../utils/dates";
import { useUndoRedo } from "../../hooks/useUndoRedo";
import TextNode, { TextNodeProps } from "./nodes/TextNode";

export const DashboardPageView = function DashboardPageView({
                                                                page,
                                                                dashboard,
                                                                containerSize,
                                                                initialViewPosition
                                                            }: {
    page: DashboardPage,
    dashboard: Dashboard,
    containerSize: WidgetSize,
    initialViewPosition?: Position
}) {

    const [dateRange, setDateRange] = useState<[Date | null, Date | null]>(getInitialDateRange());

    const undoRedoState = useUndoRedo(page);
    useEffect(() => {
        // console.log("Undo redo state changed", undoRedoState);
        undoRedoState.actions.set(page);
    }, [page]);

    const params: DateParams = useMemo(() => ({
        dateStart: dateRange[0] ?? null,
        dateEnd: dateRange[1] ?? null
    }), [dateRange]);

    const nodeTypes = useMemo(() => ({
        paper: PaperNode,
        chart: ChartNode,
        text: TextNode
    }), []);

    const dataTalk = useDataTalk();

    const onRemoveClick = useCallback((id: string) => {
        dataTalk.onWidgetRemove(dashboard.id, page.id, id);
        setNodes((nodes) => nodes.filter((node) => node.id !== id));
    }, [dashboard.id, page.id])

    const paperSize = page.paper?.size ?? DEFAULT_PAPER_SIZE;
    const paperPosition = page.paper?.position ?? {
        x: 0,
        y: 0
    };

    const updateWidgetsBasedOnChange = (changes: NodeChange[]) => {
        const positionChanges = changes.filter((change) => change.type === "position" && !change.dragging) as NodePositionChange[];
        const updatedWidgets: DashboardItem[] = [];
        // check the positions are the same in the node and the widgets
        positionChanges.forEach((change) => {
            const node = nodes.find((node) => node.id === change.id);
            if (node) {
                const widget = page.widgets.find((widget) => widget.id === change.id);
                if (widget && (widget?.position?.x !== node.position.x || widget?.position?.y !== node.position.y)) {
                    widget.position.x = node.position.x;
                    widget.position.y = node.position.y;
                    updatedWidgets.push(widget);
                }
            }
        });
        if (updatedWidgets.length > 0) {
            console.log("!!!!! Updating widgets", updatedWidgets);
            dataTalk.updateDashboardPage(dashboard.id, page.id, page);
        }
    };

    const [nodes, setNodes, onNodesChange] = useNodesState(convertWidgetsToNodes(
        page.widgets,
        paperSize,
        paperPosition,
        dashboard.id,
        page.id,
        onRemoveClick,
        params));

    const nodesRef = React.useRef(nodes);
    useEffect(() => {
        nodesRef.current = nodes;
    }, [nodes]);

    useEffect(() => {
        const selectedNodeIds = nodesRef.current.filter((node) => node.selected).map((node) => node.id);

        setNodes(convertWidgetsToNodes(
            page.widgets,
            paperSize,
            paperPosition,
            dashboard.id,
            page.id,
            onRemoveClick,
            params,
            selectedNodeIds));
    }, [page.widgets, params]);

    useInjectStyles("dashboard", styles);

    const onNodeDragStop = useCallback((_: any, node: Node, nodes: Node[]) => {
        // console.log("Node moved:", node);
        // dataTalk.onWidgetMove(dashboard.id, page.id, node.id, node.position);
    }, []);

    return (

        <ReactFlow
            className={"relative w-full h-full bg-gray-50 dark:bg-gray-950 dark:bg-opacity-80"}
            panOnScroll={true}
            multiSelectionKeyCode={"Shift"}
            nodes={nodes}
            selectionOnDrag={true}
            panOnDrag={false}
            selectNodesOnDrag={true}
            snapToGrid={true}
            selectionMode={SelectionMode.Partial}
            snapGrid={[DEFAULT_GRID_SIZE, DEFAULT_GRID_SIZE]}
            zoomOnScroll={false}
            zoomOnPinch={true}
            minZoom={1}
            maxZoom={1}
            defaultViewport={{
                x: Math.max((containerSize.width - paperSize.width) / 2, DEFAULT_GRID_SIZE) - (paperPosition.x),
                y: initialViewPosition ? -initialViewPosition.y + 100 : -paperPosition.y + 100,
                zoom: 1
            }}
            onNodesDelete={(nodes) => {
                const deletedIds = nodes.map((node) => node.id);
                dataTalk.onWidgetsRemove(dashboard.id, page.id, deletedIds);
            }}
            preventScrolling={false}
            // edges={edges}
            onNodeDragStop={onNodeDragStop}

            onNodesChange={(change) => {
                onNodesChange(change);
                updateWidgetsBasedOnChange(change);
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
                <div
                    className={cls("w-full flex flex-row bg-white dark:bg-gray-900 rounded-2xl border", defaultBorderMixin)}>
                    <DashboardMenubar dashboard={dashboard}
                                      undoRedoState={undoRedoState}/>
                </div>
            </Panel>
            <Panel position="top-right">
                <div
                    className={cls("w-full flex flex-row bg-white dark:bg-gray-900 rounded-2xl border", defaultBorderMixin)}>
                    <DatePickerWithRange dateRange={dateRange} setDateRange={setDateRange}/>
                </div>
            </Panel>
            <Background gap={[DEFAULT_GRID_SIZE, DEFAULT_GRID_SIZE]}
                        color="#888"
                        variant={BackgroundVariant.Dots}/>

            {/*<MiniMap nodeStrokeWidth={3}*/}
            {/*         className={"dark:bg-gray-900"}*/}
            {/*         maskColor={"#88888822"}*/}
            {/*         nodeColor={"#66666622"}/>*/}

        </ReactFlow>
    );
};

function convertWidgetsToNodes(widgets: DashboardItem[], paperSize: WidgetSize, paperPosition: Position | undefined, dashboardId: string, pageId: string, onRemoveClick: (id: string) => void, params: DateParams, selectedNodeIds?: string[]): Node<ChartNodeProps | TextNodeProps>[] {

    const paperData = {
        width: paperSize.width,
        height: paperSize.height,
        x: paperPosition?.x ?? 0,
        y: paperPosition?.y ?? 0,
        dashboardId,
        pageId
    } satisfies PaperNodeProps;

    const paperNode: Node<any> = {
        id: "paper",
        type: "paper",
        draggable: false,
        selectable: false,
        position: {
            x: paperPosition?.x ?? 0,
            y: paperPosition?.y ?? 0
        },
        data: paperData
    };

    const widgetNodes = widgets.map((widget) => {
        if (widget.type === "text" || widget.type === "title" || widget.type === "subtitle") {
            return ({
                id: widget.id,
                type: "text",
                draggable: true,
                selectable: true,
                selected: selectedNodeIds?.includes(widget.id),
                data: {
                    textItem: widget,
                    params,
                    dashboardId,
                    pageId,
                    onRemoveClick
                },
                position: widget.position,
                parentId: "paper"
            });
        } else if (widget.type === "chart" || widget.type === "table") {
            return ({
                id: widget.id,
                type: "chart",
                draggable: true,
                selectable: true,
                selected: selectedNodeIds?.includes(widget.id),
                data: {
                    widgetConfig: widget,
                    params,
                    dashboardId,
                    pageId,
                    onRemoveClick
                },
                position: widget.position,
                parentId: "paper"
            });
        } else {
            console.error("Unknown widget type", widget);
            throw new Error("Unknown widget type");
        }
    });

    return [paperNode, ...widgetNodes];
}

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
`;
