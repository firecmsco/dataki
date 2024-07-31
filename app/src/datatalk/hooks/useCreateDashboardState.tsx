import React, { useEffect, useRef, useState } from "react";
import { Node } from "@reactflow/core";

import { convertWidgetsToNodes } from "../components/utils/dashboard";
import { Dashboard, DashboardItem, DashboardPage, DateParams, Position, WidgetSize } from "../types";
import { randomString } from "@firecms/core";
import { NodeChange, NodePositionChange } from "reactflow";
import { TextNodeProps } from "../components/dashboards/nodes/TextNode";
import { ChartNodeProps } from "../components/dashboards/nodes/ChartNode";

export interface DashboardState {
    onCopy: () => void;
    onPaste: () => void;
    onUndo: () => void;
    onRedo: () => void;
    onNodesDelete: (nodesToRemove: Node[]) => void;
    onNodeResize: (widgetId: string, params: { position: Position, size: WidgetSize }) => void;
    updateWidgetsBasedOnChange: (changes: NodeChange[]) => void;
    canCopy: boolean;
    canPaste: boolean;
    canUndo: boolean;
    canRedo: boolean;
}

export function useCreateDashboardState({
                                            dashboard,
                                            page,
                                            nodes,
                                            onNodesUpdate,
                                            params,
                                            onRemoveClick
                                        }: {
    dashboard: Dashboard;
    page: DashboardPage;
    nodes: Node[];
    onNodesUpdate: (nodes: Node[]) => void;
    params: DateParams,
    onRemoveClick: (id: string) => void
}): DashboardState {

    const beforeChangeNodesRef = React.useRef<Node[] | null>(null);
    const [clipboard, setClipboard] = useState<Node[] | null>(null);

    const undoStack = useRef<Node[][]>([]);
    const redoStack = useRef<Node[][]>([]);

    const canCopy = nodes.some((el) => el.selected);
    const canPaste = (clipboard && clipboard.length > 0) ?? false;
    const canUndo = undoStack.current.length > 0;
    const canRedo = redoStack.current.length > 0;

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
            const isCmdOrCtrl = isMac ? event.metaKey : event.ctrlKey;

            if (event.key === "z" && isCmdOrCtrl && canUndo) {
                if (event.shiftKey) onRedo()
                else onUndo();
            } else if (event.key === "c" && isCmdOrCtrl && canCopy) {
                onCopy();
            } else if (event.key === "v" && isCmdOrCtrl && canPaste) {
                onPaste();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [canCopy, canPaste, canUndo, canRedo]);

    const updateStateAndHistory = (newNodes: Node[], prevNodes?: Node[]) => {
        const beforeNodes = prevNodes ?? nodes.map((node) => deepCopy(node));
        undoStack.current.push(beforeNodes);
        redoStack.current = [];
        onNodesUpdate(newNodes);
    }

    const onUndo = () => {
        if (undoStack.current.length === 0) return;
        const prevNodes = undoStack.current.pop();
        if (prevNodes) {
            redoStack.current.push(prevNodes);
            onNodesUpdate(prevNodes);
        }
    };

    const onRedo = () => {
        if (redoStack.current.length === 0) return;
        const nextNodes = redoStack.current.pop();
        if (nextNodes) {
            undoStack.current = [...undoStack.current, nextNodes];
            onNodesUpdate(nextNodes);
        }
    };

    const onPaste = () => {
        if (clipboard && clipboard.length > 0) {
            const pastedWidgets: DashboardItem[] = clipboard.map((el) => {
                const widget: DashboardItem | undefined = page.widgets.find((widget) => widget.id === el.id);
                if (!widget) {
                    console.error("Widget not found", el.id);
                    throw new Error("Widget not found");
                }
                return {
                    ...widget,
                    id: randomString(20),
                    position: {
                        x: el.position.x + 50,
                        y: el.position.y + 50
                    }
                };
            });

            const pastedNodes = convertWidgetsToNodes({
                widgets: pastedWidgets,
                selectedNodeIds: pastedWidgets.map((widget) => widget.id),
                params,
                dashboardId: dashboard.id,
                pageId: page.id,
                onRemoveClick
            })
            const unselectedNodes = nodes.map((el) => ({
                ...el,
                selected: false
            }));
            const updatedNodes = [...unselectedNodes, ...pastedNodes];
            updateStateAndHistory(updatedNodes);
            onNodesUpdate(updatedNodes);
        }
    };

    const onCopy = () => {
        const selectedElements = nodes.filter((el) => el.selected);
        if (selectedElements.length > 0) {
            setClipboard(selectedElements);
        }
    };

    const onNodesDelete = (nodesToRemove: Node[]) => {
        const newNodes = nodes.filter(
            (element) => !nodesToRemove.some((rem) => rem.id === element.id)
        );
        updateStateAndHistory(newNodes);
    };

    const changing = useRef(false);

    const updateWidgetsBasedOnChange = (changes: NodeChange[]) => {

        const wasChanging = changing.current;
        const isChanging = changes.some((change) => {
            if (change.type === "position" && change.dragging)
                return true;
            // if (change.type === "dimensions" && change.resizing)
            //     return true;
            return false;
        });
        changing.current = isChanging;

        if (!wasChanging && isChanging) {
            beforeChangeNodesRef.current = [...nodes.map((node) => deepCopy(node))];
        }

        if (wasChanging && !isChanging) {

            const updatedNodes: Node<ChartNodeProps | TextNodeProps>[] = [];

            const positionChanges = changes.filter((change) => change.type === "position" && !change.dragging) as NodePositionChange[];
            // check the positions are the same in the node and the widgets
            positionChanges.forEach((change) => {
                const node = nodes.find((node) => node.id === change.id);
                if (node) {
                    const widget = page.widgets.find((widget) => widget.id === change.id);
                    if (widget && (widget?.position?.x !== node.position.x || widget?.position?.y !== node.position.y)) {
                        widget.position.x = node.position.x;
                        widget.position.y = node.position.y;
                        updatedNodes.push(node);
                    }
                }
            });

            // const dimensionsChanges = changes.filter((change) => change.type === "dimensions" && change.dimensions) as NodeDimensionChange[];
            //
            // dimensionsChanges.forEach((change) => {
            //     const node = nodes.find((node) => node.id === change.id);
            //     if (node) {
            //         const widget = page.widgets.find((widget) => widget.id === change.id);
            //         if (widget) {
            //             widget.size.width = change.dimensions?.width ?? 200;
            //             widget.size.height = change.dimensions?.height ?? 200;
            //             updatedNodes.push(node);
            //         }
            //     }
            // });
            if (updatedNodes.length > 0) {
                updateStateAndHistory(nodes.map((node) => {
                    const updatedNode = updatedNodes.find((n) => n.id === node.id);
                    if (updatedNode) {
                        return updatedNode;
                    }
                    return node;
                }), beforeChangeNodesRef.current ?? undefined);
            }

            beforeChangeNodesRef.current = null;
        }
    };

    const onNodeResize = (widgetId: string, params: { position: Position, size: WidgetSize }) => {
        const beforeNodes = [...nodes.map((node) => deepCopy(node))];
        const updatedNodes = nodes.map((node) => {
            if (node.id === widgetId) {
                return {
                    ...node,
                    position: params.position,
                    width: params.size.width,
                    height: params.size.height
                };
            }
            return node;
        });
        updateStateAndHistory(updatedNodes, beforeNodes);
    }

    return {
        onCopy,
        onPaste,
        onNodesDelete,
        onUndo,
        onRedo,
        updateWidgetsBasedOnChange,
        onNodeResize,
        canCopy,
        canPaste,
        canUndo,
        canRedo
    };
}

function deepCopy<T>(obj: T): T {
    if (obj === null || typeof obj !== "object") {
        return obj;
    }

    if (Array.isArray(obj)) {
        const arrCopy = [] as any[];
        for (const item of obj) {
            arrCopy.push(deepCopy(item));
        }
        return arrCopy as any;
    }

    const objCopy = {} as { [key in keyof T]: T[key] };
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            objCopy[key] = deepCopy(obj[key]);
        }
    }
    return objCopy;
}
