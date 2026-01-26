import React, { useEffect, useState } from "react";
import { View } from "react-native";

import { RouteProp, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "react-native-screens/native-stack";
import { ConnectThermostatNavigatorRouteList } from "~/navigators/ConnectThermostatNavigator";

import images from "~/assets/images";
import i18n from "~/i18n";

import ImageIcon from "~/components/ImageIcon";
import FlatList from "~/components/Lists/FlatList";
import { Item } from "~/components/Lists/ListItem";

import Layout from "./Layout";

const scope = "Screens.Authenticated.ConnectThermostatNavigator.SelectWifi";

export type SelectWifiProps = {
  navigation: NativeStackNavigationProp<
    ConnectThermostatNavigatorRouteList,
    "SelectWifi"
  >;
  route: RouteProp<ConnectThermostatNavigatorRouteList, "SelectWifi">;
};

export default function SelectWifi(props: SelectWifiProps): JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<ConnectThermostatNavigatorRouteList>>();
  const { networks, peripheral } = props.route.params;
  const [connecting, setConnecting] = useState(false);
  const [debugMessage, setDebugMessage] = useState("");
  const [debugMessages, setDebugMessages] = useState<string[]>([]);

  // Debug messages commented out - using system logs instead
  // const addDebugMessage = (message: string) => {
  //   const timestamp = new Date().toLocaleTimeString();
  //   const debugMsg = `[${timestamp}] ${message}`;
  //   console.log(debugMsg);
  //   setDebugMessages(prev => [...prev, debugMsg]);
  //   setDebugMessage(debugMsg);
  // };

  useEffect(() => {
    // addDebugMessage("🔵 SelectWifi screen loaded");
    // addDebugMessage(`🔵 Networks received: ${networks.length} networks`);
    // addDebugMessage(`🔵 Peripheral: ${peripheral ? peripheral.id : 'undefined'}`);
    if (peripheral) {
      // addDebugMessage(`🔵 Peripheral name: ${peripheral.name || 'unnamed'}`);
    }
  }, [networks, peripheral]);

  console.log(`At SelectWifi, networks: ${networks}`);

  const handleItemPress = (item: Item) => {
    // addDebugMessage(`🔵 Network selected: ${item.title}`);
    if (item.navigate) {
      navigation.navigate(item.navigate.name as keyof ConnectThermostatNavigatorRouteList, item.navigate.params as any);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Layout
        title={i18n.t("title", { scope })}
        content={
          <FlatList
            handleItemPress={handleItemPress}
            data={networks.map(network => ({
              title: network.ssid,
              navigate: {
                name: "JoinWifi",
                params: { network: network, peripheral: peripheral },
              },
              rightIcon: <ImageIcon image={images.wifi} />,
            }))}
          />
        }
        autoScroll={false}
        activeIndex={3}
      />
      {/* Debug Messages */}
      {/* <View style={{ 
        position: 'absolute', 
        bottom: 20, 
        left: 10, 
        right: 10, 
        backgroundColor: 'rgba(0,0,0,0.8)', 
        padding: 10,
        borderRadius: 5,
        maxHeight: 150
      }}>
        <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold', marginBottom: 5 }}>
          SELECT WIFI DEBUG:
        </Text>
        {debugMessages.slice(-3).map((msg, index) => (
          <Text key={index} style={{ color: 'white', fontSize: 9, marginBottom: 2 }}>
            {msg}
          </Text>
        ))}
      </View> */}
    </View>
  );
}