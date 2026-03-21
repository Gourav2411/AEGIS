import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import { auth, db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

interface FeedbackWidgetProps {
  stage: 'formulation' | 'trial' | 'packaging';
  inputContext: any;
  generatedOutput: any;
}

export default function FeedbackWidget({ stage, inputContext, generatedOutput }: FeedbackWidgetProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async () => {
    if (!auth.currentUser || rating === null) return;
    
    setIsSubmitting(true);
    try {
      const feedbackData = {
        userId: auth.currentUser.uid,
        projectId: auth.currentUser.uid, // Using userId as projectId for now since it's a 1:1 mapping in this app
        stage,
        inputContext: JSON.stringify(inputContext),
        generatedOutput: JSON.stringify(generatedOutput),
        rating,
        comments: comments || null,
        createdAt: new Date()
      };

      await addDoc(collection(db, 'feedbacks'), feedbackData);
      setIsSubmitted(true);
      setShowForm(false);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      alert("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="mt-6 p-4 bg-neon-green/10 border border-neon-green/30 rounded-lg flex items-center justify-center gap-2 text-neon-green text-sm">
        <CheckCircle2 className="w-4 h-4" />
        Feedback submitted for SLM training. Thank you!
      </div>
    );
  }

  return (
    <div className="mt-6 p-4 bg-cyan-950/20 border border-cyan-900/50 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm text-cyan-100 font-bold flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            Rate this Result
          </h4>
          <p className="text-xs text-cyan-500/70 mt-1">Help us train our next-generation Small Language Model (SLM).</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => { setRating(5); setShowForm(true); }}
            className={`p-2 rounded border transition-colors ${rating === 5 ? 'bg-neon-green/20 border-neon-green text-neon-green' : 'border-cyan-900/50 text-cyan-500/70 hover:border-neon-green/50 hover:text-neon-green'}`}
            title="Good Result"
          >
            <ThumbsUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setRating(1); setShowForm(true); }}
            className={`p-2 rounded border transition-colors ${rating === 1 ? 'bg-red-500/20 border-red-500 text-red-500' : 'border-cyan-900/50 text-cyan-500/70 hover:border-red-500/50 hover:text-red-500'}`}
            title="Poor Result"
          >
            <ThumbsDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showForm && (
        <div className="mt-4 pt-4 border-t border-cyan-900/30 animate-in fade-in slide-in-from-top-2">
          <label className="block text-xs text-cyan-500/70 uppercase tracking-widest mb-2">
            Suggested Corrections / Comments (Optional)
          </label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className="w-full bg-jarvis-bg border border-cyan-900/50 rounded p-3 text-sm text-cyan-100 focus:outline-none focus:border-neon-cyan resize-none h-24"
            placeholder="What was wrong? How should it be improved?"
          />
          <div className="mt-3 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || rating === null}
              className="px-4 py-2 bg-cyan-900/30 border border-neon-cyan text-neon-cyan text-xs uppercase tracking-widest hover:bg-neon-cyan hover:text-jarvis-bg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Send className="w-3 h-3" />
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
