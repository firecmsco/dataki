export type Session = {
    id: string;
    name?: string;
    created_at: Date;
    messages: ChatMessage[];
};

export type LLMOutput = {
    items: Item[];
    text: string;
}

export type DataRow = {
    [key: string]: any;
};

export type ChatMessage = {
    id: string;
    text: string;
    user: "USER" | "SYSTEM";
    date: Date;
    loading?: boolean;
    negative_feedback?: {
        reason?: FeedbackSlug;
        message?: string;
    };
};

export type FeedbackSlug = "not_helpful"
    | "not_factually_correct"
    | "incorrect_code"
    | "unsafe_or_problematic"
    | "other"
    | null;

export type Item = LoadingItem | DryWidgetConfig | MardownTextItem;

export type LoadingItem = {
    type: "loading";
}

export type MardownTextItem = {
    type: "text";
    text: string;
}

export type DryWidgetConfig = {
    title: string;
    description: string;
    sql: string;
    type: "chart" | "table";
    size?: WidgetSize
}

export type WidgetConfig = {
    title: string;
    description: string;
    sql: string;
    type: "chart" | "table";
    chart?: ChartConfig,
    table?: TableConfig,
    size?: WidgetSize
}

export type WidgetSize = { width: number, height: number };

export type ChartConfig = {
    type: string;
    data: {
        labels: string[];
        datasets: Array<{
            label: string;
            data: string[];
            backgroundColor: string[];
        }>;
    },
    options?: {
        plugins?: {
            legend?: {
                position: string;
            }
        },
        scales?: {}
    }
};

export type TableConfig = {
    data: DataRow[];
    columns: TableColumn[]
};

export type TableColumn = { key: string, name: string, dataType: DataType };

export type DataType = "string" | "number" | "date" | "object" | "array";

