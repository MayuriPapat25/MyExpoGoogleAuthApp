import { View, SafeAreaView, TouchableOpacity } from "react-native";
import React, { useEffect, useState } from "react";
import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
  GoogleSigninButton,
} from "@react-native-google-signin/google-signin";
import auth from "@react-native-firebase/auth";
import {
  BottomNavigation,
  Text,
  Provider as PaperProvider,
} from "react-native-paper";
const MusicRoute = () => (
  <View
    style={{
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <Text>Music</Text>
  </View>
);

const AlbumsRoute = () => (
  <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
    <Text>Albums</Text>
  </View>
);

const RecentsRoute = () => (
  <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
    <Text>Recents</Text>
  </View>
);

const index = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState();

  const [index, setIndex] = React.useState(0);
  const [routes] = React.useState([
    { key: "music", title: "Music", icon: "queue-music" },
    { key: "albums", title: "Albums", icon: "album" },
    { key: "recents", title: "Recents", icon: "history" },
  ]);

  const renderScene = BottomNavigation.SceneMap({
    music: MusicRoute,
    albums: AlbumsRoute,
    recents: RecentsRoute,
  });

  GoogleSignin.configure({
    webClientId:
      "1073182005270-83corr1lqh8g0m6du0c4s5hbt926fbg1.apps.googleusercontent.com",
  });

  const signIn = async () => {
    try {
      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      // Get the users ID token\
      const response = await GoogleSignin.signIn();

      console.log("response", response);

      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(
        response.data?.idToken
      );

      // Sign-in the user with the credential
      return auth().signInWithCredential(googleCredential);
    } catch (error) {
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.IN_PROGRESS:
            // operation (eg. sign in) already in progress
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            // Android only, play services not available or outdated
            break;
          default:
          // some other error happened
        }
      } else {
        // an error that's not related to google sign in occurred
      }
    }
  };

  // Handle user state changes
  function onAuthStateChanged(user: any) {
    setUser(user);
    if (initializing) setInitializing(false);
  }

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
    return subscriber; // unsubscribe on unmount
  }, []);

  if (initializing) return null;

  return (
    <PaperProvider>
      {!user ? (
        <SafeAreaView
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <GoogleSigninButton
            size={GoogleSigninButton.Size.Wide}
            color={GoogleSigninButton.Color.Dark}
            onPress={signIn}
          />
        </SafeAreaView>
      ) : (
        <View style={{ flex: 1 }}>
          <View style={{ alignItems: "center", marginTop: 50 }}>
            <Text style={{ fontSize: 20, marginBottom: 20 }}>
              Welcome {user.email}
            </Text>
            <TouchableOpacity
              onPress={() => auth().signOut()}
              style={{
                backgroundColor: "#FF6347",
                paddingVertical: 10,
                paddingHorizontal: 20,
                borderRadius: 5,
              }}
            >
              <Text>Sign-out</Text>
            </TouchableOpacity>
          </View>

          <BottomNavigation
            navigationState={{ index, routes }}
            onIndexChange={setIndex}
            renderScene={renderScene}
          />
        </View>
      )}
    </PaperProvider>
  );
};

export default index;
