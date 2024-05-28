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
