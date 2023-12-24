// Imports
// ========================================================
import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import {
  RlyMumbaiNetwork,
  Network,
  getAccount,
  permanentlyDeleteAccount,
} from "@rly-network/mobile-sdk";
import { PrivateConfig } from "./private_config";
import WalletCreate from "./components/WalletCreate";
import ClaimRLY from "./components/ClaimRLY";
import SendRLY from "./components/SendRLY";

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
  const [tokenBalance, setTokenBalance] = useState("");
  const [isRetrievingBalance, setIsRetrievingBalance] = useState(false);

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
      onLoadGetBalance();
    }
    setIsLoaded(true);
    console.groupEnd();
  };

  /**
   * @dev function that retrieves the $RLY token balance
   */
  const onLoadGetBalance = async () => {
    console.group("onLoadGetBalance");
    setIsRetrievingBalance(true);
    const balance = await RlyNetwork.getExactBalance(
      PrivateConfig.RLY_TOKEN_ADDRESS_MUMBAI
    );
    console.log({ balance });
    setTokenBalance(balance);
    setIsRetrievingBalance(false);
    console.groupEnd();
  };

  // Hooks
  useEffect(() => {
    // If you need to reset the wallet, uncomment the line below
    // permanentlyDeleteAccount();
    onLoadGetAccount();
  }, []);

  // Render
  if (!isLoaded) {
    return (
      <View style={styles.container}>
        <Text style={styles.textHeading}>RallyMobile SDK</Text>
        <Text style={styles.textParagraph}>Gasless Transactions</Text>
        <Text>Loading...</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.textHeading}>RallyMobile SDK</Text>
      <Text style={styles.textParagraph}>Gasless Transactions</Text>
      {isLoaded && accountAddress && (
        <>
          <Text style={styles.textLabel}>Account Address</Text>
          <Text numberOfLines={1} style={styles.textCode}>
            {accountAddress}
          </Text>
          <>
            <Text style={styles.textLabel}>$RLY Balance</Text>
            {isRetrievingBalance && <Text style={{ marginBottom: 24 }}>Loading...</Text>}
            {!isRetrievingBalance && (
              <>
                <Text
                  numberOfLines={1}
                  style={{ ...styles.textCode, marginBottom: 8 }}
                >
                  {tokenBalance}
                </Text>
                <Text style={styles.textLabel}>
                  {parseInt(tokenBalance) / 1000000000000000000} $RLY
                </Text>
              </>
            )}
          </>
          <ClaimRLY callback={onLoadGetBalance} />
          <SendRLY callback={onLoadGetBalance} />
        </>
      )}
      {isLoaded && !accountAddress && (
        <WalletCreate callback={onLoadGetBalance} />
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
  textLabelSuccess: {
    fontSize: 14,
    fontWeight: "500",
    color: "#00D348",
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
  textSuccess: {
    display: "flex",
    fontSize: 14,
    textAlign: "center",
    color: "#00D348",
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
  },
  viewSuccess: {
    display: "flex",
    alignItems: "center",
    color: "#D30000",
    fontWeight: "500",
    lineHeight: 48,
    backgroundColor: "#B1EAB0",
    paddingLeft: 12,
    paddingRight: 12,
    borderRadius: 6,
    width: "90%",
  },
  inputText: {
    height: 48,
    borderWidth: 2,
    paddingLeft: 16,
    paddingRight: 16,
    borderColor: "#DDDDDD",
    borderRadius: 6,
    width: "90%",
    marginBottom: 24,
  },
});
