import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Briefcase, Award, BookOpen, ChevronLeft, Save, ShieldAlert, CheckCircle2, Stethoscope, Code, Microscope, GraduationCap, Building, RefreshCw } from 'lucide-react';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface ProfilePageProps {
  onBack: () => void;
}

const PROFESSION_CATEGORIES = [
  { id: 'Scientist', label: 'Scientist / Researcher', icon: Microscope },
  { id: 'Medical Doctor', label: 'Medical Doctor / Clinician', icon: Stethoscope },
  { id: 'IT Professional', label: 'IT Professional / Engineer', icon: Code },
  { id: 'Academic', label: 'Academic / Student', icon: GraduationCap },
  { id: 'Industry', label: 'Pharma / Biotech Industry', icon: Building },
  { id: 'Other', label: 'Other', icon: Briefcase },
];

export default function ProfilePage({ onBack }: ProfilePageProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    displayName: '',
    age: '',
    gender: '',
    country: '',
    professionCategory: 'Scientist',
    jobTitle: '',
    organization: '',
    professionalDetails: {} as Record<string, string>
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!auth.currentUser) return;
      try {
        const docRef = doc(db, 'users', auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            displayName: data.displayName || auth.currentUser.displayName || '',
            age: data.age?.toString() || '',
            gender: data.gender || '',
            country: data.country || '',
            professionCategory: data.professionCategory || 'Scientist',
            jobTitle: data.jobTitle || '',
            organization: data.organization || '',
            professionalDetails: data.professionalDetails ? JSON.parse(data.professionalDetails) : {}
          });
        } else {
          // Defaults from Google Auth
          setFormData(prev => ({
            ...prev,
            displayName: auth.currentUser?.displayName || ''
          }));
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setSaving(true);
    setSaveSuccess(false);
    
    try {
      const docRef = doc(db, 'users', auth.currentUser.uid);
      const docSnap = await getDoc(docRef);
      const now = new Date();
      
      const dataToSave = {
        userId: auth.currentUser.uid,
        email: auth.currentUser.email || '',
        displayName: formData.displayName,
        age: formData.age ? parseInt(formData.age, 10) : null,
        gender: formData.gender,
        country: formData.country,
        professionCategory: formData.professionCategory,
        jobTitle: formData.jobTitle,
        organization: formData.organization,
        professionalDetails: JSON.stringify(formData.professionalDetails),
        updatedAt: now,
        ...(docSnap.exists() ? {} : { createdAt: now })
      };

      await setDoc(docRef, dataToSave, { merge: true });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDetailChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      professionalDetails: {
        ...prev.professionalDetails,
        [key]: value
      }
    }));
  };

  if (loading) {
    return <div className="h-full flex items-center justify-center font-mono text-neon-cyan">Loading Profile...</div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full flex flex-col font-mono max-w-4xl mx-auto w-full"
    >
      <div className="mb-6 border-b border-cyan-900/50 pb-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 bg-cyan-950/50 border border-cyan-900/50 text-cyan-400 hover:text-neon-cyan hover:border-neon-cyan transition-colors rounded"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl text-neon-cyan uppercase tracking-widest flex items-center gap-2">
            <User className="w-5 h-5" />
            Researcher Profile
          </h2>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-neon-cyan/10 border border-neon-cyan text-neon-cyan text-sm uppercase tracking-widest hover:bg-neon-cyan hover:text-jarvis-bg transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      {saveSuccess && (
        <div className="mb-6 p-4 bg-neon-green/10 border border-neon-green/30 rounded-lg flex items-center gap-2 text-neon-green text-sm">
          <CheckCircle2 className="w-5 h-5" />
          Profile updated successfully.
        </div>
      )}

      <div className="flex-1 overflow-y-auto pr-2 space-y-8 pb-12">
        
        {/* Personal Details */}
        <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-6">
          <h3 className="text-sm text-cyan-400 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-cyan-900/30 pb-2">
            <User className="w-4 h-4" /> Personal Demographics
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs text-cyan-500/70 uppercase tracking-widest mb-2">Email (Google Auth)</label>
              <input 
                type="text" 
                value={auth.currentUser?.email || ''} 
                disabled 
                className="w-full bg-jarvis-bg/50 border border-cyan-900/30 rounded p-3 text-sm text-cyan-500/50 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs text-cyan-500/70 uppercase tracking-widest mb-2">Full Name</label>
              <input 
                type="text" 
                value={formData.displayName}
                onChange={e => setFormData({...formData, displayName: e.target.value})}
                className="w-full bg-jarvis-bg border border-cyan-900/50 rounded p-3 text-sm text-cyan-100 focus:outline-none focus:border-neon-cyan"
                placeholder="Dr. Jane Doe"
              />
            </div>
            <div>
              <label className="block text-xs text-cyan-500/70 uppercase tracking-widest mb-2">Age</label>
              <input 
                type="number" 
                value={formData.age}
                onChange={e => setFormData({...formData, age: e.target.value})}
                className="w-full bg-jarvis-bg border border-cyan-900/50 rounded p-3 text-sm text-cyan-100 focus:outline-none focus:border-neon-cyan"
                placeholder="35"
                min="18"
                max="120"
              />
            </div>
            <div>
              <label className="block text-xs text-cyan-500/70 uppercase tracking-widest mb-2">Gender</label>
              <select 
                value={formData.gender}
                onChange={e => setFormData({...formData, gender: e.target.value})}
                className="w-full bg-jarvis-bg border border-cyan-900/50 rounded p-3 text-sm text-cyan-100 focus:outline-none focus:border-neon-cyan appearance-none"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-cyan-500/70 uppercase tracking-widest mb-2">Country</label>
              <input 
                type="text" 
                value={formData.country}
                onChange={e => setFormData({...formData, country: e.target.value})}
                className="w-full bg-jarvis-bg border border-cyan-900/50 rounded p-3 text-sm text-cyan-100 focus:outline-none focus:border-neon-cyan"
                placeholder="United States"
              />
            </div>
          </div>
        </div>

        {/* Professional Category */}
        <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-6">
          <h3 className="text-sm text-cyan-400 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-cyan-900/30 pb-2">
            <Briefcase className="w-4 h-4" /> Professional Classification
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {PROFESSION_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setFormData({...formData, professionCategory: cat.id})}
                className={`p-4 rounded-lg border flex flex-col items-center justify-center gap-3 transition-all ${
                  formData.professionCategory === cat.id 
                    ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan' 
                    : 'bg-jarvis-bg border-cyan-900/50 text-cyan-500/70 hover:border-cyan-400/50 hover:text-cyan-300'
                }`}
              >
                <cat.icon className="w-6 h-6" />
                <span className="text-xs text-center uppercase tracking-widest">{cat.label}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs text-cyan-500/70 uppercase tracking-widest mb-2">Current Job Title</label>
              <input 
                type="text" 
                value={formData.jobTitle}
                onChange={e => setFormData({...formData, jobTitle: e.target.value})}
                className="w-full bg-jarvis-bg border border-cyan-900/50 rounded p-3 text-sm text-cyan-100 focus:outline-none focus:border-neon-cyan"
                placeholder="e.g. Principal Investigator"
              />
            </div>
            <div>
              <label className="block text-xs text-cyan-500/70 uppercase tracking-widest mb-2">Organization / Institution</label>
              <input 
                type="text" 
                value={formData.organization}
                onChange={e => setFormData({...formData, organization: e.target.value})}
                className="w-full bg-jarvis-bg border border-cyan-900/50 rounded p-3 text-sm text-cyan-100 focus:outline-none focus:border-neon-cyan"
                placeholder="e.g. Stanford University"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Professional Details */}
        <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-6">
          <h3 className="text-sm text-cyan-400 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-cyan-900/30 pb-2">
            <Award className="w-4 h-4" /> Domain Expertise ({formData.professionCategory})
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {formData.professionCategory === 'Scientist' && (
              <>
                <div className="md:col-span-2">
                  <label className="block text-xs text-cyan-500/70 uppercase tracking-widest mb-2">Primary Research Focus</label>
                  <input 
                    type="text" 
                    value={formData.professionalDetails.researchFocus || ''}
                    onChange={e => handleDetailChange('researchFocus', e.target.value)}
                    className="w-full bg-jarvis-bg border border-cyan-900/50 rounded p-3 text-sm text-cyan-100 focus:outline-none focus:border-neon-cyan"
                    placeholder="e.g. Oncology, Protein Folding, CRISPR"
                  />
                </div>
                <div>
                  <label className="block text-xs text-cyan-500/70 uppercase tracking-widest mb-2">Number of Publications</label>
                  <input 
                    type="number" 
                    value={formData.professionalDetails.publications || ''}
                    onChange={e => handleDetailChange('publications', e.target.value)}
                    className="w-full bg-jarvis-bg border border-cyan-900/50 rounded p-3 text-sm text-cyan-100 focus:outline-none focus:border-neon-cyan"
                    placeholder="e.g. 42"
                  />
                </div>
                <div>
                  <label className="block text-xs text-cyan-500/70 uppercase tracking-widest mb-2">Patents Held</label>
                  <input 
                    type="number" 
                    value={formData.professionalDetails.patents || ''}
                    onChange={e => handleDetailChange('patents', e.target.value)}
                    className="w-full bg-jarvis-bg border border-cyan-900/50 rounded p-3 text-sm text-cyan-100 focus:outline-none focus:border-neon-cyan"
                    placeholder="e.g. 3"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-cyan-500/70 uppercase tracking-widest mb-2">Key Discoveries / Projects</label>
                  <textarea 
                    value={formData.professionalDetails.discoveries || ''}
                    onChange={e => handleDetailChange('discoveries', e.target.value)}
                    className="w-full bg-jarvis-bg border border-cyan-900/50 rounded p-3 text-sm text-cyan-100 focus:outline-none focus:border-neon-cyan h-24 resize-none"
                    placeholder="Briefly describe your most significant contributions..."
                  />
                </div>
              </>
            )}

            {formData.professionCategory === 'Medical Doctor' && (
              <>
                <div>
                  <label className="block text-xs text-cyan-500/70 uppercase tracking-widest mb-2">Medical Specialty</label>
                  <input 
                    type="text" 
                    value={formData.professionalDetails.specialty || ''}
                    onChange={e => handleDetailChange('specialty', e.target.value)}
                    className="w-full bg-jarvis-bg border border-cyan-900/50 rounded p-3 text-sm text-cyan-100 focus:outline-none focus:border-neon-cyan"
                    placeholder="e.g. Neurology, Cardiology"
                  />
                </div>
                <div>
                  <label className="block text-xs text-cyan-500/70 uppercase tracking-widest mb-2">Years of Clinical Experience</label>
                  <input 
                    type="number" 
                    value={formData.professionalDetails.experience || ''}
                    onChange={e => handleDetailChange('experience', e.target.value)}
                    className="w-full bg-jarvis-bg border border-cyan-900/50 rounded p-3 text-sm text-cyan-100 focus:outline-none focus:border-neon-cyan"
                    placeholder="e.g. 15"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-cyan-500/70 uppercase tracking-widest mb-2">Clinical Trials Participated In</label>
                  <textarea 
                    value={formData.professionalDetails.clinicalTrials || ''}
                    onChange={e => handleDetailChange('clinicalTrials', e.target.value)}
                    className="w-full bg-jarvis-bg border border-cyan-900/50 rounded p-3 text-sm text-cyan-100 focus:outline-none focus:border-neon-cyan h-24 resize-none"
                    placeholder="List any relevant clinical trials you have overseen or participated in..."
                  />
                </div>
              </>
            )}

            {formData.professionCategory === 'IT Professional' && (
              <>
                <div className="md:col-span-2">
                  <label className="block text-xs text-cyan-500/70 uppercase tracking-widest mb-2">Primary Tech Stack / Domain</label>
                  <input 
                    type="text" 
                    value={formData.professionalDetails.techStack || ''}
                    onChange={e => handleDetailChange('techStack', e.target.value)}
                    className="w-full bg-jarvis-bg border border-cyan-900/50 rounded p-3 text-sm text-cyan-100 focus:outline-none focus:border-neon-cyan"
                    placeholder="e.g. Python, PyTorch, Cloud Architecture, Bioinformatics"
                  />
                </div>
                <div>
                  <label className="block text-xs text-cyan-500/70 uppercase tracking-widest mb-2">GitHub / Portfolio URL</label>
                  <input 
                    type="text" 
                    value={formData.professionalDetails.portfolio || ''}
                    onChange={e => handleDetailChange('portfolio', e.target.value)}
                    className="w-full bg-jarvis-bg border border-cyan-900/50 rounded p-3 text-sm text-cyan-100 focus:outline-none focus:border-neon-cyan"
                    placeholder="https://github.com/username"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-cyan-500/70 uppercase tracking-widest mb-2">Key Projects / Systems Built</label>
                  <textarea 
                    value={formData.professionalDetails.projects || ''}
                    onChange={e => handleDetailChange('projects', e.target.value)}
                    className="w-full bg-jarvis-bg border border-cyan-900/50 rounded p-3 text-sm text-cyan-100 focus:outline-none focus:border-neon-cyan h-24 resize-none"
                    placeholder="Describe relevant systems, pipelines, or models you have built..."
                  />
                </div>
              </>
            )}

            {['Academic', 'Industry', 'Other'].includes(formData.professionCategory) && (
              <>
                <div className="md:col-span-2">
                  <label className="block text-xs text-cyan-500/70 uppercase tracking-widest mb-2">Field of Study / Industry Sector</label>
                  <input 
                    type="text" 
                    value={formData.professionalDetails.field || ''}
                    onChange={e => handleDetailChange('field', e.target.value)}
                    className="w-full bg-jarvis-bg border border-cyan-900/50 rounded p-3 text-sm text-cyan-100 focus:outline-none focus:border-neon-cyan"
                    placeholder="e.g. Computational Biology, Drug Manufacturing"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-cyan-500/70 uppercase tracking-widest mb-2">Key Focus Areas / Thesis / Projects</label>
                  <textarea 
                    value={formData.professionalDetails.focusAreas || ''}
                    onChange={e => handleDetailChange('focusAreas', e.target.value)}
                    className="w-full bg-jarvis-bg border border-cyan-900/50 rounded p-3 text-sm text-cyan-100 focus:outline-none focus:border-neon-cyan h-24 resize-none"
                    placeholder="Describe your main areas of focus..."
                  />
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </motion.div>
  );
}
