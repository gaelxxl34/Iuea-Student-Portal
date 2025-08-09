'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function DocumentsPage() {
  // Document categories
  const documentCategories = [
    { id: 'identification', name: 'Identification Documents' },
    { id: 'academic', name: 'Academic Documents' },
    { id: 'financial', name: 'Financial Documents' },
    { id: 'other', name: 'Other Documents' },
  ];
  
  const [activeCategory, setActiveCategory] = useState('identification');
  
  // Required documents
  const requiredDocuments = [
    { 
      id: 1, 
      name: 'National ID / Passport', 
      category: 'identification',
      status: 'uploaded', 
      date: 'Aug 2, 2025',
      description: 'Upload a clear scan of your valid ID or passport. Must show your full name and date of birth.'
    },
    { 
      id: 2, 
      name: 'Passport Photo', 
      category: 'identification',
      status: 'uploaded', 
      date: 'Aug 2, 2025',
      description: 'Upload a recent passport-sized photograph with white background.'
    },
    { 
      id: 3, 
      name: 'Birth Certificate', 
      category: 'identification',
      status: 'pending', 
      date: null,
      description: 'Upload a clear scan of your official birth certificate.'
    },
    { 
      id: 4, 
      name: 'High School Diploma', 
      category: 'academic',
      status: 'uploaded', 
      date: 'Aug 3, 2025',
      description: 'Upload your high school diploma or certificate of completion.'
    },
    { 
      id: 5, 
      name: 'Academic Transcripts', 
      category: 'academic',
      status: 'pending', 
      date: null,
      description: 'Upload your official high school transcripts with seal or stamp.'
    },
    { 
      id: 6, 
      name: 'Recommendation Letter', 
      category: 'academic',
      status: 'pending', 
      date: null,
      description: 'Upload at least one letter of recommendation from a teacher or supervisor.'
    },
    { 
      id: 7, 
      name: 'Bank Statement', 
      category: 'financial',
      status: 'pending', 
      date: null,
      description: 'Upload your recent bank statement showing sufficient funds for tuition and living expenses.'
    },
    { 
      id: 8, 
      name: 'Scholarship Award Letter', 
      category: 'financial',
      status: 'pending', 
      date: null,
      description: 'If applicable, upload any scholarship award letters.'
    },
    { 
      id: 9, 
      name: 'Personal Statement', 
      category: 'other',
      status: 'pending', 
      date: null,
      description: 'Upload your personal statement explaining why you want to join IUEA.'
    },
    { 
      id: 10, 
      name: 'CV/Resume', 
      category: 'other',
      status: 'pending', 
      date: null,
      description: 'Upload your current CV or resume.'
    },
  ];
  
  // Filter documents by active category
  const filteredDocuments = requiredDocuments.filter(doc => doc.category === activeCategory);
  
  // Upload handlers
  const handleUpload = (id: number) => {
    // In a real app, this would open a file picker and handle the upload
    alert(`Upload functionality would open for document ID: ${id}`);
  };
  
  // View document handler
  const handleViewDocument = (id: number) => {
    // In a real app, this would show the uploaded document
    alert(`View document ID: ${id}`);
  };
  
  return (
    <div className="pb-20 md:pb-0">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-slate-800">Document Uploads</h1>
        <p className="text-sm md:text-base text-slate-800/70">Upload the required documents for your admission application.</p>
      </div>

      {/* Documents Status Summary */}
      <div className="bg-white rounded-lg p-3 md:p-4 border border-slate-200 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          <div className="text-center sm:text-left">
            <span className="text-slate-800/60 text-xs md:text-sm">Total Required</span>
            <div className="mt-1">
              <h3 className="text-lg md:text-2xl font-bold text-slate-800">{requiredDocuments.length}</h3>
              <p className="text-xs text-slate-800/60">Documents</p>
            </div>
          </div>
          
          <div className="text-center sm:text-left">
            <span className="text-slate-800/60 text-xs md:text-sm">Uploaded</span>
            <div className="mt-1">
              <h3 className="text-lg md:text-2xl font-bold text-green-600">{requiredDocuments.filter(doc => doc.status === 'uploaded').length}</h3>
              <p className="text-xs text-slate-800/60">Documents</p>
            </div>
          </div>
          
          <div className="text-center sm:text-left">
            <span className="text-slate-800/60 text-xs md:text-sm">Pending</span>
            <div className="mt-1">
              <h3 className="text-lg md:text-2xl font-bold text-yellow-600">{requiredDocuments.filter(doc => doc.status === 'pending').length}</h3>
              <p className="text-xs text-slate-800/60">Documents</p>
            </div>
          </div>
          
          <div className="text-center sm:text-left">
            <span className="text-slate-800/60 text-xs md:text-sm">Rejected</span>
            <div className="mt-1">
              <h3 className="text-lg md:text-2xl font-bold text-red-600">{requiredDocuments.filter(doc => doc.status === 'rejected').length || 0}</h3>
              <p className="text-xs text-slate-800/60">Documents</p>
            </div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs md:text-sm mb-1">
            <span className="font-medium">Upload Progress</span>
            <span>
              {requiredDocuments.filter(doc => doc.status === 'uploaded').length}/{requiredDocuments.length} Documents
            </span>
          </div>
          <div className="w-full bg-[#EDEDED] rounded-full h-2.5">
            <div 
              className="bg-red-800 h-2.5 rounded-full" 
              style={{ 
                width: `${(requiredDocuments.filter(doc => doc.status === 'uploaded').length / requiredDocuments.length) * 100}%` 
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Document Categories Tabs */}
      <div className="bg-white rounded-lg overflow-hidden mb-6">
        <div className="flex overflow-x-auto scrollbar-hide">
          {documentCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-4 md:px-6 py-3 text-xs md:text-sm transition-colors whitespace-nowrap ${
                activeCategory === category.id
                  ? 'text-red-800 border-b-2 border-red-800 font-medium'
                  : 'text-slate-800/70 hover:text-red-800'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Documents List */}
      <div className="space-y-4">
        {filteredDocuments.map((document) => (
          <div key={document.id} className="bg-white rounded-lg p-3 md:p-4 border border-slate-200">
            <div className="flex flex-col gap-3">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <h3 className="font-medium text-sm md:text-base">{document.name}</h3>
                    {document.status === 'uploaded' && (
                      <span className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded-full flex items-center w-fit">
                        <i className="ri-check-line mr-1"></i>
                        Uploaded
                      </span>
                    )}
                    {document.status === 'rejected' && (
                      <span className="text-xs px-2 py-0.5 bg-red-50 text-red-700 rounded-full flex items-center w-fit">
                        <i className="ri-close-line mr-1"></i>
                        Rejected
                      </span>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {document.status === 'uploaded' ? (
                      <>
                        <button 
                          onClick={() => handleViewDocument(document.id)}
                          className="text-xs px-3 py-2 bg-slate-100 text-slate-800 rounded-lg hover:bg-slate-200 transition-colors flex items-center"
                        >
                          <i className="ri-eye-line mr-1"></i>
                          View
                        </button>
                        <button 
                          onClick={() => handleUpload(document.id)}
                          className="text-xs px-3 py-2 border border-red-800 text-red-800 hover:bg-red-800 hover:text-white rounded-lg transition-colors flex items-center"
                        >
                          <i className="ri-upload-line mr-1"></i>
                          Replace
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => handleUpload(document.id)}
                        className="text-xs px-3 py-2 bg-red-800 text-white rounded-lg hover:bg-[#600000] transition-colors flex items-center"
                      >
                        <i className="ri-upload-line mr-1"></i>
                        Upload
                      </button>
                    )}
                  </div>
                </div>
                
                <p className="text-xs md:text-sm text-slate-800/70 mt-2">{document.description}</p>
                {document.date && (
                  <p className="text-xs text-slate-800/60 mt-1">
                    Uploaded on {document.date}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Submit Documents Button */}
      <div className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-3">
        <Link
          href="/dashboard"
          className="px-4 py-2 text-sm border border-slate-200 text-slate-800 rounded-lg hover:border-red-800 hover:text-red-800 transition-colors text-center"
        >
          Cancel
        </Link>
        <button
          className="px-4 py-2 text-sm bg-red-800 text-white rounded-lg hover:bg-[#600000] transition-colors"
        >
          Submit All Documents
        </button>
      </div>
    </div>
  );
}
