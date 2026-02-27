import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  RotateCcw, 
  Play, 
  Timer, 
  Settings2, 
  X, 
  ChevronRight,
  AlertCircle,
  HelpCircle,
  Languages
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn } from './lib/utils';
import { Block, GameMode, GRID_COLS, GRID_ROWS, INITIAL_ROWS, TIME_LIMIT } from './types/game';
import { translations } from './constants/translations';

const generateId = () => Math.random().toString(36).substring(2, 9);

const getRandomValue = () => {
  return Math.floor(Math.random() * 9) + 1;
};

export default function App() {
  const [mode, setMode] = useState<GameMode | null>(null);
  const [lang, setLang] = useState<'en' | 'cn'>('cn');
  const [showHelp, setShowHelp] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [targetSum, setTargetSum] = useState(0);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [highScore, setHighScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem('summerge_highscore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  // Update high score
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('summerge_highscore', score.toString());
    }
  }, [score, highScore]);

  const generateTarget = useCallback(() => {
    // Target sum between 10 and 25
    return Math.floor(Math.random() * 16) + 10;
  }, []);

  const addNewRow = useCallback(() => {
    setBlocks(prev => {
      // Shift existing blocks up
      const shifted = prev.map(b => ({ ...b, row: b.row - 1 }));
      
      // Check for game over (any block reached row 0)
      if (shifted.some(b => b.row < 0)) {
        setIsGameOver(true);
        return prev;
      }

      // Add new row at the bottom (row = GRID_ROWS - 1)
      const newRow: Block[] = Array.from({ length: GRID_COLS }).map((_, col) => ({
        id: generateId(),
        value: getRandomValue(),
        row: GRID_ROWS - 1,
        col
      }));

      return [...shifted, ...newRow];
    });
  }, []);

  const startGame = (selectedMode: GameMode) => {
    setMode(selectedMode);
    setIsGameOver(false);
    setScore(0);
    setSelectedIds([]);
    const initialTarget = generateTarget();
    setTargetSum(initialTarget);
    setTimeLeft(TIME_LIMIT);

    // Initial blocks
    const initialBlocks: Block[] = [];
    for (let r = GRID_ROWS - INITIAL_ROWS; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        initialBlocks.push({
          id: generateId(),
          value: getRandomValue(),
          row: r,
          col: c
        });
      }
    }
    setBlocks(initialBlocks);
  };

  const handleBlockClick = (id: string) => {
    if (isGameOver || isPaused) return;

    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      }
      return [...prev, id];
    });
  };

  // Check sum
  useEffect(() => {
    const currentSum = blocks
      .filter(b => selectedIds.includes(b.id))
      .reduce((sum, b) => sum + b.value, 0);

    if (selectedIds.length > 0 && currentSum === targetSum) {
      // Success!
      const count = selectedIds.length;
      setScore(prev => prev + (count * 10) + (mode === 'time' ? Math.ceil(timeLeft) : 0));
      
      // Mark for removal
      setBlocks(prev => prev.filter(b => !selectedIds.includes(b.id)));
      setSelectedIds([]);
      setTargetSum(generateTarget());
      setTimeLeft(TIME_LIMIT);

      if (mode === 'classic') {
        addNewRow();
      }

      // Visual feedback
      if (count >= 4) {
        confetti({
          particleCount: 40,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#3b82f6', '#f59e0b']
        });
      }
    } else if (currentSum > targetSum) {
      // Exceeded - flash red or something?
      setSelectedIds([]);
    }
  }, [selectedIds, targetSum, blocks, generateTarget, addNewRow, mode, timeLeft]);

  // Timer for Time Mode
  useEffect(() => {
    if (mode === 'time' && !isGameOver && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 0) {
            addNewRow();
            return TIME_LIMIT;
          }
          return prev - 0.1;
        });
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mode, isGameOver, isPaused, addNewRow]);

  const currentSum = blocks
    .filter(b => selectedIds.includes(b.id))
    .reduce((sum, b) => sum + b.value, 0);

  const t = translations[lang];

  if (!mode) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 grid-pattern">
        {/* Language Toggle */}
        <div className="fixed top-4 right-4 flex gap-2">
          <button 
            onClick={() => setShowHelp(true)}
            className="p-3 rounded-full bg-white border border-zinc-200 shadow-sm hover:bg-zinc-50 transition-colors"
          >
            <HelpCircle className="w-5 h-5 text-zinc-600" />
          </button>
          <button 
            onClick={() => setLang(l => l === 'en' ? 'cn' : 'en')}
            className="p-3 rounded-full bg-white border border-zinc-200 shadow-sm hover:bg-zinc-50 transition-colors flex items-center gap-2"
          >
            <Languages className="w-5 h-5 text-zinc-600" />
            <span className="text-xs font-bold uppercase">{lang}</span>
          </button>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full glass-panel p-8 rounded-3xl text-center"
        >
          <div className="w-20 h-20 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-200">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">{t.title}</h1>
          <p className="text-zinc-500 mb-8">{t.subtitle}</p>
          
          <div className="space-y-4">
            <button 
              onClick={() => startGame('classic')}
              className="w-full group flex items-center justify-between p-4 rounded-2xl bg-zinc-900 text-white hover:bg-zinc-800 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Play className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">{t.classicMode}</div>
                  <div className="text-xs text-zinc-400">{t.classicDesc}</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <button 
              onClick={() => startGame('time')}
              className="w-full group flex items-center justify-between p-4 rounded-2xl border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center">
                  <Timer className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">{t.timeMode}</div>
                  <div className="text-xs text-zinc-500">{t.timeDesc}</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>

          {highScore > 0 && (
            <div className="mt-8 pt-8 border-t border-zinc-100 flex items-center justify-center gap-2 text-zinc-500">
              <Trophy className="w-4 h-4" />
              <span className="text-sm font-medium">{t.bestScore}: {highScore}</span>
            </div>
          )}
        </motion.div>

        {/* Help Modal */}
        <AnimatePresence>
          {showHelp && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
              >
                <button 
                  onClick={() => setShowHelp(false)}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-zinc-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <HelpCircle className="w-6 h-6 text-emerald-500" />
                  {t.howToPlay}
                </h2>
                <ul className="space-y-4">
                  {t.instructions.map((inst, i) => (
                    <li key={i} className="flex gap-3 text-zinc-600">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="text-sm leading-relaxed">{inst}</span>
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={() => setShowHelp(false)}
                  className="w-full mt-8 p-4 rounded-2xl bg-zinc-900 text-white font-bold hover:bg-zinc-800 transition-colors"
                >
                  OK
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center p-4 md:p-8 grid-pattern">
      {/* Header */}
      <div className="w-full max-w-lg flex items-center justify-between mb-6 glass-panel p-4 rounded-2xl">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">{t.target}</span>
          <span className="text-3xl font-mono font-bold text-emerald-600 leading-none">{targetSum}</span>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">{t.current}</span>
          <div className={cn(
            "text-3xl font-mono font-bold leading-none transition-colors",
            currentSum > targetSum ? "text-red-500" : "text-zinc-900"
          )}>
            {currentSum}
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">{t.score}</span>
          <span className="text-3xl font-mono font-bold text-zinc-900 leading-none">{score}</span>
        </div>
      </div>

      {/* Game Board */}
      <div className="relative w-full max-w-lg aspect-[6/10] glass-panel rounded-3xl overflow-hidden shadow-2xl">
        {/* Grid Background */}
        <div className="absolute inset-0 grid grid-cols-6 grid-rows-10">
          {Array.from({ length: 60 }).map((_, i) => (
            <div key={i} className="border-[0.5px] border-zinc-100" />
          ))}
        </div>

        {/* Blocks */}
        <AnimatePresence>
          {blocks.map((block) => (
            <motion.button
              key={block.id}
              layout
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={() => handleBlockClick(block.id)}
              className={cn(
                "absolute p-1 transition-all duration-200",
                selectedIds.includes(block.id) ? "z-10" : "z-0"
              )}
              style={{
                left: `${block.col * (100 / GRID_COLS)}%`,
                top: `${block.row * (100 / GRID_ROWS)}%`,
                width: `${100 / GRID_COLS}%`,
                height: `${100 / GRID_ROWS}%`,
              }}
            >
              <div className={cn(
                "w-full h-full rounded-lg flex items-center justify-center font-mono font-bold text-lg shadow-sm transition-all border-b-4 active:border-b-0 active:translate-y-1",
                selectedIds.includes(block.id) 
                  ? "bg-emerald-500 text-white border-emerald-700 shadow-emerald-200" 
                  : "bg-white text-zinc-800 border-zinc-200 hover:bg-zinc-50"
              )}>
                {block.value}
              </div>
            </motion.button>
          ))}
        </AnimatePresence>

        {/* Time Progress Bar */}
        {mode === 'time' && (
          <div className="absolute bottom-0 left-0 w-full h-1 bg-zinc-100">
            <motion.div 
              className="h-full bg-amber-500"
              initial={{ width: '100%' }}
              animate={{ width: `${(timeLeft / TIME_LIMIT) * 100}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        )}

        {/* Warning Indicator */}
        {blocks.some(b => b.row <= 1) && (
          <motion.div 
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="absolute top-0 left-0 w-full h-[20%] bg-red-500/10 pointer-events-none flex items-center justify-center"
          >
            <AlertCircle className="text-red-500 w-8 h-8 opacity-50" />
          </motion.div>
        )}
      </div>

      {/* Controls */}
      <div className="w-full max-w-lg mt-6 flex items-center justify-between gap-4">
        <button 
          onClick={() => setIsPaused(!isPaused)}
          className="flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl bg-white border border-zinc-200 font-semibold hover:bg-zinc-50 transition-colors"
        >
          {isPaused ? <Play className="w-5 h-5" /> : <Settings2 className="w-5 h-5" />}
          {isPaused ? t.resume : t.pause}
        </button>
        <button 
          onClick={() => setMode(null)}
          className="p-4 rounded-2xl bg-white border border-zinc-200 hover:bg-zinc-50 transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      {/* Overlays */}
      <AnimatePresence>
        {isGameOver && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-zinc-900/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
            >
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-3xl font-bold mb-2">{t.gameOver}</h2>
              <p className="text-zinc-500 mb-6">{t.gameOverDesc}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-zinc-50 p-4 rounded-2xl">
                  <div className="text-[10px] uppercase font-bold text-zinc-400">{t.score}</div>
                  <div className="text-2xl font-mono font-bold">{score}</div>
                </div>
                <div className="bg-zinc-50 p-4 rounded-2xl">
                  <div className="text-[10px] uppercase font-bold text-zinc-400">{t.bestScore}</div>
                  <div className="text-2xl font-mono font-bold">{highScore}</div>
                </div>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => startGame(mode!)}
                  className="w-full p-4 rounded-2xl bg-zinc-900 text-white font-bold hover:bg-zinc-800 transition-colors"
                >
                  {t.tryAgain}
                </button>
                <button 
                  onClick={() => setMode(null)}
                  className="w-full p-4 rounded-2xl border border-zinc-200 font-bold hover:bg-zinc-50 transition-colors"
                >
                  {t.mainMenu}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {isPaused && !isGameOver && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
            >
              <h2 className="text-3xl font-bold mb-8">{t.paused}</h2>
              <div className="space-y-3">
                <button 
                  onClick={() => setIsPaused(false)}
                  className="w-full p-4 rounded-2xl bg-zinc-900 text-white font-bold hover:bg-zinc-800 transition-colors"
                >
                  {t.resume}
                </button>
                <button 
                  onClick={() => setMode(null)}
                  className="w-full p-4 rounded-2xl border border-zinc-200 font-bold hover:bg-zinc-50 transition-colors"
                >
                  {t.quit}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
