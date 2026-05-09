import { useState, useEffect } from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { Link } from 'react-router-dom';
import { Search, Download, BookOpen, Users, Building2, MapPin, GraduationCap, ChevronUp, FileSearch, BookMarked } from 'lucide-react';

const quickLinks = [
  { id: 'ql-results',   to: '/results',   icon: Search,      label: 'Results',     labelMl: 'ഫലങ്ങൾ' },
  { id: 'ql-downloads', to: '/downloads', icon: Download,     label: 'Downloads',   labelMl: 'ഡൗൺലോഡ്' },
  { id: 'ql-centers',   to: '/results',   icon: Building2,   label: 'Centers',     labelMl: 'കേന്ദ്രങ്ങൾ' },
  { id: 'ql-syllabus',  to: '/downloads', icon: BookMarked,  label: 'Syllabus',    labelMl: 'സിലബസ്' },
];

const features = [
  { icon: BookOpen,      title: 'ക്വുർആൻ പഠനം',       desc: 'സർട്ടിഫൈഡ് അധ്യാപകരുടെ കീഴിൽ ക്രമീകൃത ഖുർആൻ വിദ്യാഭ്യാസം' },
  { icon: BookOpen,      title: 'ഹദീഥ് പഠനം',           desc: 'ഹദീഥും അതിന്റെ ശാസ്ത്രങ്ങളും ആഴത്തിൽ പഠിക്കുക' },
  { icon: GraduationCap, title: 'പതിവ് പരീക്ഷകൾ',       desc: 'പതിവ് മൂല്യനിർണ്ണയത്തിലൂടെ അക്കാദമിക് പ്രഗതി ട്രാക്ക് ചെയ്യുക' },
  { icon: Users,         title: 'യോഗ്യതയുള്ള അധ്യാപകർ', desc: 'പരിചയസമ്പന്നരും സമർപ്പിതരുമായ അധ്യാപക ജീവനക്കാർ' },
  { icon: Building2,     title: 'രാജ്യവ്യാപക കേന്ദ്രങ്ങൾ', desc: 'രാജ്യമെമ്പാടും പരന്നുകിടക്കുന്ന പഠന കേന്ദ്രങ്ങൾ' },
  { icon: MapPin,        title: 'ശ്രേണീബദ്ധ ശൃംഖല',     desc: 'സംഘടിത സംസ്ഥാനം → ജില്ല → സോൺ → യൂണിറ്റ് ഘടന' },
];

function ScrollTopBtn() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return visible ? (
    <button
      id="scroll-top-btn"
      className="scroll-top-btn"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Scroll to top"
    >
      <ChevronUp size={20} />
    </button>
  ) : null;
}

export default function LandingPage() {
  return (
    <div className="page-wrapper">
      <Navbar />

      {/* ── Hero ── */}
      <section className="lp-hero">
        {/* Background watermark icon */}
        <div className="lp-hero-watermark" aria-hidden="true">
          <svg viewBox="0 0 160 130" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Left arch */}
            <path d="M10 125 L10 70 Q10 30 45 30 Q80 30 80 70 L80 125" stroke="currentColor" strokeWidth="10" fill="none" strokeLinecap="round"/>
            {/* Middle arch (taller) */}
            <path d="M50 125 L50 55 Q50 5 80 5 Q110 5 110 55 L110 125" stroke="currentColor" strokeWidth="10" fill="none" strokeLinecap="round"/>
            {/* Right arch */}
            <path d="M80 125 L80 70 Q80 30 115 30 Q150 30 150 70 L150 125" stroke="currentColor" strokeWidth="10" fill="none" strokeLinecap="round"/>
          </svg>
        </div>

        {/* Dotted pattern overlay */}
        <div className="lp-hero-dots" aria-hidden="true" />

        <div className="lp-hero-content">
          {/* Bordered title box */}
          <div className="lp-title-box">
            <h1>ക്വുർആൻ ഹദീഥ്<br />ലേണിംഗ് സ്കൂൾ</h1>
          </div>

          {/* Malayalam subtitle */}
          <p className="lp-subtitle">
            പ്രായലിംഗ ഭേദമന്യേ ഏതൊരു സാധാരണക്കാരനും ക്വുർആനും ഹദീഥും
            പഠിക്കാനുള്ള വ്യവസ്ഥാപിത മതപഠന സംരംഭം
          </p>

        </div>
      </section>

      {/* ── Quick Links ── */}
      <section className="lp-quicklinks-section">
        <div className="lp-quicklinks-track">
          {quickLinks.map((ql) => (
            <Link key={ql.id} id={ql.id} to={ql.to} className="lp-quicklink-item">
              <div className="lp-quicklink-circle">
                <ql.icon size={26} strokeWidth={1.5} />
              </div>
              <span className="lp-quicklink-label">{ql.label}</span>
              <span className="lp-quicklink-ml">{ql.labelMl}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── About Us Card ── */}
      <section className="section" style={{ background: 'var(--white)' }}>
        <div className="container">
          <div className="lp-about-label">About Us</div>
          <div className="lp-about-card">
            <p className="lp-about-desc">
              വിശുദ്ധഖുർആൻ ആധികാരിക തഫ്സീറുകളുടെ അടിസ്ഥാനത്തിൽ സലഫുകളുടെ
              രീതിശാസ്ത്രം അവലംബിച്ച് പഠിപ്പിക്കുന്നതിനുള്ള സംവിധാനം
            </p>
            <ul className="lp-bullet-list">
              <li><span className="lp-bullet-icon" aria-hidden="true">❯</span>പ്രായലിംഗ ഭേദമന്യേ എല്ലാവർക്കും പ്രവേശനം</li>
              <li><span className="lp-bullet-icon" aria-hidden="true">❯</span>വ്യവസ്ഥാപിതമായ സിലബസ്</li>
              <li><span className="lp-bullet-icon" aria-hidden="true">❯</span>കേരളത്തിനകത്തും പുറത്തും സെൻ്ററുകൾ</li>
              <li><span className="lp-bullet-icon" aria-hidden="true">❯</span>ആധുനിക സാങ്കേതിക വിദ്യകൾ ഉപയോഗിച്ചുള്ള പഠന രീതി</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── Mission Statement ── */}
      <section className="lp-mission-section">
        <div className="container">
          <p className="lp-mission-text">
            മത പഠനം ഓരോ വിശ്വാസിയുടേയും വ്യക്തിബാധ്യതയാണ്. സ്വർഗം നേടാൻ പര്യാപ്തമാക്കുന്ന
            പ്രധാന കാര്യമാണ് മത പഠനം. മത വിഷയങ്ങളിൽ ഏറ്റവും ഉന്നതിയിൽ നിൽക്കുന്നത് ഖുർആൻ ആണ്.
            &ldquo;ഖുർആൻ പഠിക്കുകയും പഠിപ്പിക്കുകയും ചെയ്യുന്നവരാണ് ജനങ്ങളിൽ ഉത്തമർ&rdquo; എന്നത്
            പ്രവാചകൻ (സ്വ) ന്റെ ഓർമ്മപ്പെടുത്തലുമാണ്.
          </p>
          <p className="lp-mission-text">
            ഖുർആൻ പഠനത്തിന് എല്ലാ തരം വ്യക്തികളേയും പ്രാപ്തരാക്കുക എന്ന ലക്ഷ്യത്തോടെയുള്ള
            സംവിധാനമാണ് ഖുർആൻ ഹദീഥ് ലേർണിങ് സ്കൂൾ (QHLS). ഖുർആൻ പഠിക്കുകയും പകർത്തുകയും
            മറ്റുള്ളവരെ ബോധ്യപ്പെടുത്തുകയും ചെയ്യുന്ന ഒരു തലമുറയെ വളർത്തിയെടുക്കുകയാണ്
            ഈ പദ്ധതിയുടെ ലക്ഷ്യം.
          </p>
          <p className="lp-mission-text">
            ദൈവ നിഷേധം, ശിർക്ക്, കപട ആത്മീയത, ചൂഷണങ്ങൾ, കുടുംബ ശൈഥില്യം, അധാർമ്മിക
            പ്രവണതകൾ, തീവ്രവാദം തുടങ്ങിയ സാമൂഹിക പ്രശ്നങ്ങൾക്ക് പരിഹാരം യഥാർത്ഥ ഖുർആൻ
            പഠനത്തിലൂടെ സാധ്യമാകും. സാധാരണക്കാരന് അതിനാവശ്യമായ പരിശീലനമാണ് QHLS ലക്ഷ്യമിടുന്നത്.
          </p>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="section" style={{ background: 'var(--bg)' }}>
        <div className="container">
          <div className="section-title">
            <h2>ഞങ്ങളുടെ പ്രോഗ്രാമുകൾ</h2>
            <p>എല്ലാ തലങ്ങൾക്കും സമഗ്ര ഇസ്‌ലാമിക വിദ്യാഭ്യാസം</p>
          </div>
          <div className="feature-grid">
            {features.map((f, i) => (
              <div key={i} className="feature-card">
                <div className="fc-icon"><f.icon size={18} /></div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>



      <Footer />
      <ScrollTopBtn />
    </div>
  );
}
