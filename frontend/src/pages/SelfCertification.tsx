import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import toast from 'react-hot-toast';
import {
  CheckCircle, Award, BookOpen, ClipboardCheck,
  AlertCircle, Download, ArrowLeft, Shield
} from 'lucide-react';

interface Eligibility {
  totalChapters: number;
  completedChapters: number;
  progressPct: number;
  courseCompleted: boolean;
  allPostPassed: boolean;
  selfCertified: boolean;
  selfCertifiedAt: string | null;
  certificateIssued: boolean;
  certificateNumber: string | null;
  certificateIssuedAt: string | null;
  canSelfCertify: boolean;
  canDownloadCertificate: boolean;
}

export default function SelfCertification() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [elig, setElig] = useState<Eligibility | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [checked, setChecked] = useState(false);
  const [courseName, setCourseName] = useState('');

  useEffect(() => {
    // Load eligibility + course name
    Promise.all([
      api.get(`/certificates/eligibility/${courseId}`),
      api.get(`/courses`)
    ]).then(([eligRes, coursesRes]) => {
      setElig(eligRes.data);
      const course = coursesRes.data.find((c: any) => c.id === courseId);
      if (course) setCourseName(course.title);
    }).catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false));
  }, [courseId]);

  const handleSubmit = async () => {
    if (!checked) return toast.error('Please check the declaration box to proceed');
    setSubmitting(true);
    try {
      const res = await api.post(`/certificates/self-certify/${courseId}`, {
        declaration: 'I hereby certify that I have completed and understood all the course materials.'
      });
      toast.success('🎉 Certificate generated successfully!');
      // Reload eligibility
      const eligRes = await api.get(`/certificates/eligibility/${courseId}`);
      setElig(eligRes.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!elig) return <div className="error">Could not load eligibility data.</div>;

  return (
    <div className="selfcert-page">
      <div className="selfcert-card">

        {/* Back button */}
        <button className="btn-outline btn-sm selfcert-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={15} /> Back to Course
        </button>

        {/* Header */}
        <div className="selfcert-header">
          <div className="selfcert-icon">
            <Award size={40} />
          </div>
          <h2>Self-Certification & Certificate</h2>
          <p>{courseName}</p>
        </div>

        {/* Progress Checklist */}
        <div className="selfcert-checklist">
          <h4>Completion Status</h4>

          <div className={`selfcert-check-item ${elig.courseCompleted ? 'done' : 'pending'}`}>
            {elig.courseCompleted ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <div>
              <strong>Course Materials Completed</strong>
              <span>{elig.completedChapters} / {elig.totalChapters} chapters done ({elig.progressPct}%)</span>
            </div>
          </div>

          <div className={`selfcert-check-item ${elig.allPostPassed ? 'done' : 'pending'}`}>
            {elig.allPostPassed ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <div>
              <strong>All Post Assessments Passed</strong>
              <span>{elig.allPostPassed ? 'All sections passed with 60% or above' : 'Complete all post assessments with passing score'}</span>
            </div>
          </div>

          <div className={`selfcert-check-item ${elig.selfCertified ? 'done' : 'pending'}`}>
            {elig.selfCertified ? <CheckCircle size={18} /> : <ClipboardCheck size={18} />}
            <div>
              <strong>Self-Certification</strong>
              <span>{elig.selfCertified ? `Certified on ${new Date(elig.selfCertifiedAt!).toLocaleDateString('en-IN')}` : 'Pending'}</span>
            </div>
          </div>

          <div className={`selfcert-check-item ${elig.certificateIssued ? 'done' : 'pending'}`}>
            {elig.certificateIssued ? <CheckCircle size={18} /> : <Award size={18} />}
            <div>
              <strong>Certificate Issued</strong>
              <span>{elig.certificateIssued ? elig.certificateNumber! : 'Will be issued after self-certification'}</span>
            </div>
          </div>
        </div>

        {/* Certificate already issued */}
        {elig.certificateIssued && (
          <div className="selfcert-issued">
            <div className="selfcert-issued-banner">
              <Award size={28} />
              <div>
                <strong>🎉 Certificate Issued!</strong>
                <span>Certificate No: {elig.certificateNumber}</span>
                <span>Issued: {new Date(elig.certificateIssuedAt!).toLocaleDateString('en-IN')}</span>
              </div>
            </div>
            <button className="btn-primary" onClick={() => navigate(`/certificate/${courseId}`)}>
              <Download size={16} /> View & Download Certificate
            </button>
          </div>
        )}

        {/* Self-certification form */}
        {elig.canSelfCertify && !elig.certificateIssued && (
          <div className="selfcert-form">
            <div className="selfcert-declaration-box">
              <Shield size={20} />
              <div className="selfcert-declaration-text">
                <strong>Declaration</strong>
                <p>I, <strong>{user?.name}</strong>, hereby declare that:</p>
                <ul>
                  <li>I have completed all the learning materials of this course</li>
                  <li>I have watched all videos and read all study materials</li>
                  <li>I have appeared and passed all required assessments</li>
                  <li>The information provided is true to the best of my knowledge</li>
                </ul>
              </div>
            </div>

            <label className="selfcert-checkbox-label">
              <input
                type="checkbox"
                checked={checked}
                onChange={e => setChecked(e.target.checked)}
              />
              <span>I agree to the above declaration and wish to self-certify my course completion</span>
            </label>

            <button
              className="btn-primary selfcert-submit-btn"
              onClick={handleSubmit}
              disabled={submitting || !checked}
            >
              {submitting ? 'Generating Certificate...' : '🎓 Submit & Generate Certificate'}
            </button>
          </div>
        )}

        {/* Not yet eligible */}
        {!elig.canSelfCertify && !elig.certificateIssued && (
          <div className="selfcert-not-eligible">
            <AlertCircle size={20} />
            <div>
              <strong>Not yet eligible for certification</strong>
              <p>Please complete all course materials and pass all post-assessments to unlock the certificate.</p>
            </div>
            <button className="btn-primary btn-sm" onClick={() => navigate(`/course/${courseId}`)}>
              <BookOpen size={14} /> Continue Learning
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
