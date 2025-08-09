'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ApplicationPage() {
  // Application form sections - matching frontend structure exactly
  const formSections = [
    { id: 'personal', name: 'Personal Details', completed: true },
    { id: 'program', name: 'Program Selection', completed: true },
    { id: 'additional', name: 'Additional Information', completed: false },
  ];
  
  const [activeSection, setActiveSection] = useState('personal');
  
  // Handler for section navigation
  const handleSectionClick = (sectionId: string) => {
    setActiveSection(sectionId);
  };
  
  // Sample application data - matching frontend structure
  const applicationData = {
    // Personal Details
    firstName: 'John',
    lastName: 'Doe',
    email: 'johndoe@example.com',
    phone: '+256 702 123456',
    countryOfBirth: 'Uganda',
    gender: 'Male',
    postalAddress: 'P.O. Box 123, Kampala, Uganda',
    passportPhoto: null,
    
    // Program Selection
    program: 'bachelor_business_administration',
    modeOfStudy: 'on_campus',
    intake: 'august',
    academicDocuments: ['transcript.pdf', 'olevel_certificate.pdf'],
    identificationDocuments: ['national_id.pdf'],
    
    // Additional Information
    sponsorTelephone: '+256 701 987654',
    sponsorEmail: 'sponsor@example.com',
    howDidYouHear: 'social-media',
    additionalNotes: 'Looking forward to joining IUEA and pursuing my career in business administration.',
  };

  // Program display names
  const programNames = {
    'bachelor_business_administration': 'Bachelor of Business Administration',
    'bachelor_computer_science': 'Bachelor of Science in Computer Science',
    'bachelor_information_technology': 'Bachelor of Information Technology',
    'bachelor_laws': 'Bachelor of Laws (LLB)',
    'master_business_administration': 'Master of Business Administration (MBA)',
    'master_information_technology': 'Master of Information Technology',
  };
  
  return (
    <div className="pb-20 md:pb-0">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-slate-800">My Application</h1>
        <p className="text-sm md:text-base text-slate-800/70">View and manage your application for admission to IUEA. Complete all three sections: Personal Details, Program Selection, and Additional Information.</p>
      </div>

      {/* Application Progress */}
      <div className="bg-white rounded-lg p-3 md:p-4 border border-slate-200 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          {formSections.map((section, index) => (
            <div 
              key={section.id}
              className="flex flex-col items-center"
            >
              <div className="relative mb-1 md:mb-2">
                <div 
                  className={`h-6 w-6 md:h-8 md:w-8 rounded-full flex items-center justify-center text-xs ${
                    section.completed 
                      ? 'bg-red-800 text-white' 
                      : activeSection === section.id
                      ? 'bg-red-800/20 border-2 border-red-800 text-red-800'
                      : 'bg-slate-200 text-slate-800/50'
                  }`}
                >
                  {section.completed ? (
                    <i className="ri-check-line"></i>
                  ) : (
                    index + 1
                  )}
                </div>
                {index < formSections.length - 1 && (
                  <div 
                    className={`absolute top-1/2 left-full w-12 md:w-16 h-0.5 -translate-y-1/2 ${
                      section.completed ? 'bg-red-800' : 'bg-slate-200'
                    }`}
                  ></div>
                )}
              </div>
              <span 
                className={`text-xs md:text-sm text-center ${
                  activeSection === section.id ? 'text-red-800 font-medium' : 'text-slate-800/70'
                }`}
              >
                {section.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Form Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left side: navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg overflow-hidden border border-slate-200">
            <div className="p-3 bg-[#f7f7f7] border-b border-slate-200">
              <h3 className="font-semibold text-slate-800 text-sm md:text-base">Application Sections</h3>
            </div>
            <div>
              {formSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => handleSectionClick(section.id)}
                  className={`w-full text-left px-3 md:px-4 py-2 md:py-3 flex items-center justify-between border-b border-slate-200 last:border-b-0 ${
                    activeSection === section.id
                      ? 'bg-red-800/5 border-l-4 border-l-[#780000]'
                      : ''
                  }`}
                >
                  <div className="flex items-center">
                    <span 
                      className={`text-xs md:text-sm ${
                        activeSection === section.id ? 'text-red-800 font-medium' : ''
                      }`}
                    >
                      {section.name}
                    </span>
                  </div>
                  {section.completed && (
                    <div className="h-4 w-4 md:h-5 md:w-5 rounded-full bg-green-100 flex items-center justify-center">
                      <i className="ri-check-line text-green-600 text-xs"></i>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Application Tips */}
          <div className="mt-4 bg-blue-50 rounded-lg p-3 md:p-4">
            <h3 className="font-medium text-blue-800 text-sm md:text-base">Tips</h3>
            <ul className="mt-2 space-y-2 text-xs md:text-sm text-blue-700">
              <li className="flex">
                <i className="ri-information-line mr-2 mt-1 flex-shrink-0"></i>
                <span>Complete all three sections for your application to be considered.</span>
              </li>
              <li className="flex">
                <i className="ri-information-line mr-2 mt-1 flex-shrink-0"></i>
                <span>Upload clear, legible copies of all required documents.</span>
              </li>
              <li className="flex">
                <i className="ri-information-line mr-2 mt-1 flex-shrink-0"></i>
                <span>Provide accurate sponsor information if applicable.</span>
              </li>
              <li className="flex">
                <i className="ri-information-line mr-2 mt-1 flex-shrink-0"></i>
                <span>Review your information before completing each section.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right side: active form section */}
        <div className="lg:col-span-3">
          {/* Personal Details Section - Matching frontend PersonalDetailsStep */}
          {activeSection === 'personal' && (
            <div className="bg-white rounded-lg p-4 md:p-6 border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
                <h2 className="text-base md:text-lg font-semibold text-slate-800">Personal Details</h2>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full w-fit">
                  Completed
                </span>
              </div>
              
              {/* Personal Details Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-slate-800 mb-1">
                    First Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={applicationData.firstName}
                    readOnly
                    className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 text-xs md:text-sm bg-[#f7f7f7]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-1">
                    Last Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={applicationData.lastName}
                    readOnly
                    className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 text-sm bg-[#f7f7f7]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-1">
                    Email Address <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="email"
                    value={applicationData.email}
                    readOnly
                    className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 text-sm bg-[#f7f7f7]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-1">
                    Phone Number <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={applicationData.phone}
                    readOnly
                    className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 text-sm bg-[#f7f7f7]"
                  />
                  <p className="text-xs text-slate-500 mt-1">Format: +256XXXXXXXXX (include country code)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-1">
                    Country of Birth <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={applicationData.countryOfBirth}
                    readOnly
                    className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 text-sm bg-[#f7f7f7]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-1">
                    Gender <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={applicationData.gender}
                    readOnly
                    className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 text-sm bg-[#f7f7f7]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-800 mb-1">
                    Postal Address <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    value={applicationData.postalAddress}
                    readOnly
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 text-sm bg-[#f7f7f7] resize-none"
                  />
                  <p className="text-xs text-slate-500 mt-1">Enter your postal address (P.O. Box, street, city, postal code)</p>
                </div>
                
                {/* Passport Photo Section */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-800 mb-1">
                    Passport Photo <span className="text-red-600">*</span>
                  </label>
                  <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center bg-[#f7f7f7]">
                    <div className="flex flex-col items-center">
                      <i className="ri-image-line text-2xl text-slate-400 mb-2"></i>
                      {applicationData.passportPhoto ? (
                        <p className="text-sm text-slate-600">passport_photo.jpg</p>
                      ) : (
                        <p className="text-sm text-slate-600">No photo uploaded</p>
                      )}
                      <p className="text-xs text-slate-500 mt-1">
                        Upload a recent passport-style photograph. JPG, JPEG, PNG accepted.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex flex-col sm:flex-row sm:justify-between gap-3">
                <button
                  className="px-4 py-2 text-sm border border-slate-200 text-slate-800 rounded-lg hover:border-red-800 hover:text-red-800 transition-colors"
                >
                  Edit Information
                </button>
                
                <button
                  onClick={() => handleSectionClick('program')}
                  className="px-4 py-2 text-sm bg-red-800 text-white rounded-lg hover:bg-[#600000] transition-colors"
                >
                  Next: Program Selection
                  <i className="ri-arrow-right-line ml-1"></i>
                </button>
              </div>
            </div>
          )}

          {/* Program Selection Section - Matching frontend ProgramStep */}
          {activeSection === 'program' && (
            <div className="bg-white rounded-lg p-4 md:p-6 border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
                <h2 className="text-base md:text-lg font-semibold text-slate-800">Program Selection</h2>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full w-fit">
                  Completed
                </span>
              </div>
              
              {/* Program Selection Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-1">
                    Mode of Study <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={applicationData.modeOfStudy === 'on_campus' ? 'On Campus' : 'Online'}
                    readOnly
                    className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 text-sm bg-[#f7f7f7]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-1">
                    Intake <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={applicationData.intake.charAt(0).toUpperCase() + applicationData.intake.slice(1)}
                    readOnly
                    className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 text-sm bg-[#f7f7f7]"
                  />
                </div>
                
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-800 mb-1">
                    Program <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={programNames[applicationData.program as keyof typeof programNames] || 'Unknown Program'}
                    readOnly
                    className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 text-sm bg-[#f7f7f7]"
                  />
                </div>
                
                {/* Academic Documents Section */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-800 mb-2">
                    Academic Documents <span className="text-red-600">*</span>
                  </label>
                  <div className="border-2 border-slate-200 rounded-lg p-4 bg-[#f7f7f7]">
                    <div className="flex items-center mb-2">
                      <i className="ri-file-text-line text-lg text-slate-600 mr-2"></i>
                      <span className="text-sm font-medium text-slate-700">Uploaded Documents:</span>
                    </div>
                    {applicationData.academicDocuments && applicationData.academicDocuments.length > 0 ? (
                      <ul className="space-y-1">
                        {applicationData.academicDocuments.map((doc, index) => (
                          <li key={index} className="flex items-center text-sm text-slate-600">
                            <i className="ri-file-pdf-line text-red-600 mr-2"></i>
                            <span>{doc}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-500">No documents uploaded</p>
                    )}
                    <p className="text-xs text-slate-500 mt-2">
                      Upload transcripts, certificates, diplomas, or academic records from previous institutions
                    </p>
                  </div>
                </div>

                {/* Identification Documents Section */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-800 mb-2">
                    Identification Documents <span className="text-red-600">*</span>
                  </label>
                  <div className="border-2 border-slate-200 rounded-lg p-4 bg-[#f7f7f7]">
                    <div className="flex items-center mb-2">
                      <i className="ri-id-card-line text-lg text-slate-600 mr-2"></i>
                      <span className="text-sm font-medium text-slate-700">Uploaded Documents:</span>
                    </div>
                    {applicationData.identificationDocuments && applicationData.identificationDocuments.length > 0 ? (
                      <ul className="space-y-1">
                        {applicationData.identificationDocuments.map((doc, index) => (
                          <li key={index} className="flex items-center text-sm text-slate-600">
                            <i className="ri-file-pdf-line text-red-600 mr-2"></i>
                            <span>{doc}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-500">No documents uploaded</p>
                    )}
                    <p className="text-xs text-slate-500 mt-2">
                      Upload passport, national ID, birth certificate, or other government-issued identification
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex flex-col sm:flex-row sm:justify-between gap-3">
                <button
                  onClick={() => handleSectionClick('personal')}
                  className="px-4 py-2 text-sm border border-slate-200 text-slate-800 rounded-lg hover:border-red-800 hover:text-red-800 transition-colors"
                >
                  <i className="ri-arrow-left-line mr-1"></i>
                  Previous: Personal Details
                </button>
                
                <button
                  onClick={() => handleSectionClick('additional')}
                  className="px-4 py-2 text-sm bg-red-800 text-white rounded-lg hover:bg-[#600000] transition-colors"
                >
                  Next: Additional Information
                  <i className="ri-arrow-right-line ml-1"></i>
                </button>
              </div>
            </div>
          )}

          {/* Additional Information Section - Matching frontend AdditionalDataStep */}
          {activeSection === 'additional' && (
            <div className="bg-white rounded-lg p-4 md:p-6 border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
                <h2 className="text-base md:text-lg font-semibold text-slate-800">Additional Information</h2>
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full w-fit">
                  In Progress
                </span>
              </div>
              
              {/* Sponsorship Information */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-800 mb-3">Sponsorship Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-800 mb-1">
                      Sponsor Telephone
                    </label>
                    <input
                      type="text"
                      value={applicationData.sponsorTelephone}
                      readOnly
                      className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 text-sm bg-[#f7f7f7]"
                    />
                    <p className="text-xs text-slate-500 mt-1">Phone number of sponsor or parent/guardian</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-800 mb-1">
                      Sponsor Email
                    </label>
                    <input
                      type="email"
                      value={applicationData.sponsorEmail}
                      readOnly
                      className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 text-sm bg-[#f7f7f7]"
                    />
                    <p className="text-xs text-slate-500 mt-1">Email address of sponsor or parent/guardian</p>
                  </div>
                </div>
              </div>

              {/* How did you hear about us */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-800 mb-1">
                  How did you hear about the university? <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={
                    applicationData.howDidYouHear === 'social-media' ? 'Social Media (Facebook, Instagram, Twitter)' :
                    applicationData.howDidYouHear === 'website' ? 'University Website' :
                    applicationData.howDidYouHear === 'friend-family' ? 'Friend or Family Recommendation' :
                    applicationData.howDidYouHear === 'education-fair' ? 'Education Fair' :
                    applicationData.howDidYouHear === 'newspaper-magazine' ? 'Newspaper/Magazine' :
                    applicationData.howDidYouHear === 'radio-tv' ? 'Radio/Television' :
                    applicationData.howDidYouHear === 'school-counselor' ? 'School Counselor' :
                    applicationData.howDidYouHear === 'alumni' ? 'Alumni' :
                    applicationData.howDidYouHear === 'search-engine' ? 'Search Engine (Google, Bing)' :
                    applicationData.howDidYouHear === 'university-representative' ? 'University Representative Visit' :
                    applicationData.howDidYouHear === 'other' ? 'Other' :
                    applicationData.howDidYouHear
                  }
                  readOnly
                  className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 text-sm bg-[#f7f7f7]"
                />
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">
                  Additional Notes
                </label>
                <textarea
                  value={applicationData.additionalNotes}
                  readOnly
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 text-sm bg-[#f7f7f7] resize-none"
                />
                <p className="text-xs text-slate-500 mt-1">Any additional information you'd like to share (optional)</p>
              </div>
              
              <div className="mt-6 flex flex-col sm:flex-row sm:justify-between gap-3">
                <button
                  onClick={() => handleSectionClick('program')}
                  className="px-4 py-2 text-sm border border-slate-200 text-slate-800 rounded-lg hover:border-red-800 hover:text-red-800 transition-colors"
                >
                  <i className="ri-arrow-left-line mr-1"></i>
                  Previous: Program Selection
                </button>
                
                <button
                  className="px-4 py-2 text-sm bg-red-800 text-white rounded-lg hover:bg-[#600000] transition-colors"
                >
                  Complete Section
                  <i className="ri-check-line ml-1"></i>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Application Save Status */}
      <div className="mt-6 bg-[#f7f7f7] rounded-lg p-3 flex justify-between items-center text-sm">
        <span>Last saved: August 9, 2025 at 10:45 AM</span>
        <span className="text-green-600 flex items-center">
          <i className="ri-checkbox-circle-line mr-1"></i>
          Changes saved
        </span>
      </div>
    </div>
  );
}
