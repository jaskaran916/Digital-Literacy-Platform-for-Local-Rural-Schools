import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Play, RotateCcw, Trash2, Plus, Trophy, AlertCircle } from 'lucide-react';

interface BlockType {
  type: string;
  color: string;
  text: string;
}

const TOOLBOX_BLOCKS: BlockType[] = [
  { type: 'move', color: '#3b82f6', text: 'Move Forward' },
  { type: 'turnR', color: '#8b5cf6', text: 'Turn Right' },
  { type: 'turnL', color: '#ec4899', text: 'Turn Left' },
];

interface WorkspaceBlock {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  text: string;
  isDragging: boolean;
  connectedTo: string | null;
  isExecuting?: boolean;
}

interface LevelConfig {
  target: { x: number; y: number };
  obstacles: { x: number; y: number }[];
  start: { x: number; y: number };
  startDir: number; // FIX: explicit starting direction per level
}

// Direction encoding: 0=right, 1=down, 2=left, 3=up
// Visual rotation: dir * 90 degrees (arrow points right at 0deg, matches dir=0=right)
const LEVELS: Record<string, LevelConfig> = {
  'coding-1': { target: { x: 4, y: 0 }, obstacles: [], start: { x: 0, y: 0 }, startDir: 0 },
  'coding-2': { target: { x: 2, y: 2 }, obstacles: [], start: { x: 0, y: 0 }, startDir: 0 },
  'coding-3': {
    target: { x: 4, y: 4 },
    obstacles: [{ x: 1, y: 4 }, { x: 1, y: 3 }, { x: 1, y: 2 }, { x: 3, y: 0 }, { x: 3, y: 1 }, { x: 3, y: 2 }],
    start: { x: 0, y: 4 },
    startDir: 3, // facing up
  },
  'coding-4': {
    target: { x: 4, y: 0 },
    obstacles: [{ x: 2, y: 2 }, { x: 2, y: 3 }, { x: 2, y: 1 }],
    start: { x: 0, y: 4 },
    startDir: 3,
  },
  'coding-5': {
    target: { x: 4, y: 0 },
    obstacles: [{ x: 1, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 3 }],
    start: { x: 0, y: 4 },
    startDir: 3,
  },
  'coding-6': {
    target: { x: 4, y: 0 },
    obstacles: [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 }],
    start: { x: 0, y: 4 },
    startDir: 3,
  },
  'coding-7': {
    target: { x: 4, y: 4 },
    obstacles: [{ x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 }, { x: 2, y: 4 }],
    start: { x: 0, y: 0 },
    startDir: 0,
  },
  'coding-8': {
    target: { x: 2, y: 2 },
    obstacles: [{ x: 1, y: 1 }, { x: 3, y: 1 }, { x: 1, y: 3 }, { x: 3, y: 3 }],
    start: { x: 0, y: 0 },
    startDir: 0,
  },
  'default': { target: { x: 4, y: 0 }, obstacles: [], start: { x: 0, y: 0 }, startDir: 0 },
};

const drawRoundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  if (ctx.roundRect) {
    ctx.roundRect(x, y, width, height, radius);
  } else {
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
  }
};

export default function CanvasCodeEditor({ onComplete }: { onComplete: () => void }) {
  const { moduleId } = useParams();
  const level = LEVELS[moduleId as string] || LEVELS.default;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [workspaceBlocks, setWorkspaceBlocks] = useState<WorkspaceBlock[]>([
    {
      id: 'start',
      type: 'event',
      x: 50,
      y: 50,
      width: 140,
      height: 48,
      color: '#f59e0b',
      text: 'When Run',
      isDragging: false,
      connectedTo: null,
    },
  ]);

  const workspaceBlocksRef = useRef(workspaceBlocks);
  useEffect(() => {
    workspaceBlocksRef.current = workspaceBlocks;
  }, [workspaceBlocks]);

  // FIX: use startDir from level config
  const [robotPos, setRobotPos] = useState({ ...level.start, dir: level.startDir });
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const runIdRef = useRef(0);
  const [lastSequence, setLastSequence] = useState<string>('');

  // Reset everything when module changes
  useEffect(() => {
    runIdRef.current++;
    setRobotPos({ ...level.start, dir: level.startDir });
    setIsPlaying(false);
    setShowSuccess(false);
    setError(null);
    setLastSequence('');
    setWorkspaceBlocks([
      {
        id: 'start',
        type: 'event',
        x: 50,
        y: 50,
        width: 140,
        height: 48,
        color: '#f59e0b',
        text: 'When Run',
        isDragging: false,
        connectedTo: null,
      },
    ]);
  }, [moduleId]); // eslint-disable-line react-hooks/exhaustive-deps

  const getChain = useCallback((startId: string, allBlocks: WorkspaceBlock[]) => {
    const chain = [startId];
    let currentId = startId;
    const visited = new Set<string>([startId]);
    while (true) {
      const next = allBlocks.find(b => b.connectedTo === currentId);
      if (next && !visited.has(next.id)) {
        chain.push(next.id);
        visited.add(next.id);
        currentId = next.id;
      } else {
        break;
      }
    }
    return chain;
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid background
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 40) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // Draw block shadows and bodies
    workspaceBlocksRef.current.forEach(b => {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      drawRoundRect(ctx, b.x + 4, b.y + 4, b.width, b.height, 12);
      ctx.fill();

      ctx.fillStyle = b.color;
      ctx.beginPath();
      drawRoundRect(ctx, b.x, b.y, b.width, b.height, 12);
      ctx.fill();

      if (b.isExecuting) {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 4;
        ctx.stroke();
      }

      // Top notch (cutout) for non-event blocks
      if (b.type !== 'event') {
        ctx.beginPath();
        ctx.arc(b.x + 30, b.y, 12, 0, Math.PI, false);
        ctx.fillStyle = '#0f172a';
        ctx.fill();
      }

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.text, b.x + b.width / 2, b.y + b.height / 2);

      if (b.isDragging) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.restore();
    });

    // Draw bottom tabs (so they overlap the top notch of connected blocks)
    workspaceBlocksRef.current.forEach(b => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(b.x + 30, b.y + b.height, 12, 0, Math.PI, false);
      ctx.fillStyle = b.color;
      ctx.fill();

      if (b.isExecuting) {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(b.x + 30, b.y + b.height, 12, 0, Math.PI, false);
        ctx.stroke();
      }
      ctx.restore();
    });

    // Snap highlight when dragging
    const blocks = workspaceBlocksRef.current;
    const draggedRoot = blocks.find(
      b => b.isDragging && !blocks.some(parent => parent.id === b.connectedTo && parent.isDragging)
    );

    if (draggedRoot && draggedRoot.type !== 'event') {
      const dragChainIds = getChain(draggedRoot.id, blocks);
      const validTargets = blocks.filter(
        b =>
          !dragChainIds.includes(b.id) &&
          !blocks.some(child => child.connectedTo === b.id && !dragChainIds.includes(child.id))
      );

      let bestTarget = null;
      let minDistance = 80;
      for (const target of validTargets) {
        const snapX = target.x;
        const snapY = target.y + target.height;
        const dist = Math.hypot(draggedRoot.x - snapX, draggedRoot.y - snapY);
        if (dist < minDistance) {
          minDistance = dist;
          bestTarget = target;
        }
      }

      if (bestTarget) {
        ctx.save();
        ctx.fillStyle = 'rgba(251, 191, 36, 0.8)';
        ctx.beginPath();
        drawRoundRect(ctx, bestTarget.x, bestTarget.y + bestTarget.height - 5, bestTarget.width, 10, 5);
        ctx.fill();
        ctx.restore();
      }
    }
  }, [getChain]);

  // Resize canvas and redraw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || 800;
      canvas.height = canvas.parentElement?.clientHeight || 600;
      draw();
    };
    window.addEventListener('resize', resize);
    resize();
    return () => window.removeEventListener('resize', resize);
  }, [draw]);

  // Redraw whenever blocks change
  useEffect(() => {
    draw();
  }, [workspaceBlocks, draw]);

  // ─── Pointer event helpers (unified mouse + touch) ───────────────────────
  const getPointerPos = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }
    return { x: (e as MouseEvent).clientX - rect.left, y: (e as MouseEvent).clientY - rect.top };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let isDragging = false;
    let dragChainIds: string[] = [];
    let offset = { x: 0, y: 0 };

    const onDown = (e: MouseEvent | TouchEvent) => {
      if ('touches' in e) e.preventDefault();
      const { x, y } = getPointerPos(e, canvas);
      const currentBlocks = workspaceBlocksRef.current;

      for (let i = currentBlocks.length - 1; i >= 0; i--) {
        const b = currentBlocks[i];
        if (x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height) {
          isDragging = true;
          dragChainIds = getChain(b.id, currentBlocks);
          offset = { x: x - b.x, y: y - b.y };

          setWorkspaceBlocks(prev =>
            prev.map(block =>
              dragChainIds.includes(block.id)
                ? { ...block, isDragging: true, connectedTo: block.id === b.id ? null : block.connectedTo }
                : block
            )
          );
          break;
        }
      }
    };

    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging || dragChainIds.length === 0) return;
      if ('touches' in e) e.preventDefault();
      const { x, y } = getPointerPos(e, canvas);

      setWorkspaceBlocks(prev => {
        const target = prev.find(b => b.id === dragChainIds[0]);
        if (!target) return prev;
        const dx = x - offset.x - target.x;
        const dy = y - offset.y - target.y;
        return prev.map(b => (dragChainIds.includes(b.id) ? { ...b, x: b.x + dx, y: b.y + dy } : b));
      });
    };

    const onUp = (e: MouseEvent | TouchEvent) => {
      if (!isDragging || dragChainIds.length === 0) return;
      const { x, y } = getPointerPos(e, canvas);

      setWorkspaceBlocks(prev => {
        const targetId = dragChainIds[0];
        const target = prev.find(b => b.id === targetId);
        if (!target) return prev;

        // Delete if dropped outside canvas bounds (into the toolbox delete zone)
        if (x < 0 || y < 0 || x > canvas.width || y > canvas.height) {
          if (target.id !== 'start') {
            return prev.filter(b => !dragChainIds.includes(b.id));
          } else {
            // Clamp the start block back in
            const clampedX = Math.max(0, Math.min(target.x, canvas.width - target.width));
            const clampedY = Math.max(0, Math.min(target.y, canvas.height - target.height));
            const dx = clampedX - target.x;
            const dy = clampedY - target.y;
            return prev.map(b =>
              dragChainIds.includes(b.id) ? { ...b, isDragging: false, x: b.x + dx, y: b.y + dy } : b
            );
          }
        }

        let newBlocks = prev.map(b => (dragChainIds.includes(b.id) ? { ...b, isDragging: false } : b));
        const updatedTarget = newBlocks.find(b => b.id === targetId)!;

        // Attempt snap connection
        if (updatedTarget.type !== 'event') {
          const validTargets = newBlocks.filter(
            b =>
              !dragChainIds.includes(b.id) &&
              !newBlocks.some(child => child.connectedTo === b.id && !dragChainIds.includes(child.id))
          );

          let bestTarget = null;
          let minDistance = 80;
          for (const t of validTargets) {
            const snapX = t.x;
            const snapY = t.y + t.height;
            const dist = Math.hypot(updatedTarget.x - snapX, updatedTarget.y - snapY);
            if (dist < minDistance) {
              minDistance = dist;
              bestTarget = t;
            }
          }

          if (bestTarget) {
            const snapX = bestTarget.x;
            const snapY = bestTarget.y + bestTarget.height;
            const dx = snapX - updatedTarget.x;
            const dy = snapY - updatedTarget.y;
            newBlocks = newBlocks.map(b =>
              dragChainIds.includes(b.id)
                ? { ...b, x: b.x + dx, y: b.y + dy, connectedTo: b.id === targetId ? bestTarget.id : b.connectedTo }
                : b
            );
          }
        }

        return newBlocks;
      });

      isDragging = false;
      dragChainIds = [];
    };

    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('touchstart', onDown as EventListener, { passive: false });
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove as EventListener, { passive: false });
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp as EventListener);

    return () => {
      canvas.removeEventListener('mousedown', onDown);
      canvas.removeEventListener('touchstart', onDown as EventListener);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove as EventListener);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchend', onUp as EventListener);
    };
  }, [getChain]);

  // ─── Run simulation ───────────────────────────────────────────────────────
  const handleRun = useCallback(
    async (blocksToRun?: WorkspaceBlock[]) => {
      const blocks = blocksToRun || workspaceBlocksRef.current;
      setIsPlaying(true);
      setError(null);
      setShowSuccess(false);

      const currentRunId = ++runIdRef.current;

      try {
        // FIX: always reset robot to start+startDir at the beginning of a run
        let currentPos = { ...level.start, dir: level.startDir };
        setRobotPos(currentPos);

        const sequence: { id: string; text: string }[] = [];
        let currentId: string | null = 'start';
        while (currentId) {
          const next = blocks.find(b => b.connectedTo === currentId);
          if (next) {
            sequence.push({ id: next.id, text: next.text });
            currentId = next.id;
          } else {
            currentId = null;
          }
        }

        if (sequence.length === 0) {
          if (!blocksToRun) {
            setError("Drag blocks from the Toolbox and connect them under 'When Run'!");
          }
          setIsPlaying(false);
          return;
        }

        let hitError = false;

        for (const step of sequence) {
          if (currentRunId !== runIdRef.current) return;

          setWorkspaceBlocks(prev => prev.map(b => ({ ...b, isExecuting: b.id === step.id })));

          let nx = currentPos.x;
          let ny = currentPos.y;
          let ndir = currentPos.dir;

          // FIX: direction math — 0=right, 1=down, 2=left, 3=up
          if (step.text === 'Move Forward') {
            if (currentPos.dir === 0) nx += 1;       // right
            else if (currentPos.dir === 1) ny += 1;  // down
            else if (currentPos.dir === 2) nx -= 1;  // left
            else if (currentPos.dir === 3) ny -= 1;  // up
          } else if (step.text === 'Turn Right') {
            ndir = (currentPos.dir + 1) % 4;
          } else if (step.text === 'Turn Left') {
            ndir = (currentPos.dir + 3) % 4;
          }

          // Bounds check
          if (nx < 0 || nx > 4 || ny < 0 || ny > 4) {
            setError('Ouch! You hit a wall!');
            hitError = true;
            break;
          }

          // Obstacle check
          if (level.obstacles.some(o => o.x === nx && o.y === ny)) {
            setError('Ouch! You hit an obstacle!');
            hitError = true;
            break;
          }

          currentPos = { x: nx, y: ny, dir: ndir };
          setRobotPos({ ...currentPos });

          await new Promise(resolve => setTimeout(resolve, 600));
        }

        if (currentRunId !== runIdRef.current) return;

        setWorkspaceBlocks(prev => prev.map(b => ({ ...b, isExecuting: false })));

        if (!hitError) {
          if (currentPos.x === level.target.x && currentPos.y === level.target.y) {
            setShowSuccess(true);
          } else {
            setError('Not quite there yet! Try again.');
          }
        }
      } catch (err) {
        console.error(err);
        setError('An error occurred during simulation.');
      } finally {
        if (currentRunId === runIdRef.current) {
          setIsPlaying(false);
        }
      }
    },
    [level]
  );

  // Auto-run when the connected sequence changes (not while dragging)
  useEffect(() => {
    const isDragging = workspaceBlocks.some(b => b.isDragging);
    if (isDragging) return;

    const sequence: string[] = [];
    let currentId: string | null = 'start';
    while (currentId) {
      const next = workspaceBlocks.find(b => b.connectedTo === currentId);
      if (next) {
        sequence.push(next.id);
        currentId = next.id;
      } else {
        currentId = null;
      }
    }

    const seqStr = sequence.join(',');
    if (seqStr === lastSequence) return;
    setLastSequence(seqStr);

    if (sequence.length > 0) {
      handleRun(workspaceBlocks);
    } else {
      // Nothing connected — reset robot position quietly
      runIdRef.current++;
      setRobotPos({ ...level.start, dir: level.startDir });
      setIsPlaying(false);
      setShowSuccess(false);
      setError(null);
      setWorkspaceBlocks(prev => prev.map(b => ({ ...b, isExecuting: false })));
    }
  }, [workspaceBlocks, lastSequence, handleRun, level]);

  const handleReset = () => {
    runIdRef.current++;
    setRobotPos({ ...level.start, dir: level.startDir });
    setIsPlaying(false);
    setShowSuccess(false);
    setError(null);
    setLastSequence('');
    setWorkspaceBlocks(prev =>
      prev
        .filter(b => b.id === 'start') // remove all non-start blocks
        .map(b => ({ ...b, isExecuting: false }))
    );
  };

  function addFromToolbox(type: BlockType) {
    const newId = `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setWorkspaceBlocks(prev => [
      ...prev,
      {
        id: newId,
        type: type.type,
        x: 50,
        y: 150 + prev.length * 10,
        width: 140,
        height: 48,
        color: type.color,
        text: type.text,
        isDragging: false,
        connectedTo: null,
      },
    ]);
  }

  // ─── Robot visual: direction → CSS rotation ───────────────────────────────
  // dir 0=right → 0deg, 1=down → 90deg, 2=left → 180deg, 3=up → 270deg
  const robotRotation = robotPos.dir * 90;

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full bg-slate-900 overflow-hidden relative">
      {showSuccess && (
        <div className="absolute inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center">
          <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
            <Trophy size={48} className="text-white" />
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">Mission Accomplished!</h2>
          <p className="text-xl text-slate-400 mb-6 max-w-md">
            Great job! You navigated the robot to the target using your code.
          </p>
          <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-2xl px-6 py-3 mb-8 flex items-center gap-3">
            <span className="text-2xl font-bold text-emerald-400">+50 XP</span>
            <span className="text-emerald-400/80 font-medium">Level Completed!</span>
          </div>
          <button
            onClick={onComplete}
            className="px-10 py-4 bg-emerald-500 hover:bg-emerald-600 text-white text-xl font-bold rounded-2xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            Continue to Next Step
          </button>
        </div>
      )}

      {/* Toolbox */}
      <div className="w-full md:w-64 bg-slate-800 border-r border-slate-700 flex flex-col p-4 space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Toolbox</h3>
        <div className="space-y-3">
          {TOOLBOX_BLOCKS.map((tb, i) => (
            <button
              key={i}
              onClick={() => addFromToolbox(tb)}
              className="w-full p-4 rounded-xl flex items-center justify-between group transition-all hover:scale-105 active:scale-95 shadow-lg"
              style={{ backgroundColor: tb.color }}
            >
              <span className="font-bold text-white">{tb.text}</span>
              <Plus size={20} className="text-white/50 group-hover:text-white" />
            </button>
          ))}
        </div>
        <div className="mt-auto pt-8">
          <div className="p-6 border-2 border-dashed border-slate-700 rounded-2xl flex flex-col items-center justify-center text-slate-500 gap-2">
            <Trash2 size={32} />
            <span className="text-xs font-medium text-center">Drag outside canvas to delete</span>
          </div>
        </div>
      </div>

      {/* Simulation panel */}
      <div className="w-full md:w-80 bg-slate-800 border-r border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
          <h3 className="font-semibold text-slate-300">Simulation</h3>
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition-colors"
              title="Reset"
            >
              <RotateCcw size={18} />
            </button>
            <button
              onClick={() => handleRun()}
              disabled={isPlaying}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-emerald-500/20"
            >
              <Play size={18} />
              Run
            </button>
          </div>
        </div>

        <div className="flex-1 relative bg-slate-800 flex items-center justify-center p-6">
          <div className="w-full aspect-square max-w-[280px] bg-slate-700 rounded-2xl border-4 border-slate-600 relative overflow-hidden shadow-inner">
            {/* Target */}
            <div
              className="absolute w-[18%] h-[18%] bg-rose-500/20 border-2 border-rose-500 rounded-full flex items-center justify-center animate-pulse z-0"
              style={{ left: `${level.target.x * 20 + 1}%`, top: `${level.target.y * 20 + 1}%` }}
            >
              <div className="w-[50%] h-[50%] bg-rose-500 rounded-full shadow-[0_0_15px_rgba(244,63,94,0.6)]" />
            </div>

            {/* Obstacles */}
            {level.obstacles.map((o, i) => (
              <div
                key={i}
                className="absolute w-[18%] h-[18%] bg-slate-900 border-2 border-slate-800 rounded-lg flex items-center justify-center z-0"
                style={{ left: `${o.x * 20 + 1}%`, top: `${o.y * 20 + 1}%` }}
              >
                <AlertCircle size={16} className="text-slate-700" />
              </div>
            ))}

            {/* Robot — FIX: rotation now correctly maps direction to visual angle */}
            <div
              className="absolute w-[18%] h-[18%] bg-blue-500 rounded-xl border-2 border-blue-400 flex items-center justify-center shadow-lg transition-all duration-500 z-10"
              style={{
                left: `${robotPos.x * 20 + 1}%`,
                top: `${robotPos.y * 20 + 1}%`,
                transform: `rotate(${robotRotation}deg)`,
              }}
            >
              {/* Arrow pointing RIGHT at 0deg, matching dir=0=right */}
              <div className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[12px] border-l-white" />
            </div>

            {/* Grid overlay */}
            <div className="absolute inset-0 grid grid-cols-5 grid-rows-5 pointer-events-none">
              {Array.from({ length: 25 }).map((_, i) => (
                <div key={i} className="border border-slate-600/30" />
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/20 text-rose-400 text-sm text-center font-medium">{error}</div>
        )}
        <div className="p-4 bg-slate-900/30 text-xs text-slate-500 text-center italic">
          Goal: Reach the red target!
        </div>
      </div>

      {/* Block workspace canvas */}
      <div className="flex-1 relative bg-slate-900">
        <canvas ref={canvasRef} className="w-full h-full cursor-grab active:cursor-grabbing touch-none" />
        <div className="absolute bottom-4 right-4 bg-slate-800/80 backdrop-blur px-4 py-2 rounded-lg border border-slate-700 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
          Workspace
        </div>
      </div>
    </div>
  );
}
