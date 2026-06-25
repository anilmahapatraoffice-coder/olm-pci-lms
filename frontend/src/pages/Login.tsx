import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import toast from 'react-hot-toast';
import { Phone } from 'lucide-react';

export default function Login() {
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mobile.length < 10) return toast.error('Enter a valid 10-digit mobile number');
    setLoading(true);
    try {
      await login(mobile);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logos">
          <img src="/logos/odisha-logo.png" alt="Odisha" />
          <img src="/logos/olm-logo.png" alt="OLM" />
          <img src="/logos/pci-logo.png" alt="PCI" />
        </div>
        <h2>{t.login_title}</h2>
        <p className="auth-subtitle">{t.login_subtitle}</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <Phone size={18} className="input-icon" />
            <input
              type="tel"
              placeholder={t.login_placeholder}
              value={mobile}
              onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
              required maxLength={10}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '...' : t.login_btn}
          </button>
        </form>
        <p className="auth-footer">
          {t.login_new} <Link to="/register">{t.register_here}</Link>
        </p>
      </div>
    </div>
  );
}
