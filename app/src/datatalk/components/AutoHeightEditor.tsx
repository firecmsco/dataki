import { useModeController } from "@firecms/core";

import Editor from "@monaco-editor/react";
import { useEffect, useRef } from "react";

export type AutoHeightEditorProps = {
    value?: string;
    onChange?: (value?: string) => void;
    onMount?: (editor: any) => void;
    maxWidth?: number;
};

export function AutoHeightEditor({
                                     value,
                                     onChange,
                                     maxWidth,
                                     ...props
                                 }: AutoHeightEditorProps): JSX.Element {
    const editorRef = useRef<any>(null);

    function handleEditorDidMount(editor: any, monaco: any) {
        editorRef.current = editor;
    }

    const { mode } = useModeController();
    const lines = (value ?? "").split("\n").length;
    const height = Math.max(lines * 18, 72) + 4;

    useEffect(() => {
        if (editorRef.current && maxWidth) {
            editorRef.current.layout({
                width: maxWidth,
                height: height
            })
        }
    }, [maxWidth, height]);


    return <Editor
        height={height + "px"}
        theme={mode === "dark" ? "vs-dark" : "light"}
        className={"rounded-lg flex-1 border dark:border-gray-800"}
        defaultLanguage="javascript"
        value={value}
        onChange={onChange}
        onMount={handleEditorDidMount}
        options={{
            scrollBeyondLastLine: false,
            minimap: { enabled: false },
            // automaticLayout: true,
            scrollbar: {
                vertical: "hidden",
                alwaysConsumeMouseWheel: false
            },
        }}
        {...props}
    />;
}
