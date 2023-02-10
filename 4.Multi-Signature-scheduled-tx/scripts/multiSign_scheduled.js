const {
  Client,
  PrivateKey,
  AccountCreateTransaction,
  TransferTransaction,
  AccountBalanceQuery,
  Hbar,
  KeyList,
  ScheduleCreateTransaction,
} = require("@hashgraph/sdk");
require("dotenv").config();

//Grab your Hedera testnet account ID and private key from your .env file
const {
  CLIENT_ID,
  CLIENT_PRIVATE_KEY,
  ACCOUNT_1_PRIVATE_KEY,
  ACCOUNT_2_PRIVATE_KEY,
  ACCOUNT_3_PRIVATE_KEY,
  ACCOUNT_4_PRIVATE_KEY,
  ACCOUNT_5_PRIVATE_KEY,
  ACCOUNT_6_ID,
} = process.env;

const main = async () => {
  //Create a multi signature account with 20 Hbar starting balance
  const multiSigAccountID = await createMultiSigAccount();
  const txnInBase64 = await createScheduleTxnObj(multiSigAccountID);
  process.exit();
};

const createMultiSigAccount = async () => {
  try {
    console.log(
      "================= creating multi sign account ====================="
    );
    const client = await getClient();

    //Creating key objects and extracting public keys
    const key1 = PrivateKey.fromString(ACCOUNT_1_PRIVATE_KEY);
    const key2 = PrivateKey.fromString(ACCOUNT_2_PRIVATE_KEY);
    const key3 = PrivateKey.fromString(ACCOUNT_3_PRIVATE_KEY);
    const key4 = PrivateKey.fromString(ACCOUNT_4_PRIVATE_KEY);
    const key5 = PrivateKey.fromString(ACCOUNT_5_PRIVATE_KEY);

    const publicKeyList = [];
    publicKeyList.push(key1);
    publicKeyList.push(key2);
    publicKeyList.push(key3);
    publicKeyList.push(key4);
    publicKeyList.push(key5);

    //Create a key list where all 3 keys are required to sign
    const keys = new KeyList(publicKeyList, 3);

    const multiSigAccount = await new AccountCreateTransaction()
      .setKey(keys)
      .setInitialBalance(Hbar.fromString("20"))
      .execute(client);

    // Get the new account ID
    const getReceipt = await multiSigAccount.getReceipt(client);
    const multiSigAccountID = getReceipt.accountId;

    console.log("\nThe Multi Signature Account ID is: " + multiSigAccountID);
    return multiSigAccountID;
  } catch (err) {
    console.log("Error in creating multisign account : " + err);
  }
};

const createScheduleTxnObj = async (multiSigAccountID) => {
  try {
    const client = await getClient();

    // Creating a Transaction to send 10 HBAR to ACCOUNT_4_ID from MultiSig account
    const transaction = new TransferTransaction()
      .addHbarTransfer(multiSigAccountID, Hbar.fromString(`-10`))
      .addHbarTransfer(ACCOUNT_6_ID, Hbar.fromString("10"));

    //Schedule a transaction
    const transactionObj = new ScheduleCreateTransaction()
      .setScheduledTransaction(transaction)
      .setScheduleMemo("Scheduled Transaction From Account 1 to Account 6")
      //.setAdminKey(PrivateKey.fromString(ACCOUNT_1_PRIVATE_KEY))
      .freezeWith(client);

    const txResponse = await transactionObj.execute(client);
    const receipt = await txResponse.getReceipt(client);
    console.log(
      `TX ${txResponse.transactionId.toString()} status: ${receipt.status}`
    );

    //Get the schedule ID
    const scheduleId = receipt.scheduleId;
    console.log("The schedule ID is " + scheduleId);
  } catch (err) {
    console.log("Error in execute scheduled tx : " + err);
  }
};

const getClient = async () => {
  // If we weren't able to grab it, we should throw a new error
  if (CLIENT_ID == null || CLIENT_PRIVATE_KEY == null) {
    throw new Error(
      "Environment variables CLIENT_ID and CLIENT_PRIVATE_KEY must be present"
    );
  }

  // Create our connection to the Hedera network
  return Client.forTestnet().setOperator(CLIENT_ID, CLIENT_PRIVATE_KEY);
};

main();
