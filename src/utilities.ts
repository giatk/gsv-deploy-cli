import path from "path";
import { AppSettings } from "./models";
import * as fs from "fs";

export const loadSettings = () => {
  const prodPath = path.resolve(__dirname, "../settings.production.json");
  const defaultPath = path.resolve(__dirname, "../settings.json");

  const settingsPath = fs.existsSync(prodPath) ? prodPath : defaultPath;

  const data = fs.readFileSync(settingsPath, "utf-8");
  return JSON.parse(data) as AppSettings;
};

export const sleepAsync = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
