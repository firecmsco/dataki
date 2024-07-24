import { AutoAwesomeIcon, Avatar, cls, Menu, MenuItem, PersonIcon, StorageIcon } from "@firecms/ui";
import React, { useEffect, useRef, useState } from "react";
import { ChatMessage, DashboardParams, DataSource, FeedbackSlug } from "../../types";
import { SystemMessage } from "./SystemMessage";

export function MessageView({
                                message,
                                onRemove,
                                onRegenerate,
                                canRegenerate,
                                onFeedback,
                                onUpdatedMessage,
                                dataSources,
                                params
                            }: {
    message?: ChatMessage,
    onRemove?: () => void,
    onRegenerate?: () => void,
    canRegenerate?: boolean,
    onFeedback?: (reason?: FeedbackSlug, feedbackMessage?: string) => void,
    onUpdatedMessage?: (message: ChatMessage) => void,
    dataSources: DataSource[],
    params?: DashboardParams
}) {

    const ref = useRef<HTMLDivElement>(null);

    const onUpdatedMessageInternal = (updatedText: string) => {
        if (!message) return;
        if (onUpdatedMessage) onUpdatedMessage({
            ...message,
            text: updatedText
        });
    }

    const [containerWidth, setContainerWidth] = useState<number | null>(null);

    useEffect(() => {
        const resizeObserver = new ResizeObserver((entries) => {
            if (ref.current) {
                const rect = ref.current?.getBoundingClientRect();
                setContainerWidth(rect.width);
            }
        });

        if (ref.current) {
            resizeObserver.observe(ref.current);
        }

        return () => resizeObserver.disconnect();
    }, [ref]);

    const bgColor = message?.user === "SQL_STATEMENT"
        ? "bg-slate-200 dark:bg-slate-800"
        : (message?.user === "SYSTEM" ? "bg-transparent dark:bg-gray-900" : "bg-white dark:bg-gray-800 dark:bg-opacity-20");

    const padding = message?.user === "SQL_STATEMENT" ? "py-1 px-4" : "p-4";

    return <div ref={ref}
                className={cls("flex flex-col gap-2 rounded-3xl", bgColor, padding)}>
        <div className="flex items-start gap-3 justify-center">
            <Menu trigger={<Avatar className="w-10 h-10 shrink-0">
                {message?.user === "USER" && <PersonIcon/>}
                {message?.user === "SYSTEM" && <AutoAwesomeIcon/>}
                {message?.user === "SQL_STATEMENT" && <StorageIcon/>}
            </Avatar>}>
                <MenuItem dense onClick={onRemove}>Remove</MenuItem>
            </Menu>

            {/*<Avatar className="w-10 h-10 shrink-0">*/}
            {/*    {message?.user === "USER" && <PersonIcon/>}*/}
            {/*    {message?.user === "SYSTEM" && <AutoAwesomeIcon/>}*/}
            {/*    {message?.user === "SQL_STATEMENT" && <StorageIcon/>}*/}
            {/*</Avatar>*/}

            <div className={cls(message?.user === "SQL_STATEMENT" ? "my-1" : "my-3",
                "flex-1 text-gray-700 dark:text-gray-200 self-center")}>

                {message?.user === "USER" && <UserMessage text={message.text}/>}
                {message?.user === "SQL_STATEMENT" && <SQLStatementMessage text={message.text}/>}
                {message?.user === "SYSTEM" && <SystemMessage text={message.text}
                                                              loading={message.loading}
                                                              dataSources={dataSources}
                                                              canRegenerate={canRegenerate}
                                                              containerWidth={containerWidth ?? undefined}
                                                              onRegenerate={onRegenerate}
                                                              onUpdatedMessage={onUpdatedMessageInternal}
                                                              params={params}
                                                              onFeedback={onFeedback}/>}

            </div>
        </div>
    </div>;
}

function UserMessage({ text }: { text: string }) {
    return <>{text.split("\n").map((line, index) => <p key={index}>{line}</p>)}</>
}

function SQLStatementMessage({ text }: { text: string }) {
    return <code className={"text-sm self-center"}>{text.split("\n").map((line, index) => <p key={index}>{line}</p>)}</code>
}
