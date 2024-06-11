import React, { useEffect } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { CircularProgressCenter } from "@firecms/core";
import { DataTalkConfig, useDataTalk } from "./DataTalkProvider";
import { HomePage } from "./components/HomePage";
import { ChatSessionRoute } from "./routes/ChatSessionRoute";
import { DashboardRoute } from "./routes/DashboardRoute";

export function DataTalkRoutes({
                                   onAnalyticsEvent,
                               }: {
    onAnalyticsEvent?: (event: string, params?: any) => void,
}) {

    const dataTalkConfig = useDataTalk();

    if (dataTalkConfig.loading) {
        return <CircularProgressCenter/>
    }

    return (
        <Routes>
            <Route path="/"
                   element={
                       <HomePage/>
                   }/>
            <Route path="/dashboards/:dashboardId"
                   element={
                       <DashboardRoute dataTalkConfig={dataTalkConfig}
                                       onAnalyticsEvent={onAnalyticsEvent}/>
                   }/>
            <Route path="/chat"
                   element={
                       <CreateSessionAndRedirect dataTalkConfig={dataTalkConfig}/>
                   }/>
            <Route path="/chat/:sessionId"
                   element={
                       <ChatSessionRoute dataTalkConfig={dataTalkConfig}
                                         onAnalyticsEvent={onAnalyticsEvent}/>
                   }/>
        </Routes>
    )
}

function CreateSessionAndRedirect({ dataTalkConfig }: { dataTalkConfig: DataTalkConfig }) {
    const location = useLocation();
    const navigate = useNavigate();

    const params = new URLSearchParams(location.search);
    const initialPrompt = params.get("prompt");

    useEffect(() => {
        dataTalkConfig.createSessionId().then(sessionId => {
            if (initialPrompt) {
                navigate(`/chat/${sessionId}?prompt=${initialPrompt}`, { replace: true });
            } else {
                navigate(`/chat/${sessionId}`, { replace: true });
            }
        });
    }, []);

    return <CircularProgressCenter/>;
}
