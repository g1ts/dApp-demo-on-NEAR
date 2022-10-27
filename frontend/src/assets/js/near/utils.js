import { connect, Contract, keyStores, WalletConnection } from 'near-api-js'
import getConfig from './config'

const nearConfig = getConfig(process.env.NODE_ENV || 'development')
console.log(nearConfig);

// Initialize contract & set global variables
export async function initContract() {
  // Initialize connection to the NEAR testnet
  const near = await connect(Object.assign({ keyStore: new keyStores.BrowserLocalStorageKeyStore() }, nearConfig))

  // Initializing Wallet based Account. It can work with NEAR testnet wallet that
  // is hosted at https://wallet.testnet.near.org
  window.walletConnection = new WalletConnection(near)

  // Getting the Account ID. If still unauthorized, it's just empty string
  window.accountId = window.walletConnection.getAccountId()

  // Initializing our contract APIs by contract name and configuration
  window.contract = await new Contract(window.walletConnection.account(), nearConfig.contractName, {
    // View methods are read only. They don't modify the state, but usually return some value.
    viewMethods: ['getNewGames', 'getGame', 'getGameBoard', 'getActiveGame'],
    // Change methods can modify the state. But you don't receive the returned value when called.
    changeMethods: ['createGame', 'joinGame', 'turn', 'surrender'],
  })
}

export function logout() {
  window.walletConnection.signOut()
  // reload page
  window.location.replace(window.location.origin + window.location.pathname)
}

export async function login() {
  // Allow the current app to make calls to the specified contract on the
  // user's behalf.
  // This works by creating a new access key for the user's account and storing
  // the private key in localStorage.
  // await window.walletConnection.requestSignIn(nearConfig.contractName, "Example App")
  await window.walletConnection.requestSignIn({ contractId: nearConfig.contractName })
}


export async function getNewGames() {
  let games = await window.contract.getNewGames({})
    .catch(err => errorHelper(err))
  return games;
}
export async function getMyActiveGame() {
  let games = await window.contract.getActiveGame({ accountId: window.accountId })
    .catch(err => errorHelper(err))
  return games;
}
export async function getGame(id) {
  let game = await window.contract.getGame({ id })
    .catch(err => errorHelper(err))
  return game;
}

export async function createGame() {
  let gameId = await window.contract.createGame({})
    .catch(err => errorHelper(err))
  return gameId;
}
export async function joinGame(id) {
  let activePlayer = await window.contract.joinGame({ id: parseInt(id) })
    .catch(err => errorHelper(err))
  return activePlayer;
}
export async function turn({ x, y, id }) {
  let win = await window.contract.turn({ id: parseInt(id), x, y })
    .catch(err => errorHelper(err))
  return win;
}
export async function surrender() {
  return await window.contract.surrender()
    .catch(err => errorHelper(err))
}



function errorHelper(err) {
  // if there's a cryptic error, provide more helpful feedback and instructions here
  // TODO: as soon as we get the error codes propagating back, use those
  if (err.message.includes('Cannot deserialize the contract state')) {
    console.warn('NEAR Warning: the contract/account seems to have state that is not (or no longer) compatible.\n' +
      'This may require deleting and recreating the NEAR account as shown here:\n' +
      'https://stackoverflow.com/a/60767144/711863');
  }
  if (err.message.includes('Cannot deserialize the contract state')) {
    console.warn('NEAR Warning: the contract/account seems to have state that is not (or no longer) compatible.\n' +
      'This may require deleting and recreating the NEAR account as shown here:\n' +
      'https://stackoverflow.com/a/60767144/711863');
  }
  console.error(err);
}
