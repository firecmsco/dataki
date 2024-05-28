import JSON5 from "json5";
import { Item, LLMOutput } from "../types";

type Callback = (delta: Item) => void;

export class LLMOutputParser {
    private fullText = "";
    private buffer = "";
    private inCodeBlock = false;
    private codeContent: string[] = [];
    private finalContent: Item[] = [];
    private callback: Callback;

    constructor(callback: Callback) {
        this.callback = callback;
    }

    public parseDelta(delta: string) {
        this.fullText += delta;
        this.buffer += delta;
        this.processBuffer();
    }

    private addToCodeBlock(text: string) {
        const [before, after] = text.split(/```/);
        this.codeContent.push(before);
        if (after) {
            this.convertCurrentBlockToCode();
            this.buffer = after;
        }
    }

    // this code is horrible
    private processBuffer() {

        if (this.buffer.includes("```")) {
            // split the buffer into what is before the ```json and after with a regex
            const [before, after] = this.buffer.split(/```json|```json5|```JSON|```JSON5/);
            if (before && !before.trim().startsWith("```")) {
                this.onTextDelta(before);
            }
            if (after) {
                this.inCodeBlock = true;
                this.onTextDelta(after);
            }
        } else {
            const text = this.buffer;
            this.onTextDelta(text);
        }
    }

    private onTextDelta(text: string) {
        if (this.inCodeBlock) {
            this.addToCodeBlock(text);
            this.buffer = "";
        } else {
            const textDelta: Item = {
                type: "text",
                text: text
            };
            this.buffer = "";
            this.callback(textDelta);
            this.finalContent.push(textDelta);
        }
    }

    private convertCurrentBlockToCode() {
        this.inCodeBlock = false;
        const joinedCode = this.codeContent.join("");
        try {
            const jsonData = JSON5.parse(joinedCode);
            const dataDelta = {
                type: "data",
                ...jsonData
            };
            this.buffer = "";
            this.callback(dataDelta);
            this.finalContent.push(dataDelta);
        } catch (error) {
            console.log("Error parsing JSON:", joinedCode);
            const textDelta: Item = {
                type: "text",
                text: joinedCode
            };
            this.buffer = "";
            this.callback(textDelta);
            this.finalContent.push(textDelta);
        }
        this.codeContent = [];
    }

    public getFinalState(): LLMOutput {
        // Handle any remaining code block content
        if (this.inCodeBlock && this.codeContent.length > 0) {
            try {
                const jsonData = JSON5.parse(this.codeContent.join(""));
                this.finalContent.push({ type: "data", ...jsonData });
            } catch (error) {
                this.finalContent.push({ type: "text", text: this.codeContent.join("") });
            }
            this.codeContent = [];
            this.inCodeBlock = false;
        }

        // Merge contiguous text entries
        const mergedContent: Item[] = [];
        for (let i = 0; i < this.finalContent.length; i++) {
            const currentItem = this.finalContent[i];
            const prevItem = mergedContent[mergedContent.length - 1];
            if (currentItem.type === "text" && mergedContent.length > 0 && prevItem.type === "text") {
                // Merge with the last text item
                prevItem.text += currentItem.text;
            } else {
                // Push current item
                mergedContent.push(currentItem);
            }
        }

        return {
            items: mergedContent,
            text: this.fullText
        };
    }
}

// Usage:
// const callback: Callback = (delta) => {
//     console.log(delta);
// };
// const parser = new LLMOutputParser(callback);
//
// // Example usage with deltas:
// parser.parseDelta("Hey");
// parser.parseDelta("```");
// parser.parseDelta("json");
// parser.parseDelta("{ hey: 'there' }```");
//
// // Retrieve the final state
// const finalState = parser.getFinalState();
// console.log("Final State:", finalState);

