import DataTalkException from "./exceptions";

export const tokenExpired = new DataTalkException(
  401,
  "Firebase ID token has expired",
  "firebase-id-token-expired"
);

export const firebaseTokenInvalid = new DataTalkException(
  401,
  "Firebase ID token is invalid",
  "firebase-id-token-invalid"
);

export const firebaseTokenMissing = new DataTalkException(
  401,
  "Firebase ID must be specified in the Authorization header or the access_token query parameter",
  "firebase-id-token-not-provided"
);

export const userNotAuthorizedToPerformAction = new DataTalkException(
  403,
  "User not authorized to perform action",
  "user-not-authorized-to-perform-action"
)
