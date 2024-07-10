import { Card, Typography } from "@firecms/ui";

export function PromptSuggestions({
                                      suggestions,
                                      onPromptSuggestionClick
                                  }: {
    suggestions: string[],
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
            {promptSuggestions && <>
                <Typography paragraph={true} className={"ml-4 my-2 mb-6"}>
                    Here are some examples of things you can ask:
                </Typography>
                <div className={"flex gap-1 overflow-auto no-scrollbar"}>
                    {promptSuggestions.map((prompt, index) => (
                        <PromptSuggestion key={index} onClick={onPromptSuggestionClick} prompt={prompt}/>
                    ))}
                </div>
            </>}

            <Typography variant={"caption"} color={"secondary"} paragraph={true} className={"ml-4 my-2"}>
                Note that these sample prompts are generic and may not work with your specific data.
            </Typography>
            <Typography variant={"caption"} color={"secondary"} paragraph={true} className={"ml-4 my-2"}>
                You can&apos;t add additional imports or dependencies to the code snippets.
            </Typography>
        </div>
    );
}

function PromptSuggestion({
                              prompt,
                              onClick
                          }: { prompt: string, onClick: (prompt: string) => void }) {
    return (
        <Card className={"px-4 pt-12 pb-4 border-none w-[220px] min-w-[140px] font-semibold flex items-end"}
              onClick={() => onClick(prompt)}>
            {prompt}
        </Card>
    );
}
