import { useState, useEffect, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";
// as per https://facebook.github.io/react-native/docs/appstate#app-states
// just remember that only iOS has the 'inactive' state
// so we should usually just detect on 'active' and 'background'

const useAppState = (): AppStateStatus => {
  const [appState, setAppState] = useState<AppStateStatus>(
    AppState.currentState
  );

  const onChangeAppState = useCallback((appState: AppStateStatus) => {
    setAppState(appState);
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", onChangeAppState);
    return () => {
      subscription.remove();
    };
  }, [onChangeAppState]);

  return appState;
};
export default useAppState;
