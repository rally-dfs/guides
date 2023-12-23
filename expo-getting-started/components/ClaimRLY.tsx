// Imports
// ========================================================
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { PrivateConfig } from "../private_config";
import { styles, RlyNetwork } from "../App";

// Component
// ========================================================
export default function ClaimRLY() {
  // State / Props
  const [isLoading, setIsloading] = useState(true);
  const [tokenBalance, setTokenBalance] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Functions
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
   * @dev function that handles the $RLY token claim
   */
  const onPressClaimRLY = async () => {
    console.group("onPressClaimRLY");
    setIsloading(true);
    setErrorMessage("");

    try {
      // Attempt to claim RLY token
      const tx = await RlyNetwork.claimRly();
      console.log({ tx });

      const balance = await RlyNetwork.getExactBalance(
        PrivateConfig.RLY_TOKEN_ADDRESS_MUMBAI
      );
      console.log({ balance });
      setTokenBalance(balance);
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error);
    }

    setIsloading(false);
    console.groupEnd();
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
      <Pressable style={styles.buttonGreen} onPress={onPressClaimRLY}>
        <Text style={styles.textButtonGreen}>Claim $RLY Token</Text>
      </Pressable>
      {isLoading && <Text>Loading...</Text>}
      {!isLoading && (
        <>
          <Text style={styles.textLabel}>$RLY Balance</Text>
          <Text numberOfLines={1} style={{ ...styles.textCode, marginBottom: 8 }}>
            {tokenBalance}
          </Text>
          <Text style={styles.textLabel}>{parseInt(tokenBalance)/1000000000000000000} $RLY</Text>
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
