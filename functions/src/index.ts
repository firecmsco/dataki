import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import { buildExpressApp } from "./app";

const expressApp = buildExpressApp();

setGlobalOptions({
    timeoutSeconds: 120,
    minInstances: 1,
    memory: "1GiB",
    region: "europe-west3"
});

// Expose Express API as a single Cloud Function:
export const datakiapi = onRequest(expressApp);

export { onNewUserCopyDemoDashboard } from "./functions/users";
