import React, { useContext } from "react";
import { Platform } from "react-native";

import { createNativeStackNavigator } from "react-native-screens/native-stack";

import SettingsScreen from "~/screens/Settings";

import AboutScreen from "~/screens/Settings/About";
import AccessTypesScreen from "~/screens/Settings/AccessTypes";
import AlexaScreen from "~/screens/Settings/Alexa";
import AdjustAwayScreen from "~/screens/Settings/Away/AdjustAway";
import AwayScreen from "~/screens/Settings/Away/Away";
import GeofenceScreen from "~/screens/Settings/Away/Geofence";
import DealerScreen from "~/screens/Settings/Dealer";
import DealerAccessScreen from "~/screens/Settings/DealerAccess";
import EditDealerScreen from "~/screens/Settings/EditDealer";
import FaultsScreen from "~/screens/Settings/Faults";
import GoogleHomeScreen from "~/screens/Settings/GoogleHome";
import GrantAccessScreen from "~/screens/Settings/GrantAccess";
import HoldLengthScreen from "~/screens/Settings/HoldLength";
import HumidityNotificationScreen from "~/screens/Settings/HumidityNotification";
import ListHumiditiesScreen from "~/screens/Settings/ListHumidities";
import ListTemperaturesScreen from "~/screens/Settings/ListTemperatures";
import LocationScreen from "~/screens/Settings/Location";
import ManageAccountScreen from "~/screens/Settings/ManageAccount";
import ManageHumiditiesScreen from "~/screens/Settings/ManageHumidities";
import {
  ManageDehumidityThresholdScreen,
  ManageHumidityThresholdScreen,
} from "~/screens/Settings/ManageHumidityThreshold";
import ManualsScreen from "~/screens/Settings/Manuals";
import NamesScreen from "~/screens/Settings/Names";
import NotificationsScreen from "~/screens/Settings/Notifications";
import ProfessionalAccessScreen from "~/screens/Settings/ProfessionalAccess";
import RenameLocationScreen from "~/screens/Settings/RenameLocation";
import RenameRoomScreen from "~/screens/Settings/RenameRoom";
import RestoreDefaultScheduleScreen from "~/screens/Settings/RestoreDefaultSchedule";
import RoomNamesScreen from "~/screens/Settings/RoomNames";
import ScheduleScreen from "~/screens/Settings/Schedule";
import ScheduleZoneNamesScreen from "~/screens/Settings/ScheduleZoneNames";
import ServiceRemindersScreen from "~/screens/Settings/ServiceReminders";
import ShareAccountScreen from "~/screens/Settings/ShareAccount";
import SoftwareScreen from "~/screens/Settings/Software";
import SplitViewSettings from "~/screens/Settings/SplitViewSettings";
import SupportScreen from "~/screens/Settings/Support";
import SystemInfoScreen from "~/screens/Settings/SystemInfo";
import SystemLogUserScreen from "~/screens/Settings/SystemLogUser";
import TemperatureNotificationScreen from "~/screens/Settings/TemperatureNotification";
import VacationScreen from "~/screens/Settings/Vacation";

import { NavigatorsContext, useAuth } from "~/contexts";

import i18n from "~/i18n";

import colors from "~/styles/color";

import { Dealer } from "~/graph";
import { largeTitle, NestedNavigatorParams } from "./helpers";
import { ModalRouteList } from "./ModalNavigator";

const scope = "Screens.Authenticated.SettingsNavigator";

export type SettingsNavigatorRouteList = {
  Settings?: undefined;
  SplitViewSettings: SettingsNavigatorRouteList[SettingsScreenNames] & {
    routeName: SettingsScreenNames;
  };
  About: undefined;
  Support: undefined;
  ProfessionalAccess: undefined;
  Manuals: undefined;
  ManageAccount: undefined;
  ShareAccount: undefined;
  Names: { locationId: string };
  Location: { locationId: string };
  RoomNames: { locationId: string };
  RenameLocation: { locationId: string };
  RenameRoom: { controllerId: string };
  Dealer: { locationId: string };
  EditDealer: { locationId: string; field: keyof Dealer };
  DealerAccess: { locationId: string };
  GrantAccess: { locationId: string };
  AccessTypes: undefined;
  Schedule: { locationId: string };
  HoldLength: { locationId: string };
  ScheduleZoneNames: { locationId: string };
  RestoreDefaultSchedule: { controllerId: string };
  Notifications: { locationId: string };
  ListHumidities: { locationId: string };
  ListTemperatures: { locationId: string };
  Faults: { locationId: string };
  ServiceReminders: { locationId: string };
  TemperatureNotification: { controllerId: string };
  HumidityNotification: { controllerId: string };
  Away: { locationId: string };
  Geofence: { locationId: string };
  AdjustAway: { controllerId: string };
  Vacation: { locationId: string };
  ManageHumidityThreshold: {
    controllerId: string;
  };
  ManageDehumidityThreshold: {
    controllerId: string;
  };
  ManageHumidities: { locationId: string };
  SystemInfo: { locationId: string };
  Software: { locationId: string };
  SystemLogUser: { locationId: string };
  Alexa: undefined;
  GoogleHome: undefined;
  ModalNavigator: NestedNavigatorParams<ModalRouteList>;
};

const Stack = createNativeStackNavigator<SettingsNavigatorRouteList>();

// We map through the shared screens to add them to the split view navigator as well
export type SettingsScreenNames = Exclude<
  keyof SettingsNavigatorRouteList,
  "SplitViewSettings" | "Settings" | "ModalNavigator"
>;
export const SettingsScreens = {
  About: AboutScreen,
  Support: SupportScreen,
  ProfessionalAccess: ProfessionalAccessScreen,
  Manuals: ManualsScreen,
  ManageAccount: ManageAccountScreen,
  ShareAccount: ShareAccountScreen,
  Names: NamesScreen,
  Location: LocationScreen,
  RoomNames: RoomNamesScreen,
  RenameLocation: RenameLocationScreen,
  RenameRoom: RenameRoomScreen,
  Dealer: DealerScreen,
  EditDealer: EditDealerScreen,
  DealerAccess: DealerAccessScreen,
  GrantAccess: GrantAccessScreen,
  AccessTypes: AccessTypesScreen,
  Schedule: ScheduleScreen,
  HoldLength: HoldLengthScreen,
  RestoreDefaultSchedule: RestoreDefaultScheduleScreen,
  ScheduleZoneNames: ScheduleZoneNamesScreen,
  Notifications: NotificationsScreen,
  Faults: FaultsScreen,
  ServiceReminders: ServiceRemindersScreen,
  ListTemperatures: ListTemperaturesScreen,
  TemperatureNotification: TemperatureNotificationScreen,
  ListHumidities: ListHumiditiesScreen,
  HumidityNotification: HumidityNotificationScreen,
  Away: AwayScreen,
  AdjustAway: AdjustAwayScreen,
  Geofence: GeofenceScreen,
  Vacation: VacationScreen,
  ManageHumidityThreshold: ManageHumidityThresholdScreen,
  ManageDehumidityThreshold: ManageDehumidityThresholdScreen,
  ManageHumidities: ManageHumiditiesScreen,
  SystemInfo: SystemInfoScreen,
  Software: SoftwareScreen,
  SystemLogUser: SystemLogUserScreen,
  Alexa: AlexaScreen,
  GoogleHome: GoogleHomeScreen,
};

const IS_ANDROID = Platform.OS === "android";

export default function Settings(): JSX.Element {
  const { isPro } = useAuth();
  const { isTablet } = useContext(NavigatorsContext);
  return (
    <Stack.Navigator
      initialRouteName={isTablet ? "SplitViewSettings" : "Settings"}
      screenOptions={{
        ...largeTitle,
        headerTopInsetEnabled: !isPro,
        headerTranslucent: !isTablet && !IS_ANDROID,
      }}
    >
      {isTablet ? (
        <Stack.Screen
          name="SplitViewSettings"
          component={SplitViewSettings}
          initialParams={{ routeName: "About" }}
          options={{
            headerStyle: {
              backgroundColor: colors.black,
            },
          }}
        />
      ) : (
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            headerShown: false,
            headerLargeTitle: true,
            title: i18n.t("screenTitle", {
              scope: `${scope}.Settings`,
            }),
          }}
        />
      )}
      {Object.entries(SettingsScreens).map(
        ([screenName, screenComponent], index) => (
          <Stack.Screen
            key={index}
            name={screenName as SettingsScreenNames} // object.entries is TS unfriendly here
            component={screenComponent}
            options={{
              title: i18n.t(`${screenName}.screenTitle`, {
                scope,
              }),
              headerStyle: {
                backgroundColor: colors.black,
              },
              headerHideBackButton:
                screenName === "About" && isTablet && IS_ANDROID,
            }}
          />
        )
      )}
    </Stack.Navigator>
  );
}
