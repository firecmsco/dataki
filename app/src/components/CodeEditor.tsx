import { useModeController } from "@firecms/core";

import Editor, { loader } from "@monaco-editor/react";
import { useEffect, useRef } from "react";
import { Parser } from "node-sql-parser";

const parser = new Parser();

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

export type CodeEditorProps = {
    value?: string;
    autoHeight?: boolean;
    onChange?: (value?: string) => void;
    onMount?: (editor: any) => void;
    maxWidth?: number;
    loading?: boolean;
    defaultLanguage: string;
    sqlDialect?: string;
    onTextSelection?: (text: string) => void;
};

export function CodeEditor({
                               value,
                               autoHeight,
                               onChange,
                               maxWidth,
                               loading,
                               defaultLanguage,
                               sqlDialect,
                               onTextSelection,
                               ...props
                           }: CodeEditorProps) {
    const editorRef = useRef<any>(null);
    const monacoRef = useRef<any>(null);

    function onChangeInternal(value?: string) {
        onChange?.(value);
        if (value && defaultLanguage === "sql") {
            parseAndValidateSQL(value);
        }
    }

    function handleEditorDidMount(editor: any, monaco: any) {
        editorRef.current = editor;
        monacoRef.current = monaco;
    }

    const { mode } = useModeController();
    const lines = (value ?? "").split("\n").length;
    const height = autoHeight ? (Math.max(lines * 18, 72) + 8) + "px" : "100%";

    const parseAndValidateSQL = (sql: string) => {
        if (!sqlDialect) {
            throw new Error("CodeEditor: sqlDialect is required when language is sql");
        }
        const markers = [];

        try {
            parser.astify(sql, {
                database: sqlDialect
            });
        } catch (e: any) {
            console.error("parser", e);
            const { location } = e;
            if (location) {
                markers.push({
                    startLineNumber: location.start.line,
                    startColumn: location.start.column,
                    endLineNumber: location.end.line,
                    endColumn: location.end.column,
                    message: e.message,
                    severity: 8
                });
            }
        }
        monacoRef.current.editor.setModelMarkers(editorRef.current.getModel(), "sql", markers);
    };

    useEffect(() => {
        if (editorRef.current && maxWidth) {
            editorRef.current.layout({
                width: maxWidth,
                height
            })
        }
    }, [maxWidth, height]);

    return <Editor
        height={height}
        theme={mode === "dark" ? "vs-dark-custom" : "light"}
        className={"rounded-lg flex-1 border border-gray-100 dark:border-gray-800 dark:border-opacity-80"}
        defaultLanguage={defaultLanguage}
        value={value}
        onChange={onChangeInternal}
        onMount={handleEditorDidMount}
        options={{
            scrollBeyondLastLine: false,
            minimap: { enabled: false },
            readOnly: loading,
            wordWrap: "on",
            automaticLayout: true,
            scrollbar: {
                vertical: "hidden",
                alwaysConsumeMouseWheel: false
            }
        }}
        {...props}
    />
}
