import React, { useCallback, useEffect, useMemo, useState } from "react";
import ReactFlow, { Background, BackgroundVariant, Node, Panel, SelectionMode, useNodesState } from "reactflow";
import "reactflow/dist/style.css";
import { Button, cls, defaultBorderMixin, useInjectStyles } from "@firecms/ui";
import { Dashboard, DashboardPage, DateParams, Position, WidgetSize } from "../../types";
import ChartNode from "./nodes/ChartNode";
import { useDataki } from "../../DatakiProvider";
import PaperNode from "./nodes/PaperNode";
import { DEFAULT_GRID_SIZE, DEFAULT_PAPER_SIZE } from "../../utils/widgets";
import { DashboardMenubar } from "./DashboardMenubar";
import { DatePickerWithRange } from "../DateRange";
import { getInitialDateRange } from "../utils/dates";
import { DashboardState, useCreateDashboardState } from "../../hooks/useCreateDashboardState";
import TextNode from "./nodes/TextNode";
import { convertDashboardWidgetsToNodes, convertNodesToWidgets } from "../utils/dashboard";

const DashboardStateContext = React.createContext<DashboardState | undefined>(undefined);

export function useDashboardStateContext() {
    const context = React.useContext(DashboardStateContext);
    if (context === undefined) {
        throw new Error("useDashboardStateContext must be used within a DashboardStateContext");
    }
    return context;
}

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

    const params: DateParams = useMemo(() => ({
        dateStart: dateRange[0] ?? null,
        dateEnd: dateRange[1] ?? null
    }), [dateRange]);

    const nodeTypes = useMemo(() => ({
        paper: PaperNode,
        chart: ChartNode,
        text: TextNode
    }), []);

    const datakiConfig = useDataki();

    const onRemoveClick = useCallback((id: string) => {
        datakiConfig.onWidgetRemove(dashboard.id, page.id, id);
        setNodes((nodes) => nodes.filter((node) => node.id !== id));
    }, [dashboard.id, page.id])

    const paperSize = page.paper?.size ?? DEFAULT_PAPER_SIZE;
    const paperPosition = page.paper?.position ?? {
        x: 0,
        y: 0
    };

    const [nodes, setNodes, onNodesChange] = useNodesState(convertDashboardWidgetsToNodes(
        {
            widgets: page.widgets,
            paperSize,
            paperPosition,
            dashboardId: dashboard.id,
            pageId: page.id,
            onRemoveClick,
            params
        }));

    const nodesRef = React.useRef(nodes);
    useEffect(() => {
        nodesRef.current = nodes;
    }, [nodes]);

    // useEffect(() => {
    //     const selectedNodeIds = nodesRef.current.filter((node) => node.selected).map((node) => node.id);
    //
    //     setNodes(convertDashboardWidgetsToNodes(
    //         {
    //             widgets: page.widgets,
    //             paperSize,
    //             paperPosition,
    //             dashboardId: dashboard.id,
    //             pageId: page.id,
    //             onRemoveClick,
    //             params,
    //             selectedNodeIds
    //         }));
    // }, [page.id, page.widgets, params]);

    useInjectStyles("dashboard", styles);

    const onNodesUpdate = (updatedNodes: Node[]) => {

        setNodes(updatedNodes);

        const currentWidgets = convertNodesToWidgets(updatedNodes);
        const updatedDashboard: Dashboard = {
            ...dashboard,
            pages: dashboard.pages.map((p) => {
                if (p.id === page.id) {
                    return {
                        ...p,
                        widgets: currentWidgets
                    }
                }
                return p;
            })
        };
        datakiConfig.updateDashboard(dashboard.id, updatedDashboard);
    }

    const dashboardState = useCreateDashboardState({
        dashboard,
        page,
        nodes,
        onNodesUpdate,
        params,
        onRemoveClick
    });

    return (
        <DashboardStateContext value={dashboardState}>
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
                onNodesDelete={dashboardState.onNodesDelete}
                preventScrolling={false}
                onNodesChange={(change) => {
                    onNodesChange(change);
                    dashboardState.updateWidgetsBasedOnChange(change);
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
                                          dashboardState={dashboardState}/>
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
        </DashboardStateContext>
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
`;
