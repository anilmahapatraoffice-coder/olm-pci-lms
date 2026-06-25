import React, { createContext, useContext, useState } from 'react';

export type Lang = 'en' | 'or' | 'hi';

interface Translations {
  nav_home: string;
  nav_login: string;
  nav_register: string;
  nav_dashboard: string;
  nav_admin: string;
  nav_logout: string;
  hero_title: string;
  hero_subtitle: string;
  hero_signin: string;
  hero_register: string;
  hero_dashboard: string;
  courses_title: string;
  courses_subtitle: string;
  material_title: string;
  material_subtitle: string;
  material_poster: string;
  material_poster_desc: string;
  material_leaflet: string;
  material_leaflet_desc: string;
  material_video: string;
  material_video_desc: string;
  footer_text: string;
  login_title: string;
  login_subtitle: string;
  login_placeholder: string;
  login_btn: string;
  login_new: string;
  register_here: string;
  reg_title: string;
  reg_subtitle: string;
  reg_mobile: string;
  reg_name: string;
  reg_designation: string;
  reg_district: string;
  reg_block: string;
  reg_gp: string;
  reg_btn: string;
  reg_have_account: string;
  signin_here: string;
  enroll_now: string;
  view_course: string;
  coming_soon: string;
  coming_soon_desc: string;
}

const translations: Record<Lang, Translations> = {
  en: {
    nav_home: 'Home',
    nav_login: 'Login',
    nav_register: 'Register',
    nav_dashboard: 'Dashboard',
    nav_admin: 'Admin',
    nav_logout: 'Logout',
    hero_title: 'Learning Management System',
    hero_subtitle: 'Self Learning Training Modules for OLM Cadders',
    hero_signin: 'Sign In',
    hero_register: 'Register Now',
    hero_dashboard: 'Go to Dashboard',
    courses_title: 'Available Courses',
    courses_subtitle: 'Enroll and start learning at your own pace',
    material_title: 'What You Will Learn',
    material_subtitle: 'Easy to understand materials available in Odia for SHG Members',
    material_poster: 'Posters',
    material_poster_desc: 'Visual learning aids with colourful posters',
    material_leaflet: 'Leaflets',
    material_leaflet_desc: 'Simple illustrated booklets to read & share',
    material_video: 'Videos',
    material_video_desc: 'Watch and learn through short Odia videos',
    footer_text: 'Copyright © 2024. PCI. All Rights Reserved.',
    login_title: 'Sign In',
    login_subtitle: 'Enter your registered mobile number to continue',
    login_placeholder: 'Mobile Number',
    login_btn: 'Sign In',
    login_new: 'New user?',
    register_here: 'Register here',
    reg_title: 'Create Account',
    reg_subtitle: 'Fill in your details to register',
    reg_mobile: 'Mobile Number *',
    reg_name: 'Full Name *',
    reg_designation: 'Designation',
    reg_district: 'District',
    reg_block: 'Block',
    reg_gp: 'Gram Panchayat (GP)',
    reg_btn: 'Register',
    reg_have_account: 'Already registered?',
    signin_here: 'Sign in',
    enroll_now: 'Enroll Now',
    view_course: 'View Course',
    coming_soon: 'More Courses Coming Soon',
    coming_soon_desc: 'New training programs will be added regularly. Stay tuned!',
  },
  or: {
    nav_home: 'ମୁଖ୍ୟ ପୃଷ୍ଠା',
    nav_login: 'ଲଗ୍ ଇନ',
    nav_register: 'ପଞ୍ଜୀକରଣ',
    nav_dashboard: 'ଡ୍ୟାସବୋର୍ଡ',
    nav_admin: 'ଆଡ୍‌ମିନ',
    nav_logout: 'ଲଗ୍ ଆଉଟ',
    hero_title: 'ଶିକ୍ଷା ପ୍ରବନ୍ଧନ ପ୍ରଣାଳୀ',
    hero_subtitle: 'OLM କ୍ୟାଡ଼ର୍ ମାନଙ୍କ ପାଇଁ ସ୍ୱ-ଶିକ୍ଷା ତାଲିମ ମଡ୍ୟୁଲ',
    hero_signin: 'ସାଇନ ଇନ',
    hero_register: 'ପଞ୍ଜୀକରଣ କରନ୍ତୁ',
    hero_dashboard: 'ଡ୍ୟାସବୋର୍ଡ ଦେଖନ୍ତୁ',
    courses_title: 'ଉପଲବ୍ଧ ପାଠ୍ୟକ୍ରମ',
    courses_subtitle: 'ଆପଣଙ୍କ ନିଜ ଗତିରେ ଶିଖନ୍ତୁ',
    material_title: "ଆପଣ କ'ଣ ଶିଖିବେ",
    material_subtitle: 'SHG ସଦସ୍ୟଙ୍କ ପାଇଁ ଓଡ଼ିଆରେ ସହଜ ସାମଗ୍ରୀ',
    material_poster: 'ପୋଷ୍ଟର',
    material_poster_desc: 'ରଙ୍ଗୀନ ପୋଷ୍ଟର ମାଧ୍ୟମରେ ଦୃଶ୍ୟ ଶିକ୍ଷା',
    material_leaflet: 'ପ୍ରଚାର ପତ୍ର',
    material_leaflet_desc: 'ସରଳ ଚିତ୍ରଯୁକ୍ତ ପୁସ୍ତିକା',
    material_video: 'ଭିଡ଼ିଓ',
    material_video_desc: 'ଓଡ଼ିଆ ଭିଡ଼ିଓ ଦେଖି ଶିଖନ୍ତୁ',
    footer_text: 'କପିରାଇଟ © ୨୦୨୪. PCI. ସମସ୍ତ ଅଧିକାର ସଂରକ୍ଷିତ।',
    login_title: 'ସାଇନ ଇନ',
    login_subtitle: 'ଜାରି ରଖିବାକୁ ଆପଣଙ୍କ ମୋବାଇଲ ନମ୍ବର ଦିଅନ୍ତୁ',
    login_placeholder: 'ମୋବାଇଲ ନମ୍ବର',
    login_btn: 'ସାଇନ ଇନ',
    login_new: 'ନୂଆ ବ୍ୟବହାରକାରୀ?',
    register_here: 'ଏଠାରେ ପଞ୍ଜୀକରଣ କରନ୍ତୁ',
    reg_title: 'ଖାତା ତିଆରି କରନ୍ତୁ',
    reg_subtitle: 'ପଞ୍ଜୀକରଣ ପାଇଁ ଆପଣଙ୍କ ବିବରଣ ପୂରଣ କରନ୍ତୁ',
    reg_mobile: 'ମୋବାଇଲ ନମ୍ବର *',
    reg_name: 'ପୂରା ନାମ *',
    reg_designation: 'ପଦବୀ',
    reg_district: 'ଜିଲ୍ଲା',
    reg_block: 'ବ୍ଲକ',
    reg_gp: 'ଗ୍ରାମ ପଞ୍ଚାୟତ (GP)',
    reg_btn: 'ପଞ୍ଜୀକରଣ',
    reg_have_account: 'ପୂର୍ବରୁ ପଞ୍ଜୀକୃତ?',
    signin_here: 'ସାଇନ ଇନ',
    enroll_now: 'ଏବେ ଯୋଗ ଦିଅନ୍ତୁ',
    view_course: 'ପାଠ୍ୟକ୍ରମ ଦେଖନ୍ତୁ',
    coming_soon: 'ଅଧିକ ପାଠ୍ୟକ୍ରମ ଶୀଘ୍ର ଆସୁଛି',
    coming_soon_desc: 'ନୂଆ ତାଲିମ କାର୍ଯ୍ୟକ୍ରମ ନିୟମିତ ଭାବରେ ଯୋଡ଼ା ଯିବ।',
  },
  hi: {
    nav_home: 'मुख्य पृष्ठ',
    nav_login: 'लॉग इन',
    nav_register: 'पंजीकरण',
    nav_dashboard: 'डैशबोर्ड',
    nav_admin: 'एडमिन',
    nav_logout: 'लॉग आउट',
    hero_title: 'शिक्षा प्रबंधन प्रणाली',
    hero_subtitle: 'OLM कैडर के लिए स्व-शिक्षण प्रशिक्षण मॉड्यूल',
    hero_signin: 'साइन इन',
    hero_register: 'अभी पंजीकरण करें',
    hero_dashboard: 'डैशबोर्ड पर जाएं',
    courses_title: 'उपलब्ध पाठ्यक्रम',
    courses_subtitle: 'अपनी गति से सीखें और आगे बढ़ें',
    material_title: 'आप क्या सीखेंगे',
    material_subtitle: 'SHG सदस्यों के लिए ओड़िया में सरल सामग्री',
    material_poster: 'पोस्टर',
    material_poster_desc: 'रंगीन पोस्टर के माध्यम से दृश्य शिक्षा',
    material_leaflet: 'पर्चे',
    material_leaflet_desc: 'सरल सचित्र पुस्तिकाएं पढ़ें और साझा करें',
    material_video: 'वीडियो',
    material_video_desc: 'ओड़िया वीडियो देखकर सीखें',
    footer_text: 'कॉपीराइट © 2024. PCI. सर्वाधिकार सुरक्षित।',
    login_title: 'साइन इन',
    login_subtitle: 'जारी रखने के लिए अपना मोबाइल नंबर दर्ज करें',
    login_placeholder: 'मोबाइल नंबर',
    login_btn: 'साइन इन',
    login_new: 'नए उपयोगकर्ता?',
    register_here: 'यहाँ पंजीकरण करें',
    reg_title: 'खाता बनाएं',
    reg_subtitle: 'पंजीकरण के लिए अपनी जानकारी भरें',
    reg_mobile: 'मोबाइल नंबर *',
    reg_name: 'पूरा नाम *',
    reg_designation: 'पदनाम',
    reg_district: 'जिला',
    reg_block: 'ब्लॉक',
    reg_gp: 'ग्राम पंचायत (GP)',
    reg_btn: 'पंजीकरण',
    reg_have_account: 'पहले से पंजीकृत?',
    signin_here: 'साइन इन करें',
    enroll_now: 'अभी नामांकन करें',
    view_course: 'पाठ्यक्रम देखें',
    coming_soon: 'और पाठ्यक्रम जल्द आ रहे हैं',
    coming_soon_desc: 'नए प्रशिक्षण कार्यक्रम नियमित रूप से जोड़े जाएंगे।',
  }
};

interface LanguageContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const STORAGE_KEY = 'lms_lang';
const isLang = (v: string | null): v is Lang => v === 'en' || v === 'or' || v === 'hi';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return isLang(saved) ? saved : 'en';
  });

  const setLang = (l: Lang) => {
    localStorage.setItem(STORAGE_KEY, l);
    setLangState(l);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLang = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
};
