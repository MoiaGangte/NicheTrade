import "./Objective.css";

const objectives = [
  {
    title: "Buy and sell on campus",
    description:
      "Give students a convenient place to list useful items, discover affordable finds, and connect with other members of the college community.",
  },
  {
    title: "Help lost items find their way home",
    description:
      "Make it easier to share lost-and-found notices so misplaced belongings can be reunited with the students who own them.",
  },
  {
    title: "Create earning opportunities",
    description:
      "Help students earn extra money by offering services to other students (such as deliver request item) Or by selling items they no longer need, fostering a culture of entrepreneurship and self-reliance.",
  },
];

export default function Objective() {
  return (
    <main className="objective-page">
      <section className="objective-hero">
        <span className="objective-eyebrow">WHY NICHETRADE EXISTS</span>
        <h1>
          A campus community built to <span>share more.</span>
        </h1>
        <p>
          NicheTrade is a student-focused marketplace for the Noorul Islam
          Centre for Higher Education community. It brings buying, selling, and
          lost-and-found notices together in one place, helping students find
          useful products, delivery items for hosteller, and earn extra
          money along the way.
        </p>
      </section>

      <section className="objective-cards" aria-label="Our objectives">
        {objectives.map((objective, index) => (
          <article className="objective-card" key={objective.title}>
            <span className="objective-card-number">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h2>{objective.title}</h2>
            <p>{objective.description}</p>
          </article>
        ))}
      </section>

      <p className="objective-closing">
        Our goal is to make campus life a little more connected, resourceful, supportive for every student and a chance to start earning our own pocket money as a student
      </p>
    </main>
  );
}
