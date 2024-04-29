import { ExpressRouteFunc } from "./common";
import { Request, Response } from "express";


export const check = (): ExpressRouteFunc => {
  return (request: Request, response: Response) => {
    console.log(JSON.stringify({
      labels: {
        function_name: "check"
      },
      "endpoint": request.path,
      "message": "Health check"
    }))
    response.status(200).json({ "message": "Ok" });
  }
}

