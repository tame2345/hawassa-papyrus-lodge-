/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Folder, 
  FileText, 
  Image as ImageIcon, 
  Lock, 
  Trash2, 
  Download, 
  Upload, 
  Search, 
  Grid, 
  List, 
  File, 
  Plus, 
  Database,
  Cloud,
  CheckCircle,
  AlertCircle,
  Users,
  Briefcase,
  Layers,
  Sparkles,
  RefreshCw,
  Eye
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useLanguage } from '../context/LanguageContext';
import { AppLang } from '../i18n/translations';

export interface VaultFile {
  id: string;
  name: string;
  category: 'document' | 'receipt' | 'staff' | 'media' | 'confidential' | string;
  url: string;
  fileType: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
  notes?: string;
}

interface CloudVaultProps {
  onBack?: () => void;
  appLang?: AppLang;
}

const vaultTranslations: Record<string, Record<string, string>> = {
  secure_cloud_storage: {
    am: 'ደህንነቱ የተጠበቀ የክላውድ ማከማቻ',
    en: 'SECURE CLOUD STORAGE',
    or: 'KUUSAA KLAUWDII MIREESSAA',
    ti: 'ውሑስ ናይ ክላውድ መኽዘን',
    sid: 'AGARAMMINO KLAWUDETE KUUSA',
    fr: 'STOCKAGE CLOUD SÉCURISÉ',
    de: 'GESICHERTER CLOUD-SPEICHER',
    it: 'ARCHIVIO CLOUD SICURO',
    zh: '安全云端存储',
    ar: 'تخزين سحابي آمن'
  },
  cloud_synced: {
    am: 'ከክላውድ ጋር ተመሳስሏል',
    en: 'CLOUD SYNCED',
    or: 'KLAUWDII WALLIN MIREESSAME',
    ti: 'ምስ ክላውድ ተመሳሲሉ',
    sid: 'KLAWUDETENNI XAADOOMMINO',
    fr: 'SYNCHRONISÉ CLOUD',
    de: 'MIT CLOUD SYNCHRONISIERT',
    it: 'SINCRONIZZATO CON IL CLOUD',
    zh: '已云端同步',
    ar: 'متزامن مع السحابة'
  },
  syncing: {
    am: 'በማመሳሰል ላይ...',
    en: 'SYNCING...',
    or: 'AL-MIREESSAA JIRA...',
    ti: 'ምስንኻል...',
    sid: 'XAADIISSA ANNA...',
    fr: 'SYNCHRONISATION...',
    de: 'SYNCHRONISIERUNG...',
    it: 'SINCRONIZZAZIONE IN CORSO...',
    zh: '同步中...',
    ar: 'جارٍ المزامنة...'
  },
  local_storage: {
    am: 'አካባቢያዊ ማከማቻ',
    en: 'LOCAL STORAGE',
    or: 'KUUSAA KOOMPIYUTARAA',
    ti: 'ከባቢያዊ መኽዘን',
    sid: 'QOXXO KUUSA',
    fr: 'STOCKAGE LOCAL',
    de: 'LOKALER SPEICHER',
    it: 'ARCHIVIO LOCALE',
    zh: '本地存储',
    ar: 'تخزين محلي'
  },
  vault_title: {
    am: 'የክላውድ ፋይል ማቆያ እና ሴኪውሪቲ ቮልት (Papyrus Secure Team Vault)',
    en: 'Cloud File Storage & Security Team Vault',
    or: 'Kuusaa Fiilota Klaumdii fi Mooraa Nageenyaa Papyrus',
    ti: 'ናይ ክላውድ ፋይል መኽዘንን ናይ ሴኪውሪቲ ቮልትን (Papyrus Secure)',
    sid: 'Klawudete Fayilubba Kuusanna Keeru Gaachana',
    fr: 'Coffre-fort d\'équipe sécurisé Papyrus & Stockage Cloud',
    de: 'Papyrus Team-Sicherheitstresor & Cloud-Dateispeicher',
    it: 'Cassaforte del Team Sicuro Papyrus e Archivio File',
    zh: '云端文件库与安全团队保险箱',
    ar: 'مخزن الملفات السحابي وخزنة الفريق الآمنة'
  },
  cloud_sync_btn: {
    am: 'ከክላውድ ጋር አመሳስል',
    en: 'CLOUD SYNC',
    or: 'KLAUWDII WALLIN MIREESSI',
    ti: 'ምስ ክላውድ ኣመሳስል',
    sid: 'KLAWUDETENNI XAADIISSI',
    fr: 'SYNC CLOUD',
    de: 'CLOUD-SYNC',
    it: 'SINCRONIZZA CLOUD',
    zh: '云端同步',
    ar: 'مزامنة سحابية'
  },
  back_btn: {
    am: '↩ ተመለስ',
    en: '↩ BACK',
    or: '↩ DEEBI\'I',
    ti: '↩ ተመለስ',
    sid: '↩ HIGI',
    fr: '↩ RETOUR',
    de: '↩ ZURÜCK',
    it: '↩ INDIETRO',
    zh: '↩ 返回',
    ar: '↩ رجوع'
  },
  total_files: {
    am: 'ጠቅላላ ሰነዶች',
    en: 'Total Files',
    or: 'Waliigala Fiilotaa',
    ti: 'ጠቕላላ ፋይላት',
    sid: 'Xaphoomu Fayilubba',
    fr: 'Total des fichiers',
    de: 'Gesamte Dateien',
    it: 'File Totali',
    zh: '文件总数',
    ar: 'إجمالي الملفات'
  },
  files_unit: {
    am: 'ፋይሎች',
    en: 'files',
    or: 'fiilota',
    ti: 'ፋይላት',
    sid: 'fayilubba',
    fr: 'fichiers',
    de: 'Dateien',
    it: 'file',
    zh: '个文件',
    ar: 'ملفات'
  },
  storage_used: {
    am: 'የተያዘው የፋይል መጠን',
    en: 'Storage Used',
    or: 'Kuusaa Hojjetame',
    ti: 'ዝተታሕዘ መኽዘን መጠን',
    sid: 'Horoonsinoonni Kuusa',
    fr: 'Espace utilisé',
    de: 'Genutzter Speicher',
    it: 'Spazio Utilizzato',
    zh: '已用空间',
    ar: 'المساحة المستخدمة'
  },
  storage_meter: {
    am: 'የማከማቻ ሜትር',
    en: 'STORAGE METER',
    or: 'SAFARA KUUSAA',
    ti: 'ናይ መኽዘን መጠን መለክዒ',
    sid: 'KUUSU BIKKO',
    fr: 'JAUGE DE STOCKAGE',
    de: 'SPEICHERANZEIGE',
    it: 'INDICATORE DI SPAZIO',
    zh: '存储用量仪表',
    ar: 'مقياس التخزين'
  },
  max_buffer: {
    am: 'ከፍተኛው ገደብ',
    en: 'Max Buffer',
    or: 'Hanga Ol-Aanaa',
    ti: 'ዝለዓለ ደረት',
    sid: 'Alillicha Danga',
    fr: 'Limite Max',
    de: 'Max. Grenze',
    it: 'Limite Massimo',
    zh: '上限',
    ar: 'الحد الأقصى'
  },
  full_label: {
    am: 'የተያዘ',
    en: 'full',
    or: 'guutame',
    ti: 'ዝተታሕዘ',
    sid: 'wo’mino',
    fr: 'utilisé',
    de: 'belegt',
    it: 'pieno',
    zh: '已用',
    ar: 'مستخدم'
  },
  storage_upgrader: {
    am: '🚀 የማከማቻ መጠን ማሳደጊያ',
    en: '🚀 Storage Capacity Upgrader',
    or: '🚀 Hanga Kuusaa Guddisuuf',
    ti: '🚀 ናይ መኽዘን መጠን መዕበዪ',
    sid: '🚀 Kuusu Bikko Leellishi',
    fr: '🚀 Augmentation d\'espace de stockage',
    de: '🚀 Speicherplatz-Erweiterung',
    it: '🚀 Upgrade dello Spazio Cloud',
    zh: '🚀 存储容量升级',
    ar: '🚀 ترقية سعة التخزين'
  },
  storage_upgrader_desc: {
    am: 'የክላውድ ፋይል ማቆያዎ የተመደበለትን የመያዝ አቅም እዚህ በመጫን ወዲያውኑ ማሳደግ ይችላሉ።',
    en: 'Instantly upgrade the allocation limits of your secure cloud team vault in one click.',
    or: 'Dandeettii kuusaa klaumdii keessanii as tuquun battalumatti ol guddisuu dandeessu.',
    ti: 'ናይ ክላውድ ፋይል መኽዘንኩም ዝተመደበሉ ናይ ምሓዝ ዓቕሚ ኣብዚ ብምጽቃጥ ብቕጽበት ከተዕብይዎ ትኽእሉ ኢኹም።',
    sid: 'Klawudete kuusikki wolqa mitto qasatenni leddi.',
    fr: 'Augmentez instantanément les limites d\'allocation de votre coffre-fort cloud en un seul clic.',
    de: 'Erweitern Sie die Zuweisungslimits Ihres sicheren Team-Tresors sofort mit einem Klick.',
    it: 'Aumenta istantaneamente i limiti del tuo archivio cloud sicuro con un clic.',
    zh: '一键即时升级团队安全云保险箱的存储配额上限。',
    ar: 'قم بترقية حدود مساحة التخزين لخزنة الفريق السحابية بنقرة واحدة.'
  },
  starter_desc: {
    am: 'ነጻ ጥቅል',
    en: 'Free Starter Pack',
    or: 'Paakeejii Bilisaa',
    ti: 'ናጻ ፓኬጅ',
    sid: 'Mulla Umi Biddo',
    fr: 'Pack Gratuit',
    de: 'Kostenloses Starter-Paket',
    it: 'Pacchetto Gratuito',
    zh: '免费入门版',
    ar: 'باقة البداية المجانية'
  },
  pro_desc: {
    am: 'ፈጣን የቡድን ስራ',
    en: 'Fast Team Collaboration',
    or: 'Hojii Garee Saffisaa',
    ti: 'ቅልጡፍ ናይ ጋንታ ስራሕ',
    sid: 'Rahha Gaamote Looso',
    fr: 'Collaboration d\'équipe',
    de: 'Schnelle Teamarbeit',
    it: 'Collaborazione Veloce',
    zh: '团队高效协作',
    ar: 'تعاون سريع للفريق'
  },
  enterprise_desc: {
    am: 'ሙሉ ፋይሎች ማስቀመጫ',
    en: 'Enterprise Core Archive',
    or: 'Kuusaa Dhaabbataa Guutuu',
    ti: 'ናይ ምሉእ ፋይላት መኽዘን',
    sid: 'Wo’ma Uurrinshu Kuusa',
    fr: 'Archive d\'entreprise',
    de: 'Unternehmens-Vollarchiv',
    it: 'Archivio Aziendale',
    zh: '企业核心归档',
    ar: 'أرشيف المؤسسة الكامل'
  },
  unlimited_desc: {
    am: 'ስማርት ክላውድ',
    en: 'Infinite Smart Cloud',
    or: 'Klaumdii Daangaa Hin Qabne',
    ti: 'ስማርት ክላውድ',
    sid: 'Danga Dino Klawude',
    fr: 'Cloud Intelligent Illimité',
    de: 'Unbegrenzte Smart-Cloud',
    it: 'Cloud Smart Illimitato',
    zh: '无限智能云端',
    ar: 'سحابة ذكية غير محدودة'
  },
  alert_upgrade_success: {
    am: '🎉 የማከማቻ መጠንዎ ወደ {label} በስኬት አድጓል! ({desc})',
    en: '🎉 Your storage limit successfully upgraded to {label}! ({desc})',
    or: '🎉 Hangi kuusaa keessanii milkiin gara {label} tti guddateera! ({desc})',
    ti: '🎉 ናይ መኽዘን መጠንኩም ናብ {label} ብዓወት ተወሲኹ ኣሎ! ({desc})',
    sid: '🎉 Kuusikki dangi {label} geeshsha lexxino! ({desc})',
    fr: '🎉 Votre espace a été augmenté à {label} avec succès ! ({desc})',
    de: '🎉 Ihr Speicherlimit wurde erfolgreich auf {label} erweitert! ({desc})',
    it: '🎉 Spazio cloud aggiornato con successo a {label}! ({desc})',
    zh: '🎉 存储空间配额已成功升级至 {label}！（{desc}）',
    ar: '🎉 تمت ترقية سعة التخزين بنجاح إلى {label}! ({desc})'
  },
  tts_upgrade_success: {
    am: 'የማከማቻ መጠንዎ ወደ {label} በተሳካ ሁኔታ አድጓል!',
    en: 'Your storage capacity has been upgraded to {label}!',
    or: 'Hangi kuusaa keessanii gara {label} tti ol guddateera!',
    ti: 'ናይ መኽዘን መጠንኩም ናብ {label} ብዓወት ተወሲኹ ኣሎ!',
    sid: 'Kuusikki wolqa {label} geeshsha lexxitino!',
    fr: 'Votre espace a été augmenté à {label} !',
    de: 'Ihr Speicherplatz wurde auf {label} erweitert!',
    it: 'Spazio cloud aggiornato a {label}!',
    zh: '您的存储容量已升级至 {label}！',
    ar: 'تمت ترقية سعة التخزين إلى {label}!'
  },
  add_new_file: {
    am: 'አዲስ ፋይል መጫኛ',
    en: 'Upload & Add Files',
    or: 'Fiilii Haaraa Ol-Fe\'uuf',
    ti: 'ሓዱሽ ፋይል መዕነዪ',
    sid: 'Haaro Fayile Qassi',
    fr: 'Téléverser de nouveaux fichiers',
    de: 'Neue Dateien hochladen',
    it: 'Carica e Aggiungi File',
    zh: '上传并添加文件',
    ar: 'رفع وإضافة ملفات'
  },
  drag_drop_text: {
    am: 'ይጫኑ ወይም ፋይል እዚህ ይጎትቱ',
    en: 'Click or Drag File here',
    or: 'As tuqaa ykn Fiilii asitti gadi dhiisaa',
    ti: 'ኣብዚ ጸቕጡ ወይ ፋይል ጉተቱ',
    sid: 'Qasi woy fayile kowiinni goshi',
    fr: 'Cliquez ou glissez un fichier ici',
    de: 'Klicken oder Datei hierher ziehen',
    it: 'Clicca o trascina il file qui',
    zh: '点击或拖拽文件到此处',
    ar: 'انقر أو اسحب الملف إلى هنا'
  },
  drag_drop_sub: {
    am: 'PDF፣ ZIP፣ ምስሎች እና የጽሑፍ ፋይሎችን እስከ 10MB ይደግፋል',
    en: 'Supports PDF, ZIP, IMAGES & TXT up to 10MB',
    or: 'PDF, ZIP, Fakkotaa fi TXT hanga 10MB gargaara',
    ti: 'PDF, ZIP, ስእልታትን ጽሑፍን ክሳብ 10MB ይድግፍ',
    sid: 'PDF, ZIP, Misillanna Borro 10MB geeshsha irkisanno',
    fr: 'Prend en charge PDF, ZIP, IMAGES & TXT jusqu\'à 10 Mo',
    de: 'Unterstützt PDF, ZIP, BILDER & TXT bis zu 10 MB',
    it: 'Supporta PDF, ZIP, IMMAGINI e TXT fino a 10MB',
    zh: '支持最大 10MB 的 PDF、ZIP、图片和文本文件',
    ar: 'يدعم PDF وZIP والصور والنصوص حتى 10 ميجابايت'
  },
  optional_metadata: {
    am: '⚙️ አማራጭ መረጃዎች (ከመጫንዎ በፊት ያስተካክሉ)',
    en: '⚙️ OPTIONAL METADATA (Edit before upload)',
    or: '⚙️ METADATA FILANNOO (Ol-fe\'uun dura sirreessaa)',
    ti: '⚙️ መማረጺ ሓበሬታታት (ቅድሚ ምዕናይኩም ኣስተኻኽሉ)',
    sid: '⚙️ DOORTINANNI MASHALAQQE (Qassate albaanni bikkissi)',
    fr: '⚙️ MÉTADONNÉES OPTIONNELLES (Modifier avant envoi)',
    de: '⚙️ OPTIONALE METADATEN (Vor dem Upload anpassen)',
    it: '⚙️ METADATI OPZIONALI (Modifica prima del caricamento)',
    zh: '⚙️ 可选元数据（上传前编辑）',
    ar: '⚙️ بيانات اختيارية (عدّلها قبل الرفع)'
  },
  custom_display_name: {
    am: 'ልዩ መለያ ስም',
    en: 'Custom File Display Name',
    or: 'Maqaa Muldhisa Fiilii Addaa',
    ti: 'ፍሉይ መለለዪ ስም',
    sid: 'Baxxino Fayile Su’ma',
    fr: 'Nom d\'affichage personnalisé',
    de: 'Benutzerdefinierter Anzeigename',
    it: 'Nome Visualizzato del File',
    zh: '自定义显示名称',
    ar: 'اسم العرض المخصص للملف'
  },
  custom_display_name_placeholder: {
    am: 'ለምሳሌ፡ የሊዝ ስምምነት ውል',
    en: 'e.g. Lease Agreement Contract',
    or: 'fkn. Waliigaltee Liizii',
    ti: 'ንኣብነት፡ ናይ ኪራይ ስምምዕነት ውዕል',
    sid: 'Lawishsha: Kirra Sheemaatu Borro',
    fr: 'ex. Contrat de bail',
    de: 'z. B. Mietvertrag-Dokument',
    it: 'es. Contratto di Locazione',
    zh: '例如：场地租赁合同',
    ar: 'مثال: عقد الإيجار'
  },
  file_category: {
    am: 'የሰነዱ ምድብ',
    en: 'File Category',
    or: 'Ramaddii Fiilii',
    ti: 'ዓይነት ምድብ ሰነድ',
    sid: 'Fayile Gaamo',
    fr: 'Catégorie de fichier',
    de: 'Dateikategorie',
    it: 'Categoria File',
    zh: '文件分类',
    ar: 'تصنيف الملف'
  },
  cat_all: {
    am: 'ሁሉም',
    en: 'ALL',
    or: 'HUNDA',
    ti: 'ኹሉም',
    sid: 'BAALA',
    fr: 'TOUS',
    de: 'ALLE',
    it: 'TUTTI',
    zh: '全部',
    ar: 'الكل'
  },
  cat_document: {
    am: '📄 ሰነዶች',
    en: '📄 Documents',
    or: '📄 Sanadoota',
    ti: '📄 ሰነዳት',
    sid: '📄 Borro',
    fr: '📄 Documents',
    de: '📄 Dokumente',
    it: '📄 Documenti',
    zh: '📄 文档',
    ar: '📄 مستندات'
  },
  cat_receipt: {
    am: '💳 የወጪ/የሽያጭ ደረሰኞች',
    en: '💳 Receipts & Invoices',
    or: '💳 Nagahee Kafaltii',
    ti: '💳 ናይ ወጻኢ/መሸጢ ደረሰኛታት',
    sid: '💳 Rasiidubba',
    fr: '💳 Factures et Reçus',
    de: '💳 Quittungen & Rechnungen',
    it: '💳 Ricevute e Fatture',
    zh: '💳 收据与发票',
    ar: '💳 الإيصالات والفواتير'
  },
  cat_staff: {
    am: '👤 የሰራተኞች ፋይል',
    en: '👤 Staff Dossiers',
    or: '👤 Fiilota Hojjettootaa',
    ti: '👤 ፋይል ሰራሕተኛታት',
    sid: '👤 Loosaasinete Fayile',
    fr: '👤 Dossiers Employés',
    de: '👤 Mitarbeiterakten',
    it: '👤 Fascicoli Personale',
    zh: '👤 员工档案',
    ar: '👤 ملفات الموظفين'
  },
  cat_media: {
    am: '🖼️ የፎቶ እና ሚዲያ ፋይል',
    en: '🖼️ Photo & Media Files',
    or: '🖼️ Fiilota Miidiyaa fi Suuraa',
    ti: '🖼️ ስእልታትን ሚድያን',
    sid: '🖼️ Misillanna Miidiya',
    fr: '🖼️ Médias et Photos',
    de: '🖼️ Foto- & Mediendateien',
    it: '🖼️ File Foto e Media',
    zh: '🖼️ 图片与媒体',
    ar: '🖼️ الصور والوسائط'
  },
  cat_confidential: {
    am: '🔒 ሚስጥራዊ ሰነዶች',
    en: '🔒 Confidential Files',
    or: '🔒 Sanadoota Iccitii',
    ti: '🔒 ምስጢራዊ ሰነዳት',
    sid: '🔒 Maaxantino Borro',
    fr: '🔒 Documents Confidentiels',
    de: '🔒 Vertrauliche Dokumente',
    it: '🔒 Documenti Riservati',
    zh: '🔒 机密文件',
    ar: '🔒 ملفات سرية'
  },
  file_notes: {
    am: 'አጭር ማብራሪያ ወይም ማስታወሻ',
    en: 'File Notes & Remarks',
    or: 'Ibsa Gabaabaa ykn Yaadannoo',
    ti: 'ሓጺር መብርሂ ወይ መዘኻኸሪ',
    sid: 'Harincho Xawishshanna Qaagishsha',
    fr: 'Notes et Remarques',
    de: 'Kurzbeschreibung oder Notiz',
    it: 'Note e Osservazioni',
    zh: '文件备注与说明',
    ar: 'ملاحظات الملف'
  },
  file_notes_placeholder: {
    am: 'የሰነዱን ይዘት ወይም ጥቅም እዚህ ይግለጹ...',
    en: 'Describe the purpose or details of this file...',
    or: 'Kaayyoo ykn dhimma fiilii kanaa asitti ibsaa...',
    ti: 'ትሕዝቶ ወይ ጥቕሚ እቲ ሰነድ ኣብዚ ግለጹ...',
    sid: 'Konni fayile hajo woy tirtirro kowiinni xawisi...',
    fr: 'Décrivez le but ou les détails de ce fichier...',
    de: 'Beschreiben Sie den Zweck dieses Dokuments...',
    it: 'Descrivi lo scopo o i dettagli di questo file...',
    zh: '请填写此文件的用途或备注说明...',
    ar: 'اشرح الغرض أو تفاصيل هذا الملف...'
  },
  search_placeholder: {
    am: 'ባለቤት፣ ስም ወይም ማብራሪያ ይፈልጉ...',
    en: 'Search by owner, file name or remarks...',
    or: 'Abbaa, maqaa ykn ibsa barbaadi...',
    ti: 'በዓል ቤት፣ ስም ወይ መብርሂ ድለዩ...',
    sid: 'Anni, su’mu woy xawishshu garinni hasi...',
    fr: 'Rechercher par propriétaire, nom ou remarques...',
    de: 'Suche nach Besitzer, Name oder Notizen...',
    it: 'Cerca per proprietario, nome o note...',
    zh: '按上传人、文件名或备注搜索...',
    ar: 'ابحث بالمالك أو اسم الملف أو الملاحظات...'
  },
  loading_files: {
    am: 'የክላውድ ፋይሎችን በማዘጋጀት ላይ...',
    en: 'Preparing Cloud Files...',
    or: 'Fiilota Klaumdii qopheessaa jira...',
    ti: 'ናይ ክላውድ ፋይላት ኣብ ምድላው ኣሎ...',
    sid: 'Klawudete fayilubba qixxeessanni no...',
    fr: 'Préparation des fichiers cloud...',
    de: 'Bereite Cloud-Dateien vor...',
    it: 'Preparazione dei file cloud...',
    zh: '正在加载云端文件...',
    ar: 'جارٍ تجهيز الملفات السحابية...'
  },
  no_files_found: {
    am: 'ምንም ፋይል አልተገኘም',
    en: 'No files found',
    or: 'Fiiliin tokkollee hin argamne',
    ti: 'ዝኾነ ፋይል ኣይተረኽበን',
    sid: 'Ayee fayilenka diafamino',
    fr: 'Aucun fichier trouvé',
    de: 'Keine Dateien gefunden',
    it: 'Nessun file trovato',
    zh: '未找到文件',
    ar: 'لم يتم العثور على ملفات'
  },
  no_files_found_desc: {
    am: 'የደረደሩት ወይም የፈለጉት ፋይል በአማራጮች ውስጥ የለም። አዲስ ፋይል ለመጨመር በግራ በኩል ያለውን ካርድ ይጠቀሙ።',
    en: 'The requested filter query or search term yielded zero results. Try uploading a new file.',
    or: 'Barbaadni keessan bu\'aa hin qabu. Fiilii haaraa ol-fe\'uuf kaardii bitaa fayyadamaa.',
    ti: 'እቲ ዝደለኹምዎ ፋይል የለን። ሓዱሽ ፋይል ንምዕናይ ኣብ ጸጋም ዘሎ ካርድ ተጠቐሙ።',
    sid: 'Hasattoonni fayile diafantino. Haaro fayile ledara guracho widoonni qassi.',
    fr: 'Le filtre ou le terme recherché n\'a donné aucun résultat. Essayez d\'ajouter un fichier.',
    de: 'Der ausgewählte Filter oder Suchbegriff lieferte keine Ergebnisse. Laden Sie eine neue Datei hoch.',
    it: 'La ricerca non ha prodotto risultati. Prova a caricare un nuovo file.',
    zh: '当前筛选或搜索词没有匹配结果。请尝试上传新文件。',
    ar: 'لم يُعثر على نتائج مطابقة. جرّب رفع ملف جديد.'
  },
  table_col_name: {
    am: 'የሰነድ ስም',
    en: 'FILE NAME & REMARKS',
    or: 'MAQAA FIILII & YAADANNOO',
    ti: 'ስም ሰነድ',
    sid: 'FAYILE SU’MA',
    fr: 'NOM DU FICHIER & NOTES',
    de: 'DATEINAME & NOTIZEN',
    it: 'NOME FILE E NOTE',
    zh: '文件名与备注',
    ar: 'اسم الملف والملاحظات'
  },
  table_col_cat: {
    am: 'ምድብ',
    en: 'CATEGORY',
    or: 'RAMADDII',
    ti: 'ምድብ',
    sid: 'GAAMO',
    fr: 'CATÉGORIE',
    de: 'KATEGORIE',
    it: 'CATEGORIA',
    zh: '分类',
    ar: 'الفئة'
  },
  table_col_size: {
    am: 'መጠን',
    en: 'SIZE',
    or: 'HANGA',
    ti: 'መጠን',
    sid: 'BIKKO',
    fr: 'TAILLE',
    de: 'GRÖSSE',
    it: 'DIMENSIONE',
    zh: '大小',
    ar: 'الحجم'
  },
  table_col_actions: {
    am: 'ቅንጅቶች',
    en: 'ACTIONS',
    or: 'QINJIYAA',
    ti: 'ቅንጅታት',
    sid: 'LOOSO',
    fr: 'ACTIONS',
    de: 'AKTIONEN',
    it: 'AZIONI',
    zh: '操作',
    ar: 'إجراءات'
  },
  preview_not_available: {
    am: 'ቅድመ እይታ ለዚህ የፋይል አይነት አይገኝም',
    en: 'Direct Preview Not Available',
    or: 'Dura-ilaaltonni fiilii kanaaf hin jiru',
    ti: 'ናይዚ ዓይነት ፋይል ቅድመ ምርኢት የለን',
    sid: 'Konne fayilera balaxxe la’a didandoo',
    fr: 'Aperçu direct non disponible',
    de: 'Direkte Vorschau nicht verfügbar',
    it: 'Anteprima Diretta non Disponibile',
    zh: '此文件类型暂不支持直接预览',
    ar: 'المعاينة المباشرة غير متوفرة لهذا الملف'
  },
  preview_not_available_desc: {
    am: 'ይህ ፋይል በቀጥታ በስክሪን ላይ ለመመልከት አይመችም። ሙሉ ለሙሉ ለማንበብ እባክዎን ወደ ኮምፒውተርዎ ወይም ስልክዎ ያውርዱት።',
    en: 'This file cannot be previewed inside the browser. Please download it to view the complete content.',
    or: 'Fiilii kana asitti ilaaluun hin danda\'amu. Ibsa guutuu argachuuf buufadhaa.',
    ti: 'እዚ ፋይል ብቐጥታ ክርአ ኣይክእልን እዩ። ንምሉእ ንባብ በጃኹም ናብ መሳርሒኹም ኣውርድዎ።',
    sid: 'Konne fayile kowiinni la’a didandoo. Wo’ma nabbawate dirrishi.',
    fr: 'Ce fichier ne peut pas être prévisualisé directement. Veuillez le télécharger pour le consulter.',
    de: 'Diese Datei kann nicht im Browser angezeigt werden. Bitte herunterladen, um den Inhalt zu sehen.',
    it: 'Questo file non può essere visualizzato nel browser. Scaricalo per visualizzarne il contenuto.',
    zh: '无法在浏览器中直接预览此文件。请下载后查看完整内容。',
    ar: 'لا يمكن معاينة هذا الملف داخل المتصفح. يرجى تنزيله لعرض المحتوى الكامل.'
  },
  download_btn: {
    am: 'ሰነዱን አሁን አውርድ',
    en: 'DOWNLOAD FILE NOW',
    or: 'FIILII AMMUMA BUUSI',
    ti: 'ነዚ ሰነድ ሕጂ ኣውርድ',
    sid: 'FAYILE XAA DIRRISHI',
    fr: 'TÉLÉCHARGER MAINTENANT',
    de: 'DATEI JETZT HERUNTERLADEN',
    it: 'SCARICA IL FILE ORA',
    zh: '立即下载文件',
    ar: 'تنزيل الملف الآن'
  },
  download_short: {
    am: 'አውርድ',
    en: 'DOWNLOAD',
    or: 'BUUSI',
    ti: 'ኣውርድ',
    sid: 'DIRRISHI',
    fr: 'TÉLÉCHARGER',
    de: 'LADEN',
    it: 'SCARICA',
    zh: '下载',
    ar: 'تنزيل'
  },
  preview_label: {
    am: 'ቅድመ እይታ',
    en: 'Preview',
    or: 'Dura-Ilaali',
    ti: 'ቅድመ ምርኢት',
    sid: 'Balaxxe La’i',
    fr: 'Aperçu',
    de: 'Vorschau',
    it: 'Anteprima',
    zh: '预览',
    ar: 'معاينة'
  },
  download_file: {
    am: 'ፋይሉን አውርድ',
    en: 'Download File',
    or: 'Fiilii Buusi',
    ti: 'ፋይል ኣውርድ',
    sid: 'Fayile Dirrishi',
    fr: 'Télécharger le fichier',
    de: 'Datei herunterladen',
    it: 'Scarica file',
    zh: '下载文件',
    ar: 'تنزيل الملف'
  },
  delete_file: {
    am: 'ፋይሉን ሰርዝ',
    en: 'Delete File',
    or: 'Fiilii Haqi',
    ti: 'ፋይል ሰርዝ',
    sid: 'Fayile Huni',
    fr: 'Supprimer le fichier',
    de: 'Datei löschen',
    it: 'Elimina file',
    zh: '删除文件',
    ar: 'حذف الملف'
  },
  remarks_metadata: {
    am: 'ማብራሪያ እና ሜታዳታ',
    en: 'REMARKS & METADATA',
    or: 'IBSA FI METADATA',
    ti: 'መብርሂን ሜታዳታን',
    sid: 'XAWISHSHANNA METADATA',
    fr: 'REMARQUES & MÉTADONNÉES',
    de: 'NOTIZEN & METADATEN',
    it: 'OSSERVAZIONI E METADATI',
    zh: '备注与元数据',
    ar: 'الملاحظات والبيانات'
  },
  uploaded_by: {
    am: 'የጫነው ባለሙያ',
    en: 'Uploaded By',
    or: 'Kan Ol-Fe\'e',
    ti: 'ዝዓነኖ ሰብ',
    sid: 'Qassinohu',
    fr: 'Téléversé par',
    de: 'Hochgeladen von',
    it: 'Caricato Da',
    zh: '上传者',
    ar: 'رُفع بواسطة'
  },
  uploaded_at: {
    am: 'የተጫነበት ቀን',
    en: 'Uploaded At',
    or: 'Guyyaa Ol-Fe\'ame',
    ti: 'ዝተዓነነሉ ዕለት',
    sid: 'Qassinoonni Barra',
    fr: 'Téléversé le',
    de: 'Hochgeladen am',
    it: 'Caricato il',
    zh: '上传时间',
    ar: 'تاريخ الرفع'
  },
  no_remarks: {
    am: 'ምንም ማብራሪያ አልተጻፈም',
    en: 'No remarks or notes provided',
    or: 'Yaadannoon hin kennamne',
    ti: 'ዝኾነ መብርሂ ኣይተጻሕፈን',
    sid: 'Ayee qaagishshinka diborreesamino',
    fr: 'Aucune remarque fournie',
    de: 'Keine Anmerkungen angegeben',
    it: 'Nessuna osservazione fornita',
    zh: '暂无备注说明',
    ar: 'لا توجد ملاحظات'
  },
  deleted_successfully: {
    am: '🗑️ ፋይሉ በተሳካ ሁኔታ ተሰርዟል!',
    en: '🗑️ File deleted successfully!',
    or: '🗑️ Fiiliin milkiin haqameera!',
    ti: '🗑️ እቲ ፋይል ብዓወት ተሰሪዙ ኣሎ!',
    sid: '🗑️ Fayile keereenni hunamino!',
    fr: '🗑️ Fichier supprimé avec succès !',
    de: '🗑️ Datei erfolgreich gelöscht!',
    it: '🗑️ File eliminato con successo!',
    zh: '🗑️ 文件已成功删除！',
    ar: '🗑️ تم حذف الملف بنجاح!'
  },
  delete_error: {
    am: '❌ ፋይሉን ለመሰረዝ አልተቻለም',
    en: '❌ Could not delete the file',
    or: '❌ Fiilii haquun hin danda\'amne',
    ti: '❌ ነቲ ፋይል ምስራዝ ኣይተኻእለን',
    sid: '❌ Fayile huna didamino',
    fr: '❌ Impossible de supprimer le fichier',
    de: '❌ Datei konnte nicht gelöscht werden',
    it: '❌ Impossibile eliminare il file',
    zh: '❌ 无法删除该文件',
    ar: '❌ تعذر حذف الملف'
  },
  unlimited: {
    am: 'ያልተገደበ',
    en: 'Unlimited',
    or: 'Daangaa-Malee',
    ti: 'ደረት ዘይብሉ',
    sid: 'Danga-Bela',
    fr: 'Illimité',
    de: 'Unbegrenzt',
    it: 'Illimitato',
    zh: '无限容量',
    ar: 'غير محدود'
  },
  confirm_delete: {
    am: '⚠️ እርግጠኛ ነዎት ይህንን ፋይል ለመሰረዝ ይፈልጋሉ?',
    en: '⚠️ Confirm Delete?',
    or: '⚠️ Haquu mirkaneessitaa?',
    ti: '⚠️ ክትስርዝዎ ርግጸኛ ዲኹም?',
    sid: '⚠️ Hunate buuxxeetta?',
    fr: '⚠️ Confirmer la suppression ?',
    de: '⚠️ Wirklich löschen?',
    it: '⚠️ Confermare eliminazione?',
    zh: '⚠️ 确认删除？',
    ar: '⚠️ تأكيد الحذف؟'
  },
  confirm_yes: {
    am: 'አዎ',
    en: 'Yes',
    or: 'Eeyyee',
    ti: 'እወ',
    sid: 'Ee',
    fr: 'Oui',
    de: 'Ja',
    it: 'Sì',
    zh: '是',
    ar: 'نعم'
  },
  confirm_no: {
    am: 'ተው',
    en: 'Cancel',
    or: 'Dhiisi',
    ti: 'ግደፍ',
    sid: 'Aguri',
    fr: 'Annuler',
    de: 'Abbrechen',
    it: 'Annulla',
    zh: '取消',
    ar: 'إلغاء'
  },
  success_upload: {
    am: '📤 አዲስ ፋይል በተሳካ ሁኔታ ተጭኗል!',
    en: '📤 File uploaded successfully!',
    or: '📤 Fiiliin haaraa milkiin fe\'ameera!',
    ti: '📤 ሓዱሽ ፋይል ብዓወት ተዓኒኑ ኣሎ!',
    sid: '📤 Haaro fayile keereenni qassamino!',
    fr: '📤 Fichier téléversé avec succès !',
    de: '📤 Datei erfolgreich hochgeladen!',
    it: '📤 File caricato con successo!',
    zh: '📤 文件上传成功！',
    ar: '📤 تم رفع الملف بنجاح!'
  },
  error_upload: {
    am: '❌ ፋይሉን ለመጫን ስህተት ተፈጥሯል',
    en: '❌ Error processing file upload',
    or: '❌ Fiilii fe\'uuf rakkoon uumameera',
    ti: '❌ ፋይል ኣብ ምዕናይ ጌጋ ተፈጢሩ',
    sid: '❌ Fayile qassate aana soro kalaqamino',
    fr: '❌ Erreur lors du téléversement',
    de: '❌ Fehler beim Hochladen der Datei',
    it: '❌ Errore durante il caricamento del file',
    zh: '❌ 文件上传出错',
    ar: '❌ خطأ أثناء رفع الملف'
  },
  error_read: {
    am: '❌ ፋይሉን ማንበብ አልተቻለም',
    en: '❌ Cannot read this file',
    or: '❌ Fiilii dubbisuun hin danda\'amne',
    ti: '❌ ነዚ ፋይል ምንባብ ኣይተኻእለን',
    sid: '❌ Konne fayile nabbawa didamino',
    fr: '❌ Impossible de lire le fichier',
    de: '❌ Datei konnte nicht gelesen werden',
    it: '❌ Impossibile leggere il file',
    zh: '❌ 无法读取该文件',
    ar: '❌ تعذر قراءة الملف'
  },
  sync_success: {
    am: '💾 ሁሉም የክላውድ ፋይሎች ከ Supabase ደህንነት ዳታቤዝ ጋር በተሳካ ሁኔታ ተመሳስለዋል!',
    en: '💾 All files synced successfully with Supabase secure cloud!',
    or: '💾 Fiilota hunda milkiin Supabase wajjiin wal-simsiifameera!',
    ti: '💾 ኹሉም ፋይላት ምስ Supabase ብዓወት ተመሳሲሎም ኣለዉ!',
    sid: '💾 Baala klawudete fayilubba Supabase ledo xaaddu!',
    fr: '💾 Tous les fichiers ont été synchronisés avec Supabase !',
    de: '💾 Alle Dateien erfolgreich mit Supabase synchronisiert!',
    it: '💾 Tutti i file sono stati sincronizzati con Supabase!',
    zh: '💾 所有云端文件已成功与 Supabase 同步！',
    ar: '💾 تمت مزامنة جميع الملفات مع السحابة الآمنة بنجاح!'
  },
  sync_failed: {
    am: 'ℹ️ ማመሳሰል አልተቻለም',
    en: 'ℹ️ Sync failed',
    or: 'ℹ️ Wal-simsiisuun hin milkoofne',
    ti: 'ℹ️ ምምስሳል ኣይተኻእለን',
    sid: 'ℹ️ Xaadishshu didamino',
    fr: 'ℹ️ Échec de synchronisation',
    de: 'ℹ️ Synchronisierung fehlgeschlagen',
    it: 'ℹ️ Sincronizzazione non riuscita',
    zh: 'ℹ️ 同步失败',
    ar: 'ℹ️ فشلت المزامنة'
  },
  sync_local_warning: {
    am: 'ሰነዶቹ በአካባቢያዊ ዲስክ ላይ በደህንነት ተቀምጠዋል።',
    en: 'Files saved securely in the local browser space.',
    or: 'Sanadoonni kuusaa kompiyutara keessanii irratti nagaan dhaa.',
    ti: 'ፋይላት ኣብቲ ከባቢያዊ ዲስክኩም ብውሑስ ተቐሚጦም ኣለዉ።',
    sid: 'Borro qoxxo kuusira keereenni maaxamino.',
    fr: 'Fichiers enregistrés localement dans votre navigateur.',
    de: 'Dateien wurden lokal im Browser gesichert.',
    it: 'File salvati localmente nel browser.',
    zh: '文件已安全保存在本地浏览器存储中。',
    ar: 'تم حفظ الملفات بأمان في التخزين المحلي للمتصفح.'
  },
  default_uploader: {
    am: 'ስራ አስኪያጅ (Manager)',
    en: 'Manager',
    or: 'Hojii Gaggeessaa',
    ti: 'መራሒ ስራሕ',
    sid: 'Loosu Massagaancho',
    fr: 'Directeur',
    de: 'Manager',
    it: 'Direttore',
    zh: '经理',
    ar: 'المدير'
  },
  default_note: {
    am: 'በክላውድ ፋይል ማቆያ የተቀመጠ ሰነድ',
    en: 'Document stored in secure cloud vault',
    or: 'Sanada kuusaa klaumdii keessatti ol-kaa\'ame',
    ti: 'ኣብ ውሑስ ክላውድ መኽዘን ዝተቐመጠ ሰነድ',
    sid: 'Keeru klawudete kuusira maaxamino borro',
    fr: 'Document stocké dans le coffre-fort cloud sécurisé',
    de: 'Im sicheren Cloud-Tresor gespeichertes Dokument',
    it: 'Documento archiviato nella cassaforte cloud sicura',
    zh: '已存储于安全云端保险箱的文件',
    ar: 'مستند محفوظ في الخزنة السحابية الآمنة'
  }
};

export default function CloudVault({ onBack }: CloudVaultProps) {
  const { appLang, isRtl } = useLanguage();
  const t = (key: string) => {
    return vaultTranslations[key]?.[appLang] || vaultTranslations[key]?.['en'] || '';
  };
  const dateLocale =
    appLang === 'am' ? 'am-ET' :
    appLang === 'ti' ? 'ti-ET' :
    appLang === 'or' ? 'om-ET' :
    appLang === 'fr' ? 'fr-FR' :
    appLang === 'de' ? 'de-DE' :
    appLang === 'it' ? 'it-IT' :
    appLang === 'zh' ? 'zh-CN' :
    appLang === 'ar' ? 'ar-SA' :
    'en-US';
  const [statusNotice, setStatusNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const showStatusNotice = (type: 'success' | 'error', text: string) => {
    setStatusNotice({ type, text });
    window.setTimeout(() => {
      setStatusNotice((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isUploading, setIsUploading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'local' | 'syncing'>('local');
  const [dragActive, setDragActive] = useState(false);
  const [storageUsed, setStorageUsed] = useState(0); // in bytes
  const [storageLimit, setStorageLimit] = useState<number>(50 * 1024 * 1024); // default 50MB (dynamically fetched on mount)
  const [previewFile, setPreviewFile] = useState<VaultFile | null>(null);

  // New File Form State
  const [customFileName, setCustomFileName] = useState('');
  const [customFileCategory, setCustomFileCategory] = useState<'document' | 'receipt' | 'staff' | 'media' | 'confidential'>('document');
  const [customFileNotes, setCustomFileNotes] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Default Files to seed database/local state if empty
  const defaultFiles: VaultFile[] = [
    {
      id: 'default-1',
      name: 'የሎጁ የስራ ስምምነት ውል (Lodge Lease Agreement).pdf',
      category: 'document',
      url: 'data:text/plain;base64,TG9kZ2UgTGVhc2UgQWdyZWVtZW50IENvbnRlbnRz',
      fileType: 'application/pdf',
      size: 4500000,
      uploadedBy: 'ዋና አስተዳዳሪ (Admin)',
      uploadedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'የካርታ እና የህንፃ ሊዝ ውል ሰነድ'
    },
    {
      id: 'default-2',
      name: 'የግብር ከፋይ መለያ ምዝገባ (TIN Registration Certificate).png',
      category: 'confidential',
      url: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&q=80&w=600',
      fileType: 'image/jpeg',
      size: 1540000,
      uploadedBy: 'የሂሳብ ሹም (Accountant)',
      uploadedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'ለፌዴራል ግብር ንግድ ፈቃድ አስፈላጊ ሰነድ'
    },
    {
      id: 'default-3',
      name: 'የሰራተኞች የደመወዝ ማስረጃ (Staff Attendance May 2026).pdf',
      category: 'staff',
      url: 'data:text/plain;base64,U3RhZmYgQXR0ZW5kYW5jZSBNYXkgMjAyNg==',
      fileType: 'application/pdf',
      size: 850000,
      uploadedBy: 'ስራ አስኪያጅ (Manager)',
      uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'የግንቦት ወር የሰራተኞች የሰዓት መከታተያ'
    },
    {
      id: 'default-4',
      name: 'የወርሀዊ ወጪ ደረሰኝ (Monthly Invoices & Receipts).zip',
      category: 'receipt',
      url: 'data:text/plain;base64,UmVjZWlwdHMgJiBJbnZvaWNlcw==',
      fileType: 'application/zip',
      size: 12400000,
      uploadedBy: 'የገንዘብ ያዥ (Cashier)',
      uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'የምግብ ግብአቶች እና የፈርኒቸር ግዥ ደረሰኞች'
    },
    {
      id: 'default-5',
      name: 'የፓፒረስ ሎጅ ማስታወቂያ እይታ (Papyrus Scenic Video Screenshot).jpg',
      category: 'media',
      url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=600',
      fileType: 'image/jpeg',
      size: 3200000,
      uploadedBy: 'የህዝብ ግንኙነት (PR Admin)',
      uploadedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'የዌብሳይት ጀርባ ማስታወቂያ ሚዲያ'
    }
  ];

  // Load files from Supabase using system_settings
  useEffect(() => {
    async function loadFiles() {
      setLoading(true);
      try {
        let fetchedFiles: VaultFile[] = [];
        if (supabase) {
          // 1. Fetch vault files
          const { data, error } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'vault_files')
            .single();

          if (!error && data && data.value && Array.isArray(data.value.files)) {
            fetchedFiles = data.value.files;
            setSyncStatus('synced');
          }

          // 2. Fetch storage limit
          const { data: limitData, error: limitError } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'storage_limit')
            .single();
          if (!limitError && limitData && limitData.value && typeof limitData.value.limit === 'number') {
            setStorageLimit(limitData.value.limit);
          }
        }

        if (fetchedFiles.length === 0) {
          fetchedFiles = defaultFiles;
          if (supabase) {
            await supabase
              .from('system_settings')
              .upsert({ key: 'vault_files', value: { files: defaultFiles } });
          }
          setSyncStatus('synced');
        }

        setFiles(fetchedFiles);
      } catch (err) {
        console.error('Error loading vault files:', err);
        setFiles(defaultFiles);
        setSyncStatus('local');
      } finally {
        setLoading(false);
      }
    }

    loadFiles();
  }, []);

  // Recalculate Storage Used
  useEffect(() => {
    const totalBytes = files.reduce((acc, file) => acc + (file.size || 0), 0);
    setStorageUsed(totalBytes);
  }, [files]);

  // Synchronize Local Files with Supabase database if available
  const handleSyncDatabase = async () => {
    setSyncStatus('syncing');
    try {
      if (!supabase) {
        throw new Error('Supabase client not configured.');
      }

      const { error } = await supabase
        .from('system_settings')
        .upsert({ key: 'vault_files', value: { files } });

      if (error) throw error;

      setSyncStatus('synced');
      showStatusNotice('success', t('sync_success'));
    } catch (err: any) {
      console.warn('Sync failed:', err);
      setSyncStatus('local');
      showStatusNotice('error', `${t('sync_failed')}: ${err.message || 'offline'}`);
    }
  };

  // Helper: Format bytes to human readable string
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Helper: Get Icon based on Category/FileType
  const getFileIcon = (category: string, type: string) => {
    switch (category) {
      case 'document':
        return <FileText className="w-5 h-5 text-sky-400" />;
      case 'receipt':
        return <Briefcase className="w-5 h-5 text-emerald-400" />;
      case 'staff':
        return <Users className="w-5 h-5 text-purple-400" />;
      case 'media':
        return <ImageIcon className="w-5 h-5 text-amber-400" />;
      case 'confidential':
        return <Lock className="w-5 h-5 text-rose-400" />;
      default:
        return <File className="w-5 h-5 text-indigo-400" />;
    }
  };

  // Drag and Drop Upload logic
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  // Execute File Upload (Upload to Supabase Storage & Store Public URL)
  const handleFileUpload = async (file: globalThis.File) => {
    setIsUploading(true);
    const sanitizeFileName = (name: string): string => {
      const dotIndex = name.lastIndexOf('.');
      const ext = dotIndex !== -1 ? name.substring(dotIndex) : '';
      const base = dotIndex !== -1 ? name.substring(0, dotIndex) : name;
      const cleanBase = base
        .replace(/[^a-zA-Z0-9-_]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '');
      const cleanExt = ext.replace(/[^a-zA-Z0-9.]/g, '');
      return (cleanBase || 'file') + cleanExt;
    };

    const cleanName = sanitizeFileName(file.name);
    const storagePath = `vault/${Date.now()}_${cleanName}`;

    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // 1. Upload file directly to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('lodge-media')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      // 2. Retrieve public URL
      const { data: { publicUrl } } = supabase.storage
        .from('lodge-media')
        .getPublicUrl(storagePath);

      if (!publicUrl) {
        throw new Error('Could not retrieve public URL for uploaded file.');
      }

      const newFile: VaultFile = {
        id: 'file-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11),
        name: customFileName.trim() ? `${customFileName.trim()}.${file.name.split('.').pop()}` : file.name,
        category: customFileCategory,
        url: publicUrl,
        fileType: file.type || 'application/octet-stream',
        size: file.size,
        uploadedBy: t('default_uploader'),
        uploadedAt: new Date().toISOString(),
        notes: customFileNotes.trim() || t('default_note')
      };

      const updatedFiles = [newFile, ...files];
      setFiles(updatedFiles);

      // 3. Write record to Supabase system_settings under key 'vault_files'
      try {
        const { error: dbErr } = await supabase
          .from('system_settings')
          .upsert({ key: 'vault_files', value: { files: updatedFiles } });
        if (dbErr) throw dbErr;
        setSyncStatus('synced');
      } catch (dbErr) {
        console.error('Failed to update vault files on Supabase:', dbErr);
        setSyncStatus('local');
      }

      // Reset inputs
      setCustomFileName('');
      setCustomFileNotes('');
      showStatusNotice('success', t('success_upload'));
    } catch (err: any) {
      console.error('Upload Process Error:', err);
      showStatusNotice('error', `${t('error_upload')}: ${err.message || err}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Delete Vault File
  const handleDeleteFile = async (id: string) => {
    try {
      const fileToDelete = files.find(f => f.id === id);
      const updatedFiles = files.filter(f => f.id !== id);
      setFiles(updatedFiles);

      if (supabase) {
        try {
          // 1. Delete DB record by saving updated list
          await supabase
            .from('system_settings')
            .upsert({ key: 'vault_files', value: { files: updatedFiles } });

          // 2. Also delete from Supabase storage if applicable
          if (fileToDelete && fileToDelete.url) {
            const match = fileToDelete.url.match(/\/lodge-media\/(.+)$/);
            if (match && match[1]) {
              await supabase.storage.from('lodge-media').remove([decodeURIComponent(match[1])]);
            }
          }
          setSyncStatus('synced');
        } catch (dbErr) {
          console.error('Failed database delete:', dbErr);
          setSyncStatus('local');
        }
      }

      setConfirmDeleteId(null);
      setPreviewFile(null);
      showStatusNotice('success', t('deleted_successfully'));
    } catch (err) {
      console.error('Delete error:', err);
      showStatusNotice('error', t('delete_error'));
    }
  };

  // Trigger Local File Download
  const triggerDownload = (file: VaultFile) => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter & Search Logic
  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (file.notes && file.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          file.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || file.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="bg-[#991B1B] border-2 border-[#F4C22B] rounded-2xl min-h-[600px] shadow-2xl overflow-hidden font-sans text-white">
      
      {/* Vault Header Bar */}
      <div className="bg-[#8C1414] border-b-2 border-[#F4C22B] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F4C22B] flex items-center justify-center border border-white/60 shrink-0">
            <Folder className="w-5 h-5 text-[#1C1917]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-[#1C1917] font-mono font-black tracking-widest uppercase bg-[#F4C22B] px-2 py-0.5 rounded">
                {t('secure_cloud_storage')}
              </span>
              {syncStatus === 'synced' ? (
                <span className="flex items-center gap-1 text-[9px] text-[#A7F3D0] font-mono font-bold">
                  <CheckCircle className="w-2.5 h-2.5" /> {t('cloud_synced')}
                </span>
              ) : syncStatus === 'syncing' ? (
                <span className="flex items-center gap-1 text-[9px] text-[#F4C22B] font-mono font-bold animate-pulse">
                  <RefreshCw className="w-2.5 h-2.5 animate-spin" /> {t('syncing')}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[9px] text-[#FEF3C7] font-mono font-bold">
                  <AlertCircle className="w-2.5 h-2.5" /> {t('local_storage')}
                </span>
              )}
            </div>
            <h2 className="text-base font-black text-white mt-0.5 uppercase tracking-wide">
              {t('vault_title')}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSyncDatabase}
            className="px-3.5 py-1.5 bg-[#7A1212] hover:bg-[#F4C22B] text-white hover:text-[#1C1917] text-xs font-mono font-bold rounded-lg border border-[#F4C22B]/50 transition-all flex items-center gap-1.5 cursor-pointer"
            title={t('cloud_sync_btn')}
          >
            <Cloud className="w-3.5 h-3.5" /> {t('cloud_sync_btn')}
          </button>
          
          {onBack && (
            <button
              onClick={onBack}
              className="px-3.5 py-1.5 bg-[#F4C22B] hover:bg-white text-[#1C1917] text-xs font-black rounded-lg border border-[#CF9D12] transition-all flex items-center cursor-pointer"
            >
              {t('back_btn')}
            </button>
          )}
        </div>
      </div>

      {statusNotice && (
        <div
          className={`mx-5 mt-4 px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 ${
            statusNotice.type === 'success'
              ? 'bg-emerald-950/75 border-emerald-400/50 text-emerald-100'
              : 'bg-red-950/80 border-white/40 text-white'
          }`}
        >
          <span>{statusNotice.text}</span>
          <button
            type="button"
            onClick={() => setStatusNotice(null)}
            className="text-xs opacity-75 hover:opacity-100 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Storage Bar & Counters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-[#8C1414]/60 border-b border-[#F4C22B]/30">
        <div className="bg-[#7A1212] border border-[#F4C22B]/35 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-[#FDE68A] font-mono uppercase font-bold tracking-wider">{t('total_files')}</p>
            <p className="text-xl font-black text-white mt-0.5">{files.length} <span className="text-xs text-[#FEF3C7] font-medium">{t('files_unit')}</span></p>
          </div>
          <Layers className="w-8 h-8 text-[#F4C22B]/50" />
        </div>

        <div className="bg-[#7A1212] border border-[#F4C22B]/35 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-[#FDE68A] font-mono uppercase font-bold tracking-wider">{t('storage_used')}</p>
            <p className="text-xl font-black text-[#F4C22B] mt-0.5">{formatBytes(storageUsed)}</p>
          </div>
          <Sparkles className="w-8 h-8 text-[#F4C22B]/40" />
        </div>

        <div className="col-span-1 md:col-span-2 bg-[#7A1212] border border-[#F4C22B]/35 rounded-xl p-3.5 space-y-2">
          <div className="flex justify-between items-center text-[10px] font-mono text-[#FEF3C7] font-bold">
            <span className="uppercase">{t('storage_meter')} ({formatBytes(storageLimit)} {t('max_buffer')})</span>
            <span className="font-black text-[#F4C22B]">{((storageUsed / storageLimit) * 100).toFixed(1)}% {t('full_label')}</span>
          </div>
          <div className="w-full bg-[#5C0A0A] h-2.5 rounded-full overflow-hidden border border-[#F4C22B]/40">
            <div 
              className="bg-gradient-to-r from-[#F4C22B] to-[#FEF3C7] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (storageUsed / storageLimit) * 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-5">
        
        {/* LEFT COMPONENT: Upload Widget & Custom Metadata Form */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* STORAGE UPGRADER CONTROL */}
          <div className="bg-[#7A1212] border border-[#F4C22B]/40 rounded-xl p-4.5 space-y-4 shadow-xl">
            <h3 className="text-xs font-black uppercase text-[#F4C22B] tracking-wider border-b border-[#F4C22B]/30 pb-2 flex items-center gap-1.5">
              {t('storage_upgrader')}
            </h3>
            <p className="text-[10px] text-[#FEF3C7] font-sans">
              {t('storage_upgrader_desc')}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: 'Starter', label: '50 MB', value: 50 * 1024 * 1024, desc: t('starter_desc') },
                { name: 'Pro', label: '10 GB', value: 10 * 1024 * 1024 * 1024, desc: t('pro_desc') },
                { name: 'Enterprise', label: '500 GB', value: 500 * 1024 * 1024 * 1024, desc: t('enterprise_desc') },
                { name: 'Unlimited', label: t('unlimited'), value: 999999 * 1024 * 1024 * 1024, desc: t('unlimited_desc') }
              ].map((tier) => (
                <button
                  key={tier.name}
                  onClick={() => {
                    setStorageLimit(tier.value);
                    if (supabase) {
                      supabase
                        .from('system_settings')
                        .upsert({ key: 'storage_limit', value: { limit: tier.value } })
                        .then(({ error }) => {
                          if (error) console.error('Failed to sync storage limit:', error);
                        });
                    }
                    if ('speechSynthesis' in window) {
                      const msg = new SpeechSynthesisUtterance();
                      msg.text = t('tts_upgrade_success').replace('{label}', tier.label);
                      msg.lang = dateLocale;
                      window.speechSynthesis.speak(msg);
                    }
                    showStatusNotice('success', t('alert_upgrade_success').replace('{label}', tier.label).replace('{desc}', tier.desc));
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all duration-300 cursor-pointer ${
                    storageLimit === tier.value 
                      ? 'border-white bg-[#F4C22B] text-[#1C1917] shadow-md' 
                      : 'border-[#F4C22B]/30 bg-[#8C1414] hover:bg-[#B21F1F] text-white hover:border-[#F4C22B]'
                  }`}
                >
                  <div className={`text-[10px] font-mono uppercase tracking-widest font-bold ${storageLimit === tier.value ? 'text-[#7A1212]' : 'text-[#FDE68A]'}`}>{tier.name}</div>
                  <div className="text-sm font-black mt-0.5">{tier.label}</div>
                  <div className={`text-[9px] mt-1 ${storageLimit === tier.value ? 'text-[#1C1917]/80' : 'text-[#FEF3C7]/85'}`}>{tier.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#7A1212] border border-[#F4C22B]/40 rounded-xl p-4.5 space-y-4">
            <h3 className="text-xs font-black uppercase text-[#F4C22B] tracking-wider border-b border-[#F4C22B]/30 pb-2 flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> {t('add_new_file')}
            </h3>

            {/* Drag and Drop Box */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[140px] ${
                dragActive 
                  ? 'border-white bg-[#B21F1F] text-white' 
                  : 'border-[#F4C22B]/50 hover:border-[#F4C22B] bg-[#8C1414] hover:bg-[#B21F1F] text-[#FEF3C7]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
              />
              <div className="p-3 bg-[#F4C22B] rounded-full mb-2">
                <Upload className="w-5 h-5 text-[#1C1917]" />
              </div>
              <p className="text-xs font-black text-center text-white">
                {t('drag_drop_text')}
              </p>
              <p className="text-[10px] text-[#FDE68A] mt-1">
                {t('drag_drop_sub')}
              </p>
            </div>

            {/* Custom Metadata Details Form */}
            <div className="space-y-3.5 bg-[#8C1414] p-3.5 rounded-lg border border-[#F4C22B]/30">
              <p className="text-[10px] text-[#F4C22B] font-mono tracking-wider font-black block uppercase">
                {t('optional_metadata')}
              </p>

              <div>
                <label className="text-[10px] text-[#FEF3C7] font-mono uppercase font-bold block mb-1">
                  {t('custom_display_name')}
                </label>
                <input
                  type="text"
                  value={customFileName}
                  onChange={(e) => setCustomFileName(e.target.value)}
                  placeholder={t('custom_display_name_placeholder')}
                  className="w-full bg-white border-2 border-[#F4C22B] rounded px-2.5 py-1.5 text-xs font-bold text-[#1C1917] placeholder-stone-500 focus:border-white outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#FEF3C7] font-mono uppercase font-bold block mb-1">
                  {t('file_category')}
                </label>
                <select
                  value={customFileCategory}
                  onChange={(e) => setCustomFileCategory(e.target.value as any)}
                  className="w-full bg-white border-2 border-[#F4C22B] rounded px-2 py-1.5 text-xs font-bold text-[#1C1917] focus:border-white outline-none"
                >
                  <option value="document">{t('cat_document')}</option>
                  <option value="receipt">{t('cat_receipt')}</option>
                  <option value="staff">{t('cat_staff')}</option>
                  <option value="media">{t('cat_media')}</option>
                  <option value="confidential">{t('cat_confidential')}</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-[#FEF3C7] font-mono uppercase font-bold block mb-1">
                  {t('file_notes')}
                </label>
                <textarea
                  value={customFileNotes}
                  onChange={(e) => setCustomFileNotes(e.target.value)}
                  placeholder={t('file_notes_placeholder')}
                  rows={2}
                  className="w-full bg-white border-2 border-[#F4C22B] rounded px-2.5 py-1.5 text-xs font-bold text-[#1C1917] placeholder-stone-500 focus:border-white outline-none resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COMPONENT: Filter Controls, File Grid & Interactive Listing */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Controls Bar */}
          <div className="bg-[#7A1212] border border-[#F4C22B]/40 p-3 rounded-xl flex flex-col md:flex-row items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-stone-500">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search_placeholder')}
                className="w-full bg-white border-2 border-[#F4C22B] rounded-lg pl-9 pr-3 py-1.5 text-xs font-bold text-[#1C1917] placeholder-stone-500 focus:border-white outline-none font-sans"
              />
            </div>

            {/* Category Toggle Row */}
            <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto py-1 shrink-0">
              {[
                { id: 'all', label: t('cat_all') },
                { id: 'document', label: t('cat_document') },
                { id: 'receipt', label: t('cat_receipt') },
                { id: 'staff', label: t('cat_staff') },
                { id: 'media', label: t('cat_media') },
                { id: 'confidential', label: t('cat_confidential') }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-md border shrink-0 transition-colors cursor-pointer ${
                    selectedCategory === cat.id 
                      ? 'bg-[#F4C22B] text-[#1C1917] border-white font-black'
                      : 'bg-[#8C1414] hover:bg-[#B21F1F] border-[#F4C22B]/35 text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Layout Toggle */}
            <div className="flex border border-[#F4C22B]/40 rounded-lg overflow-hidden shrink-0 bg-[#8C1414]">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-[#F4C22B] text-[#1C1917]' : 'hover:bg-[#B21F1F] text-[#FEF3C7]'}`}
                title="Grid Preview"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-[#F4C22B] text-[#1C1917]' : 'hover:bg-[#B21F1F] text-[#FEF3C7]'}`}
                title="List Preview"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Files Stage */}
          {loading ? (
            <div className="border border-[#F4C22B]/40 rounded-xl p-16 text-center space-y-3 bg-[#7A1212]">
              <div className="w-8 h-8 border-2 border-[#F4C22B] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-[#FEF3C7] font-mono uppercase tracking-widest animate-pulse">{t('loading_files')}</p>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="border-2 border-dashed border-[#F4C22B]/40 rounded-xl p-16 text-center space-y-4 bg-[#7A1212]">
              <span className="text-3xl block">📁</span>
              <div>
                <p className="text-sm font-bold text-white">{t('no_files_found')}</p>
                <p className="text-xs text-[#FEF3C7] mt-1 max-w-sm mx-auto">
                  {t('no_files_found_desc')}
                </p>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredFiles.map(file => (
                  <motion.div
                    key={file.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-[#7A1212] border-2 border-[#F4C22B]/40 rounded-xl p-4 flex flex-col justify-between hover:border-[#F4C22B] transition-all group overflow-hidden relative"
                  >
                    {/* Tiny category left edge accent */}
                    <div className={`absolute top-0 bottom-0 left-0 w-1 transition-all ${
                      file.category === 'confidential' ? 'bg-rose-300 animate-pulse' :
                      file.category === 'receipt' ? 'bg-emerald-300' :
                      file.category === 'staff' ? 'bg-purple-300' :
                      file.category === 'media' ? 'bg-[#F4C22B]' : 'bg-sky-300'
                    }`} />

                    <div>
                      {/* File Icon & Category Info */}
                      <div className="flex items-center justify-between mb-3 pl-1">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-[#8C1414] rounded-lg border border-[#F4C22B]/35">
                            {getFileIcon(file.category, file.fileType)}
                          </div>
                          <div>
                            <span className="text-[10px] font-mono text-[#FDE68A] uppercase block font-bold">
                              {file.fileType.split('/')[1] || 'FILE'} • {formatBytes(file.size)}
                            </span>
                          </div>
                        </div>

                        <span className={`text-[8.5px] font-mono tracking-widest font-black uppercase px-2 py-0.5 rounded border ${
                          file.category === 'confidential' ? 'bg-white text-[#991B1B] border-white' :
                          file.category === 'receipt' ? 'bg-[#065F46] text-white border-[#6EE7B7]' :
                          file.category === 'staff' ? 'bg-[#4C1D95] text-white border-[#C4B5FD]' :
                          file.category === 'media' ? 'bg-[#F4C22B] text-[#1C1917] border-white' :
                          'bg-[#1E3A8A] text-white border-[#93C5FD]'
                        }`}>
                          {t(`cat_${file.category}` as any)}
                        </span>
                      </div>

                      {/* File Name & Remarks */}
                      <div className="space-y-1.5 pl-1">
                        <h4 className="text-xs font-black text-white hover:text-[#F4C22B] transition-colors truncate" title={file.name}>
                          {file.name}
                        </h4>
                        <p className="text-[10.5px] text-[#FEF3C7] line-clamp-2 leading-relaxed italic">
                          "{file.notes || t('no_remarks')}"
                        </p>
                      </div>
                    </div>

                    {/* Metadata summary & action panel */}
                    <div className="border-t border-[#F4C22B]/25 pt-3 mt-4 flex items-center justify-between gap-2">
                      <div className="text-[9.5px] text-[#FDE68A] font-mono">
                        <span className="block truncate max-w-[120px] text-white font-bold">👤 {file.uploadedBy}</span>
                        <span className="block mt-0.5 text-[#FEF3C7]">{new Date(file.uploadedAt).toLocaleDateString(dateLocale, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {file.url.startsWith('data:') || file.url.startsWith('http') ? (
                          <button
                            type="button"
                            onClick={() => setPreviewFile(file)}
                            className="p-1.5 bg-[#8C1414] hover:bg-white text-white hover:text-[#1C1917] rounded border border-[#F4C22B]/40 transition-all cursor-pointer"
                            title={t('preview_label')}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => triggerDownload(file)}
                          className="p-1.5 bg-[#F4C22B] hover:bg-white text-[#1C1917] rounded border border-[#CF9D12] transition-all cursor-pointer"
                          title={t('download_file')}
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        {confirmDeleteId === file.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDeleteFile(file.id)}
                              className="px-2 py-1 bg-red-600 text-white rounded text-[9px] font-black cursor-pointer"
                            >
                              {t('confirm_yes')}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-1.5 py-1 bg-[#5C0A0A] text-white rounded text-[9px] font-bold cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(file.id)}
                            className="p-1.5 bg-[#5C0A0A] hover:bg-white text-white hover:text-[#991B1B] rounded border border-white/30 transition-all cursor-pointer"
                            title={t('delete_file')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            /* LIST VIEW */
            <div className="bg-[#7A1212] border-2 border-[#F4C22B]/40 rounded-xl overflow-hidden divide-y divide-[#F4C22B]/20">
              <div className="grid grid-cols-12 p-3 bg-[#8C1414] text-[9px] font-mono text-[#F4C22B] uppercase tracking-widest font-black">
                <div className="col-span-5 md:col-span-6">{t('table_col_name')}</div>
                <div className="col-span-3 md:col-span-2">{t('table_col_cat')}</div>
                <div className="col-span-2">{t('table_col_size')}</div>
                <div className="col-span-2 text-right">{t('table_col_actions')}</div>
              </div>

              <AnimatePresence mode="popLayout">
                {filteredFiles.map(file => (
                  <motion.div
                    key={file.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-12 p-3.5 items-center hover:bg-[#8C1414]/60 transition-colors"
                  >
                    {/* Col 1 */}
                    <div className="col-span-5 md:col-span-6 flex items-center gap-3 min-w-0 pr-2">
                      <div className="shrink-0 p-1.5 bg-[#8C1414] rounded border border-[#F4C22B]/35">{getFileIcon(file.category, file.fileType)}</div>
                      <div className="min-w-0">
                        <h5 className="text-xs font-black text-white truncate" title={file.name}>{file.name}</h5>
                        <p className="text-[10px] text-[#FEF3C7] truncate mt-0.5">{file.notes || t('no_remarks')}</p>
                      </div>
                    </div>

                    {/* Col 2 */}
                    <div className="col-span-3 md:col-span-2 shrink-0">
                      <span className={`text-[8.5px] font-mono font-black uppercase px-2 py-0.5 rounded border ${
                        file.category === 'confidential' ? 'bg-white text-[#991B1B] border-white' :
                        file.category === 'receipt' ? 'bg-[#065F46] text-white border-[#6EE7B7]' :
                        file.category === 'staff' ? 'bg-[#4C1D95] text-white border-[#C4B5FD]' :
                        file.category === 'media' ? 'bg-[#F4C22B] text-[#1C1917] border-white' :
                        'bg-[#1E3A8A] text-white border-[#93C5FD]'
                      }`}>
                        {t(`cat_${file.category}` as any)}
                      </span>
                    </div>

                    {/* Col 3 */}
                    <div className="col-span-2 text-xs font-mono text-[#FDE68A] font-bold">{formatBytes(file.size)}</div>

                    {/* Col 4 */}
                    <div className="col-span-2 flex items-center justify-end gap-1.5 shrink-0">
                      <button
                        onClick={() => triggerDownload(file)}
                        className="p-1 px-2.5 bg-[#F4C22B] hover:bg-white text-[#1C1917] font-black rounded text-[10px] font-mono border border-[#CF9D12] transition-colors cursor-pointer"
                      >
                        {t('download_short')}
                      </button>
                      {confirmDeleteId === file.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDeleteFile(file.id)}
                            className="px-2 py-1 bg-red-600 text-white rounded text-[9px] font-black cursor-pointer"
                          >
                            {t('confirm_yes')}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-1.5 py-1 bg-[#5C0A0A] text-white rounded text-[9px] font-bold cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(file.id)}
                          className="p-1.5 bg-[#5C0A0A] hover:bg-white text-white hover:text-[#991B1B] rounded border border-white/30 transition-all cursor-pointer"
                          title={t('delete_file')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* File Interactive Preview Modal */}
      <AnimatePresence>
        {previewFile && (
          <div className="fixed inset-0 bg-[#5C0A0A]/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#991B1B] border-2 border-[#F4C22B] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="p-4 border-b border-[#F4C22B]/35 bg-[#8C1414] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getFileIcon(previewFile.category, previewFile.fileType)}
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider truncate max-w-sm sm:max-w-md">{previewFile.name}</h4>
                    <p className="text-[10px] text-[#FDE68A] font-mono mt-0.5">{previewFile.fileType} • {formatBytes(previewFile.size)}</p>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="w-7 h-7 rounded-full bg-[#F4C22B] hover:bg-white text-[#1C1917] border border-white transition-colors flex items-center justify-center font-black text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Dynamic Preview Canvas */}
              <div className="p-6 bg-[#7A1212] flex-1 overflow-y-auto flex items-center justify-center min-h-[300px]">
                {previewFile.fileType.startsWith('image/') ? (
                  <img
                    src={previewFile.url}
                    alt={previewFile.name}
                    className="max-h-[380px] max-w-full rounded-lg object-contain border-2 border-[#F4C22B]/60"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="text-center p-8 border-2 border-[#F4C22B]/40 rounded-xl bg-[#8C1414] max-w-md">
                    <span className="text-4xl block mb-3">📄</span>
                    <h5 className="text-xs font-bold text-white mb-2">{t('preview_not_available')}</h5>
                    <p className="text-[11px] text-[#FEF3C7] mb-4 leading-normal">
                      {t('preview_not_available_desc')}
                    </p>
                    <button
                      onClick={() => triggerDownload(previewFile)}
                      className="px-4 py-2 bg-[#F4C22B] text-[#1C1917] font-sans font-black text-xs uppercase rounded-lg flex items-center gap-2 mx-auto justify-center hover:bg-white transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> {t('download_btn')}
                    </button>
                  </div>
                )}
              </div>

              {/* Remarks and metadata block */}
              <div className="p-4 border-t border-[#F4C22B]/35 bg-[#8C1414] space-y-2">
                <span className="text-[9px] text-[#F4C22B] font-mono tracking-widest uppercase font-black block">{t('remarks_metadata')}</span>
                <p className="text-xs text-white italic leading-relaxed">
                  "{previewFile.notes || t('no_remarks')}"
                </p>
                <div className="flex justify-between items-center text-[10px] font-mono text-[#FDE68A] border-t border-[#F4C22B]/25 pt-2 mt-2">
                  <span>{t('uploaded_by')}: <strong className="text-white">{previewFile.uploadedBy}</strong></span>
                  <span>{t('uploaded_at')}: <strong className="text-white">{new Date(previewFile.uploadedAt).toLocaleString(dateLocale)}</strong></span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
