import path from "path";

import { app, BrowserWindow, dialog, ipcMain, IpcMainEvent } from "electron"; // tslint:disable-line:no-implicit-dependencies
import isDev from "electron-is-dev";
import express from "express";

import {
  Credentials,
  deleteCredentials,
  getCredentials,
  setCredentials,
} from "../common/auth";
import { login } from "./damApi";
import setupGraphQL from "./graphql";
import remoconMiddleware from "./remoconMiddleware";

function attemptLogin(creds: Credentials) {
  return login(creds.account, creds.password)
    .then((json) => [creds.account, json.data.authToken])
    .catch(() =>
      deleteCredentials().then(() => Promise.reject("credentials were invalid"))
    )
    .then(([account, minseiAuthToken]) => {
      const expressApp = express();
      expressApp.use(remoconMiddleware());
      setupGraphQL(expressApp, account, minseiAuthToken);
      expressApp.listen(8080);
    });
}

let rendererWindow: BrowserWindow | null;

function createWindow() {
  rendererWindow = new BrowserWindow({
    frame: isDev,
    fullscreen: !isDev,
    webPreferences: {
      allowRunningInsecureContent: false,
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
      nodeIntegrationInSubFrames: false,
      nodeIntegrationInWorker: false,
      preload: path.join(__dirname, "..", "preload", "main.js"),
      webSecurity: true,
    },
  });

  // Ignore CORS when fetching ipcasting HLS
  const session = rendererWindow.webContents.session;
  const ipcastingFilter = {
    urls: ["https://*.ipcasting.jp/*"],
  };

  session.webRequest.onBeforeSendHeaders(
    ipcastingFilter,
    (details, callback) => {
      delete details.requestHeaders.Origin;
      callback({ requestHeaders: details.requestHeaders });
    }
  );

  getCredentials()
    .then(attemptLogin)
    .catch((e) => console.debug(`Error logging in: ${e}`))
    .then(() => {
      if (rendererWindow)
        rendererWindow.loadURL(
          isDev
            ? "http://localhost:3000/renderer/"
            : `file://${path.join(__dirname, "..", "renderer", "index.html")}`
        );
    });
  rendererWindow.on("closed", () => (rendererWindow = null));

  ipcMain.on("attemptLogin", (event: IpcMainEvent, creds: Credentials) =>
    attemptLogin(creds)
      .then(() =>
        setCredentials(creds).then(() => {
          if (rendererWindow) rendererWindow.reload();
        })
      )
      .catch((e) => dialog.showErrorBox("Error logging in", e))
  );
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (rendererWindow === null) {
    createWindow();
  }
});
