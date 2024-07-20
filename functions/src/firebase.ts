import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

let app;
// this is a hack to avoid multiple initialization of firebase app in scripts
try {
    app = initializeApp();
} catch (e) {
    console.warn("Error initializing app", e)
}
if (!app) {
    throw new Error("App not initialized");
}
const firestoreDb: FirebaseFirestore.Firestore = getFirestore(app)

try {
    firestoreDb.settings({ ignoreUndefinedProperties: true })
} catch (e) {
    console.warn("Error setting firestore settings", e)
}

export const firestore = firestoreDb;
// export const bucket = admin.storage().bucket();
export const firebaseAuth = getAuth(app);


