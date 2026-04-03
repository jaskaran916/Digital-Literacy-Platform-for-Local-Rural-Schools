import { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { X, Video, Loader2, AlertCircle } from 'lucide-react';

interface VideoTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleTitle: string;
  moduleType: string;
}

const LOADING_MESSAGES = [
  "Initializing video generation engine...",
  "Analyzing the module content...",
  "Writing the script for your tutorial...",
  "Setting up the virtual cameras...",
  "Rendering the video frames...",
  "Adding some magic dust...",
  "Almost there, finalizing the video...",
  "This can take a few minutes, thanks for your patience!"
];

export default function VideoTutorialModal({ isOpen, onClose, moduleTitle, moduleType }: VideoTutorialModalProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const generateVideo = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      setVideoUrl(null);

      // Check for API key
      // @ts-ignore
      if (window.aistudio && !await window.aistudio.hasSelectedApiKey()) {
        // @ts-ignore
        await window.aistudio.openSelectKey();
      }

      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      if (!apiKey) {
        throw new Error("API key is missing. Please select an API key.");
      }

      const ai = new GoogleGenAI({ apiKey });

      let prompt = `A tutorial video showing how to use an educational app. The module is about ${moduleTitle}.`;
      if (moduleType === 'coding') {
        prompt = `A tutorial video showing a student dragging and dropping colorful coding blocks to move a robot through a maze. Educational, bright, friendly, 3d animation style.`;
      } else if (moduleType === 'safety') {
        prompt = `A tutorial video about internet safety for kids, showing a computer screen with a friendly animated character explaining how to stay safe online. Colorful, educational, 3d animation style.`;
      }

      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      
      if (!downloadLink) {
        throw new Error("Failed to generate video. No URI returned.");
      }

      const response = await fetch(downloadLink, {
        method: 'GET',
        headers: {
          'x-goog-api-key': apiKey,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch the generated video.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);

    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("Requested entity was not found")) {
         setError("API Key error. Please try generating again and ensure you select a valid key.");
         // Reset key selection state if possible, or just prompt again next time
      } else {
         setError(err.message || "An error occurred while generating the video.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
              <Video size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">AI Video Tutorial</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto flex flex-col items-center justify-center min-h-[400px]">
          {!isGenerating && !videoUrl && !error && (
            <div className="text-center max-w-md space-y-6">
              <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Video size={48} className="text-indigo-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">Generate a Custom Tutorial</h3>
              <p className="text-slate-400">
                Need help with <strong>{moduleTitle}</strong>? Our AI can generate a custom video tutorial just for you.
              </p>
              <div className="bg-slate-900/50 p-4 rounded-xl text-sm text-slate-500 border border-slate-700">
                Note: Video generation uses advanced AI models and may take a few minutes to complete.
              </div>
              <button 
                onClick={generateVideo}
                className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
              >
                <Video size={20} />
                Generate Video Now
              </button>
            </div>
          )}

          {isGenerating && (
            <div className="text-center space-y-8 w-full max-w-md">
              <div className="relative w-32 h-32 mx-auto">
                <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Video size={32} className="text-indigo-400 animate-pulse" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white animate-pulse">Generating your tutorial...</h3>
                <p className="text-indigo-400 font-medium h-6 transition-all duration-500">
                  {LOADING_MESSAGES[loadingMessageIndex]}
                </p>
              </div>

              <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full w-1/2 animate-[slide_2s_ease-in-out_infinite_alternate] rounded-full"></div>
              </div>
            </div>
          )}

          {error && (
            <div className="text-center max-w-md space-y-6">
              <div className="w-24 h-24 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={48} className="text-rose-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">Oops! Something went wrong.</h3>
              <p className="text-rose-400 bg-rose-500/10 p-4 rounded-xl border border-rose-500/20">
                {error}
              </p>
              <button 
                onClick={generateVideo}
                className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-all"
              >
                Try Again
              </button>
            </div>
          )}

          {videoUrl && (
            <div className="w-full space-y-6 flex flex-col items-center">
              <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl">
                <video 
                  src={videoUrl} 
                  controls 
                  autoPlay 
                  className="w-full h-full object-contain"
                />
              </div>
              <button 
                onClick={() => {
                  setVideoUrl(null);
                  generateVideo();
                }}
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-all text-sm"
              >
                Generate Another Video
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
