🐲 Hidden Dragon Chess II: The Rise of the Archer AI Mode (暗龍棋II：弓兵崛起 AI) 🐲

![Hidden-Gragon-Chess-II-The-Rise-of-Archer-AI-Mode 3 4 5.jpg](https://github.com/HHJPZhao/Hidden-Dragon-Chess-II-The-Rise-of-the-Archer-AI-Mode/blob/main/Hidden-Gragon-Chess-II-The-Rise-of-Archer-AI-Mode%203%204%205.jpg)

A unique and strategic chess variant based on Chinese Chess (象棋) combined with a "fog of war" flipping mechanic. All 32 pieces start face-down on a crowded 4x8 board, forcing players to make tactical decisions about what to reveal and when to attack.

▶️ Play the Game Live!
You can play the latest version of this game, complete with an AI opponent, right here in your browser:

[https://Hidden-Dragon-Chess-II-The-Rise-of-the-Archer-AI-Mode/](https://hhjpzhao.github.io/Hidden-Dragon-Chess-II-The-Rise-of-the-Archer-AI-Mode/)

📜 Table of Contents
Game Features

How to Play

Piece Movement & Capture Rules

Winning the Game

✨ Game Features
⚔️ Crowded Battlefield: All 32 pieces are placed on a 4x8 grid with no empty squares at the start.

❓ Fog of War: All pieces begin face-down. You don't know which pieces are where!

🤔 Flip or Move: On your turn, you can either reveal a new hidden piece or move one of your revealed pieces.

🏆 Score-Based Victory: The game ends only when a player has no legal moves. The winner is decided by scoring the pieces left on the board.

🏹 Custom Pieces: Features a roster of modified Xiangqi pieces, including the unique Archer.

📖 How to Play
Starting the Game
At the start of the game, the human player chooses to go first or second.

The First Turn (Color Selection)
The player designated to go first begins the game by choosing any single face-down piece and flipping it face-up.

The color of this revealed piece (Red or Black) becomes that player's color for the rest of the game.

The other player is assigned the opposite color.

The first player's turn is now over. The turn immediately passes to the second player.

A Regular Turn
On your turn, you must perform one of two possible actions:

Flip: Choose any face-down piece on the board and reveal it. This ends your turn.

Move: Choose one of your already revealed pieces and move or capture with it according to its rules.

♟️ Piece Movement & Capture Rules
Pieces can only move to an empty square or to a square occupied by an opponent's revealed piece. Hidden pieces cannot be captured and block movement (except for the Cannon jump).

Piece

Red

Black

Movement & Capture Rules

Score

Chariot

俥

車

Moves and captures any number of squares in a straight line (like a Chess Rook).

12

General

帥

將

Moves and captures one square in any of the 8 directions (like a standard Chess King).

10

Cannon

砲

炮

Moves like a Chariot to an empty square. To capture, it must jump over exactly one piece (the "screen") to land on an opponent's piece. The screen can be any piece, hidden or revealed.

8

Horse

傌

馬

Moves and captures in an 'L' shape and can jump over other pieces (like a standard Chess Knight).

7

Archer

弩

弓

Moves one square in a straight direction to an empty square. To capture, it "shoots" over the adjacent square to land on a piece exactly two squares away in any of the 8 directions.

6

Elephant

相

象

Moves and captures any number of squares diagonally (like a standard Chess Bishop).

5

Advisor

士

仕

Moves one square in any of the 8 directions to an empty square. Captures one square diagonally only.

4

Soldier

兵

卒

Moves and captures one square in any of the four straight directions (forward, backward, left, right).

3

Special Rule: Repetition Penalty
If a player makes a move that exactly reverses their opponent's last move (e.g., Player A moves a Horse from A1 to B3, and Player B immediately moves it back from B3 to A1), the player making the repetitive move will be penalized 1 point. This encourages dynamic play.

🏆 Winning the Game
The game ends immediately when the player whose turn it is has no legal actions available. This occurs when they cannot move any of their pieces AND there are no hidden pieces left to flip.

As soon as the game ends, the scores of all pieces remaining on the board are tallied. The player with the higher score wins.


## Development

Use Node.js 18+ for tests and Python 3 for the local HTTP server. No npm dependencies or build step are required.

```sh
npm start
# Open http://localhost:8000
npm test
```

Serve the game over HTTP: browser ES modules do not support opening this page directly with `file://`. The existing GitHub Pages hosting works with these relative module paths.

### Project structure

| File | Responsibility |
| --- | --- |
| `index.html` | Page structure and Tailwind CDN |
| `styles.css` | Custom styles |
| `src/constants.js` | Board dimensions, initial army, piece values and symbols |
| `src/game.js` | Board state, moves, turns, scoring and game end rules |
| `src/ai.js` | Minimax evaluation and action selection |
| `src/ui.js` | Rendering, clicks and cancellable turn timers |
| `src/main.js` | Browser entry point |
| `tests/game.test.js` | Rules, AI and reset regression tests |

The engine and AI have no DOM dependency. UI timers are cancelled on reset; callbacks also check the game generation to ignore stale work already queued. Repetition penalties are separate from immutable piece values.

### Existing rules preserved

This refactor preserves the existing engine's values: `K=10, R=9, C=5, H=4, W=3, E=2, A=2, S=1`. These differ from the original rules table above. The engine penalizes reversing the player's own previous move, rather than the opponent's move as described above. AI selects a move whenever one exists and considers flipping only when no move exists. These discrepancies are documented here for a separate gameplay decision.
