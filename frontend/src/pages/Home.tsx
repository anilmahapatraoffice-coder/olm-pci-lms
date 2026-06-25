import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import api from '../api';
import { Clock, BookOpen, ChevronRight, FileImage, BookMarked, PlayCircle, Users } from 'lucide-react';

interface Course {
  id: string; title: string; description: string; thumbnail: string; total_duration: string;
}

export default function Home() {
  const { user } = useAuth();
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => { api.get('/courses').then(r => setCourses(r.data)).catch(() => {}); }, []);

  return (
    <div className="home-page">

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-logos">
            <img src="/logos/odisha-logo.png" alt="Odisha Govt" />
            <div className="hero-logo-divider" />
            <img src="/logos/olm-logo.png" alt="OLM" />
            <div className="hero-logo-divider" />
            <img src="/logos/pci-logo.png" alt="PCI" />
          </div>
          <h1>{t.hero_title}</h1>
          <p className="hero-sub">{t.hero_subtitle}</p>

          {!user ? (
            <div className="hero-actions">
              <Link to="/login" className="btn-primary">{t.hero_signin}</Link>
              <Link to="/register" className="btn-outline-white">{t.hero_register}</Link>
            </div>
          ) : (
            <Link to="/dashboard" className="btn-primary">
              {t.hero_dashboard} <ChevronRight size={16} />
            </Link>
          )}
        </div>
      </section>

      {/* ═══════════════ SHG BANNER ═══════════════ */}
      <section className="shg-banner">
        <div className="shg-banner-img-wrap">
          <img src="/logos/shg-banner.jpg" alt="SHG Members Learning" className="shg-banner-img" />
          <div className="shg-banner-overlay">
            <div className="shg-banner-text">
              <Users size={28} />
              <div>
                <strong>
                  {lang === 'or' ? 'ସ୍ୱ-ସହାୟତା ଗୋଷ୍ଠୀ ସଦସ୍ୟ' :
                   lang === 'hi' ? 'स्वयं सहायता समूह सदस्य' :
                   'Self Help Group Members'}
                </strong>
                <span>
                  {lang === 'or' ? 'ଏକାଠି ଶିଖୁଛନ୍ତି, ଏକାଠି ବଢ଼ୁଛନ୍ତି' :
                   lang === 'hi' ? 'साथ सीखो, साथ बढ़ो' :
                   'Learning Together, Growing Together'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ MATERIAL TYPES ═══════════════ */}
      <section className="materials-section">
        <div className="materials-header">
          <h2>{t.material_title}</h2>
          <p>{t.material_subtitle}</p>
        </div>
        <div className="materials-grid">
          <div className="material-card material-poster">
            <div className="material-icon-wrap">
              <FileImage size={40} />
            </div>
            <div className="material-odia-label">ପୋଷ୍ଟର</div>
            <h3>{t.material_poster}</h3>
            <p>{t.material_poster_desc}</p>
            <div className="material-tag">
              <span>ଓଡ଼ିଆ</span><span>English</span><span>हिंदी</span>
            </div>
          </div>

          <div className="material-card material-leaflet">
            <div className="material-icon-wrap">
              <BookMarked size={40} />
            </div>
            <div className="material-odia-label">ପ୍ରଚାର ପତ୍ର</div>
            <h3>{t.material_leaflet}</h3>
            <p>{t.material_leaflet_desc}</p>
            <div className="material-tag">
              <span>ଓଡ଼ିଆ</span><span>English</span><span>हिंदी</span>
            </div>
          </div>

          <div className="material-card material-video">
            <div className="material-icon-wrap">
              <PlayCircle size={40} />
            </div>
            <div className="material-odia-label">ଭିଡ଼ିଓ</div>
            <h3>{t.material_video}</h3>
            <p>{t.material_video_desc}</p>
            <div className="material-tag">
              <span>ଓଡ଼ିଆ</span><span>English</span><span>हिंदी</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ COURSES ═══════════════ */}
      <section className="courses-section">
        <div className="section-header">
          <h2>{t.courses_title}</h2>
          <p>{t.courses_subtitle}</p>
        </div>

        {courses.length === 0 ? (
          <div className="empty-courses">
            <BookOpen size={48} />
            <p>Courses coming soon</p>
          </div>
        ) : (
          <div className="courses-grid">
            {courses.map(course => (
              <div key={course.id} className="course-card">
                {course.thumbnail
                  ? <img src={course.thumbnail} alt={course.title} className="course-thumb" />
                  : <div className="course-thumb-placeholder"><BookOpen size={40} /></div>
                }
                <div className="course-body">
                  <h3>{course.title}</h3>
                  <p>{course.description}</p>
                  <div className="course-meta">
                    <span><Clock size={14} /> {course.total_duration || 'Self-paced'}</span>
                  </div>
                  <div className="course-actions">
                    {user
                      ? <button className="btn-primary" onClick={() => navigate(`/course/${course.id}`)}>{t.view_course}</button>
                      : <Link to="/login" className="btn-primary">{t.enroll_now}</Link>
                    }
                  </div>
                </div>
              </div>
            ))}
            <div className="course-card course-card-upcoming">
              <div className="course-thumb-placeholder upcoming"><BookOpen size={40} /></div>
              <div className="course-body">
                <h3>{t.coming_soon}</h3>
                <p>{t.coming_soon_desc}</p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ═══════════════ INFO STRIP ═══════════════ */}
      <section className="info-strip">
        <div className="info-item">
          <BookOpen size={28} />
          <div>
            <strong>{lang === 'or' ? 'ସ୍ୱ-ଗତି ଶିକ୍ଷା' : lang === 'hi' ? 'स्व-गति शिक्षा' : 'Self-Paced Learning'}</strong>
            <span>{lang === 'or' ? 'ନିଜ ସମୟରେ ଶିଖନ୍ତୁ' : lang === 'hi' ? 'अपने समय पर सीखें' : 'Learn at your own schedule'}</span>
          </div>
        </div>
        <div className="info-item">
          <Clock size={28} />
          <div>
            <strong>{lang === 'or' ? 'ଅଗ୍ରଗତି ଟ୍ରାକ' : lang === 'hi' ? 'प्रगति ट्रैक' : 'Track Progress'}</strong>
            <span>{lang === 'or' ? 'ଆପଣଙ୍କ ଅଗ୍ରଗତି ଦେଖନ୍ତୁ' : lang === 'hi' ? 'अपनी प्रगति देखें' : 'Monitor your completion'}</span>
          </div>
        </div>
        <div className="info-item">
          <Users size={28} />
          <div>
            <strong>{lang === 'or' ? 'SHG ପ୍ରଶିକ୍ଷଣ' : lang === 'hi' ? 'SHG प्रशिक्षण' : 'SHG Training'}</strong>
            <span>{lang === 'or' ? 'ଗୋଷ୍ଠୀ ସ୍ତରରେ ଶିକ୍ଷା' : lang === 'hi' ? 'समूह स्तर पर शिक्षा' : 'Community-level learning'}</span>
          </div>
        </div>
      </section>

    </div>
  );
}
