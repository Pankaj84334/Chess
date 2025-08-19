const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.post('/fen', (req, res) => {
  const { fen } = req.body;
  // console.log("Received FEN:", fen);
  const stockfish = spawn('C:/Users/panka/Downloads/stockfish-windows-x86-64-avx2/stockfish/stockfish-windows-x86-64-avx2.exe');
    
    stockfish.stdin.write('uci\n');
    stockfish.stdin.write('ucinewgame\n');
    stockfish.stdin.write(`position fen ${fen}\n`);
    // stockfish.stdin.write('go movetime 1000\n');
    stockfish.stdin.write('go depth 2\n');
    
  stockfish.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    console.log("line",lines);
    for(const line of lines) {
      console.log('[Stockfish]', line);
      if(line.startsWith('bestmove')) {
        const bestMove = line.split(' ')[1];
        console.log('Best move:', bestMove);
        res.json({ bestMove });
        stockfish.stdin.write('quit\n');
      }
    }
  });

  stockfish.stderr.on('data', (err) => {
    console.error("Stockfish error:", err.toString());
    res.status(500).json({ error: "Stockfish error" });
  });
});
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});