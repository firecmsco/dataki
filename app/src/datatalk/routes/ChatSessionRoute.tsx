import React, { useEffect, useState } from "react";
import { DataTalkConfig } from "../DataTalkProvider";
import { CircularProgressCenter } from "@firecms/core";
import { useLocation, useParams } from "react-router-dom";
import { DataTalkChatSession } from "../components/chat/DataTalkChatSession";
import { ChatMessage, DataSource, Session } from "../types";

export function ChatSessionRoute({
                                     dataTalkConfig,
                                     onAnalyticsEvent,
                                 }: {
    dataTalkConfig: DataTalkConfig,
    onAnalyticsEvent?: (event: string, params?: any) => void,
}) {

    const [autoRunCode, setAutoRunCode] = useState<boolean>(false);

    const { sessionId } = useParams();
    if (!sessionId) throw Error("Session id not found");

    return <ChatRouteInner
        key={sessionId}
        sessionId={sessionId}
        dataTalkConfig={dataTalkConfig}
        onAnalyticsEvent={onAnalyticsEvent}
        autoRunCode={autoRunCode}
        setAutoRunCode={setAutoRunCode}/>
}

interface ChatRouteInnerProps {
    sessionId: any;
    dataTalkConfig: DataTalkConfig;
    onAnalyticsEvent?: (event: string, params?: any) => void,
    autoRunCode: any;
    setAutoRunCode: any;
}

function ChatRouteInner({
                            sessionId,
                            dataTalkConfig,
                            onAnalyticsEvent,
                            autoRunCode,
                            setAutoRunCode
                        }: ChatRouteInnerProps) {

    const location = useLocation();

    const params = new URLSearchParams(location.search);
    const initialPrompt = params.get("prompt");

    const [session, setSession] = React.useState<Session | undefined>(undefined);
    const [loading, setLoading] = React.useState(true);

    useEffect(() => {
        setLoading(true);
        dataTalkConfig.getSession(sessionId)
            .then(session => {
                setSession(session);
                setLoading(false);
            });
    }, [sessionId]);

    if (loading) {
        return <CircularProgressCenter/>
    }

    const usedSession = session ?? {
        id: sessionId,
        created_at: new Date(),
        updated_at: new Date(),
        messages: [],
        dataSources: []
    } satisfies Session;

    const onMessagesChange = (messages: ChatMessage[]) => {
        const newSession = {
            ...usedSession,
            messages
        };
        setSession(newSession);
        dataTalkConfig.saveSession(newSession);
    };

    const onDataSourcesChange = (dataSources: DataSource[]) => {
        const newSession = {
            ...usedSession,
            dataSources
        };
        setSession(newSession);
        dataTalkConfig.saveSession(newSession);
    }

    const onProjectIdChange = (projectId: string) => {
        const newSession = {
            ...usedSession,
            projectId
        };
        setSession(newSession);
        dataTalkConfig.saveSession(newSession);
    }

    return (
        <DataTalkChatSession
            onAnalyticsEvent={onAnalyticsEvent}
            session={usedSession}
            initialPrompt={initialPrompt ?? undefined}
            onDataSourcesChange={onDataSourcesChange}
            onProjectIdChange={onProjectIdChange}
            onMessagesChange={onMessagesChange}
        />
    )
}
