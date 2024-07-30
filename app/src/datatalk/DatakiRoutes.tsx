import React, { useEffect } from "react";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { CircularProgressCenter } from "@firecms/core";
import { DatakiConfig, useDataki } from "./DatakiProvider";
import { HomePage } from "./components/HomePage";
import { ChatSessionRoute } from "./routes/ChatSessionRoute";
import { DashboardRoute } from "./routes/DashboardRoute";

export function DatakiRoutes({
                                 onAnalyticsEvent,
                             }: {
    onAnalyticsEvent?: (event: string, params?: any) => void,
}) {
    const location = useLocation();

    const datakiConfig = useDataki();

    if (datakiConfig.loading) {
        return <CircularProgressCenter/>
    }

    return (
        // <TransitionGroup component={null}>
        //     <CSSTransition key={location.key} classNames="fade" timeout={300}>

                <Routes>
                    <Route path="/"
                           element={
                               <HomePage/>
                           }/>
                    <Route path="/dashboards/:dashboardId"
                           element={
                               <DashboardRoute datakiConfig={datakiConfig}
                                               onAnalyticsEvent={onAnalyticsEvent}/>
                           }/>
                    <Route path="/chat"
                           element={
                               <CreateSessionAndRedirect datakiConfig={datakiConfig}/>
                           }/>
                    <Route path="/chat/:sessionId"
                           element={
                               <ChatSessionRoute datakiConfig={datakiConfig}
                                                 onAnalyticsEvent={onAnalyticsEvent}/>
                           }/>
                </Routes>
        //     </CSSTransition>
        // </TransitionGroup>
    )
}

function CreateSessionAndRedirect({ datakiConfig }: { datakiConfig: DatakiConfig }) {
    const location = useLocation();
    const navigate = useNavigate();

    const params = new URLSearchParams(location.search);
    const initialPrompt = params.get("prompt");

    useEffect(() => {
        datakiConfig.createSessionId().then(sessionId => {
            if (initialPrompt) {
                navigate(`/chat/${sessionId}?prompt=${initialPrompt}`, { replace: true });
            } else {
                navigate(`/chat/${sessionId}`, { replace: true });
            }
        });
    }, []);

    return <CircularProgressCenter/>;
}
