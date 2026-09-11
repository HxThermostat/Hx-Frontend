import { Platform } from "react-native";

import * as Localization from "expo-localization";
import { I18n } from "i18n-js";

import moment from "moment";
import "moment/locale/fr";

import en from "./en.json";
import fr from "./fr.json";

// Initialize i18n
const i18n = new I18n({
  en,
  fr,
});

i18n.defaultLocale = "en";
i18n.enableFallback = true;
i18n.locale = Localization.getLocales()[0]?.languageTag ?? "en";

moment.locale(i18n.locale);

const bestGuessRegionForAndroid = (locale: string): string => {
  // can't grab country code on Android using Localization.region
  if (locale.includes("-")) {
    // es-US, fr-CA, de-DE etc.
    return locale.split("-")[1];
  }
  return "US";
};

export const usersCurrentRegion =
  Platform.OS === "ios"
    ? Localization.getLocales()[0]?.regionCode ?? "US"
    : bestGuessRegionForAndroid(i18n.locale);

export default i18n;
