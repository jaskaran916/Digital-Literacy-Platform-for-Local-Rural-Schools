import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, XCircle, ArrowRight, ArrowLeft } from 'lucide-react';

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
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null));
  const [isSubmitted, setIsSubmitted] = useState(false);

  const currentQuestion = questions[currentIndex];
  const selectedOption = answers[currentIndex];

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
    }
  }, [currentIndex, questions.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
    }
  }, [currentIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  const handleOptionSelect = (index: number) => {
    if (isSubmitted) return;
    const newAnswers = [...answers];
    newAnswers[currentIndex] = index;
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    if (answers.some(a => a === null)) return;
    setIsSubmitted(true);
    let correctCount = 0;
    answers.forEach((ans, idx) => {
      if (ans === questions[idx].correctIndex) correctCount++;
    });
    const finalScore = Math.round((correctCount / questions.length) * 100);
    
    setTimeout(() => {
      onComplete(finalScore);
    }, 2000);
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-3xl bg-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl border border-slate-700 relative overflow-hidden">
        
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-2 bg-slate-700">
          <div 
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
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
            
            if (!isSubmitted) {
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
                onClick={() => handleOptionSelect(index)}
                disabled={isSubmitted}
                className={btnClass}
              >
                <span>{option}</span>
                {isSubmitted && isSelected && (
                  isCorrect ? <CheckCircle2 className="text-emerald-500" size={28} /> : <XCircle className="text-rose-500" size={28} />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-10 flex justify-between items-center">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`px-6 py-3 rounded-xl font-bold text-lg flex items-center gap-2 transition-all ${
              currentIndex > 0
                ? 'bg-slate-700 hover:bg-slate-600 text-white'
                : 'bg-slate-800 text-slate-600 cursor-not-allowed'
            }`}
          >
            <ArrowLeft size={20} /> Move Backward
          </button>
          
          <div className="text-slate-400 font-medium">
            {currentIndex + 1} / {questions.length}
          </div>

          {currentIndex < questions.length - 1 ? (
            <button
              onClick={handleNext}
              className={`px-6 py-3 rounded-xl font-bold text-lg flex items-center gap-2 transition-all bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20`}
            >
              Move Forward <ArrowRight size={20} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={answers.some(a => a === null) || isSubmitted}
              className={`px-6 py-3 rounded-xl font-bold text-lg transition-all ${
                !answers.some(a => a === null) && !isSubmitted
                  ? 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isSubmitted ? 'Submitted!' : 'Submit Quiz'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
