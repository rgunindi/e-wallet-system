require("parse");
require("parse-server");
const { newObjectId } = require("parse-server/lib/cryptoUtils");
Parse.Cloud.beforeSave(Parse.User, async (req) => {
  const { object } = req;
  if (object.isNew()) {
    const objectId = newObjectId();
    const roleACL = new Parse.ACL();
    roleACL.setRoleReadAccess("admin", true);
    roleACL.setRoleReadAccess("finance", true);
    roleACL.setWriteAccess(objectId, true);
    roleACL.setReadAccess(objectId, true);
    object.setACL(roleACL);
    object.set("objectId", objectId);

    const wallet = new Parse.Object("Wallet");
    wallet.set("currency", ["USD", "EUR", "TL"]);
    wallet.set("user", object);
    wallet.set("balance", [{ USD: 0 }, { EUR: 0 }, { TL: 0 }]);
    wallet.save(null, {
      useMasterKey: true,
      cascadeSave: false,
    });
  }
});

Parse.Cloud.define("generateId", () => newObjectId());

const createBankAccount = async (req) => {
  const { user, params } = req;
  const { bankName, accountNumber, iban, currency } = params;
  //check user role is finance
  const roleQuery = new Parse.Query(Parse.Role);
  roleQuery.equalTo("name", "finance");
  const role = await roleQuery.first({ useMasterKey: true });
  const roleUsers = role.getUsers();
  const roleUsersQuery = roleUsers.query();
  roleUsersQuery.equalTo("objectId", user.id);
  const isFinance = await roleUsersQuery.first({ useMasterKey: true });
  if (!isFinance) {
    throw new Error("User is not belong to finance team");
  }

  const bank = new Parse.Object("Bank");
  bank.set("name", bankName);
  bank.set("accountNumber", accountNumber);
  bank.set("iban", iban);
  bank.set("currency", currency);
  bank.save(null, { useMasterKey: true });
};
const depositToBank = async (req) => {
  const { user, params } = req;
  const { accountNumber, amount } = params;
  const bankAcc = await new Parse.Query("Bank")
    .equalTo("accountNumber", accountNumber)
    .first({ useMasterKey: true });
  if (!bankAcc) {
    throw new Error("Bank account not found");
  }
  const wallet = await new Parse.Query("Wallet")
    .equalTo("user", user)
    .first({ useMasterKey: true });
  if (!wallet) {
    throw new Error("Wallet not found");
  }
  const balance = wallet.get("balance");
  const currency = bankAcc.get("currency");
  const userCurrency = balance.find((x) => x[currency]);
  const userCurrencyAmount = userCurrency[currency];
  if (userCurrencyAmount < amount) {
    throw new Error("Balance is not enough");
  }
  const newBalance = userCurrencyAmount - amount;
  userCurrency[currency] = newBalance;
  wallet.set("balance", balance);
  wallet.save(null, { useMasterKey: true });
  bankAcc
    .increment("balance", parseInt(amount))
    .save(null, { useMasterKey: true });
  //TODO: create transaction& create a session for transfer
  const transaction = new Parse.Object("TransactionLog");
  transaction.set("user", user);
  transaction.set("amount", amount);
  transaction.set("currency", currency);
  transaction.set("type", "deposit");
  transaction.save(null, { useMasterKey: true });
};
const createBankAccountForUser = async (req) => {
  const { user, params } = req;
  const { bankName, accountNumber, iban, currency } = params;
  const acl = new Parse.ACL();
  acl.setRoleReadAccess("admin", true);
  acl.setRoleReadAccess("finance", true);
  acl.setWriteAccess(user, true);
  acl.setReadAccess(user, true);
  const bank = new Parse.Object("BankAccountUser");
  bank.set("name", bankName);
  bank.set("accountNumber", accountNumber);
  bank.set("iban", iban);
  bank.set("currency", currency);
  bank.set("user", user);
  bank.setACL(acl);
  bank.save(null, { useMasterKey: true });
};
Parse.Cloud.define("createBankAccount", createBankAccount, {
  requireUser: true,
});

Parse.Cloud.define("deposit-to-bank", depositToBank, { requireUser: true });

Parse.Cloud.define("createBankAccountForUser", createBankAccountForUser, {
  requireUser: true,
});

Parse.Cloud.define("getBankAccounts", async (req) => {
  const { user } = req;
  return await new Parse.Query("BankAccountUser")
    .equalTo("user", user)
    .find({ useMasterKey: true });
});

Parse.Cloud.define(
  "deleteUserBankAccout",
  async (req) => {
    const { params } = req;
    const { bankAccId } = params;
    const account = await new Parse.Query("BankAccountUser")
      .equalTo("accountNumber", bankAccId)
      .first({ useMasterKey: true });
    if (!account) {
      throw new Error("Account not found");
    }
    account.destroy({ useMasterKey: true });
  },
  { requireUser: true }
);

Parse.Cloud.define(
  "withdraw",
  async (req) => {
    const { user, params } = req;
    const { amount, bankAccId } = params;
    /*
    we need to verify user identity
    we need to verification of user phone number 
    we should use one time password [otp]
    */
    const bankAcc = await new Parse.Query("BankAccountUser")
      .equalTo("accountNumber", bankAccId)
      .first({ useMasterKey: true });
    if (!bankAcc) throw new Error("Bank account not found");
    const acl = new Parse.ACL();
    acl.setRoleReadAccess("finance", true);
    acl.setRoleWriteAccess("finance", true);
    acl.setWriteAccess(user.id, true);
    acl.setReadAccess(user.id, true);
    const TransactionLog = new Parse.Object("TransactionLog");
    const TransactionRequest = new Parse.Object("TransactionRequest");
    TransactionRequest.set("user", user);
    TransactionRequest.set("amount", amount);
    TransactionRequest.set("currency", bankAcc.get("currency"));
    TransactionRequest.set("type", "withdraw");
    TransactionRequest.set("bankAccount", bankAcc);
    TransactionRequest.set("status", "pending");
    TransactionRequest.setACL(acl);
    TransactionRequest.save(null, { useMasterKey: true });
    TransactionLog.set("user", user);
    TransactionLog.set("amount", amount);
    TransactionLog.set("currency", bankAcc.get("currency"));
    TransactionLog.set("type", "withdraw");
    TransactionLog.save(null, { useMasterKey: true });
  },
  { requireUser: true }
);

Parse.Cloud.define("sendMoney", async (req) => {
  const { user, params } = req;
  const { amount, currency, username } = params;
  const wallet = await new Parse.Query("Wallet")
    .equalTo("user", user)
    .first({ useMasterKey: true });
  if (!wallet) throw new Error("Wallet not found");
  const receiverUser = await new Parse.Query(Parse.User)
    .equalTo("username", username)
    .first({ useMasterKey: true });
  if (!receiverUser) throw new Error("Receiver user not found");
  const balance = wallet.get("balance");
  const userCurrency = balance.find((x) => x[currency]);
  const userCurrencyAmount = userCurrency[currency];
  if (userCurrencyAmount < amount) {
    throw new Error("Balance is not enough");
  }
  const newBalance = userCurrencyAmount - amount;
  userCurrency[currency] = newBalance;
  wallet.set("balance", balance);
  wallet.save(null, { useMasterKey: true });
  const receiverWallet = await new Parse.Query("Wallet")
    .equalTo("user", receiverUser)
    .first({ useMasterKey: true });
  if (!receiverWallet) throw new Error("Receiver wallet not found");
  const receiverBalance = receiverWallet.get("balance");
  const receiverCurrency = receiverBalance.find(
    (x) => Object.keys(x)[0] === currency
  );
  const receiverCurrencyAmount = receiverCurrency[currency];
  const newReceiverBalance =
    parseFloat(receiverCurrencyAmount) + parseFloat(amount);
  receiverCurrency[currency] = newReceiverBalance;
  receiverWallet.set("balance", receiverBalance);
  receiverWallet.save(null, { useMasterKey: true });
  const transaction = new Parse.Object("TransactionLog");
  transaction.set("user", user);
  transaction.set("amount", amount);
  transaction.set("currency", currency);
  transaction.set("type", "send");
  transaction.save(null, { useMasterKey: true });
  const receiverTransaction = new Parse.Object("TransactionLog");
  receiverTransaction.set("user", receiverUser);
  receiverTransaction.set("amount", amount);
  receiverTransaction.set("currency", currency);
  receiverTransaction.set("type", "receive");
  receiverTransaction.save(null, { useMasterKey: true });
  return { status: "success" };
});
