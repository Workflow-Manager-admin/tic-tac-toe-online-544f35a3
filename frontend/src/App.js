import React, { useState, useEffect } from "react";
import "./App.css";

/**
 * Utility to check for a winner or draw
 * @param {Array} squares - Flat 9-cell array: ["X","","O",...]
 * @returns {Object} - {winner: "X"|"O"|null, line: [idx,idx,idx], isDraw: bool}
 */
function calculateWinner(squares) {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8], // rows
    [0,3,6],[1,4,7],[2,5,8], // cols
    [0,4,8],[2,4,6]
  ];
  for (let line of lines) {
    const [a,b,c] = line;
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { winner: squares[a], line };
    }
  }
  if (squares.every(Boolean)) {
    return { winner: null, line: null, isDraw: true };
  }
  return { winner: null, line: null, isDraw: false };
}

/**
 * Simple AI - plays winning move, blocks opponent's win, or picks randomly
 * @param {Array} squares
 * @param {string} aiMark - "O"
 * @param {string} humanMark - "X"
 * @returns {number} - index of best move
 */
function getAIMove(squares, aiMark, humanMark) {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8],[0,3,6],
    [1,4,7],[2,5,8],[0,4,8],[2,4,6]
  ];
  // Try to win
  for (let line of lines) {
    const [a,b,c] = line;
    const marks = [squares[a], squares[b], squares[c]];
    if (marks.filter(m => m === aiMark).length === 2 && marks.includes("")) {
      return line[marks.indexOf("")];
    }
  }
  // Block human win
  for (let line of lines) {
    const [a,b,c] = line;
    const marks = [squares[a], squares[b], squares[c]];
    if (marks.filter(m => m === humanMark).length === 2 && marks.includes("")) {
      return line[marks.indexOf("")];
    }
  }
  // Center
  if (squares[4] === "") return 4;
  // Corners
  const corners = [0,2,6,8].filter(i => squares[i]==="");
  if (corners.length) return corners[Math.floor(Math.random()*corners.length)];
  // Sides
  const empty = squares.map((v,i) => v===""?i:null).filter(x=>x!==null);
  if (empty.length) return empty[Math.floor(Math.random()*empty.length)];
  return -1;
}

// SQUARE COMPONENT
function Square({value, onClick, highlight}) {
  return (
    <button
      className={`ttt-square${highlight ? " ttt-highlight" : ""}`}
      onClick={onClick}
      aria-label={value ? `Cell ${value}` : "Empty cell"}
      tabIndex={0}
      style={{
        transition: "background .2s, color .2s"
      }}
    >
      {value}
    </button>
  );
}

// BOARD COMPONENT
function Board({squares, winnerLine, onCellClick}) {
  return (
    <div className="ttt-board" role="grid">
      {squares.map((v,i) => (
        <Square
          key={i}
          value={v}
          highlight={winnerLine && winnerLine.includes(i)}
          onClick={() => onCellClick(i)}
        />
      ))}
    </div>
  );
}

// HISTORY COMPONENT
function History({history, currentStep, jumpTo}) {
  return (
    <aside className="ttt-history" aria-label="Move history">
      <h3>Move History</h3>
      <ol>
        {history.map((step, move) => (
          <li key={move}>
            <button
              className={move === currentStep ? "ttt-history-active" : ""}
              onClick={() => jumpTo(move)}
            >
              {move === 0 ? "Start" : `#${move} (${step.lastMove !== null ? `row ${Math.floor(step.lastMove/3)+1}, col ${(step.lastMove%3)+1}` : "-"})`}
            </button>
          </li>
        ))}
      </ol>
    </aside>
  );
}

const MODE_AI = "Computer (AI)";
const MODE_2P = "Two Player";

export default function App() {
  // THEME SUPPORT
  const [theme, setTheme] = useState("light");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
  const toggleTheme = () => setTheme(t => t==="light"?"dark":"light");

  // GAME STATE
  const [mode, setMode] = useState(MODE_AI);
  const [history, setHistory] = useState([
    {squares: Array(9).fill(""), xIsNext: true, lastMove: null}
  ]);
  const [stepNumber, setStepNumber] = useState(0);

  // Derive current state
  const current = history[stepNumber];
  const winnerObj = calculateWinner(current.squares);
  const gameOver = !!winnerObj.winner || winnerObj.isDraw;

  // Play AI after human move if required
  useEffect(() => {
    if (
      mode === MODE_AI &&
      !gameOver &&
      !current.xIsNext
    ) {
      const timer = setTimeout(() => {
        const aiMove = getAIMove(current.squares, "O", "X");
        if (aiMove !== -1 && !current.squares[aiMove]) {
          handleCellClick(aiMove, true);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line
  }, [current, mode, gameOver]);

  // Handle cell click from user or AI
  const handleCellClick = (i, isAI=false) => {
    if (gameOver || current.squares[i]) return;
    if (mode === MODE_AI && !current.xIsNext && !isAI) return; // Prevent human O if vs AI
    const squares = current.squares.slice();
    squares[i] = current.xIsNext ? "X" : "O";
    const newHistory = history.slice(0, stepNumber+1).concat([{
      squares,
      xIsNext: !current.xIsNext,
      lastMove: i
    }]);
    setHistory(newHistory);
    setStepNumber(newHistory.length-1);
  };

  // Jump to move in history
  const jumpTo = (move) => {
    setStepNumber(move);
  };

  // Restart game (keep mode)
  const handleRestart = () => {
    setHistory([{squares: Array(9).fill(""), xIsNext: true, lastMove: null}]);
    setStepNumber(0);
  };

  // New Game (choose mode)
  const handleNewGame = (selectedMode) => {
    setMode(selectedMode);
    handleRestart();
  };

  // Status messages
  let status;
  if (winnerObj.winner) {
    status = `Winner: ${winnerObj.winner}${mode===MODE_AI? (winnerObj.winner==="X"? " (You)" : " (Computer)"):""}`;
  } else if (winnerObj.isDraw) {
    status = "Draw!";
  } else {
    status = `Next turn: ${current.xIsNext ? "X" + (mode===MODE_AI ? " (You)" : "") : "O" + (mode===MODE_AI ? " (Computer)" : "")}`;
  }

  return (
    <div className="App">
      <header className="App-header">
        <button className="theme-toggle" onClick={toggleTheme}
          aria-label={`Switch to ${theme==="light"?"dark":"light"} mode`}
        >
          {theme==="light" ? "🌙 Dark" : "☀️ Light"}
        </button>
        <h1 className="ttt-title">Tic Tac Toe</h1>
        <div className="ttt-game-area">
          <div className="ttt-board-and-controls">
            <Board
              squares={current.squares}
              onCellClick={handleCellClick}
              winnerLine={winnerObj.line}
            />
            <div className="ttt-controls">
              <div className="ttt-status" aria-live="polite">{status}</div>
              {gameOver && (
                <button className="ttt-btn" onClick={handleRestart}>
                  Restart
                </button>
              )}
              <button
                className="ttt-btn ttt-btn-alt"
                onClick={() => handleNewGame(mode === MODE_AI ? MODE_2P : MODE_AI)}
              >
                Switch to {mode === MODE_AI ? "Two Player" : "Computer AI"}
              </button>
            </div>
          </div>
          <History
            history={history}
            currentStep={stepNumber}
            jumpTo={jumpTo}
          />
        </div>
        <footer className="ttt-footer">
          <span>
            Made with <span style={{color:"var(--text-secondary)"}}>React</span>
          </span>
        </footer>
      </header>
    </div>
  );
}
