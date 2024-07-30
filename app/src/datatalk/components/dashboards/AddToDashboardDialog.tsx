import { CloseIcon, Dialog, DialogContent, IconButton, Typography } from "@firecms/ui";
import React from "react";
import { useDataTalk } from "../../DataTalkProvider";
import { DashboardPreviewCard, NewDashboardCard } from "./DashboardPreviewCard";
import { useNavigate } from "react-router-dom";
import { getDashboardPath } from "../../navigation";
import { DryWidgetConfig } from "../../types";

export function AddToDashboardDialog({
                                         open,
                                         setOpen,
                                         widgetConfig
                                     }: {
    open: boolean;
    setOpen: (open: boolean) => void;
    widgetConfig: DryWidgetConfig;
}) {

    const navigate = useNavigate();
    const dataTalkConfig = useDataTalk();

    return <Dialog
        maxWidth={"3xl"}
        open={open}
        onOpenChange={setOpen}
        onOpenAutoFocus={(e) => {
            e.preventDefault();
        }}>
        <DialogContent className={"flex flex-col gap-4"}>
            <Typography variant={"label"}>Select a dashboard to add this widget to</Typography>

            <NewDashboardCard
                onClick={(dashboard) => {
                    const dashboardWidget = dataTalkConfig.addDashboardWidget(dashboard.id, widgetConfig);
                    navigate(getDashboardPath(dashboard.id), {
                        state: {
                            initialViewPosition: dashboardWidget.position
                        }
                    });
                    setOpen(false);
                }}/>

            <div className={"flex flex-row gap-2 flex-wrap"}>
                {dataTalkConfig.dashboards.map((dashboard, index) => (
                    <DashboardPreviewCard
                        key={index}
                        dashboard={dashboard}
                        onClick={() => {
                            const dashboardWidget = dataTalkConfig.addDashboardWidget(dashboard.id, widgetConfig);
                            navigate(getDashboardPath(dashboard.id), {
                                state: {
                                    initialViewPosition: dashboardWidget.position
                                }
                            });
                            setOpen(false);
                        }}/>
                ))}
            </div>
        </DialogContent>
        {/*<DialogActions>*/}
        {/*    <Button variant={"text"}*/}
        {/*            onClick={() => {*/}
        {/*                setOpen(false);*/}
        {/*            }}>Cancel</Button>*/}
        {/*</DialogActions>*/}

        <IconButton className={"absolute top-4 right-4"}
                    onClick={() => setOpen(false)}>
            <CloseIcon/>
        </IconButton>
    </Dialog>;
}
