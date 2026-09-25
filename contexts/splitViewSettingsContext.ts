import React from "react";

import { SettingsNavigatorRouteList } from "~/navigators/SettingsNavigator";

export type SplitViewSettingsRoute =
  SettingsNavigatorRouteList["SplitViewSettings"];

export type SplitViewSettingsContextProps = {
  // Called by the master (list) pane to switch which screen the detail
  // pane shows.
  setRouteParams: (params: SplitViewSettingsRoute) => void;
  // Called by the detail pane to register its real `navigation.setParams`
  // so `setRouteParams` above updates actual navigation state (and not just
  // a prop), since some screens read their params via `useRoute()` instead
  // of props.
  setRouteParamsHandler: (
    handler: (params: SplitViewSettingsRoute) => void
  ) => void;
};

// The master (list) pane and detail pane of the tablet Settings split view are
// mounted in separate navigators, so navigating between screens in the detail
// pane can't be done via `navigation.navigate` from the master pane. This
// context lets the master pane tell the detail pane which screen to show.
export const SplitViewSettingsContext = React.createContext<
  SplitViewSettingsContextProps | undefined
>(undefined);

