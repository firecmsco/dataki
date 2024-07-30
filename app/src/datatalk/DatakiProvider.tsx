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
import {
    ChatSession,
    Dashboard,
    DashboardPage,
    DashboardWidgetConfig,
    DryWidgetConfig,
    Position,
    TextItem,
    WidgetSize
} from "./types";
import { DEFAULT_GRID_SIZE, DEFAULT_WIDGET_SIZE } from "./utils/widgets";
import { randomString, User } from "@firecms/core";
import equal from "react-fast-compare"

export type DatakiConfig = {
    loading: boolean;
    apiEndpoint: string;
    getAuthToken: () => Promise<string>;
    sessions: ChatSession[];
    createSessionId: () => Promise<string>;
    saveSession: (session: ChatSession) => Promise<void>;
    getSession: (sessionId: string) => Promise<ChatSession | undefined>;
    dashboards: Dashboard[];
    createDashboard: () => Promise<Dashboard>;
    saveDashboard: (dashboard: Dashboard) => Promise<void>;
    updateDashboard: (id: string, dashboardData: Partial<Dashboard>) => Promise<void>;
    deleteDashboard: (id: string) => Promise<void>;
    listenDashboard: (dashboardId: string, onDashboardUpdate: (dashboard: Dashboard) => void) => () => void;
    addDashboardText: (dashboardId: string, pageId: string, node: TextItem) => void;
    updateDashboardText: (dashboardId: string, pageId: string, id: string, node: TextItem) => void;
    addDashboardWidget: (dashboardId: string, widgetConfig: DryWidgetConfig) => DashboardWidgetConfig;
    onWidgetResize: (dashboardId: string, pageId: string, id: string, size: WidgetSize) => void;
    onWidgetUpdate: (dashboardId: string, pageId: string, id: string, widgetConfig: DashboardWidgetConfig) => void;
    onWidgetMove: (dashboardId: string, pageId: string, id: string, position: Position) => void;
    onWidgetRemove: (dashboardId: string, pageId: string, id: string) => void;
    onWidgetsRemove: (dashboardId: string, pageId: string, id: string[]) => void;
    updateDashboardPage: (id: string, pageId: string, dashboard: Partial<DashboardPage>) => void;

    firebaseApp?: FirebaseApp;
};

export interface DatakiConfigParams {
    enabled?: boolean;
    firebaseApp?: FirebaseApp;
    dashboardsPath?: string;
    userSessionsPath?: string;
    getAuthToken: () => Promise<string>;
    apiEndpoint: string;
    user: User | null
}

const DatakiConfigContext = React.createContext<DatakiConfig>({} as any);

export function useBuildDatakiConfig({
                                           enabled = true,
                                           firebaseApp,
                                           userSessionsPath,
                                           dashboardsPath,
                                           getAuthToken,
                                           apiEndpoint,
                                           user
                                       }: DatakiConfigParams): DatakiConfig {

    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [sessionsLoading, setSessionsLoading] = useState<boolean>(true);

    const dashboardsRef = React.useRef<Dashboard[]>([]);
    const [dashboards, setDashboards] = useState<Dashboard[]>([]);
    const [dashboardsLoading, setDashboardsLoading] = useState<boolean>(true);

    function updateDashboards(newDashboards: Dashboard[]) {
        dashboardsRef.current = newDashboards;
        setDashboards(newDashboards);
    }

    const createSessionId = useCallback(async (): Promise<string> => {
        if (!firebaseApp) throw Error("useBuildDatakiConfig Firebase not initialised");
        const firestore = getFirestore(firebaseApp);
        if (!firestore || !userSessionsPath) throw Error("useBuildDatakiConfig Firestore not initialised");
        return doc(collection(firestore, userSessionsPath)).id;
    }, [firebaseApp, userSessionsPath]);

    const saveSession = useCallback(async (session: ChatSession) => {
        if (!firebaseApp) throw Error("useBuildDatakiConfig Firebase not initialised");
        const firestore = getFirestore(firebaseApp);
        if (!firestore || !userSessionsPath) throw Error("useBuildDatakiConfig Firestore not initialised");
        const {
            id,
            ...sessionData
        } = session;
        const sessionDoc = doc(firestore, userSessionsPath, id);
        return setDoc(sessionDoc, {
            ...sessionData,
            updated_at: new Date()
        });
    }, [firebaseApp, userSessionsPath]);

    const getSession = useCallback(async (sessionId: string) => {
        return sessions.find(s => s.id === sessionId);
    }, [sessions])

    const saveDashboard = useCallback(async (dashBoard: Dashboard) => {
        if (!firebaseApp) throw Error("useBuildDatakiConfig Firebase not initialised");
        const firestore = getFirestore(firebaseApp);
        if (!firestore || !dashboardsPath) throw Error("useBuildDatakiConfig Firestore not initialised");
        const {
            id,
            ...dashboardData
        } = dashBoard;
        const dashboardDoc = doc(firestore, dashboardsPath, id);
        return setDoc(dashboardDoc, {
            ...dashboardData,
            updated_at: new Date()
        });
    }, [dashboardsPath, firebaseApp]);

    const listenDashboard = useCallback((id: string, onDashboardUpdate: (dashboard: Dashboard) => void) => {
        if (!firebaseApp) throw Error("useBuildDatakiConfig Firebase not initialised");
        const firestore = getFirestore(firebaseApp);
        if (!firestore || !dashboardsPath) throw Error("useBuildDatakiConfig Firestore not initialised");
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

    const createDashboard = useCallback(async (): Promise<Dashboard> => {
        if (user === null)
            throw Error("User not found");
        if (!firebaseApp)
            throw Error("useBuildDatakiConfig Firebase not initialised");
        const firestore = getFirestore(firebaseApp);
        if (!firestore || !dashboardsPath) throw Error("useBuildDatakiConfig Firestore not initialised");
        const documentReference = doc(collection(firestore, dashboardsPath));
        const id = documentReference.id;
        const data = initializeDashboard(id, user.uid);
        const newDashboard = { id, ...data };
        updateDashboards([newDashboard, ...dashboardsRef.current]);
        await setDoc(documentReference, data);
        return newDashboard;
    }, [firebaseApp, dashboardsPath, user]);

    const deleteDashboard = useCallback(async (id: string) => {
        if (!firebaseApp) throw Error("useBuildDatakiConfig Firebase not initialised");
        const firestore = getFirestore(firebaseApp);
        if (!firestore || !dashboardsPath) throw Error("useBuildDatakiConfig Firestore not initialised");
        const dashboard = dashboardsRef.current.find(d => d.id === id);
        if (!dashboard) throw Error("deleteDashboard: Dashboard not found");
        dashboard.deleted = true;
        return saveDashboard(dashboard);
    }, [firebaseApp, dashboardsPath, saveDashboard])

    const addDashboardText = useCallback((dashboardId: string, pageId: string, node: TextItem) => {
        const dashboard = dashboardsRef.current.find(d => d.id === dashboardId);
        if (!dashboard) throw Error("addDashboardWidget: Dashboard not found");
        const page = dashboard.pages.find(p => p.id === pageId);
        if (!page) throw Error("addDashboardWidget: Page not found");
        page.widgets.push(node);
        return saveDashboard(dashboard);
    }, [saveDashboard]);

    const updateDashboardText = useCallback((dashboardId: string, pageId: string, id: string, node: TextItem) => {
        const dashboard = dashboardsRef.current.find(d => d.id === dashboardId);
        if (!dashboard) throw Error("addDashboardWidget: Dashboard not found");
        const page = dashboard.pages.find(p => p.id === pageId);
        if (!page) throw Error("addDashboardWidget: Page not found");
        const widgetIndex = page.widgets.findIndex(w => w.id === id);
        if (widgetIndex === -1) throw Error("addDashboardWidget: Widget not found");
        page.widgets.splice(widgetIndex, 1, node);
        return saveDashboard(dashboard);
    }, [saveDashboard]);

    const addDashboardWidget = (id: string, widgetConfig: DryWidgetConfig): DashboardWidgetConfig => {
        const dashboard = dashboardsRef.current.find(d => d.id === id);
        if (!dashboard) throw Error("addDashboardWidget: Dashboard not found");
        const dashboardPage = dashboard.pages[0];
        const maxYPosition = dashboardPage.widgets.reduce((acc, widget) => {
            const y = widget.position.y + widget.size.height;
            if (y > acc)
                return y;
            return acc;
        }, 0);
        const newWidget = convertWidgetToDashboardWidget(widgetConfig, {
            x: DEFAULT_GRID_SIZE,
            y: maxYPosition + DEFAULT_GRID_SIZE
        });
        dashboardPage.widgets.push(newWidget);
        saveDashboard(dashboard).catch(console.error);
        return newWidget;
    };

    const onWidgetResize = useCallback((dashboardId: string, pageId: string, id: string, size: WidgetSize) => {
        console.log("onWidgetResize", dashboardId, pageId, id, size)
        const dashboard = dashboardsRef.current.find(d => d.id === dashboardId);
        if (!dashboard) throw Error("addDashboardWidget: Dashboard not found");
        const page = dashboard.pages.find(p => p.id === pageId);
        if (!page) throw Error("addDashboardWidget: Page not found");
        const widget = page.widgets.find(w => w.id === id);
        if (!widget) throw Error("addDashboardWidget: Widget not found");
        widget.size = size;
        return saveDashboard(dashboard);
    }, [saveDashboard]);

    const onWidgetMove = useCallback((dashboardId: string, pageId: string, id: string, position: Position) => {
        const dashboard = dashboardsRef.current.find(d => d.id === dashboardId);
        if (!dashboard) throw Error("addDashboardWidget: Dashboard not found");
        const page = dashboard.pages.find(p => p.id === pageId);
        if (!page) throw Error("addDashboardWidget: Page not found");
        const widget = page.widgets.find(w => w.id === id);
        if (!widget) throw Error("addDashboardWidget: Widget not found");
        if (equal(widget.position, position)) return;
        console.log("onWidgetMove", dashboardId, pageId, id, position)
        widget.position = position;
        return saveDashboard(dashboard);
    }, [saveDashboard]);

    const onWidgetRemove = useCallback((dashboardId: string, pageId: string, id: string) => {
        console.log("onWidgetRemove", dashboardId, pageId, id)
        const dashboard = dashboardsRef.current.find(d => d.id === dashboardId);
        if (!dashboard) throw Error("addDashboardWidget: Dashboard not found");
        const page = dashboard.pages.find(p => p.id === pageId);
        if (!page) throw Error("addDashboardWidget: Page not found");
        const widgetIndex = page.widgets.findIndex(w => w.id === id);
        if (widgetIndex === -1) throw Error("addDashboardWidget: Widget not found");
        page.widgets.splice(widgetIndex, 1);
        return saveDashboard(dashboard);
    }, [saveDashboard]);

    const onWidgetsRemove = useCallback((dashboardId: string, pageId: string, ids: string[]) => {
        const dashboard = dashboardsRef.current.find(d => d.id === dashboardId);
        if (!dashboard) throw Error("addDashboardWidget: Dashboard not found");
        const page = dashboard.pages.find(p => p.id === pageId);
        if (!page) throw Error("addDashboardWidget: Page not found");
        const widgets = page.widgets.filter(w => !ids.includes(w.id));
        page.widgets = widgets;
        return saveDashboard(dashboard);
    }, [saveDashboard]);

    const onWidgetUpdate = useCallback((dashboardId: string, pageId: string, id: string, widgetConfig: DashboardWidgetConfig) => {
        const dashboard = dashboardsRef.current.find(d => d.id === dashboardId);
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
    }, [saveDashboard]);

    useEffect(() => {
        if (!enabled) return;
        if (!firebaseApp) throw Error("useBuildDatakiConfig Firebase not initialised");
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
                        } as ChatSession;
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
        if (!user?.uid) return;
        if (!firebaseApp) throw Error("useBuildDatakiConfig Firebase not initialised");
        const firestore = getFirestore(firebaseApp);
        if (!firestore || !dashboardsPath) return;

        return onSnapshot(
            query(
                collection(firestore, dashboardsPath).withConverter(timestampToDateConverter),
                where("deleted", "==", false),
                where("users", "array-contains", user.uid),
                orderBy("updated_at", "desc")
            ),
            {
                next: (snapshot) => {
                    const updatedDashboards = snapshot.docs.map(doc => {
                        return {
                            id: doc.id,
                            ...doc.data()
                        } as Dashboard;
                    });
                    updateDashboards(updatedDashboards);
                    setDashboardsLoading(false);
                },
                error: (e) => {
                    console.error(e);
                }
            }
        );
    }, [enabled, firebaseApp, dashboardsPath, user?.uid]);

    const updateDashboard = useCallback((dashboardId: string, dashboardData: Partial<Dashboard>) => {
        console.log("updateDashboard", dashboardId, dashboardData)
        if (!firebaseApp) throw Error("useBuildDatakiConfig Firebase not initialised");
        const firestore = getFirestore(firebaseApp);
        if (!firestore || !dashboardsPath) throw Error("useBuildDatakiConfig Firestore not initialised");
        const dashboard = dashboardsRef.current.find(d => d.id === dashboardId);
        if (!dashboard) throw Error("addDashboardWidget: Dashboard not found");
        const updatedDashboard = {
            ...dashboard,
            ...dashboardData
        };
        return saveDashboard(updatedDashboard);
    }, [dashboardsPath, firebaseApp, saveDashboard]);

    const updateDashboardPage = useCallback((dashboardId: string, pageId: string, pageData: Partial<DashboardPage>) => {
        console.log("updateDashboardPage", dashboardId, pageId, pageData)
        if (!firebaseApp) throw Error("useBuildDatakiConfig Firebase not initialised");
        const firestore = getFirestore(firebaseApp);
        if (!firestore || !dashboardsPath) throw Error("useBuildDatakiConfig Firestore not initialised");
        const dashboard = dashboardsRef.current.find(d => d.id === dashboardId);
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
    }, [dashboardsPath, firebaseApp, saveDashboard]);

    return {
        loading: sessionsLoading || dashboardsLoading,
        apiEndpoint,
        getAuthToken,
        sessions,
        saveSession,
        getSession,
        createSessionId,
        dashboards,
        createDashboard,
        deleteDashboard,
        saveDashboard,
        updateDashboard,
        updateDashboardPage,
        listenDashboard,
        addDashboardText,
        updateDashboardText,
        addDashboardWidget,
        onWidgetResize,
        onWidgetUpdate,
        onWidgetMove,
        onWidgetRemove,
        onWidgetsRemove,
        firebaseApp
    };
}

export const useDataki = () => useContext(DatakiConfigContext);

export function DatakiProvider({
                                     config,
                                     children,
                                 }: { config: DatakiConfig, children: React.ReactNode }) {

    return <DatakiConfigContext.Provider value={config}>
        {children}
    </DatakiConfigContext.Provider>;
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

function initializeDashboard(dashboardId: string, uid: string): Omit<Dashboard, "id"> {
    return {
        created_at: new Date(),
        updated_at: new Date(),
        users: [uid],
        owner: uid,
        permissions: [{
            uid,
            read: true,
            edit: true,
            delete: true
        }],
        pages: [{
            id: randomString(20),
            widgets: []
        }],
        deleted: false
    };
}

function convertWidgetToDashboardWidget(config: DryWidgetConfig, position?: Position,): DashboardWidgetConfig {
    return {
        ...config,
        size: config.size ?? DEFAULT_WIDGET_SIZE,
        id: randomString(30),
        position: position ?? {
            x: 0,
            y: 0
        }
    }
}

// function saveCredentialInStorage(credential: OAuthCredential | null) {
//     if (!credential) {
//         localStorage.removeItem("googleCredential");
//         return;
//     }
//     const credentialString = JSON.stringify({
//         created_on: new Date(),
//         credential: credential.toJSON()
//     });
//     localStorage.setItem("googleCredential", credentialString);
// }
//
// function loadCredentialFromStorage(): OAuthCredential | null {
//     try {
//         const credentialString = localStorage.getItem("googleCredential");
//         if (!credentialString)
//             return null;
//         const credentialJSON = JSON.parse(credentialString) satisfies {
//             created_on: string,
//             credential: any
//         };
//         const credential = OAuthCredential.fromJSON(credentialJSON.credential);
//         const createdOn = new Date(credentialJSON.created_on);
//         const now = new Date();
//         const diff = now.getTime() - createdOn.getTime();
//         // check the credential is valid
//         if (diff > 1000 * 60 * 60) {
//             console.debug("Google credential expired credential expired");
//             saveCredentialInStorage(null);
//             return null;
//         }
//         return credential;
//     } catch (e) {
//         console.error(e);
//         return null;
//     }
// }
