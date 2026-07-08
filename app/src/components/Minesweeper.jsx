import { useState, useEffect, useCallback } from 'react';

// MINESWEEPER.EXE - a DOS-styled minesweeper that pops up on the Konami code.
// Self-contained: manages its own game state; the engine just shows/hides it.
const ROWS = 9,
  COLS = 9,
  MINES = 10;
// classic minesweeper number colours
const numColor = ['', '#1010d0', '#0a7a0a', '#d01010', '#101088', '#8a1010', '#0a8a8a', '#101010', '#606060'];

const emptyBoard = () =>
  Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({ mine: false, rev: false, flag: false, boom: false, n: 0 }))
  );

function neighbors(r, c) {
  const o = [];
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const nr = r + dr,
        nc = c + dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) o.push([nr, nc]);
    }
  return o;
}

export default function Minesweeper({ onClose }) {
  const [board, setBoard] = useState(emptyBoard);
  const [phase, setPhase] = useState('ready'); // ready | playing | won | lost
  const [started, setStarted] = useState(false);
  const [time, setTime] = useState(0);
  const [flags, setFlags] = useState(0);

  useEffect(() => {
    if (phase !== 'playing') return;
    const id = setInterval(() => setTime((t) => Math.min(999, t + 1)), 1000);
    return () => clearInterval(id);
  }, [phase]);

  const reset = useCallback(() => {
    setBoard(emptyBoard());
    setPhase('ready');
    setStarted(false);
    setTime(0);
    setFlags(0);
  }, []);

  function placeMines(safeR, safeC) {
    const b = emptyBoard();
    const banned = new Set([safeR + ',' + safeC, ...neighbors(safeR, safeC).map(([r, c]) => r + ',' + c)]);
    let placed = 0;
    while (placed < MINES) {
      const r = Math.floor(Math.random() * ROWS),
        c = Math.floor(Math.random() * COLS);
      if (b[r][c].mine || banned.has(r + ',' + c)) continue;
      b[r][c].mine = true;
      placed++;
    }
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (!b[r][c].mine) b[r][c].n = neighbors(r, c).filter(([nr, nc]) => b[nr][nc].mine).length;
    return b;
  }

  function floodReveal(b, r, c) {
    const stack = [[r, c]];
    while (stack.length) {
      const [cr, cc] = stack.pop();
      const cell = b[cr][cc];
      if (cell.rev || cell.flag) continue;
      cell.rev = true;
      if (cell.n === 0 && !cell.mine)
        neighbors(cr, cc).forEach(([nr, nc]) => {
          if (!b[nr][nc].rev) stack.push([nr, nc]);
        });
    }
  }

  function reveal(r, c) {
    if (phase === 'won' || phase === 'lost') return;
    let b = board.map((row) => row.map((cell) => ({ ...cell })));
    let ph = phase;
    if (!started) {
      b = placeMines(r, c);
      setStarted(true);
      ph = 'playing';
    }
    const cell = b[r][c];
    if (cell.flag || cell.rev) return;
    if (cell.mine) {
      b.forEach((row) => row.forEach((cl) => { if (cl.mine) cl.rev = true; }));
      cell.boom = true;
      ph = 'lost';
    } else {
      floodReveal(b, r, c);
      const cleared = b.flat().filter((cl) => !cl.mine).every((cl) => cl.rev);
      if (cleared) {
        ph = 'won';
        b.forEach((row) => row.forEach((cl) => { if (cl.mine) cl.flag = true; }));
      }
    }
    setBoard(b);
    setPhase(ph);
    setFlags(b.flat().filter((c2) => c2.flag).length);
  }

  function toggleFlag(e, r, c) {
    e.preventDefault();
    if (phase === 'won' || phase === 'lost') return;
    const b = board.map((row) => row.map((cell) => ({ ...cell })));
    if (b[r][c].rev) return;
    b[r][c].flag = !b[r][c].flag;
    setBoard(b);
    setFlags(b.flat().filter((c2) => c2.flag).length);
  }

  const face = phase === 'lost' ? 'X(' : phase === 'won' ? 'B)' : ':)';
  const led = (n) => String(Math.max(0, Math.min(999, n))).padStart(3, '0');
  const minesLeft = MINES - flags;

  const raised = { boxShadow: 'inset 2px 2px 0 #fff, inset -2px -2px 0 #7a7a7a' };
  const sunken = { boxShadow: 'inset 1px 1px 0 #7a7a7a' };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-[#b8b8b8] text-black select-none w-[300px] max-w-[94vw]"
        style={{ boxShadow: '6px 6px 0 rgba(0,0,0,0.45)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-dos-blue text-cyan flex items-center px-2 py-[3px] font-bold text-[13px]">
          <span className="flex-1">MINESWEEPER.EXE</span>
          <span onClick={onClose} className="nc-close">x</span>
        </div>

        <div className="p-2.5">
          <div className="flex items-center justify-between border-2 border-[#7a7a7a] px-2 py-1.5 mb-2" style={sunken}>
            <span className="font-mono text-[18px] text-[#d01010] bg-black px-1.5 tracking-widest">{led(minesLeft)}</span>
            <span
              onClick={reset}
              className="cursor-pointer bg-[#b8b8b8] text-[15px] font-bold px-2 py-0.5 leading-none"
              style={raised}
              title="new game"
            >
              {face}
            </span>
            <span className="font-mono text-[18px] text-[#d01010] bg-black px-1.5 tracking-widest">{led(time)}</span>
          </div>

          <div className="border-2 border-[#7a7a7a]" style={sunken}>
            {board.map((row, r) => (
              <div key={r} className="flex w-full">
                {row.map((cell, c) => {
                  const base = 'flex-1 aspect-square flex items-center justify-center text-[15px] font-bold leading-none cursor-pointer';
                  if (!cell.rev) {
                    return (
                      <div
                        key={c}
                        className={base + ' bg-[#b8b8b8]'}
                        style={raised}
                        onClick={() => reveal(r, c)}
                        onContextMenu={(e) => toggleFlag(e, r, c)}
                      >
                        {cell.flag ? <span className="text-[#d01010]">⚑</span> : ''}
                      </div>
                    );
                  }
                  return (
                    <div
                      key={c}
                      className={base + ' border border-[#9a9a9a]'}
                      style={{ background: cell.boom ? '#d01010' : '#c6c6c6' }}
                    >
                      {cell.mine ? '✱' : cell.n > 0 ? <span style={{ color: numColor[cell.n] }}>{cell.n}</span> : ''}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="text-[11px] text-[#333] mt-2 text-center">
            {phase === 'won'
              ? '★ CLEARED · nicely done. Click the face to play again.'
              : phase === 'lost'
                ? 'BOOM. Click the face to try again.'
                : 'left-click reveal · right-click flag · Esc to close'}
          </div>
        </div>
      </div>
    </div>
  );
}
