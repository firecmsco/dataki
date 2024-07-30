import React from "react";
import { Link, NavLink } from "react-router-dom";

import { DrawerLogo, useApp, useNavigationController } from "@firecms/core";
import { useDataki } from "../DatakiProvider";
import { Button, cls, ForumIcon, LineAxisIcon, Tooltip, Typography } from "@firecms/ui";
import { getNewChatPath } from "../navigation";
import Logo from "../dataki_logo.svg";

export function DatakiDrawer() {

    const {
        drawerHovered,
        drawerOpen,
        openDrawer,
        closeDrawer
    } = useApp();

    const navigation = useNavigationController();
    const [showAllSessions, setShowAllSessions] = React.useState(false);
    const [showAllDashboards, setShowAllDashboards] = React.useState(false);

    const {
        sessions,
        dashboards
    } = useDataki();

    const displayedSessions = showAllSessions ? sessions : sessions?.slice(0, 5);
    const displayedDashboards = showAllDashboards ? dashboards : dashboards?.slice(0, 5);

    const includeShowAllSessions = sessions?.length > 5;
    const includeShowAllDashboards = dashboards?.length > 5;

    return (

        <>

            <DrawerLogo logo={Logo}/>

            <div className={"flex-grow overflow-scroll no-scrollbar my-8"}>

                <Tooltip title={"Start new chat"} side={"bottom"}>
                    <Link to={getNewChatPath()}>
                        <Button variant={"outlined"} className={"ml-4 mb-8 rounded-2xl"}>
                            <ForumIcon size="small"/>
                            {drawerOpen ? "New chat" : null}
                        </Button>
                    </Link>
                </Tooltip>

                {drawerOpen && <>

                    {displayedSessions?.length > 0 && <>
                        <Typography variant={"label"}
                                    color={"secondary"}
                                    className={"ml-4 py-3 uppercase text-xs flex gap-2"}>
                            <ForumIcon size={"smallest"} color={"primary"}/>
                            Recent chats
                        </Typography>

                        {displayedSessions?.map((session, index) => {
                            const firstMessage = session.messages[0];
                            const charsLimit = 30;
                            const firstChars = firstMessage?.text.slice(0, charsLimit) ?? "Dataki session started";
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

                        {includeShowAllSessions &&
                            <Button className={"px-2 m-2 text-text-secondary dark:text-text-secondary-dark"}
                                    size={"small"}
                                    variant={"text"}
                                    onClick={() => {
                                        setShowAllSessions(!showAllSessions)
                                    }}>
                                {showAllSessions ? "Show less" : "Show more"}
                            </Button>}
                    </>}

                    {displayedDashboards?.length > 0 && <>

                        <Typography variant={"label"}
                                    color={"secondary"}
                                    className={"ml-4 mt-6 py-3 uppercase text-xs flex gap-2"}>
                            <LineAxisIcon size={"smallest"} color={"primary"}/>
                            Recent dashboards
                        </Typography>
                        {displayedDashboards?.map((dashboard, index) => {
                                return (
                                    <NavLink to={navigation.homeUrl + "dashboards/" + dashboard.id}
                                             key={index}
                                             className={({ isActive }: any) => cls("transition-opacity flex flex-col justify-between px-4 py-3",
                                                 !drawerOpen ? "opacity-0" : "opacity-1",
                                                 "rounded-r-lg truncate",
                                                 "hover:bg-slate-300 hover:bg-opacity-60 dark:hover:bg-gray-700 dark:hover:bg-opacity-60 text-gray-800 dark:text-gray-200 hover:text-gray-900 hover:dark:text-white",
                                                 "mr-8",
                                                 "font-medium text-sm",
                                                 isActive ? "bg-slate-200 bg-opacity-60 dark:bg-gray-800 dark:bg-opacity-30" : ""
                                             )}
                                    >
                                        <Typography variant={"label"}>{dashboard.title ?? "Untitled dashboard"}</Typography>
                                    </NavLink>
                                );
                            }
                        )}

                        {includeShowAllDashboards &&
                            <Button className={"px-2 m-2 text-text-secondary dark:text-text-secondary-dark"}
                                    size={"small"}
                                    variant={"text"}
                                    onClick={() => {
                                        setShowAllDashboards(!showAllDashboards)
                                    }}>
                                {showAllDashboards ? "Show less" : "Show more"}
                            </Button>}
                    </>}

                </>}

            </div>
        </>
    );
}
