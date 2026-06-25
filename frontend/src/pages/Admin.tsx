import React, { useEffect, useState, useCallback } from 'react';
import api from '../api';
import {
  LayoutDashboard, Tag, BookOpen, Layers, FileText,
  ClipboardList, UserCheck, TrendingUp, Users, RotateCcw,
  Plus, Pencil, Trash2, ChevronDown, ChevronUp,
  CheckCircle, XCircle, Clock, AlertCircle, Save, X, Award
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Category { id: string; name: string; description: string; }
interface Course { id: string; title: string; description: string; thumbnail: string; total_duration: string; category_id: string; category_name: string; is_active: boolean; section_count: number; enrolled_count: number; }
interface Section { id: string; course_id: string; course_title: string; title: string; order_index: number; chapter_count: number; }
interface Chapter { id: string; section_id: string; section_title: string; course_title: string; title: string; type: string; content_url: string; duration: string; order_index: number; }
interface Assessment { id: string; section_id: string; section_title: string; course_title: string; title: string; type: string; pass_score: number; max_attempts: number; question_count: number; }
interface Question { id: string; assessment_id: string; question_text: string; options: string[]; correct_answer: number; order_index: number; }
interface ReassessRequest { id: string; user_name: string; mobile: string; district: string; designation: string; assessment_title: string; assessment_type: string; course_title: string; best_score: number; attempts_used: number; status: string; reason: string; requested_at: string; admin_note: string; }
interface Stats { users: number; courses: number; enrollments: number; completions: number; pending_reassess: number; }
interface LearnerRow { name: string; mobile: string; district: string; block: string; gp: string; designation: string; course_name: string; enrolled_at: string; total_chapters: number; completed_chapters: number; progress_pct: number; }

type Section2 = 'dashboard' | 'categories' | 'courses' | 'sections' | 'chapters' | 'assessments' | 'assign' | 'tracking' | 'users' | 'reassessment' | 'certificates';

// ── Modal helper ──────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export default function Admin() {
  const [active, setActive] = useState<Section2>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navItem = (id: Section2, icon: React.ReactNode, label: string, badge?: number) => (
    <button key={id} className={`admin-nav-item ${active === id ? 'active' : ''}`}
      onClick={() => setActive(id)}>
      {icon} <span>{label}</span>
      {badge ? <span className="badge-count">{badge}</span> : null}
    </button>
  );

  return (
    <div className="admin-layout">
      {/* ── Sidebar ── */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="admin-sidebar-header">
          <span>Admin Panel</span>
          <button onClick={() => setSidebarOpen(o => !o)}>
            {sidebarOpen ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
          </button>
        </div>
        <nav className="admin-nav">
          <div className="admin-nav-group">
            {navItem('dashboard', <LayoutDashboard size={16}/>, 'Dashboard')}
          </div>
          <div className="admin-nav-label">Course Management</div>
          <div className="admin-nav-group">
            {navItem('categories', <Tag size={16}/>, 'Categories')}
            {navItem('courses', <BookOpen size={16}/>, 'Courses')}
            {navItem('sections', <Layers size={16}/>, 'Sections')}
            {navItem('chapters', <FileText size={16}/>, 'Course Materials')}
            {navItem('assessments', <ClipboardList size={16}/>, 'Assessments')}
          </div>
          <div className="admin-nav-label">Learner Management</div>
          <div className="admin-nav-group">
            {navItem('assign', <UserCheck size={16}/>, 'Assign Course')}

            {navItem('tracking', <TrendingUp size={16}/>, 'Learner Tracking')}
            {navItem('users', <Users size={16}/>, 'User List')}
            {navItem('reassessment', <RotateCcw size={16}/>, 'Reassessments')}
            {navItem('certificates', <Award size={16}/>, 'Certificates')}
          </div>
        </nav>
      </aside>

      {/* ── Main ── */}
      <main className="admin-main">
        {active === 'dashboard'    && <DashboardPanel />}
        {active === 'categories'   && <CategoriesPanel />}
        {active === 'courses'      && <CoursesPanel />}
        {active === 'sections'     && <SectionsPanel />}
        {active === 'chapters'     && <ChaptersPanel />}
        {active === 'assessments'  && <AssessmentsPanel />}
        {active === 'assign'       && <AssignPanel />}
        {active === 'tracking'     && <TrackingPanel />}
        {active === 'users'        && <UsersPanel />}
        {active === 'reassessment' && <ReassessPanel />}
        {active === 'certificates'  && <CertificatesPanel />}
      </main>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
function DashboardPanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => { api.get('/admin/stats').then(r => setStats(r.data)); }, []);
  if (!stats) return <div className="loading">Loading...</div>;
  return (
    <div className="admin-panel">
      <h2>Dashboard</h2>
      <div className="dash-stats">
        <div className="dash-stat green"><BookOpen size={28}/><div><strong>{stats.courses}</strong><span>Active Courses</span></div></div>
        <div className="dash-stat blue"><Users size={28}/><div><strong>{stats.users}</strong><span>Learners</span></div></div>
        <div className="dash-stat orange"><UserCheck size={28}/><div><strong>{stats.enrollments}</strong><span>Enrollments</span></div></div>
        <div className="dash-stat purple"><CheckCircle size={28}/><div><strong>{stats.completions}</strong><span>Completions</span></div></div>
        <div className="dash-stat red"><RotateCcw size={28}/><div><strong>{stats.pending_reassess}</strong><span>Pending Reassessments</span></div></div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  CATEGORIES
// ══════════════════════════════════════════════════════════════════════════════
function CategoriesPanel() {
  const [items, setItems] = useState<Category[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });

  const load = () => api.get('/admin/categories').then(r => setItems(r.data));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm({ name:'', description:'' }); setModal(true); };
  const openEdit = (c: Category) => { setEditing(c); setForm({ name:c.name, description:c.description }); setModal(true); };
  const save = async () => {
    if (editing) await api.put(`/admin/categories/${editing.id}`, form);
    else await api.post('/admin/categories', form);
    setModal(false); load();
  };
  const del = async (id: string) => { if (window.confirm('Delete category?')) { await api.delete(`/admin/categories/${id}`); load(); } };

  return (
    <div className="admin-panel">
      <div className="panel-header">
        <h2><Tag size={18}/> Categories</h2>
        <button className="btn-primary btn-sm" onClick={openAdd}><Plus size={14}/> Add Category</button>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>#</th><th>Name</th><th>Description</th><th>Actions</th></tr></thead>
          <tbody>
            {items.map((c, i) => (
              <tr key={c.id}>
                <td>{i+1}</td><td><strong>{c.name}</strong></td><td>{c.description||'-'}</td>
                <td><div className="row-actions">
                  <button className="btn-icon" onClick={() => openEdit(c)}><Pencil size={14}/></button>
                  <button className="btn-icon danger" onClick={() => del(c.id)}><Trash2 size={14}/></button>
                </div></td>
              </tr>
            ))}
            {items.length===0 && <tr><td colSpan={4} className="empty-row">No categories yet</td></tr>}
          </tbody>
        </table>
      </div>
      {modal && (
        <Modal title={editing ? 'Edit Category' : 'Add Category'} onClose={() => setModal(false)}>
          <div className="form-group"><label>Name *</label><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Category name"/></div>
          <div className="form-group"><label>Description</label><input value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Short description"/></div>
          <button className="btn-primary" onClick={save}><Save size={14}/> Save</button>
        </Modal>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  COURSES
// ══════════════════════════════════════════════════════════════════════════════
function CoursesPanel() {
  const [items, setItems] = useState<Course[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [form, setForm] = useState({ title:'', description:'', thumbnail:'', total_duration:'', category_id:'', is_active: true });

  const load = useCallback(() => {
    api.get('/admin/courses').then(r => setItems(r.data));
    api.get('/admin/categories').then(r => setCats(r.data));
  }, []);
  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setForm({ title:'',description:'',thumbnail:'',total_duration:'',category_id:'',is_active:true }); setModal(true); };
  const openEdit = (c: Course) => { setEditing(c); setForm({ title:c.title,description:c.description||'',thumbnail:c.thumbnail||'',total_duration:c.total_duration||'',category_id:c.category_id||'',is_active:c.is_active }); setModal(true); };
  const save = async () => {
    if (editing) await api.put(`/admin/courses/${editing.id}`, form);
    else await api.post('/admin/courses', form);
    setModal(false); load();
  };
  const del = async (id: string) => { if (window.confirm('Delete course and all its content?')) { await api.delete(`/admin/courses/${id}`); load(); } };
  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) => setForm(p => ({...p,[f]:e.target.value}));

  return (
    <div className="admin-panel">
      <div className="panel-header">
        <h2><BookOpen size={18}/> Courses</h2>
        <button className="btn-primary btn-sm" onClick={openAdd}><Plus size={14}/> Add Course</button>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>#</th><th>Title</th><th>Category</th><th>Duration</th><th>Sections</th><th>Enrolled</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {items.map((c, i) => (
              <tr key={c.id}>
                <td>{i+1}</td>
                <td><strong>{c.title}</strong><br/><small style={{color:'#888'}}>{c.description?.slice(0,50)}{c.description?.length>50?'...':''}</small></td>
                <td>{c.category_name||'-'}</td>
                <td>{c.total_duration||'-'}</td>
                <td><span className="count-badge">{c.section_count}</span></td>
                <td><span className="count-badge blue">{c.enrolled_count}</span></td>
                <td><span className={`status-chip ${c.is_active?'approved':'rejected'}`}>{c.is_active?'Active':'Inactive'}</span></td>
                <td><div className="row-actions">
                  <button className="btn-icon" onClick={() => openEdit(c)}><Pencil size={14}/></button>
                  <button className="btn-icon danger" onClick={() => del(c.id)}><Trash2 size={14}/></button>
                </div></td>
              </tr>
            ))}
            {items.length===0 && <tr><td colSpan={8} className="empty-row">No courses yet</td></tr>}
          </tbody>
        </table>
      </div>
      {modal && (
        <Modal title={editing ? 'Edit Course' : 'Add Course'} onClose={() => setModal(false)}>
          <div className="form-grid2">
            <div className="form-group"><label>Title *</label><input value={form.title} onChange={set('title')} placeholder="Course title"/></div>
            <div className="form-group"><label>Category</label>
              <select value={form.category_id} onChange={set('category_id')}>
                <option value="">Select Category</option>
                {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group" style={{gridColumn:'1/-1'}}><label>Description</label><textarea value={form.description} onChange={set('description')} placeholder="Course description" rows={3}/></div>
            <div className="form-group"><label>Thumbnail URL</label><input value={form.thumbnail} onChange={set('thumbnail')} placeholder="https://..."/></div>
            <div className="form-group"><label>Total Duration</label><input value={form.total_duration} onChange={set('total_duration')} placeholder="e.g. 6 Hr 54 Mins"/></div>
          </div>
          <button className="btn-primary" onClick={save}><Save size={14}/> Save Course</button>
        </Modal>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  SECTIONS
// ══════════════════════════════════════════════════════════════════════════════
function SectionsPanel() {
  const [items, setItems] = useState<Section[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Section | null>(null);
  const [form, setForm] = useState({ course_id:'', title:'', order_index:'0' });
  const [filterCourse, setFilterCourse] = useState('');

  const load = useCallback(() => {
    api.get(`/admin/sections${filterCourse?`?course_id=${filterCourse}`:''}`).then(r => setItems(r.data));
    api.get('/admin/courses').then(r => setCourses(r.data));
  }, [filterCourse]);
  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setForm({ course_id:filterCourse||'',title:'',order_index:'0' }); setModal(true); };
  const openEdit = (s: Section) => { setEditing(s); setForm({ course_id:s.course_id,title:s.title,order_index:String(s.order_index) }); setModal(true); };
  const save = async () => {
    const data = { ...form, order_index: Number(form.order_index) };
    if (editing) await api.put(`/admin/sections/${editing.id}`, data);
    else await api.post('/admin/sections', data);
    setModal(false); load();
  };
  const del = async (id: string) => { if (window.confirm('Delete section?')) { await api.delete(`/admin/sections/${id}`); load(); } };

  return (
    <div className="admin-panel">
      <div className="panel-header">
        <h2><Layers size={18}/> Sections</h2>
        <div style={{display:'flex',gap:8}}>
          <select className="filter-select" value={filterCourse} onChange={e=>{setFilterCourse(e.target.value);}}>
            <option value="">All Courses</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <button className="btn-primary btn-sm" onClick={openAdd}><Plus size={14}/> Add Section</button>
        </div>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>#</th><th>Section Title</th><th>Course</th><th>Order</th><th>Chapters</th><th>Actions</th></tr></thead>
          <tbody>
            {items.map((s, i) => (
              <tr key={s.id}>
                <td>{i+1}</td><td><strong>{s.title}</strong></td><td>{s.course_title}</td>
                <td>{s.order_index}</td><td><span className="count-badge">{s.chapter_count}</span></td>
                <td><div className="row-actions">
                  <button className="btn-icon" onClick={() => openEdit(s)}><Pencil size={14}/></button>
                  <button className="btn-icon danger" onClick={() => del(s.id)}><Trash2 size={14}/></button>
                </div></td>
              </tr>
            ))}
            {items.length===0 && <tr><td colSpan={6} className="empty-row">No sections yet</td></tr>}
          </tbody>
        </table>
      </div>
      {modal && (
        <Modal title={editing ? 'Edit Section' : 'Add Section'} onClose={() => setModal(false)}>
          <div className="form-group"><label>Course *</label>
            <select value={form.course_id} onChange={e=>setForm(f=>({...f,course_id:e.target.value}))}>
              <option value="">Select Course</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Section Title *</label><input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="e.g. GSLP-1"/></div>
          <div className="form-group"><label>Order</label><input type="number" value={form.order_index} onChange={e=>setForm(f=>({...f,order_index:e.target.value}))}/></div>
          <button className="btn-primary" onClick={save}><Save size={14}/> Save</button>
        </Modal>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  CHAPTERS (Course Materials)
// ══════════════════════════════════════════════════════════════════════════════
function ChaptersPanel() {
  const [items, setItems] = useState<Chapter[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Chapter | null>(null);
  const [form, setForm] = useState({ section_id:'', title:'', type:'resource', content_url:'', duration:'', order_index:'0' });
  const [filterCourse, setFilterCourse] = useState('');

  const load = useCallback(() => {
    api.get(`/admin/chapters${filterCourse?`?course_id=${filterCourse}`:''}`).then(r => setItems(r.data));
    api.get('/admin/courses').then(r => setCourses(r.data));
  }, [filterCourse]);
  useEffect(() => { load(); }, [load]);

  const loadSections = (courseId: string) => {
    if (courseId) api.get(`/admin/sections?course_id=${courseId}`).then(r => setSections(r.data));
  };

  const openAdd = () => { setEditing(null); setForm({ section_id:'',title:'',type:'resource',content_url:'',duration:'',order_index:'0' }); setModal(true); };
  const openEdit = (c: Chapter) => { setEditing(c); setForm({ section_id:c.section_id,title:c.title,type:c.type,content_url:c.content_url||'',duration:c.duration||'',order_index:String(c.order_index) }); loadSections(filterCourse); setModal(true); };
  const save = async () => {
    const data = { ...form, order_index: Number(form.order_index) };
    if (editing) await api.put(`/admin/chapters/${editing.id}`, data);
    else await api.post('/admin/chapters', data);
    setModal(false); load();
  };
  const del = async (id: string) => { if (window.confirm('Delete chapter?')) { await api.delete(`/admin/chapters/${id}`); load(); } };

  const typeLabel: Record<string,string> = { pdf:'📄 PDF', video:'🎬 Video', image:'🖼️ Image', resource:'📚 Resource' };

  return (
    <div className="admin-panel">
      <div className="panel-header">
        <h2><FileText size={18}/> Course Materials (Chapters)</h2>
        <div style={{display:'flex',gap:8}}>
          <select className="filter-select" value={filterCourse} onChange={e=>{setFilterCourse(e.target.value);loadSections(e.target.value);}}>
            <option value="">All Courses</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <button className="btn-primary btn-sm" onClick={openAdd}><Plus size={14}/> Add Material</button>
        </div>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>#</th><th>Title</th><th>Type</th><th>Section</th><th>Course</th><th>Duration</th><th>Content URL</th><th>Order</th><th>Actions</th></tr></thead>
          <tbody>
            {items.map((c, i) => (
              <tr key={c.id}>
                <td>{i+1}</td>
                <td><strong>{c.title}</strong></td>
                <td><span className="type-badge">{typeLabel[c.type]||c.type}</span></td>
                <td>{c.section_title}</td>
                <td>{c.course_title}</td>
                <td>{c.duration||'-'}</td>
                <td className="url-cell">{c.content_url ? <a href={c.content_url} target="_blank" rel="noreferrer" className="link-small">View</a> : '-'}</td>
                <td>{c.order_index}</td>
                <td><div className="row-actions">
                  <button className="btn-icon" onClick={() => openEdit(c)}><Pencil size={14}/></button>
                  <button className="btn-icon danger" onClick={() => del(c.id)}><Trash2 size={14}/></button>
                </div></td>
              </tr>
            ))}
            {items.length===0 && <tr><td colSpan={9} className="empty-row">No materials yet. Add sections first, then add materials.</td></tr>}
          </tbody>
        </table>
      </div>
      {modal && (
        <Modal title={editing?'Edit Material':'Add Course Material'} onClose={() => setModal(false)}>
          <div className="form-grid2">
            <div className="form-group"><label>Course</label>
              <select onChange={e=>loadSections(e.target.value)}>
                <option value="">Select Course First</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Section *</label>
              <select value={form.section_id} onChange={e=>setForm(f=>({...f,section_id:e.target.value}))}>
                <option value="">Select Section</option>
                {sections.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
            </div>
            <div className="form-group" style={{gridColumn:'1/-1'}}><label>Title *</label><input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="e.g. Posters – GSLP 1"/></div>
            <div className="form-group"><label>Type</label>
              <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                <option value="pdf">📄 PDF</option>
                <option value="video">🎬 Video</option>
                <option value="image">🖼️ Image</option>
                <option value="resource">📚 Resource</option>
              </select>
            </div>
            <div className="form-group"><label>Duration</label><input value={form.duration} onChange={e=>setForm(f=>({...f,duration:e.target.value}))} placeholder="e.g. 10 Minutes"/></div>
            <div className="form-group" style={{gridColumn:'1/-1'}}><label>Content URL</label><input value={form.content_url} onChange={e=>setForm(f=>({...f,content_url:e.target.value}))} placeholder="https://... or /uploads/file.pdf"/></div>
            <div className="form-group"><label>Order</label><input type="number" value={form.order_index} onChange={e=>setForm(f=>({...f,order_index:e.target.value}))}/></div>
          </div>
          <button className="btn-primary" onClick={save}><Save size={14}/> Save Material</button>
        </Modal>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  ASSESSMENTS & QUESTIONS
// ══════════════════════════════════════════════════════════════════════════════
function AssessmentsPanel() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [modal, setModal] = useState<'assess'|'question'|null>(null);
  const [editAssess, setEditAssess] = useState<Assessment|null>(null);
  const [editQ, setEditQ] = useState<Question|null>(null);
  const [selectedAssess, setSelectedAssess] = useState<Assessment|null>(null);
  const [aForm, setAForm] = useState({ section_id:'', type:'post', title:'', pass_score:'60', max_attempts:'3' });
  const [qForm, setQForm] = useState({ question_text:'', opt0:'', opt1:'', opt2:'', opt3:'', correct_answer:'0', order_index:'0' });
  const [filterCourse, setFilterCourse] = useState('');

  const load = useCallback(() => {
    api.get(`/admin/assessments${filterCourse?`?course_id=${filterCourse}`:''}`).then(r => setAssessments(r.data));
    api.get('/admin/courses').then(r => setCourses(r.data));
  }, [filterCourse]);
  useEffect(() => { load(); }, [load]);

  const loadSections = (courseId: string) => {
    if (courseId) api.get(`/admin/sections?course_id=${courseId}`).then(r => setSections(r.data));
  };
  const loadQuestions = (a: Assessment) => {
    setSelectedAssess(a);
    api.get(`/admin/questions?assessment_id=${a.id}`).then(r => setQuestions(r.data));
  };

  const saveAssess = async () => {
    const data = { ...aForm, pass_score: Number(aForm.pass_score), max_attempts: Number(aForm.max_attempts) };
    if (editAssess) await api.put(`/admin/assessments/${editAssess.id}`, data);
    else await api.post('/admin/assessments', data);
    setModal(null); load();
  };
  const delAssess = async (id: string) => { if (window.confirm('Delete assessment and all questions?')) { await api.delete(`/admin/assessments/${id}`); load(); if (selectedAssess?.id===id) { setSelectedAssess(null); setQuestions([]); } } };

  const saveQuestion = async () => {
    if (!selectedAssess) return;
    const options = [qForm.opt0, qForm.opt1, qForm.opt2, qForm.opt3].filter(Boolean);
    const data = { assessment_id: selectedAssess.id, question_text: qForm.question_text, options, correct_answer: Number(qForm.correct_answer), order_index: Number(qForm.order_index) };
    if (editQ) await api.put(`/admin/questions/${editQ.id}`, data);
    else await api.post('/admin/questions', data);
    setModal(null); loadQuestions(selectedAssess);
  };
  const delQ = async (id: string) => { if (window.confirm('Delete question?')) { await api.delete(`/admin/questions/${id}`); if(selectedAssess) loadQuestions(selectedAssess); } };

  const openAddAssess = () => { setEditAssess(null); setAForm({section_id:'',type:'post',title:'',pass_score:'60',max_attempts:'3'}); setModal('assess'); };
  const openEditAssess = (a: Assessment) => { setEditAssess(a); setAForm({section_id:a.section_id,type:a.type,title:a.title||'',pass_score:String(a.pass_score),max_attempts:String(a.max_attempts)}); setModal('assess'); };
  const openAddQ = () => { setEditQ(null); setQForm({question_text:'',opt0:'',opt1:'',opt2:'',opt3:'',correct_answer:'0',order_index:String(questions.length)}); setModal('question'); };
  const openEditQ = (q: Question) => { const opts = Array.isArray(q.options) ? q.options : JSON.parse(q.options as unknown as string); setEditQ(q); setQForm({question_text:q.question_text,opt0:opts[0]||'',opt1:opts[1]||'',opt2:opts[2]||'',opt3:opts[3]||'',correct_answer:String(q.correct_answer),order_index:String(q.order_index)}); setModal('question'); };

  return (
    <div className="admin-panel">
      <div className="panel-header">
        <h2><ClipboardList size={18}/> Assessments & Questions</h2>
        <div style={{display:'flex',gap:8}}>
          <select className="filter-select" value={filterCourse} onChange={e=>{setFilterCourse(e.target.value);loadSections(e.target.value);}}>
            <option value="">All Courses</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <button className="btn-primary btn-sm" onClick={openAddAssess}><Plus size={14}/> Add Assessment</button>
        </div>
      </div>

      <div className="assess-layout">
        {/* Left: assessments list */}
        <div className="assess-left">
          <h4>Assessments</h4>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Title</th><th>Type</th><th>Section</th><th>Pass%</th><th>Qs</th><th></th></tr></thead>
              <tbody>
                {assessments.map(a => (
                  <tr key={a.id} className={selectedAssess?.id===a.id?'selected-row':''} style={{cursor:'pointer'}} onClick={()=>loadQuestions(a)}>
                    <td>{a.title||`${a.type==='pre'?'Pre':'Post'} Assessment`}</td>
                    <td><span className={`assess-type-badge-sm ${a.type}`}>{a.type}</span></td>
                    <td>{a.section_title}</td>
                    <td>{a.pass_score}%</td>
                    <td><span className="count-badge">{a.question_count}</span></td>
                    <td><div className="row-actions">
                      <button className="btn-icon" onClick={e=>{e.stopPropagation();openEditAssess(a);}}><Pencil size={13}/></button>
                      <button className="btn-icon danger" onClick={e=>{e.stopPropagation();delAssess(a.id);}}><Trash2 size={13}/></button>
                    </div></td>
                  </tr>
                ))}
                {assessments.length===0 && <tr><td colSpan={6} className="empty-row">No assessments</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: questions */}
        <div className="assess-right">
          {selectedAssess ? (
            <>
              <div className="panel-header">
                <h4>Questions — {selectedAssess.title||`${selectedAssess.type} Assessment`}</h4>
                <button className="btn-primary btn-sm" onClick={openAddQ}><Plus size={14}/> Add Question</button>
              </div>
              <div className="question-list">
                {questions.map((q, i) => {
                  const opts = Array.isArray(q.options) ? q.options : JSON.parse(q.options as unknown as string);
                  return (
                    <div key={q.id} className="question-card">
                      <div className="q-header">
                        <span className="q-num">Q{i+1}</span>
                        <p>{q.question_text}</p>
                        <div className="row-actions">
                          <button className="btn-icon" onClick={()=>openEditQ(q)}><Pencil size={13}/></button>
                          <button className="btn-icon danger" onClick={()=>delQ(q.id)}><Trash2 size={13}/></button>
                        </div>
                      </div>
                      <div className="q-options">
                        {opts.map((o: string, idx: number) => (
                          <span key={idx} className={`q-opt ${idx===q.correct_answer?'correct':''}`}>
                            {String.fromCharCode(65+idx)}. {o} {idx===q.correct_answer && <CheckCircle size={12}/>}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {questions.length===0 && <div className="empty-row">Click "Add Question" to start</div>}
              </div>
            </>
          ) : (
            <div className="empty-state-sm"><ClipboardList size={32}/><p>Select an assessment to manage questions</p></div>
          )}
        </div>
      </div>

      {modal==='assess' && (
        <Modal title={editAssess?'Edit Assessment':'Add Assessment'} onClose={()=>setModal(null)}>
          <div className="form-group"><label>Course</label>
            <select onChange={e=>loadSections(e.target.value)}>
              <option value="">Select Course</option>
              {courses.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Section *</label>
            <select value={aForm.section_id} onChange={e=>setAForm(f=>({...f,section_id:e.target.value}))}>
              <option value="">Select Section</option>
              {sections.map(s=><option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Title</label><input value={aForm.title} onChange={e=>setAForm(f=>({...f,title:e.target.value}))} placeholder="Assessment title (optional)"/></div>
          <div className="form-group"><label>Type</label>
            <select value={aForm.type} onChange={e=>setAForm(f=>({...f,type:e.target.value}))}>
              <option value="pre">Pre Assessment</option>
              <option value="post">Post Assessment</option>
            </select>
          </div>
          <div className="form-grid2">
            <div className="form-group"><label>Pass Score (%)</label><input type="number" value={aForm.pass_score} onChange={e=>setAForm(f=>({...f,pass_score:e.target.value}))}/></div>
            <div className="form-group"><label>Max Attempts</label><input type="number" value={aForm.max_attempts} onChange={e=>setAForm(f=>({...f,max_attempts:e.target.value}))}/></div>
          </div>
          <button className="btn-primary" onClick={saveAssess}><Save size={14}/> Save Assessment</button>
        </Modal>
      )}

      {modal==='question' && selectedAssess && (
        <Modal title={editQ?'Edit Question':'Add Question'} onClose={()=>setModal(null)}>
          <div className="form-group"><label>Question *</label><textarea value={qForm.question_text} onChange={e=>setQForm(f=>({...f,question_text:e.target.value}))} placeholder="Enter question text" rows={3}/></div>
          <div className="form-group"><label>Option A *</label><input value={qForm.opt0} onChange={e=>setQForm(f=>({...f,opt0:e.target.value}))} placeholder="Option A"/></div>
          <div className="form-group"><label>Option B *</label><input value={qForm.opt1} onChange={e=>setQForm(f=>({...f,opt1:e.target.value}))} placeholder="Option B"/></div>
          <div className="form-group"><label>Option C</label><input value={qForm.opt2} onChange={e=>setQForm(f=>({...f,opt2:e.target.value}))} placeholder="Option C (optional)"/></div>
          <div className="form-group"><label>Option D</label><input value={qForm.opt3} onChange={e=>setQForm(f=>({...f,opt3:e.target.value}))} placeholder="Option D (optional)"/></div>
          <div className="form-group"><label>Correct Answer</label>
            <select value={qForm.correct_answer} onChange={e=>setQForm(f=>({...f,correct_answer:e.target.value}))}>
              <option value="0">A — {qForm.opt0||'Option A'}</option>
              <option value="1">B — {qForm.opt1||'Option B'}</option>
              {qForm.opt2 && <option value="2">C — {qForm.opt2}</option>}
              {qForm.opt3 && <option value="3">D — {qForm.opt3}</option>}
            </select>
          </div>
          <button className="btn-primary" onClick={saveQuestion}><Save size={14}/> Save Question</button>
        </Modal>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  ASSIGN COURSE
// ══════════════════════════════════════════════════════════════════════════════
function AssignPanel() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/admin/courses').then(r => setCourses(r.data));
    api.get('/users?limit=200').then(r => setUsers(r.data.users));
  }, []);

  const filtered = users.filter(u => !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.mobile.includes(search));
  const toggle = (id: string) => setSelectedUsers(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const assign = async () => {
    if (!selectedCourse || selectedUsers.size===0) return;
    const res = await api.post('/admin/assign-course-bulk', { user_ids: Array.from(selectedUsers), course_id: selectedCourse });
    setMsg(res.data.message); setSelectedUsers(new Set());
  };

  return (
    <div className="admin-panel">
      <h2><UserCheck size={18}/> Assign Course to Learners</h2>
      {msg && <div className="status-banner success" style={{marginBottom:16}}><CheckCircle size={16}/>{msg}</div>}
      <div className="assign-layout">
        <div className="form-group" style={{marginBottom:16}}>
          <label>Select Course *</label>
          <select className="filter-select" value={selectedCourse} onChange={e=>setSelectedCourse(e.target.value)}>
            <option value="">Choose a course</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
        <div className="form-group" style={{marginBottom:12}}>
          <label>Search Learners</label>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or mobile"/>
        </div>
        <div style={{marginBottom:8,fontSize:13,color:'#666'}}>
          {selectedUsers.size > 0 && <span style={{color:'var(--primary)',fontWeight:600}}>{selectedUsers.size} selected</span>}
        </div>
        <div className="table-wrap" style={{maxHeight:360,overflowY:'auto'}}>
          <table className="data-table">
            <thead><tr><th><input type="checkbox" onChange={e=>setSelectedUsers(e.target.checked ? new Set(filtered.map(u=>u.id)) : new Set())}/></th><th>Name</th><th>Mobile</th><th>District</th><th>Designation</th></tr></thead>
            <tbody>
              {filtered.slice(0,100).map(u => (
                <tr key={u.id}>
                  <td><input type="checkbox" checked={selectedUsers.has(u.id)} onChange={()=>toggle(u.id)}/></td>
                  <td>{u.name}</td><td>{u.mobile}</td><td>{u.district||'-'}</td><td>{u.designation||'-'}</td>
                </tr>
              ))}
              {filtered.length===0 && <tr><td colSpan={5} className="empty-row">No users found</td></tr>}
            </tbody>
          </table>
        </div>
        <button className="btn-primary" style={{marginTop:16}} onClick={assign} disabled={!selectedCourse || selectedUsers.size===0}>
          <UserCheck size={14}/> Assign Course to {selectedUsers.size} Learner(s)
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  LEARNER TRACKING
// ══════════════════════════════════════════════════════════════════════════════
function TrackingPanel() {
  const [rows, setRows] = useState<LearnerRow[]>([]);
  const [f, setF] = useState({district:'',block:'',gp:'',search:''});
  const [loading, setLoading] = useState(false);
  const load = () => { setLoading(true); api.get(`/reports/learner-tracking?${new URLSearchParams(f as any)}`).then(r=>setRows(r.data)).finally(()=>setLoading(false)); };
  useEffect(()=>load(),[]);
  return (
    <div className="admin-panel">
      <h2><TrendingUp size={18}/> Learner Tracking</h2>
      <div className="filters-row">
        {['district','block','gp','search'].map(k => (
          <input key={k} placeholder={k.charAt(0).toUpperCase()+k.slice(1)} value={(f as any)[k]} onChange={e=>setF(p=>({...p,[k]:e.target.value}))}/>
        ))}
        <button className="btn-primary btn-sm" onClick={load}>Search</button>
        <button className="btn-outline btn-sm" onClick={()=>setF({district:'',block:'',gp:'',search:''})}>Clear</button>
      </div>
      {loading ? <div className="loading">Loading...</div> : (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>#</th><th>Name</th><th>Mobile</th><th>Designation</th><th>District</th><th>Block</th><th>GP</th><th>Course</th><th>Progress</th></tr></thead>
            <tbody>
              {rows.map((r,i)=>(
                <tr key={i}><td>{i+1}</td><td>{r.name}</td><td>{r.mobile}</td><td>{r.designation||'-'}</td><td>{r.district||'-'}</td><td>{r.block||'-'}</td><td>{r.gp||'-'}</td><td>{r.course_name}</td>
                  <td><div className="progress-bar-wrap mini"><div className="progress-bar" style={{width:`${r.progress_pct||0}%`}}/></div><small>{r.progress_pct||0}%</small></td></tr>
              ))}
              {rows.length===0 && <tr><td colSpan={9} className="empty-row">No data</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  USERS
// ══════════════════════════════════════════════════════════════════════════════
function UsersPanel() {
  const [users, setUsers] = useState<any[]>([]);
  const [f, setF] = useState({district:'',block:'',gp:'',search:''});
  const [loading, setLoading] = useState(false);
  const load = () => { setLoading(true); api.get(`/users?${new URLSearchParams(f as any)}&limit=100`).then(r=>setUsers(r.data.users)).finally(()=>setLoading(false)); };
  useEffect(()=>load(),[]);
  return (
    <div className="admin-panel">
      <h2><Users size={18}/> User List</h2>
      <div className="filters-row">
        {['district','block','gp','search'].map(k => (
          <input key={k} placeholder={k.charAt(0).toUpperCase()+k.slice(1)} value={(f as any)[k]} onChange={e=>setF(p=>({...p,[k]:e.target.value}))}/>
        ))}
        <button className="btn-primary btn-sm" onClick={load}>Search</button>
        <button className="btn-outline btn-sm" onClick={()=>setF({district:'',block:'',gp:'',search:''})}>Clear</button>
      </div>
      {loading ? <div className="loading">Loading...</div> : (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>#</th><th>Name</th><th>Mobile</th><th>Designation</th><th>District</th><th>Block</th><th>GP</th><th>Registered</th></tr></thead>
            <tbody>
              {users.map((u,i)=>(
                <tr key={u.id}><td>{i+1}</td><td>{u.name}</td><td>{u.mobile}</td><td>{u.designation||'-'}</td><td>{u.district||'-'}</td><td>{u.block||'-'}</td><td>{u.gp||'-'}</td><td>{new Date(u.created_at).toLocaleDateString('en-IN')}</td></tr>
              ))}
              {users.length===0 && <tr><td colSpan={8} className="empty-row">No users</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  REASSESSMENTS
// ══════════════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════
//  CERTIFICATES
// ══════════════════════════════════════════════════════════════════════════════
function CertificatesPanel() {
  const [items, setItems] = useState<any[]>([]);
  const [f, setF] = useState({ district:'', block:'', course_id:'' });
  const [loading, setLoading] = useState(false);
  const load = () => {
    setLoading(true);
    api.get(`/certificates/admin/all?${new URLSearchParams(f as any)}`).then(r => setItems(r.data)).finally(() => setLoading(false));
  };
  useEffect(() => load(), []);
  return (
    <div className="admin-panel">
      <h2><Award size={18}/> Certificates Issued</h2>
      <div className="filters-row">
        <input placeholder="District" value={f.district} onChange={e=>setF(p=>({...p,district:e.target.value}))}/>
        <input placeholder="Block" value={f.block} onChange={e=>setF(p=>({...p,block:e.target.value}))}/>
        <button className="btn-primary btn-sm" onClick={load}>Search</button>
        <button className="btn-outline btn-sm" onClick={()=>setF({district:'',block:'',course_id:''})}>Clear</button>
      </div>
      {loading ? <div className="loading">Loading...</div> : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>#</th><th>Certificate No.</th><th>Learner</th><th>Mobile</th><th>Designation</th><th>District</th><th>Block</th><th>GP</th><th>Course</th><th>Issued On</th></tr>
            </thead>
            <tbody>
              {items.map((c,i) => (
                <tr key={i}>
                  <td>{i+1}</td>
                  <td><strong style={{color:'var(--primary)',fontSize:12}}>{c.certificate_number}</strong></td>
                  <td>{c.name}</td><td>{c.mobile}</td><td>{c.designation||'-'}</td>
                  <td>{c.district||'-'}</td><td>{c.block||'-'}</td><td>{c.gp||'-'}</td>
                  <td>{c.course_name}</td>
                  <td>{new Date(c.issued_at).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
              {items.length===0 && <tr><td colSpan={10} className="empty-row"><Award size={20} style={{margin:'0 auto 6px',display:'block'}}/>No certificates issued yet</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      <div style={{marginTop:12,fontSize:13,color:'var(--text-light)'}}>
        Total: <strong>{items.length}</strong> certificates issued
      </div>
    </div>
  );
}

function ReassessPanel() {
  const [items, setItems] = useState<ReassessRequest[]>([]);
  const [notes, setNotes] = useState<Record<string,string>>({});
  const [loading, setLoading] = useState(false);
  const load = (status='') => { setLoading(true); api.get(`/assessments/admin/requests${status?`?status=${status}`:''}`).then(r=>setItems(r.data)).finally(()=>setLoading(false)); };
  useEffect(()=>load(),[]);
  const review = async (id:string, status:'approved'|'rejected') => {
    await api.patch(`/assessments/admin/requests/${id}`,{status,admin_note:notes[id]||''});
    load();
  };
  const statusIcon = (s:string) => s==='pending'?<Clock size={13}/>:s==='approved'?<CheckCircle size={13}/>:<XCircle size={13}/>;
  return (
    <div className="admin-panel">
      <h2><RotateCcw size={18}/> Reassessment Requests</h2>
      <div className="filters-row">
        <button className="btn-outline btn-sm" onClick={()=>load()}>All</button>
        <button className="btn-warning btn-sm" onClick={()=>load('pending')}>Pending</button>
        <button className="btn-success btn-sm" onClick={()=>load('approved')}>Approved</button>
        <button className="btn-danger btn-sm" onClick={()=>load('rejected')}>Rejected</button>
      </div>
      {loading ? <div className="loading">Loading...</div> : (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>#</th><th>Learner</th><th>Mobile</th><th>District</th><th>Course</th><th>Assessment</th><th>Best Score</th><th>Attempts</th><th>Reason</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {items.map((r,i)=>(
                <tr key={r.id}>
                  <td>{i+1}</td><td>{r.user_name}</td><td>{r.mobile}</td><td>{r.district||'-'}</td>
                  <td>{r.course_title||'-'}</td>
                  <td><span className={`assess-type-badge-sm ${r.assessment_type}`}>{r.assessment_type}</span> {r.assessment_title||'-'}</td>
                  <td><span className={r.best_score>=60?'text-green':'text-red'}>{r.best_score!=null?`${r.best_score}%`:'-'}</span></td>
                  <td>{r.attempts_used}</td>
                  <td className="reason-cell">{r.reason||'-'}</td>
                  <td><span className={`status-chip ${r.status}`}>{statusIcon(r.status)} {r.status}</span></td>
                  <td>{r.status==='pending'?(
                    <div className="action-cell">
                      <input placeholder="Admin note" value={notes[r.id]||''} onChange={e=>setNotes(n=>({...n,[r.id]:e.target.value}))} className="note-input"/>
                      <button className="btn-success btn-xs" onClick={()=>review(r.id,'approved')}><CheckCircle size={12}/> Approve</button>
                      <button className="btn-danger btn-xs" onClick={()=>review(r.id,'rejected')}><XCircle size={12}/> Reject</button>
                    </div>
                  ):<span className="text-muted">{r.admin_note||'—'}</span>}</td>
                </tr>
              ))}
              {items.length===0 && <tr><td colSpan={11} className="empty-row"><AlertCircle size={18} style={{margin:'0 auto 6px',display:'block'}}/>No requests found</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
