import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import toast from 'react-hot-toast';

const ODISHA_DISTRICTS = [
  'Angul','Balangir','Balasore','Bargarh','Bhadrak','Boudh','Cuttack','Deogarh',
  'Dhenkanal','Gajapati','Ganjam','Jagatsinghpur','Jajpur','Jharsuguda','Kalahandi',
  'Kandhamal','Kendrapara','Kendujhar','Khordha','Koraput','Malkangiri','Mayurbhanj',
  'Nabarangpur','Nayagarh','Nuapada','Puri','Rayagada','Sambalpur','Sonepur','Sundargarh'
];

const DESIGNATIONS = [
  'Admin',
  'District Officials',
  'Block Officials',
  'MBK (Master Book Keeper)',
  'GCRP (Gender Community Resource Person)',
  'CRP (Community Resource Person)',
  'EC Members (Executive Committee)',
  'GPP (Gender Point Person)',
  'SHG Members',
  'Others'
];

export default function Register() {
  const [form, setForm] = useState({ mobile:'', name:'', designation:'', district:'', block:'', gp:'' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [f]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.mobile.length !== 10) return toast.error('Enter a valid 10-digit mobile number');
    if (!form.name.trim()) return toast.error('Name is required');
    setLoading(true);
    try {
      await register(form);
      toast.success('Registration successful!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide">
        <div className="auth-logos">
          <img src="/logos/odisha-logo.png" alt="Odisha" />
          <img src="/logos/olm-logo.png" alt="OLM" />
          <img src="/logos/pci-logo.png" alt="PCI" />
        </div>
        <h2>{t.reg_title}</h2>
        <p className="auth-subtitle">{t.reg_subtitle}</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-grid">
            <div className="form-group">
              <label>{t.reg_mobile}</label>
              <input type="tel" placeholder="10-digit mobile" value={form.mobile}
                onChange={e => setForm(p => ({ ...p, mobile: e.target.value.replace(/\D/g,'').slice(0,10) }))}
                required maxLength={10} />
            </div>
            <div className="form-group">
              <label>{t.reg_name}</label>
              <input type="text" placeholder="Your full name" value={form.name} onChange={set('name')} required />
            </div>
            <div className="form-group">
              <label>{t.reg_designation}</label>
              <select value={form.designation} onChange={set('designation')}>
                <option value="">Select Designation</option>
                {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>{t.reg_district}</label>
              <select value={form.district} onChange={set('district')}>
                <option value="">Select District</option>
                {ODISHA_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>{t.reg_block}</label>
              <input type="text" placeholder="Block name" value={form.block} onChange={set('block')} />
            </div>
            <div className="form-group">
              <label>{t.reg_gp}</label>
              <input type="text" placeholder="GP name" value={form.gp} onChange={set('gp')} />
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '...' : t.reg_btn}
          </button>
        </form>
        <p className="auth-footer">
          {t.reg_have_account} <Link to="/login">{t.signin_here}</Link>
        </p>
      </div>
    </div>
  );
}
