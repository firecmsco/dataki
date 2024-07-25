import { ChatMessage, DashboardParams, DataSource, DryWidgetConfig, GCPProject, Item, WidgetConfig } from "./types";
import { LLMOutputParser } from "./utils/llm_parser";

export async function streamDataTalkCommand(firebaseAccessToken: string,
                                            command: string,
                                            apiEndpoint: string,
                                            sessionId: string,
                                            projectId: string,
                                            sources: DataSource[],
                                            messages: ChatMessage[],
                                            onDelta: (delta: string) => void,
                                            onSQLQuery: (sqlQuery: string) => void
): Promise<string> {

    const parser = new LLMOutputParser((v) => console.log("Delta:", v));

    // eslint-disable-next-line no-async-promise-executor
    return new Promise<string>(async (resolve, reject) => {
        try {
            const history = messages.filter(message => message.user === "USER" || message.user === "SYSTEM");
            const response = await fetch(apiEndpoint + "/datatalk/command", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${firebaseAccessToken}`
                },
                body: JSON.stringify({
                    sessionId,
                    command,
                    projectId,
                    sources,
                    history
                })
            });

            if (!response.ok) {
                const data = await response.json();
                console.error("Error streaming data talk command", data);
                reject(new ApiError(data.message, data.code));
                return;
            }

            if (response.body) {
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = "";
                const result: Item[] = [];
                const processChunk = (chunk: ReadableStreamReadResult<Uint8Array>): void | Promise<void> => {
                    if (chunk.done) {
                        console.log("Stream completed", { result });
                        return;
                    }

                    // Decoding chunk value to text
                    const text = decoder.decode(chunk.value, { stream: true });
                    buffer += text;

                    // Split based on our special prefix and filter out empty strings
                    const parts = buffer.split("&$# ").filter(part => part.length > 0);

                    // // console.log("Message received:", text, parts);
                    // // Check if the last part is incomplete (no trailing prefix for next message)
                    // if (!text.endsWith("&$# ")) {
                    //     buffer = parts.pop() || ""; // Save incomplete part back to buffer, or empty it if there's none
                    // } else {
                    buffer = ""; // Reset buffer as all parts are complete
                    // }

                    // Process complete messages
                    parts.forEach(part => {
                        try {
                            const message = JSON.parse(part);
                            if (message.type === "delta") {
                                result.push(message.data.delta);
                                onDelta(message.data.delta);
                                parser.parseDelta(message.data.delta);
                            } else if (message.type === "sql") {
                                onSQLQuery(message.data.sqlQuery);
                            } else if (message.type === "result") {
                                console.log("Result received:", parser.getFinalState());
                                resolve(message.data);
                            }
                        } catch (error) {
                            console.error("Error parsing message part:", part, error);
                        }
                    });

                    // Read the next chunk
                    reader.read().then(processChunk);
                };

                // Start reading the stream
                reader.read().then(processChunk);
            }
        } catch (error) {
            console.error("Error streaming data talk command", error);
            reject(error);
        }
    });
}

export function hydrateChartConfig(firebaseAccessToken: string,
                                   apiEndpoint: string,
                                   config: DryWidgetConfig,
                                   params?: DashboardParams
): Promise<WidgetConfig> {
    return fetch(apiEndpoint + "/datatalk/hydrate_chart", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${firebaseAccessToken}`
        },
        body: JSON.stringify({
            config,
            params
        })
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new ApiError(data.message, data.code);
                });
            }
            return response.json();
        })
        .then(data => data.data);
}

export function hydrateTableConfig(firebaseAccessToken: string,
                                   apiEndpoint: string,
                                   config: DryWidgetConfig,
                                   params?: DashboardParams
): Promise<WidgetConfig> {
    return fetch(apiEndpoint + "/datatalk/hydrate_table", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${firebaseAccessToken}`
        },
        body: JSON.stringify({
            config,
            params
        })
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new ApiError(data.message, data.code);
                });
            }
            return response.json();
        })
        .then(data => data.data);
}

export function getDataTalkPromptSuggestions(firebaseAccessToken: string,
                                             apiEndpoint: string,
                                             dataSources: DataSource[],
                                             messages?: ChatMessage[]
): Promise<string[]> {
    const history = (messages ?? []).filter(message => message.user === "USER" || message.user === "SYSTEM");
    return fetch(apiEndpoint + "/datatalk/prompt_suggestions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${firebaseAccessToken}`
        },
        body: JSON.stringify({
            dataSources,
            history
        })
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new ApiError(data.message, data.code);
                });
            }
            return response.json();
        })
        .then(data => data.data);
}

export function fetchDataSourcesForProject(firebaseAccessToken: string, apiEndpoint: string, projectId: string): Promise<DataSource[]> {
    return fetch(apiEndpoint + "/projects/" + projectId + "/datasets",
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${firebaseAccessToken}`
            }
        }).then(response => {
        if (!response.ok) {
            return response.json().then(data => {
                throw new ApiError(data.message, data.code);
            });
        }
        return response.json();
    })
        .then(data => data.data);

}

export function createServiceAccountLink(firebaseAccessToken: string, apiEndpoint: string, projectId: string): Promise<boolean> {
    return fetch(apiEndpoint + "/projects/" + projectId + "/service_accounts",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${firebaseAccessToken}`
            }
        }).then(response => {
        if (!response.ok) {
            return response.json().then(data => {
                throw new ApiError(data.message, data.code);
            });
        }
        return response.json();
    })
        .then(data => data.data);

}

export function deleteServiceAccountLink(firebaseAccessToken: string, apiEndpoint: string, projectId: string): Promise<boolean> {
    return fetch(apiEndpoint + "/projects/" + projectId + "/service_accounts",
        {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${firebaseAccessToken}`
            }
        }).then(response => {
        if (!response.ok) {
            return response.json().then(data => {
                throw new ApiError(data.message, data.code);
            });
        }
        return response.json();
    })
        .then(data => data.data);

}

export class ApiError extends Error {

    public code?: string;

    constructor(message: string, code?: string) {
        super(message);
        this.code = code;
    }
}

export function fetchGCPProjects(firebaseAccessToken: string, apiEndpoint: string): Promise<GCPProject[]> {
    return fetch(apiEndpoint + "/projects",
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${firebaseAccessToken}`
            }
        }).then(response => {
        if (!response.ok) {
            return response.json().then(data => {
                throw new ApiError(data.message, data.code);
            });
        }
        return response.json();
    })
        .then(data => data.data);
}

/**
 * Generate the authorization URL for the OAuth2 flow
 *
 */
export async function generateAuthUrl(redirectUri: string, apiEndpoint: string) {
    const url = new URL(`${apiEndpoint}/oauth/generate_auth_url`);
    url.searchParams.append("redirect_uri", redirectUri);

    const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });

    if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
    }

    return response.json();
}

/**
 * Exchange the authorization code for an access token
 *
 */
export async function exchangeCodeForToken(redirectUri: string, code: string, apiEndpoint: string): Promise<Record<string, string>> {
    const url = new URL(`${apiEndpoint}/oauth/exchange_code_for_token`);
    url.searchParams.append("redirect_uri", redirectUri);
    url.searchParams.append("code", code);

    const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });

    if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
    }

    const json = await response.json();
    return json.data;
}

/**
 * Refresh the access token
 *
 */
export async function postUserCredentials(credentials: object, firebaseAccessToken: string, apiEndpoint: string) {
    const url = `${apiEndpoint}/oauth/credentials`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${firebaseAccessToken}`
        },
        body: JSON.stringify(credentials)
    });

    if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
    }

    return response.json();
}
