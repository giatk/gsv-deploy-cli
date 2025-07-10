import settings from "../settings.json";
import { AppSettings } from "./models";

export const readSettings = () => {
  return settings as AppSettings;
};
