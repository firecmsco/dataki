import { AutoAwesomeIcon, Avatar, cls, Menu, MenuItem, PersonIcon, StorageIcon } from "@firecms/ui";
import React, { useEffect, useRef, useState } from "react";
import { ChatMessage, FeedbackSlug } from "../../types";
import { SystemMessage } from "./SystemMessage";
// @ts-ignore
import MarkdownIt from "markdown-it";

export function MessageView({
                                message,
                                onRemove,
                                onRegenerate,
                                canRegenerate,
                                onFeedback,
                                onUpdatedMessage,
                            }: {
    message?: ChatMessage,
    onRemove?: () => void,
    onRegenerate?: () => void,
    canRegenerate?: boolean,
    onFeedback?: (reason?: FeedbackSlug, feedbackMessage?: string) => void,
    onUpdatedMessage?: (message: ChatMessage) => void,
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
        : (message?.user === "SYSTEM" ? "bg-transparent dark:bg-transparent" : "bg-white dark:bg-gray-800 dark:bg-opacity-20");

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

            <div className={cls(message?.user === "SQL_STATEMENT" ? "my-1" : "mt-3 mb-1 min-h-[32px]",
                "flex-1 text-gray-700 dark:text-gray-200 self-center")}>

                {message?.user === "USER" && <UserMessage text={message.text}/>}
                {message?.user === "SQL_STATEMENT" && <SQLStatementMessage text={message.text}/>}
                {message?.user === "SYSTEM" && <SystemMessage text={message.text}
                                                              loading={message.loading}
                                                              canRegenerate={canRegenerate}
                                                              containerWidth={containerWidth ?? undefined}
                                                              onRegenerate={onRegenerate}
                                                              onUpdatedMessage={onUpdatedMessageInternal}
                                                              onFeedback={onFeedback}/>}

            </div>
        </div>
    </div>;
}

const md = new MarkdownIt({ html: true });

function UserMessage({ text }: { text: string }) {
    const [html, setHtml] = useState<string | null>(null);
    useEffect(() => {
        setHtml(md.render(text));
    }, [text]);
    if (!html)
        return null;
    return <div
        className={"max-w-full prose dark:prose-invert prose-headings:font-title text-base text-gray-700 dark:text-gray-200 mb-3"}
        dangerouslySetInnerHTML={{ __html: html }}/>
    // return <>{text.split("\n").map((line, index) => <p key={index}>{line}</p>)}</>
}

function SQLStatementMessage({ text }: { text: string }) {
    const [html, setHtml] = useState<string | null>(null);
    useEffect(() => {
        setHtml(md.render(text));
    }, [text]);
    if (!html)
        return null;
    return <code
        className={"text-sm self-center max-w-full prose dark:prose-invert prose-headings:font-title text-gray-700 dark:text-gray-200 mb-3"}
        dangerouslySetInnerHTML={{ __html: html }}>
    </code>
}
