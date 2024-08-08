import { runWith } from "firebase-functions";
import * as admin from "firebase-admin";
import { auth } from "firebase-admin";
import UserRecord = auth.UserRecord;

export const onNewUserCopyDemoDashboard = runWith({ timeoutSeconds: 30 })
    .region("europe-west3")
    .auth
    .user()
    .onCreate(async (user: UserRecord) => {

        console.log("Copying demo dashboard for user", user?.uid, user?.email);
        const email = user.email;
        if (!email) {
            return;
        }
        const firestore = admin.firestore();

        const dashboardId = "demo";
        const uid = user.uid;

        return await makeDashboardCopy(firestore, dashboardId, uid);
    });

async function makeDashboardCopy(firestore: FirebaseFirestore.Firestore, dashboardId: string, uid: string) {
    const demoDashboardDoc = await firestore.collection("dashboards").doc(dashboardId).get();
    return firestore.collection("dashboards").doc().set({
        ...demoDashboardDoc.data(),
        permissions: [{
            uid: uid,
            read: true,
            edit: true,
            delete: true
        }],
        owner: uid,
        created_at: new Date(),
        updated_at: new Date(),
        copied_from: dashboardId
    });
}
