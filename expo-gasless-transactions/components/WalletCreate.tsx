// Imports
// ========================================================
import { createAccount, getAccount } from "@rly-network/mobile-sdk";
import { Pressable, Text } from "react-native";
import { styles } from "../App";

// Component
// ========================================================
export default function WalletCreate({ callback }: { callback: () => void }) {
  // State / Props

  // Functions
  /**
   * @dev function that handles the EOA wallet creation on device
   */
  const onPressCreateWallet = async () => {
    console.group("onPressCreateWallet");

    try {
      // Attempt to retrieve an existing account
      let account = await getAccount();
      console.log({ account });
      if (!account) {
        // If no account is found, create a new one
        console.log("Account not found. Creating account...");
        await createAccount({
          overwrite: true, // Remove is you don't want a new wallet every second
          storageOptions: {
            saveToCloud: false, rejectOnCloudSaveFailure: true
          },
        });
        console.log("Account created.");
        account = await getAccount(); // Retrieve the newly created account
      }

      if (account) {
        if (callback) {
          callback();
        }
      }
    } catch (error) {
      console.error(error);
    }

    console.groupEnd();
  };

  // Return
  return (
    <>
      <Pressable style={styles.button} onPress={onPressCreateWallet}>
        <Text style={styles.textButton}>Create Wallet</Text>
      </Pressable>
    </>
  );
}
