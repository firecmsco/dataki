export type ChatSession = {
    id: string;
    name?: string;
    created_at: Date;
    updated_at: Date;
    projectId?: string;
    dataSources: DataSource[];
    messages: ChatMessage[];
};

export type LLMOutput = {
    items: ChatSessionItem[];
    text: string;
}

export type DataRow = {
    [key: string]: any;
};

export type ChatMessage = {
    id: string;
    text: string;
    user: "USER" | "SYSTEM" | "FUNCTION_CALL";
    function_call?: FunctionCall;
    date: Date;
    loading?: boolean;
    negative_feedback?: {
        reason?: FeedbackSlug;
        message?: string;
    };
};

export type FunctionCall = {
    name: string;
    params: { sql: string };
    response: any
}

export type FeedbackSlug = "not_helpful"
    | "not_factually_correct"
    | "chart_is_incorrect"
    | "incorrect_code"
    | "unsafe_or_problematic"
    | "other"
    | null;

export type ChatSessionItem = LoadingItem | DryWidgetConfig | MarkdownTextItem;

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
    id?: string;
    title: string;
    projectId: string;
    dataSources: DataSource[];
    description: string;
    sql: string;
    type: "chart" | "table";
    chart?: object;
    table?: object;
    size?: WidgetSize
}

export type WidgetConfig = {
    title: string;
    projectId: string;
    dataSources: DataSource[];
    description: string;
    sql: string;
    type: "chart" | "table";
    chart?: ChartConfig,
    table?: TableConfig,
    size?: WidgetSize,
}

export type DashboardItem = DashboardWidgetConfig | TextItem;

export type TextItem = {
    id: string;
    type: "title" | "subtitle" | "text";
    text: string;
    position: Position,
    size: WidgetSize
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
        scales?: object
    }
};

export type TableConfig = {
    columns: TableColumn[]
};

export type TableColumn = { key: string, name: string, dataType?: DataType };

export type DataType = "string" | "number" | "date" | "object" | "array";

export type SQLDialect = "bigquery" | "postgresql" | "mysql";

export type Dashboard = {
    id: string;
    title?: string;
    description?: string;
    pages: DashboardPage[];
    users?: string[];
    owner?: string;
    permissions?: {
        uid: string,
        read: boolean;
        edit: boolean;
        delete: boolean;
    }[],
    created_at: Date,
    updated_at: Date,
    deleted?: boolean
}

export type DashboardPage = {
    id: string;
    title?: string;
    paper?: {
        size?: WidgetSize,
        position?: Position
    }
    widgets: DashboardItem[];
}

export type GCPProject = {
    name: string;
    projectId: string; // Unique identifier for the project
    projectNumber: string; // Unique number associated with the project
    createTime: string; // ISO 8601 date string
    labels: {
        [key: string]: string;
    };
    lifecycleState: "ACTIVE" | "DELETE_REQUESTED" | "DELETE_IN_PROGRESS" | "DELETED" | "PURGING";
    parent: {
        type: "organization" | "folder"; // Valid parent types
        id: string; // Parent ID is typically a string
    };
    // is this project linked to DataTalk with a Service Account?
    linked: boolean;
}

export type DateParams = {
    dateStart?: Date | null;
    dateEnd?: Date | null;
}

export type FilterOp =
    | "<"
    | "<="
    | "=="
    | "!="
    | ">="
    | ">"
// | "array-contains"
// | "in"
// | "not-in"
// | "array-contains-any"
    ;
