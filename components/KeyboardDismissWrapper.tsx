import React from "react";
import { TouchableWithoutFeedback, Keyboard, View } from "react-native";

interface KeyboardDismissWrapperProps {
  children: React.ReactNode;
}

const KeyboardDismissWrapper: React.FC<KeyboardDismissWrapperProps> = ({
  children,
}) => {
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={{ flex: 1 }}>{children}</View>
    </TouchableWithoutFeedback>
  );
};

export default KeyboardDismissWrapper;
