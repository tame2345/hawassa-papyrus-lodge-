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
  appLang?: 'am' | 'en' | 'or' | 'ti' | 'fr' | 'de' | 'it';
}

const vaultTranslations = {
  secure_cloud_storage: {
    am: 'ደህንነቱ የተጠበቀ የክላውድ ማከማቻ',
    en: 'SECURE CLOUD STORAGE',
    or: 'KUUSAA KLAUWDII MIREESSAA',
    ti: 'ውሑስ ናይ ክላውድ መኽዘን',
    fr: 'STOCKAGE CLOUD SÉCURISÉ',
    de: 'GESICHERTER CLOUD-SPEICHER',
    it: 'ARCHIVIO CLOUD SICURO'
  },
  cloud_synced: {
    am: 'ከክላውድ ጋር ተመሳስሏል',
    en: 'CLOUD SYNCED',
    or: 'KLAUWDII WALLIN MIREESSAME',
    ti: 'ምስ ክላውድ ተመሳሲሉ',
    fr: 'SYNCHRONISÉ CLOUD',
    de: 'MIT CLOUD SYNCHRONISIERT',
    it: 'SINCRONIZZATO CON IL CLOUD'
  },
  syncing: {
    am: 'በማመሳሰል ላይ...',
    en: 'SYNCING...',
    or: 'AL-MIREESSAA JIRA...',
    ti: 'ምስንኻል...',
    fr: 'SYNCHRONISATION...',
    de: 'SYNCHRONISIERUNG...',
    it: 'SINCRONIZZAZIONE IN CORSO...'
  },
  local_storage: {
    am: 'አካባቢያዊ ማከማቻ',
    en: 'LOCAL STORAGE',
    or: 'KUUSAA KOOMPIYUTARAA',
    ti: 'ከባቢያዊ መኽዘን',
    fr: 'STOCKAGE LOCAL',
    de: 'LOKALER SPEICHER',
    it: 'ARCHIVIO LOCALE'
  },
  vault_title: {
    am: 'የክላውድ ፋይል ማቆያ እና ሴኪውሪቲ ቮልት (Papyrus Secure Team Vault)',
    en: 'Cloud File Storage & Security Team Vault',
    or: 'Kuusaa Fiilota Klaumdii fi Mooraa Nageenyaa Papyrus',
    ti: 'ናይ ክላውድ ፋይል መኽዘንን ናይ ሴኪውሪቲ ቮልትን (Papyrus Secure)',
    fr: 'Coffre-fort d\'équipe sécurisé Papyrus & Stockage Cloud',
    de: 'Papyrus Team-Sicherheitstresor & Cloud-Dateispeicher',
    it: 'Cassaforte del Team Sicuro Papyrus e Archivio File'
  },
  cloud_sync_btn: {
    am: 'ከክላውድ ጋር አመሳስል',
    en: 'CLOUD SYNC',
    or: 'KLAUWDII WALLIN MIREESSI',
    ti: 'ምስ ክላውድ ኣመሳስል',
    fr: 'SYNC CLOUD',
    de: 'CLOUD-SYNC',
    it: 'SINCRONIZZA CLOUD'
  },
  back_btn: {
    am: '↩ ተመለስ',
    en: '↩ BACK',
    or: '↩ DEEBI\'I',
    ti: '↩ ተመለስ',
    fr: '↩ RETOUR',
    de: '↩ ZURÜCK',
    it: '↩ INDIETRO'
  },
  total_files: {
    am: 'ጠቅላላ ሰነዶች',
    en: 'Total Files',
    or: 'Waliigala Fiilotaa',
    ti: 'ጠቕላላ ፋይላት',
    fr: 'Total des fichiers',
    de: 'Gesamte Dateien',
    it: 'File Totali'
  },
  storage_used: {
    am: 'የተያዘው የፋይል መጠን',
    en: 'Storage Used',
    or: 'Kuusaa Hojjetame',
    ti: 'ዝተታሕዘ መኽዘን መጠን',
    fr: 'Espace utilisé',
    de: 'Genutzter Speicher',
    it: 'Spazio Utilizzato'
  },
  storage_meter: {
    am: 'የማከማቻ ሜትር',
    en: 'STORAGE METER',
    or: 'MILIYAROOTA KUUSAA',
    ti: 'ናይ መኽዘን መጠን መለክዒ',
    fr: 'JAUGÉ DE STOCKAGE',
    de: 'SPEICHERANZEIGE',
    it: 'INDICATORE DI SPAZIO'
  },
  max_buffer: {
    am: 'ከፍተኛው ገደብ',
    en: 'Max Buffer',
    or: 'Hanga Ol-Aanaa',
    ti: 'ዝለዓለ ደረት',
    fr: 'Limite Max',
    de: 'Max. Grenze',
    it: 'Limite Massimo'
  },
  storage_upgrader: {
    am: '🚀 የማከማቻ መጠን ማሳደጊያ',
    en: '🚀 Storage Capacity Upgrader',
    or: '🚀 Hanga Kuusaa Guddisuuf',
    ti: '🚀 ናይ መኽዘን መጠን መዕበዪ',
    fr: '🚀 Augmentation d\'espace de stockage',
    de: '🚀 Speicherplatz-Erweiterung',
    it: '🚀 Upgrade dello Spazio Cloud'
  },
  storage_upgrader_desc: {
    am: 'የክላውድ ፋይል ማቆያዎ የተመደበለትን የመያዝ አቅም እዚህ በመጫን ወዲያውኑ ማሳደግ ይችላሉ።',
    en: 'Instantly upgrade the allocation limits of your secure cloud team vault in one click.',
    or: 'Dandeettii kuusaa klaumdii keessanii as tuquun battalumatti ol guddisuu dandeessu.',
    ti: 'ናይ ክላውድ ፋይል መኽዘንኩም ዝተመደበሉ ናይ ምሓዝ ዓቕሚ ኣብዚ ብምጽቃጥ ብቕጽበት ከተዕብይዎ ትኽእሉ ኢኹም።',
    fr: 'Augmentez instantanément les limites d\'allocation de votre coffre-fort cloud en un seul clic.',
    de: 'Erweitern Sie die Zuweisungslimits Ihres sicheren Team-Tresors sofort mit einem Klick.',
    it: 'Aumenta istantaneamente i limiti del tuo archivio cloud sicuro con un clic.'
  },
  starter_desc: {
    am: 'ነጻ ጥቅል',
    en: 'Free Starter Pack',
    or: 'Paኬጅ Bilisaa',
    ti: 'ናጻ ፓኬጅ',
    fr: 'Pack Gratuit',
    de: 'Kostenloses Starter-Paket',
    it: 'Pacchetto Gratuito'
  },
  pro_desc: {
    am: 'ፈጣን የቡድን ስራ',
    en: 'Fast Team Collaboration',
    or: 'Hojii Garee Saffisaa',
    ti: 'ቅልጡፍ ናይ ጋንታ ስራሕ',
    fr: 'Collaboration d\'équipe',
    de: 'Schnelle Teamarbeit',
    it: 'Collaborazione Veloce'
  },
  enterprise_desc: {
    am: 'ሙሉ ፋይሎች ማስቀመጫ',
    en: 'Enterprise Core Archive',
    or: 'Kuusaa Dhaabbataa Guutuu',
    ti: 'ናይ ምሉእ ፋይላት መኽዘን',
    fr: 'Archive d\'entreprise',
    de: 'Unternehmens-Vollarchiv',
    it: 'Archivio Aziendale'
  },
  unlimited_desc: {
    am: 'ስማርት ክላውድ',
    en: 'Infinite Smart Cloud',
    or: 'Klaumdii Daangaa Hin Qابኔ',
    ti: 'ስማርት ክላውድ',
    fr: 'Cloud Intelligent Illimité',
    de: 'Unbegrenzte Smart-Cloud',
    it: 'Cloud Smart Illimitato'
  },
  alert_upgrade_success: {
    am: '🎉 የማከማቻ መጠንዎ ወደ {label} በስኬት አድጓል! ({desc})',
    en: '🎉 Your storage limit successfully upgraded to {label}! ({desc})',
    or: '🎉 Hangi kuusaa keessanii milkiin gara {label} tti guddateera! ({desc})',
    ti: '🎉 ናይ መኽዘን መጠንኩም ናብ {label} ብዓወት ተወሲኹ ኣሎ! ({desc})',
    fr: '🎉 Votre espace a été augmenté à {label} avec succès ! ({desc})',
    de: '🎉 Ihr Speicherlimit wurde erfolgreich auf {label} erweitert! ({desc})',
    it: '🎉 Spazio cloud aggiornato con successo a {label}! ({desc})'
  },
  tts_upgrade_success: {
    am: 'የማከማቻ መጠንዎ ወደ {label} በተሳካ ሁኔታ አድጓል!',
    en: 'Your storage capacity has been upgraded to {label}!',
    or: 'Hangi kuusaa keessanii gara {label} tti ol guddateera!',
    ti: 'ናይ መኽዘን መጠንኩም ናብ {label} ብዓወት ተወሲኹ ኣሎ!',
    fr: 'Votre espace a été augmenté à {label} !',
    de: 'Ihr Speicherplatz wurde auf {label} erweitert!',
    it: 'Spazio cloud aggiornato a {label}!'
  },
  add_new_file: {
    am: 'አዲስ ፋይል መጫኛ',
    en: 'Upload & Add Files',
    or: 'Fiilii Haaraa Ol-Fe\'uuf',
    ti: 'ሓዱሽ ፋይል መዕነዪ',
    fr: 'Téléverser de nouveaux fichiers',
    de: 'Neue Dateien hochladen',
    it: 'Carica e Aggiungi File'
  },
  drag_drop_text: {
    am: 'ይጫኑ ወይም ፋይል እዚህ ይጎትቱ',
    en: 'Click or Drag File here',
    or: 'As tuqaa ykn Fiilii asitti gadi dhiisaa',
    ti: 'ኣብዚ ጸቕጡ ወይ ፋይል ጉተቱ',
    fr: 'Cliquez ou glissez un fichier ici',
    de: 'Klicken oder Datei hierher ziehen',
    it: 'Clicca o trascina il file qui'
  },
  drag_drop_sub: {
    am: 'PDF፣ ZIP፣ ምስሎች እና የጽሑፍ ፋይሎችን እስከ 10MB ይደግፋል',
    en: 'Supports PDF, ZIP, IMAGES & TXT up to 10MB',
    or: 'PDF, ZIP, Fakkotaa fi TXT hanga 10MB gargaara',
    ti: 'PDF, ZIP, ስእልታትን ጽሑፍን ክሳብ 10MB ይድግፍ',
    fr: 'Prend en charge PDF, ZIP, IMAGES & TXT jusqu\'à 10 Mo',
    de: 'Unterstützt PDF, ZIP, BILDER & TXT bis zu 10 MB',
    it: 'Supporta PDF, ZIP, IMMAGINI e TXT fino a 10MB'
  },
  optional_metadata: {
    am: '⚙️ አማራጭ መረጃዎች (ከመጫንዎ በፊት ያስተካክሉ)',
    en: '⚙️ OPTIONAL METADATA (Edit before upload)',
    or: '⚙️ METADATA FILANNOO (Ol-fe\'uun dura sirreessaa)',
    ti: '⚙️ መማረጺ ሓበሬታታት (ቅድሚ ምዕናይኩም ኣስተኻኽሉ)',
    fr: '⚙️ MÉTADONNÉES OPTIONNELLES (Modifier avant envoi)',
    de: '⚙️ OPTIONALE METADATEN (Vor dem Upload anpassen)',
    it: '⚙️ METADATI OPZIONALI (Modifica prima del caricamento)'
  },
  custom_display_name: {
    am: 'ልዩ መለያ ስም',
    en: 'Custom File Display Name',
    or: 'Maqaa Muldhisa Fiilii Addaa',
    ti: 'ፍሉይ መለለዪ ስም',
    fr: 'Nom d\'affichage personnalisé',
    de: 'Benutzerdefinierter Anzeigename',
    it: 'Nome Visualizzato del File'
  },
  custom_display_name_placeholder: {
    am: 'ለምሳሌ፡ የሊዝ ስምምነት ውል',
    en: 'e.g. Lease Agreement Contract',
    or: 'fkn. Waliigaltee Liizii',
    ti: 'ንኣብነት፡ ናይ ኪራይ ስምምዕነት ውዕል',
    fr: 'ex. Contrat de bail',
    de: 'z. B. Mietvertrag-Dokument',
    it: 'es. Contratto di Locazione'
  },
  file_category: {
    am: 'የሰነዱ ምድብ',
    en: 'File Category',
    or: 'Ramaddii Fiilii',
    ti: 'ዓይነት ምድብ ሰነድ',
    fr: 'Catégorie de fichier',
    de: 'Dateikategorie',
    it: 'Categoria File'
  },
  cat_all: {
    am: 'ሁሉም',
    en: 'ALL',
    or: 'HUNDA',
    ti: 'ኹሉም',
    fr: 'TOUS',
    de: 'ALLE',
    it: 'TUTTI'
  },
  cat_document: {
    am: '📄 ሰነዶች',
    en: '📄 Documents',
    or: '📄 Sanadoota',
    ti: '📄 ሰነዳት',
    fr: '📄 Documents',
    de: '📄 Dokumente',
    it: '📄 Documenti'
  },
  cat_receipt: {
    am: '💳 የወጪ/የሽያጭ ደረሰኞች',
    en: '💳 Receipts & Invoices',
    or: '💳 Nagahee Kafaltii',
    ti: '💳 ናይ ወጻኢ/መሸጢ ደረሰኛታት',
    fr: '💳 Factures et Reçus',
    de: '💳 Quittungen & Rechnungen',
    it: '💳 Ricevute e Fatture'
  },
  cat_staff: {
    am: '👤 የሰራተኞች ፋይል',
    en: '👤 Staff Dossiers',
    or: '👤 Fiilota Hojjettootaa',
    ti: '👤 ፋይል ሰራሕተኛታት',
    fr: '👤 Dossiers Employés',
    de: '👤 Mitarbeiterakten',
    it: '👤 Fascicoli Personale'
  },
  cat_media: {
    am: '🖼️ የፎቶ እና ሚዲያ ፋይል',
    en: '🖼️ Photo & Media Files',
    or: '🖼️ Fiilota Miidiyaa fi Suuraa',
    ti: '🖼️ ስእልታትን ሚድያን',
    fr: '🖼️ Médias et Photos',
    de: '🖼️ Foto- & Mediendateien',
    it: '🖼️ File Foto e Media'
  },
  cat_confidential: {
    am: '🔒 ሚስጥራዊ ሰነዶች',
    en: '🔒 Confidential Files',
    or: '🔒 Sanadoota Iccitii',
    ti: '🔒 ምስጢራዊ ሰነዳት',
    fr: '🔒 Documents Confidentiels',
    de: '🔒 Vertrauliche Dokumente',
    it: '🔒 Documenti Riservati'
  },
  file_notes: {
    am: 'አጭር ማብራሪያ ወይም ማስታወሻ',
    en: 'File Notes & Remarks',
    or: 'Ibsa Gabaabaa ykn Yaadannoo',
    ti: 'ሓጺር መብርሂ ወይ መዘኻኸሪ',
    fr: 'Notes et Remarques',
    de: 'Kurzbeschreibung oder Notiz',
    it: 'Note e Osservazioni'
  },
  file_notes_placeholder: {
    am: 'የሰነዱን ይዘት ወይም ጥቅም እዚህ ይግለጹ...',
    en: 'Describe the purpose or details of this file...',
    or: 'Kaayyoo ykn dhimma fiilii kanaa asitti ibsa...',
    ti: 'ትሕዝቶ ወይ ጥቕሚ እቲ ሰነድ ኣብዚ ግለጹ...',
    fr: 'Décrivez le but ou les détails de ce fichier...',
    de: 'Beschreiben Sie den Zweck dieses Dokuments...',
    it: 'Descrivi lo scopo o i dettagli di questo file...'
  },
  search_placeholder: {
    am: 'ባለቤት፣ ስም ወይም ማብራሪያ ይፈልጉ...',
    en: 'Search by owner, file name or remarks...',
    or: 'Abbaa, maqaa ykn ibsa barbaadi...',
    ti: 'በዓል ቤት፣ ስም ወይ መብርሂ ድለዩ...',
    fr: 'Rechercher par propriétaire, nom ou remarques...',
    de: 'Suche nach Besitzer, Name oder Notizen...',
    it: 'Cerca per proprietario, nome o note...'
  },
  loading_files: {
    am: 'የክላውድ ፋይሎችን በማዘጋጀት ላይ...',
    en: 'Preparing Cloud Files...',
    or: 'Fiilota Klaumdii qopheessaa jira...',
    ti: 'ናይ ክላውድ ፋይላት ኣብ ምድላው ኣሎ...',
    fr: 'Préparation des fichiers cloud...',
    de: 'Bereite Cloud-Dateien vor...',
    it: 'Preparazione dei file cloud...'
  },
  no_files_found: {
    am: 'ምንም ፋይል አልተገኘም',
    en: 'No files found',
    or: 'Fiiliin tokkollee hin argamne',
    ti: 'ዝኾነ ፋይል ኣይተረኽበን',
    fr: 'Aucun fichier trouvé',
    de: 'Keine Dateien gefunden',
    it: 'Nessun file trovato'
  },
  no_files_found_desc: {
    am: 'የደረደሩት ወይም የፈለጉት ፋይል በአማራጮች ውስጥ የለም። አዲስ ፋይል ለመጨመር በግራ በኩል ያለውን ካርድ ይጠቀሙ።',
    en: 'The requested filter query or search term yielded zero results. Try uploading a new file.',
    or: 'Barbaadni keessan bu\'aa hin qabu. Fiilii haaraa ol-fe\'uuf kaardii bitaa fayyadamaa.',
    ti: 'እቲ ዝደለኹምዎ ፋይል የለን። ሓዱሽ ፋይል ንምዕናይ ኣብ ጸጋም ዘሎ ካርድ ተጠቐሙ።',
    fr: 'Le filtre ou le terme recherché n\'a donné aucun résultat. Essayez d\'ajouter un fichier.',
    de: 'Der ausgewählte Filter oder Suchbegriff lieferte keine Ergebnisse. Laden Sie eine neue Datei hoch.',
    it: 'La ricerca non ha prodotto risultati. Prova a caricare un nuovo file.'
  },
  table_col_name: {
    am: 'የሰነድ ስም',
    en: 'FILE NAME & REMARKS',
    or: 'MAQAA FIILII & YAADANNOO',
    ti: 'ስም ሰነድ',
    fr: 'NOM DU FICHIER & NOTES',
    de: 'DATEINAME & NOTIZEN',
    it: 'NOME FILE E NOTE'
  },
  table_col_cat: {
    am: 'ምድብ',
    en: 'CATEGORY',
    or: 'RAMADDII',
    ti: 'ምድብ',
    fr: 'CATÉGORIE',
    de: 'KATEGORIE',
    it: 'CATEGORIA'
  },
  table_col_size: {
    am: 'መጠን',
    en: 'SIZE',
    or: 'HANGA',
    ti: 'መጠን',
    fr: 'TAILLE',
    de: 'GRÖSSE',
    it: 'DIMENSIONE'
  },
  table_col_actions: {
    am: 'ቅንጅቶች',
    en: 'ACTIONS',
    or: 'QINJIYAA',
    ti: 'ቅንጅታት',
    fr: 'ACTIONS',
    de: 'AKTIONEN',
    it: 'AZIONI'
  },
  preview_not_available: {
    am: 'ቅድመ እይታ ለዚህ የፋይል አይነት አይገኝም',
    en: 'Direct Preview Not Available',
    or: 'Dura-ilaaltonni fiilii kanaaf hin jiru',
    ti: 'ናይዚ ዓይነት ፋይል ቅድመ ምርኢት የለን',
    fr: 'Aperçu direct non disponible',
    de: 'Direkte Vorschau nicht verfügbar',
    it: 'Anteprima Diretta non Disponibile'
  },
  preview_not_available_desc: {
    am: 'ይህ ፋይል በቀጥታ በስክሪን ላይ ለመመልከት አይመችም። ሙሉ ለሙሉ ለማንበብ እባክዎን ወደ ኮምፒውተርዎ ወይም ስልክዎ ያውርዱት።',
    en: 'This file cannot be previewed inside the browser. Please download it to view the complete content.',
    or: 'Fiilii kana asitti ilaaluun hin danda\'amu. Ibsa guutuu argachuuf fadheeffadhaa.',
    ti: 'እዚ ፋይል ብቐጥታ ክርአ ኣይክእልን እዩ። ንምሉእ ንባብ በጃኹም ናብ መሳርሒኹም ኣውርድዎ።',
    fr: 'Ce fichier ne peut pas être prévisualisé directement. Veuillez le télécharger pour le consulter.',
    de: 'Diese Datei kann nicht im Browser angezeigt werden. Bitte herunterladen, um den Inhalt zu sehen.',
    it: 'Questo file non può essere visualizzato nel browser. Scaricalo per visualizzarne il contenuto.'
  },
  download_btn: {
    am: 'ሰነዱን አሁን አውርድ',
    en: 'DOWNLOAD FILE NOW',
    or: 'FIILII AMMUMA BUUSI',
    ti: 'ነዚ ሰነድ ሕጂ ኣውርድ',
    fr: 'TÉLÉCHARGER MAINTENANT',
    de: 'DATEI JETZT HERUNTERLADEN',
    it: 'SCARICA IL FILE ORA'
  },
  remarks_metadata: {
    am: 'ማብራሪያ እና ሜታዳታ',
    en: 'REMARKS & METADATA',
    or: 'IBSA FI METADATA',
    ti: 'መብርሂን ሜታዳታን',
    fr: 'REMARQUES & MÉTADONNÉES',
    de: 'NOTIZEN & METADATEN',
    it: 'OSSERVAZIONI E METADATI'
  },
  uploaded_by: {
    am: 'የጫነው ባለሙያ',
    en: 'Uploaded By',
    or: 'Kan Ol-Fe\'e',
    ti: 'ዝዓነኖ ሰብ',
    fr: 'Téléversé par',
    de: 'Hochgeladen von',
    it: 'Caricato Da'
  },
  uploaded_at: {
    am: 'የተጫነበት ቀን',
    en: 'Uploaded At',
    or: 'Guyyaa Ol-Fe\'ame',
    ti: 'ዝተዓነነሉ ዕለት',
    fr: 'Téléversé le',
    de: 'Hochgeladen am',
    it: 'Caricato il'
  },
  no_remarks: {
    am: 'ምንም ማብራሪያ አልተጻፈም',
    en: 'No remarks or notes provided',
    or: 'Yaadannoon hin kennamne',
    ti: 'ዝኾነ መብርሂ ኣይተጻሕፈን',
    fr: 'Aucune remarque fournie',
    de: 'Keine Anmerkungen angegeben',
    it: 'Nessuna osservazione fornita'
  },
  deleted_successfully: {
    am: '🗑️ ፋይሉ በተሳካ ሁኔታ ተሰርዟል!',
    en: '🗑️ File deleted successfully!',
    or: '🗑️ Fiiliin milkiin haqameera!',
    ti: '🗑️ እቲ ፋይል ብዓወት ተሰሪዙ ኣሎ!',
    fr: '🗑️ Fichier supprimé avec succès !',
    de: '🗑️ Datei erfolgreich gelöscht!',
    it: '🗑️ File eliminato con successo!'
  },
  unlimited: {
    am: 'ያልተገደበ',
    en: 'Unlimited',
    or: 'Daangaa-Malee',
    ti: 'ደረት ዘይብሉ',
    fr: 'Illimité',
    de: 'Unbegrenzt',
    it: 'Illimitato'
  },
  confirm_delete: {
    am: '⚠️ እርግጠኛ ነዎት ይህንን ፋይል ለመሰረዝ ይፈልጋሉ?',
    en: '⚠️ Are you sure you want to delete this file?',
    or: '⚠️ Dhuguma fiilii kana haquu barbaadduu?',
    ti: '⚠️ ርግጸኛ ዲኹም ነዚ ፋይል ክትስርዝዎ ትደልዩ?',
    fr: '⚠️ Voulez-vous vraiment supprimer ce fichier ?',
    de: '⚠️ Sind Sie sicher, dass Sie diese Datei löschen möchten?',
    it: '⚠️ Sei sicuro di voler eliminare questo file?'
  },
  success_upload: {
    am: '📤 አዲስ ፋይል በተሳካ ሁኔታ ተጭኗል!',
    en: '📤 File uploaded successfully!',
    or: '📤 Fiiliin haaraa milkiin fe\'ameera!',
    ti: '📤 ሓዱሽ ፋይል ብዓወት ተዓኒኑ ኣሎ!',
    fr: '📤 Fichier téléversé avec succès !',
    de: '📤 Datei erfolgreich hochgeladen!',
    it: '📤 File caricato con successo!'
  },
  error_upload: {
    am: '❌ ፋይሉን ለመጫን ስህተት ተፈጥሯል',
    en: '❌ Error processing file upload',
    or: '❌ Fiilii fe\'uuf rakkoon uumameera',
    ti: '❌ ፋይል ኣብ ምዕናይ ጌጋ ተፈጢሩ',
    fr: '❌ Erreur lors du téléversement',
    de: '❌ Fehler beim Hochladen der Datei',
    it: '❌ Errore durante il caricamento del file'
  },
  error_read: {
    am: '❌ ፋይሉን ማንበብ አልተቻለም',
    en: '❌ Cannot read this file',
    or: '❌ Fiilii dubbisuun hin danda\'amne',
    ti: '❌ ነዚ ፋይል ምንባብ ኣይተኻእለን',
    fr: '❌ Impossible de lire le fichier',
    de: '❌ Datei konnte nicht gelesen werden',
    it: '❌ Impossibile leggere il file'
  },
  sync_success: {
    am: '💾 ሁሉም የክላውድ ፋይሎች ከ Supabase ደህንነት ዳታቤዝ ጋር በተሳካ ሁኔታ ተመሳስለዋል!',
    en: '💾 All files synced successfully with Supabase secure cloud!',
    or: '💾 Fiilota hunda milkiin Supabase wajjiin wal-simsiifameera!',
    ti: '💾 ኹሉም ፋይላት ምስ Supabase ብዓወት ተመሳሲሎም ኣለዉ!',
    fr: '💾 Tous les fichiers ont été synchronisés avec Supabase !',
    de: '💾 Alle Dateien erfolgreich mit Supabase synchronisiert!',
    it: '💾 Tutti i file sono stati sincronizzati con Supabase!'
  },
  sync_local_warning: {
    am: 'ሰነዶቹ በአካባቢያዊ ዲስክ ላይ በደህንነት ተቀምጠዋል።',
    en: 'Files saved securely in the local browser space.',
    or: 'Sanadoonni kuusaa kompiyutara keessanii irratti nagaan dhaa.',
    ti: 'ፋይላት ኣብቲ ከባቢያዊ ዲስክኩም ብውሑስ ተቐሚጦም ኣለዉ።',
    fr: 'Fichiers enregistrés localement dans votre navigateur.',
    de: 'Dateien wurden lokal im Browser gesichert.',
    it: 'File salvati localmente nel browser.'
  }
};

interface CloudVaultProps {
  onBack?: () => void;
  appLang?: 'am' | 'en' | 'or' | 'ti' | 'fr' | 'de' | 'it';
}

export default function CloudVault({ onBack, appLang = 'am' }: CloudVaultProps) {
  const t = (key: keyof typeof vaultTranslations) => {
    return vaultTranslations[key]?.[appLang] || vaultTranslations[key]?.['en'] || '';
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
  const [storageLimit, setStorageLimit] = useState<number>(() => {
    const saved = localStorage.getItem('papyrus_storage_limit');
    return saved ? parseInt(saved, 10) : 50 * 1024 * 1024; // default 50MB
  });
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

  // Load files from Supabase or LocalStorage
  useEffect(() => {
    async function loadFiles() {
      setLoading(true);
      try {
        // Attempt Supabase fetch
        let fetchedFiles: VaultFile[] = [];
        if (supabase) {
          const { data, error } = await supabase
            .from('lodge_vault_files')
            .select('*')
            .order('uploadedAt', { ascending: false });

          if (!error && data && data.length > 0) {
            fetchedFiles = data;
            setSyncStatus('synced');
          }
        }

        // Fallback to local storage if supabase table empty or error
        if (fetchedFiles.length === 0) {
          const localStored = localStorage.getItem('papyrus_vault_files');
          if (localStored) {
            fetchedFiles = JSON.parse(localStored);
            setSyncStatus('local');
          } else {
            fetchedFiles = defaultFiles;
            localStorage.setItem('papyrus_vault_files', JSON.stringify(defaultFiles));
            setSyncStatus('local');
          }
        }

        setFiles(fetchedFiles);
      } catch (err) {
        console.error('Error loading vault files:', err);
        // Fallback
        const localStored = localStorage.getItem('papyrus_vault_files');
        if (localStored) {
          setFiles(JSON.parse(localStored));
        } else {
          setFiles(defaultFiles);
        }
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

      // Upsert local files to Supabase 'lodge_vault_files' table
      const { error } = await supabase
        .from('lodge_vault_files')
        .upsert(files, { onConflict: 'id' });

      if (error) throw error;

      setSyncStatus('synced');
      alert(t('sync_success'));
    } catch (err: any) {
      console.warn('Sync failed, falling back to local persistent storage:', err);
      // Ensure local sync
      localStorage.setItem('papyrus_vault_files', JSON.stringify(files));
      setSyncStatus('local');
      alert(`ℹ️ ${t('sync_local_warning')} (${err.message || 'database offline'})`);
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
        uploadedBy: appLang === 'am' ? 'ስራ አስኪያጅ (Manager)' : 'Manager',
        uploadedAt: new Date().toISOString(),
        notes: customFileNotes.trim() || (appLang === 'am' ? 'በክላውድ ፋይል ማቆያ የተቀመጠ ሰነድ' : 'Document stored in secure cloud vault')
      };

      const updatedFiles = [newFile, ...files];
      setFiles(updatedFiles);
      localStorage.setItem('papyrus_vault_files', JSON.stringify(updatedFiles));

      // 3. Write record to Supabase database table 'lodge_vault_files'
      try {
        const { error: dbErr } = await supabase.from('lodge_vault_files').insert([newFile]);
        if (dbErr) throw dbErr;
        setSyncStatus('synced');
      } catch (dbErr) {
        console.error('Failed to insert file record to DB, saved locally:', dbErr);
        setSyncStatus('local');
      }

      // Reset inputs
      setCustomFileName('');
      setCustomFileNotes('');
      alert(t('success_upload'));
    } catch (err: any) {
      console.error('Upload Process Error:', err);
      alert(`${t('error_upload')}: ${err.message || err}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Delete Vault File
  const handleDeleteFile = async (id: string, fileName: string) => {
    if (!confirm(`${t('confirm_delete')}\n("${fileName}")`)) {
      return;
    }

    try {
      const fileToDelete = files.find(f => f.id === id);
      const updatedFiles = files.filter(f => f.id !== id);
      setFiles(updatedFiles);
      localStorage.setItem('papyrus_vault_files', JSON.stringify(updatedFiles));

      if (supabase) {
        try {
          // 1. Delete DB record
          await supabase.from('lodge_vault_files').delete().eq('id', id);

          // 2. Also delete from Supabase storage if applicable
          if (fileToDelete && fileToDelete.url) {
            const match = fileToDelete.url.match(/\/lodge-media\/(.+)$/);
            if (match && match[1]) {
              await supabase.storage.from('lodge-media').remove([decodeURIComponent(match[1])]);
            }
          }
        } catch (dbErr) {
          console.error('Failed database delete:', dbErr);
          setSyncStatus('local');
        }
      }

      setPreviewFile(null);
      alert(t('deleted_successfully'));
    } catch (err) {
      console.error('Delete error:', err);
      alert(appLang === 'am' ? '❌ ፋይሉን ለመሰረዝ አልተቻለም' : '❌ Could not delete the file');
    }
  };

  // Trigger Local File Download
  const triggerDownload = (file: VaultFile) => {
    try {
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      window.open(file.url, '_blank');
    }
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
    <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl min-h-[600px] shadow-2xl overflow-hidden font-sans text-stone-200">
      
      {/* Vault Header Bar */}
      <div className="bg-gradient-to-r from-[#111] to-[#0A0A0A] border-b border-white/10 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#C1FF00]/10 flex items-center justify-center border border-[#C1FF00]/30 shrink-0">
            <Folder className="w-5 h-5 text-[#C1FF00]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-[#C1FF00] font-mono font-bold tracking-widest uppercase bg-[#C1FF00]/10 px-2 py-0.5 rounded">
                {t('secure_cloud_storage')}
              </span>
              {syncStatus === 'synced' ? (
                <span className="flex items-center gap-1 text-[9px] text-emerald-400 font-mono">
                  <CheckCircle className="w-2.5 h-2.5" /> {t('cloud_synced')}
                </span>
              ) : syncStatus === 'syncing' ? (
                <span className="flex items-center gap-1 text-[9px] text-yellow-400 font-mono animate-pulse">
                  <RefreshCw className="w-2.5 h-2.5 animate-spin" /> {t('syncing')}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[9px] text-zinc-400 font-mono">
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
            className="px-3.5 py-1.5 bg-white/5 hover:bg-white/15 text-stone-200 text-xs font-mono font-bold rounded-lg border border-white/10 hover:border-white/30 transition-all flex items-center gap-1.5"
            title={t('cloud_sync_btn')}
          >
            <Cloud className="w-3.5 h-3.5" /> {t('cloud_sync_btn')}
          </button>
          
          {onBack && (
            <button
              onClick={onBack}
              className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold rounded-lg border border-rose-500/20 transition-all flex items-center"
            >
              {t('back_btn')}
            </button>
          )}
        </div>
      </div>

      {/* Top Storage Bar & Counters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-white/[0.02] border-b border-white/5">
        <div className="bg-black/40 border border-white/5 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-stone-500 font-mono uppercase tracking-wider">{t('total_files')}</p>
            <p className="text-xl font-black text-white mt-0.5">{files.length} <span className="text-xs text-stone-400 font-light">{appLang === 'am' ? 'ፋይሎች' : 'files'}</span></p>
          </div>
          <Layers className="w-8 h-8 text-[#C1FF00]/20" />
        </div>

        <div className="bg-black/40 border border-white/5 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-stone-500 font-mono uppercase tracking-wider">{t('storage_used')}</p>
            <p className="text-xl font-black text-[#C1FF00] mt-0.5">{formatBytes(storageUsed)}</p>
          </div>
          <Sparkles className="w-8 h-8 text-[#C1FF00]/10" />
        </div>

        <div className="col-span-1 md:col-span-2 bg-black/40 border border-white/5 rounded-xl p-3.5 space-y-2">
          <div className="flex justify-between items-center text-[10px] font-mono text-stone-400">
            <span className="uppercase">{t('storage_meter')} ({formatBytes(storageLimit)} {t('max_buffer')})</span>
            <span className="font-bold">{((storageUsed / storageLimit) * 100).toFixed(1)}% {appLang === 'am' ? 'የተያዘ' : 'full'}</span>
          </div>
          <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
            <div 
              className="bg-gradient-to-r from-[#C1FF00] to-[#00f5ff] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (storageUsed / storageLimit) * 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-5">
        
        {/* LEFT COMPONENT: Upload Widget & Custom Metadata Form */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* STORAGE UPGRADER CONTROL */}
          <div className="bg-[#121212] border border-[#C1FF00]/10 rounded-xl p-4.5 space-y-4 shadow-xl">
            <h3 className="text-xs font-black uppercase text-[#C1FF00] tracking-wider border-b border-white/5 pb-2 flex items-center gap-1.5">
              {t('storage_upgrader')}
            </h3>
            <p className="text-[10px] text-stone-400 font-sans">
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
                    localStorage.setItem('papyrus_storage_limit', tier.value.toString());
                    setStorageLimit(tier.value);
                    if ('speechSynthesis' in window) {
                      const msg = new SpeechSynthesisUtterance();
                      msg.text = t('tts_upgrade_success').replace('{label}', tier.label);
                      msg.lang = appLang === 'or' ? 'om-ET' : (appLang === 'ti' ? 'ti-ET' : (appLang === 'am' ? 'am-ET' : 'en-US'));
                      window.speechSynthesis.speak(msg);
                    }
                    alert(t('alert_upgrade_success').replace('{label}', tier.label).replace('{desc}', tier.desc));
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all duration-300 cursor-pointer ${
                    storageLimit === tier.value 
                      ? 'border-[#C1FF00] bg-[#C1FF00]/5 text-[#C1FF00]' 
                      : 'border-white/5 bg-black/30 hover:bg-black/50 text-white/70 hover:border-white/20'
                  }`}
                >
                  <div className="text-[10px] font-mono uppercase tracking-widest text-stone-400">{tier.name}</div>
                  <div className="text-sm font-bold mt-0.5">{tier.label}</div>
                  <div className="text-[9px] text-stone-500 mt-1">{tier.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#121212] border border-white/10 rounded-xl p-4.5 space-y-4">
            <h3 className="text-xs font-black uppercase text-[#C1FF00] tracking-wider border-b border-white/5 pb-2 flex items-center gap-1.5">
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
                  ? 'border-[#C1FF00] bg-[#C1FF00]/5 text-white' 
                  : 'border-white/10 hover:border-white/20 bg-black/30 hover:bg-black/50 text-stone-400'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
              />
              <div className="p-3 bg-white/5 rounded-full mb-2">
                <Upload className="w-5 h-5 text-[#C1FF00]" />
              </div>
              <p className="text-xs font-black text-center text-white">
                {t('drag_drop_text')}
              </p>
              <p className="text-[10px] text-stone-500 mt-1">
                {t('drag_drop_sub')}
              </p>
            </div>

            {/* Custom Metadata Details Form */}
            <div className="space-y-3.5 bg-black/40 p-3.5 rounded-lg border border-white/5">
              <p className="text-[10px] text-[#00f5ff] font-mono tracking-wider font-bold block uppercase">
                {t('optional_metadata')}
              </p>

              <div>
                <label className="text-[10px] text-stone-400 font-mono uppercase font-bold block mb-1">
                  {t('custom_display_name')}
                </label>
                <input
                  type="text"
                  value={customFileName}
                  onChange={(e) => setCustomFileName(e.target.value)}
                  placeholder={t('custom_display_name_placeholder')}
                  className="w-full bg-black border border-white/10 rounded px-2.5 py-1.5 text-xs text-white placeholder-stone-600 focus:border-[#C1FF00] outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-stone-400 font-mono uppercase font-bold block mb-1">
                  {t('file_category')}
                </label>
                <select
                  value={customFileCategory}
                  onChange={(e) => setCustomFileCategory(e.target.value as any)}
                  className="w-full bg-black border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:border-[#C1FF00] outline-none"
                >
                  <option value="document">{t('cat_document')}</option>
                  <option value="receipt">{t('cat_receipt')}</option>
                  <option value="staff">{t('cat_staff')}</option>
                  <option value="media">{t('cat_media')}</option>
                  <option value="confidential">{t('cat_confidential')}</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-stone-400 font-mono uppercase font-bold block mb-1">
                  {t('file_notes')}
                </label>
                <textarea
                  value={customFileNotes}
                  onChange={(e) => setCustomFileNotes(e.target.value)}
                  placeholder={t('file_notes_placeholder')}
                  rows={2}
                  className="w-full bg-black border border-white/10 rounded px-2.5 py-1.5 text-xs text-white placeholder-stone-600 focus:border-[#C1FF00] outline-none resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COMPONENT: Filter Controls, File Grid & Interactive Listing */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Controls Bar */}
          <div className="bg-[#121212] border border-white/10 p-3 rounded-xl flex flex-col md:flex-row items-center justify-between gap-3">
            
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
                className="w-full bg-black border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-stone-500 focus:border-[#C1FF00] outline-none font-sans"
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
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-md border shrink-0 transition-colors ${
                    selectedCategory === cat.id 
                      ? 'bg-white text-black border-white'
                      : 'bg-black/50 hover:bg-white/10 border-white/10 text-stone-400 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Layout Toggle */}
            <div className="flex border border-white/10 rounded-lg overflow-hidden shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 transition-colors ${viewMode === 'grid' ? 'bg-white/10 text-[#C1FF00]' : 'hover:bg-white/5 text-stone-500 hover:text-stone-300'}`}
                title="Grid Preview"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 transition-colors ${viewMode === 'list' ? 'bg-white/10 text-[#C1FF00]' : 'hover:bg-white/5 text-stone-500 hover:text-stone-300'}`}
                title="List Preview"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Files Stage */}
          {loading ? (
            <div className="border border-white/10 rounded-xl p-16 text-center space-y-3 bg-black/40">
              <div className="w-8 h-8 border-2 border-[#C1FF00] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-stone-400 font-mono uppercase tracking-widest animate-pulse">{t('loading_files')}</p>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="border border-dashed border-white/10 rounded-xl p-16 text-center space-y-4 bg-black/20">
              <span className="text-3xl block">📁</span>
              <div>
                <p className="text-sm font-bold text-white">{t('no_files_found')}</p>
                <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
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
                    className="bg-[#121212] border border-white/10 rounded-xl p-4 flex flex-col justify-between hover:border-white/20 transition-all group overflow-hidden relative"
                  >
                    {/* Tiny neon left edge accent */}
                    <div className={`absolute top-0 bottom-0 left-0 w-1 transition-all ${
                      file.category === 'confidential' ? 'bg-rose-500 animate-pulse' :
                      file.category === 'receipt' ? 'bg-emerald-400' :
                      file.category === 'staff' ? 'bg-purple-400' :
                      file.category === 'media' ? 'bg-amber-400' : 'bg-sky-400'
                    }`} />

                    <div>
                      {/* File Icon & Category Info */}
                      <div className="flex items-center justify-between mb-3 pl-1">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-black/50 rounded-lg border border-white/5">
                            {getFileIcon(file.category, file.fileType)}
                          </div>
                          <div>
                            <span className="text-[10px] font-mono text-stone-500 uppercase block font-medium">
                              {file.fileType.split('/')[1] || 'FILE'} • {formatBytes(file.size)}
                            </span>
                          </div>
                        </div>

                        <span className={`text-[8.5px] font-mono tracking-widest font-black uppercase px-2 py-0.5 rounded border ${
                          file.category === 'confidential' ? 'bg-rose-950/20 text-rose-400 border-rose-500/30' :
                          file.category === 'receipt' ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/30' :
                          file.category === 'staff' ? 'bg-purple-950/20 text-purple-400 border-purple-500/30' :
                          file.category === 'media' ? 'bg-amber-950/20 text-amber-400 border-amber-500/30' :
                          'bg-sky-950/20 text-sky-400 border-sky-500/30'
                        }`}>
                          {t(`cat_${file.category}` as any)}
                        </span>
                      </div>

                      {/* File Name & Remarks */}
                      <div className="space-y-1.5 pl-1">
                        <h4 className="text-xs font-black text-white hover:text-[#C1FF00] transition-colors truncate" title={file.name}>
                          {file.name}
                        </h4>
                        <p className="text-[10.5px] text-stone-400 line-clamp-2 leading-relaxed italic">
                          "{file.notes || t('no_remarks')}"
                        </p>
                      </div>
                    </div>

                    {/* Metadata summary & action panel */}
                    <div className="border-t border-white/5 pt-3 mt-4 flex items-center justify-between">
                      <div className="text-[9.5px] text-stone-500 font-mono">
                        <span className="block truncate max-w-[120px] text-stone-400 font-bold">👤 {file.uploadedBy}</span>
                        <span className="block mt-0.5 text-stone-500">{new Date(file.uploadedAt).toLocaleDateString(appLang === 'am' ? 'am-ET' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {file.url.startsWith('data:') || file.url.startsWith('http') ? (
                          <button
                            type="button"
                            onClick={() => setPreviewFile(file)}
                            className="p-1.5 bg-white/5 hover:bg-white/10 text-stone-300 rounded border border-white/5 hover:border-white/20 transition-all"
                            title={appLang === 'am' ? 'ቅድመ እይታ' : 'Preview'}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => triggerDownload(file)}
                          className="p-1.5 bg-[#C1FF00]/10 hover:bg-[#C1FF00]/20 text-[#C1FF00] rounded border border-[#C1FF00]/10 hover:border-[#C1FF00]/30 transition-all"
                          title={appLang === 'am' ? 'ፋይሉን አውርድ' : 'Download File'}
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteFile(file.id, file.name)}
                          className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded border border-rose-500/10 hover:border-rose-500/35 transition-all"
                          title={appLang === 'am' ? 'ፋይሉን ሰርዝ' : 'Delete File'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            /* LIST VIEW */
            <div className="bg-[#121212] border border-white/10 rounded-xl overflow-hidden divide-y divide-white/5">
              <div className="grid grid-cols-12 p-3 bg-black/40 text-[9px] font-mono text-stone-500 uppercase tracking-widest font-black">
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
                    className="grid grid-cols-12 p-3.5 items-center hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Col 1 */}
                    <div className="col-span-5 md:col-span-6 flex items-center gap-3 min-w-0 pr-2">
                      <div className="shrink-0 p-1.5 bg-black/30 rounded border border-white/5">{getFileIcon(file.category, file.fileType)}</div>
                      <div className="min-w-0">
                        <h5 className="text-xs font-black text-white truncate" title={file.name}>{file.name}</h5>
                        <p className="text-[10px] text-stone-500 truncate mt-0.5">{file.notes || t('no_remarks')}</p>
                      </div>
                    </div>

                    {/* Col 2 */}
                    <div className="col-span-3 md:col-span-2 shrink-0">
                      <span className={`text-[8.5px] font-mono font-black uppercase px-2 py-0.5 rounded border ${
                        file.category === 'confidential' ? 'bg-rose-950/20 text-rose-400 border-rose-500/30' :
                        file.category === 'receipt' ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/30' :
                        file.category === 'staff' ? 'bg-purple-950/20 text-purple-400 border-purple-500/30' :
                        file.category === 'media' ? 'bg-amber-950/20 text-amber-400 border-amber-500/30' :
                        'bg-sky-950/20 text-sky-400 border-sky-500/30'
                      }`}>
                        {t(`cat_${file.category}` as any)}
                      </span>
                    </div>

                    {/* Col 3 */}
                    <div className="col-span-2 text-xs font-mono text-stone-400">{formatBytes(file.size)}</div>

                    {/* Col 4 */}
                    <div className="col-span-2 flex items-center justify-end gap-1.5 shrink-0">
                      <button
                        onClick={() => triggerDownload(file)}
                        className="p-1 px-2.5 bg-[#C1FF00]/10 hover:bg-[#C1FF00]/20 text-[#C1FF00] rounded text-[10px] font-mono border border-[#C1FF00]/10 hover:border-[#C1FF00]/30 transition-colors"
                      >
                        {appLang === 'am' ? 'አውርድ' : 'DOWNLOAD'}
                      </button>
                      <button
                        onClick={() => handleDeleteFile(file.id, file.name)}
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 rounded border border-rose-500/10 hover:border-rose-500/30 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="p-4 border-b border-white/10 bg-black/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getFileIcon(previewFile.category, previewFile.fileType)}
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider truncate max-w-sm sm:max-w-md">{previewFile.name}</h4>
                    <p className="text-[10px] text-stone-400 font-mono mt-0.5">{previewFile.fileType} • {formatBytes(previewFile.size)}</p>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="w-7 h-7 rounded-full bg-white/5 hover:bg-rose-500/20 text-stone-400 hover:text-rose-400 border border-white/10 transition-colors flex items-center justify-center font-bold text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Dynamic Preview Canvas */}
              <div className="p-6 bg-black flex-1 overflow-y-auto flex items-center justify-center min-h-[300px]">
                {previewFile.fileType.startsWith('image/') ? (
                  <img
                    src={previewFile.url}
                    alt={previewFile.name}
                    className="max-h-[380px] max-w-full rounded-lg object-contain border border-white/10"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="text-center p-8 border border-white/5 rounded-xl bg-white/[0.01] max-w-md">
                    <span className="text-4xl block mb-3">📄</span>
                    <h5 className="text-xs font-bold text-white mb-2">{t('preview_not_available')}</h5>
                    <p className="text-[11px] text-stone-400 mb-4 leading-normal">
                      {t('preview_not_available_desc')}
                    </p>
                    <button
                      onClick={() => triggerDownload(previewFile)}
                      className="px-4 py-2 bg-[#C1FF00] text-black font-sans font-black text-xs uppercase rounded-lg flex items-center gap-2 mx-auto justify-center hover:bg-white transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> {t('download_btn')}
                    </button>
                  </div>
                )}
              </div>

              {/* Remarks and metadata block */}
              <div className="p-4 border-t border-white/10 bg-[#0A0A0A] space-y-2">
                <span className="text-[9px] text-[#C1FF00] font-mono tracking-widest uppercase font-bold block">{t('remarks_metadata')}</span>
                <p className="text-xs text-stone-300 italic leading-relaxed">
                  "{previewFile.notes || t('no_remarks')}"
                </p>
                <div className="flex justify-between items-center text-[10px] font-mono text-stone-500 border-t border-white/5 pt-2 mt-2">
                  <span>{t('uploaded_by')}: <strong className="text-stone-300">{previewFile.uploadedBy}</strong></span>
                  <span>{t('uploaded_at')}: <strong className="text-stone-300">{new Date(previewFile.uploadedAt).toLocaleString(appLang === 'am' ? 'am-ET' : 'en-US')}</strong></span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
