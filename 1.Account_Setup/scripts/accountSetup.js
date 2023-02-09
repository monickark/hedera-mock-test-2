const {
  Client,
  PrivateKey,
  AccountCreateTransaction,
  AccountBalanceQuery,
  Hbar,
} = require("@hashgraph/sdk");
require("dotenv").config();

//Grab your Hedera testnet account ID and private key from your .env file
const myAccountId = process.env.CLIENT_ID;
const myPrivateKey = process.env.CLIENT_PRIVATE_KEY;
const noOfAccounts = process.env.NUM_OF_ACCOUNTS;
console.log("No of accounts to create: " + noOfAccounts + "\n");
async function createAccount(count) {
  // If we weren't able to grab it, we should throw a new error
  if (myAccountId == null || myPrivateKey == null) {
    throw new Error(
      "Environment variables myAccountId and myPrivateKey must be present"
    );
  }

  // Create our connection to the Hedera network
  // The Hedera JS SDK makes this really easy!
  const client = Client.forTestnet();

  client.setOperator(myAccountId, myPrivateKey);

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
  //Verify the account balance
  const accountBalance = await new AccountBalanceQuery()
    .setAccountId(newAccountId)
    .execute(client);

  console.log(
    "Account balance of " +
      newAccountId +
      " is: " +
      accountBalance.hbars +
      " hbars. \n"
  );
}
async function main() {
  for (var i = 0; i < noOfAccounts; i++) {
    await createAccount(i + 1);
  }
  process.exit();
}
main();
