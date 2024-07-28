import React, { ComponentType, memo, useState } from "react";
import { NodeProps, NodeResizer, NodeToolbar, Position } from "reactflow";
import { DateParams, TextItem, WidgetSize } from "../../../types";
import { cls, IconButton, RemoveIcon, TextField, Tooltip } from "@firecms/ui";
import { useDataTalk } from "../../../DataTalkProvider";
import { TEXT_WIDTH, TITLE_HEIGHT } from "../../../utils/widgets";

export type TextNodeProps = {
    textItem: TextItem;
    params?: DateParams;
    dashboardId: string;
    pageId: string;
    onRemoveClick: (widgetId: string) => void;
};

function TextNode(props: NodeProps<TextNodeProps>) {

    const { data } = props;

    const [text, setText] = useState<string>(data.textItem.text);
    const [size, setSize] = useState<WidgetSize>(data.textItem?.size ?? {
        width: TEXT_WIDTH,
        height: TITLE_HEIGHT
    });

    const dataTalk = useDataTalk();

    const [resizing, setResizing] = useState<boolean>(false);
    let textClass: string;
    if (data.textItem.type === "title") {
        textClass = "text-3xl";
    } else if (data.textItem.type === "subtitle") {
        textClass = "text-xl";
    } else {
        textClass = "text-body";
    }

    const fieldSize = data.textItem.type === "title" ? "medium" : "small";

    return (
        <div className={cls(textClass, "relative group")}>

            <NodeToolbar
                isVisible={undefined}
                position={Position.Top}
            >
                <Tooltip title={"Remove this view"}
                         className={"h-[32px] rounded-full bg-gray-50 dark:bg-gray-950 invisible group-hover:visible z-10"}>
                    <IconButton
                        onClick={() => dataTalk.onWidgetRemove(data.dashboardId, data.pageId, data.textItem.id)}
                        size={"small"}>
                        <RemoveIcon
                            size={"small"}/>
                    </IconButton>
                </Tooltip>
            </NodeToolbar>

            <TextField value={text}
                       size={fieldSize}
                       style={{
                           width: size.width,
                           height: size.height
                       }}
                       invisible={!props.selected}
                       placeholder={"Write something"}
                       className={cls(resizing ? "bg-opacity-70 dark:bg-gray-700 dark:bg-opacity-60 dark:hover:bg-opacity-60" : "",
                           props.selected || resizing ? "ring-offset-transparent ring-2 ring-primary ring-opacity-75 ring-offset-2" : "")}
                       onChange={(e) => {
                           setText(e.target.value);
                           dataTalk.updateDashboardText(data.dashboardId, data.pageId, data.textItem.id, {
                               ...data.textItem,
                               text: e.target.value
                           });
                       }}/>

            <NodeResizer minWidth={200}
                         minHeight={size.height}
                         maxHeight={size.height}
                         shouldResize={(event, params) => {
                             console.log("shouldResize", params.direction[0] !== 0, params);
                             return params.direction[0] !== 0;
                             // allow only horizontal resize
                             //    return params.width !== data.textItem.size.width;
                         }}
                         onResizeStart={() => setResizing(true)}
                         onResizeEnd={() => setResizing(false)}
                         onResize={(event, params) => {
                             console.log("onResize", params);
                             const updatedSize = {
                                 width: params.width,
                                 height: params.height
                             };
                             const position = {
                                 x: params.x,
                                 y: params.y
                             };
                             setSize(updatedSize);
                             dataTalk.onWidgetMove(data.dashboardId, data.pageId, data.textItem.id, position);
                             dataTalk.onWidgetResize(data.dashboardId, data.pageId, data.textItem.id, updatedSize);
                         }}
            />

        </div>
    );
}

export default memo(TextNode) as ComponentType<NodeProps>;
