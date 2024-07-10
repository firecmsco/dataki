import React from "react";
import { Link, NavLink } from "react-router-dom";

import { DrawerLogo, useApp, useNavigationController } from "@firecms/core";
import { useDataTalk } from "../DataTalkProvider";
import { Button, cls, cn, ForumIcon, Tooltip, Typography } from "@firecms/ui";
import { getNewChatPath } from "../navigation";

export function DataTalkDrawer() {

    const {
        drawerHovered,
        drawerOpen,
        openDrawer,
        closeDrawer
    } = useApp();

    const navigation = useNavigationController();

    const { sessions, dashboards } = useDataTalk();
    return (

        <>

            <DrawerLogo/>

            <div className={"flex-grow overflow-scroll no-scrollbar my-8"}>

                <Tooltip title={"Start new chat"} side={"bottom"}>
                    <Link to={getNewChatPath()}>
                        <Button variant={"outlined"} className={"ml-4 mb-8 rounded-2xl"}>
                            <ForumIcon size="small"/>
                            {drawerOpen ? "New chat" : null}
                        </Button>
                    </Link>
                </Tooltip>

                {drawerOpen && sessions?.map((session, index) => {
                    const firstMessage = session.messages[0];
                    const charsLimit = 30;
                    const firstChars = firstMessage?.text.slice(0, charsLimit) ?? "DataTalk session started";
                    return (
                        <NavLink
                            key={index}
                            // onClick={onClick}
                            style={{
                                width: !drawerOpen ? "72px" : "280px",
                                transition: drawerOpen ? "width 150ms ease-in" : undefined
                            }}
                            className={({ isActive }: any) => cls("transition-opacity flex flex-col justify-between px-4 py-3",
                                !drawerOpen ? "opacity-0" : "opacity-1",
                                "rounded-r-lg truncate",
                                "hover:bg-slate-300 hover:bg-opacity-60 dark:hover:bg-gray-700 dark:hover:bg-opacity-60 text-gray-800 dark:text-gray-200 hover:text-gray-900 hover:dark:text-white",
                                "mr-8",
                                "font-medium text-sm",
                                isActive ? "bg-slate-200 bg-opacity-60 dark:bg-gray-800 dark:bg-opacity-30" : ""
                            )}
                            to={navigation.homeUrl + "chat/" + session.id}
                        >
                            <Typography variant={"label"}
                                        className={"whitespace-nowrap"}>{firstChars}{(firstMessage?.text ?? "").length > charsLimit ? "..." : ""}</Typography>
                            {/*<Typography variant={"caption"}*/}
                            {/*            color={"secondary"}*/}
                            {/*            className={"whitespace-nowrap"}>{session.created_at.toLocaleString()}</Typography>*/}
                        </NavLink>
                    );
                })}

                {drawerOpen}

            </div>
        </>
    );
}
