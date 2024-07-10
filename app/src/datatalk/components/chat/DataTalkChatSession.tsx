import React, { useEffect, useRef, useState } from "react";
import { randomString, useSnackbarController } from "@firecms/core";
import { Button, SendIcon, TextareaAutosize, Typography } from "@firecms/ui";
import { MessageView } from "./MessageView";
import { getDataTalkSamplePrompts, streamDataTalkCommand } from "../../api";
import { ChatMessage, DataSource, FeedbackSlug, Session } from "../../types";
import { PromptSuggestions } from "./PromptSuggestions";
import { useDataTalk } from "../../DataTalkProvider";
import { DataSourcesSelection } from "../DataSourcesSelection";

const DEMO_DATA_SOURCES: DataSource[] = [{
    projectId: "bigquery-public-data",
    datasetId: "thelook_ecommerce"
}];

export function DataTalkChatSession({
                                        session,
                                        initialPrompt,
                                        onAnalyticsEvent,
                                        onMessagesChange,
                                        onDataSourcesChange
                                    }: {
    session: Session,
    initialPrompt?: string,
    onAnalyticsEvent?: (event: string, params?: any) => void,
    onMessagesChange?: (messages: ChatMessage[]) => void,
    onDataSourcesChange?: (dataSources: DataSource[]) => void
}) {

    const snackbar = useSnackbarController();

    const [samplePrompts, setSamplePrompts] = useState<string[]>([]);

    const initialDataSources = session.dataSources ?? DEMO_DATA_SOURCES;
    const [dataSources, setDataSources] = useState<DataSource[]>(initialDataSources);

    useEffect(() => {
        console.log("Loading sample prompts");
        getAuthToken().then((firebaseToken) => {
            getDataTalkSamplePrompts(firebaseToken, apiEndpoint, dataSources)
                .then(setSamplePrompts);
        });
    }, [dataSources]);

    const updateDataSources = (dataSources: DataSource[]) => {
        setDataSources(dataSources);
        onDataSourcesChange?.(dataSources);
        saveDataSourceLocally(session.id, dataSources);
    }

    const {
        apiEndpoint,
        getAuthToken
    } = useDataTalk();
    const [textInput, setTextInput] = useState<string>("");

    const [messages, setMessages] = useState<ChatMessage[]>(session.messages || []);
    const [messageLoading, setMessageLoading] = useState<boolean>(false);

    useEffect(() => {
        scrollToBottom();
    }, []);

    useEffect(() => {
        if (initialPrompt && messages.length === 0) {
            submitMessage(initialPrompt);
        }
    }, []);

    const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        setTimeout(() => {
            scrollContainerRef.current?.scrollTo(scrollContainerRef.current?.scrollLeft, scrollContainerRef.current.scrollHeight);
            // messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 20);
    };

    const handleScroll = () => {
        if (!scrollContainerRef.current) return;

        const {
            scrollTop,
            scrollHeight,
            clientHeight
        } = scrollContainerRef.current;
        // If user is not at the bottom
        if (scrollHeight - scrollTop > clientHeight + 100) {
            setIsUserScrolledUp(true);
        } else {
            setIsUserScrolledUp(false);
        }
    };

    useEffect(() => {
        const observer = new IntersectionObserver((entries, observer) => {
            if (entries[0].isIntersecting && !isUserScrolledUp) {
                scrollToBottom();
            }
        }, {
            root: scrollContainerRef.current,
        });
        if (messagesEndRef.current) {
            observer.observe(messagesEndRef.current);
        }

        const resizeObserver = new ResizeObserver(() => {
            if (!isUserScrolledUp) {
                scrollToBottom();
            }
        });

        if (scrollContainerRef.current) {
            resizeObserver.observe(scrollContainerRef.current);
        }

        return () => {
            observer.disconnect();
            if (scrollContainerRef.current) {
                resizeObserver.unobserve(scrollContainerRef.current);
            }
        };
    }, [isUserScrolledUp]);

    const submitMessage = async (messageText: string, baseMessages: ChatMessage[] = messages) => {

        if (!messageText) return;
        if (messageLoading) return;

        if (dataSources.length === 0) {
            snackbar.open({
                message: "You must specify at least one source",
                type: "warning"
            });
            return;
        }

        if (onAnalyticsEvent) {
            onAnalyticsEvent("message_sent", { message: messageText });
        }

        const userMessageId = randomString(20);
        const systemMessageId = randomString(20);

        const currentMessages: ChatMessage[] = [
            ...baseMessages,
            {
                id: userMessageId,
                text: messageText,
                user: "USER",
                date: new Date()
            }];
        onMessagesChange?.(currentMessages);
        setMessages([
            ...currentMessages,
            {
                id: systemMessageId,
                loading: true,
                text: "",
                user: "SYSTEM",
                date: new Date()
            }]);

        setTextInput("");
        scrollToBottom();

        const firebaseToken = await getAuthToken();
        let currentMessageResponse = "";

        setMessageLoading(true);
        streamDataTalkCommand(firebaseToken,
            messageText,
            apiEndpoint,
            session.id,
            dataSources,
            baseMessages,
            (newDelta) => {
                currentMessageResponse += newDelta;
                setMessages([
                    ...currentMessages,
                    {
                        id: systemMessageId,
                        loading: true,
                        text: currentMessageResponse,
                        user: "SYSTEM",
                        date: new Date()
                    }
                ]);
            })
            .then((newMessage) => {
                const updatedMessages: ChatMessage[] = [
                    ...currentMessages,
                    {
                        id: systemMessageId,
                        loading: false,
                        user: "SYSTEM",
                        date: new Date(),
                        text: newMessage
                    }
                ];
                setMessages(updatedMessages);
                onMessagesChange?.(updatedMessages);
            })
            .catch((e) => {
                console.error("Error processing command", e);
                const updatedMessages: ChatMessage[] = [
                    ...currentMessages,
                    {
                        id: systemMessageId,
                        loading: false,
                        text: "There was an **error** processing your command:\n\n" + (typeof e === "string" ? e.replace(/;/g, "\n") : e),
                        user: "SYSTEM",
                        date: new Date()
                    }
                ];
                setMessages(updatedMessages);
                onMessagesChange?.(updatedMessages);
            }).finally(() => {
            setMessageLoading(false);
        });

    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            submitMessage(textInput);
        }
    };

    const onRegenerate = (message: ChatMessage, index: number) => {
        if (onAnalyticsEvent) {
            onAnalyticsEvent("regenerate", { message });
        }

        console.log("Regenerating message", message, index);
        const newMessages = [...messages];
        newMessages.splice(index);
        const lastUserMessage = newMessages.filter(m => m.user === "USER").pop();
        newMessages.splice(index - 1);
        console.log("newMessages", newMessages);
        console.log("lastUserMessage", lastUserMessage);

        // get text from the last user message
        if (lastUserMessage) {
            submitMessage(lastUserMessage.text, newMessages);
        }
    };

    const onReSend = (message: ChatMessage, index: number) => {
        if (onAnalyticsEvent) {
            onAnalyticsEvent("resend", { message });
        }

        const newMessages = [...messages];
        newMessages.splice(index - 1);
        console.log("newMessages", newMessages);

        if (message) {
            submitMessage(message.text, newMessages);
        }
    };

    const saveFeedback = (message: ChatMessage, reason: FeedbackSlug | undefined, feedbackMessage: string | undefined, index: number) => {
        if (onAnalyticsEvent) {
            onAnalyticsEvent("bad_response", {
                reason,
                feedbackMessage
            });
        }
        // update the message with the feedback
        const newMessages = [...messages];
        const messageToUpdate = newMessages[index];
        if (messageToUpdate) {
            messageToUpdate.negative_feedback = {
                reason,
                message: feedbackMessage
            };
            setMessages(newMessages);
            onMessagesChange?.(newMessages);
        }
    };

    const updateMessage = (message: ChatMessage, index: number) => {
        const newMessages = [...messages];
        newMessages[index] = message;
        setMessages(newMessages);
        onMessagesChange?.(newMessages);
    }

    const lastMessage = (messages ?? []).length > 0 ? messages[messages.length - 1] : null;
    const lastMessageByUser = lastMessage?.user === "USER";

    return (

        <div className="h-full w-full flex flex-col bg-gray-50 dark:bg-gray-900">
            <div className="h-full overflow-auto"
                 onScroll={handleScroll}
                 ref={scrollContainerRef}>

                <div className="container mx-auto px-4 md:px-6 pt-8 flex-1 flex flex-col gap-4">

                    <DataSourcesSelection dataSources={dataSources}
                                          setDataSources={updateDataSources}
                                          className={"self-end"}/>

                    {(messages ?? []).length === 0 &&

                        <div className={"my-8"}>
                            <Typography variant={"h3"} gutterBottom={true} className={"font-mono ml-4 my-2"}>
                                Welcome to DATATALK
                            </Typography>
                            <PromptSuggestions
                                suggestions={samplePrompts}
                                onPromptSuggestionClick={(prompt) => submitMessage(prompt)}/>
                        </div>}

                    {messages.map((message, index) => {
                        return <MessageView key={message.date.toISOString() + index}
                                            onRemove={() => {
                                                const newMessages = [...messages];
                                                newMessages.splice(index, 1);
                                                setMessages(newMessages);
                                                onMessagesChange?.(newMessages);
                                            }}
                                            onFeedback={(reason, feedbackMessage) => {
                                                saveFeedback(message, reason, feedbackMessage, index);
                                            }}
                                            onUpdatedMessage={(message) => {
                                                updateMessage(message, index);
                                            }}
                                            dataSources={dataSources}
                                            message={message}
                                            canRegenerate={index === messages.length - 1 && message.user === "SYSTEM"}
                                            onRegenerate={() => onRegenerate(message, index)}/>;
                    })}

                    {!messageLoading && lastMessageByUser &&
                        <Button className={"ml-20"} variant={"outlined"} size={"small"}
                                onClick={() => onReSend(lastMessage, messages.length - 1)}>
                            Resend
                        </Button>}

                </div>

                <div ref={messagesEndRef} style={{ height: 24 }}/>
            </div>

            <div className="container sticky bottom-0 right-0 left-0 mx-auto px-4 md:px-6 pb-8 pt-4">
                <form
                    noValidate
                    onSubmit={(e: React.FormEvent) => {
                        e.preventDefault();
                        if (!messageLoading && textInput)
                            submitMessage(textInput);
                    }}
                    autoComplete="off"
                    className="relative bg-white dark:bg-gray-800 rounded-full flex items-center gap-2 ">
                    <TextareaAutosize
                        value={textInput}
                        autoFocus={true}
                        onKeyDown={handleKeyDown}
                        onChange={(e) => setTextInput(e.target.value)}
                        className="flex-1 resize-none rounded-3xl p-4 border-none focus:ring-0 dark:bg-gray-800 dark:text-gray-200 pr-[80px] pl-8"
                        placeholder="Type your message..."
                    />
                    <Button className={"rounded-3xl absolute right-0 top-0 m-1.5"} variant="text" type={"submit"}
                            disabled={!textInput || messageLoading}>
                        <SendIcon color={"primary"}/>
                    </Button>
                </form>
            </div>
        </div>
    )
}

function saveDataSourceLocally(uid: string, dataSources: DataSource[]) {
    localStorage.setItem("dataSources:" + uid, JSON.stringify(dataSources));
}

function loadDataSourceLocally(uid: string): DataSource[] | undefined {
    const data = localStorage.getItem("dataSources:" + uid);
    if (!data) {
        return undefined;
    }
    return JSON.parse(data);
}
