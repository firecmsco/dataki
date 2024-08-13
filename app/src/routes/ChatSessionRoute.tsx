import React, { useEffect, useState } from "react";
import { DatakiConfig } from "../DatakiProvider";
import { CircularProgressCenter } from "@firecms/core";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { DatakiChatSession } from "../components/chat/DatakiChatSession";
import { ChatMessage, ChatSession, DataSource } from "../types";

export function ChatSessionRoute({
                                     datakiConfig,
                                     onAnalyticsEvent,
                                 }: {
    datakiConfig: DatakiConfig,
    onAnalyticsEvent?: (event: string, params?: any) => void,
}) {

    const [autoRunCode, setAutoRunCode] = useState<boolean>(false);

    const { sessionId } = useParams();
    if (!sessionId) throw Error("Session id not found");

    return <ChatRouteInner
        key={sessionId}
        sessionId={sessionId}
        datakiConfig={datakiConfig}
        onAnalyticsEvent={onAnalyticsEvent}
        autoRunCode={autoRunCode}
        setAutoRunCode={setAutoRunCode}/>
}

interface ChatRouteInnerProps {
    sessionId: any;
    datakiConfig: DatakiConfig;
    onAnalyticsEvent?: (event: string, params?: any) => void,
    autoRunCode: any;
    setAutoRunCode: any;
}

function ChatRouteInner({
                            sessionId,
                            datakiConfig,
                            onAnalyticsEvent,
                            autoRunCode,
                            setAutoRunCode
                        }: ChatRouteInnerProps) {
    const navigate = useNavigate();

    const location = useLocation();

    const params = new URLSearchParams(location.search);
    const initialPrompt = params.get("prompt");

    const [session, setSession] = React.useState<ChatSession | undefined>(undefined);
    const [loading, setLoading] = React.useState(true);

    // I need to hold the data source dialog open state in the URL
    // so that the user can refresh the page and the dialog remains open
    const initialDataSourceSelectionOpen = params.get("dataSource") === "true";

    useEffect(() => {
        setLoading(true);
        datakiConfig.getSession(sessionId)
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
    } satisfies ChatSession;

    const onMessagesChange = (messages: ChatMessage[]) => {
        const newSession = {
            ...usedSession,
            messages
        };
        setSession(newSession);
        datakiConfig.saveSession(newSession);
    };

    const onDataSourcesChange = (dataSources: DataSource[]) => {
        const newSession = {
            ...usedSession,
            dataSources
        };
        setSession(newSession);
        datakiConfig.saveSession(newSession);
    }

    const onProjectIdChange = (projectId: string) => {
        const newSession = {
            ...usedSession,
            projectId
        };
        setSession(newSession);
        datakiConfig.saveSession(newSession);
    }

    return (
        <DatakiChatSession
            onAnalyticsEvent={onAnalyticsEvent}
            session={usedSession}
            initialPrompt={initialPrompt ?? undefined}
            onDataSourcesChange={onDataSourcesChange}
            onProjectIdChange={onProjectIdChange}
            onMessagesChange={onMessagesChange}
            initialDataSourceSelectionOpen={initialDataSourceSelectionOpen}
            onDataSourceSelectionOpenChange={(open) => {
                const searchParams = new URLSearchParams(location.search);
                if (open) searchParams.set("dataSource", "true");
                else searchParams.delete("dataSource");
                navigate({
                    search: searchParams.toString()
                }, { replace: true });
            }}
        />
    )
}
