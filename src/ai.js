export class AIPlayer {
    constructor(game) {
        this.game = game;
        this.SEARCH_DEPTH = 2; 
    }

    evaluateBoard(board) {
        let score = 0;
        board.forEach(cell => {
            if (cell.piece && cell.isFlipped) {
                const pieceScore = this.game.scores[cell.piece.toLowerCase()];
                score += this.game.isRedPiece(cell.piece) ? pieceScore : -pieceScore;
            }
        });
        return score;
    }

    minimax(board, depth, isMaximizingPlayer) {
        if (depth === 0) {
            return this.evaluateBoard(board);
        }

        const allPossibleMoves = [];
        for (let i = 0; i < this.game.SQUARES; i++) {
            const cell = board[i];
            if (cell.piece && cell.isFlipped && (this.game.isRedPiece(cell.piece) === isMaximizingPlayer)) {
                const moves = this.game.getValidMoves(board, cell.piece, i);
                moves.forEach(move => {
                    allPossibleMoves.push({ from: i, to: move });
                });
            }
        }

        if (allPossibleMoves.length === 0) {
            return this.evaluateBoard(board);
        }

        if (isMaximizingPlayer) {
            let maxEval = -Infinity;
            for (const move of allPossibleMoves) {
                const tempBoard = JSON.parse(JSON.stringify(board));
                tempBoard[move.to] = { ...tempBoard[move.from] };
                tempBoard[move.from] = { piece: null, isFlipped: true };
                const evaluation = this.minimax(tempBoard, depth - 1, false);
                maxEval = Math.max(maxEval, evaluation);
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const move of allPossibleMoves) {
                const tempBoard = JSON.parse(JSON.stringify(board));
                tempBoard[move.to] = { ...tempBoard[move.from] };
                tempBoard[move.from] = { piece: null, isFlipped: true };
                const evaluation = this.minimax(tempBoard, depth - 1, true);
                minEval = Math.min(minEval, evaluation);
            }
            return minEval;
        }
    }

    findBestMove() {
        let bestScore = -Infinity;
        let bestMove = null;
        const aiIsRed = this.game.isRedTurn;

        for (let i = 0; i < this.game.SQUARES; i++) {
            const cell = this.game.board[i];
            if (cell.piece && cell.isFlipped && this.game.isPieceOfCurrentTurn(cell.piece)) {
                const moves = this.game.getValidMoves(this.game.board, cell.piece, i);
                for (const move of moves) {
                    const tempBoard = JSON.parse(JSON.stringify(this.game.board));
                    tempBoard[move] = { ...tempBoard[i] };
                    tempBoard[i] = { piece: null, isFlipped: true };

                    const score = this.minimax(tempBoard, this.SEARCH_DEPTH - 1, !aiIsRed);

                    let currentScore = aiIsRed ? score : -score;

                    if (currentScore > bestScore) {
                        bestScore = currentScore;
                        bestMove = { type: 'move', from: i, to: move };
                    }
                }
            }
        }

        if (bestMove) {
            return bestMove;
        }

        const unflippedIndices = [];
        this.game.board.forEach((cell, index) => {
            if (!cell.isFlipped) unflippedIndices.push(index);
        });

        if (unflippedIndices.length > 0) {
            const randomFlipIndex = unflippedIndices[Math.floor(Math.random() * unflippedIndices.length)];
            return { type: 'flip', from: randomFlipIndex, to: randomFlipIndex };
        }

        return null;
    }
}
