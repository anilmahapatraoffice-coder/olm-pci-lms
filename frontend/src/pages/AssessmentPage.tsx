import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import {
  CheckCircle, XCircle, AlertCircle, RefreshCw, Clock,
  ChevronRight, ChevronLeft, Send, RotateCcw, Award
} from 'lucide-react';

interface Question { id: string; question_text: string; options: string[]; order_index: number; }
interface Submission { score: number; attempt_number: number; submitted_at: string; }
interface ReassessmentRequest { id: string; status: string; requested_at: string; }

interface AssessmentData {
  id: string; title: string; type: string;
  pass_score: number; max_attempts: number;
  questions: Question[];
  submissions: Submission[];
  attemptsUsed: number; attemptsLeft: number; totalAllowed: number;
  passed: boolean; bestScore: number | null;
  latestRequest: ReassessmentRequest | null;
}

type Phase = 'intro' | 'taking' | 'result' | 'history';

export default function AssessmentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<AssessmentData | null>(null);
  const [phase, setPhase] = useState<Phase>('intro');
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [current, setCurrent] = useState(0);
  const [result, setResult] = useState<{ score: number; passed: boolean; correct: number; total: number; attemptsLeft: number; attemptNumber: number; passScore: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reqReason, setReqReason] = useState('');
  const [reqLoading, setReqLoading] = useState(false);

  const load = () => {
    setLoading(true);
    api.get(`/assessments/${id}`)
      .then(r => setData(r.data))
      .catch(() => toast.error('Could not load assessment'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const startAssessment = () => {
    setAnswers({});
    setCurrent(0);
    setPhase('taking');
  };

  const selectAnswer = (qIdx: number, optIdx: number) => {
    setAnswers(a => ({ ...a, [qIdx]: optIdx }));
  };

  const submit = async () => {
    if (!data) return;
    const answered = Object.keys(answers).length;
    if (answered < data.questions.length) {
      toast.error(`Please answer all questions. (${answered}/${data.questions.length} answered)`);
      return;
    }
    setSubmitting(true);
    try {
      const answerArray = data.questions.map((_, i) => answers[i] ?? -1);
      const res = await api.post(`/assessments/${id}/submit`, { answers: answerArray });
      setResult(res.data);
      setPhase('result');
      load(); // refresh attempt data
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const requestReassessment = async () => {
    setReqLoading(true);
    try {
      await api.post(`/assessments/${id}/request-reassessment`, { reason: reqReason });
      toast.success('Reassessment request sent to admin!');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Request failed');
    } finally {
      setReqLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading assessment...</div>;
  if (!data) return <div className="error">Assessment not found.</div>;

  const q = data.questions[current];
  const totalQ = data.questions.length;

  // ── INTRO SCREEN ──────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="assessment-page">
        <div className="assessment-card">
          <div className={`assess-type-badge ${data.type}`}>
            {data.type === 'pre' ? 'Pre Assessment' : 'Post Assessment'}
          </div>
          <h2>{data.title || `${data.type === 'pre' ? 'Pre' : 'Post'} Assessment`}</h2>

          <div className="assess-meta-row">
            <div className="assess-meta-item">
              <AlertCircle size={18} />
              <span><strong>{totalQ}</strong> Questions</span>
            </div>
            <div className="assess-meta-item">
              <Award size={18} />
              <span>Pass Score: <strong>{data.pass_score}%</strong></span>
            </div>
            <div className="assess-meta-item">
              <RefreshCw size={18} />
              <span>Attempts: <strong>{data.attemptsUsed}/{data.totalAllowed}</strong></span>
            </div>
          </div>

          {/* Attempt history */}
          {data.submissions.length > 0 && (
            <div className="attempt-history">
              <h4>Your Attempt History</h4>
              <div className="attempt-list">
                {data.submissions.map(s => (
                  <div key={s.attempt_number} className={`attempt-row ${s.score >= data.pass_score ? 'pass' : 'fail'}`}>
                    <span className="attempt-num">Attempt {s.attempt_number}</span>
                    <span className="attempt-score">{s.score}%</span>
                    <span className={`attempt-badge ${s.score >= data.pass_score ? 'pass' : 'fail'}`}>
                      {s.score >= data.pass_score ? <><CheckCircle size={13} /> Pass</> : <><XCircle size={13} /> Fail</>}
                    </span>
                    <span className="attempt-date">{new Date(s.submitted_at).toLocaleDateString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status banners */}
          {data.passed && (
            <div className="status-banner success">
              <CheckCircle size={20} /> You have passed this assessment with {data.bestScore}%!
            </div>
          )}
          {!data.passed && data.attemptsLeft === 0 && !data.latestRequest && (
            <div className="status-banner warning">
              <AlertCircle size={20} /> No attempts remaining. Request a reassessment below.
            </div>
          )}
          {data.latestRequest?.status === 'pending' && (
            <div className="status-banner info">
              <Clock size={20} /> Reassessment request pending admin approval.
            </div>
          )}
          {data.latestRequest?.status === 'approved' && !data.passed && (
            <div className="status-banner success">
              <CheckCircle size={20} /> Reassessment approved! You have {data.attemptsLeft} attempt(s) remaining.
            </div>
          )}
          {data.latestRequest?.status === 'rejected' && (
            <div className="status-banner error">
              <XCircle size={20} /> Your reassessment request was rejected.
            </div>
          )}

          {/* Action buttons */}
          <div className="assess-actions">
            {data.attemptsLeft > 0 && (
              <button className="btn-primary" onClick={startAssessment}>
                {data.attemptsUsed === 0 ? 'Start Assessment' : 'Retake Assessment'}
                <ChevronRight size={16} />
              </button>
            )}
            {!data.passed && data.attemptsLeft === 0 && !data.latestRequest && (
              <div className="reassess-request-form">
                <h4><RotateCcw size={16} /> Request Reassessment</h4>
                <textarea
                  placeholder="Reason for reassessment request (optional)..."
                  value={reqReason}
                  onChange={e => setReqReason(e.target.value)}
                  rows={3}
                />
                <button className="btn-warning" onClick={requestReassessment} disabled={reqLoading}>
                  {reqLoading ? 'Sending...' : 'Send Reassessment Request'}
                </button>
              </div>
            )}
            <button className="btn-outline btn-sm" onClick={() => navigate(-1)}>
              ← Back to Course
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── TAKING SCREEN ─────────────────────────────────────────────────────────
  if (phase === 'taking') {
    const progress = Math.round(((current + 1) / totalQ) * 100);
    return (
      <div className="assessment-page">
        <div className="assessment-card taking">
          {/* Progress bar */}
          <div className="assess-progress-wrap">
            <div className="assess-progress-bar" style={{ width: `${progress}%` }} />
          </div>
          <div className="assess-q-counter">
            Question <strong>{current + 1}</strong> of <strong>{totalQ}</strong>
          </div>

          {/* Question */}
          <div className="assess-question">
            <p>{q.question_text}</p>
          </div>

          {/* Options */}
          <div className="assess-options">
            {(Array.isArray(q.options) ? q.options : JSON.parse(q.options as unknown as string) as string[]).map((opt, i) => (
              <button
                key={i}
                className={`assess-option ${answers[current] === i ? 'selected' : ''}`}
                onClick={() => selectAnswer(current, i)}
              >
                <span className="option-letter">{String.fromCharCode(65 + i)}</span>
                <span>{opt}</span>
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="assess-nav">
            <button className="btn-outline btn-sm" onClick={() => setCurrent(c => c - 1)} disabled={current === 0}>
              <ChevronLeft size={16} /> Previous
            </button>
            <div className="assess-dot-nav">
              {data.questions.map((_, i) => (
                <button key={i}
                  className={`dot ${answers[i] !== undefined ? 'answered' : ''} ${i === current ? 'active' : ''}`}
                  onClick={() => setCurrent(i)} />
              ))}
            </div>
            {current < totalQ - 1 ? (
              <button className="btn-primary btn-sm" onClick={() => setCurrent(c => c + 1)}>
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button className="btn-primary btn-sm" onClick={submit} disabled={submitting}>
                <Send size={14} /> {submitting ? 'Submitting...' : 'Submit'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── RESULT SCREEN ─────────────────────────────────────────────────────────
  if (phase === 'result' && result) {
    return (
      <div className="assessment-page">
        <div className="assessment-card result">
          <div className={`result-icon ${result.passed ? 'pass' : 'fail'}`}>
            {result.passed ? <CheckCircle size={56} /> : <XCircle size={56} />}
          </div>
          <h2>{result.passed ? '🎉 Congratulations! You Passed!' : 'Better Luck Next Time'}</h2>

          {/* Score ring */}
          <div className="score-display">
            <div className={`score-circle ${result.passed ? 'pass' : 'fail'}`}>
              <span className="score-num">{result.score}%</span>
              <span className="score-label">Your Score</span>
            </div>
            <div className="score-details">
              <div className="score-detail-row">
                <CheckCircle size={15} className="green" />
                <span>Correct: <strong>{result.correct}/{result.total}</strong></span>
              </div>
              <div className="score-detail-row">
                <Award size={15} />
                <span>Pass Mark: <strong>{data.pass_score}%</strong></span>
              </div>
              <div className="score-detail-row">
                <RefreshCw size={15} />
                <span>Attempt: <strong>{result.attemptNumber}</strong></span>
              </div>
              <div className="score-detail-row">
                <Clock size={15} />
                <span>Remaining: <strong>{result.attemptsLeft}</strong></span>
              </div>
            </div>
          </div>

          <div className="result-actions">
            {!result.passed && result.attemptsLeft > 0 && (
              <button className="btn-primary" onClick={startAssessment}>
                <RotateCcw size={16} /> Retake Assessment
              </button>
            )}
            {!result.passed && result.attemptsLeft === 0 && (
              <button className="btn-warning" onClick={() => setPhase('intro')}>
                <RotateCcw size={16} /> Request Reassessment
              </button>
            )}
            <button className="btn-outline" onClick={() => navigate(-1)}>
              ← Back to Course
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
