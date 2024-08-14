import Editor from "@monaco-editor/react";
import { useModeController } from "@firecms/core";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useState } from "react";
import { Button, Typography } from "@firecms/ui";

import { format } from "sql-formatter";
import { DataSource } from "../types";

/**
 * This view allows you to run SQL queries and see the output
 * @constructor
 */
export function SQLEditor({
                              initialSql,
                              dataSources
                          }: { initialSql?: string, dataSources: DataSource[] }) {

    const [sql, setSql] = useState<string | undefined>(initialSql ? format(initialSql, { language: "bigquery" }) : undefined);

    const { mode } = useModeController();
    return <div className={"flex flex-col h-full w-full px-4 sm:px-8 md:px-16 lg:px-24 xl:px-32 2xl:px-64 py-4"}>

        <div className={"flex flex-row gap-4 mt-8 mb-4 items-baseline"}>
            <Typography className={"flex-grow "} variant={"label"}>
                SQL Editor
            </Typography>
            <Button variant={"outlined"}>
                Run
            </Button>
        </div>

        <PanelGroup direction="vertical" className={"flex-grow"}>
            <Panel maxSize={75} defaultSize={40}>
                <Editor
                    height={"100%"}
                    theme={mode === "dark" ? "vs-dark-custom" : "light"}
                    className={"rounded-lg flex-1 border border-gray-100 dark:border-gray-800 dark:border-opacity-80 overflow-hidden"}
                    defaultLanguage={"sql"}
                    value={sql}
                    onChange={setSql}
                    // onMount={handleEditorDidMount}
                    options={{
                        scrollBeyondLastLine: false,
                        minimap: { enabled: false },
                        wordWrap: "on",
                        // automaticLayout: true,
                        scrollbar: {
                            vertical: "hidden",
                            alwaysConsumeMouseWheel: false
                        }
                    }}
                />
            </Panel>
            <PanelResizeHandle className={"h-6"}/>
            <Panel maxSize={75} className={"bg-blue-500"}>
                bottom
            </Panel>
        </PanelGroup>

    </div>
}
