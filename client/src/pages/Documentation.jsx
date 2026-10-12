import "./Documentation.css";

const contents = [
  { href: "#overview", label: "Overview" },
  { href: "#getting-started", label: "Getting started" },
  { href: "#shopping", label: "Shop and place an order" },
  { href: "#selling", label: "Sell on NicheTrade" },
  { href: "#community", label: "Community features" },
  { href: "#account", label: "Your account" },
  { href: "#pages", label: "Page guide" },
];

const pageGroups = [
  {
    title: "Shopping",
    pages: [
      ["/products", "All products", "Browse the current product listings."],
      ["/products/:category", "Category", "Narrow the catalog to a product category."],
      ["/products/:category/:id", "Product details", "See a listing, its details, and related products."],
      ["/cart", "Cart", "Review items and quantities before ordering."],
      ["/my-orders", "My orders", "Review orders placed by your account."],
      ["/favorites", "Favorites", "Find products you have saved."],
    ],
  },
  {
    title: "Campus community",
    pages: [
      ["/#lost-and-found", "Lost & Found", "Browse or post information about items lost or found on campus."],
      ["/#request-items", "Item requests", "Browse requests or post an item you need brought to campus."],
      ["/objective", "Objective", "Learn why NicheTrade was created."],
      ["/developer-team", "Developer Team", "Meet the team behind the project."],
    ],
  },
  {
    title: "Account and seller tools",
    pages: [
      ["/profile", "Profile", "View your account and update student details."],
      ["/seller/login", "Seller portal", "Sign in to manage product listings and seller orders."],
      ["/admin/login", "Admin portal", "Administrative access for authorized site staff."],
    ],
  },
];

function DocumentationSection({ id, number, title, children }) {
  return (
    <section className="documentation-section" id={id}>
      <div className="documentation-section-heading">
        <span>{number}</span>
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default function Documentation() {
  return (
    <main className="documentation-page">
      <header className="documentation-hero">
        <span className="documentation-eyebrow">NICHE TRADE · USER GUIDE</span>
        <h1>
          NicheTrade <span>Documentation</span>
        </h1>
        <p>
          A practical guide to using the student marketplace at Noorul Islam
          Centre for Higher Education. Learn how to find products, place
          campus orders, sell items, and use the community features.
        </p>
      </header>

      <div className="documentation-layout">
        <nav className="documentation-toc" aria-label="Documentation contents">
          <h2>On this page</h2>
          {contents.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="documentation-content">
          <DocumentationSection id="overview" number="01" title="Overview">
            <p>
              NicheTrade is a student-to-student marketplace for the NICHE
              campus community. It brings product listings, campus delivery
              coordination, lost-and-found notices, and item requests together
              in one place. Students can find useful items at student-friendly
              prices, sell things they no longer need, and create opportunities
              to earn extra money.
            </p>
            <div className="documentation-callout">
              Use NicheTrade to discover listings and connect with the campus
              community. Check each listing and agree on item condition,
              availability, delivery arrangements, and any payment details
              before completing an exchange.
            </div>
          </DocumentationSection>

          <DocumentationSection id="getting-started" number="02" title="Getting started">
            <ol className="documentation-steps">
              <li>
                <span>1</span>
                <div>
                  <h3>Open the site</h3>
                  <p>
                    The Home page highlights products, Lost &amp; Found posts,
                    and item requests. Use the navigation bar to open the full
                    product catalog or search for an item.
                  </p>
                </div>
              </li>
              <li>
                <span>2</span>
                <div>
                  <h3>Create an account or sign in</h3>
                  <p>
                    Choose Login in the navigation bar. Sign in with email and
                    password, register number and date of birth, or Google.
                    New student accounts collect a name, department, register
                    number, date of birth, mobile number, and student type.
                  </p>
                </div>
              </li>
              <li>
                <span>3</span>
                <div>
                  <h3>Choose what you want to do</h3>
                  <p>
                    Browse and shop, manage your own listings through the
                    separate seller portal, or take part in campus Lost &amp;
                    Found and item requests.
                  </p>
                </div>
              </li>
            </ol>
          </DocumentationSection>

          <DocumentationSection id="shopping" number="03" title="Shop and place an order">
            <div className="documentation-subsection">
              <h3>Find a product</h3>
              <p>
                Open <strong>All Product</strong> to browse listings, use the
                search box to find a product by its name or details, or choose
                a category to narrow the catalog. Search matches product
                names. Open a product to review its description, price, stock,
                seller details, and available images. Product pages may also
                show related products and reviews.
              </p>
            </div>
            <div className="documentation-subsection">
              <h3>Save items and use your cart</h3>
              <p>
                Add products to Favorites to find them later. Add an available
                product to your cart, adjust its quantity within the displayed
                stock limit, and review the subtotal in the cart. You need to
                be signed in to use the cart and continue to checkout.
              </p>
            </div>
            <div className="documentation-subsection">
              <h3>Choose campus delivery details</h3>
              <p>
                At checkout, select a delivery point such as AFC, Near
                Department Store, MBA Canteen, or Cafe Canteen, and choose a
                preferred time such as during lunch break or after college.
                If the provided choices do not fit, enter a custom location or
                time. Review the order total and submit the order.
              </p>
            </div>
            <div className="documentation-subsection">
              <h3>Review an order</h3>
              <p>
                Open <strong>My Orders</strong> to view your orders, item
                quantities, delivery preferences, totals, and current status.
                Select an order to see its details. The order page provides
                the available cancellation option when applicable.
              </p>
            </div>
          </DocumentationSection>

          <DocumentationSection id="selling" number="04" title="Sell on NicheTrade">
            <p>
              Seller accounts use a separate seller sign-in and dashboard.
              Open the account login panel and choose Seller Login or Seller
              Sign Up, then use the seller portal to manage your shop.
            </p>
            <ol className="documentation-steps">
              <li>
                <span>1</span>
                <div>
                  <h3>Create a listing</h3>
                  <p>
                    Provide the product name, description, category, price,
                    available stock, and at least one product image. You can
                    also set an offer price and mark a product as a best
                    seller. A new category can be entered when needed.
                  </p>
                </div>
              </li>
              <li>
                <span>2</span>
                <div>
                  <h3>Manage products and orders</h3>
                  <p>
                    Use Product List to review and manage your listings, and
                    Orders to inspect orders containing your products. Keep
                    stock information accurate so buyers can make informed
                    choices.
                  </p>
                </div>
              </li>
              <li>
                <span>3</span>
                <div>
                  <h3>Check listing access</h3>
                  <p>
                    New sellers receive a limited free listing trial. When
                    those free listings are used, an active seller
                    subscription is required to create additional listings.
                    The Subscription page displays available monthly and
                    yearly plans and subscription status.
                  </p>
                </div>
              </li>
            </ol>
          </DocumentationSection>

          <DocumentationSection id="community" number="05" title="Community features">
            <div className="documentation-feature-grid">
              <article>
                <h3>Lost &amp; Found</h3>
                <p>
                  Browse campus notices for lost and found items. To create a
                  notice, choose Add Lost Product or Add Found Product and
                  provide the item details requested in the form. Open a post
                  to view its details and follow the contact or claim
                  instructions shown there.
                </p>
              </article>
              <article>
                <h3>Request an item</h3>
                <p>
                  If you need something brought to campus, post an item
                  request with its name, image, description, and the extra
                  amount you promise to pay the person who brings it. You must
                  be signed in to post. Other students can browse requests and
                  use the displayed requester information to respond.
                </p>
              </article>
            </div>
          </DocumentationSection>

          <DocumentationSection id="account" number="06" title="Your account">
            <div className="documentation-subsection">
              <h3>Profile</h3>
              <p>
                Open Profile from the signed-in account menu to review your
                account information and update student details such as
                department, register number, mobile number, student type, and
                date of birth.
              </p>
            </div>
            <div className="documentation-subsection">
              <h3>Sign out</h3>
              <p>
                Choose Logout from the account menu when you have finished.
                Seller accounts also have a separate logout control in the
                seller dashboard.
              </p>
            </div>
            <div className="documentation-callout">
              Keep your account and contact details current. Only share
              information needed to arrange a campus exchange, and confirm
              arrangements directly with the other student.
            </div>
          </DocumentationSection>


          <DocumentationSection id="pages" number="07" title="Page guide">
            <p className="documentation-page-guide-intro">
              These are the main destinations available through the site.
              Seller and admin tools are intended for their respective
              accounts.
            </p>
            <div className="documentation-page-groups">
              {pageGroups.map((group) => (
                <section className="documentation-page-group" key={group.title}>
                  <h3>{group.title}</h3>
                  <dl>
                    {group.pages.map(([path, title, description]) => (
                      <div key={path}>
                        <dt>{title}</dt>
                        <dd>
                          <code>{path}</code>
                          <span>{description}</span>
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
            </div>
          </DocumentationSection>

          <footer className="documentation-footer">
            NicheTrade is a campus marketplace project created to make student
            buying, selling, and helping one another easier.
          </footer>
        </div>
      </div>
    </main>
  );
}
