import "./DeveloperTeam.css";

// Edit these entries to populate the page; image paths can point to files in client/public.
const developers = [
  {
    name: "Moia Gangte",
    role: "Developer",
    skills: "React, Node.js, MongoDB, JavaScript, HTML, CSS",
    description: "I am a Student of Noorul Islam For Higher Education, pursuing B.E in Artificail Intelligence and Data Science I am passionate about web development and love to create interactive and user-friendly web applications.",
    image: "Developer.jpg",
  },
  {
    name: "",
    role: "",
    skills: "",
    description: "",
    image: "",
  },
];

function DeveloperCard({ developer, index, featured = false }) {
  return (
    <article
      className={`developer-card ${featured ? "developer-card-featured" : ""}`}
    >
      <div className="developer-card-top">
        <span className="developer-number">
          MEMBER {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      <div className="developer-image-frame">
        {developer.image ? (
          <img
            src={developer.image}
            alt={developer.name || "Developer portrait"}
            className="developer-photo"
          />
        ) : (
          <div className="developer-image-placeholder">
            Add an image path in the developers list
          </div>
        )}
      </div>

      <div className="developer-card-caption">
        <h3>{developer.name || "Developer Name"}</h3>
        <p>{developer.role || "Add a role in the developers list"}</p>
        {developer.skills && (
          <span className="developer-skills">{developer.skills}</span>
        )}
        {developer.description && (
          <p className="developer-description">{developer.description}</p>
        )}
      </div>
    </article>
  );
}

export default function DeveloperTeam() {
  const featuredDeveloper = developers[0];
  const otherDevelopers = developers.slice(1);

  return (
    <main className="developer-page">
      <section className="developer-showcase">
        <div className="developer-featured">
          {featuredDeveloper && (
            <DeveloperCard developer={featuredDeveloper} index={0} featured />
          )}
        </div>

        <div className="developer-hero">
          <span className="developer-badge">
            OUR PEOPLE · OUR PASSION
          </span>

          <h1>
            Meet Our <span>Developers.</span>
          </h1>

          <p>
            Great ideas are built by great people. Meet the talented
            developers combining creativity, technology, and teamwork
            to bring every project to life.
          </p>
          <p>
            From front-end wizards to back-end architects, our team
            is dedicated to crafting seamless digital experiences.
          </p>

          <div className="developer-hero-note">
            <span className="developer-status-dot" />
            Building the future, one line at a time.
          </div>
        </div>
      </section>

      <section className="developer-section">
        <div className="developer-section-header">
          <div>
            <span className="developer-section-eyebrow">
              THE PEOPLE BEHIND THE PROJECT
            </span>
            <h2>Our Team</h2>
            <p>
              A closer look at the people who make it all happen.
            </p>
          </div>
        </div>

        {otherDevelopers.length > 0 ? (
          <div className="developer-grid">
            {otherDevelopers.map((developer, index) => (
              <DeveloperCard
                key={`${developer.name}-${index}`}
                developer={developer}
                index={index + 1}
              />
            ))}
          </div>
        ) : (
          <div className="developer-empty">
            <h3>No other team members yet.</h3>
            <p>Add another developer entry in the developers list in this file.</p>
          </div>
        )}
      </section>

      <footer className="developer-footer">
        <span className="footer-line" />
        <p>Built with creativity, collaboration, and code.</p>
      </footer>
    </main>
  );
}
