import { NextFunction, Request, Response } from "express";

export type FireCMSResponse<T> = {
    data: T
}
export type ExpressRouteFunc<INPUT = object, OUTPUT = object> = (req: Request<any, FireCMSResponse<OUTPUT>, INPUT>, res: Response<FireCMSResponse<OUTPUT>>, next: NextFunction) => void | Promise<void>;
