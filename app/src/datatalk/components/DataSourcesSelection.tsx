import {
    AddIcon,
    Alert,
    Button,
    CachedIcon,
    CheckIcon,
    CircularProgress,
    CloseIcon,
    cls,
    Dialog,
    DialogActions,
    DialogContent,
    IconButton,
    InfoIcon,
    Label,
    LinkIcon,
    LinkOffIcon,
    LoadingButton,
    Select,
    SelectItem,
    Separator,
    StorageIcon,
    TextField,
    Tooltip,
    Typography
} from "@firecms/ui";
import { DataSource, GCPProject } from "../types";
import React, { useEffect } from "react";
import { useDataki } from "../DatakiProvider";
import {
    createServiceAccountLink,
    deleteServiceAccountLink,
    fetchDataSourcesForProject,
    fetchGCPProjects
} from "../api";
import { useSnackbarController } from "@firecms/core";
import { OnboardingTooltip } from "./OnboardingTooltip";

const PREVIEW_DATASOURCES_COUNT = 3;

export type DataSourceSelectionProps = {
    projectId?: string;
    setProjectId: (projectId: string) => void;
    projectDisabled?: boolean;
    dataSources: DataSource[];
    setDataSources: (dataSources: DataSource[]) => void;
    className?: string;
}

function renderSelectProject(project: GCPProject) {
    return <div className={"flex flex-row w-full text-start"}>
        <div className={"flex flex-col flex-grow"}>
            <div className={"flex flex-row items-center"}>
                <p className={"font-semibold"}>{project.name}</p>
                {project.linked
                    ? <Tooltip title={"This project is linked to Dataki"}
                               side={"right"}>
                        <LinkIcon className={"ml-2"} size={"smallest"} color={"primary"}/>
                    </Tooltip>
                    : null}
            </div>
            <Typography variant={"caption"} color={"secondary"}>
                {project.projectId}
            </Typography>
        </div>
    </div>;
}

export function DataSourcesSelection({
                                         projectId,
                                         setProjectId,
                                         projectDisabled,
                                         dataSources,
                                         setDataSources,
                                         className
                                     }: DataSourceSelectionProps) {

    const snackbar = useSnackbarController()

    const [dataSourcesInternal, setDataSourcesInternal] = React.useState<DataSource[]>(dataSources);
    useEffect(() => {
        setDataSourcesInternal(dataSources);
    }, [dataSources]);

    const [dialogOpen, setDialogOpen] = React.useState(false);
    const datakiConfig = useDataki();
    const [projects, setProjects] = React.useState<GCPProject[]>([]);
    const [loadingProjects, setLoadingProjects] = React.useState(false);
    const [projectError, setProjectError] = React.useState<string | undefined>(undefined);

    async function loadProjects() {
        const accessToken = await datakiConfig.getAuthToken();
        setLoadingProjects(true);
        setProjectError(undefined);
        fetchGCPProjects(accessToken, datakiConfig.apiEndpoint)
            .then((result) => {
                const sortedLinked = result.sort((a, b) => {
                    if (a.linked && !b.linked) {
                        return -1;
                    }
                    if (!a.linked && b.linked) {
                        return 1;
                    }
                    // sort by name
                    return a.name.localeCompare(b.name);
                });
                setProjects(sortedLinked);
            })
            .catch(setProjectError)
            .finally(() => setLoadingProjects(false));
    }

    const [projectDataSources, setProjectDataSources] = React.useState<DataSource[]>([]);
    const [loadingDataSources, setLoadingDataSources] = React.useState(false);
    const [projectDataSourcesError, setProjectDataSourcesError] = React.useState<string | undefined>(undefined);

    const selectedProject = projects.find((p) => p.projectId === projectId);

    useEffect(() => {
        loadProjects();
        if (projectId) {
            loadDataSourcesFor(projectId);
        }
    }, [])

    async function loadDataSourcesFor(projectId: string) {
        const accessToken = await datakiConfig.getAuthToken();
        setLoadingDataSources(true);
        setProjectDataSources([]);
        setProjectDataSourcesError(undefined);
        return fetchDataSourcesForProject(accessToken, datakiConfig.apiEndpoint, projectId)
            .then(setProjectDataSources)
            .catch(setProjectDataSourcesError)
            .finally(() => setLoadingDataSources(false));
    }

    const [newDataSource, setNewDataSource] = React.useState<{ projectId: string, datasetId: string }>({
        projectId: "",
        datasetId: ""
    });

    const [unlinkLoading, setUnlinkLoading] = React.useState(false);

    async function unlinkProject(projectId: string) {
        const token = await datakiConfig.getAuthToken();
        setUnlinkLoading(true);
        deleteServiceAccountLink(token, datakiConfig.apiEndpoint, projectId)
            .then(res => {
                if (res) {
                    snackbar.open({
                        message: "Project unlinked successfully",
                        type: "success"
                    });
                    setProjects((prev) => {
                        const newProjects = [...prev];
                        const projectIndex = newProjects.findIndex((p) => p.projectId === projectId);
                        if (projectIndex === -1) {
                            return newProjects;
                        }
                        newProjects[projectIndex] = {
                            ...newProjects[projectIndex],
                            linked: false
                        };
                        return newProjects;
                    });
                }
            })
            .finally(() => setUnlinkLoading(false));
    }

    return (
        <OnboardingTooltip
            id={"data_sources_selection"}
            className={"shrink-0"}
            title={"Select the data you would like to query, or use the demo data"}
            side={"right"}>
            <Label
                onClick={() => {
                    setDialogOpen(true);
                }}
                className={cls("bg-white dark:bg-gray-800 flex-wrap w-fit font-normal border cursor-pointer rounded-md p-2 px-3 flex items-center gap-2 [&:has(:checked)]:bg-gray-100 dark:[&:has(:checked)]:bg-gray-800", className)}
            >

                <StorageIcon size={"small"} color={"primary"}/>

                <span className={"font-semibold"}>{!dataSources.length && "Select data source"}</span>

                {dataSources.length > 0 && dataSources.slice(0, PREVIEW_DATASOURCES_COUNT).map((dataSource, index) => (
                    <div key={dataSource.datasetId} className={"inline-block"}>
                        <span>{dataSource.projectId + "."}</span>
                        <span className={"font-semibold"}>{dataSource.datasetId}</span>
                        {index < dataSources.length - 1 && ", "}
                    </div>
                ))}

                {dataSources.length > PREVIEW_DATASOURCES_COUNT && (
                    <Typography
                        variant={"caption"}>and {dataSources.length - PREVIEW_DATASOURCES_COUNT} more</Typography>
                )}

            </Label>

            <Dialog maxWidth={"6xl"}
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    onOpenAutoFocus={(e) => {
                        e.preventDefault();
                    }}>
                <DialogContent className={"flex flex-col lg:flex-row gap-12 my-8 mx-6"}>
                    <div className={"flex flex-col gap-4 flex-grow lg:w-1/2"}>


                        <Typography variant={"subtitle2"}>
                            Your datasets
                        </Typography>
                        <Typography variant={"body2"}>
                            Select your BigQuery data sources from your Google Cloud Platform projects
                        </Typography>

                        {(projectDataSources ?? []).length === 0 && !loadingProjects && (
                            <EmptyValue/>
                        )}
                        {projectError && (
                            <Typography variant={"caption"} color={"error"}>
                                {projectError}
                            </Typography>
                        )}

                        {selectedProject?.linked && (
                            <>
                                <Typography variant={"label"} component="div"
                                            className={"flex flex-row items-center gap-2"}>
                                    Data sources in project
                                    <IconButton
                                        size={"smallest"}
                                        onClick={() => loadDataSourcesFor(selectedProject.projectId)}>
                                        <CachedIcon size={"smallest"}/>
                                    </IconButton>
                                    <IconButton
                                        size={"smallest"}
                                        disabled={unlinkLoading}
                                        onClick={() => unlinkProject(selectedProject.projectId)}>
                                        <LinkOffIcon size={"smallest"}/>
                                    </IconButton>
                                </Typography>
                                {loadingDataSources && (
                                    <CircularProgress size={"small"}/>
                                )}
                                {!loadingDataSources && projectDataSources?.length > 0 &&
                                    <div className={"flex flex-col gap-2"}>
                                        {projectDataSources.map((dataSource, index) => (
                                            <Label
                                                key={dataSource.datasetId}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    const newSources = [...dataSourcesInternal];
                                                    const exists = newSources.find(ds => ds.projectId === dataSource.projectId && ds.datasetId === dataSource.datasetId);
                                                    if (exists) {
                                                        newSources.splice(newSources.indexOf(exists), 1);
                                                    } else {
                                                        newSources.push({
                                                            projectId: dataSource.projectId,
                                                            datasetId: dataSource.datasetId
                                                        });
                                                    }
                                                    setDataSourcesInternal(newSources);
                                                }}
                                                className="w-full border cursor-pointer rounded-md p-1 px-3 flex items-center gap-2 [&:has(:checked)]:bg-gray-100 dark:[&:has(:checked)]:bg-gray-800 font-normal"
                                            >
                                                {dataSourcesInternal.find(ds => ds.projectId === dataSource.projectId && ds.datasetId === dataSource.datasetId)
                                                    ? <CheckIcon size={"small"}/>
                                                    : <AddIcon size={"small"}/>}
                                                <div className={"inline-block"}>
                                                    <span>{dataSource.projectId + "."}</span>
                                                    <span className={"font-semibold"}>{dataSource.datasetId}</span>
                                                </div>
                                            </Label>

                                        ))}
                                    </div>
                                }

                                {!loadingDataSources && projectDataSources.length === 0 &&
                                    <Typography color={"secondary"}>
                                        No data sources available for this project
                                    </Typography>}
                            </>
                        )}

                        <Separator orientation={"horizontal"}/>

                        <Typography variant={"body2"}>
                            or add a datasource by specifying the project and dataset id
                        </Typography>

                        {<form className={"flex gap-2 items-center"}
                               noValidate={true}
                               onSubmit={(e) => {
                                   e.preventDefault();
                               }}
                        >
                            <TextField
                                size={"small"}
                                label={"Project ID"}
                                value={newDataSource.projectId}
                                onChange={(e) => setNewDataSource({
                                    ...newDataSource,
                                    projectId: e.target.value
                                })}

                            />
                            <TextField
                                label={"Dataset ID"}
                                className={"flex-grow"}
                                size={"small"}
                                value={newDataSource.datasetId}
                                onChange={(e) => setNewDataSource({
                                    ...newDataSource,
                                    datasetId: e.target.value
                                })}

                            />
                            <IconButton
                                type={"submit"}
                                onClick={() => {
                                    console.log("newDataSource", newDataSource);
                                    if (!newDataSource.projectId || !newDataSource.datasetId) {
                                        return;
                                    }
                                    setDataSourcesInternal([...dataSourcesInternal, newDataSource]);
                                    setNewDataSource({
                                        projectId: "",
                                        datasetId: ""
                                    });
                                }}>
                                <AddIcon/>
                            </IconButton>
                        </form>}

                        <Button variant={"text"}
                                size={"small"}
                                onClick={() => {
                                    setProjectId("bigquery-public-data");
                                    setDataSourcesInternal([{
                                        projectId: "bigquery-public-data",
                                        datasetId: "thelook_ecommerce"
                                    }]);
                                }}>
                            Use demo e-commerce data source
                        </Button>

                    </div>

                    <div className={"flex flex-col gap-4 flex-grow lg:w-1/2"}>
                        <Typography variant={"subtitle2"}>
                            Session project
                        </Typography>
                        <Typography variant={"caption"}>
                            All BigQuery queries will be executed in the selected project
                        </Typography>
                        <OnboardingTooltip id={"project_select"} title={"Select your GCP project"} side={"left"}>
                            <Select placeholder={"Select a project"}
                                    value={projectId ?? ""}
                                    disabled={projectDisabled}
                                    renderValue={(value) => {
                                        if (!value) {
                                            return "Select a project";
                                        }
                                        const project = projects.find((p) => p.projectId === value);
                                        return project ? renderSelectProject(project) : value;
                                    }}
                                    onValueChange={(value) => {
                                        setProjectId(value);
                                        loadDataSourcesFor(value);
                                    }}>
                                {projects.map((project) => (
                                    <SelectItem key={project.projectId} value={project.projectId}>
                                        {renderSelectProject(project)}
                                    </SelectItem>
                                ))}
                            </Select>
                        </OnboardingTooltip>

                        {selectedProject && !selectedProject.linked && (
                            <>

                                <Typography variant={"caption"}>
                                    You need to link your project to Dataki before using it.
                                    A service account named Dataki will be created in your project
                                </Typography>
                                <LinkProjectButton projectId={selectedProject.projectId}
                                                   onSuccess={() => {
                                                       loadDataSourcesFor(selectedProject.projectId);
                                                       setProjects((prev) => {
                                                           const newProjects = [...prev];
                                                           const projectIndex = newProjects.findIndex((p) => p.projectId === selectedProject.projectId);
                                                           if (projectIndex === -1) {
                                                               return newProjects;
                                                           }
                                                           newProjects[projectIndex] = {
                                                               ...newProjects[projectIndex],
                                                               linked: true
                                                           };
                                                           return newProjects;
                                                       });
                                                   }}/>
                            </>
                        )}

                        <Separator orientation={"horizontal"}/>

                        <Typography variant={"subtitle2"}>
                            Session data sources
                        </Typography>

                        <Typography>
                            The data sets will be used to query data from BigQuery. You can select
                            multiple datasets.
                        </Typography>

                        <div className={"flex flex-col gap-2"}>
                            {dataSourcesInternal.map((dataSource, index) => (
                                <Label
                                    key={dataSource.datasetId}
                                    className="w-full border cursor-pointer rounded-md p-2 px-3 flex items-center gap-2 [&:has(:checked)]:bg-gray-100 dark:[&:has(:checked)]:bg-gray-800 font-normal"
                                >
                                    <StorageIcon size={"small"} color={"primary"}/>
                                    <div className={"inline-block flex-grow"}>
                                        <span>{dataSource.projectId + "."}</span>
                                        <span className={"font-semibold"}>{dataSource.datasetId}</span>
                                    </div>
                                    <IconButton
                                        size={"small"}
                                        onClick={() => {
                                            const newSources = [...dataSourcesInternal];
                                            newSources.splice(index, 1);
                                            setDataSourcesInternal(newSources);
                                        }}>
                                        <CloseIcon/>
                                    </IconButton>
                                </Label>
                            ))}
                            {dataSourcesInternal.length === 0 && (
                                <Typography color={"secondary"} className={"flex flex-row gap-2 items-center m-3"}>
                                    <InfoIcon size={"small"}/> No data sources selected
                                </Typography>
                            )}
                        </div>
                    </div>


                </DialogContent>
                <DialogActions>
                    <div className={"flex-grow"}></div>
                    <Button
                        variant={"text"}
                        onClick={() => {
                            setDialogOpen(false);
                        }}>
                        Close
                    </Button>
                    <Button
                        variant={"outlined"}
                        disabled={dataSourcesInternal.length === 0}
                        onClick={() => {
                            setDataSources(dataSourcesInternal);
                            setDialogOpen(false);
                        }}>
                        Done
                    </Button>
                </DialogActions>
            </Dialog>
        </OnboardingTooltip>
    )
        ;
}

function LinkProjectButton({
                               projectId,
                               onSuccess
                           }: {
    projectId: string,
    onSuccess: () => void
}) {
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<any | undefined>(undefined);
    const datakiConfig = useDataki();

    async function linkProject() {
        const token = await datakiConfig.getAuthToken();
        setLoading(true);
        setError(undefined);
        createServiceAccountLink(token, datakiConfig.apiEndpoint, projectId)
            .then(res => {
                if (res) {
                    onSuccess();
                }
            })
            .catch(setError)
            .finally(() => setLoading(false));
    }

    return (<>
            <Alert color="base" className={"text-xs"}>It takes around 2 minutes after linking a project to be able to
                make BiqQuery queries</Alert>

            <LoadingButton loading={loading}
                           variant={"outlined"}
                           fullWidth={true}
                           onClick={linkProject}>
                {!loading && <LinkIcon/>}
                Link project to Dataki
            </LoadingButton>
        </>
    );
}

function EmptyValue() {
    return <div
        className="rounded-full bg-gray-200 bg-opacity-30 dark:bg-opacity-20 w-5 h-2 inline-block"/>;
}
