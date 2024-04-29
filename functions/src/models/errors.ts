import FireCMSException from "./exceptions";

export const serviceAccountMissing = new FireCMSException(
  401,
  "The project doesn't have a service account associated",
  "service-account-missing"
);

export const tokenExpired = new FireCMSException(
  401,
  "Firebase ID token has expired",
  "firebase-id-token-expired"
);

export const firebaseTokenInvalid = new FireCMSException(
  401,
  "Firebase ID token is invalid",
  "firebase-id-token-invalid"
);

export const firebaseTokenMissing = new FireCMSException(
  401,
  "Firebase ID must be specified in the Authorization header or the access_token query parameter",
  "firebase-id-token-not-provided"
);

export const userNotAuthorizedToPerformAction = new FireCMSException(
  403,
  "User not authorized to perform action",
  "user-not-authorized-to-perform-action"
)
