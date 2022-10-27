import { initContract, login, logout, getNewGames, createGame, joinGame, getMyActiveGame, turn, getGame, surrender } from './near/utils'


const boardUI = document.querySelector('#board')
const boardInfoUI = document.querySelector('#board-info')

const gameUITitle = document.querySelector('#game-ui-title')
const gameUI = document.querySelector('#game-ui')
const joinGameUI = document.querySelector('#join-game-ui')
const gamesList = document.querySelector('#games-list')


let activeGame = null
let hasTurnRequest = false


// `nearInitPromise` gets called on page load
window.nearInitPromise = initContract()
    .then(flow)
    .catch(console.error)

function flow() {
    if (window.walletConnection.isSignedIn()) {
        signedInFlow()
    } else {
        signedOutFlow()
    }
}

function signedOutFlow() {
    document.querySelector('.sign-in').style.display = 'block';
}

async function signedInFlow() {
    addEventListener('load', init);
}



// games list
gamesList.onclick = async (e) => {
    if (e.target.dataset.gameId) {
        console.log(e.target.dataset.gameId);
        const activePlayer = await joinGame(e.target.dataset.gameId)
        loadActiveGame()
    }
};

async function loadNewGames() {
    console.log('loading new games...');
    const newGames = await getNewGames()
    console.log(newGames);
    let html = newGames.map(game => `<li>game #${game.id} (${game.creator}) <button data-game-id="${game.id}" class="button button-clear">join</button></li>`).join('')
    if(html == ''){
        html = 'No games available, create a new one.'
    }
    gamesList.innerHTML = html
}
async function createNewGame() {
    const gameId = await createGame()
    console.log(gameId);
    loadActiveGame()
}


function isGameMode(){
    return activeGame?.id !== undefined && activeGame?.id !== 0
}


// --------- board ------------

function rendBoard(boardData) {
    boardUI.innerHTML = boardData.map(rendBoardRow).join('')
}
function rendBoardRow(row) {
    return `<div class="board-row">${row.map(cell => {
        let c = 'empty'
        if (cell != '') c = (cell == window.accountId) ? 'cross' : 'circle'
        return `<div class="board-cell ${c}"></div>`
    }).join('')}</div>`
}

boardUI.onclick = async function onClickOnCell(e) {

    if (!isGameMode()) return

    let { target } = e
    if (!target.classList.contains('board-cell')) return;

    const row = target.parentElement

    const x = [...row.children].indexOf(target);
    const y = [...row.parentElement.children].indexOf(row);

    boardUI.classList.remove('my-turn')
    hasTurnRequest = true
    const isGameOver = await turn({ x, y, id: activeGame.id })

    await loadActiveGame()
    hasTurnRequest = false
}


async function onGameOver() {
    const game = await getGame(activeGame.id)
    let msg = 'Game Over! '
    switch (game.winner) {
        case '':
            msg += 'Nobody won.'
            break
        case window.accountId:
            msg += 'You Win!!!'
            break
        default:
            msg += 'You lose.'
            break
    }
    boardInfoUI.textContent = msg
    alert(msg)
    activeGame = null
    updateGameUI()
}

async function loadActiveGame() {
    const myActiveGame = await getMyActiveGame()
    if (myActiveGame?.id) {
        if (hasTurnRequest) return
        activeGame = myActiveGame
        rendBoard(activeGame.board)
        switch (activeGame.state) {
            case 0: // new game
                boardInfoUI.textContent = 'New Game. Waiting for opponent.'
                break;
            case 1: // active game
                if (isMyTurn()) {
                    boardUI.classList.add('my-turn')
                    boardInfoUI.textContent = 'You turn!'
                } else {
                    boardUI.classList.remove('my-turn')
                    boardInfoUI.textContent = "Waiting for opponent's turn..."
                }
                break;
            default:
                break;
        }

    } else {
        if (myActiveGame?.id !== activeGame?.id) {
            if (!myActiveGame?.id && activeGame?.id) {
                onGameOver()
            }
            activeGame = myActiveGame
        }
    }
    updateGameUI()
}
async function updateGameUI() {
    if (isGameMode()) {
        joinGameUI.style.display = 'none';
        gameUI.style.display = 'block';
        gameUITitle.textContent = `Game: '${activeGame.creator}' vs '${activeGame.opponent}'`
    } else {
        joinGameUI.style.display = 'block';
        gameUI.style.display = 'none';
    }
}

function isMyTurn() {
    return activeGame && activeGame.activePlayer == window.accountId
}

/// ====================


document.querySelector('.sign-in-btn').onclick = login;
document.querySelector('.sign-out-btn').onclick = logout;
document.querySelector('.create-new-game-btn').onclick = createNewGame
document.querySelector('#surrender').onclick = e => {
    surrender()
};



async function init() {
    console.log('init');

    document.querySelector('#main').style.display = 'block';
    document.querySelector("#account-id").textContent = window.accountId

    loadNewGames()
    loadActiveGame()

    setInterval(() => {
        // if (boardUpdateLock || isMyTurn()) return
        if (isGameMode()) {
            loadActiveGame()
        } else {
            loadNewGames()
        }
    }, 2000);
}
