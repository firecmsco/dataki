import React, { useEffect, useState } from "react";
import equal from "react-fast-compare"

import { MarkdownElement, parseMarkdown } from "../../utils/parser";
import {
    Button,
    CheckIcon,
    CloseIcon,
    ContentCopyIcon,
    Dialog,
    DialogActions,
    DialogContent,
    IconButton,
    Label,
    LoopIcon,
    Skeleton,
    TextField,
    ThumbDownOffAltIcon,
    Tooltip,
    Typography
} from "@firecms/ui";
import { FeedbackSlug, SQLDialect } from "../../types";
import { WidgetMessageView } from "./WidgetMessageView";

export function SystemMessage({
                                  text,
                                  loading,
                                  containerWidth,
                                  onRegenerate,
                                  canRegenerate,
                                  onFeedback,
                                  onUpdatedMessage,
                                  dialect
                              }: {
    text?: string,
    loading?: boolean,
    containerWidth?: number,
    onRegenerate?: () => void,
    canRegenerate?: boolean,
    onFeedback?: (reason?: FeedbackSlug, feedbackMessage?: string) => void,
    onUpdatedMessage?: (message: string) => void,
    dialect: SQLDialect
}) {

    const [parsedElements, setParsedElements] = useState<MarkdownElement[] | null>();

    useEffect(() => {
        if (text) {
            const markdownElements = parseMarkdown(text);
            setParsedElements(markdownElements);
        }
    }, [text]);

    const onUpdatedElements = (elements: MarkdownElement[]) => {
        const markdown = elements.map((element) => {
            if (element.type === "html") {
                return element.content;
            } else if (element.type === "widget") {
                return "```json\n" + element.content + "\n```";
            }
            throw new Error("Unknown element type");
        }).join("\n");
        onUpdatedMessage?.(markdown);
    }

    return <>

        {parsedElements && parsedElements.map((element, index) => {
            if (element.type === "html") {
                return <div
                    className={"max-w-full prose dark:prose-invert prose-headings:font-title text-base text-gray-700 dark:text-gray-200 mb-3"}
                    dangerouslySetInnerHTML={{ __html: element.content }}
                    key={index}/>;
            } else if (element.type === "widget") {
                return <WidgetMessageView key={index}
                                          loading={loading}
                                          rawDryConfig={element.content}
                                          maxWidth={containerWidth ? containerWidth - 90 : undefined}
                                          dialect={dialect}
                                          onContentModified={(updatedContent) => {
                                              console.log("Updated content", updatedContent);
                                              if (equal(updatedContent, parsedElements[index].content)) {
                                                  return;
                                              }
                                              const updatedElements = [...parsedElements];
                                              updatedElements[index] = {
                                                  type: "widget",
                                                  content: updatedContent
                                              };
                                              setParsedElements(updatedElements);
                                              onUpdatedElements(updatedElements);
                                          }}
                />;
            } else {
                console.error("Unknown element type", element);
                return null;
            }
        })}

        {loading && <Skeleton className={"max-w-4xl mt-1 mb-4"}/>}

        <div className={"mt-1 flex flex-row gap-1"}>
            {canRegenerate && <Tooltip title={"Regenerate"}>
                <IconButton size={"smallest"} disabled={loading} onClick={onRegenerate}>
                    <LoopIcon size={"smallest"}/>
                </IconButton>
            </Tooltip>}

            <Tooltip title={"Copy"}>
                <MessageCopyIcon text={text ?? ""} disabled={loading}/>
            </Tooltip>

            <BadMessageIcon disabled={loading}
                            onFeedback={onFeedback}/>
        </div>

    </>;
}

function MessageCopyIcon({
                             text,
                             disabled
                         }: {
    text: string,
    disabled?: boolean
}) {
    const [copied, setCopied] = useState(false);
    useEffect(() => {
        if (copied) {
            const timeout = setTimeout(() => {
                setCopied(false);
            }, 2000);
            return () => clearTimeout(timeout);
        }
        return undefined;
    }, [copied]);

    return <IconButton size={"smallest"}
                       disabled={disabled}
                       onClick={() => {
                           setCopied(true);
                           navigator.clipboard.writeText(text);
                       }}>
        {copied ? <CheckIcon size={"smallest"}/> : <ContentCopyIcon size={"smallest"}/>}
    </IconButton>;
}

function BadMessageIcon({
                            disabled,
                            onFeedback
                        }: {
    disabled?: boolean,
    onFeedback?: (reason?: FeedbackSlug, feedback?: string) => void,
}) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selected, setSelected] = useState<FeedbackSlug | null>(null);
    const [feedbackText, setFeedbackText] = useState<string>("");
    return <>

        <Tooltip title={dialogOpen ? undefined : "Bad response"}>
            <IconButton size={"smallest"}
                        disabled={disabled}
                        onClick={() => {
                            setDialogOpen(true);
                        }}>
                <ThumbDownOffAltIcon size={"smallest"}/>
            </IconButton>
        </Tooltip>

        <Dialog
            maxWidth={"xl"}
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            onOpenAutoFocus={(e) => {
                e.preventDefault();
            }}>
            <DialogContent className={"flex flex-col gap-4"}>
                <Typography variant={"label"}>
                    What was wrong with the response?
                </Typography>
                <div className={"flex flex-row gap-2 flex-wrap"}>
                    <FeedbackLabel title={"Not helpful"}
                                   value={"not_helpful"}
                                   selected={selected}
                                   setSelected={setSelected}/>
                    <FeedbackLabel title={"Not factually correct"}
                                   value={"not_factually_correct"}
                                   selected={selected}
                                   setSelected={setSelected}/>
                    <FeedbackLabel title={"Chart is incorrect"}
                                   value={"chart_is_incorrect"}
                                   selected={selected}
                                   setSelected={setSelected}/>
                    <FeedbackLabel title={"Incorrect code"}
                                   value={"incorrect_code"}
                                   selected={selected}
                                   setSelected={setSelected}/>
                    <FeedbackLabel title={"Unsafe or problematic"}
                                   value={"unsafe_or_problematic"}
                                   selected={selected}
                                   setSelected={setSelected}/>
                    <FeedbackLabel title={"Other"}
                                   value={"other"}
                                   selected={selected}
                                   setSelected={setSelected}/>
                </div>
                <TextField size={"smallest"}
                           value={feedbackText}
                           onChange={(e) => setFeedbackText(e.target.value)}
                           placeholder={"Feel free to add specific details"}></TextField>
            </DialogContent>
            <DialogActions>
                <Button variant={"outlined"}
                        onClick={() => {
                            setDialogOpen(false);
                            onFeedback?.(selected, feedbackText);
                        }}>Submit</Button>
            </DialogActions>

            <IconButton className={"absolute top-4 right-4"}
                        onClick={() => setDialogOpen(false)}>
                <CloseIcon/>
            </IconButton>
        </Dialog>
    </>;
}

function FeedbackLabel({
                           setSelected,
                           title,
                           value,
                           selected
                       }: {
    value: FeedbackSlug,
    title: string,
    selected: FeedbackSlug,
    setSelected: (value: FeedbackSlug | null) => void
}) {
    return <Label border={true}
                  className={value === selected ? "bg-gray-300 dark:bg-gray-700 hover:bg-gray-300 hover:dark:bg-gray-700" : ""}
                  onClick={() => {
                      setSelected(value);
                  }}>{title}</Label>;
}
