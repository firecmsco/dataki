// @ts-ignore
import MarkdownIt from "markdown-it";

const md = new MarkdownIt({ html: true });

export type MarkdownElement = {
    type: "html" | "code";
    loading?: boolean;
    content: string;
};

export function parseMarkdown(text: string): MarkdownElement[] {
    const elements: MarkdownElement[] = [];
    const lines = text.split(/\r?\n/);
    let buffer: string[] = [];
    let inCodeBlock = false;

    for (const line of lines) {
        // Check if we encounter the start or end of a code block
        if (line.trim().toLowerCase().startsWith("```json") || line.trim().toLowerCase().startsWith("```json5") || (line.startsWith("```") && !inCodeBlock)) {
            // If buffer has content, add it as markdown element
            if (buffer.length) {
                elements.push({
                    type: "html",
                    content: md.render(buffer.join("\n"))
                });
                buffer = [];
            }
            inCodeBlock = true;
            continue;
        }
        // Check if we encounter the end of a code block
        else if (line.trim().startsWith("```") && inCodeBlock) {
            elements.push({
                type: "code",
                loading: true,
                content: buffer.join("\n")
            });
            buffer = [];
            inCodeBlock = false;
            continue;
        }

        // Accumulate lines
        buffer.push(line);
    }

    // Check if there's any remaining markdown content outside of code blocks
    if (buffer.length) {
        elements.push({
            type: inCodeBlock ? "code" : "html",
            content: inCodeBlock ? buffer.join("\n") : md.render(buffer.join("\n")),
            loading: false
        });
    }

    return elements;
}
