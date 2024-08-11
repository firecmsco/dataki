import React, { useEffect, useState } from "react";
import { BooleanSwitchWithLabel, Button, CenteredView, cls, Typography } from "@firecms/ui";
import { DatakiAuthController, OauthParams } from "../hooks/useDatakiAuthController";
import { ErrorView } from "@firecms/core";
import { generateAuthUrl } from "../api";
import { DatakiConfig } from "../DatakiProvider";

import Logo from "./dataki_logo.svg";

export function DatakiLogin({
                                authController,
                                datakiConfig
                            }: {
    datakiConfig: DatakiConfig,
    authController: DatakiAuthController
}) {

    useEffect(() => {
        const url = new URL(window.location.href);
        const searchParams = new URLSearchParams(url.search);
        const params: Partial<OauthParams> = {};

        for (const [key, value] of searchParams.entries()) {
            params[key as keyof OauthParams] = value as any;
        }
        authController.updateOauth(params);
    }, [authController]);

    const [termsAccepted, setTermsAccepted] = useState(false);
    const [subscribeToNewsletter, setSubscribeToNewsletter] = useState(false);

    function buildErrorView() {
        let errorView: any;
        const ignoredCodes = ["auth/popup-closed-by-user", "auth/cancelled-popup-request"];
        if (authController.authProviderError && !ignoredCodes.includes(authController.authProviderError.code)) {
            errorView =
                <div className={"p-4"}>
                    <ErrorView error={authController.authProviderError}/>
                </div>;
        }
        return errorView;
    }

    const [oauthUrl, setOauthUrl] = useState<string | undefined>();

    useEffect(() => {
        generateAuthUrl(window.location.origin, datakiConfig.apiEndpoint)
            .then((res) => {
                setOauthUrl(res.data);
            });
    }, [])

    // const ref = React.useRef<HTMLDivElement>(null);
    //
    // function handleCredentialResponse(response: any) {
    //     console.log("handleCredentialResponse", response);
    //
    // }

    // useEffect(() => {
    //     // @ts-ignore
    //     window.handleCredentialResponse = handleCredentialResponse
    //
    //     // @ts-ignore
    //     if (window.google) {
    //         // @ts-ignore
    //         window.google.accounts.id.initialize({
    //             client_id: "513464601173-404mj4t6masag0bj41a30k71i9estkkg.apps.googleusercontent.com",
    //             scope: "https://www.googleapis.com/auth/cloud-platform",
    //             callback: handleCredentialResponse
    //         })
    //         // @ts-ignore
    //         window.google.accounts.id.prompt()
    //         // @ts-ignore
    //         window.google.accounts.id.renderButton(ref.current, {
    //             theme: "filled_black",
    //             shape: "pill",
    //             size: "large"
    //         })
    //     }
    //     // @ts-ignore
    // }, []);

    return <CenteredView maxWidth={"lg"}>
        <div className="flex flex-col items-center justify-center min-w-full p-2">
            <div className={"m-4"} style={{
                width: "290px",
                height: "240px"
            }}>
                <img src={Logo} alt="Dataki logo"/>
            </div>

            <Typography variant={"h4"}
                        color={"primary"}
                        className="mb-4 font-mono text-center">
                DATAKI
            </Typography>

            <Typography paragraph={true} variant={"body2"}>
                Dataki is a platform that helps you generate visualizations and <b>dashboards</b> from
                your <b>BigQuery</b> data, powered by <b>Gemini</b>.
            </Typography>


            {buildErrorView()}

            <BooleanSwitchWithLabel size="small"
                                    invisible={true}
                                    value={subscribeToNewsletter}
                                    onValueChange={setSubscribeToNewsletter}
                                    position={"start"}
                                    label={
                                        <Typography variant={"caption"} color={"primary"}>
                                            Join our newsletter. No spam, only important
                                            updates!
                                        </Typography>}/>

            <BooleanSwitchWithLabel size="small"
                                    invisible={true}
                                    value={termsAccepted}
                                    onValueChange={setTermsAccepted}
                                    position={"start"}
                                    label={
                                        <Typography variant={"caption"} color={"primary"}>
                                            By signing in you agree to our <a
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            href={"https://dataki.ai/terms_and_conditions"}>
                                            Terms and Conditions</a> and our <a
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            href={"https://dataki.ai/privacy_policy"}>
                                            Privacy policy</a>
                                        </Typography>
                                    }/>

            <GoogleLoginButton
                url={oauthUrl}
                disabled={!termsAccepted}
                onClick={() => {
                    console.log("Google login");
                }}/>

            {authController.permissionsNotGrantedError &&
                <ErrorView
                    error={"You need to grant additional permissions in order to manage your Google Cloud projects"}/>}

            <Typography variant={"caption"}>
                Dataki use and transfer to any other app of
                information
                received from Google APIs will adhere to <a
                target="_blank"
                rel="noopener noreferrer"
                href={"https://developers.google.com/terms/api-services-user-data-policy#additional_requirements_for_specific_api_scopes"}>Google
                API Services
                User Data Policy</a>, including the Limited Use
                requirements.
            </Typography>

        </div>
    </CenteredView>;
}

function GoogleLoginButton({
                               url,
                               onClick,
                               disabled
                           }: {
    url?: string,
    onClick: () => void,
    disabled?: boolean
}) {
    return (
        <div className={"m-4 w-full"}>
            <Button
                component={"a"}
                href={url}
                className={cls("w-full bg-white text-gray-900 dark:text-gray-900", disabled ? "" : "hover:text-white hover:dark:text-white")}
                style={{
                    height: "40px",
                    borderRadius: "4px",
                    fontSize: "14px"
                }}
                variant="filled"
                disabled={disabled}
                onClick={onClick}>
                <div
                    className={cls("flex items-center justify-items-center ")}>
                    <div className="flex flex-col items-center justify-center w-4.5 h-4.5">
                        {googleIcon()}
                    </div>
                    <div
                        className={cls("flex-grow pl-6 text-left")}>
                        {"Sign in with Google"}
                    </div>
                </div>
            </Button>

        </div>
    )
}

const googleIcon = () => <>
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 64 64"
        width={32}
        height={32}
    >
        <linearGradient
            id="95yY7w43Oj6n2vH63j6HJb"
            x1="29.401"
            x2="29.401"
            y1="4.064"
            y2="106.734"
            gradientTransform="matrix(1 0 0 -1 0 66)"
            gradientUnits="userSpaceOnUse"
        >
            <stop offset="0" stopColor="#ff5840"/>
            <stop offset=".007" stopColor="#ff5840"/>
            <stop offset=".989" stopColor="#fa528c"/>
            <stop offset="1" stopColor="#fa528c"/>
        </linearGradient>
        <path
            fill="url(#95yY7w43Oj6n2vH63j6HJb)"
            d="M47.46,15.5l-1.37,1.48c-1.34,1.44-3.5,1.67-5.15,0.6c-2.71-1.75-6.43-3.13-11-2.37 c-4.94,0.83-9.17,3.85-11.64, 7.97l-8.03-6.08C14.99,9.82,23.2,5,32.5,5c5,0,9.94,1.56,14.27,4.46 C48.81,10.83,49.13,13.71,47.46,15.5z"
        />
        <linearGradient
            id="95yY7w43Oj6n2vH63j6HJc"
            x1="12.148"
            x2="12.148"
            y1=".872"
            y2="47.812"
            gradientTransform="matrix(1 0 0 -1 0 66)"
            gradientUnits="userSpaceOnUse"
        >
            <stop offset="0" stopColor="#feaa53"/>
            <stop offset=".612" stopColor="#ffcd49"/>
            <stop offset="1" stopColor="#ffde44"/>
        </linearGradient>
        <path
            fill="url(#95yY7w43Oj6n2vH63j6HJc)"
            d="M16.01,30.91c-0.09,2.47,0.37,4.83,1.27,6.96l-8.21,6.05c-1.35-2.51-2.3-5.28-2.75-8.22 c-1.06-6.88,0.54-13.38, 3.95-18.6l8.03,6.08C16.93,25.47,16.1,28.11,16.01,30.91z"
        />
        <linearGradient
            id="95yY7w43Oj6n2vH63j6HJd"
            x1="29.76"
            x2="29.76"
            y1="32.149"
            y2="-6.939"
            gradientTransform="matrix(1 0 0 -1 0 66)"
            gradientUnits="userSpaceOnUse"
        >
            <stop offset="0" stopColor="#42d778"/>
            <stop offset=".428" stopColor="#3dca76"/>
            <stop offset="1" stopColor="#34b171"/>
        </linearGradient>
        <path
            fill="url(#95yY7w43Oj6n2vH63j6HJd)"
            d="M50.45,51.28c-4.55,4.07-10.61,6.57-17.36,6.71C22.91,58.2,13.66,52.53,9.07,43.92l8.21-6.05 C19.78,43.81, 25.67,48,32.5,48c3.94,0,7.52-1.28,10.33-3.44L50.45,51.28z"
        />
        <linearGradient
            id="95yY7w43Oj6n2vH63j6HJe"
            x1="46"
            x2="46"
            y1="3.638"
            y2="35.593"
            gradientTransform="matrix(1 0 0 -1 0 66)"
            gradientUnits="userSpaceOnUse"
        >
            <stop offset="0" stopColor="#155cde"/>
            <stop offset=".278" stopColor="#1f7fe5"/>
            <stop offset=".569" stopColor="#279ceb"/>
            <stop offset=".82" stopColor="#2cafef"/>
            <stop offset="1" stopColor="#2eb5f0"/>
        </linearGradient>
        <path
            fill="url(#95yY7w43Oj6n2vH63j6HJe)"
            d="M59,31.97c0.01,7.73-3.26,14.58-8.55,19.31l-7.62-6.72c2.1-1.61,3.77-3.71,4.84-6.15
        c0.29-0.66-0.2-1.41-0.92-1.41H37c-2.21,0-4-1.79-4-4v-2c0-2.21,1.79-4,4-4h17C56.75,27,59,29.22,59,31.97z"
        />
    </svg>
</>;

const subscribeNewsletter = (email: string) => {
    const url = " https://datakiapi-4mgflsd2ha-ey.a.run.app/notifications/newsletter";
    fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email_address: email,
            source: "dataki-app"
        })
    }).then((res) => {
        console.log("newsletter response", res);
    });
}
