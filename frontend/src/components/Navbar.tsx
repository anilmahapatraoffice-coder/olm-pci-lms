import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang, Lang } from '../context/LanguageContext';
import { Menu, X, User, LogOut } from 'lucide-react';

const langLabels: Record<Lang, string> = { en: 'EN', or: 'ଓ', hi: 'हि' };
const langFull: Record<Lang, string> = { en: 'English', or: 'ଓଡ଼ିଆ', hi: 'हिंदी' };

export default function Navbar() {
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useLang();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => { logout(); navigate('/'); };

  // Close the language dropdown on outside click/tap instead of relying on
  // onMouseLeave, which fires while the cursor crosses the gap between the
  // button and the menu — closing it before a click can register.
  useEffect(() => {
    if (!langOpen) return;
    const onOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [langOpen]);

  return (
    <nav className="navbar">
      {/* Brand */}
      <div className="navbar-brand">
        <img src="/logos/odisha-logo.png" alt="Odisha" className="nav-logo" />
        <img src="/logos/olm-logo.png" alt="OLM" className="nav-logo" />
        <img src="/logos/pci-logo.png" alt="PCI" className="nav-logo" />
        <div className="nav-title-block">
          <span className="nav-title">Learning Management System</span>
          <span className="nav-subtitle">OLM – PCI</span>
        </div>
      </div>

      <button className="menu-toggle" onClick={() => setMenuOpen(o => !o)}>
        {menuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
        <Link to="/" onClick={() => setMenuOpen(false)}>{t.nav_home}</Link>
        {user ? (
          <>
            <Link to="/dashboard" onClick={() => setMenuOpen(false)}>{t.nav_dashboard}</Link>
            {user.role === 'admin' && <Link to="/admin" onClick={() => setMenuOpen(false)}>{t.nav_admin}</Link>}
            <div className="nav-user"><User size={15} /><span>{user.name}</span></div>
            <button className="btn-logout" onClick={handleLogout}><LogOut size={15} /> {t.nav_logout}</button>
          </>
        ) : (
          <>
            <Link to="/login" onClick={() => setMenuOpen(false)}>{t.nav_login}</Link>
            <Link to="/register" className="btn-register" onClick={() => setMenuOpen(false)}>{t.nav_register}</Link>
          </>
        )}

        {/* Language Switcher */}
        <div className="lang-switcher" ref={langRef}>
          <button className="lang-btn" onClick={() => setLangOpen(o => !o)}>
            🌐 {langLabels[lang]}
          </button>
          {langOpen && (
            <div className="lang-dropdown">
              {(Object.keys(langLabels) as Lang[]).map(l => (
                <button key={l}
                  className={`lang-option ${lang === l ? 'active' : ''}`}
                  onClick={() => { setLang(l); setLangOpen(false); setMenuOpen(false); }}>
                  {langFull[l]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
