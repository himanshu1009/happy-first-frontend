'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowLeft, UserPlus, CheckCircle, AlertCircle } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';

export default function AddFamilyMemberPage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    relationship: '',
    age: '',
    gender: 'other' as 'male' | 'female' | 'other',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const maxMembers = 5;
  const currentMembers = user?.familyMembers?.length || 0;
  const canAddMore = currentMembers < maxMembers;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }

    if (!formData.relationship.trim()) {
      setError('Relationship is required');
      return false;
    }

    if (!formData.age || parseInt(formData.age) <= 0) {
      setError('Valid age is required');
      return false;
    }

    if (parseInt(formData.age) > 120) {
      setError('Please enter a valid age');
      return false;
    }

    if (!formData.gender) {
      setError('Gender is required');
      return false;
    }

    if (!canAddMore) {
      setError('Maximum 5 family members allowed');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authAPI.addFamilyMember({
        name: formData.name.trim(),
        relationship: formData.relationship.trim(),
        age: parseInt(formData.age),
        gender: formData.gender,
        level: 'newbie',
      });

      // Update user in store with new family member
      if (response.data.data) {
        setUser(response.data.data);
      }

      setSuccess(true);
      
      // Redirect to profile selection after 1.5 seconds
      setTimeout(() => {
        router.push('/select-profile');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add family member. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const relationships = [
    { value: 'spouse', label: 'Spouse/Partner' },
    { value: 'child', label: 'Child' },
    { value: 'parent', label: 'Parent' },
    { value: 'sibling', label: 'Sibling' },
    { value: 'grandparent', label: 'Grandparent' },
    { value: 'grandchild', label: 'Grandchild' },
    { value: 'other', label: 'Other' },
  ];

  if (!canAddMore) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4 py-8">
          <div className="max-w-md mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-white rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Add Family Member</h1>
            </div>

            <Card className="p-6 text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-10 h-10 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Maximum Limit Reached</h3>
              <p className="text-gray-600 mb-4">
                You have already added {maxMembers} family members. This is the maximum allowed.
              </p>
              <Button
                onClick={() => router.push('/select-profile')}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
              >
                View Profiles
              </Button>
            </Card>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4 py-8">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Add Family Member</h1>
          </div>

          {/* Counter */}
          <div className="text-center mb-6">
            <p className="text-sm text-gray-600">
              {currentMembers} of {maxMembers} family members added
            </p>
          </div>

          <Card className="p-6">
            {success ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Member Added!</h3>
                <p className="text-gray-600">Family member has been added successfully.</p>
                <p className="text-sm text-gray-500 mt-2">Redirecting...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter name"
                    disabled={loading}
                    className="w-full"
                  />
                </div>

                {/* Relationship */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Relationship <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="relationship"
                    value={formData.relationship}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select relationship</option>
                    {relationships.map(rel => (
                      <option key={rel.value} value={rel.value}>
                        {rel.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Age */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Age <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    placeholder="Enter age"
                    min="1"
                    max="120"
                    disabled={loading}
                    className="w-full"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'male', label: 'Male', color: 'blue' },
                      { value: 'female', label: 'Female', color: 'pink' },
                      { value: 'other', label: 'Other', color: 'purple' },
                    ].map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, gender: option.value as any }))}
                        disabled={loading}
                        className={`py-3 px-4 rounded-lg border-2 transition-all ${
                          formData.gender === option.value
                            ? `border-${option.color}-500 bg-${option.color}-50 text-${option.color}-700`
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Adding Member...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <UserPlus className="w-5 h-5" />
                      Add Family Member
                    </div>
                  )}
                </Button>
              </form>
            )}
          </Card>

          {/* Info Box */}
          {!success && (
            <Card className="mt-4 p-4 bg-blue-50 border-blue-200">
              <p className="text-sm text-gray-700">
                <strong>Note:</strong> Each family member will have their own profile with separate progress tracking and activity history.
              </p>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
