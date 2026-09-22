import { Linking } from "react-native";
import { GRAPH_URL } from "~/constants";

// Abstract linking functions into helpers
// Deep linking occurs in navigators/deeplinking.ts

export const attemptToOpenURL = (url: string): void => {
  Linking.canOpenURL(url)
    .then(supported => {
      if (supported) {
        Linking.openURL(url);
      }
      return null;
    })
    .catch(error => {
      console.log(error);
      console.warn(error);
    });
};
export const deepLinkInitialURL = (url: string): void => {
  const webDeepLinkPrefix = GRAPH_URL.endsWith("/") ? GRAPH_URL : `${GRAPH_URL}/`;
  attemptToOpenURL(url.replace(webDeepLinkPrefix, "Hx://"));
};
