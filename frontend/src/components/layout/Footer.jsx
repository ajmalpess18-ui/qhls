export default function Footer() {
  return (
    <footer className="footer">
      <p>
        © {new Date().getFullYear()} <strong style={{ color: 'var(--green)' }}>QHLS</strong> — Quran Hadees Learning School.
        All rights reserved.
      </p>
      <p style={{ marginTop: '0.4rem', fontSize: '0.8rem' }}>
        For support contact your Unit administrator.
      </p>
    </footer>
  );
}
