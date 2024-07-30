import React from "react";
import { useNavigate } from "react-router-dom";
import { useDataki } from "../DatakiProvider";
import { DashboardsOverview } from "./home/DashboardsOverview";
import { Alert, Button, ForumIcon, Typography } from "@firecms/ui";
import { resetAllTooltips } from "../hooks/useOnboardingTooltip";
import { OnboardingTooltip } from "./OnboardingTooltip";

export function HomePage() {
    const navigate = useNavigate();
    const datakiConfig = useDataki();

    return (
        <div className={"flex flex-col container mx-auto px-4 md:px-6  my-4 pt-8 flex-1"}>
            {/*<Typography variant={"h3"} gutterBottom={true} className={"font-mono ml-4 my-2"}>*/}
            {/*    Welcome to DATATALK*/}
            {/*</Typography>*/}
            <div className={"my-8 flex flex-col gap-4"}>
                <Button onClick={resetAllTooltips} variant={"text"}>
                    Reset onboarding
                </Button>
                <Typography variant={"h3"} gutterBottom={true} className={"font-mono my-2"}>
                    Welcome to DATAKI
                </Typography>
                <Typography>
                    Dataki is a conversational interface to your data.
                </Typography>
                <Typography>
                    You can ask questions and <b>explore your data</b> in a natural way.
                    Then you can <b>save your charts and tables</b> in dashboards to share them with your team.
                </Typography>

                <Alert>
                    You can use demo data from the <code>bigquery-public-data.thelook_ecommerce</code> dataset, or use your
                    own
                </Alert>
                <OnboardingTooltip id={"home_chat"}
                                   className={"w-fit"}
                                   side={"right"}
                                   title={"Start generating your views here!"}>
                    <Button
                        size={"xl"}
                        className={"my-4 gap-4"}
                        onClick={async () => {
                            const sessionId = await datakiConfig.createSessionId();
                            navigate(`/chat/${sessionId}`);
                        }}>
                        <ForumIcon/>
                        Start new chat
                    </Button>
                </OnboardingTooltip>
            </div>

            {/*<Separator orientation={"horizontal"}/>*/}

            <DashboardsOverview/>

        </div>
    )
}
