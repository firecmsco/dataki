import { useModeController } from "@firecms/core";

import Editor, { loader } from "@monaco-editor/react";
import { useEffect, useRef } from "react";

loader.init().then((monaco) => {
    monaco.editor.defineTheme("vs-dark-custom", {
        base: "vs-dark",
        inherit: true,
        rules: [],
        colors: {
            "editor.background": "#18181c"
        }
    });
});

export type AutoHeightEditorProps = {
    value?: string;
    onChange?: (value?: string) => void;
    onMount?: (editor: any) => void;
    maxWidth?: number;
    loading?: boolean;
    defaultLanguage: string;
};

export function AutoHeightEditor({
                                     value,
                                     onChange,
                                     maxWidth,
                                     loading,
                                     defaultLanguage,
                                     ...props
                                 }: AutoHeightEditorProps) {
    const editorRef = useRef<any>(null);

    function handleEditorDidMount(editor: any, monaco: any) {
        editorRef.current = editor;
    }

    const { mode } = useModeController();
    const lines = (value ?? "").split("\n").length;
    const height = Math.max(lines * 18, 72) + 8;

    useEffect(() => {
        if (editorRef.current && maxWidth) {
            editorRef.current.layout({
                width: maxWidth,
                height
            })
        }
    }, [maxWidth, height]);

    return <Editor
        height={height + "px"}
        theme={mode === "dark" ? "vs-dark-custom" : "light"}
        className={"rounded-lg flex-1 border border-gray-100 dark:border-gray-800 dark:border-opacity-80 overflow-hidden"}
        defaultLanguage={defaultLanguage}
        value={value}
        onChange={onChange}
        onMount={handleEditorDidMount}
        options={{
            scrollBeyondLastLine: false,
            minimap: { enabled: false },
            readOnly: loading,
            wordWrap: "on",
            // automaticLayout: true,
            scrollbar: {
                vertical: "hidden",
                alwaysConsumeMouseWheel: false
            }
        }}
        {...props}
    />;
}
