import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import { ChevronDown, ChevronUp, CheckCircle, Circle, FileText, Video, Image, BookOpen, ClipboardList } from 'lucide-react';

interface Chapter { id: string; title: string; type: string; content_url: string; duration: string; }
interface Assessment { id: string; type: string; title: string; }
interface Section { id: string; title: string; chapters: Chapter[]; assessments: Assessment[]; }
interface CourseData { id: string; title: string; description: string; thumbnail: string; total_duration: string; sections: Section[]; completedChapters: string[]; }

const typeIcon: Record<string, React.ReactNode> = {
  pdf: <FileText size={16} />, video: <Video size={16} />, image: <Image size={16} />, resource: <BookOpen size={16} />
};

export default function CoursePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<CourseData | null>(null);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [activeContent, setActiveContent] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/courses/${id}`)
      .then(r => {
        setCourse(r.data);
        if (r.data.sections?.length) setOpenSection(r.data.sections[0].id);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const enroll = async () => {
    try {
      await api.post(`/courses/${id}/enroll`);
      toast.success('Enrolled successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Enrollment failed');
    }
  };

  const markComplete = async (chapterId: string) => {
    try {
      await api.post(`/courses/progress/${chapterId}`);
      setCourse(c => c ? { ...c, completedChapters: [...c.completedChapters, chapterId] } : c);
    } catch {}
  };

  if (loading) return <div className="loading">Loading course...</div>;
  if (!course) return <div className="error">Course not found.</div>;

  const totalChapters = course.sections?.reduce((s, sec) => s + sec.chapters.length, 0) || 0;
  const doneChapters = course.completedChapters?.length || 0;
  const pct = totalChapters > 0 ? Math.round((doneChapters / totalChapters) * 100) : 0;

  return (
    <div className="course-page">
      {/* Header */}
      <div className="course-header">
        {course.thumbnail && <img src={course.thumbnail} alt={course.title} className="course-hero-img" />}
        <div className="course-header-info">
          <h1>{course.title}</h1>
          <p>{course.description}</p>
          <div className="course-progress-bar-wrap">
            <div className="course-progress-bar" style={{ width: `${pct}%` }} />
          </div>
          <span className="progress-text">{pct}% Complete ({doneChapters}/{totalChapters} chapters)</span>
          <button className="btn-primary" onClick={enroll}>Enroll / Continue</button>
        </div>
      </div>

      <div className="course-layout">
        {/* Sidebar: curriculum */}
        <div className="curriculum">
          <h3>Course Curriculum</h3>
          {course.sections?.map(section => (
            <div key={section.id} className="section-item">
              <button
                className="section-toggle"
                onClick={() => setOpenSection(openSection === section.id ? null : section.id)}
              >
                <span>{section.title}</span>
                {openSection === section.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {openSection === section.id && (
                <ul className="chapter-list">
                  {section.assessments?.filter(a => a.type === 'pre').map(a => (
                    <li key={a.id} className="chapter-item assessment-item"
                      onClick={() => navigate(`/assessment/${a.id}`)}>
                      <ClipboardList size={14} /> Pre-Assessment
                    </li>
                  ))}
                  {section.chapters.map(ch => {
                    const done = course.completedChapters.includes(ch.id);
                    return (
                      <li
                        key={ch.id}
                        className={`chapter-item ${activeContent?.id === ch.id ? 'active' : ''} ${done ? 'done' : ''}`}
                        onClick={() => setActiveContent(ch)}
                      >
                        {done ? <CheckCircle size={14} className="check" /> : <Circle size={14} />}
                        {typeIcon[ch.type] || <BookOpen size={14} />}
                        <span>{ch.title}</span>
                        {ch.duration && <small>{ch.duration}</small>}
                      </li>
                    );
                  })}
                  {section.assessments?.filter(a => a.type === 'post').map(a => (
                    <li key={a.id} className="chapter-item assessment-item"
                      onClick={() => navigate(`/assessment/${a.id}`)}>
                      <ClipboardList size={14} /> Post-Assessment
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* Main: content viewer */}
        <div className="content-viewer">
          {activeContent ? (
            <div className="viewer-wrap">
              <div className="viewer-header">
                <h4>{activeContent.title}</h4>
                {!course.completedChapters.includes(activeContent.id) && (
                  <button className="btn-sm btn-success" onClick={() => markComplete(activeContent.id)}>
                    Mark as Complete
                  </button>
                )}
              </div>

              {activeContent.type === 'video' && (
                <video controls className="content-video" src={activeContent.content_url}>
                  <source src={activeContent.content_url} />
                </video>
              )}
              {activeContent.type === 'pdf' && (
                <iframe
                  src={activeContent.content_url}
                  title={activeContent.title}
                  className="content-pdf"
                />
              )}
              {activeContent.type === 'image' && (
                <img src={activeContent.content_url} alt={activeContent.title} className="content-image" />
              )}
              {activeContent.type === 'resource' && (
                <div className="content-resource">
                  <BookOpen size={48} />
                  <p>{activeContent.title}</p>
                  {activeContent.content_url && (
                    <a href={activeContent.content_url} target="_blank" rel="noreferrer" className="btn-primary">
                      Open Resource
                    </a>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="viewer-placeholder">
              <BookOpen size={64} />
              <p>Select a chapter from the curriculum to start learning</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
