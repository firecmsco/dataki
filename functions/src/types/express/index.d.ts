// to make the file a module and avoid the TypeScript error

import { DecodedToken } from "../../models/auth";

export {}

declare global {
  namespace Express {
    export interface Request {
      firebaseTokenInfo?: DecodedToken
    }
  }
}
