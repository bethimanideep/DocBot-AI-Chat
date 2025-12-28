"use client"
import React from "react";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen flex items-start justify-center p-8">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-semibold mb-4">Privacy Policy</h1>
        <p className="text-sm text-gray-600 mb-4">Effective date: December 29, 2025</p>

        <p className="mb-2">DocBot AI Chat uses Google Sign-In for authentication. This Privacy Policy explains what information we collect, how we use it, and your rights.</p>

        <h2 className="text-xl font-medium mt-4">Information we collect</h2>
        <ul className="list-disc pl-6 mb-2">
          <li>Profile information from Google Sign-In: name, email address, and profile image.</li>
          <li>Content you upload or provide while using the service (for example, documents or messages) — only if applicable to features you use.</li>
        </ul>

        <h2 className="text-xl font-medium mt-4">How we use your information</h2>
        <p className="mb-2">We use the information to create and manage your account, personalize your experience, and provide the core service features. We may also use email to send important account or service-related notices.</p>

        <h2 className="text-xl font-medium mt-4">Sharing and third parties</h2>
        <p className="mb-2">We do not sell, rent, or trade your personal information. We may share information with:</p>
        <ul className="list-disc pl-6 mb-2">
          <li>Service providers that perform functions on our behalf (hosting, analytics) — only as needed and under contract.</li>
          <li>When required by law or to protect rights and safety.</li>
        </ul>

        <h2 className="text-xl font-medium mt-4">Data retention and deletion</h2>
        <p className="mb-2">We retain personal information as long as necessary to provide the service and for legitimate business purposes. If you want your account and data deleted, contact us (below) and we will process reasonable deletion requests.</p>

        <h2 className="text-xl font-medium mt-4">Security</h2>
        <p className="mb-2">We take reasonable administrative, technical, and physical measures to protect your information. No method of transmission or storage is 100% secure; absolute security cannot be guaranteed.</p>

        <h2 className="text-xl font-medium mt-4">Your rights</h2>
        <p className="mb-2">Depending on your jurisdiction, you may have rights to access, correct, or delete your personal data. To exercise these rights, contact us at the email below.</p>

        <h2 className="text-xl font-medium mt-4">Third-party services</h2>
        <p className="mb-2">We rely on third-party services such as Google (for Sign-In) and our hosting provider. Their processing is governed by their own privacy policies.</p>

        <h2 className="text-xl font-medium mt-4">Changes to this policy</h2>
        <p className="mb-2">We may update this policy. We will post the new policy here with an updated effective date.</p>

        <p className="mt-4">Contact: <a href="mailto:bethidinesh2002@gmail.com" className="text-blue-600">bethidinesh2002@gmail.com</a></p>

        <p className="mt-6 text-sm text-gray-600">For terms of service, see <a href="/terms" className="text-blue-600">/terms</a>.</p>
      </div>
    </main>
  );
}
