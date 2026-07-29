import React, { useCallback, useState } from "react";
import { View } from "react-native";

import { RouteProp } from "@react-navigation/native";

import { NativeStackNavigationProp } from "react-native-screens/native-stack";
import { ConnectThermostatNavigatorRouteList } from "~/navigators/ConnectThermostatNavigator";

import { useAuth } from "~/contexts";

import i18n from "~/i18n";

import images from "~/assets/images";

import Layout from "./Layout";

const scope = "Screens.Authenticated.ConnectThermostatNavigator.Connected";

export type ConnectedProps = {
  navigation: NativeStackNavigationProp<
    ConnectThermostatNavigatorRouteList,
    "Connected"
  >;
  router: RouteProp<ConnectThermostatNavigatorRouteList, "Connected">;
};

export default function Connected({ navigation }: ConnectedProps): JSX.Element {
  const { bootstrap, completeOnboarding, isOnboarding, resetOnboarding, reload, markFirstUse } = useAuth();
  const [loading, setLoading] = useState(false);
  const [debugMessages, setDebugMessages] = useState<string[]>([]);
  // const { trackFunnel } = useKohortTracking();

  // Debug messages commented out - using system logs instead
  // const appendDebugMessage = (msg: string) => {
  //   const timestamp = new Date().toLocaleTimeString();
  //   const debugMsg = `[${timestamp}] [Connected] ${msg}`;
  //   console.log(debugMsg);
  //   setDebugMessages(prev => [...prev, debugMsg]);
  // };

  const onPress = useCallback(async () => {
    // appendDebugMessage("🔵 Button pressed - starting process");
    // appendDebugMessage(`🔍 isOnboarding: ${isOnboarding}`);
    
    // trackFunnel({
    //   funnel: KohortFunnel.Adoption,
    //   step: KohortFunnelEventStep.Connection,
    // });
    // trackFunnel({
    //   funnel: KohortFunnel.Connection,
    //   step: KohortFunnelEventStep.ConnectionSuccess,
    // });
    
    try {
      setLoading(true);
      // appendDebugMessage("🔄 Loading state set to true");
      
      // appendDebugMessage("🔄 Calling bootstrap()...");
      await bootstrap();
      // appendDebugMessage("✅ bootstrap() completed successfully");
      
      // appendDebugMessage(`🔍 Checking isOnboarding: ${isOnboarding}`);
      // appendDebugMessage("🔄 Ensuring onboarding completion and navigating to Home...");
      // Ensure we mark onboarding as complete regardless of current flag
      completeOnboarding();
      markFirstUse();
      // appendDebugMessage("✅ completeOnboarding() and markFirstUse() called");

      // Force navigator tree to refresh to Home
      // appendDebugMessage("🔄 Calling reload(true) to refresh navigators");
      await reload(true);
      // appendDebugMessage("✅ reload(true) completed");
      
      // appendDebugMessage("✅ All operations completed successfully");
    } catch (error) {
      // appendDebugMessage(`🔴 Error in onPress: ${String(error)}`);
      // appendDebugMessage(`🔴 Error details: ${JSON.stringify(error)}`);
    } finally {
      // appendDebugMessage("🔄 Setting loading to false");
      setLoading(false);
    }
  }, [bootstrap, completeOnboarding, isOnboarding, navigation, resetOnboarding]);

  return (
    <View style={{ flex: 1 }}>
      <Layout
        image={images.connected}
        title={i18n.t("title", { scope })}
        instructions={i18n.t("instructions", { scope })}
        buttonLabel={i18n.t("button", { scope })}
        buttonLoading={loading}
        onPress={onPress}
        activeIndex={6}
      />
      
      {/* Debug Messages */}
      {/* <ScrollView style={{ 
        position: 'absolute', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        maxHeight: 200, 
        backgroundColor: 'rgba(0,0,0,0.8)', 
        padding: 10 
      }}>
        {debugMessages.map((msg, idx) => {
          const isCritical = /Error|Exception|Failed|bootstrap|completeOnboarding/i.test(msg);
          return (
            <Text key={idx} style={{ 
              color: isCritical ? 'yellow' : 'lime', 
              fontSize: 10, 
              marginBottom: 2 
            }}>
              {msg}
            </Text>
          );
        })}
      </ScrollView> */}
    </View>
  );
}