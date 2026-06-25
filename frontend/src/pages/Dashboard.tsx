import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { BookOpen, Clock, TrendingUp, User, Award, Shield } from 'lucide-react';

interface EnrolledCourse {
  id: string;
  title: string;
  thumbnail: string;
  total_duration: string;
  enrolled_at: string;
  total_chapters: number;
  completed_chapters: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/me/courses')
      .then(r => setCourses(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const progress = (c: EnrolledCourse) =>
    c.total_chapters > 0 ? Math.round((c.completed_chapters / c.total_chapters) * 100) : 0;

  return (
    <div className="dashboard-page">
      {/* Profile card */}
      <div className="profile-card">
        <div className="profile-avatar">
          <User size={32} />
        </div>
        <div className="profile-info">
          <h2>{user?.name}</h2>
          <div className="profile-meta">
            {user?.designation && <span>{user.designation}</span>}
            {user?.district && <span>{user.district}</span>}
            {user?.block && <span>{user.block}</span>}
            {user?.gp && <span>{user.gp}</span>}
            <span>📱 {user?.mobile}</span>
          </div>
        </div>
        <Link to="/profile" className="btn-outline btn-sm">Edit Profile</Link>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <BookOpen size={24} />
          <div>
            <strong>{courses.length}</strong>
            <span>Enrolled Courses</span>
          </div>
        </div>
        <div className="stat-card">
          <TrendingUp size={24} />
          <div>
            <strong>{courses.filter(c => progress(c) === 100).length}</strong>
            <span>Completed</span>
          </div>
        </div>
        <div className="stat-card">
          <Clock size={24} />
          <div>
            <strong>{courses.filter(c => progress(c) > 0 && progress(c) < 100).length}</strong>
            <span>In Progress</span>
          </div>
        </div>
      </div>

      {/* My Courses */}
      <div className="section-header">
        <h3>My Courses</h3>
        <Link to="/" className="btn-outline btn-sm">Browse More</Link>
      </div>

      {loading ? (
        <div className="loading">Loading your courses...</div>
      ) : courses.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={48} />
          <p>You haven't enrolled in any courses yet.</p>
          <Link to="/" className="btn-primary">Browse Courses</Link>
        </div>
      ) : (
        <div className="courses-grid">
          {courses.map(course => {
            const pct = progress(course);
            return (
              <div key={course.id} className="course-card">
                {course.thumbnail ? (
                  <img src={course.thumbnail} alt={course.title} className="course-thumb" />
                ) : (
                  <div className="course-thumb-placeholder"><BookOpen size={40} /></div>
                )}
                <div className="course-body">
                  <h3>{course.title}</h3>
                  <div className="progress-bar-wrap">
                    <div className="progress-bar" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="progress-label">
                    <span>{pct}% complete</span>
                    <span>{course.completed_chapters}/{course.total_chapters} chapters</span>
                  </div>
                  <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                    <Link to={`/course/${course.id}`} className="btn-primary">
                      {pct === 0 ? 'Start' : pct === 100 ? 'Review' : 'Continue'}
                    </Link>
                    <Link to={`/certify/${course.id}`} className="btn-cert-sm" title="Self-Certification & Certificate">
                      <Shield size={13}/> {pct === 100 ? 'Certify / Certificate' : 'Certification'}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
