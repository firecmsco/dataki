import { KeyManagementServiceClient } from "@google-cloud/kms";
import * as crc32c from "sse4_crc32";
import { ServiceAccountKey } from "../types/service_account";


const client = new KeyManagementServiceClient();

const projectId = process.env.GCLOUD_PROJECT || "datatalk-443fb";
const locationId = "global";
const keyRingId = "datatalk";
const keyId = "service-accounts-master";

const keyName = client.cryptoKeyPath(projectId, locationId, keyRingId, keyId);

export const encrypt = async (serviceAccount: ServiceAccountKey) => {
    const serviceAccountString = JSON.stringify(serviceAccount);
    const plainText = Buffer.from(serviceAccountString);
    const plaintextCrc32c = crc32c.calculate(plainText);
    const [encryptResponse] = await client.encrypt({
        name: keyName,
        plaintext: plainText,
        plaintextCrc32c: {
            value: plaintextCrc32c
        }
    });
    const ciphertext: string | Buffer = encryptResponse.ciphertext as string | Buffer;
    if (!ciphertext)
        throw new Error("Encrypt: request corrupted in-transit");
    // Optional, but recommended: perform integrity verification on encryptResponse.
    // For more details on ensuring E2E in-transit integrity to and from Cloud KMS visit:
    // https://cloud.google.com/kms/docs/data-integrity-guidelines
    if (!encryptResponse.verifiedPlaintextCrc32c || !encryptResponse?.ciphertextCrc32c?.value) {
        throw new Error("Encrypt: request corrupted in-transit");
    }
    if (
        crc32c.calculate(ciphertext) !==
        Number(encryptResponse.ciphertextCrc32c.value)
    ) {
        throw new Error("Encrypt: response corrupted in-transit");
    }
    return ciphertext.toString("base64");
}

export const decrypt = async (ciphertext: string): Promise<ServiceAccountKey> => {
    const ciphertextBuffer = Buffer.from(ciphertext, "base64");
    const ciphertextCrc32c = crc32c.calculate(ciphertextBuffer);
    const [decryptResponse] = await client.decrypt({
        name: keyName,
        ciphertext: ciphertextBuffer,
        ciphertextCrc32c: {
            value: ciphertextCrc32c
        }
    });

    if (!decryptResponse?.plaintext || !decryptResponse?.plaintextCrc32c?.value)
        throw new Error("Decrypt: request corrupted in-transit");

    if (
        crc32c.calculate(decryptResponse.plaintext as Buffer | string) !==
        Number(decryptResponse.plaintextCrc32c.value)
    ) {
        throw new Error("Decrypt: response corrupted in-transit");
    }
    const plaintext = decryptResponse.plaintext.toString();
    return JSON.parse(plaintext);
}
