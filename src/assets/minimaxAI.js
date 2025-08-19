import { Chess } from 'chess.js'
class Queue {
  constructor() {
    this._arr = []
    this._head = 0
  }
  push(x) { this._arr.push(x) }
  pop() {
    if (this._head >= this._arr.length) return undefined
    return this._arr[this._head++]
  }
  front() {
    return this._arr[this._head];
  }
  empty() { return this._head >= this._arr.length }
}

const q=new Queue();
export function getBestMove(fen, depth) {
  const set=new Set()
  set.add(fen)
  const game = new Chess(fen)
  let bestMove = null
  const moves = game.moves({ verbose: true })
  moves.sort((a, b) => {
    moveScore(b) - moveScore(a)
  })
  for(const move of moves){
    q.push({move:move,depth:depth-1})
  }
  while(!q.empty()){
    const{move,depth}=q.front();
    console.log(depth,move);
    q.pop();
    game.move(move);
    const newfen=game.fen();
    if(set.has(newfen)){game.undo();continue;}
    set.add(newfen)
    const newmoves=game.moves({verbose:true});
    game.undo();
    for(const move of newmoves){
      q.push({move:move,depth:depth-1})
    }
  }
  return bestMove
    ? {
        from: bestMove.from,
        to: bestMove.to,
        promotion: bestMove.promotion || 'q'
      }
    : null
}

function moveScore(move) {
  if(move.captured)return 10;
  if(move.san.includes('+'))return 5;
  if(move.san.includes('O'))return 15;
}
function minimax(game, depth, alpha, beta, isWhiteMove) {
  if (game.isCheckmate()) return isWhiteMove ? -Infinity : Infinity
  if (game.isDraw() || game.isStalemate()) return 0
  if (depth === 0) return evaluateBoard(game, alpha, beta, isWhiteMove)
  // const moves = game.moves({ verbose: true })
  console.log(q);
  // if (isWhiteMove) {
//     let maxEval = -Infinity
//     for (const move of moves) {
//       game.move(move)
//       const evalScore = minimax(game, depth - 1, alpha, beta, false)
//       game.undo()
//       maxEval = Math.max(maxEval, evalScore)
//       alpha = Math.max(alpha, evalScore)
//       if (beta <= alpha) break
//     }
//     return maxEval
  // } 
// else {
//     let minEval = Infinity
//     for (const move of moves) {
//       game.move(move)
//       const evalScore = minimax(game, depth - 1, alpha, beta, true)
//       game.undo()
//       minEval = Math.min(minEval, evalScore)
//       beta = Math.min(beta, evalScore)
//       if (beta <= alpha) break
//     }
//     return minEval
//   }
// }
}

function evaluateBoard(game) {
  const fen = game.fen().split(' ')[0]
  if (evaluateBoard.cache.has(fen)) return evaluateBoard.cache.get(fen)

  const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }
  let value = 0
  for (const c of fen) {
    if (/[pnbrqk]/.test(c)) value -= pieceValues[c]
    else if (/[PNBRQK]/.test(c)) value += pieceValues[c.toLowerCase()]
  }
  evaluateBoard.cache.set(fen, value)
  return value
}
evaluateBoard.cache = new Map()
