import { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw } from 'lucide-react';

interface Block {
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
}

export default function CanvasCodeEditor({ onComplete }: { onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [blocks, setBlocks] = useState<Block[]>([
    { id: 'start', type: 'event', x: 50, y: 50, width: 120, height: 40, color: '#f59e0b', text: 'When Run', isDragging: false, connectedTo: null },
    { id: 'move1', type: 'action', x: 250, y: 50, width: 120, height: 40, color: '#3b82f6', text: 'Move Forward', isDragging: false, connectedTo: null },
    { id: 'turn1', type: 'action', x: 250, y: 120, width: 120, height: 40, color: '#3b82f6', text: 'Turn Right', isDragging: false, connectedTo: null },
  ]);
  
  const [robotPos, setRobotPos] = useState({ x: 0, y: 0, dir: 0 }); // dir: 0=right, 1=down, 2=left, 3=up
  const [isPlaying, setIsPlaying] = useState(false);

  // Canvas drawing logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle resize
    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || 800;
      canvas.height = canvas.parentElement?.clientHeight || 600;
      draw();
    };
    window.addEventListener('resize', resize);
    resize();

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw grid
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      for(let i = 0; i < canvas.width; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
      }
      for(let i = 0; i < canvas.height; i += 40) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
      }

      // Draw blocks
      blocks.forEach(b => {
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.roundRect(b.x + 4, b.y + 4, b.width, b.height, 8);
        ctx.fill();

        // Block body
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.roundRect(b.x, b.y, b.width, b.height, 8);
        ctx.fill();

        // Notch (top)
        if (b.type !== 'event') {
          ctx.beginPath();
          ctx.arc(b.x + 20, b.y, 8, 0, Math.PI, false);
          ctx.fillStyle = '#1e293b'; // Background color to simulate cutout
          ctx.fill();
        }

        // Bump (bottom)
        ctx.beginPath();
        ctx.arc(b.x + 20, b.y + b.height, 8, 0, Math.PI, false);
        ctx.fillStyle = b.color;
        ctx.fill();

        // Text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(b.text, b.x + b.width / 2, b.y + b.height / 2);
        
        // Highlight if dragging
        if (b.isDragging) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });
    }

    draw();
    return () => window.removeEventListener('resize', resize);
  }, [blocks]);

  // Interaction logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let isDragging = false;
    let dragTargetId: string | null = null;
    let startX = 0;
    let startY = 0;

    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Find clicked block (reverse order for z-index)
      for (let i = blocks.length - 1; i >= 0; i--) {
        const b = blocks[i];
        if (x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height) {
          isDragging = true;
          dragTargetId = b.id;
          startX = x - b.x;
          startY = y - b.y;
          
          setBlocks(prev => prev.map(block => 
            block.id === b.id ? { ...block, isDragging: true } : block
          ));
          break;
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragTargetId) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setBlocks(prev => prev.map(b => {
        if (b.id === dragTargetId) {
          return { ...b, x: x - startX, y: y - startY };
        }
        return b;
      }));
    };

    const handleMouseUp = () => {
      if (!isDragging) return;
      isDragging = false;
      
      setBlocks(prev => {
        const newBlocks = [...prev];
        const target = newBlocks.find(b => b.id === dragTargetId);
        if (!target) return prev;
        
        target.isDragging = false;

        // Snap logic
        if (target.type !== 'event') {
          target.connectedTo = null;
          for (const other of newBlocks) {
            if (other.id !== target.id) {
              // Check if target is close to the bottom of 'other'
              const snapX = other.x;
              const snapY = other.y + other.height;
              
              if (Math.abs(target.x - snapX) < 30 && Math.abs(target.y - snapY) < 30) {
                target.x = snapX;
                target.y = snapY;
                target.connectedTo = other.id;
                break;
              }
            }
          }
        }
        
        return newBlocks;
      });
      
      dragTargetId = null;
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [blocks]);

  const handleRun = () => {
    setIsPlaying(true);
    // Simple interpreter
    let currentId: string | null = 'start';
    const sequence: string[] = [];
    
    // Find sequence
    while(currentId) {
      const next = blocks.find(b => b.connectedTo === currentId);
      if (next) {
        sequence.push(next.id);
        currentId = next.id;
      } else {
        currentId = null;
      }
    }

    // Execute sequence (mock animation)
    let step = 0;
    const interval = setInterval(() => {
      if (step >= sequence.length) {
        clearInterval(interval);
        setIsPlaying(false);
        // If sequence is correct (mock condition), complete
        if (sequence.length >= 2) {
          setTimeout(() => onComplete(), 1000);
        }
        return;
      }
      
      const action = blocks.find(b => b.id === sequence[step])?.text;
      if (action === 'Move Forward') {
        setRobotPos(p => ({ ...p, x: p.x + 1 }));
      } else if (action === 'Turn Right') {
        setRobotPos(p => ({ ...p, dir: (p.dir + 1) % 4 }));
      }
      
      step++;
    }, 500);
  };

  const handleReset = () => {
    setRobotPos({ x: 0, y: 0, dir: 0 });
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full">
      {/* Simulation View */}
      <div className="w-full md:w-1/3 bg-slate-800 border-r border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
          <h3 className="font-semibold text-slate-300">Simulation</h3>
          <div className="flex gap-2">
            <button onClick={handleReset} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition-colors">
              <RotateCcw size={18} />
            </button>
            <button 
              onClick={handleRun} 
              disabled={isPlaying}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-lg flex items-center gap-2 transition-colors"
            >
              <Play size={18} />
              Run
            </button>
          </div>
        </div>
        <div className="flex-1 relative bg-slate-800 flex items-center justify-center p-8">
          {/* Mock Grid for Robot */}
          <div className="w-full aspect-square max-w-sm bg-slate-700 rounded-xl border-2 border-slate-600 grid grid-cols-5 grid-rows-5 relative overflow-hidden">
             {/* Target */}
             <div className="absolute right-4 top-4 w-12 h-12 bg-rose-500/20 border-2 border-rose-500 rounded-full flex items-center justify-center animate-pulse">
                <div className="w-4 h-4 bg-rose-500 rounded-full" />
             </div>
             
             {/* Robot */}
             <div 
                className="absolute w-12 h-12 bg-blue-500 rounded-xl border-2 border-blue-400 flex items-center justify-center shadow-lg transition-all duration-500"
                style={{ 
                  left: `${robotPos.x * 20 + 10}%`, 
                  top: `${robotPos.y * 20 + 10}%`,
                  transform: `rotate(${robotPos.dir * 90}deg)`
                }}
             >
                <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[12px] border-b-white rotate-90 ml-2" />
             </div>
          </div>
        </div>
      </div>

      {/* Canvas Workspace */}
      <div className="flex-1 relative bg-slate-900 overflow-hidden">
        <div className="absolute top-4 left-4 z-10 bg-slate-800/80 backdrop-blur px-4 py-2 rounded-lg border border-slate-700 text-sm text-slate-400">
          Drag blocks to connect them. Attach actions to the "When Run" block.
        </div>
        <canvas 
          ref={canvasRef} 
          className="w-full h-full cursor-grab active:cursor-grabbing"
        />
      </div>
    </div>
  );
}
