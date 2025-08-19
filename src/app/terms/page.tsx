import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms and Conditions | IUEA',
  description: 'Terms and Conditions for International University of East Africa student portal and services.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with IUEA Logo */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-center mb-4">
            <Link 
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
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-center text-[#780000] mb-2">
            Terms and Conditions
          </h1>
          <p className="text-center text-gray-600">
            International University of East Africa (IUEA)
          </p>
        </div>

        {/* Terms Content */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="prose max-w-none">
            <p className="text-sm text-gray-500 mb-6">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-[#780000] mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 mb-4">
                By accessing and using the International University of East Africa (IUEA) student portal and related services, 
                you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-[#780000] mb-4">2. Account Registration</h2>
              <p className="text-gray-700 mb-4">
                To access certain features of our service, you must create an account. You agree to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain and update your account information</li>
                <li>Keep your account credentials confidential</li>
                <li>Be responsible for all activities under your account</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-[#780000] mb-4">3. Use of Services</h2>
              <p className="text-gray-700 mb-4">
                You may use our services for lawful purposes only. You agree not to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Use the service for any illegal or unauthorized purpose</li>
                <li>Interfere with or disrupt the service or servers</li>
                <li>Attempt to gain unauthorized access to any part of the service</li>
                <li>Share false or misleading information</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-[#780000] mb-4">4. Academic Integrity</h2>
              <p className="text-gray-700 mb-4">
                All students using IUEA services must maintain academic integrity and follow the university&apos;s 
                academic policies and code of conduct.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-[#780000] mb-4">5. Intellectual Property</h2>
              <p className="text-gray-700 mb-4">
                All content provided through IUEA services, including but not limited to text, graphics, logos, 
                and software, is the property of IUEA or its licensors and is protected by copyright and other laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-[#780000] mb-4">6. Limitation of Liability</h2>
              <p className="text-gray-700 mb-4">
                IUEA shall not be liable for any indirect, incidental, special, consequential, or punitive damages 
                resulting from your use of the service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-[#780000] mb-4">7. Changes to Terms</h2>
              <p className="text-gray-700 mb-4">
                IUEA reserves the right to modify these terms at any time. We will notify users of any material 
                changes to these terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-[#780000] mb-4">8. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about these Terms and Conditions, please contact us at:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>International University of East Africa</strong><br />
                  Email: info@iuea.ac.ug<br />
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
