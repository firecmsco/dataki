export type Session = {
    id: string;
    name?: string;
    created_at: Date;
    updated_at: Date;
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

export type Item = LoadingItem | DryWidgetConfig | MarkdownTextItem;

export type LoadingItem = {
    type: "loading";
}

export type MarkdownTextItem = {
    type: "text";
    text: string;
}

export type DataSource = BigQueryDataSource;
export type BigQueryDataSource = {
    projectId: string;
    datasetId: string;
}

export type DryWidgetConfig = {
    title: string;
    source: DataSource;
    description: string;
    sql: string;
    type: "chart" | "table";
    chart?: object;
    table?: object;
    size?: WidgetSize
}

export type WidgetConfig = {
    title: string;
    source: DataSource;
    description: string;
    sql: string;
    type: "chart" | "table";
    chart?: ChartConfig,
    table?: TableConfig,
    size?: WidgetSize,
}

export type DashboardWidgetConfig = DryWidgetConfig & {
    id: string;
    size: WidgetSize,
    position: Position
}

export type Position = {
    x: number,
    y: number
};

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

export type Dashboard = {
    id: string;
    title?: string;
    description?: string;
    pages: DashboardPage[];
    owner?: string;
    permissions?: {
        uid: string,
        read: boolean;
        edit: boolean;
    }[],
    created_at: Date,
    updated_at: Date,
    deleted?: boolean
}

export type DashboardPage = {
    id: string;
    title?: string;
    paper?: {
        size?: WidgetSize
    }
    widgets: DashboardWidgetConfig[];
}
