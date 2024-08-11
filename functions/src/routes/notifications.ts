import express, { Request, Response } from "express";
import { corsAllAllowed } from "../cors";
import { ExpressRouteFunc } from "./common";
import { firestore } from "../firebase";
import { FieldValue } from "firebase-admin/firestore";

const notificationsRouter = express.Router();

notificationsRouter.options("/newsletter", corsAllAllowed(), (request, response) => response.status(200));
notificationsRouter.post("/newsletter", corsAllAllowed(), subscribeToNewsletter());

export default notificationsRouter;

type NewsletterSubscription = {
    email_address: string;
    source?: string;
};

function subscribeToNewsletter(): ExpressRouteFunc<NewsletterSubscription> {
    return async (request: Request, response: Response) => {
        const {
            email_address,
            source,
            interested_in_databases
        } = request.body;
        console.log("Subscribing to newsletter");
        console.log("email", email_address)
        if (!email_address)
            throw Error("Missing email");

        const notificationsRef = firestore.collection("notifications").doc(email_address);
        await notificationsRef.set({
            newsletter: {
                subscribed: true,
                source: source ?? null,
                subscribed_on: FieldValue.serverTimestamp(),
                interested_in_databases: interested_in_databases ?? null
            }
        }, { merge: true });

        response.json({ data: { email_address } });
    }
}
