import React, { useContext } from "react";
import {
  Platform,
  StyleProp,
  StyleSheet,
  SwitchProps,
  TextProps,
  TextStyle,
  ViewStyle,
} from "react-native";

import { ListItem as RNEListItem } from "react-native-elements";

import Switch from "~/components/Switch";

import { NavigatorsContext } from "~/contexts";
import colors from "~/styles/color";
import fonts from "~/styles/fonts";
import spacing from "~/styles/spacing";

export interface Item {
  title: string;
  subtitle?: string;
  subtitleStyle?: StyleProp<TextStyle>;
  subtitleSelectable?: boolean;
  titleStyle?: StyleProp<TextStyle>;
  rightContentContainerStyle?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  titleProps?: TextProps;
  rightTitleProps?: TextProps;
  chevron?: boolean;
  navigate?: {
    force?: boolean;
    name: string;
    params?: object;
  };
  disabled?: boolean;
  onPress?: () => void;
  button?: boolean;
  highlight?: boolean;
  destructive?: boolean;
  leftIcon?: React.ReactElement;
  rightIcon?: React.ReactElement;
  switch?: SwitchProps;
  rightElement?: React.ReactElement;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "transparent",
    ...Platform.select({
      android: {
        paddingLeft: 16,
        paddingBottom: 20,
      },
      default: {
        ...spacing.pltwentyfour,
      },
    }),
    flex: 1,
    flexGrow: 1,
  },
  containerHighlight: {
    backgroundColor: colors.tint,
  },
  contentContainer: {
    flex: 0,
  },
  rightContentContainer: {
    flex: 1,
    flexGrow: 1,
  },
  titleLabel: {
    ...fonts.listLabel,
  },
  titleLabelTabletButton: {
    color: colors.tint,
  },
  titleLabelDisabled: {
    color: colors.dialInactive,
  },
  titleLabelDestructive: {
    color: colors.red,
  },
  subtitleLabel: {
    ...fonts.listSublabel,
    fontVariant: ["tabular-nums"],
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "transparent",
    padding: 14,
    alignItems: "center",
    ...Platform.select({
      android: {
        paddingLeft: 16,
        paddingBottom: 20,
      },
      default: {
        ...spacing.pltwentyfour,
      },
    }),
  },
});

interface ListItemInterface {
  item: Item;
  handleItemPress: () => void;
  containerStyle?: StyleProp<ViewStyle>;
}

export default function ListItem({
  item,
  handleItemPress,
  containerStyle,
}: ListItemInterface): JSX.Element {
  const { isTablet } = useContext(NavigatorsContext);

  let rightElement = item.rightElement;
  if (!rightElement && item.switch) {
    const { onValueChange, ...restSwitchProps } = item.switch;
    rightElement = <Switch onValueChange={onValueChange || (() => {})} {...restSwitchProps} />;
  }

  return (
    <RNEListItem
      disabled={item.disabled}
      containerStyle={[
        styles.container,
        containerStyle,
        item.highlight ? styles.containerHighlight : null,
      ]}
      onPress={item.navigate || item.onPress ? handleItemPress : undefined}
    >
      <RNEListItem.Content>
        <RNEListItem.Title style={styles.titleLabel}>
          {item.title}
        </RNEListItem.Title>
        {item.subtitle && (
          <RNEListItem.Subtitle style={styles.subtitleLabel}>
            {item.subtitle}
          </RNEListItem.Subtitle>
        )}
      </RNEListItem.Content>
      {item.rightIcon}
      {rightElement}
    </RNEListItem>
  );
}
