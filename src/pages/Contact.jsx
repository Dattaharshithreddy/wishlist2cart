import React from "react";

const Contact = () => (
  <main className="max-w-3xl mx-auto py-16 px-6 prose prose-gray dark:prose-invert">
    <h1 className="text-4xl font-bold mb-6">Get in Touch</h1>

    <p className="text-lg">
      We’d love to hear from you! Whether you have questions, suggestions, or need assistance, don’t hesitate to reach out.
    </p>

    <section className="mt-8">
      <h2 className="text-2xl font-semibold">Email</h2>
      <p className="text-md">
        For support or inquiries, reach us at:{" "}
        <a
          href="mailto:support@wishlist2cart.com"
          className="text-violet-600 hover:underline"
        >
          support@wishlist2cart.com
        </a>
      </p>
    </section>

    <section className="mt-6">
      <h2 className="text-2xl font-semibold">Address</h2>
      <address className="not-italic text-md">
        Sai Nagar<br />
        Sullurpeta, 524121<br />
        Andhra Pradesh, India
      </address>
    </section>

    <p className="mt-8 text-sm text-muted-foreground">
      We typically respond to emails within 24–48 hours. Thank you for reaching out!
    </p>
  </main>
);

export default Contact;
