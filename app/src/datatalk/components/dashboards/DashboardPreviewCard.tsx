import React, { useTransition } from "react";
import { Dashboard } from "../../types";
import {
    AddIcon,
    ArrowForwardIcon,
    Card,
    cls,
    cn,
    DeleteIcon,
    IconButton,
    LineAxisIcon,
    Markdown,
    Menu,
    MenuItem,
    MoreVertIcon,
    Typography
} from "@firecms/ui";
import { useDataTalk } from "../../DataTalkProvider";

export type DashboardCardProps = {
    dashboard: Dashboard;
    onClick?: () => void,
};

export function DashboardPreviewCard({
                                         dashboard,
                                         onClick,
                                     }: DashboardCardProps) {

    const {
        title,
        description
    } = dashboard;

    const datatalk = useDataTalk();

    return (<Card
        className={cls("p-4 cursor-pointer h-[180px] w-[300px]")}
        onClick={() => {
            onClick?.();
        }}>

        <div className="flex flex-col items-start h-full">
            <div
                className="flex-grow w-full">

                <div
                    className="h-10 flex items-center w-full justify-between text-gray-300 dark:text-gray-600">

                    <LineAxisIcon/>

                    <div
                        className="flex items-center gap-1"
                        onClick={(event: React.MouseEvent) => {
                            event.preventDefault();
                            event.stopPropagation();
                        }}>

                        <Menu
                            trigger={<IconButton>
                                <MoreVertIcon size={"small"}/>
                            </IconButton>}
                        >
                            <MenuItem
                                dense={true}
                                onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                datatalk.deleteDashboard(dashboard.id);
                                // setDeleteRequested(true);
                            }}>
                                <DeleteIcon size={"small"}/>
                                Delete
                            </MenuItem>

                        </Menu>

                    </div>

                </div>

                <Typography gutterBottom variant="subtitle2">
                    {title ?? "Untitled dashboard"}
                </Typography>

                {description && <Typography variant="body2"
                                            color="secondary"
                                            component="div">
                    <Markdown source={description} size={"small"}/>
                </Typography>}
            </div>

            <div style={{ alignSelf: "flex-end" }}>

                <div className={"p-4"}>
                    <ArrowForwardIcon className="text-primary"/>
                </div>
            </div>

        </div>

    </Card>)
}

export function NewDashboardCard({
                                     onClick,
                                 }: {
    onClick: (id: string) => void
}) {

    const dataTalkConfig = useDataTalk();
    const [isPending, startTransition] = useTransition();

    return (
        <Card className={cls("p-4 min-h-[124px] flex items-center justify-center w-full flex-grow flex-col")}
              onClick={isPending ? undefined : () => {
                  startTransition(async () => {
                      const id = await dataTalkConfig.createDashboard();
                      onClick(id);
                  });
              }}>

            <AddIcon color={isPending ? undefined : "primary"} size={"large"}/>
            <Typography color="primary"
                        variant={"caption"}
                        className={"font-medium"}>{"Create a new dashboard".toUpperCase()}</Typography>


        </Card>
    );
}
