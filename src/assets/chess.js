import { Chess } from "chess.js";
const game = new Chess();
console.log(game.moves()); // Get legal moves
game.move("e4"); // Make a move
