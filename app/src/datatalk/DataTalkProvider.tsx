import React, { useCallback, useContext, useEffect, useState } from "react";
import {
    collection,
    doc,
    getFirestore,
    limit,
    onSnapshot,
    orderBy,
    query,
    setDoc,
    Timestamp,
    where
} from "@firebase/firestore";
import { FirebaseApp } from "@firebase/app";
import { Dashboard, DashboardPage, DashboardWidgetConfig, Position, Session, WidgetConfig, WidgetSize } from "./types";
import { getDataTalkSamplePrompts } from "./api";
import { DEFAULT_WIDGET_SIZE } from "./utils/widgets";
import { randomString } from "@firecms/core";
import equal from "react-fast-compare"

export type DataTalkConfig = {
    loading: boolean;
    apiEndpoint: string;
    getAuthToken: () => Promise<string>;
    sessions: Session[];
    createSessionId: () => Promise<string>;
    saveSession: (session: Session) => Promise<void>;
    getSession: (sessionId: string) => Promise<Session | undefined>;
    rootPromptsSuggestions?: string[];
    dashboards: Dashboard[];
    createDashboard: () => Promise<string>;
    saveDashboard: (dashboard: Dashboard) => Promise<void>;
    updateDashboard: (id: string, dashboardData: Partial<Dashboard>) => Promise<void>;
    deleteDashboard: (id: string) => Promise<void>;
    listenDashboard: (dashboardId: string, onDashboardUpdate: (dashboard: Dashboard) => void) => () => void;
    addDashboardWidget(dashboardId: string, widgetConfig: WidgetConfig): void;
    onWidgetResize: (dashboardId: string, pageId: string, id: string, size: WidgetSize) => void;
    onWidgetUpdate: (dashboardId: string, pageId: string, id: string, widgetConfig: DashboardWidgetConfig) => void;
    onWidgetMove: (dashboardId: string, pageId: string, id: string, position: Position) => void;
    onWidgetRemove: (dashboardId: string, pageId: string, id: string) => void;
    updateDashboardPage(id: string, pageId: string, dashboard: Partial<DashboardPage>): void;
};

interface DataTalkConfigParams {
    enabled?: boolean;
    firebaseApp?: FirebaseApp;
    dashboardsPath?: string;
    userSessionsPath?: string;
    getAuthToken: () => Promise<string>;
    apiEndpoint: string;
}

const DataTalkConfigContext = React.createContext<DataTalkConfig>({} as any);

export function useBuildDataTalkConfig({
                                           enabled = true,
                                           firebaseApp,
                                           userSessionsPath,
                                           dashboardsPath,
                                           getAuthToken,
                                           apiEndpoint
                                       }: DataTalkConfigParams): DataTalkConfig {

    const [sessions, setSessions] = useState<Session[]>([]);
    const [sessionsLoading, setSessionsLoading] = useState<boolean>(true);
    const [samplePrompts, setSamplePrompts] = useState<string[]>([]);

    const [dashboards, setDashboards] = useState<Dashboard[]>([]);
    const [dashboardsLoading, setDashboardsLoading] = useState<boolean>(true);

    useEffect(() => {
        if (!enabled) return;
        getAuthToken().then((firebaseToken) => {
            getDataTalkSamplePrompts(firebaseToken, apiEndpoint).then(setSamplePrompts);
        });
    }, []);

    const createSessionId = useCallback(async (): Promise<string> => {
        if (!firebaseApp) throw Error("useBuildDataTalkConfig Firebase not initialised");
        const firestore = getFirestore(firebaseApp);
        if (!firestore || !userSessionsPath) throw Error("useFirestoreConfigurationPersistence Firestore not initialised");
        return doc(collection(firestore, userSessionsPath)).id;
    }, [firebaseApp, userSessionsPath]);

    const saveSession = useCallback(async (session: Session) => {
        if (!firebaseApp) throw Error("useBuildDataTalkConfig Firebase not initialised");
        const firestore = getFirestore(firebaseApp);
        if (!firestore || !userSessionsPath) throw Error("useFirestoreConfigurationPersistence Firestore not initialised");
        const {
            id,
            ...sessionData
        } = session;
        const sessionDoc = doc(firestore, userSessionsPath, id);
        return setDoc(sessionDoc, sessionData);
    }, [firebaseApp, userSessionsPath]);

    const getSession = useCallback(async (sessionId: string) => {
        return sessions.find(s => s.id === sessionId);
    }, [sessions])

    const saveDashboard = useCallback(async (dashBoard: Dashboard) => {
        if (!firebaseApp) throw Error("useBuildDataTalkConfig Firebase not initialised");
        const firestore = getFirestore(firebaseApp);
        if (!firestore || !dashboardsPath) throw Error("useFirestoreConfigurationPersistence Firestore not initialised");
        const {
            id,
            ...dashboardData
        } = dashBoard;
        const dashboardDoc = doc(firestore, dashboardsPath, id);
        return setDoc(dashboardDoc, dashboardData);
    }, [firebaseApp, userSessionsPath]);

    const listenDashboard = useCallback((id: string, onDashboardUpdate: (dashboard: Dashboard) => void) => {
        if (!firebaseApp) throw Error("useBuildDataTalkConfig Firebase not initialised");
        const firestore = getFirestore(firebaseApp);
        if (!firestore || !dashboardsPath) throw Error("useFirestoreConfigurationPersistence Firestore not initialised");
        return onSnapshot(doc(firestore, dashboardsPath, id).withConverter(timestampToDateConverter), {
            next: (snapshot) => {
                const dashboard = {
                    id: snapshot.id,
                    ...snapshot.data()
                } as Dashboard;
                if (!dashboard) throw Error("listenDashboard: Dashboard not found");
                onDashboardUpdate(dashboard);
            },
            error: (e) => {
                console.error(e);
            }
        });
    }, [firebaseApp, dashboardsPath]);

    const createDashboard = useCallback(async (): Promise<string> => {
        if (!firebaseApp) throw Error("useBuildDataTalkConfig Firebase not initialised");
        const firestore = getFirestore(firebaseApp);
        if (!firestore || !dashboardsPath) throw Error("useFirestoreConfigurationPersistence Firestore not initialised");
        const documentReference = doc(collection(firestore, dashboardsPath));
        await setDoc(documentReference, initializeDashboard(documentReference.id));
        return documentReference.id;
    }, [firebaseApp, dashboardsPath]);

    const deleteDashboard = useCallback(async (id: string) => {
        if (!firebaseApp) throw Error("useBuildDataTalkConfig Firebase not initialised");
        const firestore = getFirestore(firebaseApp);
        if (!firestore || !dashboardsPath) throw Error("useFirestoreConfigurationPersistence Firestore not initialised");
        const dashboard = dashboards.find(d => d.id === id);
        if (!dashboard) throw Error("deleteDashboard: Dashboard not found");
        dashboard.deleted = true;
        return saveDashboard(dashboard);
    }, [firebaseApp, dashboardsPath, dashboards])

    const addDashboardWidget = useCallback((id: string, widgetConfig: WidgetConfig) => {
        const dashboard = dashboards.find(d => d.id === id);
        if (!dashboard) throw Error("addDashboardWidget: Dashboard not found");
        const dashboardPage = dashboard.pages[0];
        dashboardPage.widgets.push(convertWidgetToDashboardWidget(widgetConfig));
        return saveDashboard(dashboard);
    }, [saveDashboard, dashboards]);

    const onWidgetResize = useCallback((dashboardId: string, pageId: string, id: string, size: WidgetSize) => {
        console.log("onWidgetResize", dashboardId, pageId, id, size)
        const dashboard = dashboards.find(d => d.id === dashboardId);
        if (!dashboard) throw Error("addDashboardWidget: Dashboard not found");
        const page = dashboard.pages.find(p => p.id === pageId);
        if (!page) throw Error("addDashboardWidget: Page not found");
        const widget = page.widgets.find(w => w.id === id);
        if (!widget) throw Error("addDashboardWidget: Widget not found");
        widget.size = size;
        return saveDashboard(dashboard);
    }, [dashboards, saveDashboard]);

    const onWidgetMove = useCallback((dashboardId: string, pageId: string, id: string, position: Position) => {
        const dashboard = dashboards.find(d => d.id === dashboardId);
        if (!dashboard) throw Error("addDashboardWidget: Dashboard not found");
        const page = dashboard.pages.find(p => p.id === pageId);
        if (!page) throw Error("addDashboardWidget: Page not found");
        const widget = page.widgets.find(w => w.id === id);
        if (!widget) throw Error("addDashboardWidget: Widget not found");
        if (equal(widget.position, position)) return;
        console.log("onWidgetMove", dashboardId, pageId, id, position)
        widget.position = position;
        return saveDashboard(dashboard);
    }, [dashboards, saveDashboard]);

    const onWidgetRemove = useCallback((dashboardId: string, pageId: string, id: string) => {
        console.log("onWidgetRemove", dashboardId, pageId, id)
        const dashboard = dashboards.find(d => d.id === dashboardId);
        if (!dashboard) throw Error("addDashboardWidget: Dashboard not found");
        const page = dashboard.pages.find(p => p.id === pageId);
        if (!page) throw Error("addDashboardWidget: Page not found");
        const widgetIndex = page.widgets.findIndex(w => w.id === id);
        if (widgetIndex === -1) throw Error("addDashboardWidget: Widget not found");
        page.widgets.splice(widgetIndex, 1);
        return saveDashboard(dashboard);
    }, [dashboards, saveDashboard]);

    const onWidgetUpdate = useCallback((dashboardId: string, pageId: string, id: string, widgetConfig: DashboardWidgetConfig) => {
        const dashboard = dashboards.find(d => d.id === dashboardId);
        if (!dashboard) throw Error("addDashboardWidget: Dashboard not found");
        const page = dashboard.pages.find(p => p.id === pageId);
        if (!page) throw Error("addDashboardWidget: Page not found");
        const widget = page.widgets.find(w => w.id === id);
        if (!widget) throw Error("addDashboardWidget: Widget not found");
        const widgetIndex = page.widgets.findIndex(w => w.id === id);
        if (widgetIndex === -1) throw Error("addDashboardWidget: Widget not found");
        const currentWidget = page.widgets[widgetIndex];
        if (equal(currentWidget, widgetConfig)) return;
        page.widgets.splice(widgetIndex, 1, widgetConfig);
        console.log("onWidgetUpdate", dashboardId, pageId, id, widgetConfig)
        return saveDashboard(dashboard);
    }, [dashboards, saveDashboard]);

    useEffect(() => {
        if (!enabled) return;
        if (!firebaseApp) throw Error("useBuildDataTalkConfig Firebase not initialised");
        const firestore = getFirestore(firebaseApp);
        if (!firestore || !userSessionsPath) return;
        const collectionReference = collection(firestore, userSessionsPath);
        return onSnapshot(
            query(
                collectionReference.withConverter(timestampToDateConverter),
                orderBy("created_at", "desc"),
                limit(50)
            ),
            {
                next: (snapshot) => {
                    const updatedSessions = snapshot.docs.map(doc => {
                        return {
                            id: doc.id,
                            ...doc.data()
                        } as Session;
                    });
                    setSessions(updatedSessions);
                    setSessionsLoading(false);
                },
                error: (e) => {
                    console.error(e);
                }
            }
        );
    }, [enabled, firebaseApp, userSessionsPath]);

    useEffect(() => {
        if (!enabled) return;
        if (!firebaseApp) throw Error("useBuildDataTalkConfig Firebase not initialised");
        const firestore = getFirestore(firebaseApp);
        if (!firestore || !dashboardsPath) return;

        return onSnapshot(
            query(
                collection(firestore, dashboardsPath).withConverter(timestampToDateConverter),
                where("deleted", "==", false),
                orderBy("created_at", "desc")
            ),
            {
                next: (snapshot) => {
                    const updatedDashboards = snapshot.docs.map(doc => {
                        return {
                            id: doc.id,
                            ...doc.data()
                        } as Dashboard;
                    });
                    console.log("Dashboards snapshot", updatedDashboards);
                    setDashboards(updatedDashboards);
                    setDashboardsLoading(false);
                },
                error: (e) => {
                    console.error(e);
                }
            }
        );
    }, [enabled, firebaseApp, dashboardsPath]);

    const updateDashboard = useCallback((dashboardId: string, dashboardData: Partial<Dashboard>) => {
        console.log("updateDashboard", dashboardId, dashboardData)
        if (!firebaseApp) throw Error("useBuildDataTalkConfig Firebase not initialised");
        const firestore = getFirestore(firebaseApp);
        if (!firestore || !dashboardsPath) throw Error("useFirestoreConfigurationPersistence Firestore not initialised");
        const dashboard = dashboards.find(d => d.id === dashboardId);
        if (!dashboard) throw Error("addDashboardWidget: Dashboard not found");
        const updatedDashboard = {
            ...dashboard,
            ...dashboardData
        };
        return saveDashboard(updatedDashboard);
    }, [dashboards]);

    const updateDashboardPage = useCallback((dashboardId: string, pageId: string, pageData: Partial<DashboardPage>) => {
        console.log("updateDashboardPage", dashboardId, pageId, pageData)
        if (!firebaseApp) throw Error("useBuildDataTalkConfig Firebase not initialised");
        const firestore = getFirestore(firebaseApp);
        if (!firestore || !dashboardsPath) throw Error("useFirestoreConfigurationPersistence Firestore not initialised");
        const dashboard = dashboards.find(d => d.id === dashboardId);
        if (!dashboard) throw Error("addDashboardWidget: Dashboard not found");
        const page = dashboard.pages.find(p => p.id === pageId);
        if (!page) throw Error("addDashboardWidget: Page not found");
        const updatedPage = {
            ...page,
            ...pageData
        };
        const updatedDashboard = {
            ...dashboard,
            pages: dashboard.pages.map(p => p.id === pageId ? updatedPage : p)
        };
        return saveDashboard(updatedDashboard);
    }, [dashboards]);

    return {
        loading: sessionsLoading || dashboardsLoading,
        apiEndpoint,
        getAuthToken,
        sessions,
        saveSession,
        getSession,
        createSessionId,
        rootPromptsSuggestions: samplePrompts,
        dashboards,
        createDashboard,
        deleteDashboard,
        saveDashboard,
        updateDashboard,
        updateDashboardPage,
        listenDashboard,
        addDashboardWidget,
        onWidgetResize,
        onWidgetUpdate,
        onWidgetMove,
        onWidgetRemove
    };
}

export const useDataTalk = () => useContext(DataTalkConfigContext);

export function DataTalkProvider({
                                     config,
                                     children,
                                 }: { config: DataTalkConfig, children: React.ReactNode }) {

    return <DataTalkConfigContext.Provider value={config}>
        {children}
    </DataTalkConfigContext.Provider>;
}

const timestampToDateConverter = {
    toFirestore(data: any) {
        return data; // This can be customized based on your write needs
    },
    fromFirestore(snapshot: any, options: any) {
        const data = snapshot.data(options);
        return convertTimestamps(data);
    }
};

function convertTimestamps(data: any): any {
    if (data instanceof Timestamp) {
        return data.toDate(); // Convert Timestamp directly if the item is a Timestamp
    } else if (Array.isArray(data)) {
        return data.map(item => convertTimestamps(item)); // Process arrays recursively
    } else if (data !== null && typeof data === "object") {
        for (const key in data) {
            data[key] = convertTimestamps(data[key]); // Recursively process object properties
        }
        return data;
    }
    return data; // Return the data if it is neither a Timestamp nor a complex object/array
}

function initializeDashboard(dashboardId: string): Omit<Dashboard, "id"> {
    return {
        created_at: new Date(),
        pages: [{
            id: randomString(20),
            widgets: []
        }],
        deleted: false
    };
}

function convertWidgetToDashboardWidget(config: WidgetConfig, position?: Position,): DashboardWidgetConfig {
    return {
        ...config,
        size: config.size ?? DEFAULT_WIDGET_SIZE,
        id: randomString(20),
        position: position ?? {
            x: 0,
            y: 0
        }
    }
}
