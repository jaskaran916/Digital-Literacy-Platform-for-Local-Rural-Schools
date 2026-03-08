import { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
}

const codingQuestions: Question[] = [
  {
    id: 'c1',
    text: 'What does a "Move Forward" block do?',
    options: ['Turns the robot around', 'Moves the robot one step ahead', 'Makes the robot jump', 'Stops the robot'],
    correctIndex: 1
  },
  {
    id: 'c2',
    text: 'If you want the robot to face right, which block do you use?',
    options: ['Move Forward', 'Turn Left', 'Turn Right', 'Jump'],
    correctIndex: 2
  },
  {
    id: 'c3',
    text: 'What is a sequence in coding?',
    options: ['A random order of steps', 'A list of steps in a specific order', 'A type of robot', 'A secret password'],
    correctIndex: 1
  },
  {
    id: 'c4',
    text: 'Which block would you use to turn the robot to face the opposite direction of "Turn Right"?',
    options: ['Move Forward', 'Turn Left', 'Jump', 'Wait'],
    correctIndex: 1
  },
  {
    id: 'c5',
    text: 'What happens if you put a "Move Forward" block after a "Turn Right" block?',
    options: ['The robot moves up', 'The robot moves down', 'The robot moves left', 'The robot moves right'],
    correctIndex: 1
  }
];

const safetyQuestions: Question[] = [
  {
    id: 's1',
    text: 'What should you do if you receive an email from a stranger asking for your password?',
    options: ['Reply with your password', 'Forward it to your friends', 'Delete it and tell a trusted adult', 'Click the link in the email'],
    correctIndex: 2
  },
  {
    id: 's2',
    text: 'Which of these is a strong password?',
    options: ['password123', '123456', 'MyDogName', 'B!u3B3rry$99'],
    correctIndex: 3
  },
  {
    id: 's3',
    text: 'What is "Phishing"?',
    options: ['A way to catch fish', 'A trick to steal your private information', 'A type of computer game', 'A way to make your computer faster'],
    correctIndex: 1
  },
  {
    id: 's4',
    text: 'Is it safe to share your home address with someone you just met online?',
    options: ['Yes, it is friendly', 'Only if they ask nicely', 'No, keep your private info secret', 'Yes, if they have a nice avatar'],
    correctIndex: 2
  },
  {
    id: 's5',
    text: 'What should you do if someone is being mean to you in an online game?',
    options: ['Be mean back', 'Ignore it and keep playing', 'Block them and tell a parent or teacher', 'Give them your password'],
    correctIndex: 2
  }
];

interface QuizEngineProps {
  type: 'pre' | 'post';
  moduleType: 'coding' | 'safety';
  onComplete: (score: number) => void;
}

export default function QuizEngine({ type, moduleType, onComplete }: QuizEngineProps) {
  const questions = moduleType === 'coding' ? codingQuestions : safetyQuestions;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [score, setScore] = useState(0);

  const currentQuestion = questions[currentIndex];

  const handleCheck = () => {
    if (selectedOption === null) return;
    
    setIsChecking(true);
    
    const isCorrect = selectedOption === currentQuestion.correctIndex;
    if (isCorrect) {
      setScore(s => s + 1);
    }

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(i => i + 1);
        setSelectedOption(null);
        setIsChecking(false);
      } else {
        // Calculate final score as percentage
        const finalScore = Math.round(((score + (isCorrect ? 1 : 0)) / questions.length) * 100);
        onComplete(finalScore);
      }
    }, 1500);
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-3xl bg-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl border border-slate-700 relative overflow-hidden">
        
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-2 bg-slate-700">
          <div 
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${((currentIndex) / questions.length) * 100}%` }}
          />
        </div>

        <div className="mb-8 text-center">
          <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-500/20 text-indigo-400 font-semibold text-sm mb-6 uppercase tracking-wider">
            {type === 'pre' ? 'Pre-Test Challenge' : 'Post-Test Challenge'}
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">
            {currentQuestion.text}
          </h2>
        </div>

        <div className="space-y-4">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedOption === index;
            const isCorrect = index === currentQuestion.correctIndex;
            
            let btnClass = "w-full p-6 text-left text-lg md:text-xl font-medium rounded-2xl border-2 transition-all duration-300 flex items-center justify-between group ";
            
            if (!isChecking) {
              btnClass += isSelected 
                ? "bg-indigo-500/20 border-indigo-500 text-white" 
                : "bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500";
            } else {
              if (isSelected && isCorrect) {
                btnClass += "bg-emerald-500/20 border-emerald-500 text-emerald-400";
              } else if (isSelected && !isCorrect) {
                btnClass += "bg-rose-500/20 border-rose-500 text-rose-400";
              } else if (isCorrect) {
                btnClass += "bg-emerald-500/10 border-emerald-500/50 text-emerald-400/80";
              } else {
                btnClass += "bg-slate-800 border-slate-700 text-slate-500 opacity-50";
              }
            }

            return (
              <button
                key={index}
                onClick={() => !isChecking && setSelectedOption(index)}
                disabled={isChecking}
                className={btnClass}
              >
                <span>{option}</span>
                {isChecking && isSelected && (
                  isCorrect ? <CheckCircle2 className="text-emerald-500" size={28} /> : <XCircle className="text-rose-500" size={28} />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-10 flex justify-end">
          <button
            onClick={handleCheck}
            disabled={selectedOption === null || isChecking}
            className={`px-8 py-4 rounded-2xl font-bold text-xl transition-all ${
              selectedOption !== null && !isChecking
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isChecking ? 'Checking...' : 'Check Answer'}
          </button>
        </div>

      </div>
    </div>
  );
}
