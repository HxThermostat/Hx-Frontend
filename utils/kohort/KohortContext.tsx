// import React, {
//   useCallback,
//   useContext,
//   useEffect,
//   useRef,
//   useState,
// } from "react";
// // import { JsonMap } from "@segment/analytics-react-native";

// import {
//   KohortFunnel,
//   KohortFunnelEventStep,
//   KohortTracking,
// } from "./tracking";

// import useAppState from "~/hooks/useAppState";
// import { addPlugin } from "../segment";
// import { createSessionPlugin } from "./plugin";

// export { KohortFunnel, KohortFunnelEventStep };

// const KohortContext = React.createContext<KohortTracking | undefined>(undefined);

// export const useKohortTracking = (): KohortTracking => {
//   const context = useContext(KohortContext);
//   if (!context) {
//     throw new Error("useKohortTracking must be used within a KohortProvider");
//   }
//   return context;
// };

// export const KohortProvider: React.FC<{ children: React.ReactNode }> = ({
//   children,
// }) => {
//   const [tracker] = useState(() => KohortTracking.singleton());
//   const appState = useAppState();

//   useEffect(() => {
//     if (appState === "active") {
//       tracker.session.markSessionActive();
//     }
//   }, [appState, tracker.session]);

//   useEffect(() => {
//     const plugin = createSessionPlugin(tracker);
//     addPlugin(plugin);
//   }, [tracker]);

//   return (
//     <KohortContext.Provider value={tracker}>{children}</KohortContext.Provider>
//   );
// };
