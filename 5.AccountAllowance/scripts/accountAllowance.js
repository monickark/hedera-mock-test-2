const {
  Client,
  PrivateKey,
  AccountCreateTransaction,
  AccountBalanceQuery,
  Hbar,
  AccountAllowanceApproveTransaction,
  AccountId,
  TransferTransaction,
} = require("@hashgraph/sdk");
require("dotenv").config();

//Grab your Hedera testnet account ID and private key from your .env file

const { CLIENT_ID, CLIENT_PRIVATE_KEY } = process.env;

let accountIds = [];
let accountPvtKeys = [];

async function createAccount(count) {
  try {
    const client = await getClient();

    //Create new keys
    const newAccountPrivateKey = PrivateKey.generateED25519();
    const newAccountPublicKey = newAccountPrivateKey.publicKey;
    //Create a new account with 1,000 tinybar starting balance
    const newAccount = await new AccountCreateTransaction()
      .setKey(newAccountPublicKey)
      .setInitialBalance(new Hbar(100))
      .execute(client);

    // Get the new account ID
    const getReceipt = await newAccount.getReceipt(client);
    const newAccountId = getReceipt.accountId;

    console.log("Account id " + count + " is " + newAccountId);
    console.log("Private Key :" + newAccountPrivateKey);
    console.log("Public Key :" + newAccountPublicKey);

    accountIds.push(newAccountId);
    accountPvtKeys.push(newAccountPrivateKey);
  } catch (err) {
    console.log("Error in creating account : " + err);
  }
}

async function setAllowance() {
  try {
    console.log("\n Setting account1 allowance for account0");
    const client = await getClient();
    //Create the transaction
    const transaction = new AccountAllowanceApproveTransaction()
      .approveHbarAllowance(
        AccountId.fromString(accountIds[0]),
        AccountId.fromString(accountIds[1]),
        Hbar.from(50)
      )
      .freezeWith(client);

    console.log("setting allowance: " + accountPvtKeys[0]);
    // Sign the transaction with the owner account key
    const signTx = await transaction.sign(
      PrivateKey.fromString(accountPvtKeys[0].toString())
    );

    //Sign the transaction with the client operator private key and submit to a Hedera network
    const txResponse = await signTx.execute(client);

    //Request the receipt of the transaction
    const receipt = await txResponse.getReceipt(client);

    //Get the transaction consensus status
    const transactionStatus = receipt.status;

    console.log(
      "The transaction consensus status is " + transactionStatus.toString()
    );

    //v2.13.0
  } catch (err) {
    console.log("Error in setting allowance: " + err);
  }
}

async function transferHBAR() {
  try {
    console.log("\n Transfering token using account1 key");
    const client = await getClient();
    //Create the transaction
    const transaction = new TransferTransaction()
      .addHbarTransfer(AccountId.fromString(accountIds[0]), new Hbar(-10))
      .addHbarTransfer(AccountId.fromString(accountIds[2]), new Hbar(10))
      .freezeWith(client);

    //Sign the transaction with the owner account key
    const signTx = await transaction.sign(
      PrivateKey.fromString(accountPvtKeys[1].toString())
    );

    //Sign the transaction with the client operator private key and submit to a Hedera network
    const txResponse = await signTx.execute(client);

    //Request the receipt of the transaction
    const receipt = await txResponse.getReceipt(client);

    //Get the transaction consensus status
    const transactionStatus = receipt.status;

    console.log(
      "The transaction consensus status is " + transactionStatus.toString()
    );

    //v2.13.0
  } catch (err) {
    console.log("Error in creating account : " + err);
  }
}

async function main() {
  for (var i = 0; i < 3; i++) {
    await createAccount(i + 1);
  }
  await setAllowance();
  await transferHBAR();
  process.exit();
}

const getClient = async () => {
  // If we weren't able to grab it, we should throw a new error
  if (CLIENT_ID == null || CLIENT_PRIVATE_KEY == null) {
    throw new Error(
      "Environment variables CLIENT_ID and CLIENT_PRIVATE_KEY must be present"
    );
  }

  // Create our connection to the Hedera network
  return Client.forTestnet().setOperator(
    AccountId.fromString(CLIENT_ID),
    PrivateKey.fromString(CLIENT_PRIVATE_KEY)
  );
};

main();
