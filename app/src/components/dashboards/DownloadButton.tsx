import React from "react";
import { getRectOfNodes, getTransformForBounds, useReactFlow } from "reactflow";
import { toPng } from "html-to-image";
import { Button, DownloadIcon, IconButton } from "@firecms/ui";
import { useModeController } from "@firecms/core";
import { downloadImage } from "../../utils/downloadImage";


export function DownloadButton() {

    const { mode } = useModeController();
    const { getNodes } = useReactFlow();
    const onClick = () => {
        // we calculate a transform for the nodes so that all nodes are visible
        // we then overwrite the transform of the `.react-flow__viewport` element
        // with the style option of the html-to-image library

        const paperNode = getNodes().find((node) => node.type === "paper");

        const imageWidth = paperNode?.width;
        const imageHeight = paperNode?.height;

        if (!imageWidth || !imageHeight) {
            throw Error("Paper node not found");
        }
        console.log(paperNode);

        const nodesBounds = getRectOfNodes([paperNode]);
        console.log(nodesBounds);
        // const nodesBounds = getRectOfNodes(getNodes());
        const transform = getTransformForBounds(nodesBounds, imageWidth, imageHeight, 1, 1);

        console.log("transform", transform);
        const node = document.querySelector(".react-flow__viewport");
        if (!node) {
            throw Error("Viewport not found");
        }
        toPng(node as HTMLElement, {
            backgroundColor: mode === "dark" ? "#18181c" : "#fff",
            width: imageWidth,
            height: imageHeight,
            style: {
                width: `${imageWidth}px`,
                height: `${imageHeight}px`,
                transform: `translate(${transform[0]}px, ${transform[1]}px) scale(${transform[2]})`,
            },
        }).then((url) => downloadImage(url, "dashboard.png"));
    };

    return (
        <IconButton variant="ghost" onClick={onClick}>
           <DownloadIcon/>
        </IconButton>
    );
}

