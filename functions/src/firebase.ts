import * as admin from "firebase-admin";

// this is a hack to avoid multiple initialization of firebase app in scripts
try {
    if (process.env.npm_lifecycle_event === "test")
        admin.initializeApp({ storageBucket: "firecms-dev-2da42.appspot.com" });
    else
        admin.initializeApp();
} catch (e) {
    console.warn("Error initializing app", e)
}

const firestoreDb: FirebaseFirestore.Firestore = admin.firestore();

try {
    firestoreDb.settings({ ignoreUndefinedProperties: true })
} catch (e) {
    console.warn("Error setting firestore settings", e)
}

export const firestore = firestoreDb;
// export const bucket = admin.storage().bucket();
export const firebaseAuth = admin.auth();


