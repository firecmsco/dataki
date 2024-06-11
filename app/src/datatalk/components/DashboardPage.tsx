import React from "react";
import { useNavigate } from "react-router-dom";
import { PromptSuggestions } from "./chat/PromptSuggestions";
import { useDataTalk } from "../DataTalkProvider";
import { Typography } from "@firecms/ui";
import { DashboardsOverview } from "./home/DashboardsOverview";

export function HomePage() {
    const navigate = useNavigate();
    const dataTalkConfig = useDataTalk();

    return (
        <div className={"flex flex-col container mx-auto px-4 md:px-6  my-16 pt-8 flex-1"}>

            <Typography variant={"h3"} gutterBottom={true} className={"font-mono ml-4 my-2"}>
                Welcome to DATATALK
            </Typography>
            <PromptSuggestions onPromptSuggestionClick={async (prompt) => {
                const sessionId = await dataTalkConfig.createSessionId();
                navigate(`/chat/${sessionId}?prompt=${prompt}`, { replace: true });
            }}/>
            <DashboardsOverview/>
        </div>
    )
}
