'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function DocumentsPage() {
  // Document categories - matching application form structure
  const documentCategories = [
    { id: 'passport-photo', name: 'Passport Photo' },
    { id: 'academic', name: 'Academic Documents' },
    { id: 'identification', name: 'Identification Documents' },
  ];
  
  const [activeCategory, setActiveCategory] = useState('passport-photo');
  
  // Required documents - matching application form requirements
  const requiredDocuments = [
    // Passport Photo
    { 
      id: 1, 
      name: 'Passport Photo', 
      category: 'passport-photo',
      status: 'uploaded', 
      date: 'Aug 2, 2025',
      description: 'Upload a recent passport-style photograph. The photo should be clear, with good lighting, showing your full face against a plain background.',
      fileTypes: 'JPG, JPEG, PNG',
      maxSize: '5MB',
      isRequired: true,
      uploadedFile: 'passport_photo.jpg'
    },
    
    // Academic Documents
    { 
      id: 2, 
      name: 'Academic Transcripts', 
      category: 'academic',
      status: 'uploaded', 
      date: 'Aug 3, 2025',
      description: 'Upload transcripts from previous institutions showing your academic performance.',
      fileTypes: 'PDF, DOC, DOCX, JPG, JPEG, PNG',
      maxSize: '10MB per file',
      isRequired: true,
      uploadedFile: 'transcript.pdf'
    },
    { 
      id: 3, 
      name: 'Certificates & Diplomas', 
      category: 'academic',
      status: 'uploaded', 
      date: 'Aug 3, 2025',
      description: 'Upload certificates, diplomas, or academic records from previous institutions.',
      fileTypes: 'PDF, DOC, DOCX, JPG, JPEG, PNG',
      maxSize: '10MB per file',
      isRequired: true,
      uploadedFile: 'olevel_certificate.pdf'
    },
    { 
      id: 4, 
      name: 'Professional Certificates', 
      category: 'academic',
      status: 'pending', 
      date: null,
      description: 'Upload any professional certifications or additional qualifications (optional).',
      fileTypes: 'PDF, DOC, DOCX, JPG, JPEG, PNG',
      maxSize: '10MB per file',
      isRequired: false,
      uploadedFile: null
    },
    
    // Identification Documents
    { 
      id: 5, 
      name: 'National ID / Passport', 
      category: 'identification',
      status: 'uploaded', 
      date: 'Aug 2, 2025',
      description: 'Upload passport, national ID, or other government-issued identification.',
      fileTypes: 'PDF, DOC, DOCX, JPG, JPEG, PNG',
      maxSize: '10MB per file',
      isRequired: true,
      uploadedFile: 'national_id.pdf'
    },
    { 
      id: 6, 
      name: 'Birth Certificate', 
      category: 'identification',
      status: 'pending', 
      date: null,
      description: 'Upload your official birth certificate or equivalent document.',
      fileTypes: 'PDF, DOC, DOCX, JPG, JPEG, PNG',
      maxSize: '10MB per file',
      isRequired: true,
      uploadedFile: null
    },
    { 
      id: 7, 
      name: 'Additional ID Documents', 
      category: 'identification',
      status: 'pending', 
      date: null,
      description: 'Upload any additional identification documents (optional).',
      fileTypes: 'PDF, DOC, DOCX, JPG, JPEG, PNG',
      maxSize: '10MB per file',
      isRequired: false,
      uploadedFile: null
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
        <h1 className="text-xl md:text-2xl font-bold text-slate-800">Application Documents</h1>
        <p className="text-sm md:text-base text-slate-800/70">Upload the required documents for your admission application. All documents must be clear and legible.</p>
      </div>

      {/* Document Requirements Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <i className="ri-information-line text-blue-600 text-lg mr-3 mt-0.5 flex-shrink-0"></i>
          <div>
            <h3 className="font-medium text-blue-800 text-sm mb-2">Document Requirements</h3>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• All documents must be in PDF, DOC, DOCX, JPG, JPEG, or PNG format</li>
              <li>• Ensure documents are clear, legible, and complete</li>
              <li>• Academic documents should include official transcripts and certificates</li>
              <li>• Identification documents must be government-issued and current</li>
              <li>• Passport photo should be recent with plain background</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Documents Status Summary */}
      <div className="bg-white rounded-lg p-3 md:p-4 border border-slate-200 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          <div className="text-center sm:text-left">
            <span className="text-slate-800/60 text-xs md:text-sm">Required</span>
            <div className="mt-1">
              <h3 className="text-lg md:text-2xl font-bold text-slate-800">{requiredDocuments.filter(doc => doc.isRequired).length}</h3>
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
            <span className="text-slate-800/60 text-xs md:text-sm">Optional</span>
            <div className="mt-1">
              <h3 className="text-lg md:text-2xl font-bold text-blue-600">{requiredDocuments.filter(doc => !doc.isRequired).length}</h3>
              <p className="text-xs text-slate-800/60">Documents</p>
            </div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs md:text-sm mb-1">
            <span className="font-medium">Required Documents Progress</span>
            <span>
              {requiredDocuments.filter(doc => doc.status === 'uploaded' && doc.isRequired).length}/{requiredDocuments.filter(doc => doc.isRequired).length} Required
            </span>
          </div>
          <div className="w-full bg-[#EDEDED] rounded-full h-2.5">
            <div 
              className="bg-red-800 h-2.5 rounded-full" 
              style={{ 
                width: `${(requiredDocuments.filter(doc => doc.status === 'uploaded' && doc.isRequired).length / requiredDocuments.filter(doc => doc.isRequired).length) * 100}%` 
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <h3 className="font-medium text-sm md:text-base flex items-center">
                      {document.name}
                      {document.isRequired && <span className="text-red-600 ml-1">*</span>}
                    </h3>
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
                    {!document.isRequired && (
                      <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full flex items-center w-fit">
                        <i className="ri-information-line mr-1"></i>
                        Optional
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
                
                <p className="text-xs md:text-sm text-slate-800/70 mb-2">{document.description}</p>
                
                {/* File requirements */}
                <div className="bg-slate-50 rounded-lg p-2 mb-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center">
                      <i className="ri-file-line text-slate-500 mr-1"></i>
                      <span className="text-slate-600">
                        <strong>Formats:</strong> {document.fileTypes}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <i className="ri-database-line text-slate-500 mr-1"></i>
                      <span className="text-slate-600">
                        <strong>Max Size:</strong> {document.maxSize}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Uploaded file info */}
                {document.uploadedFile && (
                  <div className="flex items-center text-xs text-slate-600 bg-green-50 rounded-lg p-2">
                    <i className="ri-file-check-line text-green-600 mr-2"></i>
                    <span className="font-medium">{document.uploadedFile}</span>
                    {document.date && (
                      <span className="ml-2 text-slate-500">• Uploaded on {document.date}</span>
                    )}
                  </div>
                )}
                
                {document.status === 'pending' && document.isRequired && (
                  <div className="flex items-center text-xs text-yellow-700 bg-yellow-50 rounded-lg p-2">
                    <i className="ri-alert-line text-yellow-600 mr-2"></i>
                    <span>This document is required for your application.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {filteredDocuments.length === 0 && (
          <div className="bg-white rounded-lg p-6 border border-slate-200 text-center">
            <div className="text-slate-400 mb-2">
              <i className="ri-file-list-line text-2xl"></i>
            </div>
            <p className="text-slate-600">No documents in this category.</p>
          </div>
        )}
      </div>
      
      {/* Submit Documents Button */}
      <div className="mt-6">
        {/* Requirements completion status */}
        <div className="bg-slate-50 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-4 h-4 rounded-full mr-3 flex items-center justify-center ${
                requiredDocuments.filter(doc => doc.status === 'uploaded' && doc.isRequired).length === requiredDocuments.filter(doc => doc.isRequired).length
                  ? 'bg-green-600'
                  : 'bg-yellow-600'
              }`}>
                <i className={`ri-${
                  requiredDocuments.filter(doc => doc.status === 'uploaded' && doc.isRequired).length === requiredDocuments.filter(doc => doc.isRequired).length
                    ? 'check'
                    : 'alert'
                }-line text-white text-xs`}></i>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">
                  {requiredDocuments.filter(doc => doc.status === 'uploaded' && doc.isRequired).length === requiredDocuments.filter(doc => doc.isRequired).length
                    ? 'All required documents uploaded!'
                    : 'Some required documents are still pending'
                  }
                </p>
                <p className="text-xs text-slate-600">
                  {requiredDocuments.filter(doc => doc.status === 'uploaded' && doc.isRequired).length}/{requiredDocuments.filter(doc => doc.isRequired).length} required documents completed
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
          <Link
            href="/dashboard/application"
            className="px-4 py-2 text-sm border border-slate-200 text-slate-800 rounded-lg hover:border-red-800 hover:text-red-800 transition-colors text-center"
          >
            Back to Application
          </Link>
          <button
            disabled={requiredDocuments.filter(doc => doc.status === 'uploaded' && doc.isRequired).length !== requiredDocuments.filter(doc => doc.isRequired).length}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              requiredDocuments.filter(doc => doc.status === 'uploaded' && doc.isRequired).length === requiredDocuments.filter(doc => doc.isRequired).length
                ? 'bg-red-800 text-white hover:bg-[#600000]'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            {requiredDocuments.filter(doc => doc.status === 'uploaded' && doc.isRequired).length === requiredDocuments.filter(doc => doc.isRequired).length
              ? 'Submit Application Documents'
              : 'Complete Required Documents First'
            }
          </button>
        </div>
      </div>
    </div>
  );
}
