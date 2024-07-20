import React from "react";
import { useNavigate } from "react-router-dom";
import { useDataTalk } from "../DataTalkProvider";
import { DashboardsOverview } from "./home/DashboardsOverview";
import { Button, ForumIcon, Separator, Typography } from "@firecms/ui";

export function HomePage() {
    const navigate = useNavigate();
    const dataTalkConfig = useDataTalk();

    return (
        <div className={"flex flex-col container mx-auto px-4 md:px-6  my-4 pt-8 flex-1"}>
            {/*<Typography variant={"h3"} gutterBottom={true} className={"font-mono ml-4 my-2"}>*/}
            {/*    Welcome to DATATALK*/}
            {/*</Typography>*/}
            <div className={"my-8 flex flex-col gap-4"}>
                <Typography variant={"h3"} gutterBottom={true} className={"font-mono ml-4 my-2"}>
                    Welcome to DATATALK
                </Typography>
                <Typography>
                    DataTalk is a conversational interface to your data.
                </Typography>
                <Typography>
                    You can ask questions, run commands and explore your data in a natural way.
                </Typography>
                <Button
                    size={"xl"}
                    className={"gap-4"}
                    onClick={async () => {
                        const sessionId = await dataTalkConfig.createSessionId();
                        navigate(`/chat/${sessionId}`);
                    }}>
                    <ForumIcon/>
                    Start new chat
                </Button>
            </div>

            <Separator orientation={"horizontal"}/>

            <DashboardsOverview/>

        </div>
    )
}
