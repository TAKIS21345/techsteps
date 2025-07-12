import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, 
  BookOpen, 
  CheckCircle, 
  Clock, 
  Star, 
  Award, 
  Play,
  Volume2,
  Download,
  HelpCircle
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';

import { useUser } from '../contexts/UserContext';
import Logo from '../components/Logo';
import SkillAssessmentModal from '../components/SkillAssessmentModal';
import { SkillAssessmentResult, LearningPath, Module } from '../types/learning';
import { learningService, getBadgeById } from '../services/learningService';

const LearningCenterPage: React.FC = () => {
  const [currentView, setCurrentView] = useState<'overview' | 'course' | 'lesson'>('overview');
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [isLoadingPaths, setIsLoadingPaths] = useState(true);

  const { t } = useTranslation();
  const { userData, updateUserData, loading: userLoading } = useUser();

  useEffect(() => {
    const fetchPaths = async () => {
      setIsLoadingPaths(true);
      try {
        let paths = await learningService.getLearningPaths();
        // Add sample content to the first lesson
        if (paths && paths.length > 0 && paths[0].modules && paths[0].modules.length > 0) {
          paths[0].modules[0] = {
            ...paths[0].modules[0],
            content: `
              <div class="space-y-6">
                <h3 class="text-2xl font-bold text-gray-800">How to Turn On Your Device</h3>
                <div class="bg-blue-50 p-6 rounded-xl border border-blue-100">
                  <h4 class="text-lg font-semibold mb-4 text-blue-800">Step-by-Step Instructions:</h4>
                  <ol class="space-y-4 text-lg">
                    <li class="flex items-start">
                      <span class="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4 mt-1">1</span>
                      <div>
                        <strong>Find the Power Button:</strong> Look for a button with this symbol ⏻ (circle with a line). It's usually on the side, top, or front of your device.
                      </div>
                    </li>
                    <li class="flex items-start">
                      <span class="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4 mt-1">2</span>
                      <div>
                        <strong>Press and Hold:</strong> Gently press and hold the power button for 1-2 seconds. Don't tap it quickly - hold it down.
                      </div>
                    </li>
                    <li class="flex items-start">
                      <span class="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4 mt-1">3</span>
                      <div>
                        <strong>Watch for Signs:</strong> The screen should light up, or you might hear a sound. This means your device is waking up.
                      </div>
                    </li>
                    <li class="flex items-start">
                      <span class="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4 mt-1">4</span>
                      <div>
                        <strong>Be Patient:</strong> It may take 30 seconds to 2 minutes for the device to be ready to use. Don't worry if it seems slow!
                      </div>
                    </li>
                  </ol>
                </div>
                <div class="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h4 class="font-semibold text-yellow-800 mb-2">💡 Helpful Tip:</h4>
                  <p class="text-yellow-700">If nothing happens when you press the power button, make sure your device is plugged into the wall or has enough battery charge.</p>
                </div>
                <div class="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 class="font-semibold text-green-800 mb-2">🎉 Congratulations!</h4>
                  <p class="text-green-700">You've learned the most important skill - how to turn on your device! This is the first step to everything else you'll learn.</p>
                </div>
              </div>
            `
          };
        }
        setLearningPaths(paths);
      } catch (error) {
        console.error("Error fetching learning paths:", error);
      } finally {
        setIsLoadingPaths(false);
      }
    };
    fetchPaths();
  }, []);

  // Show assessment modal for new users
  useEffect(() => {
    const shouldShowAssessment = !userLoading && 
      userData && 
      !userData.skillAssessmentResult && 
      currentView === 'overview' &&
      !sessionStorage.getItem('onboardingJustCompleted');

    setShowAssessmentModal(Boolean(shouldShowAssessment));
  }, [userData, userLoading, currentView]);

  const handleSubmitAssessment = async (answers: SkillAssessmentResult) => {
    let recommendedPathId = 'fundamentals';
    let determinedSkillLevel: 'Beginner' | 'Intermediate' | 'Advanced' = 'Beginner';

    if (answers.q1ComfortLevel === 'confident' && answers.q2EmailSent && answers.q3SmartphoneUsed) {
      recommendedPathId = 'digitalLife';
      determinedSkillLevel = 'Advanced';
    } else if (answers.q1ComfortLevel === 'basics' && answers.q2EmailSent) {
      recommendedPathId = 'onlineWorld';
      determinedSkillLevel = 'Intermediate';
    }

    try {
      await updateUserData({
        skillAssessmentResult: answers,
        recommendedStartingPathId: recommendedPathId,
        skillLevel: determinedSkillLevel
      });
    } catch (error) {
      console.error("Error saving assessment results:", error);
    }
    setShowAssessmentModal(false);
  };

  const markLessonAsComplete = async (pathId: string, lessonId: string) => {
    if (!userData) return;
    
    // Update learning progress
    const currentProgress = userData.userLearningProgress || { completedModules: {}, earnedBadges: {} };
    const updatedModules = { ...currentProgress.completedModules, [lessonId]: true };
    
    // Check if path is complete for badge
    const path = learningPaths.find(p => p.id === pathId);
    let updatedBadges = { ...currentProgress.earnedBadges };
    
    if (path && path.modules.every(module => updatedModules[module.id]) && path.badgeIdOnCompletion) {
      updatedBadges[path.badgeIdOnCompletion] = true;
    }

    await updateUserData({
      userLearningProgress: {
        completedModules: updatedModules,
        earnedBadges: updatedBadges
      }
    });
  };

  const renderIcon = (IconComponent: any, className: string) => {
    if (typeof IconComponent === 'function' || (IconComponent && IconComponent.$$typeof)) {
      return <IconComponent className={className} />;
    }
    return <HelpCircle className={className} />;
  };

  // Lesson view
  if (currentView === 'lesson' && selectedPath && currentLessonId) {
    const lesson = selectedPath.modules.find(m => m.id === currentLessonId);
    if (!lesson) return null;

    const lessonIndex = selectedPath.modules.findIndex(m => m.id === currentLessonId);
    const isCompleted = userData?.userLearningProgress?.completedModules?.[lesson.id] || false;

    return (
      <div className="min-h-screen bg-white senior-friendly">
        <header className="bg-white border-b-2 border-gray-100 sticky top-0 z-40">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => setCurrentView('course')}
                  className="p-3 text-gray-600 hover:text-gray-800 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <Logo size="md" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">{t(lesson.titleKey)}</h1>
                  <p className="text-lg text-gray-600">{t(selectedPath.titleKey)}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="card p-10 mb-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  isCompleted ? 'bg-green-100' : 'bg-blue-100'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  ) : (
                    <span className="text-2xl font-bold text-blue-600">{lessonIndex + 1}</span>
                  )}
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">{t(lesson.titleKey)}</h2>
                  <p className="text-xl text-gray-600">{t(lesson.descriptionKey)}</p>
                  <div className="flex items-center text-gray-500 mt-2">
                    <Clock className="w-5 h-5 mr-2" />
                    <span className="text-lg">{lesson.estimatedTime}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Lesson content */}
            <div className="prose prose-lg max-w-none mb-8">
              {lesson.content ? (
                <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-xl">{t('learningPage.lessonContentPlaceholder', { lessonTitle: t(lesson.titleKey) })}</p>
                </div>
              )}
            </div>

            {/* Lesson actions */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-8 border-t-2 border-gray-100">
              <button
                disabled={lessonIndex === 0}
                className="btn-secondary text-lg px-8 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setCurrentLessonId(selectedPath.modules[lessonIndex - 1].id)}
              >
                ← Previous Lesson
              </button>

              <button
                className={`btn-primary text-lg px-10 py-4 ${isCompleted ? 'bg-green-600 hover:bg-green-700' : ''}`}
                onClick={async () => {
                  if (!isCompleted) {
                    await markLessonAsComplete(selectedPath.id, lesson.id);
                  }
                }}
              >
                {isCompleted ? '✓ Completed' : 'Mark as Complete'}
              </button>

              <button
                disabled={lessonIndex === selectedPath.modules.length - 1}
                className="btn-secondary text-lg px-8 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setCurrentLessonId(selectedPath.modules[lessonIndex + 1].id)}
              >
                Next Lesson →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Course view
  if (currentView === 'course' && selectedPath) {
    const completedModules = selectedPath.modules.filter(
      module => userData?.userLearningProgress?.completedModules?.[module.id]
    ).length;
    const progressPercent = (completedModules / selectedPath.modules.length) * 100;
    const isPathBadgeEarned = userData?.userLearningProgress?.earnedBadges?.[selectedPath.badgeIdOnCompletion] || false;

    return (
      <div className="min-h-screen bg-white senior-friendly">
        <header className="bg-white border-b-2 border-gray-100 sticky top-0 z-40">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => setCurrentView('overview')}
                  className="p-3 text-gray-600 hover:text-gray-800 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <Logo size="md" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">{t(selectedPath.titleKey)}</h1>
                  <p className="text-lg text-gray-600">Learning Course</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-5xl">
          {/* Course header */}
          <div className="card p-10 mb-8">
            <div className="flex items-start space-x-6">
              <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center">
                {renderIcon(LucideIcons[selectedPath.iconName as keyof typeof LucideIcons], "w-10 h-10 text-blue-600")}
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">{t(selectedPath.titleKey)}</h2>
                <p className="text-xl text-gray-600 mb-6">{t(selectedPath.descriptionKey)}</p>
                
                <div className="mb-6">
                  <div className="flex justify-between text-lg text-gray-600 mb-3">
                    <span>Your Progress</span>
                    <span>{completedModules} of {selectedPath.modules.length} completed</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div 
                      className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                  <p className="text-lg text-gray-600 mt-2">{Math.round(progressPercent)}% complete</p>
                </div>

                {isPathBadgeEarned && (
                  <div className="inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-xl border border-yellow-200">
                    <Award className="w-5 h-5 mr-2" />
                    <span className="font-medium">Course Completed! Badge Earned</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Lessons list */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Course Lessons</h2>
            {selectedPath.modules.map((lesson, index) => {
              const isCompleted = userData?.userLearningProgress?.completedModules?.[lesson.id] || false;
              
              return (
                <div key={lesson.id} className="card p-8 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6 flex-1">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                        isCompleted ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="w-8 h-8 text-green-600" />
                        ) : (
                          <span className="text-xl font-bold text-gray-600">{index + 1}</span>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">{t(lesson.titleKey)}</h3>
                        <p className="text-lg text-gray-600 mb-3">{t(lesson.descriptionKey)}</p>
                        <div className="flex items-center text-gray-500">
                          <Clock className="w-5 h-5 mr-2" />
                          <span>{lesson.estimatedTime}</span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        setCurrentLessonId(lesson.id);
                        setCurrentView('lesson');
                      }}
                      className="btn-primary text-lg px-8 py-4"
                    >
                      {isCompleted ? 'Review Lesson' : 'Start Lesson'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Overview (main learning center)
  return (
    <div className="min-h-screen bg-white senior-friendly">
      {showAssessmentModal && (
        <SkillAssessmentModal
          isOpen={showAssessmentModal}
          onClose={() => {
            setShowAssessmentModal(false);
            if (!userData?.skillAssessmentResult && updateUserData) {
              const defaultAssessment = {
                skillAssessmentResult: { 
                  q1ComfortLevel: 'basics' as 'basics', 
                  q2EmailSent: false, 
                  q3SmartphoneUsed: false 
                },
                recommendedStartingPathId: 'fundamentals',
                skillLevel: 'Beginner' as 'Beginner'
              };
              sessionStorage.setItem('assessmentCompleted', 'true');
              updateUserData(defaultAssessment).catch(err => console.error("Failed to set default assessment", err));
            }
          }}
          onSubmit={handleSubmitAssessment}
        />
      )}

      <header className="bg-white border-b-2 border-gray-100 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                to="/dashboard" 
                className="p-3 text-gray-600 hover:text-gray-800 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <Logo size="md" />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{t('learning.title')}</h1>
                <p className="text-lg text-gray-600">Step-by-step learning made simple</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero section */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-gray-800 mb-6">
            {t('learningPage.heroTitle')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            {t('learningPage.heroSubtitle')}
          </p>
          {userData?.skillAssessmentResult && (
            <button
              onClick={() => setShowAssessmentModal(true)}
              className="btn-secondary text-lg px-6 py-3 mb-8"
            >
              {t('learningPage.retakeAssessment')}
            </button>
          )}
        </div>

        {/* Loading state */}
        {isLoadingPaths && (
          <div className="text-center py-16">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-xl text-gray-600">{t('learningPage.loadingPaths')}</p>
          </div>
        )}

        {/* Learning paths */}
        {!isLoadingPaths && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {learningPaths.map((path) => {
              const completedModules = path.modules.filter(
                module => userData?.userLearningProgress?.completedModules?.[module.id]
              ).length;
              const progressPercent = (completedModules / path.modules.length) * 100;
              const isPathBadgeEarned = userData?.userLearningProgress?.earnedBadges?.[path.badgeIdOnCompletion] || false;
              const isRecommended = userData?.recommendedStartingPathId === path.id;

              return (
                <div 
                  key={path.id}
                  className={`card p-8 hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1 ${
                    isRecommended ? 'ring-2 ring-green-400 bg-green-50' : ''
                  }`}
                  onClick={() => {
                    setSelectedPath(path);
                    setCurrentView('course');
                  }}
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      {renderIcon(LucideIcons[path.iconName as keyof typeof LucideIcons], 'w-8 h-8 text-blue-600')}
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-800 mb-4">{t(path.titleKey)}</h3>
                    <p className="text-gray-600 mb-6 h-12 overflow-hidden">{t(path.descriptionKey)}</p>
                    
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                      <div
                        className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-gray-600">{Math.round(progressPercent)}% complete</span>
                      {isPathBadgeEarned && (
                        <Award className="w-5 h-5 text-yellow-500" />
                      )}
                    </div>

                    {isRecommended && (
                      <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        <Star className="inline w-4 h-4 mr-1" />
                        Recommended for You
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Features section */}
        <div className="border-t-2 border-gray-100 pt-16">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">Learning Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Play, title: "Interactive Demos", description: "Visual step-by-step guides" },
              { icon: Volume2, title: "Audio Support", description: "Listen to instructions" },
              { icon: Download, title: "Printable Guides", description: "Take lessons offline" },
              { icon: Award, title: "Certificates", description: "Earn completion badges" }
            ].map((feature, index) => (
              <div key={index} className="text-center p-6">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <feature.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningCenterPage;