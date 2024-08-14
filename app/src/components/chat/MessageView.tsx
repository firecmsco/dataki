import { AutoAwesomeIcon, Avatar, Button, cls, Menu, MenuItem, PersonIcon, Sheet, StorageIcon } from "@firecms/ui";
import React, { useEffect, useRef, useState } from "react";
import { ChatMessage, FeedbackSlug, FunctionCall, SQLDialect } from "../../types";
import { SystemMessage } from "./SystemMessage";
// @ts-ignore
import MarkdownIt from "markdown-it";
import { SQLQueryView } from "../SQLQueryView";
import { useChatSession } from "./DatakiChatSession";

export function MessageView({
                                message,
                                onRemove,
                                onRegenerate,
                                canRegenerate,
                                onFeedback,
                                onUpdatedMessage,
                                dialect
                            }: {
    message?: ChatMessage,
    onRemove?: () => void,
    onRegenerate?: () => void,
    canRegenerate?: boolean,
    onFeedback?: (reason?: FeedbackSlug, feedbackMessage?: string) => void,
    onUpdatedMessage?: (message: ChatMessage) => void,
    dialect: SQLDialect
}) {

    const ref = useRef<HTMLDivElement>(null);

    const onUpdatedMessageInternal = (updatedText: string) => {
        if (!message) return;
        if (onUpdatedMessage) onUpdatedMessage({
            ...message,
            text: updatedText
        });
    }
    const onUpdatedFunctionCall = (functionCall: FunctionCall) => {
        console.log("onUpdatedFunctionCall", functionCall);
        if (!message) return;
        if (onUpdatedMessage) onUpdatedMessage({
            ...message,
            text: functionCall.params.sql,
            function_call: functionCall
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

    const bgColor = message?.user === "FUNCTION_CALL"
        ? "bg-slate-200 dark:bg-slate-800"
        : (message?.user === "SYSTEM" ? "bg-transparent dark:bg-transparent" : "bg-white dark:bg-gray-800 dark:bg-opacity-20");

    const padding = message?.user === "FUNCTION_CALL" ? "py-1 px-4" : "p-4";

    return <div ref={ref}
                className={cls("flex flex-col gap-2 rounded-3xl", bgColor, padding)}>
        <div className="flex items-start gap-3 justify-center">
            <Menu trigger={<Avatar className="w-10 h-10 shrink-0">
                {message?.user === "USER" && <PersonIcon/>}
                {message?.user === "SYSTEM" && <AutoAwesomeIcon/>}
                {message?.user === "FUNCTION_CALL" && <StorageIcon/>}
            </Avatar>}>
                <MenuItem dense onClick={onRemove}>Remove</MenuItem>
            </Menu>

            {/*<Avatar className="w-10 h-10 shrink-0">*/}
            {/*    {message?.user === "USER" && <PersonIcon/>}*/}
            {/*    {message?.user === "SYSTEM" && <AutoAwesomeIcon/>}*/}
            {/*    {message?.user === "FUNCTION_CALL" && <StorageIcon/>}*/}
            {/*</Avatar>*/}

            <div className={cls(message?.user === "FUNCTION_CALL" ? "my-1" : "mt-3 mb-1 min-h-[32px]",
                "flex-1 text-gray-700 dark:text-gray-200 self-center")}>

                {message?.user === "USER" && <UserMessage text={message.text}/>}
                {message?.user === "FUNCTION_CALL" && message.function_call &&
                    <FunctionCallMessage text={message.text}
                                         functionCall={message.function_call}
                                         onUpdatedFunctionCall={onUpdatedFunctionCall}/>}
                {message?.user === "SYSTEM" && <SystemMessage text={message.text}
                                                              loading={message.loading}
                                                              canRegenerate={canRegenerate}
                                                              containerWidth={containerWidth ?? undefined}
                                                              onRegenerate={onRegenerate}
                                                              onUpdatedMessage={onUpdatedMessageInternal}
                                                              onFeedback={onFeedback}
                                                              dialect={dialect}/>}

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

function FunctionCallMessage({
                                 text,
                                 functionCall,
                                 onUpdatedFunctionCall
                             }: {
    text: string,
    functionCall: FunctionCall,
    onUpdatedFunctionCall: (updatedFunctionCall: FunctionCall) => void
}) {

    const chatSession = useChatSession();
    const [editorOpen, setEditorOpen] = useState(false);

    const [html, setHtml] = useState<string | null>(null);
    useEffect(() => {
        setHtml(md.render(text));
    }, [text]);
    if (!html)
        return null;
    return <>
        <div className={"flex flex-row gap-4"}>
            <code
                className={"text-sm self-center max-w-full prose dark:prose-invert prose-headings:font-title text-gray-700 dark:text-gray-200 mb-1 flex-grow"}
                dangerouslySetInnerHTML={{ __html: html }}/>
            <Button
                variant={"text"} onClick={() => setEditorOpen(true)}>
                Run
            </Button>
        </div>

        <Sheet
            open={editorOpen}
            onOpenChange={setEditorOpen}
            side={"bottom"}>
            <div className={"h-[90vh]"}>
                {editorOpen && <SQLQueryView
                    initialSql={text}
                    params={chatSession.params}
                    dataSources={chatSession.dataSources}
                    onSaved={async (sql) => {
                        if (sql) {
                            const updatedFunctionCall = {
                                ...functionCall,
                                params: {
                                    ...functionCall.params,
                                    sql
                                }
                            };
                            onUpdatedFunctionCall(updatedFunctionCall)
                        }
                    }}
                />}
            </div>

        </Sheet>
    </>

}
