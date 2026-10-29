import test from 'node:test';
import assert from 'node:assert/strict';
import { HiddenDragonGame } from '../src/game.js';
import { AIPlayer } from '../src/ai.js';
import { GameUI } from '../src/ui.js';

function position(pieces) {
    const game = new HiddenDragonGame();
    game.board = Array.from({ length: 32 }, () => ({ piece: null, isFlipped: true }));
    for (const [index, piece, isFlipped = true] of pieces) game.board[index] = { piece, isFlipped };
    game.isGameStarted = true;
    game.humanPlayerColor = 'red';
    return game;
}

test('reset restores the full hidden army and clears turn history and penalties', () => {
    const game = new HiddenDragonGame();
    game.penalties.red = -3;
    game.lastMove.red = { from: 0, to: 8, piece: 'R' };
    game.reset();
    assert.equal(game.board.length, 32);
    assert.equal(game.board.filter(cell => game.isRedPiece(cell.piece)).length, 16);
    assert.ok(game.board.every(cell => cell.piece && !cell.isFlipped));
    assert.deepEqual(game.penalties, { red: 0, black: 0 });
    assert.deepEqual(game.lastMove, { red: null, black: null });
});

test('first flip assigns colors and passes turn for either starting player', () => {
    for (const piece of ['S', 's']) {
        for (const humanFirst of [true, false]) {
            const game = position([[0, piece, false]]);
            game.handleFirstFlip(0, humanFirst);
            const red = piece === 'S';
            assert.equal(game.humanPlayerColor, red === humanFirst ? 'red' : 'black');
            assert.equal(game.isRedTurn, !red);
        }
    }
});

test('cannon jumps exactly one screen, including a hidden screen', () => {
    const game = position([[0, 'C'], [1, 'S', false], [3, 'r'], [8, 's', false], [24, 'r', false]]);
    const moves = game.getValidMoves(game.board, 'C', 0);
    assert.ok(moves.includes(3));
    for (const index of [1, 2, 24]) assert.ok(!moves.includes(index));
});

test('archer shoots two squares across hidden pieces, but cannot shoot hidden targets', () => {
    const game = position([[9, 'W'], [10, 's', false], [11, 'r'], [27, 'h'], [25, 's', false]]);
    const moves = game.getValidMoves(game.board, 'W', 9);
    for (const index of [8, 11, 27]) assert.ok(moves.includes(index));
    for (const index of [10, 18, 25]) assert.ok(!moves.includes(index));
});

test('rook stops at hidden pieces and friendly pieces', () => {
    const game = position([[0, 'R'], [2, 's', false], [16, 'S']]);
    assert.deepEqual(game.getValidMoves(game.board, 'R', 0).sort((a,b) => a-b), [1, 8]);
});

test('own reverse moves deduct points without mutating shared piece values', () => {
    const game = position([[0, 'R'], [31, 's']]);
    game.handleMove(0, 8);
    game.handleMove(31, 30);
    game.handleMove(8, 0);
    assert.equal(game.penalties.red, -1);
    assert.deepEqual(game.getScores(), { redScore: 8, blackScore: 1 });
    assert.equal(new HiddenDragonGame().scores.r, 9);
    assert.equal(new HiddenDragonGame().penalties.red, 0);
});

test('no moves ends a game only when no hidden pieces remain', () => {
    const game = position([[0, 'R']]);
    game.isRedTurn = false;
    game.checkGameOver();
    assert.equal(game.isGameOver, true);
    const hidden = position([[0, 'R'], [31, 's', false]]);
    hidden.isRedTurn = false;
    hidden.checkGameOver();
    assert.equal(hidden.isGameOver, false);
});

test('AI selects a legal capture without mutating board state', () => {
    const game = position([[0, 'R'], [1, 's'], [31, 'k']]);
    const before = structuredClone(game.board);
    assert.deepEqual(new AIPlayer(game).findBestMove(), { type: 'move', from: 0, to: 1 });
    assert.deepEqual(game.board, before);
});

test('AI flips when no piece can move', () => {
    const game = new HiddenDragonGame();
    const move = new AIPlayer(game).findBestMove();
    assert.equal(move.type, 'flip');
    assert.equal(game.board[move.from].isFlipped, false);
});

function element() {
    return {
        classList: { add() {}, remove() {}, toggle() {} },
        addEventListener() {}, appendChild() {}, setAttribute() {}, innerHTML: '', textContent: '',
    };
}

test('reset cancels opening and reply timers and ignores already queued stale callbacks', () => {
    const previousDocument = globalThis.document;
    globalThis.document = { getElementById: element, createElement: element };
    const callbacks = new Map();
    let id = 0;
    try {
        const ui = new GameUI({
            schedule: callback => { callbacks.set(++id, callback); return id; },
            cancel: timer => callbacks.delete(timer),
        });
        ui.startGame(false);
        const stale = [...callbacks.values()][0];
        assert.equal(callbacks.size, 1);
        ui.initialize();
        assert.equal(callbacks.size, 0);
        stale();
        assert.equal(ui.game.isGameStarted, false);
        assert.ok(ui.game.board.every(cell => !cell.isFlipped));
        ui.startGame(true);
        ui.onSquareClick(0);
        const [timer, callback] = callbacks.entries().next().value;
        callbacks.delete(timer);
        callback();
        assert.equal(callbacks.size, 1);
        const staleReply = [...callbacks.values()][0];
        ui.initialize();
        staleReply();
        assert.equal(callbacks.size, 0);
        assert.equal(ui.pendingTimers.size, 0);
        assert.ok(ui.game.board.every(cell => !cell.isFlipped));
    } finally {
        globalThis.document = previousDocument;
    }
});


test('default timers preserve the browser global receiver', () => {
    const previousDocument = globalThis.document;
    const previousSchedule = globalThis.setTimeout;
    const previousCancel = globalThis.clearTimeout;
    globalThis.document = { getElementById: element, createElement: element };
    const callbacks = new Map();
    let id = 0;
    globalThis.setTimeout = function(callback) {
        assert.equal(this, globalThis, 'browser timers require the global receiver');
        callbacks.set(++id, callback);
        return id;
    };
    globalThis.clearTimeout = function(timer) {
        assert.equal(this, globalThis, 'browser cancellation requires the global receiver');
        callbacks.delete(timer);
    };
    try {
        const ui = new GameUI();
        ui.startGame(false);
        assert.equal(callbacks.size, 1);
        const [timer, callback] = callbacks.entries().next().value;
        callbacks.delete(timer);
        callback();
        assert.equal(ui.game.isGameStarted, true);
        assert.equal(ui.isHumanTurnNow(), true);
        assert.equal(ui.game.board.filter(cell => cell.isFlipped).length, 1);
        ui.onSquareClick(ui.game.board.findIndex(cell => !cell.isFlipped));
        assert.equal(callbacks.size, 1);
        ui.initialize();
        assert.equal(callbacks.size, 0);
    } finally {
        globalThis.document = previousDocument;
        globalThis.setTimeout = previousSchedule;
        globalThis.clearTimeout = previousCancel;
    }
});
