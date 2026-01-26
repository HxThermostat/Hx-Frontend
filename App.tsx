import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import {
    NavigationContainer,
    NavigationContainerRef,
} from "@react-navigation/native";
import { createNativeStackNavigator, NativeStackNavigationOptions } from "@react-navigation/native-stack";
import React, { JSX, useRef } from "react";
import { Text, TextInput } from "react-native";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider as PaperProvider } from "react-native-paper";

import AppNavigator from "~/navigators/AppNavigator";
import deepLinkingConfig from "~/navigators/deeplinking";
import { handleScreenChange } from "~/navigators/helpers";

import { ApolloProvider } from "@apollo/client";
import { SafeAreaProvider } from "react-native-safe-area-context";

import {
    AuthProvider,
    NavigatorsContext,
    TemperatureUnitProvider,
} from "~/contexts";

import Background from "~/components/Background";
import ComponentLibraryNavigator from "~/developer/ComponentLibrary/ComponentLibraryNavigator";
import { client } from "~/graph";
import useIsTablet from "~/hooks/useIsTablet";
import useLayoutAnimation from "~/hooks/useLayoutAnimation";
import { AndroidTheme, AppTheme } from "~/styles/theme";
import { initUpdates } from "~/utils/updates";
import { useWatchListeners } from "~/utils/watch";

export type RootNavigatorListParams = {
  ComponentLibrary: undefined;
  App: undefined;
};

// initSentry();
initUpdates();

const Stack = createNativeStackNavigator<RootNavigatorListParams>();

// flip this flag to use the component librarys
const COMPONENT_LIBRARY_MODE = false;
// just wrap this in !__DEV__ so we never accidently ship this to prods
const USE_COMPONENT_LIBRARY = __DEV__ && COMPONENT_LIBRARY_MODE;

// Set maxFontSizeMultiplier to 1.4 to avoid displaying a broken UI because
// of Large Accessibility Font Sizes
const TEXT_DEFAULT_PROPS = { maxFontSizeMultiplier: 1.4 };
// @ts-ignore
Text.defaultProps = { ...Text.defaultProps, ...TEXT_DEFAULT_PROPS };
// @ts-ignore
TextInput.defaultProps = { ...TextInput.defaultProps, ...TEXT_DEFAULT_PROPS };

const App = (): JSX.Element => {
  useLayoutAnimation();
  useWatchListeners();

  const MainNavigator = useRef<NavigationContainerRef<any>>(null);
  const currentRouteNameRef = useRef<string | null>(null);

  function handleNavigationStateChange(): void {
    const previousRouteName = currentRouteNameRef.current;
    const currentRouteName = MainNavigator?.current?.getCurrentRoute()?.name;
    if (previousRouteName !== currentRouteName) {
      handleScreenChange(currentRouteName, previousRouteName);
    }
    if (currentRouteName) {
      currentRouteNameRef.current = currentRouteName;
    }
  }

  function handleNavigationReady(): void {
    // navigateIfUserExitedAppDuringCriticalPath(MainNavigator);
  }

  const screenOptions: NativeStackNavigationOptions = {
    contentStyle: { backgroundColor: "transparent" },
    headerShown: false,
    animation: "none",
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <ApolloProvider client={client}>
      <TemperatureUnitProvider>
        <ActionSheetProvider>
          <AuthProvider>
            <SafeAreaProvider>
              <Background>
                <PaperProvider theme={AndroidTheme}>
                  <NavigatorsContext.Provider value={{ isTablet: useIsTablet() }}>
                    {/* <StatusBar
                      style="light"
                      backgroundColor="transparent"
                      translucent={true}
                    /> */}
                    <NavigationContainer
                      onReady={handleNavigationReady}
                      onStateChange={handleNavigationStateChange}
                      linking={deepLinkingConfig}
                      theme={AppTheme}
                      ref={MainNavigator}
                    >
                      <Stack.Navigator screenOptions={screenOptions}>
                        {USE_COMPONENT_LIBRARY ? (
                          <Stack.Screen
                            name="ComponentLibrary"
                            component={ComponentLibraryNavigator}
                          />
                        ) : (
                          <Stack.Screen
                            name="App"
                            component={AppNavigator}
                          />
                        )}
                      </Stack.Navigator>
                    </NavigationContainer>
                  </NavigatorsContext.Provider>
                </PaperProvider>
              </Background>
            </SafeAreaProvider>
          </AuthProvider>
        </ActionSheetProvider>
        </TemperatureUnitProvider>
      </ApolloProvider>
    </GestureHandlerRootView>
  );
};

export default App;
