import { Link } from 'react-router-dom';
import { BookOpen, BarChart3 } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-emerald-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl w-full text-center space-y-8">
        <h1 className="text-4xl md:text-5xl font-bold text-emerald-900 tracking-tight">
          Digital Literacy Platform
        </h1>
        <p className="text-lg text-emerald-700 max-w-xl mx-auto">
          Empowering rural schools with offline-first coding and internet safety education.
        </p>
        
        <div className="grid md:grid-cols-2 gap-6 mt-12">
          <Link 
            to="/student"
            className="group relative bg-white p-8 rounded-3xl shadow-sm hover:shadow-md transition-all border border-emerald-100 flex flex-col items-center text-center gap-4"
          >
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
              <BookOpen size={32} />
            </div>
            <h2 className="text-2xl font-semibold text-emerald-900">Student App</h2>
            <p className="text-emerald-600">Learn coding and internet safety through fun, interactive games.</p>
          </Link>

          <Link 
            to="/ngo"
            className="group relative bg-white p-8 rounded-3xl shadow-sm hover:shadow-md transition-all border border-indigo-100 flex flex-col items-center text-center gap-4"
          >
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
              <BarChart3 size={32} />
            </div>
            <h2 className="text-2xl font-semibold text-indigo-900">NGO Dashboard</h2>
            <p className="text-indigo-600">Track student progress, view impact reports, and manage schools.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
