import { PublicClientApplication } from "@azure/msal-browser";

export const msalConfig = {
    auth: {
        clientId: "cf84fbd3-b8db-49bb-8409-e1c6e0c12a10",
        authority: "https://login.microsoftonline.com/0d905466-7a5e-4143-a93c-d138ed63f31e",
    },
    cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: true,
    },
    system: {
        iframeHashTimeout: 3000,
        windowHashTimeout: 3000,
        loadFrameTimeout: 3000,
    }
};

// Add scopes for the ID token and Graph API
export const loginRequest = {
    scopes: ["User.Read"]
};

export const msalInstance = new PublicClientApplication(msalConfig);

