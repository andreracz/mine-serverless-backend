import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";


import { AppComponent } from "./app.component";
import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";
import { FormsModule } from "@angular/forms";
import { NgxSpinnerModule } from "ngx-spinner";
import { ServerListComponent } from "./serverlist/serverlist.component";
import { ServerViewComponent } from "./serverlist/serverview/serverview.component";

/* Changes start here. */
// Import MSAL and MSAL browser libraries. 
import { MsalGuard, MsalInterceptor, MsalModule, MsalRedirectComponent } from '@azure/msal-angular';
import { InteractionType, PublicClientApplication } from '@azure/msal-browser';

// Import the Azure AD B2C configuration 
import { msalConfig, protectedResources } from './authentication/ad-b2c-config';
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faPlay, faStop, faSyncAlt, faPlus, faSignInAlt, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';


@NgModule({
  declarations: [AppComponent, ServerListComponent, ServerViewComponent ],
  imports: [BrowserModule, HttpClientModule, FormsModule, NgxSpinnerModule, BrowserAnimationsModule, FontAwesomeModule,
    MsalModule.forRoot(new PublicClientApplication(msalConfig),
    {
      // The routing guard configuration. 
      interactionType: InteractionType.Popup,
      authRequest: {
        scopes: protectedResources.api.scopes,
        extraScopesToConsent: protectedResources.api.scopes
      }      
    },
    {
      // MSAL interceptor configuration.
      // The protected resource mapping maps your web API with the corresponding app scopes. If your code needs to call another web API, add the URI mapping here.
      interactionType: InteractionType.Popup,
      protectedResourceMap: new Map([
        [protectedResources.api.endpoint, protectedResources.api.scopes]
      ])
    })],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: MsalInterceptor,
      multi: true
    },
    MsalGuard
  ],
  bootstrap: [AppComponent, MsalRedirectComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule {
  constructor(iconLibrary: FaIconLibrary) {
    iconLibrary.addIcons(faPlay, faStop, faSyncAlt, faPlus, faSignInAlt, faSignOutAlt);
  }

}
