import { useNavigation } from "@react-navigation/native";
import React, { useMemo } from "react";
import { Alert, StyleSheet } from "react-native";

import { useAuth } from "~/contexts";

import i18n from "~/i18n";

import { attemptToOpenURL } from "~/utils/linking";
// import { forceSentryCrash } from "~/utils/sentry";
import { appVersion } from "~/utils/version";

import Background from "~/components/Background";
import FlatList, { Data } from "~/components/Lists/FlatList";
import { Item } from "~/components/Lists/ListItem";
import Text from "~/components/Text";
import Touchable from "~/components/Touchables/Touchable";

const styles = StyleSheet.create({
  container: {},
  hidden: { opacity: 0, height: 40 },
});

const scope = "Screens.Authenticated.SettingsNavigator.About";

export default function About(): JSX.Element {
  const navigation = useNavigation();
  const { isPro } = useAuth();

  function handleItemPress(item: Item): void {
    if (item.navigate) {
      navigation.navigate(item.navigate.name, item.navigate.params);
    }
    if (item.onPress) {
      item.onPress();
    }
  }
  function _dangerousForceCrashJS(): void {
    Alert.alert(
      "Developer Tools",
      "This will force a JS crash of the app for testing purposes",
      [
        {
          text: "Cancel",
          onPress: () => {
            //
          },
        },
        {
          text: "Crash",
          onPress: () => {
            throw new Error("JS Test Crash");
          },
        },
      ]
    );
  }
  // function _dangerousForceCrashNative(): void {
  //   Alert.alert(
  //     "Developer Tools",
  //     "This will force a native crash of the app for testing purposes",
  //     [
  //       {
  //         text: "Cancel",
  //         onPress: () => {
  //           //
  //         },
  //       },
  //       {
  //         text: "Crash",
  //         onPress: () => forceSentryCrash(),
  //       },
  //     ]
  //   );
  // }

  const items: Data = useMemo(
    () => [
      {
        title: i18n.t("version", { scope }),
        chevron: false,
        subtitle: appVersion,
      },
      {
        title: i18n.t("privacy", { scope }),
        chevron: true,
        onPress: () =>
          attemptToOpenURL("https://yoursysteminfo.com/hx-privacy-html/"),
      },
      ...(isPro
        ? []
        : [
            {
              title: i18n.t("professionalAccess", { scope }),
              chevron: true,
              navigate: {
                name: "ProfessionalAccess",
              },
            },
          ]),
    ],
    [isPro]
  );

  return (
    <Background>
      <FlatList
        alwaysBounceVertical={false}
        contentContainerStyle={styles.container}
        data={items}
        handleItemPress={handleItemPress}
      />
      <Touchable
        style={styles.hidden}
        delayLongPress={10000}
        onLongPress={_dangerousForceCrashJS}
      >
        <Text style={styles.hidden}> </Text>
      </Touchable>
      {/* <Touchable
        style={styles.hidden}
        delayLongPress={10000}
        onLongPress={_dangerousForceCrashNative}
      >
        <Text style={styles.hidden}> </Text>
      </Touchable> */}
    </Background>
  );
}
