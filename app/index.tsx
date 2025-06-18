import { View } from "react-native";
import React from "react";

import FirebaseGoogle from "@/components/FirebaseGoogle";

const index = () => {
  return (
    <View style={{ justifyContent: "center", flex: 1, alignItems: "center" }}>
      <FirebaseGoogle />
    </View>
  );
};

export default index;
