import { Request, Response } from "express";
import FireCMSException from "../types/exceptions";
import { makeGeminiRequest } from "../services/gemini";

export const processUserCommand = async (request: Request, response: Response) => {

    console.log(`Received request for command ${request.body.command} and project ${request.query.projectId}`);
    if (!request.body.command) {
        throw new FireCMSException(400, "Missing command param in the body", "Invalid request");
    }

    if (!request.body.sources) {
        throw new FireCMSException(400, "You must specify data sources in the body", "Invalid request");
    }

    response.writeHead(200, {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked"
    });

    const output = await makeGeminiRequest({
        userQuery: request.body.command,
        sources: request.body.sources,
        history: request.body.history || [],
        onDelta: (delta) => {
            console.log("Got delta", delta);
            response.write("&$# " + JSON.stringify({
                type: "delta",
                data: { delta }
            }));
        }
    });
    response.write("&$# " + JSON.stringify({
        type: "result",
        data: output
    }));
    response.end();
}
