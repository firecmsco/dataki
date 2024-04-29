import {GenerativeModelPreview, VertexAI} from "@google-cloud/vertexai";
import {getGoogleProjectId} from "../services/auth";

export const getVertexAI = async (): Promise<GenerativeModelPreview> => {
    const projectId = await getGoogleProjectId();
    const vertex_ai = new VertexAI({
        project: projectId,
        location: "europe-west3"
    });
    const model = "gemini-1.5-pro-preview-0409";
    return vertex_ai.preview.getGenerativeModel({
        model: model,
        generationConfig: {
            maxOutputTokens: 1024,
            temperature: 1,
            topP: 0.95
        }
    });
}
