import React, { useCallback, useLayoutEffect } from "react";

import { StyleSheet, Text, View } from "react-native";

import { RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "react-native-screens/native-stack";
import { ConnectThermostatNavigatorRouteList } from "~/navigators/ConnectThermostatNavigator";

import {
  useNameDeviceQuery,
  useRenameControllerMutation,
  useRenameLocationMutation,
} from "~/graph";

import i18n from "~/i18n";

import { PickerOption } from "~/components/Picker/Picker";
import PickerRow from "~/components/Picker/PickerRow";
import HeaderButton from "~/components/Touchables/HeaderButton";

import spacing from "~/styles/spacing";

import { cleanseText } from "~/utils/text";
import Layout from "./Layout";

const scope = "Screens.Authenticated.ConnectThermostatNavigator.NameDevice";

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    ...spacing.mtfortytwo,
    alignItems: "center",
  },
  pickerRow: {
    maxWidth: 320,
  },
  debugContainer: {
    position: 'absolute',
    top: 100,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 10,
    borderRadius: 5,
    maxHeight: 150
  }
});

const LOCATION_OPTIONS: PickerOption[] = [
  {
    label: i18n.t("picker.home", { scope }),
    value: i18n.t("picker.home", { scope }),
  },
  {
    label: i18n.t("picker.vacation", { scope }),
    value: i18n.t("picker.vacation", { scope }),
  },
];

const ROOM_OPTIONS: PickerOption[] = [
  {
    label: i18n.t("picker.living", { scope }),
    value: i18n.t("picker.living", { scope }),
  },
  {
    label: i18n.t("picker.hallway", { scope }),
    value: i18n.t("picker.hallway", { scope }),
  },
  {
    label: i18n.t("picker.bedroom", { scope }),
    value: i18n.t("picker.bedroom", { scope }),
  },
  {
    label: i18n.t("picker.upstairs", { scope }),
    value: i18n.t("picker.upstairs", { scope }),
  },
  {
    label: i18n.t("picker.downstairs", { scope }),
    value: i18n.t("picker.downstairs", { scope }),
  },
  {
    label: i18n.t("picker.basement", { scope }),
    value: i18n.t("picker.basement", { scope }),
  },
];

export type NameDeviceProps = {
  navigation: NativeStackNavigationProp<
    ConnectThermostatNavigatorRouteList,
    "NameDevice"
  >;
  route: RouteProp<ConnectThermostatNavigatorRouteList, "NameDevice">;
};

export default function NameDevice({
  navigation,
  route,
}: NameDeviceProps): JSX.Element {
  const { data, loading: queryLoading, error } = useNameDeviceQuery({
    variables: { locationId: route.params.locationId },
  });

  const [
    renameLocationMutation,
    { loading: renameLocationLoading },
  ] = useRenameLocationMutation();

  const [
    renameControllerMutation,
    { loading: renameControllerLoading },
  ] = useRenameControllerMutation();

  const debugMessage = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const debugMsg = `[${timestamp}] [NameDevice] ${message}`;
    console.log(debugMsg);
  };

  const handlePressDone = useCallback(async () => {
    debugMessage("🔵 Done button pressed - checking location status");
    debugMessage(`🔍 LocationId: ${route.params.locationId}`);
    debugMessage(`🔍 Location data: ${JSON.stringify(data?.location)}`);
    debugMessage(`🔍 Controllers count: ${data?.location?.controllers?.length || 0}`);
    
    // Agregar verificación adicional
    if (!data?.location?.id) {
      debugMessage("🔴 ERROR: No location ID available - cannot proceed");
      return;
    }
    
    if (!data.location.controllers?.length) {
      debugMessage("🔴 ERROR: No controllers found in location - cannot proceed");
      return;
    }
    
    debugMessage("🟢 Location verified - navigating to Connected");
    debugMessage(`🟢 Location ID: ${data.location.id}`);
    debugMessage(`🟢 Controllers: ${data.location.controllers.map(c => c.id).join(', ')}`);
    
    debugMessage("🔵 About to call navigation.navigate('Connected')");
    try {
      navigation.navigate("Connected");
      debugMessage("🟢 navigation.navigate('Connected') called successfully");
    } catch (error) {
      debugMessage(`🔴 Error calling navigation.navigate: ${error}`);
    }
  }, [navigation, route.params.locationId, data?.location]);

  const handleLocationNameChange = useCallback(
    (name: string): void => {
      if (!data?.location) return;
      const cleansedName = cleanseText(name);
      debugMessage(`🔄 Renaming location to: ${cleansedName}`);
      renameLocationMutation({
        variables: {
          input: {
            id: data.location.id,
            name: cleansedName,
          },
        },
      });
    },
    [data?.location?.id, renameLocationMutation]
  );

  const handleControllerNameChange = useCallback(
    (id: string, name: string): void => {
      const cleansedName = cleanseText(name);
      debugMessage(`🔄 Renaming controller ${id} to: ${cleansedName}`);
      renameControllerMutation({
        variables: {
          input: {
            id,
            name: cleansedName,
          },
        },
      });
    },
    [renameControllerMutation]
  );

  const loading = renameLocationLoading || renameControllerLoading;

  useLayoutEffect(() => {
    debugMessage("📱 NameDevice screen mounted");
    debugMessage(`🔍 Route params: ${JSON.stringify(route.params)}`);
    
    navigation.setOptions({
      // eslint-disable-next-line react/display-name
      // @ts-ignore - headerRight is a valid property used throughout the codebase
      headerRight: () => (
        <HeaderButton
          loading={loading}
          onPress={handlePressDone}
          text={i18n.t("Common.done")}
        />
      ),
    });
  }, [navigation, handlePressDone, loading, route.params]);

  const location = data?.location;

  // Handle loading state
  if (queryLoading) {
    debugMessage("⏳ Query loading state");
    return (
      <View style={{ flex: 1 }}>
        <Layout
          title={i18n.t("title", { scope, count: 1 })}
          content={
            <View style={styles.container}>
              {/* Show loading state */}
            </View>
          }
          buttonLabel={i18n.t("Common.done")}
          onPress={() => {}}
          autoScroll={false}
          activeIndex={5}
        />
        {/* <View style={styles.debugContainer}>
          <Text style={{ color: 'yellow', fontSize: 10, fontWeight: 'bold' }}>
            ⏳ LOADING...
          </Text>
        </View> */}
      </View>
    );
  }

  // Handle error state
  if (error || !location) {
    debugMessage(`🔴 Error state - error: ${error}, location: ${location}`);
    debugMessage(`🔍 LocationId: ${route.params.locationId}`);
    
    // Return a more graceful error state instead of throwing
    return (
      <View style={{ flex: 1 }}>
        <Layout
          title={i18n.t("title", { scope, count: 1 })}
          content={
            <View style={styles.container}>
              {/* Show error state */}
            </View>
          }
          buttonLabel={i18n.t("Common.done")}
          onPress={() => navigation.navigate("Connected")}
          autoScroll={false}
          activeIndex={5}
        />
        {/* <View style={styles.debugContainer}>
          <Text style={{ color: 'red', fontSize: 10, fontWeight: 'bold' }}>
            🔴 ERROR: {error?.message || 'No location data'}
          </Text>
          <Text style={{ color: 'white', fontSize: 9 }}>
            LocationId: {route.params.locationId}
          </Text>
        </View> */}
      </View>
    );
  }

  const { controllers } = location;
  debugMessage(`✅ Data loaded - Controllers: ${controllers.length}`);
  debugMessage(`🔍 Controllers: ${JSON.stringify(controllers.map(c => ({ id: c.id, name: c.name })))}`);
  
  return (
    <View style={{ flex: 1 }}>
      <Layout
        title={i18n.t("title", { scope, count: controllers.length })}
        content={
          <View style={styles.container}>
            <PickerRow
              style={styles.pickerRow}
              label={i18n.t("location", { scope })}
              inputLabel={i18n.t("labels.location", { scope })}
              inputPlaceholder={i18n.t("placeholders.location", { scope })}
              options={LOCATION_OPTIONS}
              value={location.name}
              onValueChange={handleLocationNameChange}
            />

            {controllers.map((controller, i) => (
              <PickerRow
                key={controller.id}
                style={styles.pickerRow}
                label={
                  i === 0
                    ? i18n.t("room", { scope, count: controllers.length })
                    : undefined
                }
                inputLabel={i18n.t("labels.room", { scope })}
                inputPlaceholder={i18n.t(
                  controllers.length === 1
                    ? "placeholders.room"
                    : "placeholders.zone",
                  { scope, number: i + 1 }
                )}
                options={[
                  ...ROOM_OPTIONS,
                  {
                    label: i18n.t("picker.zone", { scope, number: i + 1 }),
                    value: i18n.t("picker.zone", { scope, number: i + 1 }),
                  },
                ]}
                value={controller.name}
                onValueChange={name => handleControllerNameChange(controller.id, name)}
              />
            ))}
          </View>
        }
        buttonLabel={i18n.t("Common.done")}
        onPress={handlePressDone}
        autoScroll={false}
        activeIndex={5}
      />
      {/* <View style={styles.debugContainer}>
        <Text style={{ color: 'green', fontSize: 10, fontWeight: 'bold' }}>
          ✅ READY - {controllers.length} controllers
        </Text>
        <Text style={{ color: 'white', fontSize: 9 }}>
          Location: {location.name}
        </Text>
        <Text style={{ color: 'white', fontSize: 9 }}>
          LocationId: {location.id}
        </Text>
      </View> */}
    </View>
  );
}
