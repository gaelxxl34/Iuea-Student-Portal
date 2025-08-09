'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ApplicationPage() {
  // Application form sections
  const formSections = [
    { id: 'personal', name: 'Personal Information', completed: true },
    { id: 'academic', name: 'Academic Background', completed: false },
    { id: 'programs', name: 'Program Selection', completed: true },
    { id: 'documents', name: 'Required Documents', completed: false },
    { id: 'review', name: 'Review & Submit', completed: false },
  ];
  
  const [activeSection, setActiveSection] = useState('personal');
  
  // Programs offered by IUEA (sample data)
  const availablePrograms = [
    {
      id: 1,
      name: 'Bachelor of Science in Computer Science',
      faculty: 'Faculty of Computing & Engineering',
      duration: '4 years',
      tuition: '$2,500 / semester',
      selected: true
    },
    {
      id: 2,
      name: 'Bachelor of Business Administration',
      faculty: 'Faculty of Business & Management',
      duration: '3 years',
      tuition: '$2,300 / semester',
      selected: true
    },
    {
      id: 3,
      name: 'Bachelor of Law',
      faculty: 'Faculty of Law',
      duration: '4 years',
      tuition: '$2,800 / semester',
      selected: false
    },
    {
      id: 4,
      name: 'Bachelor of Science in Nursing',
      faculty: 'Faculty of Health Sciences',
      duration: '4 years',
      tuition: '$3,000 / semester',
      selected: false
    },
  ];
  
  // Handler for section navigation
  const handleSectionClick = (sectionId: string) => {
    setActiveSection(sectionId);
  };
  
  // Sample personal information data
  const personalInfo = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'johndoe@example.com',
    phone: '+256 702 123456',
    dateOfBirth: '1998-05-15',
    gender: 'Male',
    nationality: 'Ugandan',
    address: '123 Main Street, Kampala',
    country: 'Uganda'
  };
  
  return (
    <div className="pb-20 md:pb-0">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-slate-800">My Application</h1>
        <p className="text-sm md:text-base text-slate-800/70">Complete your application for admission to IUEA.</p>
      </div>

      {/* Application Progress */}
      <div className="bg-white rounded-lg p-3 md:p-4 border border-slate-200 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1 md:gap-2">
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
                    className={`absolute top-1/2 left-full w-full h-0.5 -translate-y-1/2 ${
                      section.completed ? 'bg-red-800' : 'bg-slate-200'
                    }`}
                    style={{ width: 'calc(100% - 1rem)' }}
                  ></div>
                )}
              </div>
              <span 
                className={`text-[10px] md:text-xs text-center ${
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
                <span>Complete all sections for your application to be considered.</span>
              </li>
              <li className="flex">
                <i className="ri-information-line mr-2 mt-1 flex-shrink-0"></i>
                <span>Upload clear, legible copies of all required documents.</span>
              </li>
              <li className="flex">
                <i className="ri-information-line mr-2 mt-1 flex-shrink-0"></i>
                <span>Review your information before final submission.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right side: active form section */}
        <div className="lg:col-span-3">
          {/* Personal Information Section */}
          {activeSection === 'personal' && (
            <div className="bg-white rounded-lg p-4 md:p-6 border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
                <h2 className="text-base md:text-lg font-semibold text-slate-800">Personal Information</h2>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full w-fit">
                  Completed
                </span>
              </div>
              
              {/* Personal Information Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-slate-800 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={personalInfo.firstName}
                    readOnly
                    className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 text-xs md:text-sm bg-[#f7f7f7]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={personalInfo.lastName}
                    readOnly
                    className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 text-sm bg-[#f7f7f7]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={personalInfo.email}
                    readOnly
                    className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 text-sm bg-[#f7f7f7]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={personalInfo.phone}
                    readOnly
                    className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 text-sm bg-[#f7f7f7]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="text"
                    value={personalInfo.dateOfBirth}
                    readOnly
                    className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 text-sm bg-[#f7f7f7]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-1">
                    Gender
                  </label>
                  <input
                    type="text"
                    value={personalInfo.gender}
                    readOnly
                    className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 text-sm bg-[#f7f7f7]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-1">
                    Nationality
                  </label>
                  <input
                    type="text"
                    value={personalInfo.nationality}
                    readOnly
                    className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 text-sm bg-[#f7f7f7]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-1">
                    Country of Residence
                  </label>
                  <input
                    type="text"
                    value={personalInfo.country}
                    readOnly
                    className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 text-sm bg-[#f7f7f7]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-800 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={personalInfo.address}
                    readOnly
                    className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 text-sm bg-[#f7f7f7]"
                  />
                </div>
              </div>
              
              <div className="mt-6 flex flex-col sm:flex-row sm:justify-between gap-3">
                <button
                  className="px-4 py-2 text-sm border border-slate-200 text-slate-800 rounded-lg hover:border-red-800 hover:text-red-800 transition-colors"
                >
                  Edit Information
                </button>
                
                <button
                  onClick={() => handleSectionClick('academic')}
                  className="px-4 py-2 text-sm bg-red-800 text-white rounded-lg hover:bg-[#600000] transition-colors"
                >
                  Next: Academic Background
                </button>
              </div>
            </div>
          )}

          {/* Program Selection Section */}
          {activeSection === 'programs' && (
            <div className="bg-white rounded-lg p-4 md:p-6 border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
                <h2 className="text-base md:text-lg font-semibold text-slate-800">Program Selection</h2>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full w-fit">
                  Completed
                </span>
              </div>
              
              <p className="text-xs md:text-sm text-slate-800/70 mb-4">
                Select the programs you would like to apply for. You may select up to 2 programs.
              </p>
              
              {/* Programs List */}
              <div className="space-y-3">
                {availablePrograms.map((program) => (
                  <div 
                    key={program.id} 
                    className={`p-3 border rounded-lg ${
                      program.selected 
                        ? 'border-red-800 bg-red-800/5' 
                        : 'border-slate-200 hover:border-red-800/30'
                    } transition-colors`}
                  >
                    <div className="flex items-start">
                      <div className={`mt-0.5 h-5 w-5 rounded-sm border ${
                        program.selected 
                          ? 'border-red-800 bg-red-800' 
                          : 'border-slate-200'
                      } flex items-center justify-center`}>
                        {program.selected && (
                          <i className="ri-check-line text-white text-xs"></i>
                        )}
                      </div>
                      <div className="ml-3 flex-1">
                        <h3 className="font-medium text-sm md:text-base">{program.name}</h3>
                        <p className="text-xs md:text-sm text-slate-800/70">{program.faculty}</p>
                        <div className="flex flex-col sm:flex-row sm:justify-between text-xs mt-2 text-slate-800/70">
                          <div className="flex items-center">
                            <i className="ri-time-line mr-1"></i>
                            <span>Duration: {program.duration}</span>
                          </div>
                          <div className="flex items-center mt-1 sm:mt-0">
                            <i className="ri-money-dollar-circle-line mr-1"></i>
                            <span>Tuition: {program.tuition}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 flex flex-col sm:flex-row sm:justify-between gap-3">
                <button
                  onClick={() => handleSectionClick('academic')}
                  className="px-4 py-2 text-sm border border-slate-200 text-slate-800 rounded-lg hover:border-red-800 hover:text-red-800 transition-colors"
                >
                  <i className="ri-arrow-left-line mr-1"></i>
                  Previous
                </button>
                
                <button
                  onClick={() => handleSectionClick('documents')}
                  className="px-4 py-2 text-sm bg-red-800 text-white rounded-lg hover:bg-[#600000] transition-colors"
                >
                  Next: Documents
                  <i className="ri-arrow-right-line ml-1"></i>
                </button>
              </div>
            </div>
          )}

          {/* Placeholder for other sections */}
          {(activeSection === 'academic' || activeSection === 'documents' || activeSection === 'review') && (
            <div className="bg-white rounded-lg p-4 md:p-6 border border-slate-200">
              <h2 className="text-base md:text-lg font-semibold text-slate-800 mb-4">
                {formSections.find(s => s.id === activeSection)?.name}
              </h2>
              
              <div className="py-8 text-center">
                <div className="mx-auto h-12 w-12 md:h-16 md:w-16 text-2xl md:text-3xl text-red-800/30">
                  <i className="ri-file-list-3-line"></i>
                </div>
                <p className="mt-3 text-sm md:text-base text-slate-800/70">
                  This section needs to be completed.
                </p>
                <p className="text-xs md:text-sm text-slate-800/50">
                  Please fill out the required information.
                </p>
                
                <button className="mt-4 px-4 py-2 text-sm bg-red-800 text-white rounded-lg hover:bg-[#600000] transition-colors">
                  Start Section
                </button>
              </div>
              
              <div className="mt-6 flex flex-col sm:flex-row sm:justify-between gap-3">
                <button
                  onClick={() => {
                    // Go to previous section
                    const currentIndex = formSections.findIndex(s => s.id === activeSection);
                    if (currentIndex > 0) {
                      handleSectionClick(formSections[currentIndex - 1].id);
                    }
                  }}
                  className="px-4 py-2 text-sm border border-slate-200 text-slate-800 rounded-lg hover:border-red-800 hover:text-red-800 transition-colors"
                >
                  <i className="ri-arrow-left-line mr-1"></i>
                  Previous
                </button>
                
                <button
                  onClick={() => {
                    // Go to next section
                    const currentIndex = formSections.findIndex(s => s.id === activeSection);
                    if (currentIndex < formSections.length - 1) {
                      handleSectionClick(formSections[currentIndex + 1].id);
                    }
                  }}
                  className="px-4 py-2 text-sm bg-red-800 text-white rounded-lg hover:bg-[#600000] transition-colors"
                >
                  Next Section
                  <i className="ri-arrow-right-line ml-1"></i>
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
