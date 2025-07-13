import path from "path";
import { AppSettings } from "./models";
import * as fs from "fs";
import { execSync } from "child_process";

export const loadSettings = () => {
  const prodPath = path.resolve(__dirname, "../settings.production.json");
  const defaultPath = path.resolve(__dirname, "../settings.json");

  const settingsPath = fs.existsSync(prodPath) ? prodPath : defaultPath;

  const data = fs.readFileSync(settingsPath, "utf-8");
  return JSON.parse(data) as AppSettings;
};

export const sleepAsync = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const waitUntilAsync = async <T>({
  runAsync,
  timeout,
  duration,
  whenTimeout,
}: {
  runAsync: (elapsedTime: number) => Promise<T | undefined>;
  timeout?: number;
  duration: number;
  whenTimeout?: () => void;
}): Promise<T | undefined> => {
  const start = Date.now();
  let elapsed = 0;
  do {
    elapsed = Date.now() - start;
    const breakLoop = await runAsync(elapsed);
    if (breakLoop != null) {
      return breakLoop;
    }
    await sleepAsync(duration);
  } while (timeout == null || elapsed < timeout);
  whenTimeout?.();
};

export function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export const printElapsedTime = ({
  withMessage,
}: {
  withMessage: (seconds: number) => string;
}): {
  stopPrintElapsedTime: () => void;
} => {
  let seconds = 0;
  const interval = setInterval(() => {
    const message = withMessage(seconds++);
    process.stdout.write(`\r` + message);
  }, 1000);

  return {
    stopPrintElapsedTime: () => {
      console.log(); //Next line
      clearInterval(interval);
    },
  };
};

export const processExecSync = (
  cmd: string,
  option?: { skipConsoleLog?: boolean }
) => {
  !option?.skipConsoleLog && console.log(cmd);
  return execSync(cmd.replaceAll(/\s+/g, " ").trim(), { encoding: "utf-8" });
};
