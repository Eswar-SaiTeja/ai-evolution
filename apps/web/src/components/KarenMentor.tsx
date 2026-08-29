import React, { useState, useEffect } from 'react';
import { BookOpen, GraduationCap, CheckCircle, Award, HelpCircle, ArrowRight, Play } from 'lucide-react';
import { api } from '../utils/api.js';

export const KarenMentor: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [activeTopicIdx, setActiveTopicIdx] = useState(0);
  const [courseInput, setCourseInput] = useState('');
  const [level, setLevel] = useState('BEGINNER');
  const [loading, setLoading] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<{ [qIdx: number]: number }>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScoreResult, setQuizScoreResult] = useState<number | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const list = await api.workspace.courses.list();
      setCourses(list);
      if (list.length > 0 && !selectedCourse) {
        loadCourseDetails(list[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadCourseDetails = async (id: string) => {
    try {
      const course = await api.workspace.courses.list().then(list => list.find((c: any) => c.id === id));
      setSelectedCourse(course);
      setActiveTopicIdx(course.currentTopicIndex || 0);
      setQuizAnswers({});
      setQuizSubmitted(false);
      setQuizScoreResult(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseInput.trim()) return;

    setLoading(true);
    try {
      const newCourse = await api.workspace.courses.create({ title: courseInput, level });
      setCourseInput('');
      await fetchCourses();
      loadCourseDetails(newCourse.id);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!selectedCourse) return;
    const activeProgress = selectedCourse.progress.find((p: any) => p.topicName === activeTopic.title);
    if (!activeProgress) return;

    const quiz = activeTopic.quiz;
    let score = 0;
    
    quiz.forEach((q: any, idx: number) => {
      if (quizAnswers[idx] === q.answer) {
        score++;
      }
    });

    const scorePercent = Math.round((score / quiz.length) * 100);
    setQuizScoreResult(scorePercent);
    setQuizSubmitted(true);

    try {
      await api.workspace.courses.quiz({
        progressId: activeProgress.id,
        score: scorePercent
      });
      
      // Update local state course data
      const updatedList = await api.workspace.courses.list();
      setCourses(updatedList);
      const updatedCourse = updatedList.find((c: any) => c.id === selectedCourse.id);
      setSelectedCourse(updatedCourse);
    } catch (e) {
      console.error(e);
    }
  };

  const activeTopic = selectedCourse?.roadmap?.[activeTopicIdx];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#030712] relative font-mono select-none overflow-y-auto p-6">
      <div className="absolute inset-0 bg-cyber-grid pointer-events-none" />

      {/* Header */}
      <div className="border-b border-gray-900 pb-4 mb-6 z-10">
        <h2 className="text-sm font-bold tracking-widest text-karen glow-text-karen uppercase">
          K.A.R.E.N. Mentorship Learning Platform
        </h2>
        <p className="text-[10px] text-gray-500 uppercase mt-0.5 tracking-wider">
          Adaptive Roadmaps, Interactive Code Exercises & Quiz Evaluations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-7xl mx-auto w-full z-10 items-start">
        
        {/* Left Side: Courses list & creation */}
        <div className="space-y-6 lg:col-span-1">
          {/* Create course */}
          <div className="hud-glass border border-karen/20 p-4 rounded-xl space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-karen" />
              Generate Syllabus
            </h3>

            <form onSubmit={handleCreateCourse} className="space-y-3 text-xs font-mono">
              <input
                type="text"
                required
                value={courseInput}
                onChange={e => setCourseInput(e.target.value)}
                placeholder="e.g. Learn Python Loops"
                className="w-full bg-[#02050c] border border-gray-800 rounded p-2 focus:border-karen focus:outline-none placeholder-gray-700 text-white"
              />
              <select
                value={level}
                onChange={e => setLevel(e.target.value)}
                className="w-full bg-[#02050c] border border-gray-800 rounded p-2 focus:border-karen focus:outline-none text-white uppercase"
              >
                <option value="BEGINNER">BEGINNER TIER</option>
                <option value="INTERMEDIATE">INTERMEDIATE TIER</option>
                <option value="ADVANCED">ADVANCED TIER</option>
                <option value="EXPERT">EXPERT TIER</option>
              </select>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-karen/10 hover:bg-karen hover:text-cyber-bg border border-karen/30 text-karen font-bold rounded uppercase tracking-widest shadow-hud-karen text-xs transition-colors"
              >
                {loading ? 'GENERATING...' : 'ASSEMBLE SYLLABUS'}
              </button>
            </form>
          </div>

          {/* Courses list */}
          <div className="hud-glass border border-gray-900 p-4 rounded-xl space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">Active Paths</h3>
            {courses.length === 0 ? (
              <div className="text-[10px] text-gray-600 uppercase">No active courses.</div>
            ) : (
              <div className="space-y-2">
                {courses.map(c => (
                  <button
                    key={c.id}
                    onClick={() => loadCourseDetails(c.id)}
                    className={`w-full text-left p-2.5 rounded border text-xs uppercase transition-all block ${
                      selectedCourse?.id === c.id 
                        ? 'border-karen/40 bg-karen/5 text-white' 
                        : 'border-gray-900 bg-transparent text-gray-400 hover:border-gray-800 hover:text-white'
                    }`}
                  >
                    <div className="font-bold truncate">{c.title}</div>
                    <div className="text-[9px] text-gray-500 mt-1">{c.level}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: active topic detail view */}
        <div className="lg:col-span-3 space-y-6">
          {selectedCourse && activeTopic ? (
            <div className="space-y-6">
              {/* Roadmap Horizontal Progress timeline */}
              <div className="hud-glass border border-gray-900 p-4 rounded-xl flex gap-4 overflow-x-auto">
                {selectedCourse.roadmap.map((topic: any, idx: number) => {
                  const isCompleted = selectedCourse.progress.find((p: any) => p.topicName === topic.title)?.isCompleted;
                  const isActive = idx === activeTopicIdx;

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setActiveTopicIdx(idx);
                        setQuizAnswers({});
                        setQuizSubmitted(false);
                        setQuizScoreResult(null);
                      }}
                      className={`flex items-center gap-2 p-2 rounded border transition-all text-xs uppercase flex-shrink-0 ${
                        isActive 
                          ? 'border-karen text-karen shadow-hud-karen' 
                          : isCompleted 
                            ? 'border-gray-800 text-gray-400' 
                            : 'border-transparent text-gray-600'
                      }`}
                    >
                      {isCompleted ? <CheckCircle className="w-4 h-4 text-karen" /> : <Play className="w-4 h-4" />}
                      <span className="font-bold">{topic.title}</span>
                    </button>
                  );
                })}
              </div>

              {/* Lesson details content */}
              <div className="hud-glass border border-gray-900 p-6 rounded-xl space-y-5">
                <div>
                  <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Active Lesson</span>
                  <h3 className="text-white text-lg font-bold uppercase mt-1">{activeTopic.title}</h3>
                  <p className="text-gray-300 text-xs mt-2 leading-relaxed">{activeTopic.description}</p>
                </div>

                {/* Example code box */}
                <div className="space-y-2">
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Code Sandbox Reference</span>
                  <pre className="p-4 bg-[#01040a] text-karen rounded-lg border border-gray-800 text-[11px] font-mono overflow-x-auto leading-normal">
                    {activeTopic.example}
                  </pre>
                </div>

                {/* Exercises box */}
                <div className="space-y-2 border border-gray-900 p-4 rounded-lg bg-cyber-card/10">
                  <span className="text-[10px] text-karen uppercase tracking-widest font-bold flex items-center gap-1">
                    <Award className="w-4 h-4" /> Practice Challenge
                  </span>
                  <p className="text-gray-400 text-xs mt-1">{activeTopic.exercise}</p>
                </div>

                {/* Multiple choice quiz section */}
                {activeTopic.quiz && activeTopic.quiz.length > 0 && (
                  <div className="space-y-4 border-t border-gray-900 pt-5">
                    <h4 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-karen" />
                      Topic Assessment Quiz
                    </h4>

                    <div className="space-y-4">
                      {activeTopic.quiz.map((q: any, qIdx: number) => (
                        <div key={qIdx} className="space-y-2">
                          <p className="text-xs text-gray-300 font-bold leading-relaxed">{qIdx + 1}. {q.question}</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {q.options.map((opt: string, oIdx: number) => {
                              const isChecked = quizAnswers[qIdx] === oIdx;
                              return (
                                <button
                                  key={oIdx}
                                  type="button"
                                  onClick={() => !quizSubmitted && setQuizAnswers({ ...quizAnswers, [qIdx]: oIdx })}
                                  className={`text-left p-2.5 rounded border text-xs transition-all flex items-center gap-2 ${
                                    isChecked
                                      ? 'border-karen/50 bg-karen/5 text-white font-bold'
                                      : 'border-gray-950 bg-[#02050c]/60 text-gray-400 hover:border-gray-800 hover:text-white'
                                  }`}
                                >
                                  <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 ${isChecked ? 'border-karen text-karen bg-karen' : 'border-gray-700 bg-transparent'}`} />
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    {quizSubmitted ? (
                      <div className="p-4 border border-karen/30 bg-karen/5 rounded flex justify-between items-center">
                        <div>
                          <div className="text-xs font-bold text-white uppercase">Syllabus Progress Updated!</div>
                          <div className="text-[10px] text-gray-400 mt-1">Quiz Score: {quizScoreResult}% Correct answers.</div>
                        </div>
                        <CheckCircle className="w-8 h-8 text-karen animate-bounce" />
                      </div>
                    ) : (
                      <button
                        onClick={handleSubmitQuiz}
                        disabled={Object.keys(quizAnswers).length < activeTopic.quiz.length}
                        className="px-6 py-2.5 bg-karen/10 hover:bg-karen hover:text-cyber-bg border border-karen/50 text-karen font-bold rounded uppercase tracking-widest text-xs transition-all disabled:opacity-30 disabled:hover:bg-karen/10 disabled:hover:text-karen"
                      >
                        Submit Score
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="hud-glass border border-gray-900 p-8 rounded-xl text-center py-20">
              <GraduationCap className="w-12 h-12 text-gray-700 mx-auto mb-4 animate-bounce" />
              <h3 className="font-bold text-white uppercase mb-2">No Syllabus Selected</h3>
              <p className="text-gray-500 text-xs max-w-sm mx-auto leading-relaxed">
                Generate a learning course roadmap on the left panel (e.g. Python loops) to launch the adaptive K.A.R.E.N. classroom.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
