import { AutoAwesomeIcon, Avatar, cls, Menu, MenuItem, PersonIcon } from "@firecms/ui";
import React, { useEffect, useRef, useState } from "react";
import { ChatMessage, DataSource, FeedbackSlug } from "../../types";
import { SystemMessage } from "./SystemMessage";

export function MessageView({
                                message,
                                onRemove,
                                onRegenerate,
                                canRegenerate,
                                onFeedback,
                                onUpdatedMessage,
                                dataSources
                            }: {
    message?: ChatMessage,
    onRemove?: () => void,
    onRegenerate?: () => void,
    canRegenerate?: boolean,
    onFeedback?: (reason?: FeedbackSlug, feedbackMessage?: string) => void,
    onUpdatedMessage?: (message: ChatMessage) => void,
    dataSources: DataSource[]
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

    return <div ref={ref}
                className={cls("flex flex-col gap-2 bg-white dark:bg-gray-800 dark:bg-opacity-10 rounded-lg p-4")}>
        <div className="flex items-start gap-3 justify-center">
            <Menu trigger={<Avatar className="w-10 h-10 shrink-0">
                {message?.user === "USER" ? <PersonIcon/> : <AutoAwesomeIcon/>}
            </Avatar>}>
                <MenuItem dense onClick={onRemove}>Remove</MenuItem>
            </Menu>

            <div className="mt-3 flex-1 text-gray-700 dark:text-gray-200">

                {message
                    ? (message.user === "USER"
                        ? <UserMessage text={message.text}/>
                        : <SystemMessage text={message.text}
                                         loading={message.loading}
                                         dataSources={dataSources}
                                         canRegenerate={canRegenerate}
                                         containerWidth={containerWidth ?? undefined}
                                         onRegenerate={onRegenerate}
                                         onUpdatedMessage={onUpdatedMessageInternal}
                                         onFeedback={onFeedback}/>)
                    : null}

            </div>
        </div>
    </div>;
}

function UserMessage({ text }: { text: string }) {
    return <>{text.split("\n").map((line, index) => <p key={index}>{line}</p>)}</>
}
