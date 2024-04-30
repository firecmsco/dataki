import { buildSystemInstruction } from "../providers/prompt";
import { CommandMessage, DataContext } from "../models/command";
import { getVertexAI } from "../providers/llm";

export const generateCodeForCommand = async (command: string,
                                             history: Array<CommandMessage>,
                                             dataContext: DataContext,
                                             onDelta?: (delta: string) => void
) => {
    const systemInstruction = buildSystemInstruction(dataContext)
    console.log("Result prompt");
    console.log(systemInstruction);
    const geminiModel = await getVertexAI();
    const chat = geminiModel.startChat({
        systemInstruction: {
            parts: [{ text: systemInstruction }],
            role: "user"
        },
        history: history.map((message) => ({
            parts: [{ text: message.text }],
            role: message.user === "SYSTEM"
                ? "model"
                : "user"
        }))
    });

    if (onDelta) {
        const result = await chat.sendMessageStream(command);
        let totalDelta = "";
        for await (const item of result.stream) {
            const delta = item.candidates?.[0].content.parts[0].text;
            if (delta) {
                onDelta(delta);
                totalDelta += delta;
            }
        }
        return totalDelta;
    }
    else {
        const llmResult = await chat.sendMessage(command);
        const candidates = llmResult.response.candidates;
        console.log(`Got a total of ${candidates?.length} candidates`);
        if (candidates && candidates.length > 0) {
            const firstCandidate = candidates[0];
            console.log(firstCandidate.content.parts);
            return firstCandidate.content.parts.map((part) => part.text).join("");
        }
        throw new Error("No code generate");
    }
}
