import React, { useDeferredValue, useEffect, useRef } from "react";
import { Button, ForumIcon, IconButton, Separator, ShareIcon, TextField, TitleIcon, Tooltip } from "@firecms/ui";
import { Dashboard } from "../../types";
import { DownloadButton } from "./DownloadButton";
import { useDataki } from "../../DatakiProvider";
import { UndoRedoState } from "../../hooks/useUndoRedo";
import { randomString } from "@firecms/core";
import { DEFAULT_GRID_SIZE, SUBTITLE_HEIGHT, TEXT_WIDTH, TITLE_HEIGHT } from "../../utils/widgets";
import { useViewport } from "reactflow";
import { useNavigate } from "react-router-dom";

const RADIO_ITEMS = ["Andy", "Benoît", "Luis"];
const CHECK_ITEMS = ["Always Show Bookmarks Bar", "Always Show Full URLs"];

export const DashboardMenubar = ({
                                     dashboard,
                                     undoRedoState
                                 }: {
    dashboard: Dashboard,
    undoRedoState: UndoRedoState
}) => {

    const navigate = useNavigate();
    const datakiConfig = useDataki();
    const viewport = useViewport();
    // const [checkedSelection, setCheckedSelection] = React.useState([CHECK_ITEMS[1]]);
    // const [radioSelection, setRadioSelection] = React.useState(RADIO_ITEMS[2]);


    return (
        <div className={"z-10 bg-white dark:bg-gray-950 p-[3px] shadow-sm flex items-center bg-transparent dark:bg-transparent rounded-2xl gap-2 px-2 "}>

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
                                            y: -(viewport.y % DEFAULT_GRID_SIZE) * DEFAULT_GRID_SIZE + 100
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
                                            y: -(viewport.y % DEFAULT_GRID_SIZE) * DEFAULT_GRID_SIZE + 100
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

            {/*<Menubar className={"flex items-center bg-transparent dark:bg-transparent rounded-2xl gap-2 px-2"}>*/}

            {/*<MenubarMenu>*/}
            {/*    <MenubarTrigger*/}
            {/*        className={"hover:bg-slate-200 hover:bg-opacity-75 dark:hover:bg-gray-700 dark:hover:bg-opacity-50"}>*/}
            {/*        File*/}
            {/*    </MenubarTrigger>*/}
            {/*    <MenubarPortal>*/}
            {/*        <MenubarContent>*/}
            {/*            <MenubarItem>*/}
            {/*                New Tab{" "}*/}
            {/*                <MenubarShortcut>*/}
            {/*                    ⌘ T*/}
            {/*                </MenubarShortcut>*/}
            {/*            </MenubarItem>*/}
            {/*            <MenubarItem>*/}
            {/*                New Window{" "}*/}
            {/*                <MenubarShortcut>*/}
            {/*                    ⌘ N*/}
            {/*                </MenubarShortcut>*/}
            {/*            </MenubarItem>*/}
            {/*            <MenubarItem disabled*/}
            {/*            >*/}
            {/*                New Incognito Window*/}
            {/*            </MenubarItem>*/}
            {/*            <MenubarSeparator/>*/}
            {/*            <MenubarSub>*/}
            {/*                <MenubarSubTrigger>*/}
            {/*                    Share*/}
            {/*                    <MenubarSubTriggerIndicator/>*/}
            {/*                </MenubarSubTrigger>*/}
            {/*                <MenubarPortal>*/}
            {/*                    <MenubarSubContent>*/}
            {/*                        <MenubarItem>*/}
            {/*                            Email Link*/}
            {/*                        </MenubarItem>*/}
            {/*                        <MenubarItem>*/}
            {/*                            Messages*/}
            {/*                        </MenubarItem>*/}
            {/*                        <MenubarItem>*/}
            {/*                            Notes*/}
            {/*                        </MenubarItem>*/}
            {/*                    </MenubarSubContent>*/}
            {/*                </MenubarPortal>*/}
            {/*            </MenubarSub>*/}
            {/*            <MenubarSeparator/>*/}
            {/*            <MenubarItem>*/}
            {/*                Print…{" "}*/}
            {/*                <MenubarShortcut>*/}
            {/*                    ⌘ P*/}
            {/*                </MenubarShortcut>*/}
            {/*            </MenubarItem>*/}
            {/*        </MenubarContent>*/}
            {/*    </MenubarPortal>*/}
            {/*</MenubarMenu>*/}

            {/*<MenubarMenu>*/}
            {/*    <MenubarTrigger className={"rounded-xl"}>*/}
            {/*        Edit*/}
            {/*    </MenubarTrigger>*/}
            {/*    <MenubarPortal>*/}
            {/*        <MenubarContent>*/}
            {/*            <MenubarItem disabled={!undoRedoState.actions.canUndo}>*/}
            {/*                Undo{" "}*/}
            {/*                <MenubarShortcut>*/}
            {/*                    ⌘ Z*/}
            {/*                </MenubarShortcut>*/}
            {/*            </MenubarItem>*/}
            {/*            <MenubarItem disabled={!undoRedoState.actions.canRedo}>*/}
            {/*                Redo{" "}*/}
            {/*                <MenubarShortcut>*/}
            {/*                    ⇧ ⌘ Z*/}
            {/*                </MenubarShortcut>*/}
            {/*            </MenubarItem>*/}
            {/*            /!*    <MenubarSeparator/>*!/*/}
            {/*            /!*    <MenubarSub>*!/*/}
            {/*            /!*        <MenubarSubTrigger>*!/*/}
            {/*            /!*            Find*!/*/}
            {/*            /!*        </MenubarSubTrigger>*!/*/}

            {/*            /!*        <MenubarPortal>*!/*/}
            {/*            /!*            <MenubarSubContent>*!/*/}
            {/*            /!*                <MenubarItem>*!/*/}
            {/*            /!*                    Search the web…*!/*/}
            {/*            /!*                </MenubarItem>*!/*/}
            {/*            /!*                <MenubarSeparator/>*!/*/}
            {/*            /!*                <MenubarItem>*!/*/}
            {/*            /!*                    Find…*!/*/}
            {/*            /!*                </MenubarItem>*!/*/}
            {/*            /!*                <MenubarItem>*!/*/}
            {/*            /!*                    Find Next*!/*/}
            {/*            /!*                </MenubarItem>*!/*/}
            {/*            /!*                <MenubarItem>*!/*/}
            {/*            /!*                    Find Previous*!/*/}
            {/*            /!*                </MenubarItem>*!/*/}
            {/*            /!*            </MenubarSubContent>*!/*/}
            {/*            /!*        </MenubarPortal>*!/*/}
            {/*            /!*    </MenubarSub>*!/*/}
            {/*            /!*    <MenubarSeparator/>*!/*/}
            {/*            /!*    <MenubarItem>*!/*/}
            {/*            /!*        Cut*!/*/}
            {/*            /!*    </MenubarItem>*!/*/}
            {/*            /!*    <MenubarItem>*!/*/}
            {/*            /!*        Copy*!/*/}
            {/*            /!*    </MenubarItem>*!/*/}
            {/*            /!*    <MenubarItem>*!/*/}
            {/*            /!*        Paste*!/*/}
            {/*            /!*    </MenubarItem>*!/*/}
            {/*        </MenubarContent>*/}
            {/*    </MenubarPortal>*/}
            {/*</MenubarMenu>*/}

            {/*<MenubarMenu>*/}
            {/*    <MenubarTrigger>*/}
            {/*        View*/}
            {/*    </MenubarTrigger>*/}
            {/*    <MenubarPortal>*/}
            {/*        <MenubarContent>*/}
            {/*            {CHECK_ITEMS.map((item) => (*/}
            {/*                <MenubarCheckboxItem*/}

            {/*                    key={item}*/}
            {/*                    checked={checkedSelection.includes(item)}*/}
            {/*                    onCheckedChange={() =>*/}
            {/*                        setCheckedSelection((current) =>*/}
            {/*                            current.includes(item)*/}
            {/*                                ? current.filter((el) => el !== item)*/}
            {/*                                : current.concat(item)*/}
            {/*                        )*/}
            {/*                    }*/}
            {/*                >*/}
            {/*                    <MenubarItemIndicator/>*/}
            {/*                    {item}*/}
            {/*                </MenubarCheckboxItem>*/}
            {/*            ))}*/}
            {/*            <MenubarSeparator/>*/}
            {/*            <MenubarItem leftPadding={true}>*/}
            {/*                Reload{" "}*/}
            {/*                <MenubarShortcut>*/}
            {/*                    ⌘ R*/}
            {/*                </MenubarShortcut>*/}
            {/*            </MenubarItem>*/}
            {/*            <MenubarItem*/}
            {/*                leftPadding*/}
            {/*                disabled>*/}
            {/*                Force Reload{" "}*/}
            {/*                <MenubarShortcut>*/}
            {/*                    ⇧ ⌘ R*/}
            {/*                </MenubarShortcut>*/}
            {/*            </MenubarItem>*/}
            {/*            <MenubarSeparator/>*/}
            {/*            <MenubarItem*/}
            {/*                leftPadding>*/}
            {/*                Toggle Fullscreen*/}
            {/*            </MenubarItem>*/}
            {/*            <MenubarSeparator/>*/}
            {/*            <MenubarItem*/}
            {/*                leftPadding>*/}
            {/*                Hide Sidebar*/}
            {/*            </MenubarItem>*/}
            {/*        </MenubarContent>*/}
            {/*    </MenubarPortal>*/}
            {/*</MenubarMenu>*/}

            {/*<MenubarMenu>*/}
            {/*    <MenubarTrigger>*/}
            {/*        Profiles*/}
            {/*    </MenubarTrigger>*/}
            {/*    <MenubarPortal>*/}
            {/*        <MenubarContent>*/}
            {/*            <MenubarRadioGroup value={radioSelection} onValueChange={setRadioSelection}>*/}
            {/*                {RADIO_ITEMS.map((item) => (*/}
            {/*                    <MenubarRadioItem*/}
            {/*                        key={item}*/}
            {/*                        value={item}>*/}
            {/*                        <MenubarItemIndicator>*/}
            {/*                            <FiberManualRecordIcon size={"smallest"}/>*/}
            {/*                        </MenubarItemIndicator>*/}
            {/*                        {item}*/}
            {/*                    </MenubarRadioItem>*/}
            {/*                ))}*/}
            {/*                <MenubarSeparator/>*/}
            {/*                <MenubarItem leftPadding>*/}
            {/*                    Edit…*/}
            {/*                </MenubarItem>*/}
            {/*                <MenubarSeparator/>*/}
            {/*                <MenubarItem leftPadding>*/}
            {/*                    Add Profile…*/}
            {/*                </MenubarItem>*/}
            {/*            </MenubarRadioGroup>*/}
            {/*        </MenubarContent>*/}
            {/*    </MenubarPortal>*/}
            {/*</MenubarMenu>*/}
            {/*</Menubar>*/}
        </div>
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
