import React, { useDeferredValue, useEffect, useRef } from "react";
import {
    Button,
    ForumIcon,
    IconButton,
    Menubar,
    MenubarContent,
    MenubarItem,
    MenubarMenu,
    MenubarPortal,
    MenubarSeparator,
    MenubarShortcut,
    MenubarTrigger,
    Separator,
    ShareIcon,
    TextField,
    TitleIcon,
    Tooltip
} from "@firecms/ui";
import { Dashboard } from "../../types";
import { DownloadButton } from "./DownloadButton";
import { useDataki } from "../../DatakiProvider";
import { DashboardState } from "../../hooks/useCreateDashboardState";
import { randomString } from "@firecms/core";
import { DEFAULT_GRID_SIZE, SUBTITLE_HEIGHT, TEXT_WIDTH, TITLE_HEIGHT } from "../../utils/widgets";
import { useViewport } from "reactflow";
import { useNavigate } from "react-router-dom";

const RADIO_ITEMS = ["Andy", "Benoît", "Luis"];
const CHECK_ITEMS = ["Always Show Bookmarks Bar", "Always Show Full URLs"];

export const DashboardMenubar = ({
                                     dashboard,
                                     dashboardState
                                 }: {
    dashboard: Dashboard,
    dashboardState: DashboardState
}) => {

    const navigate = useNavigate();
    const datakiConfig = useDataki();
    const viewport = useViewport();

    // const [checkedSelection, setCheckedSelection] = React.useState([CHECK_ITEMS[1]]);
    // const [radioSelection, setRadioSelection] = React.useState(RADIO_ITEMS[2]);

    return (
        <Menubar
            className={"z-10 bg-white dark:bg-gray-950 p-[3px] shadow-sm flex items-center bg-transparent dark:bg-transparent rounded-2xl gap-2 px-2 "}>

            <DashboardNameTextField title={dashboard.title} id={dashboard.id}/>

            <div className={"flex items-center gap-1 px-0"}>
                <Tooltip title={"Download as .png"}>
                    <DownloadButton/>
                </Tooltip>
                <Tooltip title={"Not ready yet!"}>
                    <ShareIcon color={"disabled"}/>
                </Tooltip>
            </div>
            <Separator orientation={"vertical"}/>

            <div className={"flex items-center gap-0 px-0"}>
                <Tooltip title={"Add title"}>
                    <IconButton variant="ghost"
                                onClick={() => {
                                    datakiConfig.addDashboardText(dashboard.id, dashboard.pages[0].id, {
                                        id: randomString(20),
                                        type: "title",
                                        text: "",
                                        position: {
                                            x: DEFAULT_GRID_SIZE,
                                            y: roundDownToGrid(-viewport.y, DEFAULT_GRID_SIZE) + 100
                                        },
                                        size: {
                                            width: TEXT_WIDTH,
                                            height: TITLE_HEIGHT
                                        }
                                    });
                                }}>
                        <TitleIcon/>
                    </IconButton>
                </Tooltip>
                <Tooltip title={"Add heading"}>
                    <IconButton variant="ghost"
                                onClick={() => {
                                    datakiConfig.addDashboardText(dashboard.id, dashboard.pages[0].id, {
                                        id: randomString(20),
                                        type: "subtitle",
                                        text: "",
                                        position: {
                                            x: DEFAULT_GRID_SIZE,
                                            y: roundDownToGrid(-viewport.y, DEFAULT_GRID_SIZE) + 100
                                        },
                                        size: {
                                            width: TEXT_WIDTH,
                                            height: SUBTITLE_HEIGHT
                                        }
                                    });
                                }}>
                        <TitleIcon size={"small"}/>
                    </IconButton>
                </Tooltip>
            </div>
            <Separator orientation={"vertical"}/>

            <MenubarMenu>
                <MenubarTrigger className={"rounded-xl"}>
                    Edit
                </MenubarTrigger>
                <MenubarPortal>
                    <MenubarContent>
                        <MenubarItem disabled={!dashboardState.canCopy}
                                     onSelect={dashboardState.onCopy}>
                            Copy{" "}
                            <MenubarShortcut>
                                ⌘ C
                            </MenubarShortcut>
                        </MenubarItem>
                        <MenubarItem disabled={!dashboardState.canPaste}
                                     onSelect={dashboardState.onPaste}>
                            Paste{" "}
                            <MenubarShortcut>
                                ⌘ V
                            </MenubarShortcut>
                        </MenubarItem>
                        <MenubarSeparator/>
                        <MenubarItem disabled={!dashboardState.canUndo}
                                     onSelect={dashboardState.onUndo}>
                            Undo{" "}
                            <MenubarShortcut>
                                ⌘ Z
                            </MenubarShortcut>
                        </MenubarItem>
                        <MenubarItem disabled={!dashboardState.canRedo}
                                     onSelect={dashboardState.onRedo}>
                            Redo{" "}
                            <MenubarShortcut>
                                ⇧ ⌘ Z
                            </MenubarShortcut>
                        </MenubarItem>
                    </MenubarContent>
                </MenubarPortal>
            </MenubarMenu>

            <Button
                size={"small"}
                variant={"text"}
                onClick={async () => {
                    const sessionId = await datakiConfig.createSessionId();
                    navigate(`/chat/${sessionId}`);
                }}>
                <ForumIcon size={"small"}/>
                New widget
            </Button>


        </Menubar>
    );
};

function DashboardNameTextField({
                                    title: titleProp,
                                    id
                                }: { title?: string, id: string }) {
    const datakiConfig = useDataki();
    const savedTitle = useRef(titleProp);
    const [title, setTitle] = React.useState(titleProp);
    const deferredTitle = useDeferredValue(title);
    useEffect(() => {
        if (deferredTitle !== savedTitle.current) {
            datakiConfig.updateDashboard(id, { title: deferredTitle });
            savedTitle.current = deferredTitle;
        }
    }, [deferredTitle]);
    return (
        <TextField
            className={"font-semibold rounded-xl text-sm w-80"}
            inputClassName={"rounded-xl"}
            invisible={true}
            size={"smallest"}
            placeholder={"Untitled dashboard"}
            onChange={(e) => setTitle(e.target.value)}
            value={title}
        />
    );
}

function roundDownToGrid(num: number, gridSize: number): number {
    return Math.floor(num / gridSize) * gridSize;
}
