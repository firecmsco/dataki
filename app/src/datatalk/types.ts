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
    // items: Item[];
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

export type Item = LoadingItem | DryChartConfigItem | MardownTextItem;

export type LoadingItem = {
    type: "loading";
}

export type MardownTextItem = {
    type: "text";
    text: string;
}

export type DryChartConfigItem = {
    sql: string;
    type: "chart" | "table";
    chart?: {
        type: string;
        data: {
            labels: string;
            datasets: Array<{
                label: string;
                data: string;
                backgroundColor: string[];
            }>;
        }
    };
}


export type ChartConfigItem = {
    sql: string;
    type: "chart" | "table";
    data: DataRow[];
    chart?: {
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
            scales?: {
            }
        }
    };
}
