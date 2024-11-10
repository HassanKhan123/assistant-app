import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Button,
  Linking,
  Alert,
  PermissionsAndroid,
  Platform,
} from "react-native";
import Voice from "@react-native-community/voice";
import { launchCamera } from "react-native-image-picker";

const Assistant = () => {
  const [command, setCommand] = useState<string>("");

  useEffect(() => {
    Voice.onSpeechResults = (event) => {
      const voiceCommand = event.value ? event.value[0] : "";
      setCommand(voiceCommand);
      handleVoiceCommand(voiceCommand);
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const startListening = async () => {
    try {
      await requestPermissions();
      Voice.start("en-US");
    } catch (e) {
      console.error("Voice start error:", e);
    }
  };

  const requestPermissions = async () => {
    try {
      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CALL_PHONE,
          PermissionsAndroid.PERMISSIONS.CAMERA,
        ]);

        if (
          granted[PermissionsAndroid.PERMISSIONS.CAMERA] !==
            PermissionsAndroid.RESULTS.GRANTED ||
          granted[PermissionsAndroid.PERMISSIONS.CALL_PHONE] !==
            PermissionsAndroid.RESULTS.GRANTED
        ) {
          Alert.alert("Permissions", "Camera or Call permissions not granted");
        }
      }
    } catch (err) {
      console.warn("Permissions error:", err);
    }
  };

  const handleVoiceCommand = (voiceCommand: string) => {
    const phoneNumber = "+923243219156";
    if (voiceCommand.toLowerCase().includes("open camera")) {
      // Open camera logic (Navigate to camera screen)
      launchCamera(
        {
          mediaType: "photo",
          saveToPhotos: true,
        },
        (response) => {
          if (response.didCancel) {
            console.log("User cancelled camera");
          } else if (response.errorMessage) {
            console.error("Camera error:", response.errorMessage);
          } else {
            console.log("Camera response:", response.assets);
          }
        }
      );
    } else if (voiceCommand.toLowerCase().includes("send whatsapp message")) {
      const message = "Hello, this is a test message"; // Replace with dynamic input as needed
      const url = `whatsapp://send?text=${encodeURIComponent(
        message
      )}&phone=${phoneNumber}`;

      Linking.openURL(url).then((supported) => {
        console.log(supported);
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert("Error", "WhatsApp is not installed on this device");
        }
      });
    } else if (voiceCommand.toLowerCase().includes("dial")) {
      if (phoneNumber) {
        Linking.openURL(`tel:${phoneNumber}`);
      } else {
        Alert.alert("Error", "No phone number found in the command");
      }
    } else {
      Alert.alert("Command Not Recognized", "The command was not recognized.");
    }
  };
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>AI Assistant</Text>
      <Button title="Start Listening" onPress={startListening} />
      {command ? <Text>Last Command: {command}</Text> : null}
    </View>
  );
};

export default Assistant;
