import { HiddenDragonGame } from "./game.js";
import { AIPlayer } from "./ai.js";
import { PIECE_DISPLAY } from "./constants.js";

export class GameUI {
    constructor({
        schedule = (callback, delay) => globalThis.setTimeout(callback, delay),
        cancel = timer => globalThis.clearTimeout(timer),
    } = {}) {
        this.schedule = schedule;
        this.cancel = cancel;
        this.pendingTimers = new Set();
        this.generation = 0;
        this.game = new HiddenDragonGame();
        this.ai = new AIPlayer(this.game);
        this.boardElement = document.getElementById('chess-board');
        this.p1ScoreEl = document.getElementById('player1-score');
        this.p2ScoreEl = document.getElementById('player2-score');
        this.p1TitleEl = document.getElementById('p1-title');
        this.p2TitleEl = document.getElementById('p2-title');
        this.gameStatusEl = document.getElementById('game-status');
        this.gameOverEl = document.getElementById('game-over');
        this.resetButton = document.getElementById('reset-button');
        this.p1InfoEl = document.getElementById('player1-info');
        this.p2InfoEl = document.getElementById('player2-info');
        this.pregameOverlay = document.getElementById('pregame-overlay');
        this.humanFirstBtn = document.getElementById('human-first-btn');
        this.aiFirstBtn = document.getElementById('ai-first-btn');
        this.winnerOverlay = document.getElementById('winner-overlay');
        this.winnerText = document.getElementById('winner-text');

        this.pieceDisplay = PIECE_DISPLAY;

        this.selectedPieceIndex = null;
        this.validMoves = [];
        this.isTurnInProgress = false;
        this.humanGoesFirst = true;

        this.resetButton.addEventListener('click', () => this.initialize());
        this.humanFirstBtn.addEventListener('click', () => this.startGame(true));
        this.aiFirstBtn.addEventListener('click', () => this.startGame(false));
        document.getElementById('play-again-btn').addEventListener('click', () => this.initialize());
        this.initialize();
    }

    initialize() {
        this.generation++;
        this.pendingTimers.forEach(timer => this.cancel(timer));
        this.pendingTimers.clear();
        this.humanGoesFirst = true;
        this.game.reset();
        this.selectedPieceIndex = null;
        this.validMoves = [];
        this.isTurnInProgress = false;
        this.winnerOverlay.classList.add('hidden');
        this.winnerOverlay.classList.remove('flex');
        this.pregameOverlay.classList.remove('hidden');
        this.pregameOverlay.classList.add('flex');
        this.updatePlayerUI();
        this.renderBoard();
    }

    // Reset invalidates callbacks even if a timer has already entered the queue.
    scheduleTurn(callback, delay) {
        const generation = this.generation;
        const timer = this.schedule(() => {
            this.pendingTimers.delete(timer);
            if (generation !== this.generation) return;
            callback();
        }, delay);
        this.pendingTimers.add(timer);
    }

    startGame(humanFirst) {
        this.humanGoesFirst = humanFirst;
        this.pregameOverlay.classList.add('hidden');
        this.pregameOverlay.classList.remove('flex');

        if (humanFirst) {
            this.updatePlayerUI();
        } else {
            this.updatePlayerUI();
            this.isTurnInProgress = true;
            this.scheduleTurn(() => {
                const firstFlipIndex = Math.floor(Math.random() * this.game.SQUARES);
                this.game.handleFirstFlip(firstFlipIndex, false);
                this.renderBoard();
                this.isTurnInProgress = false;
                this.updatePlayerUI();
                this.checkForAITurn();
            }, 1000);
        }
    }

    renderBoard() {
        this.boardElement.innerHTML = '';
        for (let i = 0; i < this.game.SQUARES; i++) {
            const square = document.createElement('button');
            square.type = 'button';
            square.className = 'square';
            square.setAttribute('aria-label', `Square ${String.fromCharCode(65 + i % this.game.COLS)}${Math.floor(i / this.game.COLS) + 1}, ${!this.game.board[i].isFlipped ? 'hidden piece' : this.game.board[i].piece ? this.pieceDisplay[this.game.board[i].piece.toLowerCase()][this.game.isRedPiece(this.game.board[i].piece) ? 'red' : 'black'] : 'empty'}`);

            const cell = this.game.board[i];
            const pieceSpan = document.createElement('span');
            pieceSpan.className = 'piece';

            if (!cell.isFlipped) {
                pieceSpan.classList.add('hidden-piece');
            } else if (cell.piece) {
                const pieceColorClass = this.game.isRedPiece(cell.piece) ? 'red-piece' : 'black-piece';
                pieceSpan.classList.add(pieceColorClass);
                const pieceType = cell.piece.toLowerCase();
                const isRed = this.game.isRedPiece(cell.piece);
                pieceSpan.textContent = this.pieceDisplay[pieceType][isRed ? 'red' : 'black'];
            }
            if (!cell.piece) pieceSpan.classList.add('empty-piece');
            square.appendChild(pieceSpan);

            if (this.selectedPieceIndex === i) {
                square.classList.add('selected');
            }
            if (this.validMoves.includes(i)) {
                square.classList.add('valid-move');
            }

            square.addEventListener('click', () => this.onSquareClick(i));
            this.boardElement.appendChild(square);
        }
    }

    onSquareClick(index) {
        if (this.game.isGameOver || this.isTurnInProgress) return;

        if (this.game.isGameStarted && !this.isHumanTurnNow()) return;

        if (!this.game.isGameStarted) {
            this.isTurnInProgress = true;
            this.game.handleFirstFlip(index, this.humanGoesFirst);
            this.renderBoard();
            this.scheduleTurn(() => {
                this.isTurnInProgress = false;
                this.updatePlayerUI();
                this.checkForAITurn();
            }, 500);
            return;
        }

        const clickedCell = this.game.board[index];

        if (this.selectedPieceIndex !== null) {
            if (this.validMoves.includes(index)) {
                this.game.handleMove(this.selectedPieceIndex, index);
                this.selectedPieceIndex = null;
                this.validMoves = [];
                this.updatePlayerUI();
                this.renderBoard();
                this.checkForAITurn();
            } else {
                this.selectedPieceIndex = null;
                this.validMoves = [];
                this.renderBoard();
            }
            return;
        }

        if (!clickedCell.isFlipped) {
            this.isTurnInProgress = true;
            this.game.handleFlip(index);
            this.renderBoard();
            this.scheduleTurn(() => {
                this.isTurnInProgress = false;
                this.updatePlayerUI();
                this.checkForAITurn();
            }, 500);
            return;
        }

        if (clickedCell.piece && this.game.isPieceOfCurrentTurn(clickedCell.piece)) {
            this.selectedPieceIndex = index;
            this.validMoves = this.game.getValidMoves(this.game.board, clickedCell.piece, index);
            this.renderBoard();
        }
    }

    isHumanTurnNow() {
        if (!this.game.isGameStarted) return this.humanGoesFirst;
        return (this.game.humanPlayerColor === 'red') === this.game.isRedTurn;
    }

    checkForAITurn() {
        if (this.game.isGameOver) return;

        if (!this.isHumanTurnNow()) {
            this.isTurnInProgress = true;
            this.gameStatusEl.textContent = "AI is thinking...";
            this.scheduleTurn(() => {
                const move = this.ai.findBestMove();
                if (move) {
                    if (move.type === 'flip') {
                        this.game.handleFlip(move.from);
                    } else {
                        this.game.handleMove(move.from, move.to);
                    }
                } else {
                    this.game.checkGameOver();
                }
                this.updatePlayerUI();
                this.renderBoard();
                this.isTurnInProgress = false;
            }, 1000); 
        }
    }

    updatePlayerUI() {
        if (!this.game.isGameStarted) {
            this.gameStatusEl.textContent = 'A new story awaits';
        } else {
            const currentTurnColor = this.game.isRedTurn ? 'Red' : 'Black';
            this.gameStatusEl.innerHTML = `${this.isHumanTurnNow() ? 'Your turn' : 'AI’s turn'} · ${currentTurnColor}<span class="status-detail">${this.game.board.filter(cell => cell.isFlipped && cell.piece).length} revealed · ${this.game.board.filter(cell => cell.piece).length} pieces left</span>`;
        }

        if (this.game.humanPlayerColor) {
            const humanDisplayColor = this.game.humanPlayerColor === 'red' ? 'Red' : 'Black';
            const aiDisplayColor = this.game.humanPlayerColor === 'red' ? 'Black' : 'Red';

            this.p1TitleEl.innerHTML = `Human (<span class="${humanDisplayColor === 'Red' ? 'side-red' : 'side-black'}">${humanDisplayColor}</span>)`;
            this.p2TitleEl.innerHTML = `AI (<span class="${aiDisplayColor === 'Red' ? 'side-red' : 'side-black'}">${aiDisplayColor}</span>)`;

        } else {
             this.p1TitleEl.textContent = 'You';
             this.p2TitleEl.textContent = 'The Archer AI';
             this.p1TitleEl.classList.remove('text-red-600', 'text-gray-800');
             this.p2TitleEl.classList.remove('text-red-600', 'text-gray-800');
        }

        const scores = this.game.getScores();
        const humanIsRed = this.game.humanPlayerColor === 'red';
        this.p1ScoreEl.textContent = `Score: ${humanIsRed ? scores.redScore : scores.blackScore}`;
        this.p2ScoreEl.textContent = `Score: ${humanIsRed ? scores.blackScore : scores.redScore}`;

        const isHumanTurn = this.isHumanTurnNow();
        this.p1InfoEl.classList.toggle('active', isHumanTurn);
        this.p2InfoEl.classList.toggle('active', !isHumanTurn);

        if (this.game.isGameOver) {
            const finalScores = this.game.getScores();
            const humanFinalScore = this.game.humanPlayerColor === 'red' ? finalScores.redScore : finalScores.blackScore;
            const aiFinalScore = this.game.humanPlayerColor === 'red' ? finalScores.blackScore : finalScores.redScore;

            let winnerMessage = '';
            if (humanFinalScore > aiFinalScore) winnerMessage = "You Win!";
            else if (aiFinalScore > humanFinalScore) winnerMessage = "AI Wins!";
            else winnerMessage = "It's a Draw!";

            this.winnerText.innerHTML = `${winnerMessage}<span class="result-note">You ${humanFinalScore} · AI ${aiFinalScore}</span>`;
            this.winnerOverlay.classList.remove('hidden');
            this.winnerOverlay.classList.add('flex');

            this.gameOverEl.textContent = `Game Over! Final scores are calculated.`;
            this.gameStatusEl.textContent = '';
        } else {
            this.gameOverEl.textContent = '';
        }
    }
}
