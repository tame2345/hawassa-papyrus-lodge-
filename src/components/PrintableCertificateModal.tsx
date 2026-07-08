/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Printer, X, Award, CheckCircle, Smartphone, Calendar, FileText, Briefcase } from 'lucide-react';
import { StaffMember } from '../types';

interface PrintableCertificateModalProps {
  staff: StaffMember;
  onClose: () => void;
}

export default function PrintableCertificateModal({ staff, onClose }: PrintableCertificateModalProps) {
  const printDate = new Date().toLocaleDateString('et-ET', { year: 'numeric', month: 'long', day: 'numeric' });
  
  // Create a verifiable dataset payload for the custom QR
  const qrVerificationData = `PAPYRUS VERIFIED: Name: ${staff.name}, Role: ${staff.role}, Phone: ${staff.phone || 'N/A'}, HireDate: ${staff.hireDate || 'N/A'}, Edu: ${staff.education || 'N/A'}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&color=000000&data=${encodeURIComponent(qrVerificationData)}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm overflow-y-auto p-4 md:p-8">
      {/* Container: Hidden fully from main dashboard layout when printing */}
      <div className="bg-[#121212] border border-white/20 w-full max-w-4xl rounded-xl overflow-hidden flex flex-col h-full max-h-[90vh] shadow-[0_20px_50px_rgba(0,0,0,0.5)] print:border-none print:bg-white print:text-black print:max-h-none print:h-auto print:static print:shadow-none">
        
        {/* Screen Controller Bar (Hidden in Printing) */}
        <div className="bg-[#1B1B1B] px-6 py-4 border-b border-white/10 flex justify-between items-center shrink-0 print:hidden select-none">
          <div className="flex items-center gap-2">
            <Award className="text-[#C1FF00] w-5 h-5 animate-pulse shrink-0" />
            <div>
              <h3 className="text-white text-xs font-black uppercase tracking-wider">
                የሰራተኛ የትምህርት ማስረጃ ሰነድ ማተሚያ
              </h3>
              <p className="text-[10px] text-white/40">Employee Career & Academic Document Record Sheet</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="bg-[#C1FF00] hover:bg-white text-black text-xs font-black uppercase px-4 py-2 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>🖨️ ሰነዱን አትም (Print Record)</span>
            </button>
            <button
              onClick={onClose}
              className="bg-white/5 hover:bg-red-500 hover:text-white text-white/80 p-2 border border-white/10 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Outer content container allowing scrolling in dashboard, but auto height when printing */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-[#161616] print:bg-white print:text-black print:p-0 print:overflow-visible">
          
          {/* Printable A4 Certificate Card Wrapper */}
          <div className="bg-white text-black p-8 md:p-12 w-full max-w-3xl mx-auto min-h-[1050px] flex flex-col justify-between border-[8px] border-double border-slate-900 shadow-2xl relative print:shadow-none print:border-[10px] print:my-0 print:mx-auto print:min-h-0 print:h-auto select-text">
            
            {/* Top design corner accents */}
            <div className="absolute top-2 left-2 right-2 bottom-2 border border-slate-300 pointer-events-none"></div>

            {/* HEADER SECTION */}
            <div className="text-center space-y-3 relative z-10">
              <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-12 bg-black flex items-center justify-center text-white text-lg font-black leading-none">
                  H
                </div>
                <div className="text-left">
                  <h1 className="font-extrabold text-[#111] text-xl tracking-[0.1em] uppercase leading-none">
                    HAWASSA PAPYRUS LODGE & RESORT
                  </h1>
                  <h2 className="font-bold text-[12px] text-red-600 tracking-wider">
                    ሀዋሳ ፓፒረስ ሎጅ እና ሪዞርት
                  </h2>
                </div>
              </div>
              <p className="text-[9px] font-mono uppercase tracking-[0.25em] text-slate-500 border-t border-b border-slate-200 py-1 max-w-md mx-auto">
                Official HR Certification & Registry Record
              </p>
              
              <h3 className="text-lg font-extrabold text-slate-900 uppercase tracking-tight mt-4">
                የሰራተኛ የትምህርት ማስረጃና ሙያዊ ማህደር
              </h3>
              <p className="text-[11px] font-bold text-slate-600">
                Staff Academy Credentials & Employment Profile Registry
              </p>
            </div>

            {/* MIDDLE BODY: TWO COLUMNS */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 my-8 relative z-10 flex-1">
              {/* Left Side: Photo, Badges, and Verification QR */}
              <div className="md:col-span-4 flex flex-col items-center gap-6 border-r border-slate-200 pr-0 md:pr-6 md:border-r print:col-span-4 print:border-r print:pr-6">
                
                {/* formal Photo container */}
                <div className="text-center space-y-2">
                  <p className="text-[8px] font-mono text-slate-400 uppercase tracking-wider font-extrabold">የሰራተኛው ፎቶ / Photo</p>
                  <img 
                    src={staff.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'} 
                    referrerPolicy="no-referrer"
                    className="w-36 h-36 border-4 border-slate-900 object-cover rounded-none shadow-md mx-auto" 
                    alt="Employee Photo" 
                  />
                </div>

                {/* Verification Code */}
                <div className="text-center bg-slate-50 border border-slate-200 p-3 w-full space-y-1">
                  <p className="text-[8px] font-mono text-slate-500 uppercase tracking-wider font-bold">ዲጂታል ማረጋገጫ / QR VERIFIED</p>
                  <img 
                    src={qrCodeUrl} 
                    referrerPolicy="no-referrer"
                    className="w-24 h-24 mx-auto object-contain border border-slate-100" 
                    alt="Verification QR" 
                  />
                  <span className="text-[8px] font-mono text-slate-400 block break-all leading-none">{staff.pin}-{staff.hireDate}</span>
                </div>

                {/* Quick Stamp Marker */}
                <div className="border border-red-500/40 text-red-600 px-3 py-1 text-center font-mono text-[9px] font-extrabold uppercase tracking-widest rounded rotate-[-4deg] max-w-fit mx-auto select-none">
                  ✔ CONFIRMED BY HR
                </div>
              </div>

              {/* Right Side: Primary verified data */}
              <div className="md:col-span-8 space-y-5 print:col-span-8">
                
                {/* Part 1: Personal Details */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-mono text-slate-500 uppercase border-b border-slate-200 pb-1 font-black flex items-center gap-1">
                    <Briefcase className="w-3 h-3 text-slate-600" />
                    <span>ምዝገባ መለያ መረጃ / verified profile</span>
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold font-mono">የሰራተኛው ሙሉ ስም (Full Name)</span>
                      <span className="font-extrabold text-slate-900 text-sm">{staff.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold font-mono">የስራ መደብ (Designation / Role)</span>
                      <span className="font-extrabold text-blue-800 uppercase tracking-wide">
                        {staff.role === 'waiter' ? 'አስተናጋጅ (Waiter)' : 
                         staff.role === 'chef' ? 'የኩሽና ሰራተኛ (Chef/Kitchen)' : 
                         staff.role === 'receptionist' ? 'ሪሴብሽነር (Receptionist)' : 
                         staff.role === 'admin' ? 'ተቆጣጣሪ (System Admin)' : 
                         staff.role === 'manager' ? 'ማናጀር (Manager)' : 
                         staff.role === 'guard' ? 'ጥበቃ (Guard)' : 
                         staff.role === 'cashier' ? 'ካሸር (Cashier)' : staff.role.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold font-mono">ስልክ ቁጥር (Contact Phone)</span>
                      <span className="font-extrabold text-slate-900 font-mono">{staff.phone || 'ያልተመዘገበ'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold font-mono">የቅጥር ቀን (Hired Date / UTC)</span>
                      <span className="font-extrabold text-slate-900 font-mono">{staff.hireDate || 'ያልተመዘገበ'}</span>
                    </div>
                  </div>
                </div>

                {/* Part 2: Academic & Educational Details (Request Highlight) */}
                <div className="space-y-3 pt-1">
                  <h4 className="text-[10px] font-mono text-slate-500 uppercase border-b border-slate-200 pb-1 font-black flex items-center gap-1">
                    <FileText className="w-3 h-3 text-slate-600" />
                    <span>የትምህርት ደረጃና ማስረጃዎች / ACADEMIC CREDENTIALS</span>
                  </h4>
                  
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-none">
                    <p className="text-slate-400 text-[9px] uppercase font-bold font-mono mb-1">የቀረቡ ማስረጃዎች መግለጫ (Submitted Credentials)</p>
                    <p className="text-slate-950 font-bold text-xs leading-relaxed">
                      {staff.education ? staff.education : 'የላቀ የትምህርት፣ የምስክር ወረቀት ወይም የልምድ ሰነድ ማስረጃዎች አልተመዘገቡም። (No academic summary submitted).'}
                    </p>
                  </div>
                </div>

                {/* Part 3: Render Uploaded Certificate Image if present */}
                {staff.certificatePhoto && (
                  <div className="space-y-2 pt-1 break-inside-avoid">
                    <p className="text-slate-400 text-[9px] uppercase font-bold font-mono block">
                      የተጫነ የሰርተፊኬት ምስል ኮፒ / ATTACHED CERTIFICATE DIRECT PREVIEW
                    </p>
                    <div className="border-2 border-dashed border-slate-300 p-2 bg-slate-50 flex items-center justify-center max-w-full">
                      <img 
                        src={staff.certificatePhoto} 
                        referrerPolicy="no-referrer"
                        className="max-h-[220px] max-w-full object-contain print:max-h-[280px]" 
                        alt="Attached Certificate" 
                      />
                    </div>
                  </div>
                )}

                {/* Part 4: General Review Bio */}
                <div className="space-y-2 pt-1">
                  <h4 className="text-[10px] font-mono text-slate-500 uppercase border-b border-slate-200 pb-1 font-black">
                    አጠቃላይ መግለጫና ባህሪ / STAFF SERVICE LOG REMARKS
                  </h4>
                  <p className="text-slate-700 text-[11px] leading-relaxed italic">
                    "{staff.info ? staff.info : 'ስለ ሰራተኛው ስነምግባር፣ የስልጠና ታሪክና ችሎታዎች ተጨማሪ ዝርዝር መግለጫ አልቀረበም። (No profile notes written).'}"
                  </p>
                </div>

              </div>
            </div>

            {/* SEALS & SIGNATURE FOOTER */}
            <div className="border-t-2 border-slate-200 pt-6 mt-6 relative z-10 break-inside-avoid">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-6 text-center text-xs">
                <div>
                  <span className="text-slate-400 text-[9px] block uppercase font-mono mb-6">የሰው ኃይል ዳይሬክተር / PREPARED BY HR</span>
                  <div className="w-48 border-b border-slate-400 mx-auto"></div>
                  <span className="text-[10px] text-slate-600 block mt-1 font-bold">ፊርማና ቀን (Signature & Date)</span>
                </div>

                <div className="text-center font-mono text-[9px] text-slate-400 select-none">
                  <p className="font-bold">PRINTED DATE</p>
                  <p className="font-extrabold text-slate-800">{printDate}</p>
                </div>

                <div>
                  <span className="text-slate-400 text-[9px] block uppercase font-mono mb-6">ማኔጂንግ ዳይሬክተር / APPROVED BY GENERAL MANAGER</span>
                  <div className="w-48 border-b border-slate-400 mx-auto"></div>
                  <span className="text-[10px] text-slate-600 block mt-1 font-bold">ማህተምና ፊርማ (Official GM Seal)</span>
                </div>
              </div>

              {/* Legal disclaimer */}
              <p className="text-[8px] text-slate-400 font-sans text-center mt-6 leading-normal uppercase select-none">
                Papyrus lodge Hawassa, Ethiopia. This document is an official registry record. Altering academic or service credentials on this sheet is strictly prohibited and subject to legal actions.
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
