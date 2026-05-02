import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { Link } from 'react-router-dom';
import { Search, Download, BookOpen, Users, Building2, MapPin, GraduationCap } from 'lucide-react';

const features = [
  { icon: BookOpen,      title: 'Quran Learning',      desc: 'Structured Quranic education from certified teachers' },
  { icon: BookOpen,      title: 'Hadees Studies',       desc: 'In-depth study of Hadith and its sciences' },
  { icon: GraduationCap, title: 'Regular Exams',        desc: 'Track academic progress through regular assessments' },
  { icon: Users,         title: 'Qualified Faculty',    desc: 'Experienced and dedicated teaching staff' },
  { icon: Building2,     title: 'Centers Nationwide',   desc: 'Learning centers spread across the country' },
  { icon: MapPin,        title: 'Hierarchical Network', desc: 'Organized State → District → Zone → Unit structure' },
];

export default function LandingPage() {
  return (
    <div className="page-wrapper">
      <Navbar />

      {/* Hero */}
      <section className="hero">
        <h1>Quran Hadees Learning School</h1>
        <p>
          A nationwide Islamic education network dedicated to spreading Quranic and Hadees knowledge
          through organized centers across states, districts, and zones.
        </p>
        <div className="hero-actions">
          <Link to="/results"   className="btn btn-primary">
            <Search size={16} /> Check Results
          </Link>
          <Link to="/downloads" className="btn btn-outline">
            <Download size={16} /> Study Materials
          </Link>
        </div>
      </section>

      {/* About */}
      <section className="section" style={{ background: 'var(--white)' }}>
        <div className="container">
          <div className="section-title">
            <h2>About QHLS</h2>
            <p>
              QHLS is a structured Islamic learning institution operating through a network of
              registered centers. Students receive quality education in Quran recitation, Tajweed,
              and Hadees sciences under qualified faculty members.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section" style={{ background: 'var(--bg)' }}>
        <div className="container">
          <div className="section-title">
            <h2>Our Programs</h2>
            <p>Comprehensive Islamic education for all levels</p>
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

      {/* CTA */}
      <section className="section" style={{ background: 'var(--green-light)', textAlign: 'center' }}>
        <div className="container">
          <h2>Check Your Results</h2>
          <p style={{ marginBottom: '1.25rem' }}>
            Any visitor can check student results using a registration number — no login required.
          </p>
          <Link to="/results" className="btn btn-primary">
            <Search size={16} /> Check Now
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
