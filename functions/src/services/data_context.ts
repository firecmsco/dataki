import { DataContext } from "../models/command";
import { firestore } from "../firebase";


const getSampleDataFromCollection = async (delegatedFirestore: FirebaseFirestore.Firestore, collectionName: string): Promise<{
    data: object[],
    collection: string
}> => {
    const collectionRef = delegatedFirestore.collection(collectionName);
    const snapshot = await collectionRef.limit(4).get();
    const data = snapshot.docs.map(doc => doc.data());
    return {
        data,
        collection: collectionName
    };
}

export const getDataContextFromServiceAccount = async (): Promise<DataContext> => {
    const rootCollections = await firestore.listCollections();
    console.log(`Got root collections: ${rootCollections?.join(", ")}`);
    return await Promise.all(rootCollections.map((rootCollection) => getSampleDataFromCollection(firestore, rootCollection.id)));
}

