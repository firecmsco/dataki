import { DryWidgetConfig } from "../../types";
import React, { useMemo } from "react";
import { Button, Container, DialogActions, Sheet, TextField, Typography } from "@firecms/ui";
import { AutoHeightEditor } from "../AutoHeightEditor";
import { useSnackbarController } from "@firecms/core";

export function ConfigViewDialog({
                                     dryConfig: dryConfigProp,
                                     open,
                                     setOpen,
                                     onUpdate: onUpdateProp
                                 }: {
    dryConfig: DryWidgetConfig
    open: boolean,
    setOpen: (open: boolean) => void,
    onUpdate?: (newConfig: DryWidgetConfig) => void
}) {

    const snackbar = useSnackbarController();

    const [title, setTitle] = React.useState<string>(dryConfigProp.title);
    const [description, setDescription] = React.useState<string>(dryConfigProp.description);
    const [projectId, setProjectId] = React.useState<string>(dryConfigProp.projectId);
    const [sqlCode, setSqlCode] = React.useState<string>(dryConfigProp.sql);
    const initialChartConfig: string = useMemo(() => {
        if (dryConfigProp.type === "chart")
            return JSON.stringify(dryConfigProp.chart, null, 2);
        else if (dryConfigProp.type === "table")
            return JSON.stringify(dryConfigProp.table, null, 2);
        else
            throw new Error("Unknown widget type");
    }, []);
    const [chartOrTableConfig, setChartOrTableConfig] = React.useState(initialChartConfig);

    const updateChartConfig = (value: string) => {
        setChartOrTableConfig(value);
    }

    const onUpdate = () => {
        try {

            let dryConfig = {
                ...dryConfigProp,
                title,
                description,
                sql: sqlCode,
            };

            if (dryConfig.type === "chart") {
                dryConfig = {
                    ...dryConfig,
                    chart: JSON.parse(chartOrTableConfig)
                }
            } else if (dryConfig.type === "table") {
                dryConfig = {
                    ...dryConfig,
                    table: JSON.parse(chartOrTableConfig)
                }
            }

            console.log("Updating config", dryConfig);
            onUpdateProp?.(dryConfig)
            setOpen(false);
        } catch (e) {
            snackbar.open({
                type: "error",
                message: "Error updating config"
            });
            console.error("Error updating config", e);
        }
    };

    const onTitleChange = (event: React.ChangeEvent<any>) => {
        setTitle(event.target.value);
    }

    const onDescriptionChange = (event: React.ChangeEvent<any>) => {
        setDescription(event.target.value);
    }
    const onProjectIdChange = (event: React.ChangeEvent<any>) => {
        setProjectId(event.target.value);
    }

    return <Sheet
        side={"bottom"}
        open={open}
        onOpenChange={setOpen}
    >
        <form
            onSubmit={(e) => {
                e.preventDefault();
                onUpdate();
            }}
            className={"max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-950"}>

            <Container
                className="p-8 flex flex-col space-y-4 h-full"
                maxWidth={"7xl"}>
                <TextField value={title}
                           onChange={onTitleChange}
                           className={"text-lg font-semibold"}
                           placeholder={"Title of the widget"}/>

                <div className={"flex flex-row gap-2"}>

                    <TextField value={projectId}
                               size={"small"}
                               className={"lg:min-w-80"}
                               label={"Project ID"}
                               onChange={onProjectIdChange}
                               placeholder={"Project ID"}/>
                    <TextField value={description}
                               className={"flex-grow"}
                               size={"small"}
                               label={"Description"}
                               onChange={onDescriptionChange}
                               placeholder={"Description"}/>
                </div>

                <div className={"h-full flex-grow flex flex-col w-full gap-4"}>

                    <div className={"flex flex-col flex-grow mt-4"}>
                        <Typography gutterBottom variant={"label"}>
                            SQL code
                        </Typography>
                        {sqlCode && <AutoHeightEditor value={sqlCode ?? ""}
                                                      defaultLanguage={"sql"}
                                                      onChange={(updatedSQL) => {
                                                          setSqlCode(updatedSQL ?? "");
                                                      }}/>}
                    </div>
                    <div className={"flex flex-col flex-grow mt-4"}>
                        <Typography gutterBottom variant={"label"}>
                            {dryConfigProp.type === "chart" ? "Chart config" : "Table config"}
                        </Typography>
                        <AutoHeightEditor value={chartOrTableConfig ?? ""}
                                          defaultLanguage={"json"}
                                          onChange={(value) => {
                                              updateChartConfig(value ?? "");
                                          }}/>
                    </div>

                </div>
            </Container>
            <DialogActions>
                <Button type={"submit"}
                        variant={"outlined"}>
                    Update
                </Button>
            </DialogActions>
        </form>
    </Sheet>
}
