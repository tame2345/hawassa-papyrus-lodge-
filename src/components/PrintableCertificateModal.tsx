/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Printer, X, Award, FileText, Briefcase } from 'lucide-react';
import { StaffMember } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface PrintableCertificateModalProps {
  staff: StaffMember;
  onClose: () => void;
}

export default function PrintableCertificateModal({ staff, onClose }: PrintableCertificateModalProps) {
  const { appLang, tText, tRole, isRtl } = useLanguage();

  const localeCode = appLang === 'am' ? 'am-ET' : appLang === 'zh' ? 'zh-CN' : appLang === 'ar' ? 'ar-SA' : appLang;
  const printDate = new Date().toLocaleDateString(localeCode === 'or' || localeCode === 'ti' || localeCode === 'sid' ? 'en-US' : localeCode, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const qrVerificationData = `PAPYRUS VERIFIED: Name: ${staff.name}, Role: ${staff.role}, Phone: ${staff.phone || 'N/A'}, HireDate: ${staff.hireDate || 'N/A'}, Edu: ${staff.education || 'N/A'}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&color=000000&data=${encodeURIComponent(qrVerificationData)}`;

  const handlePrint = () => {
    window.print();
  };

  const notRegistered = tText({
    am: 'ያልተመዘገበ',
    en: 'Not recorded',
    or: 'Hin galmoofne',
    ti: 'ኣይተመዝገበን',
    sid: 'Borreessaminokki',
    fr: 'Non enregistré',
    de: 'Nicht erfasst',
    it: 'Non registrato',
    zh: '未记录',
    ar: 'غير مسجل',
  });

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="fixed inset-0 z-[100] flex items-center justify-center bg-[#5C0A0A]/85 backdrop-blur-sm overflow-y-auto p-4 md:p-8">
      <div className="bg-[#991B1B] border-2 border-[#F4C22B] w-full max-w-4xl rounded-2xl overflow-hidden flex flex-col h-full max-h-[90vh] shadow-[0_20px_50px_rgba(0,0,0,0.4)] print:border-none print:bg-white print:text-black print:max-h-none print:h-auto print:static print:shadow-none">
        {/* Screen Controller Bar */}
        <div className="bg-[#8C1414] px-6 py-4 border-b border-[#F4C22B]/40 flex justify-between items-center shrink-0 print:hidden select-none">
          <div className="flex items-center gap-2">
            <Award className="text-[#F4C22B] w-5 h-5 animate-pulse shrink-0" />
            <div>
              <h3 className="text-white text-xs font-black uppercase tracking-wider">
                {tText({
                  am: 'የሰራተኛ የትምህርት ማስረጃ ሰነድ ማተሚያ',
                  en: 'Employee Credential & Record Sheet',
                  or: 'Maxxansa Sanada Barumsaa Hojjetaa',
                  ti: 'መሕተሚ ሰነድ ትምህርቲ ሰራሕተኛ',
                  sid: 'Loosaanchu Rosu Markaata Attama',
                  fr: 'Fiche de Diplômes et Dossier Employé',
                  de: 'Mitarbeiter-Zeugnis & Aktenausdruck',
                  it: 'Stampa Certificato e Scheda Dipendente',
                  zh: '员工学历与档案打印表',
                  ar: 'طباعة شهادة وسجل الموظف',
                })}
              </h3>
              <p className="text-[10px] text-[#FDE68A]">
                {tText({
                  am: 'የሰራተኛ የትምህርት እና የስራ ታሪክ ሰነድ',
                  en: 'Employee Career & Academic Document Record Sheet',
                  or: 'Tarree Barumsaa fi Hojii Hojjetaa',
                  ti: 'ሰነድ ስራሕን ትምህርትን ሰራሕተኛ',
                  sid: 'Loosaanchu Loosunna Rosu Seeda',
                  fr: 'Registre académique et professionnel',
                  de: 'Berufs- und Ausbildungsnachweis',
                  it: 'Registro accademico e professionale',
                  zh: '员工职业与学历正式记录表',
                  ar: 'السجل المهني والأكاديمي الرسمي للموظف',
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="bg-[#F4C22B] hover:bg-white text-stone-950 text-xs font-black uppercase px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border border-[#CF9D12]"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>
                🖨️ {tText({
                  am: 'ሰነዱን አትም',
                  en: 'Print Record',
                  or: 'Sanada Maxxansi',
                  ti: 'ሰነድ ኣሕትም',
                  sid: 'Seeda Attami',
                  fr: 'Imprimer',
                  de: 'Drucken',
                  it: 'Stampa',
                  zh: '打印档案',
                  ar: 'طباعة السجل',
                })}
              </span>
            </button>
            <button
              onClick={onClose}
              className="bg-[#7A1212] hover:bg-red-600 text-white p-2 rounded-xl border border-[#F4C22B]/40 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Container */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-[#7A1212] print:bg-white print:text-black print:p-0 print:overflow-visible">
          <div className="bg-white text-black p-8 md:p-12 w-full max-w-3xl mx-auto min-h-[1050px] flex flex-col justify-between border-[8px] border-double border-[#8C1414] shadow-2xl relative print:shadow-none print:border-[10px] print:my-0 print:mx-auto print:min-h-0 print:h-auto select-text">
            <div className="absolute top-2 left-2 right-2 bottom-2 border border-red-200 pointer-events-none"></div>

            {/* HEADER SECTION */}
            <div className="text-center space-y-3 relative z-10">
              <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-12 bg-[#B21F1F] flex items-center justify-center text-white text-lg font-black leading-none rounded-lg">
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
                {tText({
                  am: 'ይፋዊ የሰው ኃይል ማረጋገጫ ሰነድ',
                  en: 'Official HR Certification & Registry Record',
                  or: 'Galmee Mirkaneessaa Humna Namaa Seeraa',
                  ti: 'ወግዓዊ መረጋገጺ ሰነድ ሓይሊ ሰብ',
                  sid: 'Seeru Mannu Wolqa Buuxxisha Seeda',
                  fr: 'Certification RH Officielle',
                  de: 'Offizielle Personal-Zertifizierung',
                  it: 'Certificazione Ufficiale Risorse Umane',
                  zh: '官方人力资源认证档案',
                  ar: 'الشهادة والسجل الرسمي للموارد البشرية',
                })}
              </p>

              <h3 className="text-lg font-extrabold text-slate-900 uppercase tracking-tight mt-4">
                {tText({
                  am: 'የሰራተኛ የትምህርት ማስረጃና ሙያዊ ማህደር',
                  en: 'Staff Academic Credentials & Service Dossier',
                  or: 'Ragaa Barumsaa fi Hojii Hojjetaa',
                  ti: 'ማህደር ትምህርትን ሞያዊ ልምድን ሰራሕተኛ',
                  sid: 'Loosaanchu Rosunna Ogimmate Seeda',
                  fr: 'Dossier Académique et Professionnel',
                  de: 'Ausbildungs- und Dienstakte',
                  it: 'Fascicolo Accademico e Professionale',
                  zh: '员工学历资质与履历档案',
                  ar: 'ملف المؤهلات العلمية والخدمة المهنية',
                })}
              </h3>
            </div>

            {/* MIDDLE BODY */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 my-8 relative z-10 flex-1">
              <div className="md:col-span-4 flex flex-col items-center gap-6 border-r border-slate-200 pr-0 md:pr-6 md:border-r print:col-span-4 print:border-r print:pr-6">
                <div className="text-center space-y-2">
                  <p className="text-[8px] font-mono text-slate-400 uppercase tracking-wider font-extrabold">
                    {tText({ am: 'የሰራተኛው ፎቶ', en: 'Employee Photo', or: 'Suuraa Hojjetaa', ti: 'ስእሊ ሰራሕተኛ', sid: 'Loosaanchu Suura', fr: 'Photo Employé', de: 'Mitarbeiterfoto', it: 'Foto Dipendente', zh: '员工照片', ar: 'صورة الموظف' })}
                  </p>
                  <img
                    src={staff.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                    referrerPolicy="no-referrer"
                    className="w-36 h-36 border-4 border-slate-900 object-cover rounded-none shadow-md mx-auto"
                    alt="Employee Photo"
                  />
                </div>

                <div className="text-center bg-slate-50 border border-slate-200 p-3 w-full space-y-1">
                  <p className="text-[8px] font-mono text-slate-500 uppercase tracking-wider font-bold">
                    {tText({ am: 'ዲጂታል ማረጋገጫ QR', en: 'QR VERIFIED', or: 'MIRKANAAWAA QR', ti: 'QR መረጋገጺ', sid: 'QR BUUXXISHA', fr: 'VÉRIFICATION QR', de: 'QR VERIFIZIERT', it: 'VERIFICA QR', zh: '二维码验证', ar: 'التحقق عبر QR' })}
                  </p>
                  <img
                    src={qrCodeUrl}
                    referrerPolicy="no-referrer"
                    className="w-24 h-24 mx-auto object-contain border border-slate-100"
                    alt="Verification QR"
                  />
                  <span className="text-[8px] font-mono text-slate-400 block break-all leading-none">{staff.pin}-{staff.hireDate}</span>
                </div>

                <div className="border border-red-500/40 text-red-600 px-3 py-1 text-center font-mono text-[9px] font-extrabold uppercase tracking-widest rounded rotate-[-4deg] max-w-fit mx-auto select-none">
                  ✔ {tText({ am: 'በHR የተረጋገጠ', en: 'CONFIRMED BY HR', or: 'HR\'N MIRKANAWE', ti: 'ብHR ዝተረጋገጸ', sid: 'HR BUUXXINO', fr: 'CONFIRMÉ PAR RH', de: 'VON HR BESTÄTIGT', it: 'CONFERMATO HR', zh: '人力资源部确认', ar: 'معتمد من الموارد البشرية' })}
                </div>
              </div>

              <div className="md:col-span-8 space-y-5 print:col-span-8">
                <div className="space-y-3">
                  <h4 className="text-[10px] font-mono text-slate-500 uppercase border-b border-slate-200 pb-1 font-black flex items-center gap-1">
                    <Briefcase className="w-3 h-3 text-slate-600" />
                    <span>{tText({ am: 'ምዝገባ መለያ መረጃ', en: 'Verified Profile', or: 'Odeeffannoo Galmaa\'ee', ti: 'ዝተረጋገጸ መለለዪ', sid: 'Buuxxinoonni Xapho', fr: 'Profil Vérifié', de: 'Verifiziertes Profil', it: 'Profilo Verificato', zh: '已认证员工信息', ar: 'الملف الشخصي الموثق' })}</span>
                  </h4>

                  <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold font-mono">
                        {tText({ am: 'ሙሉ ስም', en: 'Full Name', or: 'Maqaa Guutuu', ti: 'ሙሉእ ስም', sid: 'Wo\'ma Su\'ma', fr: 'Nom Complet', de: 'Vollständiger Name', it: 'Nome Completo', zh: '全名', ar: 'الاسم الكامل' })}
                      </span>
                      <span className="font-extrabold text-slate-900 text-sm">{staff.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold font-mono">
                        {tText({ am: 'የስራ መደብ', en: 'Designation / Role', or: 'Gahee Hojii', ti: 'መደብ ስራሕ', sid: 'Loosu Deerra', fr: 'Poste / Rôle', de: 'Position / Rolle', it: 'Ruolo', zh: '职务角色', ar: 'المسمى الوظيفي' })}
                      </span>
                      <span className="font-extrabold text-blue-800 uppercase tracking-wide">
                        {tRole(staff.role)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold font-mono">
                        {tText({ am: 'ስልክ ቁጥር', en: 'Contact Phone', or: 'Bilbila', ti: 'ስልኪ', sid: 'Silke', fr: 'Téléphone', de: 'Telefon', it: 'Telefono', zh: '联系电话', ar: 'رقم الهاتف' })}
                      </span>
                      <span className="font-extrabold text-slate-900 font-mono">{staff.phone || notRegistered}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold font-mono">
                        {tText({ am: 'የቅጥር ቀን', en: 'Hired Date', or: 'Guyyaa Qacarrii', ti: 'ዕለት ቅጥረት', sid: 'Qaxarame Barra', fr: 'Date d\'embauche', de: 'Einstellungsdatum', it: 'Data Assunzione', zh: '入职日期', ar: 'تاريخ التعيين' })}
                      </span>
                      <span className="font-extrabold text-slate-900 font-mono">{staff.hireDate || notRegistered}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  <h4 className="text-[10px] font-mono text-slate-500 uppercase border-b border-slate-200 pb-1 font-black flex items-center gap-1">
                    <FileText className="w-3 h-3 text-slate-600" />
                    <span>{tText({ am: 'የትምህርት ደረጃና ማስረጃዎች', en: 'ACADEMIC CREDENTIALS', or: 'RAGAA BARUMSAA', ti: 'ትምህርታዊ መረዳእታታት', sid: 'ROSU MARKAATA', fr: 'DIPLÔMES ACADÉMIQUES', de: 'AUSBILDUNGSNACHWEISE', it: 'TITOLI ACCADEMICI', zh: '学历资质证明', ar: 'المؤهلات الأكاديمية' })}</span>
                  </h4>

                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-none">
                    <p className="text-slate-400 text-[9px] uppercase font-bold font-mono mb-1">
                      {tText({ am: 'የቀረቡ ማስረጃዎች መግለጫ', en: 'Submitted Credentials', or: 'Ibsa Ragaa Dhiyaate', ti: 'መግለጺ ዝቐረበ መረጋገጺ', sid: 'Shiqino Markaati Xapho', fr: 'Diplômes soumis', de: 'Eingereichte Nachweise', it: 'Titoli presentati', zh: '已提交的学历说明', ar: 'تفاصيل الشهادات المقدمة' })}
                    </p>
                    <p className="text-slate-950 font-bold text-xs leading-relaxed">
                      {staff.education || tText({
                        am: 'የላቀ የትምህርት ወይም የልምድ ሰነድ አልተመዘገበም።',
                        en: 'No academic summary submitted.',
                        or: 'Ibsi barumsaa hin galmoofne.',
                        ti: 'መረዳእታ ትምህርቲ ኣይተመዝገበን።',
                        sid: 'Rosu xapho borreessamino dino.',
                        fr: 'Aucun diplôme enregistré.',
                        de: 'Keine Ausbildungsdaten hinterlegt.',
                        it: 'Nessun riepilogo accademico registrato.',
                        zh: '未登记学历摘要。',
                        ar: 'لم يتم تسجيل ملخص أكاديمي.',
                      })}
                    </p>
                  </div>
                </div>

                {staff.certificatePhoto && (
                  <div className="space-y-2 pt-1 break-inside-avoid">
                    <p className="text-slate-400 text-[9px] uppercase font-bold font-mono block">
                      {tText({ am: 'የተጫነ የሰርተፊኬት ኮፒ', en: 'ATTACHED CERTIFICATE COPY', or: 'KOOPPII WAAQAALAA', ti: 'ዝተተሓሓዘ ሰርቲፊኬት', sid: 'LEDDAAMO SERTIFIKEETE', fr: 'COPIE DU CERTIFICAT', de: 'ANGEHÄNGTES ZERTIFIKAT', it: 'COPIA CERTIFICATO ALLEGATA', zh: '附件证书扫描件', ar: 'نسخة الشهادة المرفقة' })}
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

                <div className="space-y-2 pt-1">
                  <h4 className="text-[10px] font-mono text-slate-500 uppercase border-b border-slate-200 pb-1 font-black">
                    {tText({ am: 'አጠቃላይ መግለጫና ባህሪ', en: 'STAFF SERVICE REMARKS', or: 'YAADA TAJAAJILAA', ti: 'ሓፈሻዊ መብርሂ ስራሕ', sid: 'LOOSU XAPHO', fr: 'REMARQUES DE SERVICE', de: 'DIENSTBEMERKUNGEN', it: 'NOTE DI SERVIZIO', zh: '员工工作评语', ar: 'ملاحظات الخدمة المهنية' })}
                  </h4>
                  <p className="text-slate-700 text-[11px] leading-relaxed italic">
                    "{staff.info || tText({
                      am: 'ተጨማሪ የመገለጫ ማስታወሻ አልተጻፈም።',
                      en: 'No profile remarks written.',
                      or: 'Yaadannoon dabalataa hin barreeffamne.',
                      ti: 'ተወሳኺ መግለጺ ኣይተጻሕፈን።',
                      sid: 'Leddaamo qaagi borreessamino dino.',
                      fr: 'Aucune remarque enregistrée.',
                      de: 'Keine Bemerkungen eingetragen.',
                      it: 'Nessuna nota inserita.',
                      zh: '暂无档案备注。',
                      ar: 'لا توجد ملاحظات مسجلة.',
                    })}"
                  </p>
                </div>
              </div>
            </div>

            {/* SEALS & SIGNATURE FOOTER */}
            <div className="border-t-2 border-slate-200 pt-6 mt-6 relative z-10 break-inside-avoid">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-6 text-center text-xs">
                <div>
                  <span className="text-slate-400 text-[9px] block uppercase font-mono mb-6">
                    {tText({ am: 'የሰው ኃይል ዳይሬክተር (HR)', en: 'PREPARED BY HR', or: 'QOPHEESSAA HR', ti: 'ብHR ዝተዳለወ', sid: 'HR QIXXEESSINO', fr: 'PRÉPARÉ PAR RH', de: 'ERSTELLT VON HR', it: 'PREPARATO DA HR', zh: '人力资源部编制', ar: 'إعداد الموارد البشرية' })}
                  </span>
                  <div className="w-48 border-b border-slate-400 mx-auto"></div>
                  <span className="text-[10px] text-slate-600 block mt-1 font-bold">
                    {tText({ am: 'ፊርማና ቀን', en: 'Signature & Date', or: 'Mallattoo fi Guyyaa', ti: 'ክታምን ዕለትን', sid: 'Furmanna Barra', fr: 'Signature & Date', de: 'Unterschrift & Datum', it: 'Firma e Data', zh: '签名与日期', ar: 'التوقيع والتاريخ' })}
                  </span>
                </div>

                <div className="text-center font-mono text-[9px] text-slate-400 select-none">
                  <p className="font-bold">{tText({ am: 'የታተመበት ቀን', en: 'PRINTED DATE', or: 'GUYYAA MAXXANFAME', ti: 'ዝተሓትመሉ ዕለት', sid: 'ATTAMINO BARRA', fr: 'DATE D\'IMPRESSION', de: 'DRUCKDATUM', it: 'DATA DI STAMPA', zh: '打印日期', ar: 'تاريخ الطباعة' })}</p>
                  <p className="font-extrabold text-slate-800">{printDate}</p>
                </div>

                <div>
                  <span className="text-slate-400 text-[9px] block uppercase font-mono mb-6">
                    {tText({ am: 'ዋና ስራ አስኪያጅ (GM)', en: 'APPROVED BY GENERAL MANAGER', or: 'HOOGGANAA OLAANAA', ti: 'ብዋና ኣመሓዳሪ ዝጸደቐ', sid: 'GM BUUXXINO', fr: 'APPROUVÉ PAR LA DIRECTION', de: 'GENEHMIGT VON DIREKTION', it: 'APPROVATO DALLA DIREZIONE', zh: '总经理批准', ar: 'اعتماد المدير العام' })}
                  </span>
                  <div className="w-48 border-b border-slate-400 mx-auto"></div>
                  <span className="text-[10px] text-slate-600 block mt-1 font-bold">
                    {tText({ am: 'ማህተምና ፊርማ', en: 'Official GM Seal', or: 'Chaappaa fi Mallattoo', ti: 'ማሕተምን ክታምን', sid: 'Mahtamanna Furma', fr: 'Cachet officiel', de: 'Offizielles Siegel', it: 'Timbro ufficiale', zh: '官方印章', ar: 'الختم الرسمي' })}
                  </span>
                </div>
              </div>

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

