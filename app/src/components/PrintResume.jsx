// A clean, one-page resume that only appears when the page is printed
// (Ctrl/Cmd+P) or "saved as PDF". Hidden on screen; see the @media print rules
// in index.css. Content mirrors the portfolio (content.js) so it stays accurate.
export default function PrintResume() {
  return (
    <div className="print-resume" aria-hidden="true">
      <header className="pr-head">
        <h1>ROHAN PLANTE</h1>
        <div className="pr-contact">
          rohanplante@gmail.com &nbsp;·&nbsp; github.com/RPlante28 &nbsp;·&nbsp;
          linkedin.com/in/rohan-plante &nbsp;·&nbsp; Middleton, MA
        </div>
      </header>

      <section>
        <h2>Education</h2>
        <div className="pr-row">
          <div className="pr-l">
            <b>Marist University</b> — B.S. Computer Science
            <div className="pr-note">Dean's List every semester · GPA 3.67 / 4.0</div>
          </div>
          <div className="pr-r">2024 – Present · Poughkeepsie, NY</div>
        </div>
        <div className="pr-row">
          <div className="pr-l">
            <b>Essex North Shore Agricultural &amp; Technical School</b> — IT Services
            <div className="pr-note">GPA 4.48 / 5.0 · AP CS A (5), AP CS Principles (5) · Cisco networking &amp; cybersecurity</div>
          </div>
          <div className="pr-r">2020 – 2024 · Danvers, MA</div>
        </div>
      </section>

      <section>
        <h2>Experience</h2>
        <div className="pr-row">
          <div className="pr-l"><b>Internship</b> — Infrastructure</div>
          <div className="pr-r">2026 – Present</div>
        </div>
        <div className="pr-row">
          <div className="pr-l">
            <b>Data Analyst Assistant</b> — Office of Community &amp; Belonging, Marist University
            <div className="pr-note">Building live campus analytics dashboards in Tableau.</div>
          </div>
          <div className="pr-r">Sep 2025 – Present</div>
        </div>
        <div className="pr-row">
          <div className="pr-l">
            <b>Web Developer, Intern</b> — Essex North Shore Agricultural &amp; Technical School
            <div className="pr-note">Automated curriculum maps from the Google Sheets API.</div>
          </div>
          <div className="pr-r">Summer 2023</div>
        </div>
        <div className="pr-row">
          <div className="pr-l"><b>Future Leader to Supervisor</b> — Essex Heritage, historic preservation</div>
          <div className="pr-r">2020 – 2025</div>
        </div>
      </section>

      <section>
        <h2>Projects</h2>
        <ul className="pr-list">
          <li><b>MaristMaps</b> (Best Overall, hackathon) — campus navigation with a voice AI agent. Flask, MapLibre GL, PostGIS, NetworkX, LangChain.</li>
          <li><b>Kitchen Management Suite</b> — full-stack pantry &amp; recipe recommender. Flask, PostgreSQL.</li>
          <li><b>6502 Emulator</b> — a scalar-pipelined CPU built one stage at a time. TypeScript, Node.js.</li>
          <li><b>RAVEN-V</b> — autonomous self-driving car prototype. LiDAR, OpenCV, machine learning.</li>
          <li><b>Randomized Tiered Chests</b> — Minecraft event plugin that auto-tiers loot. Java, Spigot/Paper, Gradle.</li>
          <li><b>This Portfolio</b> — a DOS-era interface that boots and runs real programs. React, Vite, Tailwind.</li>
        </ul>
      </section>

      <section>
        <h2>Skills</h2>
        <div className="pr-skills">
          <div><b>Languages:</b> Python, TypeScript, JavaScript, Java, C, SQL, PHP, HTML/CSS</div>
          <div><b>Tools:</b> Git, Node.js, Flask, PostgreSQL, PostGIS, Linux, VS Code, Tableau</div>
          <div><b>Domains:</b> Machine Learning, OpenCV, LiDAR, MapLibre GL, NetworkX, LangChain, WordPress</div>
        </div>
      </section>

      <section>
        <h2>Awards &amp; Leadership</h2>
        <ul className="pr-list">
          <li><b>Eagle Scout</b> — Scouts BSA; Order of the Arrow inductee (three Silver Palms).</li>
          <li><b>Bernard Harris STEM Supernova Award</b> (2021).</li>
          <li><b>2024 Outstanding Vocational Technical Student</b> — Massachusetts Association of Vocational Administrators.</li>
          <li><b>National Cyber League</b> — collegiate cybersecurity competition.</li>
        </ul>
      </section>

      <div className="pr-foot">Full interactive portfolio at www.rohanplante.com</div>
    </div>
  );
}
