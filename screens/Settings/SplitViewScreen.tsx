import React, { JSX, useMemo, useRef } from "react";
import { View, StyleSheet } from "react-native";

import SettingsNavigator from "~/navigators/SettingsNavigator";

import SettingsScreen from "../Settings";
import colors from "~/styles/color";
import fonts from "~/styles/fonts";
import spacing from "~/styles/spacing";

import {
  SplitViewSettingsContext,
  SplitViewSettingsContextProps,
  SplitViewSettingsRoute,
} from "~/contexts";

// @TODO zibs this styling could use some improvement eventually
const styles = StyleSheet.create({
  tabletRoot: { flex: 1, flexDirection: "row" },
  tabletMasterView: {
    flex: 1,
    flexDirection: "column",
    maxWidth: 400,
    borderRightColor: colors.divider,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  tabletSettingsHeader: {
    ...fonts.largeTitle,
    ...spacing.plsixteen,
    ...spacing.pbeight,
    ...spacing.ptsixtyfour,
  },
  tabletDetailView: {
    flex: 1,
    overflow: "hidden",
  },
});

const SettingsSplitViewScreen = (): JSX.Element => {
  const routeParamsHandlerRef = useRef<
    (params: SplitViewSettingsRoute) => void
  >();

  const contextValue = useMemo<SplitViewSettingsContextProps>(
    () => ({
      setRouteParams: params => routeParamsHandlerRef.current?.(params),
      setRouteParamsHandler: handler => {
        routeParamsHandlerRef.current = handler;
      },
    }),
    []
  );

  return (
    <SplitViewSettingsContext.Provider value={contextValue}>
      <View style={styles.tabletRoot}>
        <View style={styles.tabletMasterView}>
          <SettingsScreen />
        </View>
        <View style={styles.tabletDetailView}>
          <SettingsNavigator />
        </View>
      </View>
    </SplitViewSettingsContext.Provider>
  );
};

export default SettingsSplitViewScreen;
