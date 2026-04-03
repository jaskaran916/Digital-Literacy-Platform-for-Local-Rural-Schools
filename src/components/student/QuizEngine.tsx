import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, XCircle, ArrowRight, ArrowLeft, Info } from 'lucide-react';

interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const codingQuestions: Question[] = [
  {
    id: 'c1',
    text: 'What does a "Move Forward" block do?',
    options: ['Turns the robot around', 'Moves the robot one step ahead', 'Makes the robot jump', 'Stops the robot'],
    correctIndex: 1,
    explanation: 'The "Move Forward" block tells the robot to take exactly one step in the direction it is currently facing.'
  },
  {
    id: 'c2',
    text: 'If you want the robot to face right, which block do you use?',
    options: ['Move Forward', 'Turn Left', 'Turn Right', 'Jump'],
    correctIndex: 2,
    explanation: 'The "Turn Right" block rotates the robot 90 degrees to its right.'
  },
  {
    id: 'c3',
    text: 'What is a sequence in coding?',
    options: ['A random order of steps', 'A list of steps in a specific order', 'A type of robot', 'A secret password'],
    correctIndex: 1,
    explanation: 'A sequence is a set of instructions that are executed one after another in a specific order.'
  },
  {
    id: 'c4',
    text: 'Which block would you use to turn the robot to face the opposite direction of "Turn Right"?',
    options: ['Move Forward', 'Turn Left', 'Jump', 'Wait'],
    correctIndex: 1,
    explanation: 'Turning left is the opposite of turning right!'
  },
  {
    id: 'c5',
    text: 'If the robot is facing right, what happens if you put a "Move Forward" block after a "Turn Right" block?',
    options: ['The robot moves up', 'The robot moves down', 'The robot moves left', 'The robot moves right'],
    correctIndex: 1,
    explanation: 'Turning right from facing right makes the robot face down. Moving forward then moves it down.'
  }
];

const safetyQuestions: Question[] = [
  {
    id: 's1',
    text: 'What should you do if you receive an email from a stranger asking for your password?',
    options: ['Reply with your password', 'Forward it to your friends', 'Delete it and tell a trusted adult', 'Click the link in the email'],
    correctIndex: 2,
    explanation: 'Never share your password with strangers. Always tell a trusted adult if someone asks for it.'
  },
  {
    id: 's2',
    text: 'Which of these is a strong password?',
    options: ['password123', '123456', 'MyDogName', 'B!u3B3rry$99'],
    correctIndex: 3,
    explanation: 'A strong password uses a mix of uppercase and lowercase letters, numbers, and special characters.'
  },
  {
    id: 's3',
    text: 'What is "Phishing"?',
    options: ['A way to catch fish', 'A trick to steal your private information', 'A type of computer game', 'A way to make your computer faster'],
    correctIndex: 1,
    explanation: 'Phishing is when scammers try to trick you into giving them your personal information, like passwords.'
  },
  {
    id: 's4',
    text: 'Is it safe to share your home address with someone you just met online?',
    options: ['Yes, it is friendly', 'Only if they ask nicely', 'No, keep your private info secret', 'Yes, if they have a nice avatar'],
    correctIndex: 2,
    explanation: 'You should never share personal information like your home address with people you meet online.'
  },
  {
    id: 's5',
    text: 'What should you do if someone is being mean to you in an online game?',
    options: ['Be mean back', 'Ignore it and keep playing', 'Block them and tell a parent or teacher', 'Give them your password'],
    correctIndex: 2,
    explanation: 'If someone is cyberbullying you, the best thing to do is block them and report it to a trusted adult.'
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
  const [checked, setChecked] = useState<boolean[]>(new Array(questions.length).fill(false));
  const [isSubmitted, setIsSubmitted] = useState(false);

  const currentQuestion = questions[currentIndex];
  const selectedOption = answers[currentIndex];
  const isCurrentChecked = checked[currentIndex];

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
      if (e.key === 'ArrowRight' && isCurrentChecked) {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, isCurrentChecked]);

  const handleOptionSelect = (index: number) => {
    if (isSubmitted || isCurrentChecked) return;
    const newAnswers = [...answers];
    newAnswers[currentIndex] = index;
    setAnswers(newAnswers);
  };

  const handleCheckAnswer = () => {
    if (selectedOption === null) return;
    const newChecked = [...checked];
    newChecked[currentIndex] = true;
    setChecked(newChecked);
  };

  const handleSubmit = () => {
    if (answers.some(a => a === null) || !checked.every(c => c)) return;
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
    <div className="h-full flex flex-col items-center justify-center p-4 md:p-8 overflow-y-auto">
      <div className="w-full max-w-3xl bg-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl border border-slate-700 relative overflow-hidden my-auto">
        
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
            
            if (!isCurrentChecked) {
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
                disabled={isCurrentChecked}
                className={btnClass}
              >
                <span>{option}</span>
                {isCurrentChecked && isSelected && (
                  isCorrect ? <CheckCircle2 className="text-emerald-500" size={28} /> : <XCircle className="text-rose-500" size={28} />
                )}
              </button>
            );
          })}
        </div>

        {isCurrentChecked && (
          <div className={`mt-6 p-4 rounded-xl flex items-start gap-3 ${
            selectedOption === currentQuestion.correctIndex 
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
          }`}>
            <Info className="shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-bold mb-1">
                {selectedOption === currentQuestion.correctIndex ? 'Correct!' : 'Not quite right.'}
              </p>
              <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                {currentQuestion.explanation}
              </p>
            </div>
          </div>
        )}

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
            <ArrowLeft size={20} /> <span className="hidden sm:inline">Move Backward</span>
          </button>
          
          <div className="flex items-center gap-2 sm:gap-3">
            {questions.map((_, idx) => (
              <label key={idx} className="cursor-pointer flex items-center justify-center" aria-label={`Go to question ${idx + 1}`}>
                <input
                  type="radio"
                  name="quiz-progress"
                  className="sr-only"
                  checked={currentIndex === idx}
                  onChange={() => setCurrentIndex(idx)}
                />
                <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                  currentIndex === idx 
                    ? 'border-emerald-500' 
                    : checked[idx] 
                      ? 'border-indigo-500 bg-indigo-500/20' 
                      : 'border-slate-600 bg-slate-800'
                }`}>
                  {currentIndex === idx && (
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full" />
                  )}
                </div>
              </label>
            ))}
          </div>

          {!isCurrentChecked ? (
            <button
              onClick={handleCheckAnswer}
              disabled={selectedOption === null}
              className={`px-6 py-3 rounded-xl font-bold text-lg flex items-center gap-2 transition-all ${
                selectedOption !== null
                  ? 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              Check Answer
            </button>
          ) : currentIndex < questions.length - 1 ? (
            <button
              onClick={handleNext}
              className={`px-6 py-3 rounded-xl font-bold text-lg flex items-center gap-2 transition-all bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20`}
            >
              <span className="hidden sm:inline">Move Forward</span> <ArrowRight size={20} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitted}
              className={`px-6 py-3 rounded-xl font-bold text-lg transition-all ${
                !isSubmitted
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
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
