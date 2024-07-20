import { Label, Skeleton } from "@firecms/ui";

export function PromptSuggestionsSmall({
                                           loading,
                                           suggestions,
                                           onPromptSuggestionClick
                                       }: {
    loading?: boolean,
    suggestions?: string[],
    onPromptSuggestionClick: (prompt: string) => void
}) {

    return (
        <div className={"shrink flex-no-wrap flex flex-row gap-4 overflow-auto no-scrollbar"}>
            {!loading && (suggestions ?? []).length > 0 && (suggestions ?? []).map((prompt, index) => (
                <PromptSuggestionSmall key={index} onClick={onPromptSuggestionClick} prompt={prompt}/>
            ))}
            {loading && (
                Array.of(1, 2, 3).map((index) => (
                    <Skeleton
                        key={index} width={297} height={36} className={"grow-0 shrink-0"}/>
                ))
            )}
        </div>
    );
}

function PromptSuggestionSmall({
                                   prompt,
                                   onClick
                               }: { prompt: string, onClick: (prompt: string) => void }) {
    return (
        <Label
            className={"px-3 py-2 font-semibold border rounded grow-0 shrink-0"}
            onClick={() => onClick(prompt)}>
            {prompt}
        </Label>
    );
}
