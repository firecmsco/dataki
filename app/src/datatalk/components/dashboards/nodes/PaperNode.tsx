import { NodeProps, NodeResizer } from "reactflow";
import { ComponentType, memo, useState } from "react";
import { WidgetSize } from "../../../types";
import { useDataki } from "../../../DatakiProvider";

export type PaperNodeProps = {
    dashboardId: string;
    pageId: string;
    width: number;
    height: number;
    x: number;
    y: number;
}

function PaperNode(props: NodeProps<PaperNodeProps>) {

    const datakiConfig = useDataki();

    const { data } = props;
    const [size, setSize] = useState<WidgetSize>({
        width: data.width,
        height: data.height,
    });

    return (
        <div
            key={"paper-node"}
            className={"bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 dark:border-opacity-80 overflow-hidden"}
            style={{
                width: size.width,
                height: size.height,
                pointerEvents: "auto"
            }}
        >
            <NodeResizer minWidth={300}
                         minHeight={300}
                         onResize={(event, params) => {

                             console.log("paper resize", {
                                 params,
                                 event
                             });
                             const updatedSize = {
                                 width: params.width,
                                 height: params.height
                             };
                             const updatedPosition = {
                                 x: params.x,
                                 y: params.y
                             };
                             setSize(updatedSize);
                             datakiConfig.updateDashboardPage(data.dashboardId, data.pageId, {
                                 paper: { size: updatedSize, position: updatedPosition }
                             });
                         }}
            />
        </div>
    );

}

export default memo(PaperNode) as ComponentType<NodeProps>;
