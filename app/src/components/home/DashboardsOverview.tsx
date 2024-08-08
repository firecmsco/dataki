import React from "react";
import { CircularProgressCenter } from "@firecms/core";
import { useDataki } from "../../DatakiProvider";
import { AddIcon, Button, Typography } from "@firecms/ui";
import { DashboardPreviewCard } from "../dashboards/DashboardPreviewCard";
import { useNavigate } from "react-router-dom";
import { getDashboardPath } from "../../utils/navigation";

export function DashboardsOverview() {
    const datakiConfig = useDataki();
    const navigate = useNavigate();
    if (datakiConfig.loading) {
        return <CircularProgressCenter/>
    }

    return (
        <div className={"my-8"}>

            <div className={"flex flex-row"}>
                <Typography variant={"h6"} gutterBottom={true} className={"flex-grow font-mono my-2"}>
                    Dashboards
                </Typography>
                <Button variant={"outlined"}
                        onClick={async () => {
                            const dashboard = await datakiConfig.createDashboard();
                            navigate(getDashboardPath(dashboard.id));
                        }}>
                    <AddIcon/>
                    New dashboard
                </Button>
            </div>
            <div className={"flex flex-row flex-wrap font-mono container mx-auto min-h-48 flex-1 gap-2 my-4"}>
                {datakiConfig.dashboards.map((dashboard, index) => (
                    <DashboardPreviewCard
                        key={dashboard.id}
                        dashboard={dashboard}
                        onClick={() => {
                            console.log("Navigate to dashboard", dashboard.id);
                            navigate(getDashboardPath(dashboard.id));
                        }}/>
                ))}
                {datakiConfig.dashboards.length === 0 && (
                    <Typography variant={"body2"} className={"text-gray-500 self-center w-full text-center"} component={"div"}>
                        No dashboards yet
                    </Typography>
                )}
            </div>
        </div>
    );
}
