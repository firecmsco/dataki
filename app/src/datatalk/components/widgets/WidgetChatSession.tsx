import { ChatMessage, ChatSession, DashboardWidgetConfig, DataSource, DryWidgetConfig } from "../../types";

import React from "react";
import { Sheet } from "@firecms/ui";
import { DatakiChatSession } from "../chat/DatakiChatSession";

export function WidgetChatSession({
                                      dryConfig: dryConfigProp,
                                      open,
                                      setOpen,
                                      onUpdate: onUpdateProp
                                  }: {
    dryConfig: DashboardWidgetConfig
    open: boolean,
    setOpen: (open: boolean) => void,
    onUpdate?: (newConfig: DryWidgetConfig) => void
}) {

    const onInitialWidgetConfigChange = (newConfig: DryWidgetConfig) => {
        onUpdateProp?.(newConfig);
        setOpen(false);
    }

    const [session, setSession] = React.useState<ChatSession>({
        id: "temp_session",
        created_at: new Date(),
        updated_at: new Date(),
        messages: [],
        dataSources: []
    });

    const onMessagesChange = (messages: ChatMessage[]) => {
        const newSession = {
            ...session,
            messages
        };
        setSession(newSession);
    };

    const onDataSourcesChange = (dataSources: DataSource[]) => {
        const newSession = {
            ...session,
            dataSources
        };
        setSession(newSession);
    }

    const onProjectIdChange = (projectId: string) => {
        const newSession = {
            ...session,
            projectId
        };
        setSession(newSession);
    }

    return <Sheet
        side={"bottom"}
        open={open}
        onOpenChange={setOpen}
    >
        <DatakiChatSession
            className={"h-[95vh]"}
            session={session}
            initialWidgetConfig={dryConfigProp}
            onInitialWidgetConfigChange={onInitialWidgetConfigChange}
            onMessagesChange={onMessagesChange}
            onDataSourcesChange={onDataSourcesChange}
            onProjectIdChange={onProjectIdChange}/>
    </Sheet>
}
