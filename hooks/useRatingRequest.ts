import { useCallback, useEffect } from "react";
import { Platform } from "react-native";

import { useApolloClient } from "@apollo/client";

import { getInstallationTimeAsync } from "expo-application";

import Rate from "react-native-rate";

import { useDebouncedCallback } from "use-debounce";

import { RATE_OPTIONS } from "~/constants";

import {
    RequestRatingDocument,
    RequestRatingQuery,
    RequestRatingQueryVariables,
} from "~/graph";

import {
    loadFromAsyncStorage,
    RATING_PROMPT_DISPLAYED,
    saveToAsyncStorage,
} from "~/utils/localStorage";

// import { trackSegmentEvent } from "~/utils/segment";

import { nativeBuild, nativeVersion } from "~/utils/version";

import useFocused from "./useFocused";

const DELAY = 5000;

export const useRatingRequest = (trigger: string): (() => void) => {
  const client = useApolloClient();
  const focused = useFocused();

  const callback = useDebouncedCallback(
    useCallback(async () => {
      const lastDisplayedAt = await loadFromAsyncStorage<string>(
        RATING_PROMPT_DISPLAYED
      );

      const installedAt = (await getInstallationTimeAsync()).toISOString();

      const {
        data: { requestRating },
      } = await client.query<
        RequestRatingQuery,
        RequestRatingQueryVariables
      >({
        query: RequestRatingDocument,
        variables: {
          build: nativeBuild,
          installedAt,
          lastDisplayedAt,
          platform: Platform.select({
            ios: "IOS",
            default: "ANDROID",
          }),
          version: nativeVersion,
        },
        fetchPolicy: "network-only",
      });

      if (!requestRating) return;

      // trackSegmentEvent("Rating Prompt Triggered", { trigger });

      Rate.rate(RATE_OPTIONS, (error, eventType) => {
        if (error) {
          console.error(`Rating error: ${error}`);
          return;
        }

        if (eventType === "buttonPressed") {
          // trackSegmentEvent("Rating Prompt Dismissed");
        } else if (eventType === "success") {
          // trackSegmentEvent("Rating Prompt Success");
        }
      });

      void saveToAsyncStorage(RATING_PROMPT_DISPLAYED, new Date().toISOString());
    }, [client, trigger]),
    DELAY,
    {
      leading: false,
      trailing: true,
    }
  );

  useEffect(() => {
    if (focused) {
      callback();
    }
  }, [callback, focused]);

  return callback;
};
