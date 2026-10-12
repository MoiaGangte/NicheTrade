import React from "react";
import "./Regulations.css";

const rules = [
  {
    number: "01",
    title: "Seller Rules and Responsibilities",
    description:
      "Sellers must provide accurate product information, genuine images, correct prices, and updated availability details.",
    points: [
      "Selling stolen, counterfeit, illegal, or prohibited items is strictly forbidden.",
      "Sellers must communicate respectfully with buyers.",
      "Product descriptions and prices must be honest and accurate.",
      "Fraudulent activities and misleading advertisements may result in account restrictions.",
    ],
  },
  {
    number: "02",
    title: "Buyer Rules and Responsibilities",
    description:
      "Buyers should carefully review product details and communicate with sellers before completing a transaction.",
    points: [
      "Verify the item's condition, price, and availability before purchasing.",
      "Agree on payment and delivery arrangements with the seller.",
      "Do not engage in fraud, harassment, threats, or misleading communication.",
      "Report suspicious sellers, scams, or inappropriate listings to the administrator.",
    ],
  },
  {
    number: "03",
    title: "Product Listing Regulations",
    description:
      "Every product listing must be genuine, relevant, and appropriate for the NICHE campus community.",
    points: [
      "Product information and images must accurately represent the item.",
      "Spam, duplicate listings, offensive content, and misleading advertisements are prohibited.",
      "Listings for illegal or prohibited products are not allowed.",
      "The administrator may review, disable, or permanently remove listings that violate these rules.",
    ],
  },
  {
    number: "04",
    title: "Lost-and-Found Regulations",
    description:
      "Lost-and-found posts should help students recover missing belongings and return found items to their rightful owners.",
    points: [
      "Posts must contain truthful and relevant information.",
      "Users must not falsely claim ownership of found property.",
      "Avoid publishing sensitive personal information.",
      "The administrator may remove false, misleading, duplicate, outdated, or inappropriate posts.",
    ],
  },
  {
    number: "05",
    title: "Item Request Regulations",
    description:
      "Students can use item requests to find products they need within the campus community.",
    points: [
      "Requests must be genuine and relevant to the campus community.",
      "Fake requests, spam, harassment, and requests for prohibited items are not allowed.",
      "Users should provide clear and reasonable details about requested items.",
      "The administrator may disable or remove requests that violate platform rules.",
    ],
  },
  {
    number: "06",
    title: "Administrator Rights and Enforcement",
    description:
      "The NicheTrade administrator is responsible for maintaining a safe, fair, and trustworthy marketplace.",
    points: [
      "Disable seller accounts or selling privileges temporarily when necessary.",
      "Remove seller accounts or permanently revoke selling privileges for serious or repeated violations.",
      "Hide, disable, or remove any product listing, lost-and-found post, or item request that violates the rules.",
      "Restrict or suspend users involved in fraud, harassment, or repeated misconduct.",
      "Investigate user reports and take appropriate action based on available evidence.",
      "Issue warnings and request corrections when appropriate.",
    ],
  },
  {
    number: "07",
    title: "Safe Transactions and User Responsibility",
    description:
      "Users are responsible for making informed decisions and communicating clearly throughout every transaction.",
    points: [
      "Confirm the item's condition, availability, and price before exchanging money.",
      "Agree on a safe and convenient campus delivery or collection location.",
      "Exercise caution when sharing personal information or transferring money.",
      "NicheTrade does not automatically guarantee the quality, authenticity, or availability of listed items.",
    ],
  },
];

const RulesRegulations = () => {
  return (
    <main className="rules-page">
      {/* Hero Section */}
      <section className="rules-hero">
        <span className="rules-eyebrow">NICHETRADE COMMUNITY</span>

        <h1>
          Rules and <span>Regulations</span>
        </h1>

        <p>
          Building a safe, fair, and trustworthy student marketplace.
          Follow these guidelines to ensure a positive buying and selling
          experience for everyone in the NICHE campus community.
        </p>
      </section>

      {/* Introduction */}
      <section className="rules-intro">
        <h2>Our Community Standards</h2>

        <p>
          NicheTrade is a student-to-student marketplace for the NICHE campus
          community. It brings product listings, campus delivery coordination,
          lost-and-found notices, and item requests together in one place.
          Students can discover useful items at student-friendly prices, sell
          things they no longer need, and earn extra money.
        </p>
      </section>

      {/* Rules Cards */}
      <section className="rules-grid">
        {rules.map((rule) => (
          <article className="rules-card" key={rule.number}>
            <span className="rules-card-number">{rule.number}</span>

            <h2>{rule.title}</h2>

            <p className="rules-card-description">{rule.description}</p>

            <ul>
              {rule.points.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      {/* Administrator Policy */}
      <section className="rules-policy">
        <span className="rules-eyebrow">ADMINISTRATOR POLICY</span>

        <h2>Maintaining a Responsible Marketplace</h2>

        <p>
          Only authorized administrators may disable seller accounts, restrict
          selling privileges, or remove posts. Administrative actions should
          be applied responsibly and consistently. Where appropriate, affected
          users should be informed of the reason for an action and given an
          opportunity to appeal.
        </p>

        <div className="rules-policy-highlight">
          <strong>Important:</strong> The administrator may take action against
          any seller or user who violates the platform rules. Depending on the
          severity of the violation, this may include a warning, post removal,
          temporary suspension, or permanent account restrictions.
        </div>
      </section>

      {/* Closing Section */}
      <section className="rules-closing">
        <h2>Help Us Build a Better Campus Community</h2>

        <p>
          By using NicheTrade, you agree to follow these rules and regulations.
          Treat other students respectfully, provide honest information, and
          report suspicious activities to the administrator. Together, we can
          make campus buying and selling safer and easier.
        </p>
      </section>
    </main>
  );
};

export default RulesRegulations;