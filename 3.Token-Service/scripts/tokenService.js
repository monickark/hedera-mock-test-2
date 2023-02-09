const {
  TokenCreateTransaction,
  Client,
  TokenType,
  TokenSupplyType,
  TokenMintTransaction,
  AccountBalanceQuery,
  PrivateKey,
  Wallet,
  CustomFixedFee,
  Hbar,
  TokenId,
  AccountId,
  TransferTransaction,
  TokenAssociateTransaction,
  CustomRoyaltyFee,
  TokenGrantKycTransaction,
  TokenRevokeKycTransaction,
  TokenInfoQuery,
} = require("@hashgraph/sdk");
require("dotenv").config();

//Grab your Hedera testnet account ID and private key from your .env file
const {
  CLIENT_ID,
  CLIENT_PRIVATE_KEY,
  ACCOUNT_1_ID,
  ACCOUNT_1_PRIVATE_KEY,
  ACCOUNT_2_ID,
  ACCOUNT_2_PRIVATE_KEY,
  ACCOUNT_3_ID,
  ACCOUNT_3_PRIVATE_KEY,
  ACCOUNT_4_ID,
  ACCOUNT_4_PRIVATE_KEY,
  ACCOUNT_5_ID,
  ACCOUNT_5_PRIVATE_KEY,
} = process.env;

let tokenId;

async function main() {
  await createToken();
  await associateToken();
  await setKYC();
  process.exit();
}

const createToken = async () => {
  try {
    const client = await getClient();

    const transaction = new TokenCreateTransaction()
      .setTokenName("Hedera Certificate Token ")
      .setTokenSymbol("HCT")
      .setTokenType(TokenType.NonFungibleUnique)
      .setTreasuryAccountId(AccountId.fromString(ACCOUNT_1_ID))
      .setInitialSupply(0)
      .setSupplyType(TokenSupplyType.Finite)
      .setMaxSupply(5)
      .setAdminKey(PrivateKey.fromString(ACCOUNT_1_PRIVATE_KEY))
      .setSupplyKey(PrivateKey.fromString(ACCOUNT_2_PRIVATE_KEY))
      .setKycKey(PrivateKey.fromString(ACCOUNT_3_PRIVATE_KEY))
      .freezeWith(client);

    //Sign the transaction with the client, who is set as admin and treasury account
    const signTx = await transaction.sign(
      PrivateKey.fromString(ACCOUNT_1_PRIVATE_KEY)
    );

    //Submit to a Hedera network
    const txResponse = await signTx.execute(client);

    //Get the receipt of the transaction
    const receipt = await txResponse.getReceipt(client);

    //Get the token ID from the receipt
    tokenId = receipt.tokenId;

    console.log("The new token ID is " + tokenId + "\n");
  } catch (err) {
    console.log("Error while creating token: " + err);
  }
};

const associateToken = async () => {
  try {
    console.log(`\n ASSOCIATION STARTED`);

    const client = await getClient();
    // MANUAL ASSOCIATION FOR ACCOUNT 4 ACCOUNT
    let associateAliceTx = await new TokenAssociateTransaction()
      .setAccountId(AccountId.fromString(ACCOUNT_4_ID))
      .setTokenIds([tokenId])
      .freezeWith(client)
      .sign(PrivateKey.fromString(ACCOUNT_4_PRIVATE_KEY));
    let associateAliceTxSubmit = await associateAliceTx.execute(client);
    let associateAliceRx = await associateAliceTxSubmit.getReceipt(client);
    console.log(`Token association: ${associateAliceRx.status}`);
  } catch (err) {
    console.log("Error while associating token: " + err);
  }
};

const setKYC = async () => {
  try {
    console.log(`\n KYC STARTED`);
    // ENABLE TOKEN KYC FOR ALICE AND BOB
    let aliceKyc = await kycEnableFcn(
      AccountId.fromString(ACCOUNT_4_ID),
      tokenId
    );
    console.log(
      `- Enabling token KYC for ${ACCOUNT_2_ID} account is: ${aliceKyc.status}`
    );

    // QUERY TO CHECK INTIAL KYC KEY
    var tokenInfo = await tQueryFcn();
    console.log(
      `- KYC key for the NFT is: \n${tokenInfo.kycKey.toString()} \n`
    );
  } catch (err) {
    console.log("Error while assigning kyc: " + err);
  }
};

// KYC ENABLE FUNCTION ==========================================
async function kycEnableFcn(id, tokenId) {
  const client = await getClient();
  let kycEnableTx = await new TokenGrantKycTransaction()
    .setAccountId(id)
    .setTokenId(tokenId)
    .freezeWith(client)
    .sign(PrivateKey.fromString(ACCOUNT_3_PRIVATE_KEY));
  let kycSubmitTx = await kycEnableTx.execute(client);
  let kycRx = await kycSubmitTx.getReceipt(client);
  return kycRx;
}

// TOKEN QUERY FUNCTION ==========================================
async function tQueryFcn() {
  const client = await getClient();
  var tokenInfo = await new TokenInfoQuery()
    .setTokenId(tokenId)
    .execute(client);
  return tokenInfo;
}

//To create client object
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
