import { RouteProp } from "@react-navigation/native";
import React, { useContext, useEffect, useLayoutEffect } from "react";

import { NativeStackNavigationProp } from "react-native-screens/native-stack";

import i18n from "~/i18n";

import { SplitViewSettingsContext } from "~/contexts";

import {
  SettingsNavigatorRouteList,
  SettingsScreens,
} from "~/navigators/SettingsNavigator";

const scope = "Screens.Authenticated.SettingsNavigator";

type SplitViewSettingsNavigationProp = NativeStackNavigationProp<
  SettingsNavigatorRouteList,
  "SplitViewSettings"
>;

export type SplitViewSettingsProps = {
  navigation: SplitViewSettingsNavigationProp;
  route: RouteProp<SettingsNavigatorRouteList, "SplitViewSettings">;
};

const SplitViewSettings = (props: SplitViewSettingsProps): JSX.Element => {
  const splitViewSettings = useContext(SplitViewSettingsContext);
  const { navigation } = props;

  // Register the real `navigation.setParams` so the master pane can update
  // this screen's actual route params (needed by screens that read their
  // params via `useRoute()` rather than props, e.g. inside `withQueryData`).
  useEffect(() => {
    splitViewSettings?.setRouteParamsHandler(params =>
      navigation.setParams(params)
    );
  }, [splitViewSettings, navigation]);

  const screenName = props.route.params.routeName;
  useLayoutEffect(() => {
    props.navigation.setOptions({
      headerTitle: i18n.t(`${screenName}.screenTitle`, {
        scope,
      }),
    });
  }, [props.navigation, screenName]);

  const Screen: any = SettingsScreens[screenName];
  return <Screen {...props} />;
};

export default SplitViewSettings;
