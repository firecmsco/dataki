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
    params: { [key: string]: any };
    response: any
}

export type FeedbackSlug = "not_helpful"
    | "not_factually_correct"
    | "incorrect_code"
    | "unsafe_or_problematic"
    | "other"
    | null;
