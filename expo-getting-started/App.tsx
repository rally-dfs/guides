// Imports
// ========================================================
import { useEffect, useState } from "react";
import { setStringAsync } from "expo-clipboard";
import { StatusBar } from "expo-status-bar";
import { Pressable, StyleSheet, Text, View, Alert } from "react-native";
import { RlyMumbaiNetwork, Network, getAccount, permanentlyDeleteAccount } from "@rly-network/mobile-sdk";
import { PrivateConfig } from "./private_config";
import WalletCreate from "./components/WalletCreate";
import ClaimRLY from "./components/ClaimRLY";

// Config
// ========================================================
export const RlyNetwork: Network = RlyMumbaiNetwork;
RlyNetwork.setApiKey(PrivateConfig.RALLY_API_KEY);

// Main App
// ========================================================
export default function App() {
  // State / Props
  const [accountAddress, setAccountAddress] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Functions
  /**
   * @dev function that retrieving the EOA wallet on device
   */
  const onLoadGetAccount = async () => {
    console.group("onLoadGetAccount");
    let account = await getAccount();
    console.log({ account });
    if (account) {
      setAccountAddress(account);
    }
    setIsLoaded(true);
    console.groupEnd();
  };

  /**
   * @dev function that handles the EOA wallet address copy to clipboard
   */
  const onPressCopyToClipboard = async () => {
    await setStringAsync(accountAddress);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 600);
  };

  /**
   * @dev function that handles the EOA wallet deletion on device
   */
  const onPressDeleteAccount = async () => {
    await Alert.alert('Delete Account', 'Are you sure you want to permanently delete your account?', [
      {
        text: 'Cancel',
        onPress: () => {
          console.group('Alert Cancel');
          console.groupEnd();
        },
        style: 'cancel',
      },
      {
        text: 'OK',
        onPress: async () => {
          console.group('Alert OK');
          setIsLoaded(false);
          await permanentlyDeleteAccount();
          await onLoadGetAccount();
          setAccountAddress("");
          console.groupEnd();
        }
      },
    ]);
  };

  // Hooks
  useEffect(() => {
    onLoadGetAccount();
  }, []);

  // Render
  if (!isLoaded) {
    return (
      <View style={styles.container}>
        <Text style={styles.textHeading}>RallyMobile SDK</Text>
        <Text style={styles.textParagraph}>EOA Wallet Creation</Text>
        <Text>Loading...</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.textHeading}>RallyMobile SDK</Text>
      <Text style={styles.textParagraph}>EOA Wallet Creation</Text>
      {isLoaded && accountAddress && (
        <>
          <Text style={styles.textLabel}>Account Address</Text>
          <Text numberOfLines={1} style={styles.textCode}>
            {accountAddress}
          </Text>
          <Pressable
            style={styles.buttonRed}
            onPress={onPressDeleteAccount}
          >
            <Text style={styles.textButton}>
              Permanently Delete Account
            </Text>
          </Pressable>
          <Pressable
            style={isCopied ? styles.buttonBlack : styles.button}
            onPress={onPressCopyToClipboard}
          >
            <Text style={styles.textButton}>
              {isCopied ? "Copied" : "Copy Address"}
            </Text>
          </Pressable>
          <ClaimRLY />
        </>
      )}
      {isLoaded && !accountAddress && (
        <WalletCreate callback={onLoadGetAccount} />
      )}
      <StatusBar style="auto" />
    </View>
  );
}

// Styles
// ========================================================
export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  textHeading: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  textParagraph: {
    fontSize: 16,
    marginBottom: 24,
    color: "#666",
  },
  textLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#999",
    marginBottom: 12,
  },
  textLabelError: {
    fontSize: 14,
    fontWeight: "500",
    color: "#D30000",
    marginBottom: 12,
  },
  textCode: {
    backgroundColor: "#eee",
    fontSize: 16,
    fontFamily: "monospace",
    width: "90%",
    lineHeight: 48,
    paddingLeft: 8,
    paddingRight: 8,
    marginBottom: 24,
    textAlign: "center",
  },
  textButton: {
    fontSize: 16,
    textAlign: "center",
    color: "white",
    fontWeight: "bold",
    lineHeight: 48,
  },
  textButtonGreen: {
    fontSize: 16,
    textAlign: "center",
    color: "black",
    fontWeight: "bold",
    lineHeight: 48,
  },
  textError: {
    display: "flex",
    fontSize: 14,
    textAlign: "center",
    color: "#D30000",
    fontWeight: "500",
    lineHeight: 48,
  },
  button: {
    justifyContent: "center",
    backgroundColor: "rgb(79, 70, 229)",
    width: "90%",
    borderRadius: 6,
    marginBottom: 24,
  },
  buttonBlack: {
    justifyContent: "center",
    backgroundColor: "rgb(0, 0, 0)",
    width: "90%",
    borderRadius: 6,
    marginBottom: 24,
  },
  buttonRed: {
    justifyContent: "center",
    backgroundColor: "rgb(255, 0, 0)",
    width: "90%",
    borderRadius: 6,
    marginBottom: 24,
  },
  buttonGreen: {
    justifyContent: "center",
    backgroundColor: "#CEFF45",
    width: "90%",
    borderRadius: 6,
    marginBottom: 24,
  },
  viewError: {
    display: "flex",
    alignItems: "center",
    color: "#D30000",
    fontWeight: "500",
    lineHeight: 48,
    backgroundColor: "#FFD3D3",
    paddingLeft: 12,
    paddingRight: 12,
    borderRadius: 6,
    width: "90%",
  }
});
