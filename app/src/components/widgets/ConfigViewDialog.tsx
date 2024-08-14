import { DateParams, DryWidgetConfig } from "../../types";
import JSON5 from "json5";

import React, { useMemo, useState } from "react";
import {
    Button,
    Container,
    DialogActions,
    DragHandleIcon,
    IconButton,
    OpenInFullIcon,
    Sheet,
    TextField,
    Typography
} from "@firecms/ui";
import { CodeEditor } from "../CodeEditor";
import { ErrorView, useSnackbarController } from "@firecms/core";
import { SQLQueryView } from "../SQLQueryView";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useConfirmationDialog } from "../../hooks/useConfirmationDialog";
import { useCreateFormex } from "@firecms/formex";

export function ConfigViewDialog({
                                     dryConfig: dryConfigProp,
                                     open,
                                     setOpen,
                                     params,
                                     onUpdate: onUpdateProp
                                 }: {
    dryConfig: DryWidgetConfig
    open: boolean,
    setOpen: (open: boolean) => void,
    params: DateParams,
    onUpdate?: (newConfig: DryWidgetConfig) => void
}) {

    const snackbar = useSnackbarController();

    const formex = useCreateFormex({
        initialValues: dryConfigProp
    });

    const [configError, setConfigError] = React.useState<Error | null>(null);

    const [editorOpen, setEditorOpen] = useState(false);
    const [editorDirty, setEditorDirty] = useState(false);

    const sqlDialogEditorConfirmationDialog = useConfirmationDialog({
        confirmMessage: "Are you sure you want to close the editor? You have unsaved changes.",
        onAccept: () => {
            setEditorOpen(false);
            setEditorDirty(false);
        }
    });

    const onChangeEditorOpen = (open: boolean) => {

        if (editorDirty) {
            sqlDialogEditorConfirmationDialog.open();
        } else {
            setEditorOpen(false);
            setEditorDirty(false);
        }
    }

    const initialChartConfig: string = useMemo(() => {
        if (dryConfigProp.type === "chart")
            return JSON.stringify(dryConfigProp.chart, null, 2);
        else if (dryConfigProp.type === "table")
            return JSON.stringify(dryConfigProp.table, null, 2);
        else
            throw new Error("Unknown widget type: " + dryConfigProp.type);
    }, []);
    const [chartOrTableConfig, setChartOrTableConfig] = React.useState(initialChartConfig);

    const updateChartConfig = (value: string) => {
        setChartOrTableConfig(value);
    }

    const onUpdate = () => {
        try {

            let dryConfig = {
                ...dryConfigProp,
                ...formex.values
            };

            let parsedConfig: any;
            try {
                parsedConfig = JSON5.parse(chartOrTableConfig);
            } catch (e: any) {
                setConfigError(e);
                snackbar.open({
                    type: "error",
                    message: "Error parsing JSON"
                });
                return;
            }

            setConfigError(null);

            if (dryConfig.type === "chart") {
                dryConfig = {
                    ...dryConfig,
                    chart: parsedConfig
                }
            } else if (dryConfig.type === "table") {
                dryConfig = {
                    ...dryConfig,
                    table: parsedConfig
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
        formex.setFieldValue("title", event.target.value);
    }

    const onDescriptionChange = (event: React.ChangeEvent<any>) => {
        formex.setFieldValue("description", event.target.value);
    }
    const onProjectIdChange = (event: React.ChangeEvent<any>) => {
        formex.setFieldValue("projectId", event.target.value);
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
                <TextField value={formex.values.title}
                           onChange={onTitleChange}
                           className={"text-lg font-semibold"}
                           placeholder={"Title of the widget"}/>

                <div className={"flex flex-row gap-2"}>

                    <TextField value={formex.values.projectId}
                               size={"small"}
                               className={"lg:min-w-80"}
                               label={"Project ID"}
                               onChange={onProjectIdChange}
                               placeholder={"Project ID"}/>
                    <TextField value={formex.values.description}
                               className={"flex-grow"}
                               size={"small"}
                               label={"Description"}
                               onChange={onDescriptionChange}
                               placeholder={"Description"}/>
                </div>

                <PanelGroup direction="horizontal" className={"flex-grow"}>
                    <Panel maxSize={75}>
                        <div className={"flex flex-col flex-grow mt-4"}>
                            <div className={"flex flex-row gap-4 mb-2 items-center"}>
                                <Typography className={"flex-grow "} variant={"label"}>
                                    SQL
                                </Typography>
                                <IconButton onClick={() => setEditorOpen(true)} size={"small"}>
                                    <OpenInFullIcon size={"smallest"}/>
                                </IconButton>
                            </div>
                            {formex.values.sql && <CodeEditor value={formex.values.sql ?? ""}
                                                              autoHeight={true}
                                                              defaultLanguage={"sql"}
                                                              onChange={(updatedSQL) => {
                                                                  formex.setFieldValue("sql", updatedSQL);
                                                              }}/>}
                        </div>
                    </Panel>
                    <PanelResizeHandle className={"w-8 flex justify-center items-center"}>
                        <DragHandleIcon size="small" color={"disabled"} className={"rotate-90"}/>
                    </PanelResizeHandle>
                    <Panel maxSize={75}>
                        <div className={"flex flex-col flex-grow mt-6"}>
                            <Typography gutterBottom variant={"label"}>
                                {dryConfigProp.type === "chart" ? "Chart config" : "Table config"}
                            </Typography>
                            <CodeEditor value={chartOrTableConfig ?? ""}
                                        autoHeight={true}
                                        defaultLanguage={"json"}
                                        onChange={(value) => {
                                            updateChartConfig(value ?? "");
                                        }}/>
                            {configError && <ErrorView error={configError}/>}
                        </div>
                    </Panel>
                </PanelGroup>
            </Container>
            <DialogActions>
                <Button type={"submit"}
                        disabled={formex.isSubmitting || !formex.dirty}
                        variant={"outlined"}>
                    Update
                </Button>
            </DialogActions>
        </form>
        <Sheet
            open={editorOpen}
            onOpenChange={onChangeEditorOpen}
            side={"bottom"}>
            <div className={"h-[90vh]"}>
                {editorOpen && <SQLQueryView
                    initialSql={formex.values.sql}
                    params={params}
                    dataSources={dryConfigProp.dataSources}
                    onDirtyChange={setEditorDirty}
                    onSaved={async (sql) => {
                        formex.setFieldValue("sql", sql ?? "");
                    }}
                />}
            </div>

        </Sheet>

        {sqlDialogEditorConfirmationDialog.ConfirmationDialog}

    </Sheet>;
}
