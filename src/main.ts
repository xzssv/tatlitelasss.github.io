import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { environment } from './environments/environment';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

function bootstrap() {
  bootstrapApplication(AppComponent, appConfig)
    .catch((err) => console.error(err));
}

if (isPlatformBrowser(PLATFORM_ID)) {
  const app = initializeApp(environment.firebase);
  const analytics = getAnalytics(app);

  if (document.readyState === 'complete') {
    bootstrap();
  } else {
    document.addEventListener('DOMContentLoaded', bootstrap);
  }
} else {
  bootstrap();
}