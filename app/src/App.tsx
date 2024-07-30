import React from "react";

import "typeface-rubik";
import "@fontsource/jetbrains-mono";
import {
    AppBar,
    CircularProgressCenter,
    Drawer,
    FireCMS,
    ModeControllerProvider,
    Scaffold,
    SideDialogs,
    SnackbarProvider,
    useBuildLocalConfigurationPersistence,
    useBuildModeController,
    useBuildNavigationController,
    useValidateAuthenticator
} from "@firecms/core";
import { useFirebaseStorageSource, useFirestoreDelegate, useInitialiseFirebase } from "@firecms/firebase";

import { firebaseConfig } from "./firebase_config";
import { useImportExportPlugin } from "@firecms/data_import_export";
import { Typography } from "@firecms/ui";
import { DatakiDrawer, DatakiProvider, DatakiRoutes, useBuildDatakiConfig } from "./datatalk";
import { useDatakiAuthController } from "./datatalk/useDatakiAuthController";
import { DatakiLogin } from "./datatalk/DatakiLogin";
import Logo from "./datatalk/dataki_logo.svg";

const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT;
if (!API_ENDPOINT) {
    throw new Error("API_ENDPOINT not defined in .env");
}

export function App() {
    "use memo";
    const {
        firebaseApp,
        firebaseConfigLoading,
        configError
    } = useInitialiseFirebase({
        firebaseConfig
    });
    /**
     * Controller used to manage the dark or light color mode
     */
    const modeController = useBuildModeController();

    /**
     * Controller for managing authentication
     */
    const authController = useDatakiAuthController({
        firebaseApp,
        apiEndpoint: API_ENDPOINT,
    });

    /**
     * Controller for saving some user preferences locally.
     */
    const userConfigPersistence = useBuildLocalConfigurationPersistence();

    /**
     * Delegate used for fetching and saving data in Firestore
     */
    const firestoreDelegate = useFirestoreDelegate({
        firebaseApp
    })

    /**
     * Controller used for saving and fetching files in storage
     */
    const storageSource = useFirebaseStorageSource({
        firebaseApp
    });

    /**
     * Use the authenticator to control access to the main view
     */
    const {
        authLoading,
        canAccessMainView,
        notAllowedError
    } = useValidateAuthenticator({
        authController,
        authenticator: ({ user }) => {
            return true;
        },
        dataSourceDelegate: firestoreDelegate,
        storageSource
    });

    const navigationController = useBuildNavigationController({
        collections: () => [], // no collections
        authController,
        dataSourceDelegate: firestoreDelegate
    });

    const datakiConfig = useBuildDatakiConfig({
        enabled: authController.user !== null,
        firebaseApp,
        userSessionsPath: `/users/${authController.user?.uid}/datatalk_sessions`,
        dashboardsPath: `/dashboards`,
        getAuthToken: authController.getAuthToken,
        apiEndpoint: API_ENDPOINT,
        user: authController.user
    });

    /**
     * Allow import and export data plugin
     */
    const importExportPlugin = useImportExportPlugin();

    if (firebaseConfigLoading || !firebaseApp) {
        return <CircularProgressCenter/>;
    }

    if (configError) {
        return <>{configError}</>;
    }

    return (
        <SnackbarProvider>
            <ModeControllerProvider value={modeController}>
                <DatakiProvider
                    config={datakiConfig}>
                    <FireCMS
                        navigationController={navigationController}
                        authController={authController}
                        userConfigPersistence={userConfigPersistence}
                        dataSourceDelegate={firestoreDelegate}
                        storageSource={storageSource}
                        plugins={[importExportPlugin]}
                    >
                        {({
                              context,
                              loading
                          }) => {

                            let component;

                            if (loading || authLoading) {
                                component = <CircularProgressCenter size={"large"}/>;
                            } else {
                                if (!canAccessMainView) {
                                    component = (
                                        <DatakiLogin authController={authController}
                                                     datakiConfig={datakiConfig}/>
                                    );
                                } else {
                                    component = (
                                        <Scaffold>
                                            <AppBar logo={Logo}
                                                    title={<Typography variant="subtitle1"
                                                                       className={"ml-2 !font-sm uppercase font-mono"}>
                                                        DATAKI
                                                    </Typography>}/>
                                            <Drawer>
                                                <DatakiDrawer/>
                                            </Drawer>
                                            <DatakiRoutes
                                                onAnalyticsEvent={(event, params) => {
                                                    console.log("DataTalk event", event, params);
                                                }}/>
                                            {/*<NavigationRoutes*/}
                                            {/*    homePage={<DataTalk apiEndpoint={API_ENDPOINT}*/}
                                            {/*                        getAuthToken={authController.getAuthToken}/>}/>*/}
                                            <SideDialogs/>
                                        </Scaffold>
                                    );
                                }
                            }
                            return component;
                        }}
                    </FireCMS>
                </DatakiProvider>
            </ModeControllerProvider>
        </SnackbarProvider>
    );
}
