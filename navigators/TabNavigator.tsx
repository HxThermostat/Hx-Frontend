import React, { useContext } from "react";

import { Platform, StyleSheet } from "react-native";

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  BottomTabNavigationEventMap,
  BottomTabNavigationOptions,
} from "@react-navigation/bottom-tabs/lib/typescript/src/types";
import { createMaterialBottomTabNavigator } from "@react-navigation/material-bottom-tabs";
import {
  MaterialBottomTabNavigationEventMap,
  MaterialBottomTabNavigationOptions,
} from "@react-navigation/material-bottom-tabs/lib/typescript/src/types";
import { RouteConfig, TabNavigationState } from "@react-navigation/native";

import { NavigatorsContext, useAuth } from "~/contexts";
import HomeNavigator from "~/navigators/Home";
import SchedulesNavigator from "~/navigators/SchedulesNavigator";
import SettingsNavigator from "~/navigators/SettingsNavigator";
import SettingsSplitViewScreen from "~/screens/Settings/SplitViewScreen";

import HomeIcon from "~/components/TabIcons/HomeIcon";
import SchedulesIcon from "~/components/TabIcons/SchedulesIcon";
import SettingsIcon from "~/components/TabIcons/SettingsIcon";

import colors from "~/styles/color";

import i18n from "~/i18n";
// import { useKohortTracking } from "~/utils/kohort";

type iOSTabScreenType = <RouteName extends string>(
  _: RouteConfig<
    Record<string, object | undefined>,
    RouteName,
    TabNavigationState<Record<string, object | undefined>>,
    BottomTabNavigationOptions,
    BottomTabNavigationEventMap
  >
) => null;
type AndroidTabScreenType = <RouteName extends string>(
  _: RouteConfig<
    Record<string, object | undefined>,
    RouteName,
    TabNavigationState<Record<string, object | undefined>>,
    MaterialBottomTabNavigationOptions,
    MaterialBottomTabNavigationEventMap
  >
) => null;

type TabProps = {
  focused: boolean;
  color: string;
};

const styles = StyleSheet.create({
  materialBar: Platform.select({
    android: {
      backgroundColor: colors.linearBGEnd,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.tabInactive,
    },
    default: {},
  }),
});

const scope = "Common";

export default function TabNavigator(): JSX.Element {
  const { isTablet } = useContext(NavigatorsContext);
  const { isPro } = useAuth();
  // const { trackFeatureUse } = useKohortTracking();

  const Tab = React.useMemo(
    () =>
      // Use the normal BottomTabs in Android-CustomerView
      Platform.OS === "android" && !isPro
        ? createMaterialBottomTabNavigator()
        : createBottomTabNavigator(),
    [isPro]
  );

  // We get "JSX element type 'Tab.Screen' does not have any construct or call signatures" without explicitly typing it like this - the above typings are the result of each respective Tab.Screen type in any case.
  const TabScreen = Tab.Screen as iOSTabScreenType & AndroidTabScreenType;

  return (
    <Tab.Navigator
      activeColor={colors.tint}
      inactiveColor={colors.tabBarInactive}
      barStyle={styles.materialBar}
      screenOptions={{
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarActiveTintColor: colors.tint,
      }}
    >
      <TabScreen
        name={"Home"}
        options={{
          tabBarLabel: i18n.t("home", { scope }),
          tabBarAccessibilityLabel: i18n.t("home", { scope }),
          // eslint-disable-next-line react/display-name
          tabBarIcon: ({ color }: TabProps) => <HomeIcon color={color} />,
        }}
        component={HomeNavigator}
      />
      <TabScreen
        name={"Schedules"}
        options={{
          tabBarLabel: i18n.t("schedules", { scope }),
          tabBarAccessibilityLabel: i18n.t("schedules", { scope }),
          // eslint-disable-next-line react/display-name
          tabBarIcon: ({ color }: TabProps) => <SchedulesIcon color={color} />,
        }}
        component={SchedulesNavigator}
      />
      <TabScreen
        name={"Settings"}
        options={{
          tabBarLabel: i18n.t("settings", { scope }),
          tabBarAccessibilityLabel: i18n.t("settings", { scope }),
          // eslint-disable-next-line react/display-name
          tabBarIcon: ({ color }: TabProps) => <SettingsIcon color={color} />,
        }}
        component={isTablet ? SettingsSplitViewScreen : SettingsNavigator}
      />
    </Tab.Navigator>
  );
}
