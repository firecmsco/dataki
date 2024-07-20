import { Card, Skeleton, Typography } from "@firecms/ui";

export function PromptSuggestions({
                                      loading,
                                      suggestions,
                                      onPromptSuggestionClick
                                  }: {
    loading?: boolean,
    suggestions?: string[],
    onPromptSuggestionClick: (prompt: string) => void
}) {

    const promptSuggestions = (suggestions ?? []).length > 0
        ? suggestions
        : [
            "What can you do?",
            "What collections are available?",
            "Show me all products under 50 euros"
        ];

    return (
        <div className={"my-8"}>

            <Typography paragraph={true} className={"ml-4 my-2 mb-6"}>
                Here are some examples of things you can ask:
            </Typography>

            <div className={"flex gap-1 overflow-auto no-scrollbar"}>
                {!loading && (promptSuggestions ?? []).length > 0 && (promptSuggestions ?? []).map((prompt, index) => (
                    <PromptSuggestion key={index} onClick={onPromptSuggestionClick} prompt={prompt}/>
                ))}
                {loading && (
                    Array.of(1, 2, 3, 4,).map((index) => (
                        <Skeleton key={index} width={297} height={112} className={"m-1"}/>
                    ))
                )}
            </div>

            <Typography variant={"caption"} color={"secondary"} paragraph={true} className={"ml-4 my-2"}>
                Note that these sample prompts are just suggestions.
            </Typography>

        </div>
    );
}

function PromptSuggestion({
                              prompt,
                              onClick
                          }: { prompt: string, onClick: (prompt: string) => void }) {
    return (
        <Card
            className={"shrink-0 px-4 pt-12 pb-4 border-none w-[320px] min-w-[140px] flex items-end overflow-hidden font-semibold"}
            onClick={() => onClick(prompt)}>
            <div className={"max-w-full"}>
                {prompt}
            </div>
        </Card>
    );
}
