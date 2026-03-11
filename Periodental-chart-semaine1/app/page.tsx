export default function Home() {
  return (
    <div style={{ padding: '50px', fontFamily: 'sans-serif' }}>
      <h1>Backend API Running</h1>
      <p>Routes disponibles :</p>
      <ul>
        <li><code>/api/patients</code></li>
        <li><code>/api/tooth-sites/batch</code></li>
      </ul>
    </div>
  );
}
