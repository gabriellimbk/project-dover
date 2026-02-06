
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from "@supabase/supabase-js";
import { 
  Trees, 
  Building2, 
  Users, 
  Leaf, 
  Landmark,
  Scale,
  BrainCircuit,
  ChevronRight, 
  ChevronLeft, 
  Lightbulb, 
  CheckCircle2, 
  Info,
  Table as TableIcon,
  BarChart3,
  HelpCircle,
  Award,
  BookOpen,
  Map as MapIcon,
  CheckSquare,
  Newspaper,
  Save,
  Printer,
  Link as LinkIcon,
  Upload,
  FileText,
  X,
  Maximize2,
  ZoomIn,
  TrainFront,
  GraduationCap,
  Lock,
  ExternalLink,
  Target,
  Layers,
  Settings,
  Trash2,
  Eye,
  User,
  ChevronDown,
  AlertCircle
} from 'lucide-react';

// --- Types ---

type Section = 'Intro' | 'PartA' | 'PartB' | 'PartC' | 'Reflection';
type ViewMode = 'student' | 'teacher';

interface AllocationRow {
  use: string;
  percentage: number;
  reason: string;
}

interface Submission {
  id: string;
  timestamp: number;
  userInfo: { name: string; tutor: string };
  groupRole: string;
  partAResponse: string;
  allocation: AllocationRow[];
  partC: {
    aims: string;
    benefits: string;
    costs: string;
    decisionRule: string;
    evaluate: string;
  };
  opportunityCost: { chooseMore: string; giveUp: string; explain: string };
  checklist: Record<string, boolean>;
  foodForThought: Record<string, string>;
}

const INITIAL_ALLOCATION: AllocationRow[] = [
  { use: 'Housing and civic infrastructure (e.g. Schools, playgrounds)', percentage: 0, reason: '' },
  { use: 'Commercial and industrial infrastructure (e.g. Shopping centres, semiconductor manufacturing)', percentage: 0, reason: '' },
  { use: 'Conservation', percentage: 100, reason: '' },
];

const TUTORS = [
  "Ms Ang Wei Xuan",
  "Ms Fiona Lio Su-Yin",
  "Mr Lawrence Sunderaj",
  "Mr Lee Shing Shyan",
  "Mr Neo Chee Tiong",
  "Mr Ngoh Siyuan",
  "Ms Tan Lee Hui",
  "Mr Li Kelun",
  "Mr Justin Cheong"
];

// --- Stakeholder Data ---

const STAKEHOLDER_BRIEFS: Record<string, { 
  concerns: string[], 
  goal: string, 
  readings: { title: string, url: string }[] 
}> = {
  'Members of the public': {
    concerns: ['Rising cost-of-living including housing', 'Connectivity and transport networks', 'Economic growth and employment opportunities'],
    goal: 'Maximize self-interest and persuade the government to prioritize bread-and-butter issues.',
    readings: [
      { title: 'The Big Read: As high costs bite...', url: 'https://www.channelnewsasia.com/today/big-read/big-read-housing-high-costs-parents-age-singles-married-couples-fly-coop-4622656' },
      { title: 'Forum: Housing a priority amid land constraints', url: 'https://www.straitstimes.com/opinion/forum/forum-housing-a-priority-amid-land-constraints' }
    ]
  },
  'Businesses': {
    concerns: ['Strategically close to Science parks and universities', 'Limited retail space leading to high rentals', 'Profitable opportunity in light industrial areas'],
    goal: 'Argue for commercial transformation to boost economic vitality and profitability.',
    readings: [
      { title: 'Science Park vacancy hits 20%...', url: 'https://sbr.com.sg/commercial-property/news/science-park-vacancy-hits-20-rents-jump-57' },
      { title: 'Heartland Rents Surging...', url: 'https://propertynoob.com/blog/2025/09/01/heartland-rents-surging-f-b-tenants-face-30-hikes-as-shophouse-investors-pile-in' }
    ]
  },
  'Residents in Dover area': {
    concerns: ['Enjoyment of the natural environment in the neighborhood', 'Need for more local amenities/restaurants', 'Unintended consequences: erosion of exclusiveness due to population density'],
    goal: 'Protect the exclusiveness of your neighborhood while gaining some amenities.',
    readings: [
      { title: 'Commentary on NIMBY sentiments', url: 'https://www.todayonline.com/commentary/commentary-not-my-backyard-when-some-groups-can-protest-more-loudly-most-vulnerable-ones-suffer-2349421' },
      { title: 'Residents tell how they live with wild boars/monkeys', url: 'https://www.channelnewsasia.com/singapore/some-residents-in-thomson-tell-how-they-live-brutish-wild-boars-and-hungry-monkeys-5649991' }
    ]
  },
  'Environmentalists': {
    concerns: ['Biodiversity and climate change', 'Irreversible damage to natural habitat', 'Possible extinction of endangered native species', 'Impact on future generations'],
    goal: 'Prioritize long-term environmental sustainability over short-term economic gains.',
    readings: [
      { title: 'Kampung Histories of Dover Forest', url: 'https://www.juncture-digital.org/Digital-Scholarship-NUS-Libraries/biodiversitystories/Dover%20Forest' },
      { title: 'Dover Forest debate biodiversity', url: 'https://www.channelnewsasia.com/singapore/nature-development-dover-forest-urbanisation-balance-425471' }
    ]
  }
};

// Local map infographic asset
const MAP_URL = new URL('./Dover image.jpeg', import.meta.url).toString();
const TEACHER_EMAIL_DOMAIN = "@ri.edu.sg";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// --- Sub-components ---

const ProgressBar = ({ current, total }: { current: number; total: number }) => (
  <div className="flex gap-1 w-full">
    {Array.from({ length: total }).map((_, i) => (
      <div 
        key={i} 
        className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= current ? 'bg-indigo-600' : 'bg-slate-200'}`} 
      />
    ))}
  </div>
);

// --- Main App ---

const DoverForestApp = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('student');
  const [activeSection, setActiveSection] = useState<Section>('Intro');
  
  // Student States
  const [userInfo, setUserInfo] = useState({ name: '', tutor: '' });
  const [groupRole, setGroupRole] = useState('');
  const [partAResponse, setPartAResponse] = useState('');
  const [allocation, setAllocation] = useState<AllocationRow[]>(INITIAL_ALLOCATION);
  const [partC, setPartC] = useState({
    aims: '',
    benefits: '',
    costs: '',
    decisionRule: '',
    evaluate: ''
  });
  const [opportunityCost, setOpportunityCost] = useState({ chooseMore: '', giveUp: '', explain: '' });
  const [checklist, setChecklist] = useState({ scarcity: false, choice: false, opportunityCost: false, framework: false, decision: false });
  const [foodForThought, setFoodForThought] = useState({ 
    sourceLink: '', 
    sourceFileName: '',
    resource: '', 
    choices: '', 
    stakeholders: '', 
    cost: '', 
    winners: '' 
  });
  
  // App Logic States
  const [guidance, setGuidance] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showBriefingLibrary, setShowBriefingLibrary] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [imageError, setImageError] = useState(false);
  const [teacherAuthed, setTeacherAuthed] = useState(false);
  const [showTeacherAuth, setShowTeacherAuth] = useState(false);
  const [teacherEmail, setTeacherEmail] = useState("");
  const [teacherOtp, setTeacherOtp] = useState("");
  const [teacherAuthStep, setTeacherAuthStep] = useState<'email' | 'otp'>('email');
  const [teacherAuthLoading, setTeacherAuthLoading] = useState(false);
  const [teacherAuthError, setTeacherAuthError] = useState("");
  const [selectedTutorFilter, setSelectedTutorFilter] = useState("All");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalPercentage = allocation.reduce((acc, curr) => acc + curr.percentage, 0);
  const isReadyForPartC = totalPercentage === 100 && !!groupRole;

  // Persistence for teacher view (using localStorage for this demo)
  useEffect(() => {
    const saved = localStorage.getItem('dover_submissions');
    if (saved) setSubmissions(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (!supabase) return;
    let isActive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!isActive) return;
      const email = data.session?.user?.email || "";
      setTeacherAuthed(email.endsWith(TEACHER_EMAIL_DOMAIN));
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const email = session?.user?.email || "";
      setTeacherAuthed(email.endsWith(TEACHER_EMAIL_DOMAIN));
    });
    return () => {
      isActive = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const openTeacherAuth = () => {
    setTeacherAuthError("");
    setTeacherAuthStep("email");
    setShowTeacherAuth(true);
  };

  const sendTeacherOtp = async () => {
    if (!supabase) {
      setTeacherAuthError("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
      return;
    }
    const email = teacherEmail.trim().toLowerCase();
    if (!email.endsWith(TEACHER_EMAIL_DOMAIN)) {
      setTeacherAuthError(`Email must end with ${TEACHER_EMAIL_DOMAIN}.`);
      return;
    }
    setTeacherAuthLoading(true);
    setTeacherAuthError("");
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      setTeacherAuthStep("otp");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setTeacherAuthError(message);
    } finally {
      setTeacherAuthLoading(false);
    }
  };

  const verifyTeacherOtp = async () => {
    if (!supabase) {
      setTeacherAuthError("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
      return;
    }
    const email = teacherEmail.trim().toLowerCase();
    const token = teacherOtp.trim();
    if (token.length !== 6) {
      setTeacherAuthError("Enter the 6 digit OTP.");
      return;
    }
    setTeacherAuthLoading(true);
    setTeacherAuthError("");
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "email"
      });
      if (error) throw error;
      setShowTeacherAuth(false);
      setViewMode("teacher");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setTeacherAuthError(message);
    } finally {
      setTeacherAuthLoading(false);
    }
  };

  const saveSubmission = () => {
    if (!userInfo.name || !userInfo.tutor) {
      alert("Please complete your profile (Name and Tutor) before submitting.");
      return;
    }
    const newSubmission: Submission = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      userInfo,
      groupRole,
      partAResponse,
      allocation,
      partC,
      opportunityCost,
      checklist,
      foodForThought
    };
    const updated = [newSubmission, ...submissions];
    setSubmissions(updated);
    localStorage.setItem('dover_submissions', JSON.stringify(updated));
    alert("Response submitted successfully!");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFoodForThought(prev => ({ ...prev, sourceFileName: file.name }));
    }
  };

  const deleteSubmission = (id: string) => {
    const updated = submissions.filter(s => s.id !== id);
    setSubmissions(updated);
    localStorage.setItem('dover_submissions', JSON.stringify(updated));
    if (selectedSubmission?.id === id) setSelectedSubmission(null);
  };

  const clearAllSubmissions = () => {
    if (confirm("Are you sure you want to delete ALL responses?")) {
      setSubmissions([]);
      localStorage.removeItem('dover_submissions');
      setSelectedSubmission(null);
    }
  };

  const getAIGuidance = async (fieldKey: string, promptContext: string, studentAnswer: string) => {
    if (!studentAnswer || studentAnswer.trim().length < 5) {
      alert("Please write your answer before requesting feedback!");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fieldKey, promptContext, studentAnswer })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Tutor request failed.");
      }
      setGuidance(prev => ({ ...prev, [fieldKey]: data.text || "Try expanding on your reasoning." }));
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : String(error);
      alert(`The tutor is currently unavailable. ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateAllocation = (index: number, field: keyof AllocationRow, value: any) => {
    const newAlloc = [...allocation];
    if (field === 'percentage' && (index === 0 || index === 1)) {
      let val = parseInt(value) || 0;
      if (val < 0) val = 0;
      if (val > 100) val = 100;
      newAlloc[index] = { ...newAlloc[index], percentage: val };
      const otherManualIndex = index === 0 ? 1 : 0;
      if ((newAlloc[0].percentage + newAlloc[1].percentage) > 100) {
        newAlloc[index].percentage = 100 - newAlloc[otherManualIndex].percentage;
      }
      newAlloc[2].percentage = 100 - (newAlloc[0].percentage + newAlloc[1].percentage);
    } else {
      newAlloc[index] = { ...newAlloc[index], [field]: value };
    }
    setAllocation(newAlloc);
  };

  // --- Render Functions: Teacher Console ---

  const filteredSubmissions = useMemo(() => {
    if (selectedTutorFilter === "All") return submissions;
    return submissions.filter(s => s.userInfo.tutor === selectedTutorFilter);
  }, [submissions, selectedTutorFilter]);

  const renderTeacherConsole = () => (
    <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500">
      {/* Sidebar: Student List */}
      <div className="w-full lg:w-80 space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-slate-800 flex items-center gap-2"><Users className="w-5 h-5 text-indigo-600" /> Responses</h3>
              <button onClick={clearAllSubmissions} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
            </div>
            <div className="mb-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Filter by Tutor</label>
              <select
                value={selectedTutorFilter}
                onChange={e => setSelectedTutorFilter(e.target.value)}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600"
              >
                <option value="All">All Tutors</option>
                {TUTORS.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredSubmissions.length === 0 ? (
                <p className="text-xs text-slate-400 font-bold text-center py-8 italic">No submissions yet.</p>
              ) : (
                filteredSubmissions.map(sub => (
                  <button 
                    key={sub.id} 
                    onClick={() => setSelectedSubmission(sub)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex justify-between items-center group ${selectedSubmission?.id === sub.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-white hover:border-indigo-300'}`}
                  >
                  <div>
                    <p className="font-bold text-sm truncate max-w-[140px]">{sub.userInfo.name || 'Anonymous'}</p>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${selectedSubmission?.id === sub.id ? 'text-indigo-200' : 'text-slate-400'}`}>{sub.userInfo.tutor || 'No Tutor'}</p>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform ${selectedSubmission?.id === sub.id ? 'translate-x-1' : 'opacity-0 group-hover:opacity-100'}`} />
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Content: Detailed Report */}
      <div className="flex-1">
        {selectedSubmission ? (
          <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-12 animate-in slide-in-from-right-4 duration-500">
            <div className="flex justify-between items-start border-b border-slate-100 pb-8">
              <div>
                <h2 className="text-3xl font-black text-slate-900">{selectedSubmission.userInfo.name}</h2>
                <div className="flex gap-4 mt-2">
                  <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-black uppercase tracking-widest">Tutor: {selectedSubmission.userInfo.tutor || 'N/A'}</span>
                  <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-black uppercase tracking-widest">Role: {selectedSubmission.groupRole || 'N/A'}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => deleteSubmission(selectedSubmission.id)} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-500 rounded-xl font-bold text-xs hover:bg-red-100 transition-all"><Trash2 className="w-4 h-4" /> Delete</button>
                <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-black transition-all"><Printer className="w-4 h-4" /> Print Report</button>
              </div>
            </div>

            {/* Part A Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><HelpCircle className="w-5 h-5 text-amber-500" /> Part A: Scarcity Response</h3>
              <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                {selectedSubmission.partAResponse || 'No response provided.'}
              </div>
            </div>

            {/* Part B Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-indigo-500" /> Part B: Land Allocation</h3>
              <div className="overflow-hidden border border-slate-100 rounded-3xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest border-b">Land Use</th>
                      <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest border-b w-32 text-center">Allocation</th>
                      <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest border-b">Reasoning</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSubmission.allocation.map((row, idx) => (
                      <tr key={idx} className="border-b border-slate-50">
                        <td className="p-6 text-xs font-bold text-slate-700 max-w-xs">{row.use}</td>
                        <td className="p-6 text-center text-sm font-black text-indigo-600">{row.percentage}%</td>
                        <td className="p-6 text-xs text-slate-500 italic leading-relaxed">{row.reason || 'None provided.'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Part C Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><Landmark className="w-5 h-5 text-indigo-600" /> Part C: Government Perspective</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(selectedSubmission.partC).map(([key, val]) => (
                  <div key={key} className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{key.toUpperCase()}</h4>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed">{val || 'N/A'}</p>
                  </div>
                ))}
              </div>
              <div className="p-6 bg-slate-900 text-white rounded-3xl mt-4">
                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Opportunity Cost Explain</h4>
                <p className="text-sm font-medium leading-relaxed">
                  <strong>Choice:</strong> {selectedSubmission.opportunityCost.chooseMore || 'N/A'}<br/>
                  <strong>Foregone:</strong> {selectedSubmission.opportunityCost.giveUp || 'N/A'}<br/><br/>
                  {selectedSubmission.opportunityCost.explain || 'No explanation.'}
                </p>
              </div>
            </div>

            {/* Reflection Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><BrainCircuit className="w-5 h-5 text-emerald-500" /> Reflection: Food for Thought</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['resource', 'choices', 'stakeholders', 'cost', 'winners'].map(key => (
                  <div key={key} className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{key.replace('_', ' ').toUpperCase()}</h4>
                    <p className="text-xs text-slate-700 font-medium">{selectedSubmission.foodForThought[key] || 'N/A'}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200 text-center space-y-6">
            <div className="p-8 bg-slate-50 rounded-full text-slate-200"><Eye className="w-16 h-16" /></div>
            <div>
              <h3 className="text-xl font-black text-slate-400">Select a submission to begin</h3>
              <p className="text-sm text-slate-400 font-medium mt-1">Grouped student responses will appear here for debriefing.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // --- Render Functions: Student Intro ---

  const renderIntro = () => (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {showMapModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4 md:p-12 transition-all">
          <div className="bg-white rounded-[2.5rem] w-full max-w-5xl max-h-full overflow-hidden flex flex-col relative shadow-2xl">
            <button onClick={() => setShowMapModal(false)} className="absolute top-6 right-6 p-3 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-600 transition-colors z-10"><X className="w-6 h-6" /></button>
            <div className="p-8 border-b border-slate-100 bg-white">
              <h3 className="text-xl font-black text-slate-800">Dover Forest Area Map</h3>
              <p className="text-sm text-slate-400 font-medium italic uppercase tracking-wider">Geographical Context Reference • Source: The Straits Times</p>
            </div>
            <div className="flex-1 overflow-auto bg-slate-100 p-6 flex items-center justify-center">
              <img src={MAP_URL} referrerPolicy="no-referrer" className="max-w-full h-auto rounded-xl shadow-lg border border-slate-300" alt="Dover Forest Map" />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">Student Name</label>
            <input type="text" value={userInfo.name} onChange={e => setUserInfo({...userInfo, name: e.target.value})} className="w-full border-b-2 border-slate-100 focus:border-indigo-600 transition-all py-2 text-lg font-bold bg-transparent outline-none" placeholder="Name" />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">Tutor</label>
            <div className="relative group">
              <select 
                value={userInfo.tutor} 
                onChange={e => setUserInfo({...userInfo, tutor: e.target.value})} 
                className="w-full border-b-2 border-slate-100 focus:border-indigo-600 transition-all py-4 text-lg font-bold bg-transparent outline-none appearance-none cursor-pointer"
              >
                <option value="" disabled>Select Tutor</option>
                {TUTORS.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none group-focus-within:text-indigo-600 transition-colors" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
          <div className="lg:col-span-5 space-y-8">
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600"><BookOpen className="w-6 h-6" /></div>
              Learning Objectives
            </h3>
            <ul className="space-y-4">
              {["Identify the central problem of economics", "Scarcity, choice and opportunity cost", "Rational Decision-making process", "Explicit vs Implicit costs & benefits"].map((obj, i) => (
                <li key={i} className="flex gap-4 items-start group">
                  <div className="w-6 h-6 flex-shrink-0 bg-indigo-600 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shadow-lg">{i + 1}</div>
                  <span className="text-slate-600 font-semibold text-base">{obj}</span>
                </li>
              ))}
            </ul>

            <div className="p-8 bg-slate-900 text-white rounded-[2rem] shadow-xl space-y-6">
               <h4 className="text-sm font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2"><Info className="w-4 h-4" /> The Economic Context</h4>
               <p className="text-sm leading-relaxed text-slate-300"><strong>Dover Forest</strong> is a 33-hectare site. Half is slated for public housing, while activists push for conservation.</p>
               <div className="grid grid-cols-1 gap-3">
                 <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700 flex items-center gap-4">
                    <div className="p-2 bg-green-900/50 rounded-lg text-green-400"><Leaf className="w-5 h-5" /></div>
                    <p className="text-xs font-bold text-slate-200">158 animal species (incl. critically endangered) & 120 plant species.</p>
                 </div>
                 <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700 flex items-center gap-4">
                    <div className="p-2 bg-indigo-900/50 rounded-lg text-indigo-400"><Building2 className="w-5 h-5" /></div>
                    <p className="text-xs font-bold text-slate-200">Urgent demand for public housing in mature estates.</p>
                 </div>
               </div>
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col">
            <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 shadow-inner flex flex-col h-full">
               <div className="flex items-center justify-between mb-6 px-2">
                 <div className="flex items-center gap-2">
                    <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-200 text-indigo-600"><MapIcon className="w-5 h-5" /></div>
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Dover Forest Area Map</h4>
                 </div>
               </div>
               <div className="flex-1 bg-white p-3 rounded-3xl shadow-md border border-slate-200 flex flex-col overflow-hidden group relative cursor-pointer min-h-[300px]" onClick={() => setShowMapModal(true)}>
                 {imageError ? (
                   <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
                     <AlertCircle className="w-12 h-12 text-red-400" />
                     <p className="text-sm font-bold text-slate-500">Map infographic temporarily unavailable.<br/>Click to view alternative resource.</p>
                   </div>
                 ) : (
                   <img 
                    src={MAP_URL} 
                    referrerPolicy="no-referrer" 
                    alt="Dover Forest Map" 
                    className="w-full h-full object-cover rounded-2xl transition-transform duration-1000 group-hover:scale-[1.03]" 
                    onError={() => setImageError(true)}
                   />
                 )}
                 <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-indigo-100 opacity-0 group-hover:opacity-100 transition-all">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-indigo-600 text-white rounded-xl"><ZoomIn className="w-4 h-4" /></div>
                      <div>
                        <p className="text-xs font-black text-slate-800 leading-tight">Interactive Visual Data</p>
                        <p className="text-[10px] font-bold text-slate-500 mt-1">Identify Scarcity: 33 Hectares vs Unlimited Wants.</p>
                      </div>
                    </div>
                 </div>
               </div>
               <p className="mt-4 text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest">Illustration by The Straits Times</p>
            </div>
          </div>
        </div>
        
        <div className="pt-8 border-t border-slate-100 flex justify-end items-center gap-6">
          <button onClick={() => setActiveSection('PartA')} className="flex items-center gap-2 px-12 py-5 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 shadow-xl transition-all group">
            Start Task <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderPartA = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl"><HelpCircle className="w-6 h-6" /></div>
          <h2 className="text-3xl font-black text-slate-800">Part A: Understanding the Issue</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          <div className="lg:col-span-8 space-y-6">
            <label className="text-lg font-bold text-slate-700 block">1. What is the economic problem of scarcity and how is it illustrated in the case of Dover Forest?</label>
            <div className="relative">
              <textarea value={partAResponse} onChange={(e) => setPartAResponse(e.target.value)} placeholder="Write your response here..." className="w-full min-h-[250px] p-8 rounded-3xl border-2 border-slate-100 focus:border-amber-400 focus:ring-0 transition-all text-slate-700 bg-slate-50" />
              <button onClick={() => getAIGuidance('partA', 'Explain scarcity in Dover Forest', partAResponse)} disabled={loading} className="absolute bottom-4 right-4 flex items-center gap-2 px-5 py-2 bg-white text-amber-600 border border-amber-100 rounded-xl font-bold hover:bg-amber-50 shadow-sm transition-all">
                <Lightbulb className="w-4 h-4" /> {loading ? "Analyzing..." : "Ask Tutor"}
              </button>
            </div>
            {guidance['partA'] && <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-sm italic">{guidance['partA']}</div>}
          </div>
          
          <div className="lg:col-span-4">
            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Newspaper className="w-4 h-4" /> Contextual Readings</h4>
              <p className="text-[10px] text-slate-500 font-bold leading-relaxed">Refer to these articles for "Singapore's experienced needs" as mentioned in Slide 7:</p>
              <div className="space-y-2">
                <a href="https://www.channelnewsasia.com/today/big-read/big-read-housing-high-costs-parents-age-singles-married-couples-fly-coop-4622656" target="_blank" className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-indigo-600 font-bold text-[10px] hover:bg-indigo-50 transition-all group">
                  High Housing Costs Bite <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </a>
                <a href="https://www.straitstimes.com/opinion/forum/forum-housing-a-priority-amid-land-constraints" target="_blank" className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-indigo-600 font-bold text-[10px] hover:bg-indigo-50 transition-all group">
                  Housing Priority vs Constraints <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-slate-100 flex justify-between">
          <button onClick={() => setActiveSection('Intro')} className="text-slate-400 font-bold hover:text-slate-600">Back</button>
          <button onClick={() => setActiveSection('PartB')} className="flex items-center gap-2 px-10 py-4 bg-slate-800 text-white rounded-2xl font-bold hover:bg-black transition-all">Move to Roleplay <ChevronRight className="w-5 h-5" /></button>
        </div>
      </div>
    </div>
  );

  const renderPartB = () => {
    const brief = STAKEHOLDER_BRIEFS[groupRole];
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-black text-slate-800">Part B: Group Role Task</h2>
            <div className={`text-xl font-black ${totalPercentage === 100 ? 'text-green-600' : 'text-red-600'}`}>Allocation: {totalPercentage}%</div>
          </div>

          <div className="space-y-6 mb-8">
            <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
              <label className="text-xs font-black text-indigo-900 uppercase tracking-widest block mb-3">Select Your Assigned Role (Slide 3)</label>
              <div className="flex flex-wrap gap-3">
                {Object.keys(STAKEHOLDER_BRIEFS).map(role => (
                  <button key={role} onClick={() => setGroupRole(role)} className={`px-5 py-3 rounded-xl font-bold text-sm transition-all ${groupRole === role ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'}`}>{role}</button>
                ))}
              </div>
            </div>
            
            {brief && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-top-4 duration-300">
                <div className="p-6 bg-slate-900 text-white rounded-[2rem] space-y-4 shadow-xl">
                  <h4 className="text-sm font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2"><Target className="w-4 h-4" /> Role Briefing</h4>
                  <p className="text-xs text-slate-300 font-bold">{brief.goal}</p>
                  <ul className="space-y-2">
                    {brief.concerns.map((c, i) => (
                      <li key={i} className="flex gap-2 text-xs text-slate-400"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" /> {c}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-6 bg-white border border-slate-200 rounded-[2rem] space-y-4 shadow-sm">
                   <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Newspaper className="w-4 h-4" /> Guiding Readings</h4>
                   <div className="space-y-2">
                     {brief.readings.map((r, i) => (
                       <a key={i} href={r.url} target="_blank" className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-indigo-600 font-bold text-xs hover:bg-indigo-50 transition-colors group">
                         {r.title} <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                       </a>
                     ))}
                   </div>
                </div>
              </div>
            )}
          </div>

          <div className="overflow-hidden border border-slate-100 rounded-3xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest border-b">Land Use</th>
                  <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest border-b w-32 text-center">Percentage (%)</th>
                  <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest border-b">Economic Reasoning (Slide 11/15/18)</th>
                </tr>
              </thead>
              <tbody>
                {allocation.map((row, idx) => (
                  <tr key={idx} className={`group hover:bg-slate-50 transition-colors ${idx === 2 ? 'bg-indigo-50/30' : ''}`}>
                    <td className="p-6 text-sm font-bold text-slate-700 border-b max-w-xs">{row.use}</td>
                    <td className="p-6 border-b">
                      {idx < 2 ? (
                        <input type="number" value={row.percentage} min="0" max="100" onChange={e => updateAllocation(idx, 'percentage', e.target.value)} className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-center outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 shadow-sm" />
                      ) : (
                        <div className="w-full p-3 bg-indigo-100/50 border border-indigo-200 rounded-xl font-black text-center text-indigo-700 flex items-center justify-center gap-2"><Lock className="w-3 h-3 opacity-50" /> {row.percentage}%</div>
                      )}
                    </td>
                    <td className="p-6 border-b">
                      <div className="relative">
                        <textarea value={row.reason} onChange={e => updateAllocation(idx, 'reason', e.target.value)} placeholder="Elaborate benefits and costs..." className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-600 min-h-[80px] shadow-sm pr-10" />
                        <button onClick={() => getAIGuidance(`partB_${idx}`, `Economic reasoning for ${row.use}`, row.reason)} className="absolute right-2 bottom-2 p-1 text-indigo-600 hover:text-indigo-800 transition-colors"><Lightbulb className="w-4 h-4" /></button>
                      </div>
                      {guidance[`partB_${idx}`] && <div className="mt-2 p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-[10px] text-indigo-900 italic leading-relaxed">{guidance[`partB_${idx}`]}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-10 pt-8 border-t border-slate-100 flex justify-between">
            <button onClick={() => setActiveSection('PartA')} className="text-slate-400 font-bold hover:text-slate-600">Back</button>
            <div className="flex flex-col items-end gap-2">
              {!groupRole && <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Select a role to continue.</div>}
              {totalPercentage !== 100 && <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Allocation must total 100% (currently {totalPercentage}%).</div>}
              <button disabled={!isReadyForPartC} onClick={() => setActiveSection('PartC')} className={`flex items-center gap-2 px-10 py-4 rounded-2xl font-bold transition-all ${isReadyForPartC ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>Post-Activity Analysis <ChevronRight className="w-5 h-5" /></button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPartC = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      {showBriefingLibrary && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4 md:p-12 transition-all">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-full overflow-hidden flex flex-col relative shadow-2xl">
            <button onClick={() => setShowBriefingLibrary(false)} className="absolute top-6 right-6 p-3 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-600 transition-colors z-10"><X className="w-6 h-6" /></button>
            <div className="p-8 border-b border-slate-100 bg-white">
              <h3 className="text-xl font-black text-slate-800">Stakeholder Evidence Library</h3>
              <p className="text-sm text-slate-400 font-medium italic uppercase tracking-wider">National Briefing for Government Decision (Slide 20)</p>
            </div>
            <div className="flex-1 overflow-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50">
              {Object.entries(STAKEHOLDER_BRIEFS).map(([role, brief]) => (
                <div key={role} className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
                  <h4 className="font-black text-slate-800 text-sm flex items-center gap-2"><Users className="w-4 h-4 text-indigo-600" /> {role}</h4>
                  <div className="space-y-2">
                    {brief.readings.map((r, i) => (
                      <a key={i} href={r.url} target="_blank" className="block p-3 rounded-xl bg-slate-50 border border-slate-100 text-indigo-600 font-bold text-[10px] hover:bg-indigo-50">
                        {r.title}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl"><Landmark className="w-6 h-6" /></div>
            <h2 className="text-3xl font-black text-slate-800">Part C: Overall Government Perspective</h2>
          </div>
          <button onClick={() => setShowBriefingLibrary(true)} className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-indigo-600 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all shadow-sm">
            <Layers className="w-4 h-4" /> Evidence Library
          </button>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          {[
            { 
              key: 'aims', 
              label: 'A: Aim(s)', 
              desc: 'Strategic Objectives: The "Why". Consider long-term societal goals (equity, growth or maximising societal welfare). What is the government trying to solve?' 
            },
            { 
              key: 'benefits', 
              label: 'B: Benefits', 
              desc: 'Positive Outcomes: The "What". Differentiate between Explicit (tangible gains) and Implicit (unseen gains like biodiversity or ecosystem services).' 
            },
            { key: 'costs', label: 'C: Costs & Constraints', desc: 'Resource Scarcity & Opportunity Costs: What is the trade-off?' },
            { key: 'decisionRule', label: 'D: Decision Making', desc: 'Rational Decision-making rule: How do they weigh benefits vs costs?' },
            { key: 'evaluate', label: 'E: Evaluate', desc: 'Outcome evaluation and unintended consequences: Consider future impacts.' },
          ].map(field => (
            <div key={field.key} className="p-8 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
              <div className="flex justify-between items-start">
                <div><h4 className="text-lg font-black text-slate-800">{field.label}</h4><p className="text-xs text-slate-400 font-bold">{field.desc}</p></div>
                <button onClick={() => getAIGuidance(`partC_${field.key}`, field.desc, (partC as any)[field.key])} className="p-2 bg-white text-indigo-600 rounded-xl shadow-sm border border-slate-200 hover:bg-indigo-50"><Lightbulb className="w-5 h-5" /></button>
              </div>
              <textarea value={(partC as any)[field.key]} onChange={e => setPartC({...partC, [field.key]: e.target.value})} className="w-full min-h-[120px] p-5 rounded-2xl border-2 border-white focus:border-indigo-600 transition-all text-sm bg-white" placeholder="Synthesize decision points here..." />
              {guidance[`partC_${field.key}`] && <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-xs text-indigo-900 italic">{guidance[`partC_${field.key}`]}</div>}
            </div>
          ))}
        </div>

        <div className="mt-12 p-8 bg-slate-900 text-white rounded-[2rem] shadow-xl space-y-8">
          <h3 className="text-xl font-bold flex items-center gap-2"><Scale className="text-indigo-400"/> Opportunity Cost Synthesis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">"If we choose more..."</label>
              <input value={opportunityCost.chooseMore} onChange={e => setOpportunityCost({...opportunityCost, chooseMore: e.target.value})} className="w-full bg-slate-800 border-b-2 border-slate-700 p-3 rounded-lg text-white font-bold" placeholder="Choice..." />
            </div>
            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">"We give up..."</label>
              <input value={opportunityCost.giveUp} onChange={e => setOpportunityCost({...opportunityCost, giveUp: e.target.value})} className="w-full bg-slate-800 border-b-2 border-slate-700 p-3 rounded-lg text-white font-bold" placeholder="Foregone..." />
            </div>
          </div>
          <div className="relative">
            <textarea value={opportunityCost.explain} onChange={e => setOpportunityCost({...opportunityCost, explain: e.target.value})} className="w-full min-h-[100px] bg-slate-800 border-2 border-slate-700 p-4 rounded-xl text-white text-sm" placeholder="Explain the next best alternative foregone by the Singapore Government..." />
            <button onClick={() => getAIGuidance('oppCost', 'Opportunity cost explanation', opportunityCost.explain)} className="absolute right-2 bottom-2 p-1 text-indigo-400 hover:text-indigo-200 transition-colors"><Lightbulb className="w-4 h-4" /></button>
          </div>
          {guidance['oppCost'] && <div className="p-4 bg-slate-800 border border-slate-700 rounded-xl text-[10px] text-indigo-300 italic leading-relaxed">{guidance['oppCost']}</div>}
        </div>

        <div className="mt-10 pt-8 border-t border-slate-100 flex justify-between">
          <button onClick={() => setActiveSection('PartB')} className="text-slate-400 font-bold hover:text-slate-600">Back</button>
          <button onClick={() => setActiveSection('Reflection')} className="flex items-center gap-2 px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all">Reflection & Research <ChevronRight className="w-5 h-5" /></button>
        </div>
      </div>
    </div>
  );

  const renderReflection = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-slate-800 text-white rounded-2xl"><Newspaper className="w-6 h-6" /></div>
          <div>
            <h2 className="text-3xl font-black text-slate-800">Food for Thought</h2>
            <p className="text-slate-400 mt-1 font-medium">Economics Beyond the Classroom</p>
          </div>
        </div>

        <div className="space-y-8">
          <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-200 space-y-6">
            <h3 className="flex items-center gap-3 text-slate-800 font-black text-xl"><BookOpen className="text-indigo-600" /> 1. Research Your Case</h3>
            <p className="text-sm text-slate-500 font-medium">Read a news story this week about a development project, government spending, or environmental policy. Provide the link or upload the article here.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Paste article link..." value={foodForThought.sourceLink} onChange={e => setFoodForThought({...foodForThought, sourceLink: e.target.value})} className="w-full pl-10 pr-4 py-4 rounded-2xl border-2 border-slate-100 focus:border-indigo-600 transition-all text-sm font-medium" />
              </div>
              <div className="flex items-center gap-2">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 font-bold text-sm">
                  <Upload className="w-4 h-4" /> {foodForThought.sourceFileName || 'Upload Article (PDF/DOC)'}
                </button>
                {foodForThought.sourceFileName && <button onClick={() => setFoodForThought({...foodForThought, sourceFileName: ''})} className="p-4 bg-red-50 text-red-500 rounded-2xl"><X className="w-4 h-4" /></button>}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="flex items-center gap-3 text-slate-800 font-black text-xl"><Scale className="text-indigo-600" /> 2. Economic Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { key: 'resource', label: 'What resource is scarce?', icon: <Info className="w-4 h-4"/> },
                { key: 'choices', label: 'What choices are being made?', icon: <BarChart3 className="w-4 h-4"/> },
                { key: 'stakeholders', label: 'Who are the stakeholders?', icon: <Users className="w-4 h-4"/> },
                { key: 'cost', label: 'What is the opportunity cost?', icon: <Scale className="w-4 h-4"/> },
                { key: 'winners', label: 'Who benefits/loses?', icon: <CheckCircle2 className="w-4 h-4"/> },
              ].map(item => (
                <div key={item.key} className="space-y-2 group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">{item.icon} {item.label}</label>
                  <input type="text" value={(foodForThought as any)[item.key]} onChange={e => setFoodForThought({...foodForThought, [item.key]: e.target.value})} className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-indigo-600 transition-all text-sm font-medium bg-white" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 p-8 bg-indigo-50 rounded-[2rem] border border-indigo-100 shadow-inner">
          <h3 className="text-lg font-black text-indigo-900 mb-6 flex items-center gap-2"><CheckSquare /> H2 Syllabus Concept Checklist (Slide 22)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { key: 'scarcity', label: 'The Problem of Scarcity' },
              { key: 'choice', label: 'Opportunity Cost' },
              { key: 'opportunityCost', label: 'Objectives of Agents' },
              { key: 'framework', label: 'Rational Decision Making' },
              { key: 'decision', label: 'Explicit/Implicit Costs & Benefits' },
            ].map(item => (
              <label key={item.key} className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-indigo-100 cursor-pointer hover:bg-indigo-100 transition-all shadow-sm">
                <input type="checkbox" checked={(checklist as any)[item.key]} onChange={e => setChecklist({...checklist, [item.key]: e.target.checked})} className="w-5 h-5 rounded border-indigo-300 text-indigo-600" />
                <span className="text-xs font-bold text-slate-700">{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-slate-100 pt-8">
          <button onClick={() => setActiveSection('PartC')} className="text-slate-400 font-bold hover:text-slate-600">Back</button>
          <div className="flex gap-4">
            <button onClick={saveSubmission} className="flex items-center gap-2 px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all"><Save className="w-5 h-5" /> Submit Final Response</button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fcfcfd] flex flex-col font-sans text-slate-900">
      {showTeacherAuth && (
        <div className="fixed inset-0 z-[110] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-8 border-b border-slate-100 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-800">Teacher Access</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Email OTP Sign-In</p>
              </div>
              <button onClick={() => setShowTeacherAuth(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-8 space-y-6">
              <p className="text-sm text-slate-600 font-medium">Use your school email ending with {TEACHER_EMAIL_DOMAIN} to receive a 6 digit OTP.</p>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</label>
                <input
                  type="email"
                  value={teacherEmail}
                  onChange={e => setTeacherEmail(e.target.value)}
                  placeholder={`name${TEACHER_EMAIL_DOMAIN}`}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-600 transition-all text-sm font-medium"
                />
              </div>

              {teacherAuthStep === "otp" && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">6 Digit OTP</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={teacherOtp}
                    onChange={e => setTeacherOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="123456"
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-600 transition-all text-sm font-medium tracking-widest"
                  />
                </div>
              )}

              {teacherAuthError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700 font-bold">{teacherAuthError}</div>
              )}
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setShowTeacherAuth(false)}
                className="text-slate-500 font-bold text-xs hover:text-slate-700"
              >
                Cancel
              </button>
              <div className="flex gap-3">
                {teacherAuthStep === "otp" && (
                  <button
                    onClick={sendTeacherOtp}
                    disabled={teacherAuthLoading}
                    className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
                  >
                    Resend OTP
                  </button>
                )}
                {teacherAuthStep === "email" ? (
                  <button
                    onClick={sendTeacherOtp}
                    disabled={teacherAuthLoading}
                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all"
                  >
                    {teacherAuthLoading ? "Sending..." : "Send OTP"}
                  </button>
                ) : (
                  <button
                    onClick={verifyTeacherOtp}
                    disabled={teacherAuthLoading}
                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all"
                  >
                    {teacherAuthLoading ? "Verifying..." : "Verify & Continue"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      <header className="bg-white border-b border-slate-100 p-6 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl"><Trees className="w-8 h-8" /></div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">Dover Forest Case Study</h1>
              <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest">{viewMode === 'student' ? 'Student Console' : 'Teacher Console'}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {viewMode === 'student' && (
              <nav className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
                {['Intro', 'PartA', 'PartB', 'PartC', 'Reflection'].map(tab => (
                  <button key={tab} onClick={() => setActiveSection(tab as Section)} className={`px-4 lg:px-6 py-2.5 rounded-xl text-[10px] lg:text-xs font-black transition-all ${activeSection === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>{tab}</button>
                ))}
              </nav>
            )}
            
            <button 
              onClick={() => {
                if (viewMode === 'teacher') {
                  setViewMode('student');
                } else if (teacherAuthed) {
                  setViewMode('teacher');
                } else {
                  openTeacherAuth();
                }
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 font-bold text-xs text-slate-500 hover:bg-slate-50 transition-all"
            >
              {viewMode === 'student' ? <Settings className="w-4 h-4" /> : <User className="w-4 h-4" />}
              Switch to {viewMode === 'student' ? 'Teacher' : 'Student'}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">
        <div className="mb-12 border-b border-slate-100 pb-10">
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter">
            {viewMode === 'teacher' ? 'Response Dashboard' : (
              activeSection === 'Intro' ? "Lesson Overview" :
              activeSection === 'PartA' ? "Pre-Lesson Task" :
              activeSection === 'PartB' ? "In-Class Roleplay" :
              activeSection === 'PartC' ? "Post-Activity Analysis" :
              "Economics Beyond Class"
            )}
          </h2>
          {viewMode === 'student' && <div className="mt-4 max-w-xs"><ProgressBar current={['Intro', 'PartA', 'PartB', 'PartC', 'Reflection'].indexOf(activeSection)} total={5} /></div>}
        </div>

        {viewMode === 'teacher' ? renderTeacherConsole() : (
          <>
            {activeSection === 'Intro' && renderIntro()}
            {activeSection === 'PartA' && renderPartA()}
            {activeSection === 'PartB' && renderPartB()}
            {activeSection === 'PartC' && renderPartC()}
            {activeSection === 'Reflection' && renderReflection()}
          </>
        )}
      </main>
      
      <footer className="py-12 border-t border-slate-100 flex justify-center">
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Interactive Economics Lab • Dover Forest Case Study • Singapore JC1 Syllabus</p>
      </footer>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<DoverForestApp />);
