import { context, logging, PersistentUnorderedMap } from "near-sdk-as";
import { Game, GameState, GameInfo } from "./models";
import { AccountId, GameInfoBoard } from "./types";


const games = new PersistentUnorderedMap<u32, Game>('games')


export function createGame(): u32 {
  const activeGame = getActiveGame(context.sender)
  assert(activeGame.id === 0, `already joined in game ${activeGame.id}`)
  const game = new Game()
  games.set(game.id, game)
  return game.id
}

export function joinGame(id: u32): AccountId {
  const activeGame = getActiveGame(context.sender)
  assert(activeGame.id === 0, `already joined in game ${activeGame.id}`)
  const game = games.getSome(id)
  game.join()
  games.set(game.id, game)
  return game.activePlayer
}

export function surrender(): void {
  const activeGames = _getActiveGames(context.sender)
  assert(activeGames.length > 0, `has no active games`)
  const activeGame = activeGames[0]
  activeGame.surrender()
  games.set(activeGame.id, activeGame)
}


export function getNewGames(): Array<GameInfo> {
  const contractGames = games.values()

  const newGames: Array<GameInfo> = []
  for (let i = 0; i < contractGames.length; i++) {
    const game = contractGames[i];
    if (game.state === GameState.NewGame) {
      newGames.push(game2gameInfo(game))
    }
  }
  return newGames
}


function _getActiveGames(accountId: AccountId): Array<Game> {
  const contractGames = games.values()
  const activeGames: Array<Game> = []
  for (let i = 0; i < contractGames.length; i++) {
    const game = contractGames[i];
    if ((game.state === GameState.NewGame || game.state === GameState.Active)
      && (game.creator == accountId || game.opponent == accountId)) {
        activeGames.push(game)
    }
  }
  return activeGames
}

export function getActiveGame(accountId: AccountId): GameInfo {
  const activeGames = _getActiveGames(accountId)
  if(activeGames.length>0) return game2gameInfo(activeGames[0])
  return new GameInfo()
}
export function getGame(id: u32): GameInfo {
  return game2gameInfo(games.getSome(id))
}

function game2gameInfo(game: Game): GameInfo {
  return {
    id: game.id,
    creator: game.creator,
    opponent: game.opponent,
    state: game.state,
    activePlayer: game.activePlayer,
    board: getGameBoard(game.id),
    winner: game.winner
  }
}

export function getGameBoard(id: u32): GameInfoBoard {
  const board: GameInfoBoard = []
  const gameBoard = games.getSome(id).board
  for (let i = 0; i < gameBoard.length; i++) {
    const line: Array<AccountId> = []
    for (let j = 0; j < gameBoard[i].length; j++) {
      line.push(gameBoard[i][j])
    }
    board.push(line)
  }
  return board
}

export function turn(id: u32, x: u8, y: u8): bool {
  logging.log(`turn x:${x} y:${y}`)
  const game = games.getSome(id)
  const isGameOver = game.turn(x, y)
  games.set(game.id, game);
  return isGameOver
}

