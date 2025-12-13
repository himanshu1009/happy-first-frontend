'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { activityAPI, type Activity } from '@/lib/api/activity';
import { weeklyPlanAPI, type CreateWeeklyPlanData } from '@/lib/api/weeklyPlan';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Lock, Calendar, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';

interface SelectedActivity {
  activityId: string;
  name: string;
  cadence: 'daily' | 'weekly';
  targetValue: number;
  baseUnit: string;
  values:[
    {
      tier:number;
      maxVal:number;
      minVal:number;
    }
  ]
}

export default function CreatePlanPage() {
  const router = useRouter();
  const { user, accessToken, isHydrated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<SelectedActivity[]>([]);
  const [step, setStep] = useState<'select' | 'configure'>('select');
  const [error, setError] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [currentDay, setCurrentDay] = useState('');
  const [tiers, setTiers] = useState<number>(1);

  useEffect(() => {
    // Wait for hydration before checking auth
    if (!isHydrated) return;

    if (!accessToken || !user) {
      router.push('/login');
      return;
    }

    // Check if today is Friday (5), Saturday (6), or Sunday (0)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    setCurrentDay(dayNames[dayOfWeek]);
    
    // Unlock on Friday (5), Saturday (6), Sunday (0)
    const unlocked = dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0;
    setIsUnlocked(unlocked);

    if (unlocked) {
      fetchActivities();
    }
  }, [accessToken, user, router, isHydrated]);

  const fetchActivities = async () => {
    try {
      const response = await activityAPI.getlistTiers();
      setActivities(response.data.data.activities);
      setTiers(response.data.data.tier);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
      setError('Failed to load activities. Please try again.');
    }
  };

  const toggleActivity = (activity: Activity) => {
    const exists = selectedActivities.find((a) => a.activityId === activity._id);
    if (exists) {
      setSelectedActivities(selectedActivities.filter((a) => a.activityId !== activity._id));
    } else {
      setSelectedActivities([
        ...selectedActivities,
        {
          activityId: activity._id,
          name: activity.name,
          cadence: activity.allowedCadence[0],
          targetValue: activity.values.find(v=>v.tier===tiers)?.minVal || 0,
          baseUnit: activity.baseUnit,
          values:activity.values
        },
      ]);
    }
  };

  const updateActivityTarget = (activityId: string, field: string, value: string | number) => {
    setSelectedActivities(
      selectedActivities.map((act) =>
        act.activityId === activityId ? { ...act, [field]: value } : act
      )
    );
  };

  const handleNext = () => {
    if (selectedActivities.length < 4) {
      setError('Please select at least 4 activities');
      return;
    }
    setError('');
    setStep('configure');
  };

  const handleBack = () => {
    setStep('select');
    setError('');
  };

  const handleSubmit = async () => {
    // Validate targets
    const hasInvalidTargets = selectedActivities.some((a) => a.targetValue === 0 || !a.targetValue);
    if (hasInvalidTargets) {
      setError('Please set target values for all selected activities');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create weekly plan with selected activities
      const planData: CreateWeeklyPlanData = {
        activities: selectedActivities.map((act) => ({
          activityId: act.activityId,
          cadence: act.cadence,
          targetValue: act.targetValue,
        })),
      };
      
      await weeklyPlanAPI.create(planData);
      
      // Redirect to home page
      router.push('/home');
    } catch (error: unknown) {
      console.error('Failed to create weekly plan:', error);
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(errorMessage || 'Failed to create weekly plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getActivityEmoji = (name: string) => {
    const emojiMap: { [key: string]: string } = {
      'Steps': '👣',
      'Running': '🏃',
      'Cycling': '🚴',
      'Swimming': '🏊',
      'Yoga': '🧘',
      'Meditation': '🧘‍♂️',
      'Reading': '📚',
      'Water': '💧',
      'Sleep': '😴',
      'Exercise': '💪',
    };
    return emojiMap[name] || '🎯';
  };

  // Locked state UI
  if (!isUnlocked) {
    const nextUnlockDay = currentDay === 'Monday' || currentDay === 'Tuesday' || currentDay === 'Wednesday' || currentDay === 'Thursday' 
      ? 'Friday' 
      : 'Friday';
    
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <Lock className="w-20 h-20 mx-auto text-gray-400 mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Plan Creation Locked
                </h1>
                <p className="text-gray-600 mb-4">
                  Weekly plan creation is only available on weekends
                </p>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
                <Calendar className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                <p className="text-sm text-blue-900 font-medium mb-1">
                  Available Days
                </p>
                <div className="flex justify-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    Friday
                  </span>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    Saturday
                  </span>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    Sunday
                  </span>
                </div>
                <p className="text-xs text-blue-700">
                  Today is <span className="font-semibold">{currentDay}</span>
                </p>
              </div>

              <div className="text-sm text-gray-600 mb-6">
                <p>Next unlock: <span className="font-semibold text-gray-900">{nextUnlockDay}</span></p>
              </div>

              <Button
                onClick={() => router.push('/home')}
                className="w-full"
                variant="default"
              >
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-gray-900">
              {step === 'select' ? 'Select Activities' : 'Configure Your Plan'}
            </h1>
            <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">Unlocked</span>
            </div>
          </div>
          <p className="text-gray-600">
            {step === 'select'
              ? 'Choose at least 4 activities for your weekly plan'
              : 'Set your target values and cadence for each activity'}
          </p>
          
          {/* Progress Steps */}
          <div className="flex items-center gap-2 mt-4">
            <div className={`flex-1 h-2 rounded-full ${step === 'select' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
            <div className={`flex-1 h-2 rounded-full ${step === 'configure' ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Step 1: Select Activities */}
        {step === 'select' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-900">
                <span className="font-semibold">Selected: {selectedActivities.length}</span> / Minimum: 4
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activities.map((activity) => {
                const isSelected = selectedActivities.some((a) => a.activityId === activity._id);
                return (
                  <Card
                    key={activity._id}
                    className={`cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-blue-300 hover:shadow'
                    }`}
                    onClick={() => toggleActivity(activity)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{getActivityEmoji(activity.name)}</div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{activity.name}</h3>
                          <p className="text-xs text-gray-600">{activity.baseUnit}</p>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-6 h-6 text-blue-600" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => router.push('/home')}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleNext}
                disabled={selectedActivities.length < 4}
                className="flex-1"
              >
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Configure Activities */}
        {step === 'configure' && (
          <div className="space-y-4">
            {selectedActivities.map((activity) => (
              <Card key={activity.activityId}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="text-3xl">{getActivityEmoji(activity.name)}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{activity.name}</h3>
                      <p className="text-xs text-gray-600">Unit: {activity.baseUnit}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Cadence Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cadence
                      </label>
                      <select
                        value={activity.cadence}
                        onChange={(e) =>
                          updateActivityTarget(activity.activityId, 'cadence', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                      </select>
                    </div>

                    {/* Target Value */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Target Value ({activity.baseUnit})
                      </label>
                      <Input
                        type="number"
                        step="any"
                        min={activity.values.find(v=>v.tier===tiers)?.minVal || 0}
                        max={activity.values.find(v=>v.tier===tiers)?.maxVal || 0}
                        value={activity.targetValue || ''}
                        onChange={(e) => {
                          const minVal = activity.values.find(v=>v.tier===tiers)?.minVal || 0;
                          const maxVal = activity.values.find(v=>v.tier===tiers)?.maxVal || 100000;
                          const inputValue = parseFloat(e.target.value);
                          
                          // Clamp the value between min and max
                          if (!isNaN(inputValue)) {
                            const clampedValue = Math.max(minVal, Math.min(maxVal, inputValue));
                            updateActivityTarget(
                              activity.activityId,
                              'targetValue',
                              clampedValue
                            );
                          } else if (e.target.value === '') {
                            updateActivityTarget(
                              activity.activityId,
                              'targetValue',
                              0
                            );
                          }
                        }}
                        onBlur={(e) => {
                          const minVal = activity.values.find(v=>v.tier===tiers)?.minVal || 0;
                          const maxVal = activity.values.find(v=>v.tier===tiers)?.maxVal || 100000;
                          const inputValue = parseFloat(e.target.value);
                          
                          if (isNaN(inputValue) || inputValue < minVal) {
                            updateActivityTarget(activity.activityId, 'targetValue', minVal);
                          } else if (inputValue > maxVal) {
                            updateActivityTarget(activity.activityId, 'targetValue', maxVal);
                          }
                        }}
                        placeholder={`Enter target in ${activity.baseUnit}`}
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Range: {activity.values.find(v=>v.tier===tiers)?.minVal || 0} - {activity.values.find(v=>v.tier===tiers)?.maxVal || 0} {activity.baseUnit}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleBack}
                variant="outline"
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Creating Plan...' : 'Create Weekly Plan'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
