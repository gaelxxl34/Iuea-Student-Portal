import Image from 'next/image';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | IUEA',
  description: 'Privacy Policy for International University of East Africa student portal and services.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with IUEA Logo */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-center mb-4">
            <a 
              href="/"
              className="cursor-pointer hover:opacity-80 transition-opacity"
              title="Back to Home"
            >
              <Image
                src="/small logo iuea.png"
                alt="IUEA Logo"
                width={80}
                height={80}
                className="object-contain"
              />
            </a>
          </div>
          <h1 className="text-3xl font-bold text-center text-[#780000] mb-2">
            Privacy Policy
          </h1>
          <p className="text-center text-gray-600">
            International University of East Africa (IUEA)
          </p>
        </div>

        {/* Privacy Content */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="prose max-w-none">
            <p className="text-sm text-gray-500 mb-6">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-[#780000] mb-4">1. Information We Collect</h2>
              <p className="text-gray-700 mb-4">
                We collect information you provide directly to us, such as when you create an account, 
                submit an application, or contact us. This may include:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Personal identification information (name, email address, phone number)</li>
                <li>Academic information and transcripts</li>
                <li>WhatsApp number for communication purposes</li>
                <li>Account credentials and preferences</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-[#780000] mb-4">2. How We Use Your Information</h2>
              <p className="text-gray-700 mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Process your application and provide educational services</li>
                <li>Communicate with you about your account and our services</li>
                <li>Send important updates and notifications via WhatsApp</li>
                <li>Improve our services and user experience</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-[#780000] mb-4">3. WhatsApp Communication</h2>
              <p className="text-gray-700 mb-4">
                By providing your WhatsApp number, you consent to receive important communications 
                from IUEA via WhatsApp, including:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Application status updates</li>
                <li>Academic announcements</li>
                <li>Administrative notices</li>
                <li>Support and assistance</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-[#780000] mb-4">4. Information Sharing</h2>
              <p className="text-gray-700 mb-4">
                We do not sell, trade, or otherwise transfer your personal information to third parties 
                without your consent, except in the following circumstances:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>To comply with legal requirements</li>
                <li>To protect our rights and safety</li>
                <li>With service providers who assist in our operations</li>
                <li>With your explicit consent</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-[#780000] mb-4">5. Data Security</h2>
              <p className="text-gray-700 mb-4">
                We implement appropriate security measures to protect your personal information against 
                unauthorized access, alteration, disclosure, or destruction. However, no method of 
                transmission over the internet is 100% secure.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-[#780000] mb-4">6. Data Retention</h2>
              <p className="text-gray-700 mb-4">
                We retain your personal information for as long as necessary to provide our services 
                and comply with legal obligations. Academic records may be retained permanently as 
                required by educational regulations.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-[#780000] mb-4">7. Your Rights</h2>
              <p className="text-gray-700 mb-4">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Access and update your personal information</li>
                <li>Request deletion of your data (subject to legal requirements)</li>
                <li>Opt-out of non-essential communications</li>
                <li>Request a copy of your data</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-[#780000] mb-4">8. Cookies and Tracking</h2>
              <p className="text-gray-700 mb-4">
                We use cookies and similar technologies to improve your experience on our website. 
                You can control cookie settings through your browser preferences.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-[#780000] mb-4">9. Changes to Privacy Policy</h2>
              <p className="text-gray-700 mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any 
                material changes by posting the new policy on our website.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-[#780000] mb-4">10. Contact Us</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>International University of East Africa</strong><br />
                  Privacy Officer<br />
                  Email: privacy@iuea.ac.ug<br />
                  Phone: +256 414 373 480<br />
                  Address: Kansanga, Kampala, Uganda
                </p>
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} International University of East Africa. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
