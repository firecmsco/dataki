import React, { useEffect, useMemo, useRef, useState } from "react";
import { randomString, useAuthController, useSnackbarController } from "@firecms/core";
import { Button, cls, fieldBackgroundHoverMixin, SendIcon, TextareaAutosize, Typography } from "@firecms/ui";
import { MessageView } from "./MessageView";
import { getDataTalkPromptSuggestions, streamDataTalkCommand } from "../../api";
import { ChatMessage, DateParams, DataSource, FeedbackSlug, ChatSession } from "../../types";
import { PromptSuggestions } from "./PromptSuggestions";
import { useDataTalk } from "../../DataTalkProvider";
import { DataSourcesSelection } from "../DataSourcesSelection";
import { PromptSuggestionsSmall } from "./PromptSuggestionsSmall";
import { DatePickerWithRange } from "../DateRange";
import { getInitialDateRange } from "../utils/dates";

const DEMO_DATA_SOURCES: DataSource[] = [{
    projectId: "bigquery-public-data",
    datasetId: "thelook_ecommerce"
}];

function getInitialProject(session: ChatSession, uid: string) {
    if (session.projectId)
        return session.projectId;

    const savedLocally = loadLastProjectLocally(uid);
    if (savedLocally) {
        return savedLocally;
    }

    return DEMO_DATA_SOURCES[0].projectId;
}

function getInitialDataSources(session: ChatSession, uid: string) {
    if (session.dataSources && session.dataSources.length > 0) {
        return session.dataSources;
    }
    const savedLocally = loadDataSourceLocally(uid);
    if (savedLocally) {
        return savedLocally;
    }
    return DEMO_DATA_SOURCES;
}

export function DataTalkChatSession({
                                        session,
                                        initialPrompt,
                                        onAnalyticsEvent,
                                        onMessagesChange,
                                        onDataSourcesChange,
                                        onProjectIdChange
                                    }: {
    session: ChatSession,
    initialPrompt?: string,
    onAnalyticsEvent?: (event: string, params?: any) => void,
    onMessagesChange?: (messages: ChatMessage[]) => void,
    onDataSourcesChange?: (dataSources: DataSource[]) => void,
    onProjectIdChange?: (projectId: string) => void
}) {

    const authController = useAuthController();
    if (!authController.user) {
        throw new Error("User not authenticated");
    }
    const { uid } = authController.user;

    const snackbar = useSnackbarController();

    const [projectId, setProjectId] = useState<string | undefined>(getInitialProject(session, uid));
    // const [projectId, setProjectId] = useState<string | undefined>("bigquery-public-data");

    const [samplePrompts, setSamplePrompts] = useState<string[]>([]);
    const [samplePromptsLoading, setSamplePromptsLoading] = useState<boolean>(false);

    const [dataSources, setDataSources] = useState<DataSource[]>(getInitialDataSources(session, uid));

    const [textInput, setTextInput] = useState<string>("");

    const [messages, setMessages] = useState<ChatMessage[]>(session.messages || []);
    const [messageLoading, setMessageLoading] = useState<boolean>(false);

    const [dateRange, setDateRange] = useState<[Date | null, Date | null]>(getInitialDateRange());

    const params: DateParams = useMemo(() => ({
        dateStart: dateRange[0] ?? null,
        dateEnd: dateRange[1] ?? null
    }), [dateRange]);

    const ongoingPromptSuggestionRequest = useRef<boolean>(false);
    useEffect(() => {
        if (ongoingPromptSuggestionRequest.current) return;
        if (dataSources.length > 0) {
            const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
            const shouldLoadSamplePrompts = !lastMessage || (lastMessage.user === "SYSTEM" && !lastMessage.loading);

            console.log("Loading sample prompts");
            if (shouldLoadSamplePrompts) {
                ongoingPromptSuggestionRequest.current = true;
                getAuthToken().then((firebaseToken) => {
                    setSamplePromptsLoading(true);
                    getDataTalkPromptSuggestions(firebaseToken, apiEndpoint, dataSources, messages)
                        .then(setSamplePrompts)
                        .finally(() => {
                            ongoingPromptSuggestionRequest.current = false;
                            setSamplePromptsLoading(false);
                        });
                });
            }
        }
    }, [dataSources, messages]);

    const updateProjectId = (projectId: string) => {
        setProjectId(projectId);
        onProjectIdChange?.(projectId);
        saveLastProjectLocally(uid, projectId);
    }

    const updateDataSources = (dataSources: DataSource[]) => {
        setDataSources(dataSources);
        onDataSourcesChange?.(dataSources);
        saveDataSourceLocally(uid, dataSources);
    }

    const {
        apiEndpoint,
        getAuthToken
    } = useDataTalk();

    useEffect(() => {
        scrollToBottom();
    }, []);

    useEffect(() => {
        if (projectId && initialPrompt && messages.length === 0) {
            submitMessage(initialPrompt);
        }
    }, []);

    const isUserScrolledDownRef = useRef(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        setTimeout(() => {
            scrollContainerRef.current?.scrollTo(scrollContainerRef.current?.scrollLeft, scrollContainerRef.current.scrollHeight);
        }, 10);
    };

    const handleScroll = (e: any) => {
        if (!scrollContainerRef.current) return;

        const {
            scrollTop,
            scrollHeight,
            clientHeight
        } = scrollContainerRef.current;
        // If user is not at the bottom
        if (scrollHeight - scrollTop >= clientHeight + 1) {
            isUserScrolledDownRef.current = false;
        } else {
            isUserScrolledDownRef.current = true;
        }
    };

    useEffect(() => {
        const observer = new IntersectionObserver((entries, observer) => {
            if (entries[0].isIntersecting && !isUserScrolledDownRef.current) {
                scrollToBottom();
            }
        }, {
            root: scrollContainerRef.current,
        });
        if (messagesEndRef.current) {
            observer.observe(messagesEndRef.current);
        }

        const resizeObserver = new ResizeObserver(() => {
            if (!isUserScrolledDownRef.current) {
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
    }, []);

    const submitMessage = async (messageText: string, baseMessages: ChatMessage[] = messages) => {

        if (!projectId) return;
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

        let currentMessages: ChatMessage[] = [
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
            projectId,
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
                if (isUserScrolledDownRef.current) {
                    scrollToBottom();
                }
            },
            (sqlQuery) => {
                console.log("Got SQL query", sqlQuery);
                const newMessages = [...currentMessages];
                // this message must go before the one with id systemMessageId
                const sqlMessage: ChatMessage = {
                    id: systemMessageId,
                    loading: false,
                    text: sqlQuery,
                    user: "SQL_STATEMENT",
                    date: new Date()
                };
                newMessages.push(sqlMessage);
                currentMessages = newMessages;
                setMessages(newMessages);

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
        if (!lastUserMessage) {
            throw new Error("No user message found");
        }
        // remove all messages after the last user message, including the last user message
        const indexOfLastUserMessage = newMessages.map(m => m.id).indexOf(lastUserMessage.id);
        newMessages.splice(indexOfLastUserMessage);

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
        newMessages.pop();

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

        <div className="relative h-full w-full flex flex-col ">
            <div className="h-full overflow-auto"
                 onScroll={handleScroll}
                 ref={scrollContainerRef}>
                <div className={"z-20 absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg"}>
                    <DatePickerWithRange dateRange={dateRange} setDateRange={setDateRange}/>
                </div>

                <div className="container mx-auto px-4 md:px-6 pt-8 flex-1 flex flex-col gap-4 mt-12">

                    {(messages ?? []).length === 0 &&

                        <div className={"my-8"}>
                            <Typography variant={"h3"} gutterBottom={true} className={"font-mono ml-4 my-2"}>
                                How can I help you?
                            </Typography>
                            <PromptSuggestions
                                loading={samplePromptsLoading}
                                suggestions={samplePrompts}
                                onPromptSuggestionClick={(prompt) => submitMessage(prompt)}/>
                        </div>}

                    {projectId && messages.map((message, index) => {
                        return <MessageView key={message.date.toISOString() + index}
                                            onRemove={() => {
                                                const newMessages = [...messages];
                                                newMessages.splice(index, 1);
                                                setMessages(newMessages);
                                                onMessagesChange?.(newMessages);
                                            }}
                                            params={params}
                                            onFeedback={(reason, feedbackMessage) => {
                                                saveFeedback(message, reason, feedbackMessage, index);
                                            }}
                                            onUpdatedMessage={(message) => {
                                                updateMessage(message, index);
                                            }}
                                            projectId={projectId}
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

                <div ref={messagesEndRef} style={{ height: 8 }}/>
            </div>

            <div
                className="w-full sticky bottom-0 right-0 left-0 pt-3 pb-6 dark:bg-gray-800 dark:bg-opacity-20 rounded-lg">

                <div className={"container mx-auto px-4 md:px-6 flex flex-col gap-2"}>
                    <div className={"flex flex-row gap-4"}>
                        <DataSourcesSelection projectId={projectId}
                                              setProjectId={updateProjectId}
                                              projectDisabled={messages.length > 0}
                                              dataSources={dataSources}
                                              setDataSources={updateDataSources}/>

                        {projectId && messages.length > 0 && <PromptSuggestionsSmall loading={samplePromptsLoading}
                                                                                     suggestions={samplePrompts}
                                                                                     onPromptSuggestionClick={(prompt) => submitMessage(prompt)}/>}
                    </div>
                    <form
                        noValidate
                        onSubmit={(e: React.FormEvent) => {
                            e.preventDefault();
                            if (!messageLoading && textInput && projectId)
                                submitMessage(textInput);
                        }}
                        autoComplete="off"
                        className="relative bg-white dark:bg-gray-800 rounded-full flex items-center gap-2 ">
                        <TextareaAutosize
                            value={textInput}
                            autoFocus={true}
                            onKeyDown={handleKeyDown}
                            onChange={(e) => setTextInput(e.target.value)}
                            className={cls(fieldBackgroundHoverMixin, "flex-1 resize-none rounded-3xl p-4 border-none focus:ring-0 dark:bg-gray-800 dark:text-gray-200 pr-[80px] pl-8")}
                            placeholder="Type your message..."
                        />
                        <Button className={"rounded-3xl absolute right-0 top-0 m-1.5"} variant="text" type={"submit"}
                                disabled={!textInput || messageLoading || !projectId}>
                            <SendIcon color={"primary"}/>
                        </Button>
                    </form>
                </div>
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

function saveLastProjectLocally(uid: string, projectId: string) {
    localStorage.setItem("projectId:" + uid, projectId);
}

function loadLastProjectLocally(uid: string): string | null {
    return localStorage.getItem("projectId:" + uid);
}
