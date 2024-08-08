import { useCallback, useEffect, useRef, useState } from "react";
import equal from "react-fast-compare"

import {
    ConfirmationResult,
    getAuth,
    GoogleAuthProvider,
    onAuthStateChanged,
    signInWithCredential,
    signInWithPopup,
    signOut,
    User as FirebaseUser
} from "@firebase/auth";
import { FirebaseApp } from "@firebase/app";
import { AuthController, Role, User } from "@firecms/core";
import { exchangeCodeForToken, postUserCredentials } from "../api";

export interface DatakiAuthControllerProps {
    loading?: boolean;
    firebaseApp?: FirebaseApp;
    apiEndpoint: string;
    onSignOut?: () => void;
    defineRolesFor?: (user: User) => Promise<Role[] | undefined> | Role[] | undefined;
}

export type DatakiAuthController = AuthController<FirebaseUser> & {
    // googleLogin: () => Promise<FirebaseUser | null>;
    authProviderError?: any;
    permissionsNotGrantedError: boolean;
    updateOauth: (params: Partial<OauthParams>) => Promise<void>;
};

export interface OauthParams {
    code: string;
    scope: string;
    authuser: string;
    hd: string;
    prompt: string;
}

/**
 * Use this hook to build an {@link AuthController} based on Firebase Auth
 * @group Firebase
 */
export const useDatakiAuthController = ({
                                              loading,
                                              firebaseApp,
                                              apiEndpoint,
                                              onSignOut: onSignOutProp,
                                              defineRolesFor
                                          }: DatakiAuthControllerProps): DatakiAuthController => {

    const [loggedUser, setLoggedUser] = useState<FirebaseUser | null | undefined>(undefined); // logged user, anonymous or logged out
    const [authError, setAuthError] = useState<any>();
    const [initialLoading, setInitialLoading] = useState<boolean>(true);
    const [authLoading, setAuthLoading] = useState(true);
    const [loginSkipped, setLoginSkipped] = useState<boolean>(false);
    const [confirmationResult, setConfirmationResult] = useState<undefined | ConfirmationResult>();
    const [roles, setRoles] = useState<Role[] | undefined>();
    const [extra, setExtra] = useState<any>();

    const [authProviderError, setAuthProviderError] = useState<any>();
    const [permissionsNotGrantedError, setPermissionsNotGrantedError] = useState<boolean>(false);

    const authRef = useRef(firebaseApp ? getAuth(firebaseApp) : null);

    const updateUser = useCallback(async (user: FirebaseUser | null, initialize?: boolean) => {
        if (loading) return;
        if (defineRolesFor && user) {
            const userRoles = await defineRolesFor(user);
            setRoles(userRoles);
        }
        setLoggedUser(user);
        setAuthLoading(false);
        if (initialize) {
            setInitialLoading(false);
        }
    }, [loading]);

    const updateRoles = useCallback(async (user: FirebaseUser | null) => {
        if (defineRolesFor && user) {
            const userRoles = await defineRolesFor(user);
            if (!equal(userRoles, roles)) {
                setRoles(userRoles);
            }
        }
    }, [defineRolesFor, roles]);

    const updateOauth = useCallback(async (params: Partial<OauthParams>): Promise<void> => {
        if (!params.code) {
            setAuthError("Oauth error: No code provided");
            return;
        }
        const scopes = params.scope?.split(" ");
        if (!scopes?.includes("https://www.googleapis.com/auth/cloud-platform")) {
            setAuthError("Required scopes not granted");
            return;
        }

        const credentials = await exchangeCodeForToken(window.location.origin, params.code, apiEndpoint);
        console.log("credentials", credentials);
        const credential = GoogleAuthProvider.credential(credentials.id_token);
        return signInWithCredential(getAuth(firebaseApp), credential)
            .then(async (result) => {
                if (!result) {
                    setAuthError("No user returned from sign in with credential");
                    throw Error("No user returned from sign in with credential");
                }
                await postUserCredentials(credentials, await result.user.getIdToken(), apiEndpoint);
            });
    }, [apiEndpoint, firebaseApp]);

    useEffect(() => {
        if (updateRoles && loggedUser) {
            updateRoles(loggedUser);
        }
    }, [updateRoles, loggedUser]);

    useEffect(() => {
        if (!firebaseApp) return;
        try {
            const auth = getAuth(firebaseApp);
            authRef.current = auth;
            setAuthError(undefined);
            updateUser(auth.currentUser, false)
            return onAuthStateChanged(
                auth,
                async (user) => {
                    console.log("User state changed", user);
                    await updateUser(user, true);
                },
                error => setAuthProviderError(error)
            );
        } catch (e) {
            setAuthError(e);
            setInitialLoading(false);
            return () => {
            };
        }
    }, [firebaseApp, updateUser]);

    useEffect(() => {
        if (!loading && authRef.current) {
            updateUser(authRef.current.currentUser, false);
        }
    }, [loading, updateUser]);

    const googleLogin = useCallback(() => {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({
            access_type: "offline",
            prompt: "consent"
        });
        provider.addScope("https://www.googleapis.com/auth/cloud-platform");
        const auth = getAuth(firebaseApp);
        return signInWithPopup(auth, provider)
            .then(async credential => {
                console.log("credential", credential);
                // @ts-ignore
                const userInfo = JSON.parse(credential._tokenResponse.rawUserInfo);
                const grantedScopes = userInfo.granted_scopes.split(" ");
                console.log("userInfo", userInfo);
                console.log("grantedScopes", grantedScopes);
                if (!grantedScopes.includes("https://www.googleapis.com/auth/cloud-platform")) {
                    setPermissionsNotGrantedError(true);
                } else {
                    const credentialFromResult = GoogleAuthProvider.credentialFromResult(credential);
                    console.log("credentialFromResult", credentialFromResult);
                    const firebaseToken = await credential.user.getIdToken();
                    // @ts-ignore
                    await postUserCredentials(credential._tokenResponse, firebaseToken, apiEndpoint);
                    setPermissionsNotGrantedError(false);
                }
                return credential.user;
            })
            .catch((e) => {
                // setAuthProviderError(e);
                return null;
            });
    }, [firebaseApp]);

    const getAuthToken = useCallback(async (): Promise<string> => {
        if (!loggedUser)
            throw Error("No client user is logged in");
        return loggedUser.getIdToken();
    }, [loggedUser]);

    const onSignOut = useCallback(async () => {
        const auth = authRef.current;
        if (!auth) throw Error("No auth");
        await signOut(auth)
            .then(_ => {
                setLoggedUser(null);
                setRoles(undefined);
                setAuthProviderError(null);
                onSignOutProp && onSignOutProp();
            });
        setLoginSkipped(false);
    }, [onSignOutProp]);

    const firebaseUserWrapper = loggedUser
        ? {
            ...loggedUser,
            roles,
            firebaseUser: loggedUser
        }
        : null;

    return {
        user: firebaseUserWrapper,
        roles,
        authProviderError,
        authLoading,
        initialLoading: loading || initialLoading,
        signOut: onSignOut,
        getAuthToken,
        loginSkipped,
        extra,
        setExtra,
        updateOauth,
        // googleLogin,
        permissionsNotGrantedError
    };
};
