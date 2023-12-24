// Imports
// ========================================================
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { styles, RlyNetwork } from "../App";

// Component
// ========================================================
export default function ClaimRLY({ callback }: { callback?: () => {}}) {
  // State / Props
  const [isLoading, setIsloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Functions

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

      if (callback) {
        console.log("callback called");
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

  // Return
  return (
    <>
      <Pressable style={styles.buttonGreen} onPress={onPressClaimRLY}>
        <Text style={styles.textButtonGreen}>Claim $RLY Token</Text>
      </Pressable>
      {isLoading && <Text>Loading...</Text>}
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
