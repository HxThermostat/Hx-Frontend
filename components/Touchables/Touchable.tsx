import React from "react";
import {
  Platform,
  StyleProp,
  StyleSheet,
  TouchableHighlightProps,
  TouchableNativeFeedbackProps,
  TouchableOpacityProps,
  TouchableWithoutFeedbackProps,
  View,
  ViewStyle,
} from "react-native";
import { TouchableOpacity as RNGHTouchableOpacity } from "react-native-gesture-handler";
import ActivityIndicator from "../ActivityIndicator";

/**
 * Override Touchable to provide a single entry to easily adjust things like default font, color, accessibility options etc.
 */

const styles = StyleSheet.create({
  disabled: { opacity: 0.5 },
  loading: { opacity: 0 },
  loadingIndicator: {
    ...StyleSheet.absoluteFillObject,
  },
});

export interface TouchableProps
  extends TouchableOpacityProps,
    TouchableHighlightProps,
    TouchableWithoutFeedbackProps,
    TouchableNativeFeedbackProps {
  children: JSX.Element | JSX.Element[];
  contentContainerStyle?: StyleProp<ViewStyle>;
  disabledStyle?: StyleProp<ViewStyle>;
  loading?: boolean;
}

const Touchable = (props: TouchableProps): JSX.Element => {
  const {
    children,
    contentContainerStyle,
    disabled: isDisabled,
    disabledStyle,
    loading,
    style,
    ...rest
  } = props;

  const disabled = isDisabled || loading;

  // Use react-native-gesture-handler's TouchableOpacity on Android when inside GestureHandlerRootView
  // This fixes touch events being intercepted by gesture handler in headers
  // See: https://github.com/software-mansion/react-native-gesture-handler/issues/1170
  const RNTouchableOpacity = require('react-native').TouchableOpacity;
  const TouchableComponent = Platform.OS === 'android' ? RNGHTouchableOpacity : RNTouchableOpacity;

  return (
    <TouchableComponent
      hitSlop={{ bottom: 10, left: 10, right: 10, top: 10 }}
      activeOpacity={0.6}
      disabled={disabled}
      style={[...[disabled ? [styles.disabled, disabledStyle] : []], style]}
      {...rest}
    >
      {loading == null && contentContainerStyle == null ? (
        children
      ) : (
        <View style={[loading ? styles.loading : null, contentContainerStyle]}>
          {children}
        </View>
      )}
      {loading ? (
        <ActivityIndicator size={"small"} style={styles.loadingIndicator} />
      ) : null}
    </TouchableComponent>
  );
};

export default Touchable;
