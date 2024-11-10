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
import Contacts from "react-native-contacts";

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
          PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
        ]);

        if (
          granted[PermissionsAndroid.PERMISSIONS.CAMERA] !==
            PermissionsAndroid.RESULTS.GRANTED ||
          granted[PermissionsAndroid.PERMISSIONS.CALL_PHONE] !==
            PermissionsAndroid.RESULTS.GRANTED ||
          granted[PermissionsAndroid.PERMISSIONS.READ_CONTACTS] !==
            PermissionsAndroid.RESULTS.GRANTED
        ) {
          Alert.alert("Permissions", "Camera or Call permissions not granted");
        }
      }
    } catch (err) {
      console.warn("Permissions error:", err);
    }
  };

  const extractPhoneNumber = (input: string): string | null => {
    const phoneRegex = /(\+?\d[\d\s.-]{7,}\d)/; // Regex to match phone numbers with optional international code
    const match = input.match(phoneRegex);
    return match ? match[0].replace(/\s|-/g, "") : null; // Clean up spaces or hyphens
  };

  const extractName = (input: string, matchedPhrase: string): string | null => {
    console.log(matchedPhrase);
    const regex = new RegExp(`${matchedPhrase}\\s([\\w\\s]+)`, "i");
    const match = input.match(regex);
    console.log(match);
    return match ? match[1].trim() : null;
  };

  const openLink = (url: string, error: string) => {
    Linking.openURL(url).then((supported) => {
      console.log(supported);
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert("Error", error);
      }
    });
  };

  const openCamera = () => {
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
  };

  const sendWhatsAppMessage = (phoneNumber: string, message: string) => {
    const url = `whatsapp://send?text=${encodeURIComponent(
      message
    )}&phone=${phoneNumber}`;
    openLink(url, "WhatsApp is not installed on this device");
  };

  const handleWhatsappMessage = async (voiceCommand: string) => {
    const name = extractName(voiceCommand, "send whatsapp message to");
    const message = "Hello, this is a test message"; // Replace with dynamic input as needed
    const phoneNumber = extractPhoneNumber(voiceCommand);

    console.log("name", name);

    if (name) {
      const contactNumber = await findContactByName(name);
      if (contactNumber) {
        sendWhatsAppMessage(contactNumber, message);
      }
    } else if (phoneNumber) {
      sendWhatsAppMessage(phoneNumber, message);
    } else {
      Alert.alert("No Contacts available", "");
    }
  };

  const handleCall = async (voiceCommand: string) => {
    const name = extractName(voiceCommand, "make a call to");
    const phoneNumber = extractPhoneNumber(voiceCommand);

    console.log("name", name, phoneNumber);
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    } else if (name) {
      const contactNumber = await findContactByName(name);
      if (contactNumber) {
        Linking.openURL(`tel:${contactNumber}`);
      }
    } else {
      Alert.alert("Error", "No phone number found in the command");
    }
  };

  const handleVoiceCommand = async (voiceCommand: string) => {
    if (voiceCommand.toLowerCase().includes("open camera")) {
      openCamera();
    } else if (voiceCommand.toLowerCase().includes("send whatsapp message")) {
      await handleWhatsappMessage(voiceCommand);
    } else if (
      voiceCommand.toLowerCase().includes("dial") ||
      voiceCommand.toLowerCase().includes("call to")
    ) {
      await handleCall(voiceCommand);
    } else {
      Alert.alert("Command Not Recognized", "The command was not recognized.");
    }
  };

  const findContactByName = async (name: string) => {
    return Contacts.getAll()
      .then((contacts) => {
        const foundContact = contacts.find((contact) => {
          return (
            contact.givenName?.toLowerCase() === name.toLowerCase() ||
            contact.displayName?.toLowerCase() === name.toLowerCase()
          );
        });

        if (foundContact && foundContact.phoneNumbers.length > 0) {
          const phoneNumber = foundContact.phoneNumbers[0].number.replace(
            /\s|-/g,
            ""
          );
          return phoneNumber;
        } else {
          Alert.alert("Contact Not Found", `No contact found for "${name}".`);
          return null;
        }
      })
      .catch((error) => {
        console.error("Error accessing contacts:", error);
        Alert.alert("Error", "Unable to access contacts.");
      });
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
