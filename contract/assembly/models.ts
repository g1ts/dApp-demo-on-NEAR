import { PersistentVector, context, RNG, logging } from "near-sdk-as";
import { AccountId, GameInfoBoard } from "./types";

export enum GameState {
    NewGame,
    Active,
    GameOver
}

type BoardLine = PersistentVector<AccountId>
type Board = PersistentVector<BoardLine>


const EmptyCellValue: AccountId = ''

@nearBindgen
export class GameInfo {
    id: u32;
    creator: AccountId = '';
    opponent: AccountId = '';
    activePlayer: AccountId = '';
    winner: AccountId = '';
    state: GameState;
    board: GameInfoBoard;
}

@nearBindgen
export class Game {
    id: u32 = 0;
    creator: AccountId = '';
    opponent: AccountId = '';
    activePlayer: AccountId;
    winner: AccountId = '';
    state: GameState;
    board: Board;
    constructor() {
        this.creator = context.sender
        const rng = new RNG<u32>(1, u32.MAX_VALUE);
        this.id = rng.next();
        this.state = GameState.NewGame;
        this.board = new PersistentVector<BoardLine>(`b_${this.id}`)
        for (let i = 0; i < 3; i++) {
            const line = new PersistentVector<AccountId>(`l_${this.id}_${i}`)
            for (let j = 0; j < 3; j++) {
                line.push(EmptyCellValue)
            }
            this.board.push(line)
        }
        logging.log(`created new game '${this.id}'`)
    }

    join(): void {
        assert(this.state === GameState.NewGame, 'game has already started')
        assert((context.predecessor != this.creator), 'already joined')
        this.opponent = context.sender
        this.state = GameState.Active
        logging.log(`'${this.opponent}' join to game '${this.id}'`)

        const rng = new RNG<u32>(0, 1);
        const rnd = rng.next()
        this.activePlayer = (rnd === 0) ? this.creator : this.opponent
        logging.log(`turn '${this.activePlayer}'`)
    }

    // return true if game over
    turn(x: u8, y: u8): bool {
        assert(this.state === GameState.Active, 'game not active')
        assert((x < 3 && y < 3), 'out of range')
        const sender = context.sender
        logging.log(sender)
        assert((sender == this.activePlayer), `now it's '${this.activePlayer}' turn`)
        this.board[y].replace(x, sender)
        const winner = this.findWinner()
        if (winner != '' || !this.boardHasEmptyCells()) {
            this.winner = winner
            this.state = GameState.GameOver
            logging.log(`GameOver. Winner: '${this.winner}'`)
            return true
        }
        this.activePlayer = (this.activePlayer == this.opponent) ? this.creator : this.opponent
        return false
    }

    surrender(): void {
        assert(this.state == GameState.Active || this.state == GameState.NewGame, 'game is already over')
        const sender = context.sender
        if (sender == this.creator) {
            this.winner = this.opponent
        } else if (sender == this.opponent) {
            this.winner = this.creator
        }
        this.state = GameState.GameOver
    }

    boardHasEmptyCells(): bool {
        let c = 0
        const board = this.board
        for (let i = 0; i < board.length; i++) {
            const row = board[i];
            for (let j = 0; j < row.length; j++) {
                if (row[j] != '') c++
            }
        }
        return c < 9
    }

    findWinner(): AccountId {
        const board = this.board
        // check rows
        for (let y = 0; y < board.length; y++) {
            const line = board[y];
            if (line[0] != EmptyCellValue && line[0] == line[1] && line[1] == line[2]) {
                return line[0]
            }
        }

        // check columns
        for (let x = 0; x < 3; x++) {
            if (board[0][x] != EmptyCellValue && board[0][x] == board[1][x] && board[1][x] == board[2][x]) {
                return board[0][x]
            }
        }

        // check diagonals
        if (board[0][0] != EmptyCellValue && board[0][0] == board[1][1] && board[1][1] == board[2][2]) {
            return board[0][0]
        }
        if (board[2][0] != EmptyCellValue && board[2][0] == board[1][1] && board[1][1] == board[0][2]) {
            return board[2][0]
        }
        return ''
    }
}

