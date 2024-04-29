import { NextFunction, Request, Response } from "express";
import { ExpressRouteFunc, FireCMSResponse } from "./common";
import FireCMSException from "../models/exceptions";
import { generateCodeForCommand } from "../services/command";
import { CommandMessage, CommandRequest } from "../models/command";
import { getProjectContextData } from "../services/local_cache";

const handleStreamingRequest = async (request: Request, response: Response) => {
    response.writeHead(200, {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked"
    });
    const dataContext = await getProjectContextData();
    const commandResult = await generateCodeForCommand(request.body.command, request.body.history ?? [], dataContext, (delta) => {
        console.log("Got delta", delta);
        response.write("&$# " + JSON.stringify({
            type: "delta",
            data: { delta }
        }));
    });
    response.write("&$# " + JSON.stringify({
        type: "result",
        data: {
            text: commandResult,
            user: "SYSTEM"
        }
    }));
    response.end();
}

const handleSyncRequest = async (request: Request, response: Response) => {
    const dataContext = await getProjectContextData();
    console.log("Received sync request")
    const commandResult = await generateCodeForCommand(request.body.command, request.body.history ?? [], dataContext);
    response.json({
        type: "result",
        data: {
            text: commandResult,
            user: "SYSTEM"
        }
    });
}


export const command = (): ExpressRouteFunc<CommandRequest> => {
    return async (request: Request<{
        projectId: string
    }, FireCMSResponse<CommandMessage>, CommandRequest>, response: Response<FireCMSResponse<CommandMessage>>, next: NextFunction) => {
        console.log(`Received request for command ${request.body.command} and project ${request.query.projectId}`);
        if (!request.body.command) {
            throw new FireCMSException(400, "Invalid request", "Missing command");
        }
        const useStreamingRequest = request.query.useStreaming?.toString() === "true" ?? true;
        console.log(`Using streaming request: ${useStreamingRequest}`)
        if (useStreamingRequest) return handleStreamingRequest(request, response);
        else return handleSyncRequest(request, response);
    }
}
