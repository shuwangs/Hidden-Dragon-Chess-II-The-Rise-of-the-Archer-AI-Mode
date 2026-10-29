import { BOARD_COLS, BOARD_ROWS, PIECE_SCORES, STARTING_PIECES } from "./constants.js";

export class HiddenDragonGame {
    constructor() {
        this.COLS = BOARD_COLS;
        this.ROWS = BOARD_ROWS;
        this.SQUARES = this.COLS * this.ROWS;
        this.scores = PIECE_SCORES;
        this.reset();
    }

    reset() {
        const redPieces = [...STARTING_PIECES];
        const blackPieces = redPieces.map(p => p.toLowerCase());
        const allPieces = [...redPieces, ...blackPieces];

        for (let i = allPieces.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allPieces[i], allPieces[j]] = [allPieces[j], allPieces[i]];
        }

        this.board = allPieces.map(p => ({ piece: p, isFlipped: false }));
        this.isGameStarted = false;
        this.isGameOver = false;
        this.humanPlayerColor = null;
        this.isRedTurn = true;
        this.lastMove = { red: null, black: null };
        this.penalties = { red: 0, black: 0 };
    }

    isRedPiece(piece) {
        return piece && piece.toUpperCase() === piece;
    }

    isPieceOfCurrentTurn(piece) {
        if (!piece) return false;
        return this.isRedTurn === this.isRedPiece(piece);
    }

    handleFirstFlip(index, firstPlayerIsHuman) {
        const cell = this.board[index];
        if (!cell.piece) return null;

        cell.isFlipped = true;
        this.isGameStarted = true;

        const revealedColorIsRed = this.isRedPiece(cell.piece);

        // The first player gets the color they flipped
        if (firstPlayerIsHuman) {
            this.humanPlayerColor = revealedColorIsRed ? 'red' : 'black';
        } else { // The AI is the first player
            this.humanPlayerColor = revealedColorIsRed ? 'black' : 'red';
        }

        // The turn is now passed to the second player
        this.isRedTurn = !revealedColorIsRed;

        this.checkGameOver();
        return { type: 'flip', from: index, to: index };
    }

    handleFlip(index) {
        const cell = this.board[index];
        if (cell.isFlipped) return null;
        cell.isFlipped = true;
        this.switchTurn();
        return { type: 'flip', from: index, to: index };
    }

    handleMove(from, to) {
        if (!this.getValidMoves(this.board, this.board[from].piece, from).includes(to)) {
            return null;
        }

        const currentMove = { from, to, piece: this.board[from].piece };
        const lastPlayerMove = this.isRedTurn ? this.lastMove.red : this.lastMove.black;

        if (lastPlayerMove && lastPlayerMove.from === to && lastPlayerMove.to === from && lastPlayerMove.piece === currentMove.piece) {
            const colorToPenalize = this.isRedTurn ? 'red' : 'black';
            this.penalties[colorToPenalize]--;
        }

        if (this.isRedTurn) {
            this.lastMove.red = currentMove;
        } else {
            this.lastMove.black = currentMove;
        }

        this.board[to] = { ...this.board[from] };
        this.board[from] = { piece: null, isFlipped: true };
        this.switchTurn();
        return { type: 'move', from, to };
    }

    switchTurn() {
        this.isRedTurn = !this.isRedTurn;
        this.checkGameOver();
    }

    checkGameOver() {
        if (!this.isGameStarted || this.humanPlayerColor === null) return;

        let hasLegalAction = false;
        if (this.board.some(cell => !cell.isFlipped)) {
            hasLegalAction = true;
        }

        if (!hasLegalAction) {
            for (let i = 0; i < this.SQUARES; i++) {
                const cell = this.board[i];
                if (cell.piece && this.isPieceOfCurrentTurn(cell.piece)) {
                    if (this.getValidMoves(this.board, cell.piece, i).length > 0) {
                        hasLegalAction = true;
                        break;
                    }
                }
            }
        }

        if (!hasLegalAction) {
            this.isGameOver = true;
        }
    }

    getScores() {
        let redScore = 0, blackScore = 0;
        this.board.forEach(cell => {
            if(cell.isFlipped && cell.piece) {
                const score = this.scores[cell.piece.toLowerCase()];
                if(this.isRedPiece(cell.piece)) redScore += score;
                else blackScore += score;
            }
        });
        redScore += this.penalties.red;
        blackScore += this.penalties.black;
        return { redScore, blackScore };
    }

    getValidMoves(boardState, piece, index) {
        const legalMoves = [];
        const r = Math.floor(index / this.COLS);
        const c = index % this.COLS;
        const pieceIsRed = this.isRedPiece(piece);

        const isOnBoard = (row, col) => row >= 0 && row < this.ROWS && col >= 0 && col < this.COLS;
        const getIndex = (row, col) => row * this.COLS + col;

        switch (piece.toLowerCase()) {
            case 's': 
                [[-1,0],[1,0],[0,-1],[0,1]].forEach(([rd,cd]) => {
                    if(isOnBoard(r+rd, c+cd)){
                        const targetIndex = getIndex(r+rd, c+cd);
                        const targetCell = boardState[targetIndex];
                        if(targetCell.isFlipped && (!targetCell.piece || pieceIsRed !== this.isRedPiece(targetCell.piece))) {
                            legalMoves.push(targetIndex);
                        }
                    }
                });
                break;

            case 'w': 
                const archerMoveDirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
                const archerCaptureDirs = [[-2,0],[2,0],[0,-2],[0,2],[-2,-2],[-2,2],[2,-2],[2,2]];
                archerMoveDirs.forEach(([rd, cd]) => {
                    if (isOnBoard(r+rd, c+cd)) {
                        const targetIndex = getIndex(r+rd, c+cd);
                        const targetCell = boardState[targetIndex];
                        if (targetCell.isFlipped && !targetCell.piece) {
                            legalMoves.push(targetIndex);
                        }
                    }
                });
                archerCaptureDirs.forEach(([rd,cd]) => {
                     if(isOnBoard(r+rd, c+cd)){
                        const targetIndex = getIndex(r+rd, c+cd);
                        const targetCell = boardState[targetIndex];
                        if(targetCell.isFlipped && targetCell.piece && this.isRedPiece(targetCell.piece) !== pieceIsRed) {
                            legalMoves.push(targetIndex);
                        }
                    }
                });
                break;

            case 'k':
                [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([rd,cd]) => {
                     if(isOnBoard(r+rd, c+cd)){
                        const targetIndex = getIndex(r+rd, c+cd);
                        const targetCell = boardState[targetIndex];
                        if(targetCell.isFlipped && (!targetCell.piece || pieceIsRed !== this.isRedPiece(targetCell.piece))) {
                            legalMoves.push(targetIndex);
                        }
                    }
                });
                break;

            case 'a':
                const straightDirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
                const diagonalDirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
                straightDirs.forEach(([rd, cd]) => {
                    if (isOnBoard(r + rd, c + cd)) {
                        const targetIndex = getIndex(r + rd, c + cd);
                        const targetCell = boardState[targetIndex];
                        if (targetCell.isFlipped && !targetCell.piece) {
                            legalMoves.push(targetIndex);
                        }
                    }
                });
                diagonalDirs.forEach(([rd, cd]) => {
                    if (isOnBoard(r + rd, c + cd)) {
                        const targetIndex = getIndex(r + rd, c + cd);
                        const targetCell = boardState[targetIndex];
                        if (targetCell.isFlipped && (!targetCell.piece || pieceIsRed !== this.isRedPiece(targetCell.piece))) {
                            legalMoves.push(targetIndex);
                        }
                    }
                });
                break;

            case 'e': 
                [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([rd,cd]) => {
                    let temp_r = r + rd, temp_c = c + cd;
                    while(isOnBoard(temp_r, temp_c)){
                        const i = getIndex(temp_r, temp_c);
                        if(!boardState[i].isFlipped) break;
                        if(boardState[i].piece){
                            if(this.isRedPiece(boardState[i].piece) !== pieceIsRed) legalMoves.push(i);
                            break;
                        }
                        legalMoves.push(i);
                        temp_r += rd; temp_c += cd;
                    }
                });
                break;

            case 'h': 
                [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([rd,cd]) => {
                     if(isOnBoard(r+rd, c+cd)){
                        const targetIndex = getIndex(r+rd, c+cd);
                        const targetCell = boardState[targetIndex];
                        if(targetCell.isFlipped && (!targetCell.piece || pieceIsRed !== this.isRedPiece(targetCell.piece))) {
                            legalMoves.push(targetIndex);
                        }
                    }
                });
                break;

            case 'r':
                [[-1,0],[1,0],[0,-1],[0,1]].forEach(([rd,cd]) => {
                    let temp_r = r + rd, temp_c = c + cd;
                    while(isOnBoard(temp_r, temp_c)){
                        const i = getIndex(temp_r, temp_c);
                        if(!boardState[i].isFlipped) break;
                        if(boardState[i].piece){
                            if(this.isRedPiece(boardState[i].piece) !== pieceIsRed) legalMoves.push(i);
                            break;
                        }
                        legalMoves.push(i);
                        temp_r += rd; temp_c += cd;
                    }
                });
                break;

            case 'c':
                [[-1,0],[1,0],[0,-1],[0,1]].forEach(([rd,cd]) => {
                    let temp_r = r + rd, temp_c = c + cd;
                    let screenFound = false;
                    while(isOnBoard(temp_r, temp_c)){
                        const i = getIndex(temp_r, temp_c);
                        const currentCell = boardState[i];
                        if(currentCell.piece){
                            if(!screenFound){
                                screenFound = true; 
                            } else { 
                                if(currentCell.isFlipped && this.isRedPiece(currentCell.piece) !== pieceIsRed){
                                    legalMoves.push(i);
                                }
                                break; 
                            }
                        } else {
                            if (!screenFound && currentCell.isFlipped) {
                                legalMoves.push(i);
                            }
                        }
                        temp_r += rd; temp_c += cd;
                    }
                });
                break;
        }
        return legalMoves;
    }
}
