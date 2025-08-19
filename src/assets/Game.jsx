import { useCallback, useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { useLocation } from "react-router-dom";
import { getBestMove } from './minimaxAI';
import './Game.css';
import axios from "axios";

function Game() {
  const recognitionInstance = useRef(null);
  const isRecognizing = useRef(false);
  const promote=useRef("q");
  const location = useLocation();
  const state = location.state;
  // console.log(state);
  const mode=state?.mode??1;
  const blind=state?.blind??false;
  const color=state?.color??"white";
  const [game, setGame] = useState(new Chess());
  const [position, setPosition] = useState(game.fen());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [highlightedSquares, setHighlightedSquares] = useState({});
  const [moveHistory, setMoveHistory] = useState([]);
  const [show,setShow]=useState(false);
  const [showtext,setShowtext]=useState('Show');
  const [times,setTimes]=useState(3);
  const bottomRef = useRef(null);
  const isPlayerTurn = useRef(true);
  const [playerTurnState, setPlayerTurnState] = useState(true);
  const [boardheight,setBoardheight]=useState(1.23*window.innerWidth);
  const [welcometext,setWelcomeText]=useState('♟️Welcome to Chess Arena♟️');
  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [moveHistory]);
  useEffect(() => {
    const gameOver = game.isGameOver();
    if (gameOver || !isPlayerTurn.current) {
      if (recognitionInstance.current && isRecognizing.current) {
        recognitionInstance.current.abort();
        isRecognizing.current = false;
        // console.log("Stopped recognition: game over or not player turn");
      }
    }
    if (!gameOver && !isPlayerTurn.current) {
      setTimeout(() => {
        makeBotMove();
      },1500);
    }
  }, [game, playerTurnState]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.code === "Space" &&
        isPlayerTurn.current &&
        !isRecognizing.current &&
        !game.isGameOver()
      ) {
        e.preventDefault();
        startSpeechRecognition();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);


  const safeGameMutate = (modify) => {
    modify(game);
    setGame(game);
    setPosition(game.fen());
  };

  const undoMove = () => {
    safeGameMutate((gameInstance) => {
      gameInstance.undo();
      if(mode===1){
        gameInstance.undo();
        setMoveHistory((prev) => prev.slice(0, -1));
      }
      setMoveHistory((prev) => prev.slice(0, -1));
    });
    isPlayerTurn.current = true;
    setPlayerTurnState(true);
  };

  const makeAMove = (move) => {
    let moveResult = null;
    safeGameMutate((gameInstance) => {
      // console.log("here 1")
      try {
        moveResult = gameInstance.move(move);
      // console.log("here 2")
        if (moveResult) {
        // console.log("here 3")
          if(recognitionInstance.current && isRecognizing.current) {
            recognitionInstance.current.abort();
            isRecognizing.current = false;
            // console.log("Stopped recognition immediately after move.");
          }
          if (mode === 1) {
            isPlayerTurn.current = false;
            setPlayerTurnState(false);
          }
          setMoveHistory((prev) => [...prev, moveResult.san]);
          speak(moveResult.san);
        }
      } catch (e) {
        moveResult = null;
      }
    });
    return moveResult;
  };

  const makeBotMove = async() => {
    const fen = game.fen();
    try {
      const response = await axios.post("http://localhost:5000/fen", {fen});
      console.log("Server response:", response.data);
      const move = response.data.bestMove;
      const [from,to] = [move.substring(0,2),move.substring(2,4)];
      console.log("from",from,to);
      makeAMove({ from, to, promotion: promote.current });
      isPlayerTurn.current=true;
      setPlayerTurnState(true);
    } catch (error) {
      console.error("Error sending FEN:", error);
    }
    // getBestMove(fen,2);
  };


  const startSpeechRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech Recognition not supported in this browser.");
      return;
    }

    if (!recognitionInstance.current) {
      recognitionInstance.current = new SpeechRecognition();
      const recognition = recognitionInstance.current;
      recognition.continuous = true;
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        isRecognizing.current = false;
        recognition.abort();
        if (!isPlayerTurn.current) return;
        let transcript = event.results[0][0].transcript.toLowerCase();
        // console.log("Heard:", transcript);
        const corrections = {jivan:"g1",jeevan:"g1",even:"e1"};
        for(let word in corrections){
          transcript=transcript.replace(new RegExp(word,'g'),corrections[word]);
        }
        const match = transcript.toUpperCase().match(/([A-H][1-8]).*([A-H][1-8])/);
        if (match) {
          const from = match[1].toLowerCase();
          const to = match[2].toLowerCase();
          const move = makeAMove({ from, to, promotion: promote.current });
          if (!move) {
            speak(`Invalid move ,${transcript}`);
          }
        } else {
          speak(`Couldn't understand the move`);
        }
      };
      recognition.onend = () => {
        // console.log("Recognition ended");
        isRecognizing.current = false;
      };
    }
    try {
      recognitionInstance.current.start();
      isRecognizing.current = true;
    } catch (e) {
      // console.warn("Recognition already started.");
    }
  }, [makeAMove, mode]);
  
  const speak = (text) => {
    if (recognitionInstance.current && isRecognizing.current) {
      recognitionInstance.current.abort();
      isRecognizing.current = false;
      // console.log("Paused recognition during speaking.");
    }
    let a = "", b = "", d = "";
    if (text.endsWith('+')) d = ', check', text = text.slice(0, -1);
    if (text.endsWith('#')) d = ', checkmate', text = text.slice(0, -1);
    if (text === 'O-O-O') text = "Long side castling";
    else if (text === 'O-O') text = "Short side castling";
    if (text[0] === 'B') a = 'Bishop ';
    else if (text[0] === 'N') a = 'Knight ';
    else if (text[0] === 'R') a = 'Rook ';
    else if (text[0] === 'Q') a = 'Queen ';
    else if (text[0] === 'K') a = 'King ';
    if (text[1] === 'x') {
      b = 'takes ';
      if (!a.length) a = text[0] + ' ';
    }
    if (a.length && b.length) text = text.slice(2);
    else if (a.length) text = text.slice(1);
    const utterance = new SpeechSynthesisUtterance(a + b + text + d);
    utterance.lang = "en-IN";
    utterance.rate = 2;
    utterance.pitch = 1.2;
    window.speechSynthesis.speak(utterance);
  };

  const onPieceDrop = (source, target) => {
    setSelectedSquare(null);
    setHighlightedSquares({});
    if (!isPlayerTurn.current) return false;
    if(blind&&show){
      speak('You cannot move a peice while seeing the board in blind mode');
      return;
    }
    const move = makeAMove({ from: source, to: target, promotion: promote.current });
    if (!move) {
      speak("Invalid move");
      return false;
    }
    return true;
  };

  const onSquareClick = (square) => {
    if (!isPlayerTurn.current) return;
    if(blind&&show){
      alert('You cannot move a peice while seeing the board in blind mode');
      return;
    }
    if (selectedSquare) {
      const move = makeAMove({ from: selectedSquare, to: square, promotion: promote.current });
      if (move) {
        setSelectedSquare(null);
        setHighlightedSquares({});
      } else {
        setSelectedSquare(square);
        highlightLegalMoves(square);
      }
    }else {
      setSelectedSquare(square);
      highlightLegalMoves(square);
    }
  };

  const highlightLegalMoves = (square) => {
    const moves = game.moves({ square, verbose: true });
    const highlights = {};
    moves.forEach((m) => {
      highlights[m.to] = {
        background: "radial-gradient(circle, #fffcab 36%, transparent 40%)",
        borderRadius: "50%",
      };
    });
    highlights[square] = { background: "rgba(255,255,0,0.4)" };
    setHighlightedSquares(highlights);
  };
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= 1100) {
        setBoardheight(704);
        setWelcomeText('♟️Welcome to Chess Arena♟️');
      }
      else {
        if (width < 700) {
          setWelcomeText('♟️Chess Arena♟️');
          setBoardheight(0.915*width);
        }
        else if(width<=750){
          setBoardheight(0.915*width);
          setWelcomeText('♟️Welcome to Chess Arena♟️');
        }
        else {
          setWelcomeText('♟️Welcome to Chess Arena♟️');
          setBoardheight(0.64 * width);
        }
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return (
    <>
      <h2 className="game-heading">{welcometext}</h2>
      <div className="container">
        <Chessboard
          customPieces={(blind&&!show) ? {
            wP: () => <></>,wN: () => <></>,wB: () => <></>,
            wR: () => <></>,wQ: () => <></>,wK: () => <></>,
            bP: () => <></>,bN: () => <></>,bB: () => <></>,
            bR: () => <></>,bQ: () => <></>,bK: () => <></>
          } : {}}
          onPieceDragBegin={(piece,square) => {
            highlightLegalMoves(square)
          }}
          onPromotionPieceSelect = {(piece, promoteFromSquare, promoteToSquare) => {
            const promotionChar = piece.slice(-1).toLowerCase();
            promote.current=promotionChar;
            return promote;
          }}
          autoPromoteToQueen={false}
          arePremovesAllowed={true}
          customArrowColor="green"
          boardOrientation="white"
          position={position}
          onPieceDrop={onPieceDrop}
          onSquareClick={onSquareClick}
          customSquareStyles={highlightedSquares}
          boardWidth={boardheight}
          animationDuration={200}
        />
        <div className="sidebar-container">
        {blind && times > 0 && (
          <button
            onClick={() => {
              setShow(!show);
              if (show) {
                setShowtext('Show');
                setTimes(times - 1);
              } else {
                setShowtext("Hide");
              }
            }}
            style={{
              marginTop: "8px", backgroundColor: "#1f1f1f", color: "#fff",
              border: "2px solid #ccc", boxShadow: "0 0 6px #444",
            }}
          >
            {showtext === "Show" ? `👁️ Show Board (${times} left)` : `🙈 Hide Board`}
          </button>
        )}
        <button  onClick={undoMove} style={{color:"black"}}>Undo</button>
        <div className="move-container">
          {moveHistory.map((move, idx) =>
            idx % 2 === 0 ? (
              <div key={idx}  ref={bottomRef} className="move-box" style={{ display: "flex", width: "99%" }}>
                <div style={{ width: "10%" }}>{Math.floor(idx / 2) + 1}.</div>
                <div style={{ width: "27%" }}>{move}</div>
                <div style={{ width: "27%" }}>{moveHistory[idx + 1] || ""}</div>
              </div>
            ) : null
          )}
        </div>
      </div>

      </div>
    </>
  );
}

export default Game;
