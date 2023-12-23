// Imports
// ========================================================
import { useEffect, useState } from "react";
import { Pressable, Text, View, TextInput } from "react-native";
import { MetaTxMethod } from "@rly-network/mobile-sdk";
import { PrivateConfig } from "../private_config";
import { styles, RlyNetwork } from "../App";
import { openURL } from "expo-linking";

// Component
// ========================================================
export default function SendRLY({ callback }: { callback?: () => {} }) {
  // State / Props
  const [isLoading, setIsloading] = useState(true);
  const [tokenBalance, setTokenBalance] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [transactionHash, setTransactionHash] = useState("");

  // Functions
  /**
   * @dev function that validates a wallet address
   * @param address
   * @returns
   */
  const isValidWalletAddress = (address: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  /**
   * @dev function that retrieves the $RLY token balance
   */
  const onLoadGetBalance = async () => {
    console.group("onLoadGetBalance");
    const balance = await RlyNetwork.getExactBalance(
      PrivateConfig.RLY_TOKEN_ADDRESS_MUMBAI
    );
    console.log({ balance });
    setTokenBalance(balance);
    setIsloading(false);
    console.groupEnd();
  };

  /**
   * @dev function that handles send $RLY token to a wallet address
   */
  const onPressSendRLY = async () => {
    console.group("onPressSendRLY");
    if (isLoading) return; // Prevent multiple clicks
    setIsloading(true);
    setErrorMessage("");
    setTransactionHash("");

    try {
      if (!isValidWalletAddress(walletAddress)) {
        throw "Invalid wallet address";
      }

      if (parseInt(tokenBalance) <= 0) {
        throw "Insufficient $RLY balance";
      }

      // Attempt to Send RLY token
      console.log({ walletAddress });
      const tx = await RlyNetwork.transfer(
        walletAddress, // destinationAddress
        1, // amount
        PrivateConfig.RLY_TOKEN_ADDRESS_MUMBAI, // tokenAddress
        MetaTxMethod.ExecuteMetaTransaction // metaTxMethod
      );
      console.log({ tx });
      setTransactionHash(tx);

      // Update local state balance
      onLoadGetBalance();

      // If callback is passed, execute it
      if (callback) {
        console.log('callback called');
        callback();
      }
    } catch (error: any) {
      console.error(error?.reason);
      console.error(error);
      if (typeof error === "string" || typeof error?.reason === "string") {
        setErrorMessage(error?.reason ?? error);
      }
    }

    setIsloading(false);
    console.groupEnd();
  };

  /**
   * @dev function that handles opening url to the transaction hash in a block explorer
   */
  const onPressSeeTransaction = () => {
    openURL(`${PrivateConfig.POLYGON_BLOCK_EXPLORER}/tx/${transactionHash}`);
  };

  // Hooks
  /**
   * @dev useEffect hook that retrieves the RLY token balance
   */
  useEffect(() => {
    onLoadGetBalance();
  }, []);

  // Return
  return (
    <>
      <Text style={{ ...styles.textLabel, marginTop: 24 }}>
        Send To Wallet Address
      </Text>
      <TextInput
        style={styles.inputText}
        value={walletAddress}
        onChangeText={setWalletAddress}
        placeholder="Ex: 0x12ABC56..."
      />
      <Pressable style={styles.buttonGreen} onPress={onPressSendRLY}>
        <Text style={styles.textButtonGreen}>Send $RLY Token</Text>
      </Pressable>
      {isLoading && <Text>Sending...</Text>}
      {transactionHash !== "" && !isLoading && (
        <>
          <Text style={styles.textLabelSuccess}>Successfully Transferred</Text>
          <Text numberOfLines={1} style={styles.textCode}>
            {transactionHash}
          </Text>
          <Pressable style={styles.buttonBlack} onPress={onPressSeeTransaction}>
            <Text style={styles.textButton}>See Successful Transaction</Text>
          </Pressable>
        </>
      )}
      {errorMessage !== "" && (
        <>
          <Text style={styles.textLabelError}>Error</Text>
          <View style={styles.viewError}>
            <Text style={styles.textError}>{errorMessage}</Text>
          </View>
        </>
      )}
    </>
  );
}
