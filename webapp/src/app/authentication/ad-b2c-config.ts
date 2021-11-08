import { LogLevel, Configuration, BrowserCacheLocation } from '@azure/msal-browser';

const isIE = window.navigator.userAgent.indexOf("MSIE ") > -1 || window.navigator.userAgent.indexOf("Trident/") > -1;
 
export const b2cPolicies = {
     names: {
         signIn: "b2c_1_SignIn"
     },
     authorities: {
        signIn: {
             authority: "https://azuremine.b2clogin.com/azuremine.onmicrosoft.com/b2c_1_SignIn",
         }
     },
     authorityDomain: "azuremine.b2clogin.com"
 };
 
 
export const msalConfig: Configuration = {
     auth: {
         clientId: '7bb78544-d417-462e-9121-473834197301',
         authority: b2cPolicies.authorities.signIn.authority,
         knownAuthorities: [b2cPolicies.authorityDomain],
         redirectUri: '/', 
     },
     cache: {
         cacheLocation: BrowserCacheLocation.LocalStorage,
         storeAuthStateInCookie: isIE, 
     },
     system: {
         loggerOptions: {
            loggerCallback: (logLevel, message, containsPii) => {
                console.log(message);
             },
             logLevel: LogLevel.Warning,
             piiLoggingEnabled: false
         }
     }
 }

export const protectedResources = {
  api: {
    endpoint: "https://mine-serverless.azurewebsites.net/api/servers/",
    scopes: ["7bb78544-d417-462e-9121-473834197301"],
  },
}
export const loginRequest = {
  scopes: ["https://azuremine.onmicrosoft.com/mine-api/server.access"]
};