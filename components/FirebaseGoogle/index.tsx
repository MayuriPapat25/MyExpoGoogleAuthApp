import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from "react-native";
import React, { useEffect, useState } from "react";
import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
  GoogleSigninButton,
} from "@react-native-google-signin/google-signin";
import auth from "@react-native-firebase/auth";

const FirebaseGoogle = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState();
  const [previousUserEmail, setPreviousUserEmail] = useState(null);

  GoogleSignin.configure({
    webClientId:
      "1073182005270-83corr1lqh8g0m6du0c4s5hbt926fbg1.apps.googleusercontent.com",
    offlineAccess: true, // Recommended for getting a refresh token if you need server-side access
  });

  const signIn = async () => {
    try {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      let userInfo;
      try {
        // Attempt silent sign-in first
        userInfo = await GoogleSignin.signInSilently();
        if (userInfo) {
          console.log("Silent sign-in successful (User Info):", userInfo);
          // If silent sign-in provides user info, use it
          const googleCredential = auth.GoogleAuthProvider.credential(
            userInfo?.data?.idToken
          );
          await auth().signInWithCredential(googleCredential);
          return; // Exit as user is signed in
        }
      } catch (silentError) {
        // This catch block specifically handles errors from signInSilently()
        // such as statusCodes.SIGN_IN_REQUIRED if no user is found silently.
        console.log(
          "Silent sign-in failed, proceeding to interactive sign-in:",
          silentError.code
        );
        // Do not throw here, just proceed to interactive sign-in
      }

      // If silent sign-in didn't succeed or threw an error, prompt for interactive sign-in
      console.log("Attempting interactive sign-in...");
      const response = await GoogleSignin.signIn();
      console.log("Interactive sign-in response:", response);

      // IMPORTANT: idToken is directly on the response object, not in response.data
      const googleCredential = auth.GoogleAuthProvider.credential(
        response?.data?.idToken
      );

      return auth().signInWithCredential(googleCredential);
    } catch (error) {
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.SIGN_IN_CANCELLED:
            console.log("User cancelled the login flow");
            break;
          case statusCodes.IN_PROGRESS:
            console.log("Operation (e.g. sign in) already in progress");
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            Alert.alert(
              "Google Play Services Not Available",
              "Please update Google Play Services to sign in."
            );
            break;
          case statusCodes.SIGN_IN_REQUIRED:
            console.log("No user signed in previously, sign-in required.");
            // This is often what you get from signInSilently if no user is cached.
            break;
          default:
            console.error("Google Sign-In Error:", error.code, error.message);
          // Consider showing a user-friendly error message
        }
      } else {
        // This catches generic errors, including the TypeError you saw if idToken was undefined
        console.error("Non-Google Sign-In Error:", error);
      }
    }
  };

  const handleSignInOrChooseAccount = async () => {
    try {
      // Directly call signIn, which will try silent first
      await signIn();
    } catch (error) {
      console.error("Error during handleSignInOrChooseAccount:", error);
      Alert.alert("Sign-In Failed", "Could not sign in. Please try again.");
    }
  };

  const addAnotherAccount = async () => {
    try {
      // First, revoke access to ensure a fresh account selection screen
      // This is stronger than just signOut if you truly want to force
      // "Add another account" and remove the previous one from the device's cache for your app.
      // If you just want to let them choose another account without removing the previous one's permissions,
      // then GoogleSignin.signOut() might be sufficient.
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut(); // Ensure any existing session is cleared
      setPreviousUserEmail(null); // Clear previous email display
      await signIn(); // Then initiate a new sign-in flow
    } catch (error) {
      console.error("Error adding another account:", error);
      Alert.alert("Error", "Could not add another account. Please try again.");
    }
  };

  // Handle user state changes for Firebase authentication
  function onAuthStateChanged(firebaseUser: any) {
    setUser(firebaseUser);
    if (initializing) setInitializing(false);
  }

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
    return subscriber; // unsubscribe on unmount
  }, []);

  useEffect(() => {
    // When the component mounts or Firebase user state changes,
    // check for a previously signed-in Google user.
    const checkPreviousGoogleSignIn = async () => {
      try {
        const userInfo = await GoogleSignin.hasPreviousSignIn();
        if (userInfo && userInfo.user && userInfo.user.email) {
          setPreviousUserEmail(userInfo.user.email);
        } else {
          setPreviousUserEmail(null);
        }
      } catch (error) {
        // This catch block handles cases where no previous sign-in is found
        // or other errors with getPreviousSignIn().
        console.log(
          "No previous Google sign-in found or error:",
          error.code,
          error.message
        );
        setPreviousUserEmail(null);
      }
    };
    // Only run this if no Firebase user is currently logged in,
    // or if we're explicitly checking after a Firebase logout.
    if (!user) {
      checkPreviousGoogleSignIn();
    } else {
      setPreviousUserEmail(null); // Clear previous email if a Firebase user is already active
    }
  }, [user]); // Re-run if the Firebase user changes

  if (initializing) return null;

  if (!user) {
    return (
      <SafeAreaView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        {previousUserEmail ? (
          <View style={{ alignItems: "center" }}>
            <Text style={{ marginBottom: 10, fontSize: 18 }}>
              Welcome back, {previousUserEmail}!
            </Text>
            <TouchableOpacity
              onPress={handleSignInOrChooseAccount} // This will re-attempt sign-in with the previous account
              style={{
                backgroundColor: "#4285F4",
                paddingVertical: 10,
                paddingHorizontal: 20,
                borderRadius: 5,
                marginBottom: 10,
              }}
            >
              <Text style={{ color: "white", fontSize: 16 }}>
                Continue as {previousUserEmail}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={addAnotherAccount}
              style={{
                backgroundColor: "#E5E5E5",
                paddingVertical: 10,
                paddingHorizontal: 20,
                borderRadius: 5,
              }}
            >
              <Text style={{ color: "black", fontSize: 16 }}>
                Add another account
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <GoogleSigninButton
            size={GoogleSigninButton.Size.Wide}
            color={GoogleSigninButton.Color.Dark}
            onPress={signIn} // Initial sign-in when no previous user is detected
          />
        )}
      </SafeAreaView>
    );
  }

  console.log("Firebase user:", user.email);

  return (
    <View style={{ justifyContent: "center", flex: 1, alignItems: "center" }}>
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
        <Text style={{ color: "white", fontSize: 16 }}>Sign-out</Text>
      </TouchableOpacity>
    </View>
  );
};

export default FirebaseGoogle;
