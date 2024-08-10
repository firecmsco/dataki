import { Node } from "reactflow";
import { DashboardItem, DateParams, Position, WidgetSize } from "../../types";
import { ChartNodeProps } from "../dashboards/nodes/ChartNode";
import { TextNodeProps } from "../dashboards/nodes/TextNode";
import { PaperNodeProps } from "../dashboards/nodes/PaperNode";

export function convertWidgetsToNodes({
                                          widgets,
                                          selectedNodeIds,
                                          dashboardId,
                                          pageId,
                                      }: {
    widgets: DashboardItem[],
    selectedNodeIds?: string[],
    dashboardId: string,
    pageId: string,
}) {
    return widgets.map((widget) => {
        if (widget.type === "text" || widget.type === "title" || widget.type === "subtitle") {
            return ({
                id: widget.id,
                type: "text",
                draggable: true,
                selectable: true,
                selected: selectedNodeIds?.includes(widget.id),
                data: {
                    widget,
                    dashboardId,
                    pageId,
                },
                width: widget.size.width,
                height: widget.size.height,
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
                    widget,
                    dashboardId,
                    pageId,
                },
                width: widget.size.width,
                height: widget.size.height,
                position: widget.position,
                parentId: "paper"
            });
        } else {
            console.error("Unknown widget type", widget);
            throw new Error("Unknown widget type");
        }
    });
}

export function convertNodesToWidgets(nodes: Node<ChartNodeProps | TextNodeProps>[]): DashboardItem[] {
    return nodes.map((node) => {
        if (node.type === "text") {
            return {
                ...node.data.widget,
                position: node.position,
                size: {
                    width: node.width ?? 200,
                    height: node.height ?? 200
                }
            };
        } else if (node.type === "chart") {
            return {
                ...node.data.widget,
                position: node.position,
                size: {
                    width: node.width ?? 200,
                    height: node.height ?? 200
                }
            };
        } else if (node.type === "paper") {
            return null;
        } else {
            console.error("Unknown node type", node);
            throw new Error("Unknown node type");
        }
    }).filter(Boolean) as DashboardItem[];

}

export function convertDashboardWidgetsToNodes({
                                                   widgets,
                                                   paperSize,
                                                   paperPosition,
                                                   dashboardId,
                                                   pageId,
                                                   selectedNodeIds
                                               }: {
    widgets: DashboardItem[],
    paperSize: WidgetSize,
    paperPosition: Position | undefined,
    dashboardId: string,
    pageId: string,
    selectedNodeIds?: string[]
}): Node<ChartNodeProps | TextNodeProps>[] {

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

    const widgetNodes = convertWidgetsToNodes({
        widgets,
        selectedNodeIds,
        dashboardId,
        pageId,
    });

    return [paperNode, ...widgetNodes];
}
