import React, { useState } from "react";
import "./DeveloperTeam.css";

const createDeveloper = () => ({
  id: Date.now() + Math.random(),
  name: "",
  role: "",
  skills: "",
  description: "",
  image: null,
});

export default function DeveloperTeam() {
  const [developers, setDevelopers] = useState([
    createDeveloper(),
    createDeveloper(),
    createDeveloper(),
  ]);

  const updateDeveloper = (id, field, value) => {
    setDevelopers((previous) =>
      previous.map((developer) =>
        developer.id === id
          ? { ...developer, [field]: value }
          : developer
      )
    );
  };

  const handleImageUpload = (id, event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5 MB.");
      event.target.value = "";
      return;
    }

    const imageURL = URL.createObjectURL(file);
    updateDeveloper(id, "image", imageURL);
  };

  const addDeveloper = () => {
    setDevelopers((previous) => [...previous, createDeveloper()]);
  };

  const removeDeveloper = (id) => {
    setDevelopers((previous) =>
      previous.filter((developer) => developer.id !== id)
    );
  };

  return (
    <main className="developer-page">
      <section className="developer-hero">
        <span className="developer-badge">THE PEOPLE BEHIND THE PROJECT</span>

        <h1>
          Meet Our <span>Developers.</span>
        </h1>

        <p>
          The creative minds and technical talent turning ideas into
          reality. Meet the people building something extraordinary.
        </p>
      </section>

      <section className="developer-section">
        <div className="developer-section-header">
          <div>
            <h2>Our Team</h2>
          </div>
        </div>
        <div className= "developer-section">
            <h1>Full Stack Developer</h1>
            <img src="" alt="" />

        </div>
      </section>

      <footer className="developer-footer">
        <p>Built with creativity, collaboration, and code.</p>
      </footer>
    </main>
  );
}
