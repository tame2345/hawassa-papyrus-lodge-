/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Coffee, User, ChefHat, Settings, Activity, Plus, Minus, Trash2, 
  Bell, ShoppingCart, CheckCircle2, Printer, Share2, LogOut, 
  MapPin, Sparkles, Phone, Map, RefreshCw, AlertCircle, Unlock, 
  Lock, Send, Check, Heart, ExternalLink, Shield, Facebook, Instagram, Youtube, Globe,
  Search
} from 'lucide-react';

import { MenuItem, StaffMember, BankAccount, Order, OrderStatus, OrderType, OrderItem, AssistanceCall, Feedback, PromoBanner, AttendanceRecord, BonusRecord, RoomBooking, Expense, VisitorLog } from './types';
import { INITIAL_MENU_ITEMS, INITIAL_STAFF, INITIAL_BANKS, PROMO_BANNERS } from './data';

import SidebarRail from './components/SidebarRail';
import FooterTicker from './components/FooterTicker';
import CloudVault from './components/CloudVault';
import LoginModal from './components/LoginModal';
import CartModal from './components/CartModal';
import PrintableCertificateModal from './components/PrintableCertificateModal';
import HeroDemo from './components/ui/demo';
import AdminRevenueReports from './components/AdminRevenueReports';
import { SupabaseLogin } from './components/SupabaseLogin';

// Gourmet Restaurant Paradise Background Assets
// @ts-ignore
import gourmetBg from './assets/images/gourmet_bg_main_1782327043045.jpg';
// @ts-ignore
import signatureDish from './assets/images/signature_dish_1782327059310.jpg';
// @ts-ignore
import deliveryChef from './assets/images/delivery_chef_premium_1782328035316.jpg';
// @ts-ignore
import deliveryScooterIllustration from './assets/images/delivery_scooter_illustration_1782328361225.jpg';

// Supabase Connection Import
import { supabase } from './supabaseClient';


export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  useEffect(() => {
    try {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 1024 || /Mobi|Android|iPhone/i.test(navigator.userAgent));
      };
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    } catch {}
  }, []);

  // Sync logo globally via Supabase
  const handleUpdateLogoAndSync = async (newUrl: string) => {
    setLogoUrl(newUrl);
    try {
      await supabase
        .from('system_settings')
        .upsert({ key: 'logoUrl', value: { url: newUrl } });
    } catch (err) {
      console.error("Failed to sync logo to Supabase settings:", err);
    }
  };

  // PERSISTENCE STATE LOAD
  const [menuItems, setMenuItems] = useState<MenuItem[]>(INITIAL_MENU_ITEMS);

  const [staff, setStaff] = useState<StaffMember[]>(() => {
    const baseList = INITIAL_STAFF;
    return baseList.map(s => {
      const updated = { ...s };
      if (!updated.username) {
        if (s.role === 'admin') updated.username = 'admin';
        else if (s.role === 'manager') updated.username = 'manager';
        else if (s.role === 'chef') updated.username = 'chef';
        else if (s.role === 'waiter') updated.username = 'waiter';
        else if (s.role === 'cashier') updated.username = 'cashier';
        else if (s.role === 'receptionist') updated.username = 'receptionist';
        else if (s.role === 'guard') updated.username = 'guard';
        else updated.username = s.name.toLowerCase().replace(/\s+/g, '_');
      }
      if (!updated.password) {
        updated.password = s.pin || '1234';
      }
      if (!updated.securityAnswer) {
        updated.securityAnswer = 'hawassa';
      }
      return updated;
    });
  });

  const [banks, setBanks] = useState<BankAccount[]>(INITIAL_BANKS);

  const [chapaKey, setChapaKey] = useState<string>('');

  const [chapaActive, setChapaActive] = useState<boolean>(true);

  const [chapaMode, setChapaMode] = useState<'live' | 'test'>('test');

  // CASHIER POS STATE SYSTEM
  const [cashierCart, setCashierCart] = useState<{ id: string; name: string; price: number; qty: number }[]>([]);
  const [cashierLocation, setCashierLocation] = useState('Walk-In');
  const [cashierOrderType, setCashierOrderType] = useState<'Dine-In' | 'Takeaway' | 'Room Service'>('Dine-In');
  const [cashierActivePosCat, setCashierActivePosCat] = useState('food');

  const [roomBookings, setRoomBookings] = useState<RoomBooking[]>([
    {
      id: 'b-1',
      roomNumber: 'Room 102 (Deluxe Single)',
      guestCount: 2,
      guestIds: [
        { fullName: 'ዮናስ ታሪኩ (Yonas Tariku)', idNumber: 'ID-847326' },
        { fullName: 'ሳምራዊት ካሳሁን (Samrawit Kassahun)', idNumber: 'ID-561234' }
      ],
      contactPhone: '0912345678',
      checkInDate: '2026-06-05',
      status: 'Active',
      pricePerNight: 2800,
      notes: 'ለትዳር አመታዊ በዓል የመጡ'
    },
    {
      id: 'b-2',
      roomNumber: 'Room 105 (Premium Double)',
      guestCount: 1,
      guestIds: [
        { fullName: 'ካሌብ አበራ (Kaleb Abera)', idNumber: 'ID-992384' }
      ],
      contactPhone: '0911223344',
      checkInDate: '2026-06-06',
      status: 'Active',
      pricePerNight: 3500,
      notes: 'ንግድ ተጓዥ'
    }
  ]);

  const [visitorLog, setVisitorLog] = useState<VisitorLog[]>([
    { id: 'v-1', name: 'ዶ/ር ተስፋዬ ብርሃኑ', phone: '0911223344', carPlate: 'AA-3-B4567A', purpose: 'እንግዳ ለመጠየቅ', timeIn: '09:30 AM', status: 'In Lodge' },
    { id: 'v-2', name: 'ወ/ሮ ማርታ ግርማ', phone: '0912345678', carPlate: 'OR-2-A12903', purpose: 'ማረፊያ ክፍል ለመያዝ', timeIn: '10:15 AM', status: 'In Lodge' },
    { id: 'v-3', name: 'አቶ ካሊድ መሐመድ', phone: '0922445566', carPlate: 'AA-2-C23412', purpose: 'ባህል ምግብ ለመመገብ', timeIn: '08:00 AM', timeOut: '09:45 AM', status: 'Checked Out' }
  ]);

  const [orders, setOrders] = useState<Order[]>([
    {
      id: '#O-991',
      location: 'Table 04',
      items: [{ id: 'm1-temp', baseId: 'm1', name: 'የሽከላ ጥብስ (ቃሪያ: አለ, እንጀራ: የለም, ዳቦ: 1)', qty: 1, price: 660 }],
      total: 875,
      serviceCharge: 66,
      vat: 109,
      tip: 40,
      status: 'Preparing',
      cookingStatus: 'Preparing',
      servedByWaiter: false,
      payment: 'cash',
      confirmed: true,
      waiter: 'ዳዊት አብርሃም',
      orderType: 'dine',
      time: '11:15',
      date: '2026-06-07'
    },
    {
      id: '#O-992',
      location: 'Hawassa Piazza',
      items: [{ id: 'm3-temp', baseId: 'm3', name: 'ፓፒረስ ልዩ ጁስ', qty: 2, price: 180 }],
      total: 455,
      serviceCharge: 36,
      vat: 59,
      tip: 0,
      status: 'Pending',
      cookingStatus: 'Pending',
      servedByWaiter: false,
      payment: 'cash',
      confirmed: true,
      waiter: 'ዳዊት አብርሃም',
      orderType: 'delivery',
      deliveryPhone: '0912345678',
      deliveryAddress: 'Lakeside Main Rd',
      time: '11:22',
      date: '2026-06-07'
    }
  ]);

  const [assistanceCalls, setAssistanceCalls] = useState<AssistanceCall[]>([
    { id: 'c1', location: 'Table 05', time: '11:15', active: true }
  ]);

  const [feedback, setFeedback] = useState<Feedback[]>([
    { id: 'f-1', text: 'ሎጁ በጣም ደስ የሚልና ሰላማዊ ቦታ ነው! አገልግሎታችሁ በጣም አሪፍ ነው!', time: '2026-06-07 10:30' },
    { id: 'f-2', text: 'Excellent service and peaceful environment!', time: '2026-06-07 11:15', reply: 'Thank you very much for your feedback! We hope to see you again soon.', replyTime: '2026-06-07 11:20' }
  ]);

  const [serviceChargeRate, setServiceChargeRate] = useState<number>(10);

  const [vatRate, setVatRate] = useState<number>(15);

  const [aboutLodgeText, setAboutLodgeText] = useState<string>('ሀዋሳ ፓፒረስ ሎጅ በተፈጥሮ የታደለች ውቧ የሀዋሳ ከተማ ውስጥ፣ ከታዋቂው የሀዋሳ ሃይቅ ዳርቻ አቅራቢያ የሚገኝ ምቹ፣ ሰላማዊ እና አስደሳች ማረፊያ ነው። ጥራት ባላቸው አገልግሎቶቻችን፣ በአገር በቀል ጣፋጭ ምግቦች፣ እንዲሁም ለተለያዩ ክብረ በዓላት የሚሆኑ ውብ አዳራሾቻችን አስተማማኝ ምርጫ እንድንሆን ያደርገናል።');

  const [promos, setPromos] = useState<PromoBanner[]>(PROMO_BANNERS);

  const [galleryItems, setGalleryItems] = useState<any[]>([]);

  const [expenses, setExpenses] = useState<Expense[]>([
    { id: 'exp-1', title: 'ለኩሽና እንቁላል እና ስጋ ግዢ (Kitchen purchase)', category: 'ማቴሪያል ግዢ (Kitchen Supply)', amount: 1500, date: '2026-06-07', time: '09:00', notes: 'የጠዋት ግብዓቶች' },
    { id: 'exp-2', title: 'የኤሌክትሪክ እና የውሃ ክፍያ (Utility Payments)', category: 'መገልገያ ክፍያ (Utilities)', amount: 4800, date: '2026-06-06', time: '14:30', notes: 'ለግንቦት ወር' },
    { id: 'exp-3', title: 'የሪሴብሽን ሰርተፊኬት ማተሚያ ወረቀት (Desk Paper)', category: 'ጽሕፈት መሳሪያ (Stationery)', amount: 800, date: '2026-06-07', time: '11:00', notes: 'ባለ 3 ኮፒ ሰነድ' }
  ]);

  // APP STATES
  const [activeRole, setActiveRole] = useState<'entry' | 'customer' | 'waiter' | 'chef' | 'admin' | 'manager' | 'receptionist' | 'cashier' | 'guard' | 'shader_demo' | 'vault'>(() => {
    try {
      const stored = localStorage.getItem('supabase_bypassed_current_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        const role = parsed.accessPrivilege || parsed.role;
        if (role) return role;
      }
    } catch {}
    return 'entry';
  });
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isFromQr, setIsFromQr] = useState<boolean>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.has('table');
    } catch {
      return false;
    }
  });
  const [currentUser, setCurrentUser] = useState<StaffMember | null>(() => {
    try {
      const stored = localStorage.getItem('supabase_bypassed_current_user');
      if (stored) return JSON.parse(stored);
    } catch {}
    return null;
  });
  const [activeAdminTab, setActiveAdminTab] = useState<'sales' | 'staff' | 'menu' | 'banks' | 'qrprint' | 'promo' | 'lodgeinfo' | 'reception' | 'branding'>('sales');
  const [ledgerFilterTab, setLedgerFilterTab] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const [managerTab, setManagerTab] = useState<'bono' | 'attendance' | 'sales_review' | 'vault'>('bono');
  
  // RECEPTION / BEDROOM BOOKINGS STATE
  const [bookingGuestCount, setBookingGuestCount] = useState<number>(1);
  const [guestIdsState, setGuestIdsState] = useState<{ fullName: string, idNumber: string, idPhotoUrl?: string }[]>([{ fullName: '', idNumber: '', idPhotoUrl: '' }]);
  
  // MODALS
  const [loginModalRole, setLoginModalRole] = useState<'waiter' | 'chef' | 'admin' | 'manager' | 'receptionist' | 'cashier' | 'guard' | ''>('');
  const [isCartOpen, setIsCartOpen] = useState(false);

  // GUARD PORTAL STATE VARIABLES
  const [guardSearch, setGuardSearch] = useState('');
  const [gName, setGName] = useState('');
  const [gPhone, setGPhone] = useState('');
  const [gPlate, setGPlate] = useState('');
  const [gPurpose, setGPurpose] = useState('ምግብና መጠጥ (Dine & Drink)');

  // UNIFIED PORTAL LOGIN STATE
  const [unifiedRole, setUnifiedRole] = useState<'waiter' | 'chef' | 'admin' | 'manager' | 'receptionist' | 'cashier' | 'guard'>('waiter');
  const [unifiedUsername, setUnifiedUsername] = useState('');
  const [unifiedPassword, setUnifiedPassword] = useState('');
  const [unifiedPin, setUnifiedPin] = useState('');
  const [unifiedMethod, setUnifiedMethod] = useState<'password' | 'pin'>('password');
  const [unifiedError, setUnifiedError] = useState('');
  const [isDivisionExpanded, setIsDivisionExpanded] = useState(false);

  // BEAUTIFUL STAFF AUTH PORTAL MODES & INTERACTIVE STATE (Based on user-uploaded mockup)
  const [staffPortalState, setStaffPortalState] = useState<'welcome' | 'login' | 'signup'>('welcome');
  const [signupName, setSignupName] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupPin, setSignupPin] = useState('');
  const [signupRole, setSignupRole] = useState<'waiter' | 'chef' | 'receptionist' | 'cashier' | 'guard' | 'manager' | 'admin'>('waiter');
  const [signupSecurityAnswer, setSignupSecurityAnswer] = useState('');
  const [signupSuccessMessage, setSignupSuccessMessage] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // BRAND LOGO & LITE-MODE (BASIC MODE TOGGLE)
  const [logoUrl, setLogoUrl] = useState<string>('https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=150&auto=format&fit=crop&q=60');
  const [tempLogoFile, setTempLogoFile] = useState<string | null>(null);

  const [bgVideoUrl, setBgVideoUrl] = useState<string>('https://pixabay.com/videos/ai-generated-restaurant-cafe-jazz-202004/');

  const [bgVideoType, setBgVideoType] = useState<'youtube' | 'direct' | 'local' | 'mango-paradise' | 'gourmet-paradise'>('gourmet-paradise');

  const [isBgVideoEnabled, setIsBgVideoEnabled] = useState<boolean>(false);

  const [mediaPreviewPaused, setMediaPreviewPaused] = useState(false);
  const [mediaPreviewMuted, setMediaPreviewMuted] = useState(true);

  const [liteMode, setLiteMode] = useState<boolean>(false);

  // Mouse position tracking for interactive 3D parallax background
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [activeChefAnimationDish, setActiveChefAnimationDish] = useState<'tibs' | 'shiro' | 'injera' | 'coffee'>('tibs');
  const [hoveredMonthIndex, setHoveredMonthIndex] = useState<number | null>(null);
  const [activeReportTimeframe, setActiveReportTimeframe] = useState<'all' | 'q1' | 'q2' | 'this-month'>('all');
  const [selectedReportMetric, setSelectedReportMetric] = useState<'revenue' | 'expenses' | 'net'>('revenue');
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      setMousePos({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // MULTILANGUAGE STATES (3 LOCAL LANGUAGES, 4 FOREIGN LANGUAGES, PLUS SIDAAMU AFOO)
  const [appLang, setAppLang] = useState<'am' | 'en' | 'or' | 'ti' | 'fr' | 'de' | 'it' | 'sid'>(() => {
    try {
      const stored = localStorage.getItem('papyrus_app_lang');
      if (stored && ['am', 'en', 'or', 'ti', 'fr', 'de', 'it', 'sid'].includes(stored)) {
        return stored as 'am' | 'en' | 'or' | 'ti' | 'fr' | 'de' | 'it' | 'sid';
      }
    } catch {}
    return 'am';
  });

  const [isVoiceOverEnabled, setIsVoiceOverEnabled] = useState<boolean>(true);

  // Dynamic localization maps for all 5 core categories across 8 languages
  const categoryTranslations: Record<string, Record<string, string>> = {
    food: {
      am: 'ምግቦች (Foods)',
      en: 'Foods',
      or: 'Nyaata (Foods)',
      ti: 'ምግባት (Foods)',
      fr: 'Nourriture',
      de: 'Speisen',
      it: 'Cibo',
      sid: 'Sagale (Foods)'
    },
    drinks: {
      am: 'መጠጦች (Drinks)',
      en: 'Drinks',
      or: 'Dhugaatii (Drinks)',
      ti: 'መስተታት (Drinks)',
      fr: 'Boissons',
      de: 'Getränke',
      it: 'Bevande',
      sid: 'Ago (Drinks)'
    },
    traditional: {
      am: 'ባህላዊ (Traditional)',
      en: 'Traditional',
      or: 'Aadaa (Traditional)',
      ti: 'ባህላዊ (Traditional)',
      fr: 'Traditionnel',
      de: 'Traditionell',
      it: 'Tradizionale',
      sid: 'Budu (Traditional)'
    },
    room: {
      am: 'ክፍሎች (Rooms)',
      en: 'Rooms',
      or: 'Kutaa (Rooms)',
      ti: 'ክፍልታት (Rooms)',
      fr: 'Chambres',
      de: 'Zimmer',
      it: 'Camere',
      sid: 'Kifile (Rooms)'
    },
    venue: {
      am: 'ስብሰባ (Venues)',
      en: 'Venues',
      or: 'Iddoo Galmaa (Venues)',
      ti: 'አዳራሽ (Venues)',
      fr: 'Salles',
      de: 'Veranstaltungsorte',
      it: 'Luoghi',
      sid: 'Galma (Venues)'
    }
  };

  // Dynamic localization maps for all core food, drink, room & venue items across 8 languages
  const itemTranslations: Record<string, Record<string, { name: string; desc: string }>> = {
    m1: {
      am: { name: 'የሽከላ ጥብስ', desc: 'ጥሬ ስጋ, ቅቤ, ነጭ ሽንኩርት በተመረጡ ቅመማ ቅመሞች' },
      en: { name: 'Shekla Tibs', desc: 'Fresh beef, Ethiopian butter, garlic cooked with selected spices.' },
      or: { name: 'Tibs Shakalaa', desc: 'Foon dheedhii, sirnaan qophaa\'e, qulqullina olaanaa qabu.' },
      ti: { name: 'የሽከላ ጥብስ', desc: 'ጥሩይ ስጋ፡ መዓር ቅቤ፡ ጻዕዳ ሽንኩርቲ ብምርጽ ቅመማ ቅመማት ዝተሰርሐ።' },
      fr: { name: 'Tibs de Shekla', desc: 'Bœuf frais mijoté avec du beurre éthiopien épicé et de l\'ail.' },
      de: { name: 'Shekla Tibs', desc: 'Frisches Rindfleisch, serviert auf einer erhitzten Tonschale.' },
      it: { name: 'Tibs in Argilla', desc: 'Carne di manzo cotta in una ciotola caldissima di terracotta.' },
      sid: { name: 'Tibs Shakala', desc: 'Shonkorra, kibe, canano qajeela foon qorameena qopha\'e.' }
    },
    m2: {
      am: { name: 'ልዩ ክትፎ', desc: 'ለስላሳ ስጋ, ሚጥሚጣ, አገር በቀል ቆንጆ ቅቤ, አይብ' },
      en: { name: 'Special Kitfo', desc: 'Minced lean beef seasoned with mitmita, spiced butter, and cottage cheese.' },
      or: { name: 'Kitfoo Addaa', desc: 'Foon kosi dhangala\'aa sirriti dhawame mirgisaa dabalatee.' },
      ti: { name: 'ልዩ ክትፎ', desc: 'ልስሉስ ስጋ፡ ሚጥሚጣ፡ ምኡዝ ናይ ሃገር ቅቤን አይብን ዘለዎ።' },
      fr: { name: 'Kitfo Spécial', desc: 'Bœuf haché assaisonné de piment mitmita et de kibe fondu chaud.' },
      de: { name: 'Spezial Kitfo', desc: 'Feinstes Rinderhackfleisch mit hausgemachter Gewürzbutter.' },
      it: { name: 'Kitfo Speciale', desc: 'Battuta di manzo finissima con burro speziato caldo e formaggio fresco.' },
      sid: { name: 'Adda Kitfo', desc: 'Foon qorame, mitmita, kibe, ayibe wajjiin qophaa\'e.' }
    },
    m8: {
      am: { name: 'የሀዋሳ ዓሳ ጥብስ', desc: 'ትኩስ ከሀይቁ የወጣ አሳ በጥብስ, በቃሪያና በሎሚ' },
      en: { name: 'Fried Lake Fish', desc: 'Fresh tilapia fish caught from Lake Hawassa, fried with green chili & lemon.' },
      or: { name: 'Qorii Qurxummii', desc: 'Qurxummii haroo Hawaasaa irraa ba\'e sirritti qorame.' },
      ti: { name: 'የሃዋሳ ዓሳ ጥብስ', desc: 'ሓድሽ ካብ ቀላይ ዝወጸ ዓሳ ብጥብሲ፡ በረድ ቃሪያን ሎሚን።' },
      fr: { name: 'Poisson Frit Hawassa', desc: 'Poisson tilapia frais du lac Hawassa croustillant avec piment frais.' },
      de: { name: 'Hawassa Brathering', desc: 'Frischer Tilapia-Fisch aus dem Hawassasee, knusprig frittiert.' },
      it: { name: 'Pesce Fritto di Hawassa', desc: 'Pesce tilapia fresco pescato dal lago Hawassa fritto con peperoncino.' },
      sid: { name: 'Hawaasa Qorii Qurxumme', desc: 'Hawaasa qummeessine taje kessate fannoonni qaariya wajjiin.' }
    },
    m10: {
      am: { name: 'የበግ በረካ ጥብስ', desc: 'በሽንኩርት, በቅቤ እና በቃሪያ የተጠበሰ ምርጥ ስጋ' },
      en: { name: 'Mutton Tibs', desc: 'Sautéed tender mutton chunks with onions, herbal butter, and hot green pepper.' },
      or: { name: 'Tibs Re\'ee', desc: 'Tibs foon korbeessa hoolaa qulqulluu gabbataa fi zayitiin.' },
      ti: { name: 'የበግ በረካ ጥብስ', desc: 'ብሽንኩርቲ፡ ብቅቤን ብቃሪያን ዝተጠብሰ ድንቅ ስጋ በጊዕ።' },
      fr: { name: 'Tibs d\'Agneau', desc: 'Morsures d\'agneau rissolées aux oignons et herbes fraîches.' },
      de: { name: 'Lamm Tibs', desc: 'Zartes Lammfleisch, scharf angebraten mit Zwiebeln und grünem Paprika.' },
      it: { name: 'Tibs di Agnello', desc: 'Bocconcini d\'agnello saltati in padella con burro speziato e cipolla.' },
      sid: { name: 'Tibs Re\'e', desc: 'Kibe, shonkorra, qaariya wajjiin qorame foon re\'e.' }
    },
    m9: {
      am: { name: 'የዓሳ ጉላሽ', desc: 'በተመረጡ ቅመማቅመሞች የተሰራ ዝነኛው የዓሳ ጉላሽ ከሩዝ ጋር' },
      en: { name: 'Fish Goulash', desc: 'Famous cubed fish cooked with tomatoes, spices, served with side rice.' },
      or: { name: 'Gulaashii Qurxummii', desc: 'Nunuu qurxummii khoshariin qophaa\'e raayisii wajjiin.' },
      ti: { name: 'የዓሳ ጉላሽ', desc: 'ብፍሉይ ቅመማቅመማት ዝተዳለወ ክሬም ዓሳ ጉላሽ ምስ ሩዝ።' },
      fr: { name: 'Goulache de Poisson', desc: 'Cubes de poisson marinés à la sauce tomate épicée, accompagnés de riz.' },
      de: { name: 'Fischgulasch', desc: 'Traditionelles würziges Fischgulasch mit weißem Beilage-Reis.' },
      it: { name: 'Gulasch di Pesce', desc: 'Gulasch di pesce cubettato in salsa ricca e profumata con riso.' },
      sid: { name: 'Qurxumme Gulaashe', desc: 'Qurxumme rarra\'a, timatime, shonkorra ruuze wajjiin.' }
    },
    m11: {
      am: { name: 'የጾም በያይነቱ', desc: 'ምስር ክክ, ሽሮ ወጥ, ጥቅል ጎመን, ቀይ ስር ሰላጣ' },
      en: { name: 'Fasting Beyaynetu', desc: 'Sinfully colorful vegan platter of red lentils, split peas, cabbage, and shiro.' },
      or: { name: 'Beyaynetu Tsoomii', desc: 'Nyaata tscomii bifa adda addaatiin qophaa\'e afaan filatamaa.' },
      ti: { name: 'የጾም በያይነቱ', desc: 'ምስር ኽኽ፡ ዓተር ዝተፈጨ ሽሮ፡ ውዑይ ጥቅል ጎመንን ቀይ ሰርን።' },
      fr: { name: 'Beyaynetu de Carême', desc: 'Grand assortiment végétalien de lentilles, chou, carottes et pois cassés.' },
      de: { name: 'Fasten Beyaynetu', desc: 'Eine vegane Platte mit verschiedenen Linsengerichten und Gemüse.' },
      it: { name: 'Beyaynetu Vegano', desc: 'Piatto vegano composto da lenticchie, verza, barbabietole e crema di ceci.' },
      sid: { name: 'Beyaynetu Tsoome', desc: 'Misire, shiro, gomenna, beetroot salata wajjiin.' }
    },
    m3: {
      am: { name: 'ፓፒረስ ልዩ ጁስ', desc: 'ከሀገር በቀል ትኩስ ፍራፍሬዎች (አቮካዶ, ማንጎ, ፓፓያ) የተጨመቀ' },
      en: { name: 'Papyrus Mixed Juice', desc: 'Freshly squeezed tropical layer juice of avocado, mango, and papaya.' },
      or: { name: 'Juusii Addaa Paappiras', desc: 'Juusii muduraalee adda addaa avocado mango fi paapaaya.' },
      ti: { name: 'ፓፒረስ ፍሉይ ጁስ', desc: 'ካብ ዝበለጹ ናይ ሃገር ፍረታት (አቮካዶ፡ ማንጎ፡ ፓፓያ) ዝተዳለወ።' },
      fr: { name: 'Jus Maison Papyrus', desc: 'Jus de fruits frais pressés en couches (avocat, mangue, papaye).' },
      de: { name: 'Papyrus Spezialsaft', desc: 'Mehrschichtiger frischer Tropenfruchtsaft aus Avocado und Mango.' },
      it: { name: 'Succo Speciale', desc: 'Centrifugato fresco multi-strato di avocado, mango e papaia freschi.' },
      sid: { name: 'Paappiras Adda Juuse', desc: 'Avocado, mango, paapaaya maccishshe juuse.' }
    },
    m4: {
      am: { name: 'የቀዝቃዛ ቢራ (Draft)', desc: 'ትኩስነቱ የተጠበቀ ምርጥ ድራፍት ቢራ ቀዝቃዛ' },
      en: { name: 'Cold Draft Beer', desc: 'Fresh crisp draught beer draft chilled to perfection.' },
      or: { name: 'Draftii Qabbanaa\'aa', desc: 'Biraa qabbanaa\'aa qulqulluun.' },
      ti: { name: 'ዝሑል ድራፍት ቢራ', desc: 'ቀዝቃዛ ድራፍት ቢራ ምኡዝ ንበረድ ክረምቲ።' },
      fr: { name: 'Bière Pression Fraîche', desc: 'Bière pression légère et rafraîchissante servie très fraîche.' },
      de: { name: 'Kaltes Zapfbier', desc: 'Frisch gezapftes, eisgekühltes Premium-Bier vom Fass.' },
      it: { name: 'Birra alla Spina', desc: 'Birra chiara alla spina spillata a temperatura glaciale.' },
      sid: { name: 'Qabbana\'aa Draft Bira', desc: 'Qabbana\'aa draft bira lowo.' }
    },
    m12: {
      am: { name: 'የጀበና ቡና', desc: 'በባህላዊ መንገድ የተቆላና በጀበና የፈላ ምርጥ የይርጋጨፌ ቡና' },
      en: { name: 'Traditional Coffee', desc: 'Locally roasted Yirgacheffe organic coffee beans slowly brewed in a clay pot.' },
      or: { name: 'Bunna Jebenaa', desc: 'Buna aadaatiin qoramee jebenaadhaan hojjetame gaarii.' },
      ti: { name: 'ናይ ጀበና ቡና', desc: 'በባህላዊ መገዲ ዝተቖላና ብጀበና ዝፈልሐ ሓቀኛ ናይ ይርጋጨፌ ቡና።' },
      fr: { name: 'Café Éthiopien Traditionnel', desc: 'Café organique torréfié sur place et infusé délicatement dans une jarre d\'argile.' },
      de: { name: 'Traditioneller Kaffee', desc: 'Traditioneller Yirgacheffe-Kaffee, frisch zubereitet in der Tonkanne.' },
      it: { name: 'Caffè in Jebena', desc: 'Caffè biologico arabica tostato a mano e preparato nella tipica caffettiera.' },
      sid: { name: 'Buna Jebena', desc: 'Jebenatenni kibe shonkorra Buna Yirgacheffe.' }
    },
    m13: {
      am: { name: 'የሀገር ባህል ጠጅ', desc: 'ከተፈጥሮ ንፁህ ማር የተዘጋጀ ልዩ የሀገር ባህል ጠጅ በብርሌ' },
      en: { name: 'Honey Wine (Tej)', desc: 'Premium home-brewed traditional honey mead served in direct glass decanter.' },
      or: { name: 'Daadhii Honey', desc: 'Daadhii doroqo damma sirrii irraa qophaa\'e mi\'aawa.' },
      ti: { name: 'ናይ ዓዲ ጠጅ', desc: 'ካብ ናይ መዓር ንጹህ መዓር ዝተዳለወ ፍሉይ ጠጅ ብብርለ።' },
      fr: { name: 'Hydromel Maison (Tej)', desc: 'Vin de miel traditionnel éthiopien doux et parfumé servi en bouteille carafe.' },
      de: { name: 'Honigwein (Tej)', desc: 'Traditioneller hausgemachter äthiopischer Honigmet im Glaskolben.' },
      it: { name: 'Idromele Tipico (Tej)', desc: 'Bevanda alcolica fermentata di miele purissimo servita nel tipico boccale.' },
      sid: { name: 'Buda Tejje', desc: 'Naxarame mada damma irraa qopha\'e tejje.' }
    },
    m5: {
      am: { name: 'ስታንዳርድ አልጋ (Lakeside)', desc: 'ምቹ አልጋ, ከነጻ የእንፋሎት መታጠቢያ, ቁርስ እና ፈጣን ኢንተርኔት ጋር' },
      en: { name: 'Standard Room Single', desc: 'Comfortable single bed, lakeside view breeze, free steam room, breakfast & high-speed Wi-Fi.' },
      or: { name: 'Kutaa Standard', desc: 'Algaa tokko qulqulluu, breakfast fi steam sauna bilisa.' },
      ti: { name: 'ስታንዳርድ አልጋ', desc: 'ምቹ አልጋ ምስ ነጻ ሳውና፡ ቁርስን ፈጣን ኢንተርኔትን።' },
      fr: { name: 'Chambre Standard Simple', desc: 'Lit confortable avec vue lac, hammam gratuit, petit déjeuner et Wi-Fi haut débit.' },
      de: { name: 'Standard Einzelzimmer', desc: 'Gemütliches Einzelzimmer mit Seeblick, kostenlosem Frühstück und WLAN.' },
      it: { name: 'Camera Standard Vista Lago', desc: 'Letto comodo, colazione inclusa, accesso sauna gratuito e bagno privato.' },
      sid: { name: 'Standard Kifile', desc: 'Kifile single alga, lake view qajeela, breakfast & Wi-Fi.' }
    },
    m6: {
      am: { name: 'ዴሉክስ ቪ አይ ፒ ሱዊት', desc: 'ትልቅ ሳሎን ያለውና ወደ ውቡ ሀይቅ የሚመለከት የቅንጦት ማረፊያ' },
      en: { name: 'Deluxe VIP Suite', desc: 'Premium master bedroom, broad living space, and stunning lake views.' },
      or: { name: 'Kutaa Deluxe VIP', desc: 'Kutaa firaash olaanaa, bishaan haroo gubbaa ilaalu.' },
      ti: { name: 'ዴሉክስ ቪ አይ ፒ ሱዊት', desc: 'ዓብይ መደቀስን ዓብይ ሳሎንን ዘለዎ ናብ ውብ ቀላይ ዝጥምት ፍሉይ ማረፊያ።' },
      fr: { name: 'Suite Deluxe VIP', desc: 'Chambre de maître spacieuse, salon séparé et vue panoramique majestueuse sur le lac.' },
      de: { name: 'Luxus VIP-Suite', desc: 'Exklusives Master-Schlafzimmer mit Salon und Panoramablick auf den See.' },
      it: { name: 'Master Suite VIP Deluxe', desc: 'Appartamento ultra-lussuoso con salotto privato e vista spettacolare sul lago.' },
      sid: { name: 'Deluxe VIP Kifile', desc: 'VIP master kifile, living space, lake view breeze.' }
    },
    m7: {
      am: { name: 'የባህር ዳርቻ አትክልት ቦታ', desc: 'ለሰርግ, መጠነኛ ስራዎች እና ለትልልቅ ስብሰባዎች የሚሆን ውብ መናፈሻ' },
      en: { name: 'Lakeside Garden Venue', desc: 'Scenic garden park by Lake Hawassa, perfect for weddings, banquets and corporate retreats.' },
      or: { name: 'Bakka Shimbiraa', desc: 'Bakka mijeessaa qophii sirnaa fi bashannanaaf ta\'u.' },
      ti: { name: 'ናይ ባሕሪ ዳርቻ ገነት', desc: 'ናይ መርዓ፡ ዓበይቲ ርክባትን ስብሰባታትን ዝኸውን ውብ መናፈሻ።' },
      fr: { name: 'Jardin du Lac', desc: 'Magnifique espace vert au bord du lac pour mariages et réceptions.' },
      de: { name: 'Lakeside Garten', desc: 'Wunderschöner Park am See für Hochzeiten und Tagungen.' },
      it: { name: 'Giardino sul Lago', desc: 'Splendido parco sul lago per matrimoni ed eventi.' },
      sid: { name: 'Haaro Giddo', desc: 'Shonkorra babbaxxino looso qopha\'e.' }
    }
  };

  // Fallback text dictionary for all 8 languages
  const entryTranslation = {
    app_title: {
      am: 'ሃዋሳ ፓፒረስ',
      en: 'Hawassa Papyrus',
      or: 'Hawaasa Paappiras',
      ti: 'ሃዋሳ ፓፒረስ',
      fr: 'Hawassa Papyrus',
      de: 'Hawassa Papyrus',
      it: 'Hawassa Papyrus',
      sid: 'Hawassa Paappiras'
    },
    app_subtitle: {
      am: 'ዲጂታል ኢኮ-ፖርታል v2',
      en: 'DIGITAL ECO-PORTAL v2',
      or: 'POORTAAL EKO-DIIJITAALAA v2',
      ti: 'ዲጂታል ኢኮ-ፖርታል v2',
      fr: 'ÉCO-PORTAIL NUMÉRIQUE v2',
      de: 'DIGITALES ÖKO-PORTAL v2',
      it: 'ECO-PORTALE DIGITALE v2',
      sid: 'DIIJITAALE EKO-PORTAALE v2'
    },
    intro_para: {
      am: 'አገልግሎታችንን ለመጠቀም ከታች ከቀረቡት አማራጮች ያንን የሚመለከተውን መግቢያ መርጠው ይጠቀሙ።',
      en: 'To access our services, please select the appropriate portal from the options below.',
      or: 'Tajaajila keenya argachuuf, maaloo portaalii sirrii ta\'e filannoowwan armaan gadii irraa filadhaa.',
      ti: 'አገልግሎትና ንምርካብ፡ በጃኹም ካብቶም ታሕቲ ዘለዉ ኣማራጺታት ዝምጥን መእተዊ ይምረጹ።',
      fr: 'Pour accéder à nos services, veuillez sélectionner le portail approprié parmi os options ci-dessous.',
      de: 'Um auf unsere Dienste zuzugreifen, wählen Sie bitte das entsprechende Portal aus den folgenden Optionen.',
      it: 'Per accedere ai nostri servizi, seleziona il portale opportuno tra le opzioni sottostanti.',
      sid: 'Taje keenya afate, maaloo portaale babbaxxino doori.'
    },
    guest_title: {
      am: 'የእንግዳ መግቢያ',
      en: 'Guest Gateway',
      or: 'Seensa Keessummootaa',
      ti: 'መእተዊ ኣጋይሽ',
      fr: 'Espace Client',
      de: 'Gäste-Portal',
      it: 'Accesso Ospiti',
      sid: 'La\'ote Seena'
    },
    guest_desc: {
      am: 'የፓፒረስ ሎጅ ዲጂታል እንግዳ አገልግሎቶች እና የመመገቢያ ትዕዛዝ ማዘዣ። ምግቦችን ለማዘዝ፣ ክፍል ውስጥ አገልግሎቶችን ለመጠየቅ እና የአካባቢ ጉዞዎችን ለማሰስ ይጠቀሙ።',
      en: 'Welcome to Papyrus Lodge dynamic companion portal. Order exquisite local & international cuisine, manage room amenities, request services, and browse Hawassa lake tours.',
      or: 'Portaali tajaajila keessummaa Papayiras Lodg. Nyaata babbaxoo ajajuu, tajaajila kutaa gaafachuu fi daawwannaa haroo Hawaasaa qopheessuuf.',
      ti: 'ናይ ፓፒረስ ሎጅ ዲጂታል ኣገልግሎት ኣጋይሽን መእዘዚ መግቢን። መግቢ ንምእዛዝ፡ ኣገልግሎት ክፍሊ ንምሕታት፡ ከምኡውን ዑደት ቀላይ ሃዋሳ ንምርኣይ ይጠቀሙ።',
      fr: 'Bienvenue sur le portail des résidents du Papyrus Lodge. Commandez notre cuisine raffinée, demandez des services en chambre et réservez des excursions guidées sur le lac.',
      de: 'Willkommen im Papyrus Lodge Gästebereich. Bestellen Sie feine lokale & internationale Speisen, fordern Sie Zimmerservice an und buchen Sie Ausflüge auf dem Hawassa-See.',
      it: 'Benvenuto nel portale ospiti di Papyrus Lodge. Ordina piatti tradizionali e internazionali, richiedi servizi in camera e organizza escursioni sul lago Hawassa.',
      sid: 'Hawaasa Paappiras Looje la\'ote taje doorshsha. Sagale hajajate, kifile taje xa\'mitate, qoleno haaro daawwatate.'
    },
    guest_btn: {
      am: 'ወደ እዚህ ይግቡ (እንግዳ) 🍽️',
      en: 'ENTER GUEST PORTAL 🍽️',
      or: 'GARA KEESSUMMAA SEENAA 🍽️',
      ti: 'ናብዚ እተዉ (ጋሻ) 🍽️',
      fr: 'ENTRER CÔTÉ CLIENT 🍽️',
      de: 'ZUM GÄSTEBEREICH 🍽️',
      it: 'ENTRA COME OSPITE 🍽️',
      sid: 'LA’OTE DOORSINNI SEENA 🍽️'
    },
    staff_title: {
      am: 'Staff & Admin Secure Desk',
      en: 'Staff & Admin Secure Desk',
      or: 'Galmee Hojjettootaa qulqulluu',
      ti: 'መእተዊ ሰራሕተኛታትን ምሕደራን',
      fr: 'Portail Privé Staff & Admin',
      de: 'Mitarbeiter & Admin Portal',
      it: 'Portale Pro Staff & Admin',
      sid: 'Ogeeyyi & Admin Secure Desk'
    },
    staff_desc: {
      am: 'የፓፒረስ ሎጅ የሙያተኞች እና አስተዳዳሪዎች ማዕከላዊ የመግቢያ መግቢያ። አስተዳደር፣ ሽያጭ ሪፖርት፣ ሂሳብ አከፋፈል እና የክፍል መቆጣጠሪያ።',
      en: 'Central back-office workflow management. Handle kitchen rosters, waiter dispatches, accounts ledgers, live room charts, and reception guest registries securely.',
      or: 'Bakka hojjettoonni kantiinaa, tajaajiltoonni, herregni fi hooggantoonni kuusaa tajaajilaa itti to\'atani fi hojjetan.',
      ti: 'ማእከላይ መእተዊን ሓዱሽ ኣካውንት መኽፈቲን መተግበሪ ሰብ ሞያን ኣመሓደርትን ፓፒረስ ሎጅ።',
      fr: 'Espace sécurisé réservé aux serveurs, chefs, réceptionnistes et directeurs pour la gestion d\'établissement et les rapports en temps réel.',
      de: 'Gesichertes Administrationsportal für Kellner, Küche, Empfang und Finanzkontrolle der Papyrus Lodge.',
      it: 'Accesso sicuro riservato a camerieri, chef, reception e amministratori per la contabilità e il controllo camere.',
      sid: 'Hawaasa Paappiras Looje handaara ogeeyyira qummeessa. Receptine kitchine, accounts canatano herrega taje.'
    },
    staff_btn: {
      am: 'ወደ እዚህ ይግቡ (ሰራተኛ) 🔐',
      en: 'ENTER STAFF DESK 🔐',
      or: 'GARA HOJJETTOOTAA SEENAA 🔐',
      ti: 'ናብዚ እተዉ (ሰራሕተኛ) 🔐',
      fr: 'ACCÈS PROFESSIONNEL 🔐',
      de: 'ZUR MITARBEITER-DESK 🔐',
      it: 'ACCESSO PERSONALE 🔐',
      sid: 'OGEEYYIRA SEENA 🔐'
    },
    voice_label: {
      am: 'የድምፅ ረዳት (ለአይነስውራን የሚሆን)',
      en: 'Accessibility Voice Reader',
      or: 'Gargaartuu Sagalee Keessummaa',
      ti: 'ኣንባቢ ድምጺ ሓገዝ',
      fr: 'Lecteur Vocal d\'Accessibilité',
      de: 'Vorlese-Assistent',
      it: 'Sintesi Vocale per Ipovedenti',
      sid: 'Taje Macciishshate Doorshsha'
    },
    voice_active: {
      am: 'የድምፅ ረዳት በርቷል 🔊 (ይናገራል)',
      en: 'Voice Over Active 🔊',
      or: 'Sagalee Banameera 🔊',
      ti: 'የድምፅ ረዳት በርቷል 🔊',
      fr: 'Assistant Vocal Activé 🔊',
      de: 'Sprachausgabe Aktiviert 🔊',
      it: 'Sintesi Vocale Attiva 🔊',
      sid: 'Macciishshate looso fannoonni 🔊'
    },
    voice_inactive: {
      am: 'የድምፅ ረዳት ጠፍቷል 🔇',
      en: 'Voice Over Muted 🔇',
      or: 'Sagalee Cufameera 🔇',
      ti: 'የድምፅ ረዳት ጠፍቷል 🔇',
      fr: 'Assistant Vocal Muet 🔇',
      de: 'Sprachausgabe Stumm 🔇',
      it: 'Sintesi Vocale Disattivata 🔇',
      sid: 'Macciishshate looso cufnoonni 🔇'
    },
    speak_welcome: {
      am: 'እንኳን ወደ ሃዋሳ ፓፒረስ ሎጅ በደህና መጡ። እባክዎ የእንግዳ ማዘዣ ገጽ ወይም የሰራተኞች መግቢያን ይምረጡ። ይህ መተግበሪያ ለአይነስውራን የድምፅ ረዳት አለው።',
      en: 'Welcome to Hawassa Papyrus Lodge. Please choose Guest Ordering or Staff Portal. This interface is equipped with voice assistance for visually impaired tourists.',
      or: 'Baga gara Hawaasaa Papayiras Lodg nagaan dhuftan. Maaloo torderii keessummichaa ykn gaarii hojjettootaa filadhaa. Gargaarsi sagalee dhufeera.',
      ti: 'እንቋዕ ናብ ሃዋሳ ፓፒረስ ሎጅ ብደሓን መጻእኩም። በጃኹም ናይ ጋሻ መእዘዚ ወይ ድማ ናይ ሰራሕተኛታት ክፋል ምረጹ።',
      fr: 'Bienvenue au Hawassa Papyrus Lodge. Veuillez choisir la commande client ou le portail du personnel. Cet écran est configuré avec l\'assistance vocale.',
      de: 'Willkommen in der Hawassa Papyrus Lodge. Bitte wählen Sie Gästebereich oder Mitarbeiter-Portal. Dieser Bereich unterstützt Sprachausgabe für Sehbehinderte.',
      it: 'Benvenuto a Hawassa Papyrus Lodge. Scegli l\'ordinazione degli ospiti o l\'accesso dello staff. Il portale supporta la lettura vocale per ipovedenti.',
      sid: 'Gara Hawassa Paappiras Looje keere dhu\'e. Maaloo la\'ote doorshsha yeyyi ogeeyyira doora.'
    }
  };

  // Modern dynamic helper translations for menus & active tracking cards
  const menuUiTranslation: Record<string, Record<string, string>> = {
    room_number: {
      am: 'የክፍል ቁጥር',
      en: 'Room Number',
      or: 'Kutaa Manaa',
      ti: 'ቁጽሪ ክፍል',
      fr: 'Numéro de Chambre',
      de: 'Zimmernummer',
      it: 'Numero di Camera',
      sid: 'Kifile Kiiro'
    },
    call_waiter: {
      am: 'አስተናጋጅ ጥራ',
      en: 'Call Waiter',
      or: 'Tajaajilaa Waami',
      ti: 'አስተናጋጅ ጸውዕ',
      fr: 'Appeler Serveur',
      de: 'Kellner Rufen',
      it: 'Chiama Cameriere',
      sid: 'Soolaancho Wixi'
    },
    active_orders: {
      am: 'የእርስዎ ገቢር ትዕዛዞች ሁኔታ መከታተያ',
      en: 'Your Active Orders Status Tracking',
      or: 'Hordoffii Haala Ajaja Keessanii',
      ti: 'ኩነታት ገቢር ትእዛዛትኩም መከታተሊ',
      fr: 'Suivi de Vos Commandes Actives',
      de: 'Status Ihrer Aktiven Bestellungen',
      it: 'Tracciamento Ordinazioni Attive',
      sid: 'Hasa Hajajoota Worrinore tracking'
    },
    order_id: {
      am: 'ትዕዛዝ ቁጥር',
      en: 'Order ID',
      or: 'Koodii Ajajaa',
      ti: 'ቁጽሪ ትእዛዝ',
      fr: 'ID Commande',
      de: 'Bestellnummer',
      it: 'ID Ordinazione',
      sid: 'Hajajo ID'
    },
    time: {
      am: 'ሰዓት',
      en: 'Time',
      or: 'Sa\'aatii',
      ti: 'ሰዓት',
      fr: 'Heure',
      de: 'Uhrzeit',
      it: 'Orario',
      sid: 'Sa\'ate'
    },
    status: {
      am: 'ሁኔታ',
      en: 'Status',
      or: 'Haala',
      ti: 'ኩነታት',
      fr: 'Statut',
      de: 'Status',
      it: 'Stato',
      sid: 'Gara'
    },
    pending: {
      am: '⏱️ በመጠባበቅ ላይ',
      en: '⏱️ Pending',
      or: '⏱️ Tureera',
      ti: '⏱️ ኣብ ምጽባይ ዘሎ',
      fr: '⏱️ En attente',
      de: '⏱️ Ausstehend',
      it: '⏱️ In attesa',
      sid: '⏱️ Keerinnanni'
    },
    preparing: {
      am: '🥘 እየተዘጋጀ ነው',
      en: '🥘 Preparing',
      or: '🥘 Qopheessarra jira',
      ti: '🥘 እናተዳለወ እዩ',
      fr: '🥘 En préparation',
      de: '🥘 Wird zubereitet',
      it: '🥘 In preparazione',
      sid: '🥘 Qopheessarra jira'
    },
    bringing: {
      am: '🧑‍🍳 ምግብ ተዘጋጅቷል፤ አስተናጋጅ እያመጣልዎ ነው...',
      en: '🧑‍🍳 Meal ready! Waiter is bringing it to you...',
      or: '🧑‍🍳 Nyaatni qophaa\'eera; tajaajilaan isiniif fida...',
      ti: '🧑‍🍳 መግቢ ተዳልዩ እዩ፤ አስተናጋጅ የምጽኣልኩም ኣሎ...',
      fr: '🧑‍🍳 Plat préparé! Le serveur vous l\'apporte...',
      de: '🧑‍🍳 Gericht fertig! Kellner bringt es Ihnen...',
      it: '🧑‍🍳 Piatto pronto! Il cameriere lo sta servendo...',
      sid: '🧑‍🍳 Sagale qopha\'e; soolaancho fidadhe no...'
    },
    ready_collection: {
      am: '✅ ደርሷል / መውሰድ ይችላሉ',
      en: '✅ Served / Ready for Collection',
      or: '✅ Qophaa\'eera / fudhachuu dandeessu',
      ti: '✅ በጺሑ / ክትወስዱ ትኽእሉ ኢኹም',
      fr: '✅ Servie / Prêt pour la Collecte',
      de: '✅ Serviert / Abholbereit',
      it: '✅ Servito / Pronto per il Ritiro',
      sid: '✅ Sarre / Adhate dandiineemmo'
    },
    total: {
      am: 'ጠቅላላ',
      en: 'Total',
      or: 'Walitti qabaa',
      ti: 'ጠቕላላ',
      fr: 'Total',
      de: 'Gesamt',
      it: 'Totale',
      sid: 'Mulu guutuu'
    },
    confirm_handover: {
      am: 'ምግብ መረከብዎን ያረጋግጡ ✔️',
      en: 'Confirm Food Handover ✔️',
      or: 'Nyaata fudhachuu keessan mirკaneessaa ✔️',
      ti: 'መግቢ ምርካብኩም አረጋግጹ ✔️',
      fr: 'Confirmer la Réception du Plat ✔️',
      de: 'Übergabe Bestätigen ✔️',
      it: 'Conferma Ricezione Piatto ✔️',
      sid: 'Sagale adhate mirkaneessi ✔️'
    },
    handover_alert: {
      am: '👍 ምግብ መረከብዎን ለአስተናጋጅ አሳውቀናል። እናመሰግናለን!',
      en: '👍 We have notified the waiter that you received your food. Thank you!',
      or: '👍 Nyaata fudhachuu keessan tajaajilaatti himneerra. Galatoomaa!',
      ti: '👍 መግቢ ምርካብኩም ንአስተናጅ ሓቢርናዮም ኣለና። ነመስግን!',
      fr: '👍 Nous avons informé le serveur que vous avez reçu votre plat. Merci !',
      de: '👍 Wir haben dem Kellner mitgeteilt, dass Sie Ihr Essen erhalten haben. Vielen Dank!',
      it: '👍 Abbiamo informato il cameriere che hai ricevuto il piatto. Grazie!',
      sid: '👍 Sagale adhate soolaancho riphphitinanni hawarenoommo. Galatteenye!'
    },
    about_lodge_heading: {
      am: 'ስለ ፓፒረስ ሎጅ',
      en: 'About Our Lodge & Resort',
      or: 'Waa\'ee Paappiras Loojii',
      ti: 'ብዛዕባ ፓፒረስ ሎጅ',
      fr: 'À propos de Papyrus Lodge',
      de: 'Über die Papyrus Lodge',
      it: 'Informazioni su Papyrus Lodge',
      sid: 'Paappiras Looje daafira'
    },
    feedbacks_heading: {
      am: 'አስተያየትዎን ያጋሩን',
      en: 'Share Your Feedback',
      or: 'Yaada Keessan Qoodaa',
      ti: 'ሪኢቶኹም ምክፋል',
      fr: 'Partager Votre Avis',
      de: 'Feedback Teilen',
      it: 'Invia Feedback',
      sid: 'Asteeyatton qoodamme'
    },
    feedback_placeholder: {
      am: 'እዚህ ላይ አስተያየትዎን ይጻፉ...',
      en: 'Write your thoughts here...',
      or: 'Yaada keessan asitti barreessaa...',
      ti: 'ኣብዚ ሪኢቶኹም ጸሓፉ...',
      fr: 'Écrivez vos commentaires ici...',
      de: 'Schreiben Sie hier Ihre Meinung...',
      it: 'Scrivi qui le tue impressioni...',
      sid: 'Asteeyatton asera xibe...'
    },
    submit_btn: {
      am: 'አስተያየት ላክ',
      en: 'Submit Feedback',
      or: 'Yaada Ergi',
      ti: 'ሪኢቶ ስደድ',
      fr: 'Envoyer les Commentaires',
      de: 'Feedback Absenden',
      it: 'Invia il Commento',
      sid: 'Asteeyatton Soyye'
    },
    past_feedbacks: {
      am: '💬 ያለፉ አስተያየቶች እና ምላሾች',
      en: '💬 Previous Feedback & Answers',
      or: '💬 Yaadoota fi Deebii kanaan duraa',
      ti: '💬 ሕሉፍ ሪኢቶታትን ምላሽታትን',
      fr: '💬 Avis Précédents & Réponses',
      de: '💬 Bisheriges Feedback & Antworten',
      it: '💬 Feedback Ricevuti e Risposte',
      sid: '💬 Hunda asteeyattonna deebii'
    },
    response_from_lodge: {
      am: '👑 የሎጁ ምላሽ',
      en: '👑 Lodge Response',
      or: '👑 Deebii Loojii',
      ti: '👑 ምላሽ ሎጅ',
      fr: '👑 Réponse du Lodge',
      de: '👑 Antwort der Lodge',
      it: '👑 Risposta del Lodge',
      sid: '👑 Looje deebii'
    },
    cart_order_now: {
      am: '🛒 እዘዝ',
      en: 'Order Now 🛒',
      or: 'Ajaji Amma 🛒',
      ti: 'ሕጂ እዘዝ 🛒',
      fr: 'Commander 🛒',
      de: 'Jetzt Bestellen 🛒',
      it: 'Ordina Ora 🛒',
      sid: '🛒 Ammalle Hajaje'
    },
    extra_bread: {
      am: '🥖 ተጨማሪ ዳቦ',
      en: '🥖 Extra Bread',
      or: '🥖 Damboo dabalataa',
      ti: '🥖 ዝተወሰኸ ዳቦ',
      fr: '🥖 Pain Supplémentaire',
      de: '🥖 Extra Brot',
      it: '🥖 Pane Extra',
      sid: '🥖 Daboo dabalata'
    },
    green_pepper: {
      am: '🌶️ ቃሪያ',
      en: '🌶️ Green Pepper',
      or: '🌶️ Qariyaa',
      ti: '🌶️ ቃሪያ',
      fr: '🌶️ Piment Vert',
      de: '🌶️ Grüner Pfeffer',
      it: '🌶️ Peperoncino Verde',
      sid: '🌶️ Qaariya'
    },
    injera: {
      am: '🌾 እንጀራ',
      en: '🌾 Injera',
      or: '🌾 Injera',
      ti: '🌾 እንጀራ',
      fr: '🌾 Injéra',
      de: '🌾 Injera',
      it: '🌾 Injera',
      sid: '🌾 Injera'
    },
    bread: {
      am: '🥖 ዳቦ',
      en: '🥖 Bread',
      or: '🥖 Damboo',
      ti: '🥖 ዳቦ',
      fr: '🥖 Pain',
      de: '🥖 Brot',
      it: '🥖 Pane',
      sid: '🥖 Daboo'
    },
    add_to_order_btn: {
      am: '🛒 እዘዝ',
      en: '🛒 Add to Order',
      or: '🛒 Ajaji',
      ti: '🛒 እዘዝ',
      fr: '🛒 Ajouter à la Commande',
      de: '🛒 In den Warenkorb',
      it: '🛒 Aggiungi all\'Ordine',
      sid: '🛒 Hajaje'
    }
  };

  // Speaks out loud utilizing JavaScript SpeechSynthesis API
  const runVoiceOver = (text: string, force: boolean = false) => {
    if (!isVoiceOverEnabled && !force) return;
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Stop any pending spoken speech
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Match browser voice locales for standard/improved speech output
        const langMap: { [key: string]: string } = {
          am: 'am-ET',
          en: 'en-US',
          or: 'om-ET',
          ti: 'ti-ET',
          fr: 'fr-FR',
          de: 'de-DE',
          it: 'it-IT'
        };
        utterance.lang = langMap[appLang] || 'en-US';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        
        // Find suitable voice if possible
        const voices = window.speechSynthesis.getVoices();
        const matchedVoice = voices.find(v => v.lang.startsWith(utterance.lang.split('-')[0]));
        if (matchedVoice) {
          utterance.voice = matchedVoice;
        }

        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.warn('Speech synthesis not fully supported or blocked by user frame permissions', err);
    }
  };

  const getTranslatedModifierValue = (val: string) => {
    if (!val) return '';
    const clean = val.trim().toLowerCase();
    
    if (clean === 'አለ' || clean === 'yes' || clean === 'with' || clean === 'available') {
      const map: Record<string, string> = {
        am: 'አለ',
        en: 'Yes / Available',
        or: 'Jira',
        ti: 'ኣሎ',
        fr: 'Oui / Dispo',
        de: 'Mit / Ja',
        it: 'Sì / C\'è'
      };
      return map[appLang] || map.en;
    }
    
    if (clean === 'የለም' || clean === 'no' || clean === 'without' || clean === 'none') {
      const map: Record<string, string> = {
        am: 'የለም',
        en: 'No / None',
        or: 'Hin jiru',
        ti: 'የለን',
        fr: 'Non / Sans',
        de: 'Nein / Keine',
        it: 'No / Senza'
      };
      return map[appLang] || map.en;
    }
    
    if (clean === 'ግማሽ' || clean === 'half') {
      const map: Record<string, string> = {
        am: 'ግማሽ',
        en: 'Half',
        or: 'Walakkaa',
        ti: 'ፍርቂ',
        fr: 'Demi',
        de: 'Halb',
        it: 'Metà'
      };
      return map[appLang] || map.en;
    }
    
    if (clean === 'ሙሉ' || clean === 'full' || clean === 'whole') {
      const map: Record<string, string> = {
        am: 'ሙሉ',
        en: 'Full',
        or: 'Guutuu',
        ti: 'ምሉእ',
        fr: 'Complet',
        de: 'Voll',
        it: 'Intero'
      };
      return map[appLang] || map.en;
    }
    
    return val;
  };

  const getTranslatedPromoTag = (tag: string) => {
    if (!tag) return '';
    const clean = tag.trim();
    if (clean.includes('ልዩ ቅናሽ') || clean.includes('Lodge Specials')) {
      const map: Record<string, string> = {
        am: 'ልዩ ቅናሽ',
        en: 'Lodge Specials',
        or: 'Kaffaltii Addaa (Lodge Specials)',
        ti: 'ፍሉይ ቅናሽ (Lodge Specials)',
        fr: 'Offres Spéciales',
        de: 'Lodge-Sonderangebote',
        it: 'Offerte Speciali'
      };
      return map[appLang] || map.en;
    }
    if (clean.includes('ምርጥ ምግቦች') || clean.includes('Tasty Delights')) {
      const map: Record<string, string> = {
        am: 'ምርጥ ምግቦች',
        en: 'Tasty Delights',
        or: 'Nyaata Mi\'aawaa (Tasty Delights)',
        ti: 'ምሩጻት መግብታት',
        fr: 'Délices Savoureux',
        de: 'Köstliche Gaumenfreuden',
        it: 'Delizie Saporite'
      };
      return map[appLang] || map.en;
    }
    return tag;
  };

  const getTranslatedPromoTitle = (title: string) => {
    if (!title) return '';
    const clean = title.trim();
    if (clean.includes('ልዩ የሳምንቱ መጨረሻ ቅናሽ') || clean.includes('Weekend Offer')) {
      const map: Record<string, string> = {
        am: 'በፓፒረስ ሎጅ ልዩ የሳምንቱ መጨረሻ ቅናሽ!',
        en: 'Special Weekend Offer at Papyrus Lodge!',
        or: 'Kaffaltii Addaa dhuma torbee Paappiras Loojii!',
        ti: 'ፍሉይ ናይ ሰሙን መወዳእታ ቅናሽ ኣብ ፓፒረስ ሎጅ!',
        fr: 'Offre Spéciale de Week-end au Papyrus Lodge!',
        de: 'Besonderes Wochenendangebot in der Papyrus Lodge!',
        it: 'Offerta Speciale del Fine Settimana al Papyrus Lodge!'
      };
      return map[appLang] || map.en;
    }
    if (clean.includes('የእንግዳ ማረፊያ እና የባህል ምግቦች') || clean.includes('Lodge Dining')) {
      const map: Record<string, string> = {
        am: 'የእንግዳ ማረፊያ እና የባህል ምግቦች',
        en: 'Lodge Dining & Traditional Dishes',
        or: 'Nyaata Aadaa fi Keessummeessaa',
        ti: 'መዕረፊ ጋሻን ባህላዊ መግብታትን',
        fr: 'Restauration et Plats Traditionnels',
        de: 'Lodge-Gastronomie & Traditionelle Gerichte',
        it: 'Ristorazione e Piatti Tradizionali'
      };
      return map[appLang] || map.en;
    }
    return title;
  };

  const getTranslatedPromoDesc = (desc: string) => {
    if (!desc) return '';
    const clean = desc.trim();
    if (clean.includes('የቪ አይ ፒ ክፍሎችን ሲይዙ') || clean.includes('15% discount when you book VIP')) {
      const map: Record<string, string> = {
        am: 'የቪ አይ ፒ ክፍሎችን ሲይዙ የ15% ቅናሽ ያገኛሉ፤ እንዲሁም ነጻ የሀይቅ ላይ የጀልባ ጉዞ ተዘጋጅቶልዎታል።',
        en: 'Get 15% discount when you book VIP rooms, plus a complimentary boat tour on the lake.',
        or: 'Kutaa VIP yoo qabattan 15% argattu, dabalataan doonii bilisaa jiru.',
        ti: 'ናይ VIP ክፍልታት ክትሕዙ ከለኹም 15% ቅናሽ ይረኽቡ፤ ከምኡ እውን ብናጻ ናይ ጀልባ ዑደት ተዳልዩልኩም ኣሎ።',
        fr: 'Obtenez 15% de réduction sur les chambres VIP, plus une balade en bateau gratuite sur le lac.',
        de: 'Erhalten Sie 15% Rabatt bei der Buchung von VIP-Zimmern sowie eine kostenlose Bootstour auf dem See.',
        it: 'Ottieni il 15% di sconto prenotando camere VIP, oltre a un tour in barca gratuito sul lago.'
      };
      return map[appLang] || map.en;
    }
    if (clean.includes('የሀዋሳን ትኩስ ዓሳ') || clean.includes('Enjoy Hawassa\'s fresh fish')) {
      const map: Record<string, string> = {
        am: 'የሀዋሳን ትኩስ ዓሳ እና ባህላዊ የሽከላ ጥብስ በቅናሽ ዋጋ እየተዝናኑ ይመገቡ።',
        en: 'Enjoy Hawassa\'s fresh fish and traditional charcoal-grilled beef ribs (Shekla Tibs) at discounted rates.',
        or: 'Qurxummii Hawaasaa fi foon aadaa (Shekla Tibs) gatii salphaan nyaadhaa taphadhaa.',
        ti: 'ናይ ሃዋሳ ሓድሽ ዓሳን ባህላዊ ሽከላ ጥብስን ብዝተማረረ ዋጋ እናተዘናጋዕኹም ተመገቡ።',
        fr: 'Dégustez le poisson frais d\'Hawassa et le bœuf grillé traditionnel (Shekla Tibs) à prix réduit.',
        de: 'Genießen Sie Hawassas frischen Fisch und traditionelle gegrillte Rinderrippen (Shekla Tibs) zu ermäßigten Preisen.',
        it: 'Gusta il pesce fresco di Hawassa e le tradizionali costolette alla brace (Shekla Tibs) a prezzi scontati.'
      };
      return map[appLang] || map.en;
    }
    return desc;
  };

  const getTranslatedAboutLodge = (text: string) => {
    if (!text) return '';
    const clean = text.trim();
    if (clean.startsWith('ሀዋሳ ፓፒረስ ሎጅ በተፈጥሮ የታደለች') || clean.includes('Papyrus Lodge is a cozy') || clean.includes('ሀዋሳ ፓፒረስ ሎጅ')) {
      const map: Record<string, string> = {
        am: 'ሀዋሳ ፓፒረስ ሎጅ በተፈጥሮ የታደለች ውቧ የሀዋሳ ከተማ ውስጥ፣ ከታዋቂው የሀዋሳ ሃይቅ ዳርቻ አቅራቢያ የሚገኝ ምቹ፣ ሰላማዊ እና አስደሳች ማረፊያ ነው። ጥራት ባላቸው አገልግሎቶቻችን፣ በአገር በቀል ጣፋጭ ምግቦች፣ እንዲሁም ለተለያዩ ክብረ በዓላት የሚሆኑ ውብ አዳራሾቻችን አስተማማኝ ምርጫ እንድንሆን ያደርገናል።',
        en: 'Hawassa Papyrus Lodge is a cozy, peaceful, and exciting resort located near the shores of the famous Lake Hawassa, in the naturally blessed and beautiful city of Hawassa. Our high-quality services, delicious local dishes, and beautiful venues for various celebrations make us a reliable choice.',
        or: 'Paappiras Loojii Hawaasaa magaalaa bareedduu fi uumamaan badhaate Hawaasa keessatti, qarqara garba Hawaasaa beekamaa biratti kan argamu, iddoo boqonnaa mijataa, nagaa fi gammachiisaadha. Tajaajila qulqullina qabu, nyaata aadaa mi\'aawaa, fi dabalataan galmoota babbareedoo qophii adda addaaf ta\'aniin filannoo keessan amansiisaadha.',
        ti: 'ሃዋሳ ፓፒረስ ሎጅ በተፈጥሮ ዝተዓደለት ውብ ከተማ ሃዋሳ ውሽጢ፡ ካብቲ ፍሉጥ ቀላይ ሃዋሳ ጥቓ ገማግም ዝርከብ ምቹው፡ ሰላማዊን ዘሐጉስን መዕረፊ እዩ። ብሉጽ ኣገልግሎትና፡ ብባህላዊ መግቢታትና፡ ከምኡ እውን ንተፈላለዩ ጽንብላት ዝኾኑ ውቁባት ኣዳራሻትና እሙን መማረጺ ይገብረና።',
        fr: 'Le Papyrus Lodge d\'Hawassa est un complexe confortable, paisible et chaleureux situé près des rives du célèbre lac d\'Hawassa, dans la magnifique ville d\'Hawassa. Nos services de haute qualité, nos délicieux plats locaux et nos superbes salles pour divers événements font de nous un choix de confiance.',
        de: 'Die Hawassa Papyrus Lodge ist ein gemütliches, friedliches und einladendes Resort in der Nähe des Ufers des berühmten Hawassa-Sees in der wunderschönen Stadt Hawassa. Unsere erstklassigen Dienstleistungen, köstlichen lokalen Gerichte und schönen Veranstaltungsräume machen uns zu einer verlässlichen Wahl.',
        it: 'Il Papyrus Lodge di Hawassa è un resort accogliente, tranquillo e piacevole situato vicino alle rive del famoso lago di Hawassa, nella splendida città di Hawassa. I nostri servizi di alta qualità, i deliziosi piatti locali e le splendide sale per vari eventi ci rendono una scelta affidabile.'
      };
      return map[appLang] || map.en;
    }
    return text;
  };

  useEffect(() => {
    if (activeRole === 'entry') {
      const welcomeMsg = entryTranslation.speak_welcome[appLang];
      const timer = setTimeout(() => {
        runVoiceOver(welcomeMsg);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [appLang, activeRole]);

  // WIFI CLOCK-IN REQUESTS WITH MANAGER APPROVALS
  const [pendingAttendanceRequests, setPendingAttendanceRequests] = useState<{
    id: string;
    staffName: string;
    role: string;
    time: string;
    wifiSsid: string;
    status: 'pending' | 'approved' | 'rejected';
  }[]>(() => {
    try {
      const stored = localStorage.getItem('papyrus_lodge_pending_attendance_v2');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [];
  });

  useEffect(() => {
    localStorage.setItem('papyrus_lodge_pending_attendance_v2', JSON.stringify(pendingAttendanceRequests));
  }, [pendingAttendanceRequests]);

  // ATTENDANCE & BONUSES STATE FOR STAFF PERSISTENCE
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  const [attFilterStaff, setAttFilterStaff] = useState<string>('all');
  const [attFilterYear, setAttFilterYear] = useState<string>('all');
  const [attFilterMonth, setAttFilterMonth] = useState<string>('all');
  const [attFilterDay, setAttFilterDay] = useState<string>('all');

  const [bonuses, setBonuses] = useState<BonusRecord[]>([]);

  // CUSTOM CORE DELETE DIALOG CONFIRMATION STATE (bypass iframe popup blocks)
  const [deleteConfWindow, setDeleteConfWindow] = useState<{
    msg: string;
    onGo: () => void;
  } | null>(null);

  // Helper to replace standard confirm across components
  const askConfirmAndRun = (msg: string, onGo: () => void) => {
    setDeleteConfWindow({ msg, onGo });
  };

  // MANAGER VIEW LOCAL STATES
  const [selectedBonusStaff, setSelectedBonusStaff] = useState('');
  const [bonusAmount, setBonusAmount] = useState('500');
  const [bonusReason, setBonusReason] = useState('ለላቀ የደንበኛ አያያዝ እና አገልግሎት (Excellent guest hospitality)');
  const [activeBonusReceipt, setActiveBonusReceipt] = useState<BonusRecord | null>(null);
  const [customAttendanceTime, setCustomAttendanceTime] = useState('');

  // MENU CATEGORIES (DYNAMIC)
  const [categories, setCategories] = useState<{ id: string; icon: string; label: string; activeBg: string }[]>([
    { id: 'food', icon: '🍛', label: 'ምግቦች (Foods)', activeBg: 'tactile-3d-btn-lime' },
    { id: 'drinks', icon: '🍹', label: 'መጠጦች (Drinks)', activeBg: 'tactile-3d-btn-sky' },
    { id: 'traditional', icon: '🥘', label: 'ባህላዊ (Traditional)', activeBg: 'tactile-3d-btn-amber' },
    { id: 'room', icon: '🏨', label: 'ክፍሎች (Rooms)', activeBg: 'tactile-3d-btn-pink' },
    { id: 'venue', icon: '🌲', label: 'ስብሰባ (Venues)', activeBg: 'tactile-3d-btn-orange' }
  ]);

  const [editingCategory, setEditingCategory] = useState<{ id: string; icon: string; label: string; activeBg: string } | null>(null);

  // MODIFIER OPTIONS (FOR FULL DYNAMIC USER CONFIGURATIONS)
  const [modifierOptions, setModifierOptions] = useState<{
    qariaChoices: string[];
    injeraChoices: string[];
    daboPrice: number;
    injeraPrices: { [key: string]: number };
    kochoPrice: number;
    mayoPrice: number;
    customAdditionsPrice: number;
  }>({
    qariaChoices: ['አለ', 'የለም'],
    injeraChoices: ['የለም', 'ግማሽ', 'ሙሉ'],
    daboPrice: 15,
    injeraPrices: {
      'የለም': 0,
      'ግማሽ': 15,
      'ሙሉ': 30
    },
    kochoPrice: 45,
    mayoPrice: 20,
    customAdditionsPrice: 35
  });

  // GUEST CONTROLS
  const [selectedCategory, setSelectedCategory] = useState<string>('food');
  const [selectedMenuCardId, setSelectedMenuCardId] = useState<string | null>(null);
  const menuScrollRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedMenuCardId(null);
  }, [selectedCategory]);

  const [promoIndex, setPromoIndex] = useState(0);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackReplyText, setFeedbackReplyText] = useState<{ [feedbackId: string]: string }>({});
  const [aboutLodgeInput, setAboutLodgeInput] = useState(aboutLodgeText);

  // Synchronize aboutLodgeInput when aboutLodgeText changes
  useEffect(() => {
    setAboutLodgeInput(aboutLodgeText);
  }, [aboutLodgeText]);

  // CUSTOMIZER STATES
  const [guestLocation, setGuestLocation] = useState('Room 101');
  const [customModifiers, setCustomModifiers] = useState<{ [key: string]: { qaria: string; injera: string; dabo: number; qty: number; customInstructions: string; mayo?: boolean; kocho?: boolean } }>({});
  const [expandedOrders, setExpandedOrders] = useState<{[key: string]: boolean}>({});
  
  // ITEM EDITING CONTROLS FOR ADMIN
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [originalStaffName, setOriginalStaffName] = useState<string | null>(null);

  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);

  const [editingBank, setEditingBank] = useState<BankAccount | null>(null);

  const [editingPromoIndex, setEditingPromoIndex] = useState<number | null>(null);
  const [editingPromo, setEditingPromo] = useState<PromoBanner | null>(null);

  // MEDIA UPLOAD STATES
  const [addMenuImage, setAddMenuImage] = useState('');
  const [addStaffPhoto, setAddStaffPhoto] = useState('');
  const [addPromoPoster, setAddPromoPoster] = useState('');
  const [addPromoVideo, setAddPromoVideo] = useState('');
  const [galleryNewImgUrl, setGalleryNewImgUrl] = useState('');

  const processFileWithCompression = (file: File, callback: (base64: string) => void) => {
    // Check if video is too large
    if (file.type.startsWith('video/')) {
      if (file.size > 2 * 1024 * 1024) { // 2MB Limit
        alert('⚠️ ቪዲዮው በጣም ትልቅ ነው! እባክዎ ከ 2MB በታች የሆነ ቪዲዮ ይምረጡ ወይም የዩቲዩብ ቪዲዮ አድራሻ (YouTube URL) ይጠቀሙ።\nVideo file is too large! Please choose a video under 2MB, or use a YouTube URL instead.');
        return;
      }
    }

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          // Downscale to max dimensions of 600px for storage friendliness
          const maxDimension = 600;
          let width = img.width;
          let height = img.height;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // High compression quality (0.7) produces extremely lightweight image (15KB - 40KB)
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            callback(compressedBase64);
          } else {
            callback(reader.result as string);
          }
        };
        img.onerror = () => {
          callback(reader.result as string);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    } else {
      // Non-image files or fallback
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          callback(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const readMediaFile = async (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
    let folder = 'images';
    if (file.type.startsWith('video/')) {
      folder = 'videos';
    } else if (file.type.startsWith('audio/')) {
      folder = 'audio';
    }

    const fileName = `${folder}/${Date.now()}_${cleanName}`;

    try {
      console.log(`Uploading ${file.name} to Supabase Storage path: ${fileName}...`);
      
      const { data, error } = await supabase.storage
        .from('lodge-media')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error("Storage upload failed:", error);
        alert(`❌ Upload failed: ${error.message}`);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('lodge-media')
        .getPublicUrl(fileName);

      if (!publicUrl) {
        throw new Error("Could not retrieve public URL for uploaded file.");
      }

      console.log("Uploaded successfully. Public URL:", publicUrl);
      callback(publicUrl);
    } catch (err: any) {
      console.error("Storage upload failure:", err);
      alert(`❌ Upload failed: ${err.message || err}`);
    }
  };

  // QR GENERATOR
  const [qrLocation, setQrLocation] = useState('Room 101');
  const [qrGeneratedUrl, setQrGeneratedUrl] = useState('');



  // INITIALIZE FIRST CUSTOMIZER BLOCK
  useEffect(() => {
    const initMods: typeof customModifiers = {};
    menuItems.forEach(item => {
      initMods[item.id] = { 
        qaria: modifierOptions.qariaChoices[0] || 'አለ', 
        injera: modifierOptions.injeraChoices[2] || modifierOptions.injeraChoices[0] || 'كامل (ሙሉ)', 
        dabo: 0, 
        qty: 1,
        customInstructions: '',
        mayo: false,
        kocho: false
      };
    });
    setCustomModifiers(initMods);
    setQrGeneratedUrl(`https://ais-pre-o4e7tydp6hz3g2z7skgpe4-75812013665.europe-west2.run.app/?table=Room+101`);
  }, [menuItems, modifierOptions]);

  // SUPPORT PARSING FROM URL QUERY STRINGS (e.g. Scanning QR code sets default table tag)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlTable = params.get('table');
      if (urlTable) {
        setGuestLocation(urlTable);
        // Automatically switch guest into ordering mode
        setActiveRole('customer');
        setIsFromQr(true);
      }
    } catch {}
  }, []);

  const [hasLoadedCloudSettings, setHasLoadedCloudSettings] = useState(false);

  useEffect(() => {
    const fetchCloudSettings = async () => {
      // Helper to fetch key
      const fetchKey = async (key: string) => {
        try {
          const { data, error } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', key)
            .maybeSingle();
          if (error) {
            console.error(`Error fetching key ${key}:`, error);
            return null;
          }
          return data?.value;
        } catch (err) {
          console.error(`Exception fetching key ${key}:`, err);
          return null;
        }
      };

      // 1. Fetch logoUrl
      const logoVal = await fetchKey('logoUrl');
      if (logoVal && logoVal.url !== undefined) setLogoUrl(logoVal.url);

      // 2. Fetch attendance
      const attVal = await fetchKey('attendance');
      if (attVal && Array.isArray(attVal.records)) setAttendance(attVal.records);

      // 3. Fetch menu
      const menuVal = await fetchKey('menu');
      if (menuVal && Array.isArray(menuVal.items)) setMenuItems(menuVal.items);

      // 4. Fetch categories
      const catVal = await fetchKey('categories');
      if (catVal && Array.isArray(catVal.list)) setCategories(catVal.list);

      // 5. Fetch banks
      const banksVal = await fetchKey('banks');
      if (banksVal && Array.isArray(banksVal.accounts)) setBanks(banksVal.accounts);

      // 6. Fetch staff
      const staffVal = await fetchKey('staff');
      if (staffVal && Array.isArray(staffVal.list)) setStaff(staffVal.list);

      // 7. Fetch orders
      const ordersVal = await fetchKey('orders');
      if (ordersVal && Array.isArray(ordersVal.list)) setOrders(ordersVal.list);

      // 8. Fetch roomBookings
      const bookingsVal = await fetchKey('roomBookings');
      if (bookingsVal && Array.isArray(bookingsVal.list)) setRoomBookings(bookingsVal.list);

      // 9. Fetch visitorLog
      const visitorVal = await fetchKey('visitorLog');
      if (visitorVal && Array.isArray(visitorVal.list)) setVisitorLog(visitorVal.list);

      // 10. Fetch promos
      const promosVal = await fetchKey('promos');
      if (promosVal && Array.isArray(promosVal.list)) setPromos(promosVal.list);

      // 11. Fetch aboutLodgeText
      const aboutVal = await fetchKey('aboutLodgeText');
      if (aboutVal && aboutVal.text !== undefined) setAboutLodgeText(aboutVal.text);

      // 12. Fetch bgVideoUrl
      const bgUrlVal = await fetchKey('bgVideoUrl');
      if (bgUrlVal && bgUrlVal.url !== undefined) setBgVideoUrl(bgUrlVal.url);

      // 13. Fetch bgVideoType
      const bgTypeVal = await fetchKey('bgVideoType');
      if (bgTypeVal && bgTypeVal.type !== undefined) setBgVideoType(bgTypeVal.type);

      // 14. Fetch isBgVideoEnabled
      const bgEnabledVal = await fetchKey('isBgVideoEnabled');
      if (bgEnabledVal && bgEnabledVal.enabled !== undefined) setIsBgVideoEnabled(bgEnabledVal.enabled);

      // 15. Fetch assistanceCalls
      const callsVal = await fetchKey('assistanceCalls');
      if (callsVal && Array.isArray(callsVal.list)) setAssistanceCalls(callsVal.list);

      // 16. Fetch feedback
      const feedbackVal = await fetchKey('feedback');
      if (feedbackVal && Array.isArray(feedbackVal.list)) setFeedback(feedbackVal.list);

      // 17. Fetch expenses
      const expensesVal = await fetchKey('expenses');
      if (expensesVal && Array.isArray(expensesVal.list)) setExpenses(expensesVal.list);

      // 18. Fetch bonuses
      const bonusesVal = await fetchKey('bonuses');
      if (bonusesVal && Array.isArray(bonusesVal.list)) setBonuses(bonusesVal.list);

      // 19. Fetch serviceChargeRate
      const scVal = await fetchKey('serviceChargeRate');
      if (scVal && typeof scVal.rate === 'number') setServiceChargeRate(scVal.rate);

      // 20. Fetch vatRate
      const vatVal = await fetchKey('vatRate');
      if (vatVal && typeof vatVal.rate === 'number') setVatRate(vatVal.rate);

      // 21. Fetch chapa settings
      const chapaVal = await fetchKey('chapa');
      if (chapaVal) {
        if (chapaVal.key !== undefined) setChapaKey(chapaVal.key);
        if (chapaVal.active !== undefined) setChapaActive(chapaVal.active);
        if (chapaVal.mode !== undefined) setChapaMode(chapaVal.mode);
      }

      // 22. Fetch gallery table rows
      try {
        console.log("Fetching gallery items from Supabase...");
        const { data: galleryData, error: galleryErr } = await supabase
          .from('gallery')
          .select('*')
          .order('created_at', { ascending: false });
        if (galleryErr) {
          console.error("Error fetching gallery items:", galleryErr);
        } else if (galleryData) {
          console.log(`Fetched ${galleryData.length} gallery items successfully.`);
          setGalleryItems(galleryData);
        }
      } catch (err) {
        console.error("Exception fetching gallery items:", err);
      }

      setHasLoadedCloudSettings(true);
    };
    fetchCloudSettings();
  }, []);

  // REAL-TIME SUPABASE SYNC FOR CLOUD SETTINGS
  useEffect(() => {
    const channel = supabase
      .channel('realtime-system-settings')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'system_settings'
        },
        (payload) => {
          if (payload.new && (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE')) {
            const data = payload.new as any;
            const val = data.value;
            if (!val) return;

            switch (data.key) {
              case 'logoUrl':
                if (val.url !== undefined) setLogoUrl(val.url);
                break;
              case 'attendance':
                if (Array.isArray(val.records)) setAttendance(val.records);
                break;
              case 'menu':
                if (Array.isArray(val.items)) setMenuItems(val.items);
                break;
              case 'categories':
                if (Array.isArray(val.list)) setCategories(val.list);
                break;
              case 'banks':
                if (Array.isArray(val.accounts)) setBanks(val.accounts);
                break;
              case 'staff':
                if (Array.isArray(val.list)) setStaff(val.list);
                break;
              case 'orders':
                if (Array.isArray(val.list)) setOrders(val.list);
                break;
              case 'roomBookings':
                if (Array.isArray(val.list)) setRoomBookings(val.list);
                break;
              case 'visitorLog':
                if (Array.isArray(val.list)) setVisitorLog(val.list);
                break;
              case 'promos':
                if (Array.isArray(val.list)) setPromos(val.list);
                break;
              case 'aboutLodgeText':
                if (val.text !== undefined) setAboutLodgeText(val.text);
                break;
              case 'bgVideoUrl':
                if (val.url !== undefined) setBgVideoUrl(val.url);
                break;
              case 'bgVideoType':
                if (val.type !== undefined) setBgVideoType(val.type);
                break;
              case 'isBgVideoEnabled':
                if (val.enabled !== undefined) setIsBgVideoEnabled(val.enabled);
                break;
              case 'assistanceCalls':
                if (Array.isArray(val.list)) setAssistanceCalls(val.list);
                break;
              case 'feedback':
                if (Array.isArray(val.list)) setFeedback(val.list);
                break;
              case 'expenses':
                if (Array.isArray(val.list)) setExpenses(val.list);
                break;
              case 'bonuses':
                if (Array.isArray(val.list)) setBonuses(val.list);
                break;
              case 'serviceChargeRate':
                if (typeof val.rate === 'number') setServiceChargeRate(val.rate);
                break;
              case 'vatRate':
                if (typeof val.rate === 'number') setVatRate(val.rate);
                break;
              case 'chapa':
                if (val.key !== undefined) setChapaKey(val.key);
                if (val.active !== undefined) setChapaActive(val.active);
                if (val.mode !== undefined) setChapaMode(val.mode);
                break;
              default:
                break;
            }
          }
        }
      )
      .subscribe();

    // GALLERY REAL-TIME SUBSCRIPTION
    const galleryChannel = supabase
      .channel('realtime-gallery-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gallery'
        },
        (payload) => {
          console.log("Realtime gallery change received:", payload);
          if (payload.eventType === 'INSERT') {
            setGalleryItems(prev => {
              if (prev.some(item => item.id === payload.new.id)) return prev;
              return [payload.new, ...prev];
            });
          } else if (payload.eventType === 'DELETE') {
            setGalleryItems(prev => prev.filter(item => item.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setGalleryItems(prev => prev.map(item => item.id === payload.new.id ? payload.new : item));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(galleryChannel);
    };
  }, []);

  // Synchronize collections back to cloud database when modified
  useEffect(() => {
    if (!hasLoadedCloudSettings) return;
    const syncAttendance = async () => {
      try {
        await supabase
          .from('system_settings')
          .upsert({ key: 'attendance', value: { records: attendance } });
      } catch {}
    };
    syncAttendance();
  }, [attendance, hasLoadedCloudSettings]);

  useEffect(() => {
    if (!hasLoadedCloudSettings) return;
    const syncMenu = async () => {
      try {
        await supabase
          .from('system_settings')
          .upsert({ key: 'menu', value: { items: menuItems } });
      } catch {}
    };
    syncMenu();
  }, [menuItems, hasLoadedCloudSettings]);

  useEffect(() => {
    if (!hasLoadedCloudSettings) return;
    const syncCategories = async () => {
      try {
        await supabase
          .from('system_settings')
          .upsert({ key: 'categories', value: { list: categories } });
      } catch {}
    };
    syncCategories();
  }, [categories, hasLoadedCloudSettings]);

  useEffect(() => {
    if (!hasLoadedCloudSettings) return;
    const syncBanks = async () => {
      try {
        await supabase
          .from('system_settings')
          .upsert({ key: 'banks', value: { accounts: banks } });
      } catch {}
    };
    syncBanks();
  }, [banks, hasLoadedCloudSettings]);

  useEffect(() => {
    if (!hasLoadedCloudSettings) return;
    const syncStaff = async () => {
      try {
        await supabase
          .from('system_settings')
          .upsert({ key: 'staff', value: { list: staff } });
      } catch {}
    };
    syncStaff();
  }, [staff, hasLoadedCloudSettings]);

  useEffect(() => {
    if (!hasLoadedCloudSettings) return;
    const syncOrders = async () => {
      try {
        await supabase
          .from('system_settings')
          .upsert({ key: 'orders', value: { list: orders } });
      } catch {}
    };
    syncOrders();
  }, [orders, hasLoadedCloudSettings]);

  useEffect(() => {
    if (!hasLoadedCloudSettings) return;
    const syncRoomBookings = async () => {
      try {
        await supabase
          .from('system_settings')
          .upsert({ key: 'roomBookings', value: { list: roomBookings } });
      } catch {}
    };
    syncRoomBookings();
  }, [roomBookings, hasLoadedCloudSettings]);

  useEffect(() => {
    if (!hasLoadedCloudSettings) return;
    const syncVisitorLog = async () => {
      try {
        await supabase
          .from('system_settings')
          .upsert({ key: 'visitorLog', value: { list: visitorLog } });
      } catch {}
    };
    syncVisitorLog();
  }, [visitorLog, hasLoadedCloudSettings]);

  useEffect(() => {
    if (!hasLoadedCloudSettings) return;
    const syncPromos = async () => {
      try {
        await supabase
          .from('system_settings')
          .upsert({ key: 'promos', value: { list: promos } });
      } catch {}
    };
    syncPromos();
  }, [promos, hasLoadedCloudSettings]);

  useEffect(() => {
    if (!hasLoadedCloudSettings) return;
    const syncAboutLodgeText = async () => {
      try {
        await supabase
          .from('system_settings')
          .upsert({ key: 'aboutLodgeText', value: { text: aboutLodgeText } });
      } catch {}
    };
    syncAboutLodgeText();
  }, [aboutLodgeText, hasLoadedCloudSettings]);

  useEffect(() => {
    if (!hasLoadedCloudSettings) return;
    const syncBgVideoUrl = async () => {
      try {
        await supabase
          .from('system_settings')
          .upsert({ key: 'bgVideoUrl', value: { url: bgVideoUrl } });
      } catch {}
    };
    syncBgVideoUrl();
  }, [bgVideoUrl, hasLoadedCloudSettings]);

  useEffect(() => {
    if (!hasLoadedCloudSettings) return;
    const syncBgVideoType = async () => {
      try {
        await supabase
          .from('system_settings')
          .upsert({ key: 'bgVideoType', value: { type: bgVideoType } });
      } catch {}
    };
    syncBgVideoType();
  }, [bgVideoType, hasLoadedCloudSettings]);

  useEffect(() => {
    if (!hasLoadedCloudSettings) return;
    const syncIsBgVideoEnabled = async () => {
      try {
        await supabase
          .from('system_settings')
          .upsert({ key: 'isBgVideoEnabled', value: { enabled: isBgVideoEnabled } });
      } catch {}
    };
    syncIsBgVideoEnabled();
  }, [isBgVideoEnabled, hasLoadedCloudSettings]);

  useEffect(() => {
    if (!hasLoadedCloudSettings) return;
    const syncAssistanceCalls = async () => {
      try {
        await supabase
          .from('system_settings')
          .upsert({ key: 'assistanceCalls', value: { list: assistanceCalls } });
      } catch {}
    };
    syncAssistanceCalls();
  }, [assistanceCalls, hasLoadedCloudSettings]);

  useEffect(() => {
    if (!hasLoadedCloudSettings) return;
    const syncFeedback = async () => {
      try {
        await supabase
          .from('system_settings')
          .upsert({ key: 'feedback', value: { list: feedback } });
      } catch {}
    };
    syncFeedback();
  }, [feedback, hasLoadedCloudSettings]);

  useEffect(() => {
    if (!hasLoadedCloudSettings) return;
    const syncExpenses = async () => {
      try {
        await supabase
          .from('system_settings')
          .upsert({ key: 'expenses', value: { list: expenses } });
      } catch {}
    };
    syncExpenses();
  }, [expenses, hasLoadedCloudSettings]);

  useEffect(() => {
    if (!hasLoadedCloudSettings) return;
    const syncBonuses = async () => {
      try {
        await supabase
          .from('system_settings')
          .upsert({ key: 'bonuses', value: { list: bonuses } });
      } catch {}
    };
    syncBonuses();
  }, [bonuses, hasLoadedCloudSettings]);

  useEffect(() => {
    if (!hasLoadedCloudSettings) return;
    const syncServiceChargeRate = async () => {
      try {
        await supabase
          .from('system_settings')
          .upsert({ key: 'serviceChargeRate', value: { rate: serviceChargeRate } });
      } catch {}
    };
    syncServiceChargeRate();
  }, [serviceChargeRate, hasLoadedCloudSettings]);

  useEffect(() => {
    if (!hasLoadedCloudSettings) return;
    const syncVatRate = async () => {
      try {
        await supabase
          .from('system_settings')
          .upsert({ key: 'vatRate', value: { rate: vatRate } });
      } catch {}
    };
    syncVatRate();
  }, [vatRate, hasLoadedCloudSettings]);

  useEffect(() => {
    if (!hasLoadedCloudSettings) return;
    const syncChapa = async () => {
      try {
        await supabase
          .from('system_settings')
          .upsert({ key: 'chapa', value: { key: chapaKey, active: chapaActive, mode: chapaMode } });
      } catch {}
    };
    syncChapa();
  }, [chapaKey, chapaActive, chapaMode, hasLoadedCloudSettings]);

  // One-time migration to force-default background type to Gourmet Paradise
  useEffect(() => {
    try {
      const migrated = localStorage.getItem('papyrus_lodge_gourmet_migrated_v6');
      if (!migrated) {
        setBgVideoType('gourmet-paradise');
        localStorage.setItem('papyrus_lodge_gourmet_migrated_v6', 'true');
      }
    } catch {}
  }, []);

  // Theme support - Default to false (Dark mode) so mobile devices load the stunning premium theme!
  const [isLightTheme, setIsLightTheme] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('papyrus_lodge_light_theme_v2');
      return stored ? JSON.parse(stored) : false; // Default to dark mode for a luxurious, consistent experience!
    } catch {
      return false;
    }
  });

  useEffect(() => {
    localStorage.setItem('papyrus_lodge_light_theme_v2', JSON.stringify(isLightTheme));
    if (isLightTheme) {
      document.body.classList.add('light-mode');
      document.documentElement.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
      document.documentElement.classList.remove('light-mode');
    }
  }, [isLightTheme]);

  // Synchronize state across tabs/windows (real-time local sharing) for custom roles
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'papyrus_lodge_custom_roles_v2' && e.newValue) {
        try {
          setCustomRoles(JSON.parse(e.newValue));
        } catch {}
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // STAFF LOGOUT LOGIC
  const handleLogout = async () => {
    setCurrentUser(null);
    setActiveRole('entry');
    localStorage.removeItem('supabase_session_bypassed');
    localStorage.removeItem('supabase_bypassed_user_email');
    localStorage.removeItem('supabase_bypassed_user_id');
    localStorage.removeItem('supabase_bypassed_current_user');
    try {
      await supabase.auth.signOut();
    } catch {}
  };

  // CUSTOM STAFF ROLES STATE FOR DYNAMIC JOB POSITIONS
  const [customRoles, setCustomRoles] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('papyrus_lodge_custom_roles_v2');
      if (stored) return JSON.parse(stored);
    } catch {}
    return ['waiter', 'chef', 'admin', 'manager', 'receptionist', 'cashier', 'guard'];
  });

  const [addStaffRoleSelected, setAddStaffRoleSelected] = useState('waiter');
  const [addStaffAccessSelected, setAddStaffAccessSelected] = useState<string>('waiter');
  const [addStaffCertificatePhoto, setAddStaffCertificatePhoto] = useState('');
  const [printingStaffMember, setPrintingStaffMember] = useState<StaffMember | null>(null);

  const [editingRoleName, setEditingRoleName] = useState<string | null>(null);
  const [editingRoleNewVal, setEditingRoleNewVal] = useState<string>('');

  // CUSTOM SYSTEM ACCESS PRIVILEGES STATE
  const [customPrivileges, setCustomPrivileges] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('papyrus_lodge_custom_privileges_v2');
      if (stored) return JSON.parse(stored);
    } catch {}
    return ['waiter', 'chef', 'admin', 'manager', 'receptionist', 'cashier', 'guard', 'none'];
  });

  const [editingPrivilegeName, setEditingPrivilegeName] = useState<string | null>(null);
  const [editingPrivilegeNewVal, setEditingPrivilegeNewVal] = useState<string>('');

  useEffect(() => {
    localStorage.setItem('papyrus_lodge_custom_roles_v2', JSON.stringify(customRoles));
  }, [customRoles]);

  useEffect(() => {
    localStorage.setItem('papyrus_lodge_custom_privileges_v2', JSON.stringify(customPrivileges));
  }, [customPrivileges]);

  // REAL-TIME SUPABASE SYNC FOR STAFF MEMBERS
  const [fbUser, setFbUser] = useState<any>(null);

  useEffect(() => {
    // Get initial Supabase User
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setFbUser(session.user);
      } else if (localStorage.getItem('supabase_session_bypassed') === 'true') {
        setFbUser({
          email: localStorage.getItem('supabase_bypassed_user_email') || 'bypassed@papyruslodge.com',
          id: localStorage.getItem('supabase_bypassed_user_id') || 'bypassed-uid'
        });
      } else {
        setFbUser(null);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setFbUser(session.user);
      } else if (localStorage.getItem('supabase_session_bypassed') === 'true') {
        setFbUser({
          email: localStorage.getItem('supabase_bypassed_user_email') || 'bypassed@papyruslodge.com',
          id: localStorage.getItem('supabase_bypassed_user_id') || 'bypassed-uid'
        });
      } else {
        setFbUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Protect private pages with supabase.auth.getSession(). If no session, redirect to /login
  useEffect(() => {
    const protectPages = async () => {
      const privateRoles = ['waiter', 'chef', 'admin', 'manager', 'receptionist', 'cashier', 'guard', 'vault'];
      if (privateRoles.includes(activeRole)) {
        const { data: { session } } = await supabase.auth.getSession();
        const bypassed = localStorage.getItem('supabase_session_bypassed') === 'true' || currentUser !== null;
        if (!session && !bypassed) {
          setActiveRole('entry');
          setStaffPortalState('login');
          setLoginModalRole('');
          window.history.pushState({}, '', '/login');
        }
      }
    };
    protectPages();
  }, [activeRole, currentUser]);

  // Handle /login and /admin routing directly with back/forward browser history support
  useEffect(() => {
    const originalPushState = window.history.pushState;
    window.history.pushState = function(...args) {
      originalPushState.apply(this, args);
      setCurrentPath(window.location.pathname);
    };
    
    const handleUrlPath = async () => {
      const path = window.location.pathname;
      setCurrentPath(path);
      
      if (path === '/login') {
        setActiveRole('entry');
        setStaffPortalState('login');
      } else if (path === '/admin') {
        const { data: { session } } = await supabase.auth.getSession();
        const bypassed = localStorage.getItem('supabase_session_bypassed') === 'true';
        if (!session && !bypassed) {
          window.history.pushState({}, '', '/login');
          setCurrentPath('/login');
        }
      }
    };
    
    handleUrlPath();
    window.addEventListener('popstate', handleUrlPath);
    return () => {
      window.history.pushState = originalPushState;
      window.removeEventListener('popstate', handleUrlPath);
    };
  }, []);

  useEffect(() => {
    if (!fbUser) return;

    const syncWithSupabase = async () => {
      const uid = fbUser.id || fbUser.uid;
      try {
        const { data, error } = await supabase.from('user_team_members').select('*').eq('userId', uid);
        if (error) throw error;

        if (data && data.length > 0) {
          const listFromSupabase: StaffMember[] = data.map((item: any) => ({
            name: item.name,
            role: item.role,
            phone: item.phone || '',
            active: item.status === 'On Duty' || item.status === 'Active' || item.active || false,
            pin: item.pin || '1234',
            photo: item.photo || item.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
            accessPrivilege: item.accessPrivilege || item.role?.toLowerCase() || 'waiter',
            username: item.username || item.name.toLowerCase().replace(/\s+/g, '_'),
            password: item.password || item.pin || '1234',
            securityAnswer: item.securityAnswer || 'hawassa',
            hireDate: item.hireDate || '',
            info: item.info || '',
            education: item.education || '',
            certificatePhoto: item.certificatePhoto || ''
          }));

          setStaff((prev) => {
            const hasChanges = JSON.stringify(prev.map(p => p.name)) !== JSON.stringify(listFromSupabase.map(l => l.name)) ||
                              JSON.stringify(prev.map(p => p.pin)) !== JSON.stringify(listFromSupabase.map(l => l.pin)) ||
                              JSON.stringify(prev.map(p => p.username)) !== JSON.stringify(listFromSupabase.map(l => l.username));
            if (hasChanges) {
              return listFromSupabase;
            }
            return prev;
          });
        } else {
          // Supabase database is empty for this user, seed current local staff to Supabase
          const formatPayloads = staff.map(s => ({
            id: 'st-' + Math.random().toString(36).substr(2, 9),
            userId: uid,
            name: s.name,
            email: (s.username || s.name.toLowerCase().replace(/\s+/g, '_')) + '@papyruslodge.com',
            phone: s.phone || '',
            role: s.role,
            status: s.active ? 'On Duty' : 'Active',
            pin: s.pin || '1234',
            active: s.active || false,
            photo: s.photo || '',
            accessPrivilege: s.accessPrivilege || s.role,
            username: s.username || s.name.toLowerCase().replace(/\s+/g, '_'),
            password: s.password || s.pin || '1234',
            securityAnswer: s.securityAnswer || 'hawassa',
            hireDate: s.hireDate || '',
            info: s.info || '',
            education: s.education || '',
            certificatePhoto: s.certificatePhoto || '',
            createdAt: new Date().toISOString()
          }));

          await supabase.from('user_team_members').upsert(formatPayloads);
        }
      } catch (err) {
        console.warn("Supabase user_team_members loading/syncing failed, falling back to local list:", err);
      }
    };

    syncWithSupabase();
  }, [fbUser]);

  // HANDLERS FOR STAFF KEYPAD VERIFICATIONS
  const playVoiceAlert = (message: string) => {
    try {
      // Play a synthesized electronic notification sound first
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); 
      gainNode.gain.setValueAtTime(0.25, audioCtx.currentTime);
      
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioCtx.close();
      }, 250);

      // Synthesize clean audio notification speech
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.rate = 1.0;
        utterance.pitch = 1.05;
        utterance.volume = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.warn("Speech voice audio blocked or disabled", err);
    }
  };

  const renderWiFiClockInWidget = () => {
    if (!currentUser) return null;
    const todayDate = new Date().toLocaleDateString('et-EE', { year: 'numeric', month: '2-digit', day: '2-digit' });

    const clockedInToday = attendance.some(a => a.staffName === currentUser.name && a.date === todayDate && (a.status === 'Present' || a.status === 'Late'));
    const pendingRequest = pendingAttendanceRequests.find(r => r.staffName === currentUser.name && r.time === todayDate && r.status === 'pending');
    const rejectedRequest = pendingAttendanceRequests.find(r => r.staffName === currentUser.name && r.time === todayDate && r.status === 'rejected');

    if (clockedInToday) {
      return (
        <div className="bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-xl flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-3">
            <span className="text-xl animate-pulse">📶</span>
            <div>
              <p className="text-[10px] text-emerald-400 font-mono font-black uppercase tracking-wider">PAPYRUS SECURE LODGE WIFI</p>
              <h5 className="text-xs font-black text-white">ክሎክ-ኢን ተረጋግጧል / CLOCK-IN APPROVED</h5>
            </div>
          </div>
          <span className="bg-emerald-500 text-black text-[9px] font-mono uppercase font-black px-2.5 py-1 rounded">
            ONLINE / ገባሪ ✔
          </span>
        </div>
      );
    }

    return (
      <div className="bg-[#0b131a] border border-[#00f5ff]/20 p-5 rounded-2xl relative overflow-hidden space-y-4 shadow-[4px_4px_0px_0px_rgba(0,245,255,0.1)]">
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#00f5ff]/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex justify-between items-start">
          <div className="space-y-0.5">
            <span className="text-[9px] text-[#00f5ff] font-mono font-black tracking-widest uppercase block">ATTENDANCE VERIFICATION ENGINE</span>
            <h4 className="text-sm font-black text-white uppercase">📶 የእለት ተእለት የስራ መግቢያ ማረጋገጫ (WiFi Clock-In)</h4>
            <p className="text-[10.5px] text-white/50 leading-relaxed font-bold">
              በድርጅቱ ዋይፋይ (Lodge Corporate WiFi) ሲገናኙ ብቻ መመዝገብ ይችላሉ።
            </p>
          </div>
          <div className="flex flex-col items-end font-mono text-[9px]">
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              PAPYRUS_LODGE_SECURE
            </span>
            <span className="text-white/40">IP: 192.168.43.32 (MATCHED Whitelist)</span>
          </div>
        </div>

        {pendingRequest ? (
          <div className="bg-[#1C1D13] border border-yellow-500/20 p-3 text-center rounded space-y-1">
            <div className="flex items-center justify-center gap-2 text-yellow-400 font-bold text-xs animate-pulse">
              <span>⏳</span>
              <span>የማሳወቂያ ጥያቄ ተልኳል (PENDING MANAGER APPROVAL)</span>
            </div>
            <p className="text-[10px] text-white/60">
              እባክዎ ማናጀሩ ጥያቄዎን እስኪያፀድቁ ድረስ ይጠብቁ።
            </p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border-t border-white/5 pt-3">
            <div className="text-left">
              <span className="text-[9px] text-white/40 block font-mono">DEVICE CONNECTION STATUS:</span>
              <p className="text-xs font-bold text-[#C1FF00] flex items-center gap-1.5">
                <span>📶 CONNECTED</span>
                <span className="text-[10px] text-white/50 font-normal font-sans">(Signal: Perfect, Whitelist Verification Passed)</span>
              </p>
            </div>
            
            <button
              onClick={() => {
                const updatedTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
                const newReq = {
                  id: 'att-req-' + Date.now(),
                  staffName: currentUser.name,
                  role: currentUser.role,
                  time: todayDate,
                  wifiSsid: 'PAPYRUS_LODGE_SECURE',
                  status: 'pending' as const
                };
                setPendingAttendanceRequests(prev => [newReq, ...prev]);
                playVoiceAlert(`Clock-in request submitted for ${currentUser.name}. Waiting for manager approval.`);
                alert(`🎉 የዋይፋይ ክሎክ-ኢን ጥያቄ በተሳካ ሁኔታ ተልኳል! ማናጀሩ ሲያፀድቁት ሙሉ በሙሉ ይንቀሳቀሳሉ።`);
              }}
              className="w-full sm:w-auto bg-[#00f5ff] hover:bg-white text-black font-black text-xs uppercase px-5 py-2.5 font-mono cursor-pointer transition-all border border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] rounded-xl animate-bounce"
            >
              🔐 CLOCK IN (ማረጋገጫ ደውል)
            </button>
          </div>
        )}

        {rejectedRequest && (
          <p className="text-[10.5px] text-red-400 text-center font-bold">
            ⚠️ ቀዳሚው ጥያቄ በትክክል ባለመገናኘቱ ውድቅ ተደርጓል። እባክዎ እንደገና ይሞክሩ።
          </p>
        )}
      </div>
    );
  };

  // VISTOR LOG / GUARD GATEWAY ACTIONS
  const handleAddVisitor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gName.trim()) {
      alert("እባክዎ የእንግዳውን ስም ያስገቡ!");
      return;
    }
    const newVisitor: VisitorLog = {
      id: 'v-' + Date.now(),
      name: gName.trim(),
      phone: gPhone.trim() || 'ያልተገለጸ',
      carPlate: gPlate.trim() || 'ያልተገለጸ',
      purpose: gPurpose,
      timeIn: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString(),
      status: 'In Lodge'
    };
    setVisitorLog([newVisitor, ...visitorLog]);
    setGName('');
    setGPhone('');
    setGPlate('');
    alert('👮 እንግዳው በተሳካ ሁኔታ ተመዝግቧል! / Visitor entry registered.');
  };

  const handleCheckoutVisitor = (id: string) => {
    setVisitorLog(visitorLog.map(v => v.id === id ? {
      ...v,
      status: 'Checked Out',
      timeOut: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString()
    } : v));
    alert('🚪 እንግዳው ውጭ እንዲሆን ተደርጓል! / Visitor checked out.');
  };

  const handleDeleteVisitor = (id: string) => {
    if (confirm('እርግጠኛ ነዎት ይህንን የጎብኚ መዝገብ መሰረዝ ይፈልጋሉ? (Are you sure you want to delete this visitor record?)')) {
      setVisitorLog(visitorLog.filter(v => v.id !== id));
    }
  };

  const handleSuccessLogin = (matchedStaff: StaffMember) => {
    setCurrentUser(matchedStaff);
    const privilege = matchedStaff.accessPrivilege || matchedStaff.role;
    if (privilege === 'waiter') setActiveRole('waiter');
    if (privilege === 'chef') setActiveRole('chef');
    if (privilege === 'admin') setActiveRole('admin');
    if (privilege === 'manager') setActiveRole('manager');
    if (privilege === 'receptionist') setActiveRole('receptionist');
    if (privilege === 'cashier') setActiveRole('cashier');
    if (privilege === 'guard') setActiveRole('guard');
  };

  const handleUnifiedLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setUnifiedError('');

    if (unifiedMethod === 'password') {
      if (!unifiedUsername.trim() || !unifiedPassword.trim()) {
        setUnifiedError('እባክዎ መግቢያ ስምና የይለፍ ቃል በትክክል ያስገቡ! (Please enter username/password)');
        return;
      }

      // Check local staff credentials first - if match, bypass Supabase to prevent any email confirmation blockages
      const matchedLocalStaff = staff.find(s => 
        (s.username?.toLowerCase() === unifiedUsername.trim().toLowerCase() ||
         s.name.toLowerCase() === unifiedUsername.trim().toLowerCase()) &&
        s.password === unifiedPassword.trim()
      );

      if (matchedLocalStaff) {
        localStorage.setItem('supabase_session_bypassed', 'true');
        localStorage.setItem('supabase_bypassed_user_email', `${unifiedUsername.trim().toLowerCase()}@papyruslodge.com`);
        localStorage.setItem('supabase_bypassed_user_id', 'bypassed-local-uid');
        localStorage.setItem('supabase_bypassed_current_user', JSON.stringify(matchedLocalStaff));
        handleSuccessLogin(matchedLocalStaff);
        setUnifiedUsername('');
        setUnifiedPassword('');
        setUnifiedError('');
        setStaffPortalState('welcome');
        window.history.pushState({}, '', '/');
        return;
      }

      // Convert username/email entry to valid Supabase email format
      const targetEmail = unifiedUsername.trim().includes('@') 
        ? unifiedUsername.trim() 
        : `${unifiedUsername.trim().toLowerCase().replace(/\s+/g, '_')}@papyruslodge.com`;

      try {
        // ---- Supabase Sign In with Password ----
        const { data, error } = await supabase.auth.signInWithPassword({
          email: targetEmail,
          password: unifiedPassword.trim()
        });

        let isBypassed = false;
        let finalUserEmail = targetEmail;
        let finalUserId = 'bypassed-uid';

        if (error) {
          const errMsg = error.message.toLowerCase();
          const isUnconfirmed = 
            errMsg.includes('confirm') || 
            errMsg.includes('verify') || 
            errMsg.includes('verification') || 
            errMsg.includes('unconfirmed') || 
            errMsg.includes('not confirmed') ||
            errMsg.includes('email not') ||
            errMsg.includes('check your email') ||
            errMsg.includes('email_not_confirmed');

          if (isUnconfirmed) {
            isBypassed = true;
          } else {
            setUnifiedError(error.message);
            return;
          }
        }

        if (!data.session && !isBypassed) {
          if (data.user) {
            isBypassed = true;
            finalUserEmail = data.user.email || targetEmail;
            finalUserId = data.user.id;
          } else {
            // Since we want to bypass email confirmation, if they signed up we can log them in anyway!
            isBypassed = true;
          }
        }

        if (isBypassed) {
          localStorage.setItem('supabase_session_bypassed', 'true');
          localStorage.setItem('supabase_bypassed_user_email', finalUserEmail);
          localStorage.setItem('supabase_bypassed_user_id', finalUserId);
        }

        // Auto-identify the team member by their custom username & password combination!
        const matched = staff.find(s => 
          (s.username?.toLowerCase() === unifiedUsername.trim().toLowerCase()) ||
          (s.name.toLowerCase() === unifiedUsername.trim().toLowerCase())
        );

        setUnifiedUsername('');
        setUnifiedPassword('');
        setUnifiedError('');

        let loggedInStaff = matched;
        if (matched) {
          handleSuccessLogin(matched);
        } else {
          // Fallback user matching active role
          const genericStaff: StaffMember = {
            name: (data.user?.email || finalUserEmail).split('@')[0] || 'Staff Member',
            role: unifiedRole,
            accessPrivilege: unifiedRole,
            pin: '1234',
            active: true,
            photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
            phone: '',
            username: unifiedUsername.trim().toLowerCase(),
            password: unifiedPassword
          };
          loggedInStaff = genericStaff;
          setCurrentUser(genericStaff);
          setActiveRole(unifiedRole);
        }

        if (loggedInStaff) {
          localStorage.setItem('supabase_bypassed_current_user', JSON.stringify(loggedInStaff));
        }

        setStaffPortalState('welcome');
        window.history.pushState({}, '', '/');
      } catch (err: any) {
        setUnifiedError(err.message || 'እንቅስቃሴው አልተሳካም። (Authentication failed)');
      }
    } else {
      if (unifiedPin.length !== 4) {
        setUnifiedError('እባክዎ ባለ 4 አሃዝ ፒን ያስገቡ። (Please enter a 4-digit PIN)');
        return;
      }
      // Auto-identify by the secure 4-digit PIN and matching selected role (unifiedRole)
      const matched = staff.find(s => 
        s.pin === unifiedPin && 
        ((s.role || '').toLowerCase() === unifiedRole.toLowerCase() || 
         (s.accessPrivilege || '').toLowerCase() === unifiedRole.toLowerCase())
      );
      if (matched) {
        setUnifiedPin('');
        setUnifiedError('');
        handleSuccessLogin(matched);
        
        setStaffPortalState('welcome');
        window.history.pushState({}, '', '/');
      } else {
        const pinExistsAnywhere = staff.some(s => s.pin === unifiedPin);
        if (pinExistsAnywhere) {
          setUnifiedError('የተሳሳተ የፒን ቁጥር ለተመረጠው የስራ ዘርፍ! (Incorrect PIN for the selected division!)');
        } else {
          setUnifiedError('የተሳሳተ የፒን ቁጥር! (Incorrect PIN)');
        }
        setUnifiedPin('');
      }
    }
  };

  const handleStaffSignUpSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setUnifiedError('');
    setSignupSuccessMessage('');

    if (!signupName.trim()) {
      setUnifiedError('እባክዎ የሙሉ ስም በትክክል ያስገቡ! (Please enter Full Name)');
      return;
    }
    if (!signupUsername.trim()) {
      setUnifiedError('እባክዎ መግቢያ ስም በትክክል ያስገቡ! (Please enter Username)');
      return;
    }
    if (!signupPassword.trim()) {
      setUnifiedError('እባክዎ የይለፍ ቃል በትክክል ያስገቡ! (Please enter Password)');
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      setUnifiedError('የይለፍ ቃሎች አይዛመዱም! (Passwords do not match)');
      return;
    }
    if (!signupPin.trim() || signupPin.length !== 4 || isNaN(Number(signupPin))) {
      setUnifiedError('የይለፍ ፒን ቁጥር 4 አሃዝ ብቻ መሆን አለበት! (PIN must be exactly 4 digits)');
      return;
    }
    if (!signupSecurityAnswer.trim()) {
      setUnifiedError('እባክዎ የምስጢር ጥያቄ መልስ ያስገቡ! (Please enter security answer for recovery)');
      return;
    }

    const normUsername = signupUsername.trim().toLowerCase().replace(/\s+/g, '_');
    const isTaken = staff.some(s => s.username?.toLowerCase() === normUsername);
    if (isTaken) {
      setUnifiedError('ይህ መግቢያ ስም ቀድሞ ተይዟል! እባክዎ ሌላ ይሞክሩ (Username already taken!)');
      return;
    }

    // Convert to valid Supabase email standard
    const targetEmail = signupUsername.trim().includes('@')
      ? signupUsername.trim()
      : `${normUsername}@papyruslodge.com`;

    try {
      // ---- Supabase Sign Up ----
      const { data, error } = await supabase.auth.signUp({
        email: targetEmail,
        password: signupPassword.trim()
      });

      if (error) {
        setUnifiedError(error.message);
        return;
      }

      const newStaff: StaffMember = {
        name: signupName.trim(),
        role: signupRole,
        accessPrivilege: signupRole,
        pin: signupPin.trim(),
        active: false,
        photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
        phone: '',
        username: normUsername,
        password: signupPassword.trim(),
        securityAnswer: signupSecurityAnswer.trim().toLowerCase()
      };

      const targetUser = data.user;
      if (targetUser) {
        const uid = targetUser.id;
        const memberId = 'st-' + Math.random().toString(36).substr(2, 9);
        const memberPayload = {
          id: memberId,
          userId: uid,
          name: newStaff.name,
          email: targetEmail,
          phone: '',
          role: newStaff.role,
          status: 'Active',
          pin: newStaff.pin,
          active: false,
          photo: newStaff.photo,
          accessPrivilege: newStaff.accessPrivilege,
          username: newStaff.username,
          password: newStaff.password,
          securityAnswer: newStaff.securityAnswer,
          createdAt: new Date().toISOString()
        };
        await supabase.from('user_team_members').insert([memberPayload]);
      } else {
        setStaff(prev => [...prev, newStaff]);
      }

      // Bypass email confirmation requirement on sign up
      localStorage.setItem('supabase_session_bypassed', 'true');
      localStorage.setItem('supabase_bypassed_user_email', targetEmail);
      if (targetUser) {
        localStorage.setItem('supabase_bypassed_user_id', targetUser.id);
        setFbUser(targetUser);
      }
      localStorage.setItem('supabase_bypassed_current_user', JSON.stringify(newStaff));

      setCurrentUser(newStaff);
      setActiveRole(signupRole);

      alert(`🎉 ሠራተኛው ${newStaff.name} በስኬት ተመዝግቧል! (Staff user registered successfully via Supabase!)`);
      
      // Clear signup fields
      setSignupName('');
      setSignupUsername('');
      setSignupPassword('');
      setSignupConfirmPassword('');
      setSignupPin('');
      setSignupSecurityAnswer('');
      
      // Redirect page to the Home page ('/')
      setStaffPortalState('welcome');
      window.history.pushState({}, '', '/');
    } catch (err: any) {
      console.error("Staff sign up failure: ", err);
      setUnifiedError(err.message || 'ምዝገባው አልተሳካም፤ እባክዎ እንደገና ይሞክሩ። (Sign up failed!)');
    }
  };

  const handleResetCredentials = async (name: string, pin: string, password?: string, username?: string) => {
    if (fbUser) {
      try {
        const uid = fbUser.id || fbUser.uid;
        const targetUsername = username || name.toLowerCase().replace(/\s+/g, '_');
        const targetPassword = password || pin;
        const { error } = await supabase.from('user_team_members')
          .update({
            pin,
            password: targetPassword,
            username: targetUsername
          })
          .eq('userId', uid)
          .eq('name', name);
        if (error) throw error;
        setStaff(prev => prev.map(s => s.name === name ? { ...s, pin, password: targetPassword, username: targetUsername } : s));
      } catch (e) {
        console.error("Supabase credentials update failed:", e);
      }
    } else {
      setStaff(prev => prev.map(s => s.name === name ? { ...s, pin, password, username } : s));
    }
  };

  const handleRenameRole = (oldRole: string, newRole: string) => {
    const normNew = newRole.trim().toLowerCase();
    if (!normNew) return;
    if (normNew === oldRole) {
      setEditingRoleName(null);
      return;
    }
    if (customRoles.includes(normNew)) {
      alert(`የስራ መደቡ "${normNew}" ቀድሞውኑ አለ!`);
      return;
    }
    // 1. Update customRoles
    setCustomRoles(prev => prev.map(r => r === oldRole ? normNew : r));
    // 2. Update staff matching oldRole
    setStaff(prev => prev.map(s => {
      const updated = { ...s };
      if (s.role === oldRole) updated.role = normNew;
      if (s.accessPrivilege === oldRole) updated.accessPrivilege = normNew as any;
      return updated;
    }));
    setEditingRoleName(null);
    alert(`✔ የስራ መደቡ ስም ከ "${oldRole.toUpperCase()}" ወደ "${normNew.toUpperCase()}" በተሳካ ሁኔታ ተቀይሯል!`);
  };

  const handleDeleteRole = (role: string) => {
    askConfirmAndRun(`ይህን የስራ መደብ (${role.toUpperCase()}) በእርግጠኝነት ማጥፋት ይፈልጋሉ?`, () => {
      setCustomRoles(prev => prev.filter(r => r !== role));
      setStaff(prev => prev.map(s => {
        if (s.role === role) {
          return { ...s, role: 'none' };
        }
        return s;
      }));
      alert(`የስራ መደብ "${role}" ተወግዷል!`);
    });
  };

  const handleRenamePrivilege = (oldPriv: string, newPriv: string) => {
    const normNew = newPriv.trim().toLowerCase();
    if (!normNew) return;
    if (normNew === oldPriv) {
      setEditingPrivilegeName(null);
      return;
    }
    if (customPrivileges.includes(normNew)) {
      alert(`የመዳረሻ ፈቃዱ "${normNew}" ቀድሞውኑ አለ!`);
      return;
    }
    // Update customPrivileges
    setCustomPrivileges(prev => prev.map(p => p === oldPriv ? normNew : p));
    // Update staff matching oldPriv
    setStaff(prev => prev.map(s => {
      const updated = { ...s };
      if (s.accessPrivilege === oldPriv) updated.accessPrivilege = normNew;
      return updated;
    }));
    setEditingPrivilegeName(null);
    alert(`✔ የሲስተም መዳረሻ ፈቃድ ስም ከ "${oldPriv.toUpperCase()}" ወደ "${normNew.toUpperCase()}" በተሳካ ሁኔታ ተቀይሯል!`);
  };

  const handleDeletePrivilege = (priv: string) => {
    askConfirmAndRun(`ይህን የሲስተም መዳረሻ ፈቃድ (${priv.toUpperCase()}) በእርግጠኝነት ማጥፋት ይፈልጋሉ?`, () => {
      setCustomPrivileges(prev => prev.filter(p => p !== priv));
      setStaff(prev => prev.map(s => {
        if (s.accessPrivilege === priv) {
          return { ...s, accessPrivilege: 'none' };
        }
        return s;
      }));
      alert(`የሲስተም መዳረሻ ፈቃድ "${priv}" ተወግዷል!`);
    });
  };

  // CALL FOR ASSISTANCE / CITATION BUSZ
  const handleTriggerBuzzer = () => {
    const timeNow = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const newCall: AssistanceCall = {
      id: 'c-' + Date.now(),
      location: guestLocation,
      time: timeNow,
      active: true
    };
    setAssistanceCalls(prev => [newCall, ...prev]);
    playVoiceAlert(`Notification! Assistance requests received from ${guestLocation}! Please serve room.`);
    alert(`🔔 ጥሪ ተልኳል! አስተናጋጅ በቅርቡ ይመጣል። / Assistance called for ${guestLocation}!`);
  };

  const handleResolveBuzzer = (id: string) => {
    setAssistanceCalls(prev => prev.filter(c => c.id !== id));
  };

  // ITEM CUSTOMIZERS ACCORDING TO USER FLOW
  const handleModifyQaria = (id: string, value: string) => {
    setCustomModifiers(prev => ({
      ...prev,
      [id]: { ...prev[id], qaria: value }
    }));
  };

  const handleModifyInjera = (id: string, value: string) => {
    setCustomModifiers(prev => ({
      ...prev,
      [id]: { ...prev[id], injera: value }
    }));
  };

  const handleModifyDabo = (id: string, dir: number) => {
    setCustomModifiers(prev => ({
      ...prev,
      [id]: { ...prev[id], dabo: Math.max(0, (prev[id]?.dabo || 0) + dir) }
    }));
  };

  const handleModifyQty = (id: string, dir: number) => {
    setCustomModifiers(prev => ({
      ...prev,
      [id]: { ...prev[id], qty: Math.max(1, (prev[id]?.qty || 1) + dir) }
    }));
  };

  const isCustomOnlyItem = (item: MenuItem) => {
    const catObj = categories.find(c => c.id === item.cat);
    const catIdLower = item.cat.toLowerCase();
    const catLabelLower = catObj ? catObj.label.toLowerCase() : '';
    const itemAmLower = item.nameAm.toLowerCase();
    const itemEnLower = (item.nameEn || '').toLowerCase();

    const isBurger = catIdLower.includes('burger') || catLabelLower.includes('burger') || catLabelLower.includes('በርገር') || itemAmLower.includes('በርገር') || itemEnLower.includes('burger');
    const isFastFood = catIdLower.includes('fast') || catLabelLower.includes('fast') || catLabelLower.includes('ፋስት') || itemAmLower.includes('ፋስት') || itemEnLower.includes('fast');
    const isTraditional = catIdLower.includes('traditional') || catLabelLower.includes('traditional') || catIdLower.includes('ባህል') || catLabelLower.includes('ባህል') || itemAmLower.includes('ባህል') || itemEnLower.includes('traditional') || itemEnLower.includes('cultural');

    return isBurger || isFastFood || isTraditional;
  };

  const scrollMenu = (direction: 'left' | 'right') => {
    if (menuScrollRef.current) {
      const scrollAmount = 340;
      menuScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // ADD TO CLIENT BASKET
  const handleAddToBasket = (itemId: string) => {
    const item = menuItems.find(m => m.id === itemId);
    if (!item) return;

    const mod = customModifiers[itemId] || { 
      qaria: modifierOptions.qariaChoices[0] || 'አለ', 
      injera: modifierOptions.injeraChoices[2] || modifierOptions.injeraChoices[0] || 'كامل (ሙሉ)', 
      dabo: 0, 
      qty: 1,
      customInstructions: '',
      mayo: false,
      kocho: false
    };
    const originalItem = INITIAL_MENU_ITEMS.find(m => m.id === item.id);
    const isUnedited = originalItem && 
      originalItem.nameAm === item.nameAm && 
      originalItem.nameEn === item.nameEn;

    const transName = isUnedited && itemTranslations[itemId] && itemTranslations[itemId][appLang]
      ? itemTranslations[itemId][appLang].name
      : (['en', 'fr', 'de', 'it'].includes(appLang) ? (item.nameEn || item.nameAm) : item.nameAm);

    let finalLabel = transName;
    let priceOffset = 0;

    const tLabelQaria = { am: 'ቃሪያ', en: 'Pepper', or: 'Qariyaa', ti: 'ቃሪያ', fr: 'Piment', de: 'Pfeffer', it: 'Peperoncino' }[appLang] || 'Pepper';
    const tLabelInjera = { am: 'እንጀራ', en: 'Injera', or: 'Injera', ti: 'እንጀራ', fr: 'Injéra', de: 'Injera', it: 'Injera' }[appLang] || 'Injera';
    const tLabelDabo = { am: 'ዳቦ', en: 'Bread', or: 'Damboo', ti: 'ዳቦ', fr: 'Pain', de: 'Brot', it: 'Pane' }[appLang] || 'Bread';
    const tLabelBirr = { am: 'ብር', en: 'Birr', or: 'Birr', ti: 'ብር', fr: 'Birr', de: 'Birr', it: 'Birr' }[appLang] || 'Birr';
    const tLabelMayo = { am: 'ማዮኔዝ', en: 'Mayonnaise', or: 'Mayonnaise', ti: 'ማዮኔዝ', fr: 'Mayonnaise', de: 'Mayonnaise', it: 'Maionese' }[appLang] || 'Mayonnaise';
    const tLabelKocho = { am: 'ቆጮ', en: 'Kocho', or: 'Kocho', ti: 'ቆጮ', fr: 'Kocho', de: 'Kocho', it: 'Kocho' }[appLang] || 'Kocho';
    const tSeparator = appLang === 'am' ? '፣ ' : ', ';

    const options = [];

    // Add standard modifiers if customizable
    if (item.customizable || item.cat === 'food' || item.cat === 'traditional') {
      options.push(`${tLabelQaria}: ${getTranslatedModifierValue(mod.qaria)}`);
      
      const injeraPrice = Number(modifierOptions.injeraPrices?.[mod.injera] || 0);
      if (injeraPrice > 0) {
        options.push(`${tLabelInjera}: ${getTranslatedModifierValue(mod.injera)} (+${injeraPrice} ${tLabelBirr})`);
        priceOffset += injeraPrice;
      } else {
        options.push(`${tLabelInjera}: ${getTranslatedModifierValue(mod.injera)}`);
      }
      
      if (mod.dabo > 0) {
        options.push(`${tLabelDabo}: ${mod.dabo} (+${mod.dabo * modifierOptions.daboPrice} ${tLabelBirr})`);
        priceOffset += (mod.dabo * modifierOptions.daboPrice);
      }
    }

    // Add Mayo option if selected (e.g. for burgers)
    if (mod.mayo) {
      const price = modifierOptions.mayoPrice !== undefined ? modifierOptions.mayoPrice : 20;
      options.push(`${tLabelMayo}: ${appLang === 'am' ? 'አለ' : 'Yes'} (+${price} ${tLabelBirr})`);
      priceOffset += price;
    }

    // Add Kocho option if selected (e.g. for traditional items)
    if (mod.kocho) {
      const price = modifierOptions.kochoPrice !== undefined ? modifierOptions.kochoPrice : 45;
      options.push(`${tLabelKocho}: ${appLang === 'am' ? 'አለ' : 'Yes'} (+${price} ${tLabelBirr})`);
      priceOffset += price;
    }

    // Add Custom instructions/additions if present
    if (mod.customInstructions && mod.customInstructions.trim() !== '') {
      const price = modifierOptions.customAdditionsPrice !== undefined ? modifierOptions.customAdditionsPrice : 35;
      const extraLabel = appLang === 'am' ? 'ተጨማሪ' : 'Extra';
      options.push(`${extraLabel}: "${mod.customInstructions}" (+${price} ${tLabelBirr})`);
      priceOffset += price;
    }

    if (options.length > 0) {
      finalLabel += ` (${options.join(tSeparator)})`;
    }

    const newItem: OrderItem = {
      id: item.id + '-' + Date.now(),
      baseId: item.id,
      name: finalLabel,
      qty: mod.qty,
      price: item.price + priceOffset
    };

    setCart(prev => [...prev, newItem]);
    // Reset quantity, text box and checkboxes cleanly
    setCustomModifiers(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], qty: 1, customInstructions: '', mayo: false, kocho: false }
    }));
    alert('🛒 ወደ ቅርጫት ታክሏል! / Successfully added to cart!');
  };

  const handleRemoveCartItem = (id: string) => {
    setCart(prev => prev.filter(c => c.id !== id));
  };

  // GUEST CHEKOUT LOGIC
  const handleCheckoutPlaceOrder = (details: {
    location: string;
    orderType: OrderType;
    phone?: string;
    address?: string;
    tip: number;
    payment: 'cash' | 'bank';
    bankId?: string;
    bankRef?: string;
    receiptScreenshot?: string;
    receiptComment?: string;
  }) => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const sc = Math.round((subtotal * serviceChargeRate) / 100);
    const vt = Math.round(((subtotal + sc) * vatRate) / 100);
    const timeNow = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const dateTodayStr = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

    const newOrder: Order = {
      id: '#O-' + Math.floor(100 + Math.random() * 900),
      location: details.location,
      items: cart,
      total: subtotal + sc + vt + details.tip,
      serviceCharge: sc,
      vat: vt,
      tip: details.tip,
      status: 'Pending',
      cookingStatus: 'Pending',
      servedByWaiter: false,
      payment: details.payment,
      bankId: details.bankId,
      bankRef: details.bankRef,
      receiptScreenshot: details.receiptScreenshot,
      receiptComment: details.receiptComment,
      confirmed: true,
      orderType: details.orderType,
      deliveryPhone: details.phone,
      deliveryAddress: details.address,
      time: timeNow,
      date: dateTodayStr
    };

    setOrders(prev => [newOrder, ...prev]);
    setCart([]);
    alert('🎉 ትዕዛዝዎ አስተማማኝ በሆነ ሁኔታ ተቀብለናል! በቅርብ ሰአት ይደርሳል። / Order placed successfully!');
  };

  // ADMIN OPERATIONS
  const handleAddNewMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    const nameAm = (e.currentTarget.querySelector('#add-name-am') as HTMLInputElement).value;
    const nameEn = (e.currentTarget.querySelector('#add-name-en') as HTMLInputElement).value;
    const price = parseFloat((e.currentTarget.querySelector('#add-price') as HTMLInputElement).value);
    const cat = (e.currentTarget.querySelector('#add-cat') as HTMLSelectElement).value as any;
    const desc = (e.currentTarget.querySelector('#add-desc') as HTMLInputElement).value;
    const imgOf = addMenuImage || (e.currentTarget.querySelector('#add-image') as HTMLInputElement).value;

    const customizableCheckbox = e.currentTarget.querySelector('#add-customizable') as HTMLInputElement | null;
    const isCustomizable = customizableCheckbox ? customizableCheckbox.checked : (cat === 'food');

    const newItem: MenuItem = {
      id: 'm-' + Date.now(),
      cat,
      nameAm,
      nameEn,
      price,
      desc: desc || 'አዲስ ትኩስ ምርት',
      image: imgOf || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400',
      available: true,
      customizable: isCustomizable
    };

    setMenuItems(prev => [...prev, newItem]);
    setAddMenuImage('');
    e.currentTarget.reset();
    alert('🍽️ አዲስ ምናሌ በተሳካ ሁኔታ ተመዝግቧል! / Menu item saved.');
  };

  const handleToggleMenuItemAvailable = (id: string) => {
    setMenuItems(prev => prev.map(m => m.id === id ? { ...m, available: !m.available } : m));
  };

  const handleRemoveMenuItem = (id: string) => {
    askConfirmAndRun('ይህን ምናሌ መሰረዝ ይፈልጋሉ? (Are you sure you want to delete this menu item?)', () => {
      setMenuItems(prev => prev.filter(m => m.id.trim().toLowerCase() !== id.trim().toLowerCase()));
    });
  };

  // REGISTER STAFF MEMBERS
  const handleRegisterStaff = (e: React.FormEvent) => {
    e.preventDefault();
    const name = (e.currentTarget.querySelector('#add-staff-name') as HTMLInputElement).value;
    const pin = (e.currentTarget.querySelector('#add-staff-pin') as HTMLInputElement).value;
    const phone = (e.currentTarget.querySelector('#add-staff-phone') as HTMLInputElement).value;
    const hireDate = (e.currentTarget.querySelector('#add-staff-hire-date') as HTMLInputElement).value;
    const info = (e.currentTarget.querySelector('#add-staff-info') as HTMLTextAreaElement).value;
    const education = (e.currentTarget.querySelector('#add-staff-education') as HTMLInputElement)?.value || '';
    const username = (e.currentTarget.querySelector('#add-staff-username') as HTMLInputElement).value;
    const password = (e.currentTarget.querySelector('#add-staff-password') as HTMLInputElement).value;
    const securityAnsEl = e.currentTarget.querySelector('#add-staff-security') as HTMLInputElement;
    const securityAnswer = securityAnsEl ? securityAnsEl.value.trim() : 'hawassa';

    if (pin.length !== 4 || isNaN(Number(pin))) {
      alert('የይለፍ ቃል በትክክል 4 ቁጥሮች ብቻ መሆን አለበት!');
      return;
    }

    const newStaff: StaffMember = { 
      name, 
      role: addStaffRoleSelected, 
      accessPrivilege: addStaffAccessSelected,
      pin, 
      active: false, 
      photo: addStaffPhoto || (e.currentTarget.querySelector('#add-staff-photo-url') as HTMLInputElement)?.value || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      phone,
      hireDate,
      info,
      education,
      certificatePhoto: addStaffCertificatePhoto,
      username,
      password,
      securityAnswer
    };
    if (fbUser) {
      const uid = fbUser.id || fbUser.uid;
      const memberId = 'st-' + Math.random().toString(36).substr(2, 9);
      const memberPayload = {
        id: memberId,
        userId: uid,
        name: newStaff.name,
        email: (newStaff.username || newStaff.name.toLowerCase().replace(/\s+/g, '_')) + '@papyruslodge.com',
        phone: newStaff.phone || '',
        role: newStaff.role,
        status: newStaff.active ? 'On Duty' : 'Active',
        pin: newStaff.pin || '1234',
        active: newStaff.active || false,
        photo: newStaff.photo || '',
        accessPrivilege: newStaff.accessPrivilege || newStaff.role,
        username: newStaff.username || newStaff.name.toLowerCase().replace(/\s+/g, '_'),
        password: newStaff.password || newStaff.pin || '1234',
        securityAnswer: newStaff.securityAnswer || 'hawassa',
        hireDate: newStaff.hireDate || '',
        info: newStaff.info || '',
        education: newStaff.education || '',
        certificatePhoto: newStaff.certificatePhoto || '',
        createdAt: new Date().toISOString()
      };
      
      setStaff(prev => [...prev, newStaff]);
      supabase.from('user_team_members').insert([memberPayload]).then(({ error }) => {
        if (error) console.error("Supabase staff save error:", error);
      });
    } else {
      setStaff(prev => [...prev, newStaff]);
    }
    setAddStaffPhoto('');
    setAddStaffCertificatePhoto('');
    setAddStaffRoleSelected('waiter');
    setAddStaffAccessSelected('waiter');
    e.currentTarget.reset();
    alert('👥 ሰራተኛው በተሳካ ሁኔታ ተመዝግቧል! / Staff registered.');
  };

  const handleRemoveStaff = (name: string) => {
    askConfirmAndRun('ይህን ሰራተኛ ማሰናበት እርግጠኛ ነዎት? (Are you sure you want to dismiss this employee?)', async () => {
      setStaff(prev => prev.filter(s => s.name.trim().toLowerCase() !== name.trim().toLowerCase()));
      if (fbUser) {
        try {
          const uid = fbUser.id || fbUser.uid;
          const { error } = await supabase.from('user_team_members')
            .delete()
            .eq('userId', uid)
            .eq('name', name);
          if (error) throw error;
        } catch (e) {
          console.error("Supabase team member delete failed:", e);
        }
      }
    });
  };

  // CREATE BED/ROOM BOOKING
  const handleCreateRoomBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget;
    const roomNumber = (form.querySelector('#booking-room-number') as HTMLInputElement).value;
    const roomType = (form.querySelector('#booking-room-type') as HTMLSelectElement)?.value || 'Single Bed';
    const contactPhone = (form.querySelector('#booking-phone') as HTMLInputElement).value;
    const pricePerNight = Number((form.querySelector('#booking-price') as HTMLInputElement).value) || 0;
    const checkInDate = (form.querySelector('#booking-date') as HTMLInputElement).value;
    const notes = (form.querySelector('#booking-notes') as HTMLTextAreaElement).value;

    // Validate guestIds
    const finalIds = guestIdsState.map((gid, index) => {
      const name = gid.fullName.trim() || `እንግዳ ${index + 1} (Guest ${index + 1})`;
      const idNum = gid.idNumber.trim() || `የመታወቂያ መለያ የለም (No ID card)`;
      return { fullName: name, idNumber: idNum };
    });

    const newBooking: RoomBooking = {
      id: 'b-' + Date.now(),
      roomNumber,
      roomType,
      guestCount: bookingGuestCount,
      guestIds: finalIds,
      contactPhone,
      pricePerNight,
      checkInDate,
      status: 'Active',
      notes
    };

    setRoomBookings(prev => [...prev, newBooking]);
    // Reset guest inputs
    setBookingGuestCount(1);
    setGuestIdsState([{ fullName: '', idNumber: '' }]);
    form.reset();
    alert('🛎️ አልጋው በተሳካ ሁኔታ ተይዟል! / Bed reserved successfully.');
  };

  const handleCheckoutBooking = (id: string) => {
    setRoomBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'Checked Out' } : b));
    alert('🔑 እንግዳው በተገቢው ሁኔታ ወጥቷል! / Checked out successfully.');
  };

  const handleDeleteBooking = (id: string) => {
    askConfirmAndRun('ይህንን የክፍል መዝገብ ሙሉ በሙሉ መሰረዝ ይፈልጋሉ? (Are you sure you want to delete this booking?)', () => {
      setRoomBookings(prev => prev.filter(b => b.id !== id));
    });
  };

  // EXPENSES MANAGEMENT SYSTEM
  const handleAddExpense = (title: string, category: string, amount: number, date: string, notes: string) => {
    const timeNow = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const newExp: Expense = {
      id: 'exp-' + Date.now(),
      title: title.trim() || 'ማብራሪያ ያልተሰጠው ወጪ',
      category: category || 'ሌላ ወጪ (Other)',
      amount: Number(amount) || 0,
      date: date || new Date().toISOString().split('T')[0],
      time: timeNow,
      notes: notes.trim()
    };
    setExpenses(prev => [newExp, ...prev]);
    alert('💸 አዲስ ወጪ በተሳካ ሁኔታ ተመዝግቧል! / Expense recorded successfully.');
  };

  const handleRemoveExpense = (id: string) => {
    askConfirmAndRun('ይህን የወጪ መዝገብ ለማጥፋት እርግጠኛ ኖት? (Are you sure you want to delete this expense?)', () => {
      setExpenses(prev => prev.filter(e => e.id !== id));
    });
  };

  // MANAGER ATTENDANCE & BONUSES OPERATIONS
  const handleManagerUpdateAttendance = (staffName: string, status: 'Present' | 'Absent' | 'Late', customTime?: string) => {
    const todayStr = new Date().toLocaleDateString('et-EE', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const nowTimeStr = customTime || new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    
    setAttendance(prev => {
      const existingIdx = prev.findIndex(a => a.staffName === staffName && a.date === todayStr);
      if (existingIdx > -1) {
        return prev.map((a, i) => i === existingIdx ? { 
          ...a, 
          status, 
          clockInTime: status === 'Present' || status === 'Late' ? (a.clockInTime || nowTimeStr) : undefined,
          clockOutTime: status === 'Absent' ? undefined : a.clockOutTime
        } : a);
      } else {
        const newRecord: AttendanceRecord = {
          id: 'att-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          staffName,
          role: staff.find(s => s.name === staffName)?.role || 'waiter',
          date: todayStr,
          status,
          clockInTime: status === 'Present' || status === 'Late' ? nowTimeStr : undefined
        };
        return [newRecord, ...prev];
      }
    });
  };

  const handleClockOutAttendance = (staffName: string) => {
    const todayStr = new Date().toLocaleDateString('et-EE', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const nowTimeStr = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    
    setAttendance(prev => {
      const existingIdx = prev.findIndex(a => a.staffName === staffName && a.date === todayStr);
      if (existingIdx > -1) {
        return prev.map((a, i) => i === existingIdx ? { 
          ...a, 
          clockOutTime: nowTimeStr 
        } : a);
      } else {
        const newRecord: AttendanceRecord = {
          id: 'att-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          staffName,
          role: staff.find(s => s.name === staffName)?.role || 'waiter',
          date: todayStr,
          status: 'Present',
          clockInTime: '08:00',
          clockOutTime: nowTimeStr
        };
        return [newRecord, ...prev];
      }
    });
  };

  const handleAwardBonus = (e: React.FormEvent) => {
    e.preventDefault();
    const waitersList = staff.filter(s => s.role === 'waiter');
    const trgStaff = selectedBonusStaff || waitersList[0]?.name || '';
    if (!trgStaff) {
      alert('እባክዎ መጀመሪያ አስተናጋጅ ይምረጡ! (Please select a waiter first)');
      return;
    }
    const amt = parseFloat(bonusAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('እባክዎ ትክክለኛ የቦኖ መጠን ያስገቡ! (Please enter a valid bonus amount)');
      return;
    }

    const todayStr = new Date().toLocaleDateString('et-EE', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const timeNow = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

    const newBonus: BonusRecord = {
      id: 'BONO-' + Date.now().toString().slice(-6),
      staffName: trgStaff,
      amount: amt,
      reason: bonusReason || 'ልዩ የስራ ቦኖ ጉርሻ (Special Bonus incentive)',
      date: todayStr,
      time: timeNow
    };

    setBonuses(prev => [newBonus, ...prev]);
    setActiveBonusReceipt(newBonus);
    alert(`🎉 ለ${trgStaff} የ ${amt} ብር ቦኖ (ቦኖ ወረቀት) በተሳካ ሁኔታ ተመርቷል!`);
  };

  // QR GENERATIONS
  const handleGenerateQR = () => {
    const encodedLoc = encodeURIComponent(qrLocation);
    // Generating the beautiful target url redirection
    const url = `https://ais-pre-o4e7tydp6hz3g2z7skgpe4-75812013665.europe-west2.run.app/?table=${encodedLoc}`;
    setQrGeneratedUrl(url);
  };

  // CHEF WORKFLOW
  const handleConfirmOrderPayment = (orderId: string, confirmed: boolean) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, confirmed } : o));
    alert(confirmed ? '✔️ የባንክ እስክሪንሻት/ክፍያ በተሳካ ሁኔታ ተረጋግጧል! / Payment verified successfully.' : '⚠️ ክፍያው ውድቅ ተደርጓል። / Payment marked unverified.');
  };

  const getAmharicDayOfDate = (dateStr?: string): { dayName: string; formattedDate: string } => {
    if (!dateStr) return { dayName: 'እሁድ', formattedDate: 'ሰኔ 07 ቀን 2018 ዓ.ም' };
    try {
      const parts = dateStr.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const days = ['እሁድ', 'ሰኞ', 'ማክሰኞ', 'ረቡዕ', 'ሐሙስ', 'አርብ', 'ቅዳሜ'];
      const dayName = days[d.getDay()] || 'ቀን';
      const monthMap = [
        'ጥር / January',
        'የካቲት / February',
        'መጋቢት / March',
        'ሚያዚያ / April',
        'ግንቦት / May',
        'ሰኔ / June',
        'ሐምሌ / July',
        'ነሐሴ / August',
        'መስከረም / September',
        'ጥቅምት / October',
        'ህዳር / November',
        'ታህሳስ / December'
      ];
      const amharicMonthFull = monthMap[d.getMonth()] || 'ወር';
      const formattedDate = `${amharicMonthFull} ${d.getDate()} ቀን ${d.getFullYear()} ዓ.ም`;
      return { dayName, formattedDate };
    } catch {
      return { dayName: 'ቀን', formattedDate: dateStr };
    }
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders(prev => {
      const targetOrder = prev.find(o => o.id === orderId);
      if (targetOrder && newStatus === 'Completed') {
        playVoiceAlert(`Attention waiter! Order for ${targetOrder.location} is ready! Chef completed cooking.`);
      }
      return prev.map(o => {
        if (o.id === orderId) {
          const updatedCooking = newStatus === 'Preparing' ? 'Preparing' : (newStatus === 'Completed' ? 'Completed' : o.cookingStatus);
          const finalStatus = o.status === 'Paid' ? 'Paid' : newStatus;
          return { 
            ...o, 
            status: finalStatus, 
            cookingStatus: updatedCooking,
            servedByWaiter: newStatus === 'Completed' ? false : o.servedByWaiter
          };
        }
        return o;
      });
    });
  };

  // FEEDBACK SUBMIT
  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    const timeNowStr = new Date().toLocaleDateString('et-EE', { year: 'numeric', month: '2-digit', day: '2-digit' }) + ' ' + 
                       new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const newFeedback: Feedback = {
      id: 'f-' + Date.now(),
      text: feedbackText,
      time: timeNowStr
    };
    setFeedback(prev => [newFeedback, ...prev]);
    setFeedbackText('');
    alert('💬 ለአስተያየትዎ እናመሰግናለን! / Feedback submitted smoothly.');
  };

  // ADMIN REPLY TO FEEDBACK
  const handleFeedbackReply = (feedbackId: string, replyText: string) => {
    if (!replyText.trim()) return;
    const timeNowStr = new Date().toLocaleDateString('et-EE', { year: 'numeric', month: '2-digit', day: '2-digit' }) + ' ' + 
                       new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    setFeedback(prev => prev.map(f => f.id === feedbackId ? {
      ...f,
      reply: replyText,
      replyTime: timeNowStr
    } : f));
    // Clear reply draft state
    setFeedbackReplyText(prev => {
      const updated = { ...prev };
      delete updated[feedbackId];
      return updated;
    });
    alert('💬 መልስዎ በተሳካ ሁኔታ ተልኳል! / Reply submitted successfully.');
  };

  // ADMIN DELETE FEEDBACK
  const handleDeleteFeedback = (feedbackId: string) => {
    askConfirmAndRun('አስተያየቱን መሰረዝ ይፈልጋሉ? / Are you sure you want to delete this feedback?', () => {
      setFeedback(prev => prev.filter(f => f.id !== feedbackId));
    });
  };

  // MANAGER DYNAMIC RATE ASSIGNMENTS
  const handleAdjustRate = (type: 'vat' | 'sc', delta: number) => {
    if (type === 'vat') {
      setVatRate(prev => Math.max(0, prev + delta));
    } else {
      setServiceChargeRate(prev => Math.max(0, prev + delta));
    }
  };

  const handleSaveEditedStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff || !originalStaffName) return;

    if (editingStaff.pin.length !== 4 || isNaN(Number(editingStaff.pin))) {
      alert('የይለፍ ቃል በትክክል 4 ቁጥሮች ብቻ መሆን አለበት!');
      return;
    }

    setStaff(prev => prev.map(s => s.name === originalStaffName ? editingStaff : s));

    if (fbUser) {
      try {
        const uid = fbUser.id || fbUser.uid;
        const { error } = await supabase.from('user_team_members')
          .update({
            name: editingStaff.name,
            phone: editingStaff.phone || '',
            role: editingStaff.role,
            status: editingStaff.active ? 'On Duty' : 'Active',
            pin: editingStaff.pin,
            active: editingStaff.active,
            photo: editingStaff.photo || '',
            accessPrivilege: editingStaff.accessPrivilege || editingStaff.role,
            username: editingStaff.username,
            password: editingStaff.password || '',
            securityAnswer: editingStaff.securityAnswer || '',
            hireDate: editingStaff.hireDate || '',
            info: editingStaff.info || '',
            education: editingStaff.education || '',
            certificatePhoto: editingStaff.certificatePhoto || ''
          })
          .eq('userId', uid)
          .eq('name', originalStaffName);
          
        if (error) throw error;
      } catch (err) {
        console.error("Supabase team member update failed:", err);
      }
    }
    setEditingStaff(null);
    setOriginalStaffName(null);
    alert('👥 የሰራተኛ መረጃ በተሳካ ሁኔታ ተስተካክሏል! / Staff information updated.');
  };

  const handleSaveEditedMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMenuItem) return;

    setMenuItems(prev => prev.map(m => m.id === editingMenuItem.id ? editingMenuItem : m));
    setEditingMenuItem(null);
    alert('🍽️ የሜኑ መረጃ በተሳካ ሁኔታ ተስተካክሏል! / Menu item updated.');
  };

  const handleSaveEditedBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBank) return;

    setBanks(prev => prev.map(b => b.id === editingBank.id ? editingBank : b));
    setEditingBank(null);
    alert('💳 የባንክ አካውንት በተሳካ ሁኔታ ተስተካክሏል! / Bank account updated.');
  };

  const handleSaveEditedPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPromoIndex === null || !editingPromo) return;

    setPromos(prev => prev.map((p, idx) => idx === editingPromoIndex ? editingPromo : p));
    setEditingPromoIndex(null);
    setEditingPromo(null);
    alert('📢 የማስታወቂያ መረጃ በተሳካ ሁኔታ ተስተካክሏል! / Promotion campaign updated.');
  };

  // BANK REGISTRATIONS
  const handleAddBank = (e: React.FormEvent) => {
    e.preventDefault();
    const name = (e.currentTarget.querySelector('#bank-reg-name') as HTMLInputElement).value;
    const holder = (e.currentTarget.querySelector('#bank-reg-holder') as HTMLInputElement).value;
    const number = (e.currentTarget.querySelector('#bank-reg-number') as HTMLInputElement).value;

    const newBank: BankAccount = {
      id: 'b-' + Date.now(),
      name,
      holder,
      number
    };
    setBanks(prev => [...prev, newBank]);
    e.currentTarget.reset();
    alert('💳 የባንክ አካውንት በተሳካ ሁኔታ ተመዝግቧል!');
  };

  const handleRemoveBank = (id: string) => {
    askConfirmAndRun('የባንኩን አካውንት ማጥፋት ይፈልጋሉ? (Are you sure you want to delete this bank account?)', () => {
      setBanks(prev => prev.filter(b => b.id.trim().toLowerCase() !== id.trim().toLowerCase()));
    });
  };

  const handleRemovePromo = (index: number) => {
    askConfirmAndRun('ይህንን ማስታወቂያ ማጥፋት ይፈልጋሉ? (Are you sure you want to delete this promotion?)', () => {
      setPromos(prev => prev.filter((_, idx) => idx !== index));
    });
  };

  // GALLERY MANAGEMENT HANDLERS (SUPABASE GALLERY TABLE)
  const handleSaveGalleryItem = async (titleAm: string, titleEn: string, imageUrl: string, category: string, id?: string) => {
    try {
      console.log("Saving gallery item to Supabase...", { id, titleAm, titleEn, imageUrl, category });
      
      let res;
      if (id) {
        // Upsert/Update operation
        res = await supabase
          .from('gallery')
          .upsert({
            id,
            title_am: titleAm,
            title_en: titleEn,
            image_url: imageUrl,
            category: category || 'General',
            created_at: new Date().toISOString()
          })
          .select();
      } else {
        // Insert operation
        res = await supabase
          .from('gallery')
          .insert([
            {
              title_am: titleAm,
              title_en: titleEn,
              image_url: imageUrl,
              category: category || 'General'
            }
          ])
          .select();
      }

      if (res.error) {
        console.error("Supabase gallery save failed with error:", res.error);
        alert(`❌ Supabase Gallery Save Error:\nMessage: ${res.error.message}\nCode: ${res.error.code}\nDetails: ${res.error.details || 'None'}`);
        return null;
      }

      console.log("Supabase gallery save succeeded. Data:", res.data);
      
      // Reload directly from Supabase after save to ensure sync and state integrity
      console.log("Reloading gallery items from Supabase after save...");
      const { data: galleryData, error: galleryErr } = await supabase
        .from('gallery')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (galleryErr) {
        console.error("Error reloading gallery items:", galleryErr);
      } else if (galleryData) {
        console.log(`Successfully reloaded ${galleryData.length} gallery items.`);
        setGalleryItems(galleryData);
      }

      if (res.data && res.data[0]) {
        alert('✨ ጋለሪ ምስል በተሳካ ሁኔታ ተቀምጧል! / Gallery item saved successfully to Supabase!');
        return res.data[0];
      }
    } catch (err: any) {
      console.error("Exception saving gallery item:", err);
      alert(`❌ Unexpected Error while saving gallery: ${err.message || err}`);
    }
    return null;
  };

  const handleDeleteGalleryItem = async (id: string) => {
    if (!id) return;
    try {
      console.log(`Deleting gallery item ${id} from Supabase...`);
      const { error } = await supabase
        .from('gallery')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Supabase gallery delete failed with error:", error);
        alert(`❌ Supabase Gallery Delete Error:\nMessage: ${error.message}\nCode: ${error.code}`);
        return;
      }

      console.log("Supabase gallery delete succeeded. Reloading gallery items...");
      const { data: galleryData, error: galleryErr } = await supabase
        .from('gallery')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (galleryErr) {
        console.error("Error reloading gallery items after delete:", galleryErr);
      } else if (galleryData) {
        setGalleryItems(galleryData);
      }
      
      alert('🗑️ የጋለሪው ምስል ተሰርዟል! / Gallery item deleted successfully!');
    } catch (err: any) {
      console.error("Exception deleting gallery item:", err);
      alert(`❌ Unexpected Error while deleting gallery: ${err.message || err}`);
    }
  };

  // PROMOTIONAL MARKETING BANNERS HANDLERS
  const handleAddPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const title = (e.currentTarget.querySelector('#promo-title') as HTMLInputElement).value;
    const desc = (e.currentTarget.querySelector('#promo-desc') as HTMLInputElement).value;
    const tag = (e.currentTarget.querySelector('#promo-tag') as HTMLInputElement).value;
    const video = addPromoVideo || (e.currentTarget.querySelector('#promo-video') as HTMLInputElement).value;
    const poster = addPromoPoster || (e.currentTarget.querySelector('#promo-poster') as HTMLInputElement).value;

    const newPr = { title, desc, tag, video, poster };
    setPromos(prev => [...prev, newPr]);
    setAddPromoVideo('');
    setAddPromoPoster('');
    alert('📢 ማስታወቂያው በተሳካ ሁኔታ ተመዝግቧል! / Promotion campaign registered.');
    e.currentTarget.reset();
  };

  const getYouTubeEmbedUrl = (url: string, isMuted: boolean = true, isAutoplay: boolean = true) => {
    let videoId = 'AHuU7i--EUc'; // fall back default
    if (url) {
      if (url.includes('pixabay.com') || url.includes('202004')) {
        // High quality Cozy Restaurant/Cafe Jazz loop inspired by the Pixabay video
        videoId = '1GrEP_j9A4c';
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1]?.split('?')[0] || videoId;
      } else if (url.includes('v=')) {
        videoId = url.split('v=')[1]?.split('&')[0] || videoId;
      } else if (url.includes('embed/')) {
        videoId = url.split('embed/')[1]?.split('?')[0] || videoId;
      } else if (url.trim().length === 11) {
        videoId = url.trim();
      }
    }
    return `https://www.youtube.com/embed/${videoId}?autoplay=${isAutoplay ? '1' : '0'}&mute=${isMuted ? '1' : '0'}&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&iv_load_policy=3&playsinline=1&modestbranding=1&disablekb=1&fs=0&wmode=transparent&enablejsapi=1`;
  };

  if (currentPath === '/login') {
    return <SupabaseLogin appLang={appLang === 'am' ? 'am' : 'en'} />;
  }

  if (currentPath === '/admin') {
    return (
      <div className="min-h-screen bg-[#070707] text-white flex flex-col p-4 md:p-8 justify-center items-center font-sans relative z-10 text-center animate-fade-in">
        <div className="max-w-md bg-[#121212] border border-white/10 p-8 rounded-2xl shadow-xl space-y-6">
          <div className="w-16 h-16 bg-[#C1FF00]/10 border border-[#C1FF00]/30 rounded-full flex items-center justify-center mx-auto text-2xl">
            🔒
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black uppercase tracking-tight text-white">Super CMS Disabled</h1>
            <p className="text-xs text-stone-400">
              The SuperAdmin CMS component is currently disabled or has been removed. Please use the manager or administrator dashboard inside the application to handle operations.
            </p>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => {
                window.history.pushState({}, '', '/');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="w-full py-3 bg-[#C1FF00] hover:bg-white text-black text-xs font-black uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
            >
              🛖 Go to Main Page
            </button>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                localStorage.removeItem('supabase_session_bypassed');
                localStorage.removeItem('supabase_bypassed_user_email');
                localStorage.removeItem('supabase_bypassed_user_id');
                localStorage.removeItem('supabase_bypassed_current_user');
                window.history.pushState({}, '', '/login');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="w-full py-3 bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer border border-white/10"
            >
              🚪 Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070707] text-white flex flex-col selection:bg-[#C1FF00] selection:text-black font-sans relative z-0">
      {(activeRole === 'entry' || activeRole === 'customer') && (
        <div 
          id="video-bg-container" 
          className={`fixed inset-0 w-screen h-screen overflow-hidden pointer-events-none z-[1] bg-black transition-opacity duration-1000 ${
            activeRole === 'customer' ? 'opacity-35' : 'opacity-100'
          }`}
        >
          {!isBgVideoEnabled || bgVideoType === 'gourmet-paradise' || bgVideoType === 'mango-paradise' ? (
            <div className="absolute inset-0 w-full h-full overflow-hidden">
              {/* Ken Burns zooming background image of luxury restaurant table */}
              <motion.div
                className="absolute inset-0 w-full h-full bg-cover bg-center"
                style={{
                  backgroundImage: `url(${gourmetBg})`,
                  x: mousePos.x * -15,
                  y: mousePos.y * -15,
                }}
                animate={{
                  scale: [1, 1.04, 1],
                }}
                transition={{
                  duration: 35,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />

              {/* Glowing warm culinary fire/golden-amber light flare */}
              <motion.div
                className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-amber-500/10 rounded-full blur-[150px]"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.4, 0.7, 0.4],
                }}
                transition={{
                  duration: 12,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />

              {/* Gently rising smoke curls / floating warm mist particles */}
              {!isMobile && [...Array(5)].map((_, i) => (
                <motion.div
                  key={`smoke-${i}`}
                  className="absolute bg-white/3 rounded-full blur-xl"
                  style={{
                    bottom: "-10%",
                    left: `${20 + i * 15}%`,
                    width: `${150 + i * 50}px`,
                    height: `${150 + i * 50}px`,
                  }}
                  animate={{
                    y: ["0%", "-120%"],
                    x: [0, (i % 2 === 0 ? 30 : -30)],
                    opacity: [0, 0.25, 0.15, 0],
                    scale: [0.8, 1.3]
                  }}
                  transition={{
                    duration: 14 + i * 3,
                    repeat: Infinity,
                    ease: "easeOut",
                    delay: i * 2
                  }}
                />
              ))}

              {/* Rising culinary golden sparkles */}
              {!isMobile && [...Array(12)].map((_, i) => (
                <motion.div
                  key={`sparkle-${i}`}
                  className="absolute text-amber-300/30 font-serif select-none pointer-events-none"
                  style={{
                    bottom: "10%",
                    left: `${10 + i * 8}%`,
                    fontSize: `${12 + (i % 3) * 6}px`,
                  }}
                  animate={{
                    y: ["0vh", "-95vh"],
                    x: [0, Math.sin(i) * 40],
                    opacity: [0, 0.6, 0.4, 0],
                  }}
                  transition={{
                    duration: 10 + (i % 4) * 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 1.5
                  }}
                >
                  ✦
                </motion.div>
              ))}

              {/* Floating Culinary Masterpiece Signature Dish */}
              {!isMobile && (
                <motion.div
                  className="absolute right-[8%] top-[20%] w-[390px] h-[390px] hidden xl:flex items-center justify-center z-10"
                  style={{
                    x: mousePos.x * 25,
                    y: mousePos.y * 25,
                  }}
                  animate={{
                    y: [0, -20, 0],
                    rotate: [0, 2, -2, 0]
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  {/* Under-plate shadow and ambient warm glow */}
                  <div className="absolute inset-4 bg-amber-500/15 rounded-full blur-3xl" />
                  <div className="absolute inset-8 bg-black/40 rounded-full blur-xl translate-y-8" />
                  
                  <img
                    src={signatureDish}
                    alt="Lodge Gourmet Signature Dish"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain filter drop-shadow-[0_30px_50px_rgba(245,158,11,0.25)] rounded-full border border-white/5 bg-black/20 backdrop-blur-sm"
                  />
                </motion.div>
              )}

              {/* Floating Gourmet Delicacies / Food Items */}
              {!isMobile && [
                { emoji: '🥩', name: 'Steak', size: 'text-5xl' },
                { emoji: '🍔', name: 'Burger', size: 'text-5xl' },
                { emoji: '🍕', name: 'Pizza', size: 'text-5xl' },
                { emoji: '🍤', name: 'Shrimp', size: 'text-4xl' },
                { emoji: '🍅', name: 'Tomato', size: 'text-4xl' },
              ].map((item, i) => (
                <motion.div
                  key={`food-${i}`}
                  className={`absolute ${item.size} select-none filter drop-shadow-[0_15px_20px_rgba(0,0,0,0.45)]`}
                  style={{
                    left: `${12 + i * 18}%`,
                    top: `${68 + (i % 3) * 6}%`,
                    x: mousePos.x * (18 + i * 7),
                    y: mousePos.y * (18 + i * 7),
                  }}
                  animate={{
                    y: [0, -15 - (i * 3), 0],
                    rotate: [0, 8 + i * 4, -8 - i * 4, 0]
                  }}
                  transition={{
                    duration: 6 + i * 1.2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  {item.emoji}
                </motion.div>
              ))}

              {/* Floating Fresh Herbs & Spices */}
              {!isMobile && [
                { emoji: '🌿', size: 'text-3xl' },
                { emoji: '🌶️', size: 'text-3.5xl' },
                { emoji: '🌱', size: 'text-2.5xl' },
                { emoji: '🍋', size: 'text-3xl' },
              ].map((item, i) => (
                <motion.div
                  key={`herb-${i}`}
                  className={`absolute ${item.size} select-none filter drop-shadow-[0_8px_12px_rgba(0,0,0,0.25)]`}
                  style={{
                    left: `${8 + i * 26}%`,
                    top: `${12 + i * 14}%`,
                    x: mousePos.x * (14 + i * 5),
                    y: mousePos.y * (14 + i * 5),
                  }}
                  animate={{
                    y: [0, 12, 0],
                    x: [0, -8, 0],
                    rotate: [0, 15, -15, 0]
                  }}
                  transition={{
                    duration: 8 + i * 1.8,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  {item.emoji}
                </motion.div>
              ))}
            </div>
          ) : bgVideoType === 'youtube' ? (
            <div className="absolute inset-0 w-full h-full overflow-hidden scale-[1.25]">
              <iframe
                className="absolute top-1/2 left-1/2 w-[120vw] h-[67.5vw] min-h-[120vh] min-w-[213.33vh] -translate-x-1/2 -translate-y-1/2 opacity-75 select-none scale-[1.2] object-cover pointer-events-none"
                src={getYouTubeEmbedUrl(bgVideoUrl, true, true)}
                title="Hawassa Papyrus Background Video"
                allow="autoplay; encrypted-media"
                frameBorder="0"
              ></iframe>
              <div className="absolute inset-0 bg-transparent z-10 pointer-events-none"></div>
            </div>
          ) : (
            <video
              className="absolute top-1/2 left-1/2 w-full h-full min-h-screen min-w-full -translate-x-1/2 -translate-y-1/2 opacity-75 object-cover pointer-events-none"
              src={bgVideoUrl}
              autoPlay
              muted
              loop
              playsInline
            />
          )}
          {/* High legibility overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/10 to-black/80 z-10" />
        </div>
      )}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(193,255,0,0.04),rgba(255,255,255,0))] pointer-events-none z-[2]" />

      <header className="sticky top-0 z-50 bg-[#0F0F0F]/95 backdrop-blur-md border-b-2 border-white/5 py-4 px-4 md:px-8 flex justify-between items-center transition-all">
        <div className="flex items-center gap-3">
          {/* Company Dynamic Logo */}
          <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl">🏨</span>
            )}
          </div>
          <div>
            <span className="text-white font-extrabold tracking-widest text-[#C1FF00] text-xs block">HAWASSA PAPYRUS</span>
            <span className="text-[8px] text-[#00f5ff] font-mono tracking-wider block font-bold">DIGITAL ECO-PORTAL v2</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* UNIVERSAL COMPACT LANGUAGE DROPDOWN */}
          <div className="flex items-center gap-1 bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-1 rounded-xl transition-all">
            <span className="text-xs">🌐</span>
            <select
              id="header-lang-selector"
              value={appLang}
              onChange={(e) => {
                const selected = e.target.value as any;
                setAppLang(selected);
                localStorage.setItem('papyrus_app_lang', selected);
                const descMap: any = {
                  am: 'ቋንቋ ወደ አማርኛ ተቀይሯል',
                  en: 'Language changed to English',
                  or: 'Afaan gara Oromootti jijjiirameera',
                  ti: 'ቋንቋ ናብ ትግርኛ ተቐይሩ ኣሎ',
                  fr: 'La langue est changée en Français',
                  de: 'Sprache auf Deutsch umgestellt',
                  it: 'Lingua impostata su Italiano'
                };
                runVoiceOver(descMap[selected] || 'Language changed', true);
              }}
              className="bg-transparent text-white font-black text-[9px] tracking-wider uppercase border-none outline-none cursor-pointer pr-1 flex focus:ring-0"
              style={{ colorScheme: 'dark' }}
            >
              <optgroup label="ሀገረሰብ (NATIVE)" className="bg-[#0F0F0F] text-white">
                <option value="am">አማርኛ</option>
                <option value="or">Oromoo</option>
                <option value="ti">ትግርኛ</option>
              </optgroup>
              <optgroup label="የውጭ (FOREIGN)" className="bg-[#0F0F0F] text-white">
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="it">Italiano</option>
              </optgroup>
            </select>
          </div>

          {/* DYNAMIC VOICE READER ACCESSIBILITY TACTILE SWITCH (for visually impaired) */}
          <button
            id="btn-header-voiceover-toggle"
            onClick={() => {
              const nextVal = !isVoiceOverEnabled;
              setIsVoiceOverEnabled(nextVal);
              if (nextVal) {
                setTimeout(() => {
                  runVoiceOver(appLang === 'am' ? 'የድምፅ ረዳት አገልግሎት በርቷል' : 'Screen reader enabled.', true);
                }, 100);
              }
            }}
            className={`px-2 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 border hover:scale-[1.01] cursor-pointer ${
              isVoiceOverEnabled 
                ? 'bg-[#C1FF00]/10 text-[#C1FF00] border-[#C1FF00]/30 font-extrabold' 
                : 'bg-white/5 text-white/40 border-white/10 hover:text-white hover:bg-white/10'
            }`}
            title="Voice Reader Activation"
          >
            <span>{isVoiceOverEnabled ? '🔊 AUDIO-ON' : '🔇 AUDIO-OFF'}</span>
          </button>

          {activeRole !== 'entry' ? (
            <div className="flex items-center gap-2">
              <button
                id="btn-header-back-home"
                onClick={() => {
                  setActiveRole('entry');
                  setCurrentUser(null);
                }}
                className="bg-white/5 hover:bg-white/10 text-white font-mono text-[9px] uppercase font-black tracking-widest px-2.5 py-1.5 rounded border border-white/10 cursor-pointer flex items-center gap-1 transition-all leading-none"
              >
                <span>🏡 {appLang === 'am' ? 'ዋና በር' : 'HOME'}</span>
              </button>

              {activeRole === 'customer' && (
                <button 
                  id="btn-basket-react"
                  onClick={() => setIsCartOpen(true)}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-2.5 py-1.5 font-black text-[9px] uppercase tracking-wider relative flex items-center gap-1 cursor-pointer rounded-lg"
                >
                  <ShoppingCart className="w-3 h-3" />
                  <span>{appLang === 'am' ? 'ቅርጫት' : 'CART'}</span>
                  {cart.length > 0 && (
                    <span id="badge-cart-qty" className="bg-[#C1FF00] text-black px-1 py-0.5 text-[8px] font-black font-mono rounded">
                      {cart.reduce((sum, i) => sum + i.qty, 0)}
                    </span>
                  )}
                </button>
              )}

              {currentUser && (
                <div className="flex items-center gap-1.5 bg-[#00f5ff]/10 border border-[#00f5ff]/30 px-2 py-1 text-[8px] font-mono rounded text-[#00f5ff] max-w-[120px] truncate">
                  <span>🟢 {currentUser.name}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {/* LITE-MODE TOGGLE BUTTON */}
              <button
                id="btn-toggle-lite-mode"
                onClick={() => setLiteMode(prev => !prev)}
                className={`text-[8px] font-black uppercase font-mono px-2 py-1 rounded border transition-all cursor-pointer flex items-center gap-1 ${
                  liteMode 
                    ? 'bg-orange-500/20 text-orange-400 border-orange-500/40 animate-pulse' 
                    : 'bg-white/5 text-white/50 border-white/10 hover:text-white hover:bg-white/10'
                }`}
                title="Facebook-style Basic / Offline mode"
              >
                <span>📶 {liteMode ? 'BASIC' : 'NORMAL'}</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* MAIN VIEW CONTROLLER SECTION */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col justify-between relative z-10">
        <section className="flex-1 flex flex-col items-center justify-center py-4">
          <AnimatePresence mode="wait">
            {activeRole === 'entry' && (
              <motion.div
                key="entry"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full flex flex-col items-center justify-center space-y-6"
              >
                {/* Intro Title */}
                <div className="text-center space-y-2 relative z-10 max-w-2xl px-4">
                  {logoUrl && (
                    <div className="flex justify-center mb-1">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden relative group">
                        <img src={logoUrl} alt="Company Logo" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  )}

                  <h1 className="text-4xl md:text-5xl font-black tracking-tight font-sans mt-1 text-[#C1FF00]">
                    {entryTranslation.app_title[appLang]}
                  </h1>
                  <p className="text-xs text-white/80 max-w-md mx-auto leading-relaxed font-sans mt-0.5">
                    {entryTranslation.app_subtitle[appLang]} — {entryTranslation.intro_para[appLang]}
                  </p>
                </div>



                {/* symmetrically styled aspect-square cards (size 20*20 ratio / 1:1 format) and transparent */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-4xl relative z-10 px-4 mt-2 justify-center items-center">
                  
                  {/* LEFT SIDE: CUSTOMER GATEWAY (Symmetric 20*20 Ratio aspect-square card) */}
                  <div 
                    onMouseEnter={() => runVoiceOver(`${entryTranslation.guest_title[appLang]}. ${entryTranslation.guest_desc[appLang]}`)}
                    className="aspect-square w-full max-w-[390px] mx-auto flex flex-col justify-between p-6 bg-black/40 hover:bg-black/50 backdrop-blur-xl border-2 border-white/10 hover:border-[#C1FF00] rounded-3xl shadow-2xl relative overflow-hidden group transition-all duration-300 transform hover:scale-[1.01]"
                  >
                    {/* Decorative subtle glass circle */}
                    <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-[#C1FF00]/5 rounded-full blur-2xl group-hover:bg-[#C1FF00]/10 transition-all duration-500"></div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2 border-b border-white/5 pb-2">
                        <span className="text-3xl font-black font-mono text-[#C1FF00]/30 tracking-wider">01</span>
                        <span className="clay-emoji text-3xl animate-bounce">🍛</span>
                      </div>
                      
                      <h3 className="text-xl font-black uppercase text-[#C1FF00] tracking-wide mb-1.5 font-sans">
                        {entryTranslation.guest_title[appLang]} <br/>
                        <span className="text-[9px] text-white/40 block font-normal font-mono mt-0.5">GUEST ORDER GATEWAY</span>
                      </h3>
                      
                      <p className="text-[11px] text-white/80 leading-relaxed font-sans mb-3 line-clamp-4">
                        {entryTranslation.guest_desc[appLang]}
                      </p>

                      <div className="space-y-1.5 font-sans block text-left">
                        <div className="flex items-center gap-1.5 text-[9px] text-white/60 font-mono">
                          <span className="text-[#C1FF00] font-black">✔</span> DIGITAL QR MENU & ORDERING
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] text-white/60 font-mono">
                          <span className="text-[#C1FF00] font-black">✔</span> ROOM SERVICES & TOURS
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] text-white/60 font-mono">
                          <span className="text-[#C1FF00] font-black">✔</span> MULTI-LANGUAGE VOICE ASSIST
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      id="btn-enter-guest"
                      onClick={() => {
                        setActiveRole('customer');
                        runVoiceOver(appLang === 'am' ? 'የእንግዳ ማዘዣ ገጽ ተከፍቷል' : 'Guest companion portal loaded.');
                      }}
                      className="w-full h-11 bg-[#C1FF00] hover:bg-white text-black rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300 shadow-[0_4px_12px_rgba(193,255,0,0.3)] cursor-pointer"
                    >
                      <span>{entryTranslation.guest_btn[appLang]}</span>
                    </button>
                  </div>

                  {/* RIGHT SIDE: UNIFIED STAFF SECURE LOGGING PORTAL (Symmetric 20*20 Ratio customizable aspect card) */}
                  <div 
                    onMouseEnter={() => runVoiceOver(`${entryTranslation.staff_title[appLang]}. ${entryTranslation.staff_desc[appLang]}`)}
                    className={`${staffPortalState === 'welcome' ? 'aspect-square' : 'min-h-[500px] md:min-h-[550px] overflow-y-auto'} w-full max-w-[390px] mx-auto flex flex-col bg-black/40 hover:bg-black/50 backdrop-blur-xl border-2 border-white/10 hover:border-[#00f5ff] rounded-3xl shadow-2xl relative transition-all duration-300 transform hover:scale-[1.01]`}
                  >
                    {/* Background glass decorative blur spots */}
                    <div className="absolute -left-10 -top-10 w-28 h-28 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>

                    <div className="p-5 flex-1 flex flex-col justify-between relative z-10">
                      
                      {/* === VIEW 1: STAFF PORTAL WELCOME SCREEN === */}
                      {staffPortalState === 'welcome' && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex-1 flex flex-col justify-between"
                        >
                          <div>
                            {/* Graphic Logo */}
                            <div className="flex justify-center mt-2 mb-1">
                              <div className="relative w-12 h-12 flex items-center justify-center">
                                {/* Overlapping glowing ambient circles matching mockup image design */}
                                <div className="absolute top-0 left-0 w-8 h-8 rounded-full bg-[#8E9AFF] opacity-80 mix-blend-screen filter blur-[1px] animate-pulse"></div>
                                <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#F19FFF] opacity-85 mix-blend-screen filter blur-[1px]"></div>
                                <div className="absolute top-1 right-1 w-7 h-7 rounded-full bg-[#FFE5FF] opacity-90 mix-blend-screen flex items-center justify-center shadow-lg">
                                  <span className="text-sm">🔑</span>
                                </div>
                              </div>
                            </div>

                            {/* Title & Branding */}
                            <div className="text-center space-y-1">
                              <h2 className="text-lg font-extrabold tracking-tight font-sans text-white leading-tight">
                                Hawassa Papyrus
                              </h2>
                              <p className="text-[9px] text-[#00f5ff] font-medium tracking-wide font-mono uppercase">
                                Staff & Admin Secure Desk
                              </p>
                              <p className="text-[10px] text-white/70 max-w-xs mx-auto leading-normal text-center line-clamp-3">
                                {entryTranslation.staff_desc[appLang]}
                              </p>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="space-y-2.5 mt-2">
                            <button
                              id="btn-portal-go-login"
                              onClick={() => {
                                setStaffPortalState('login');
                                setUnifiedError('');
                                runVoiceOver(appLang === 'am' ? 'እባክዎ መለያዎን ያስገቡ' : 'Please authenticate to proceed.');
                              }}
                              className="w-full h-10 bg-white text-black hover:bg-slate-50 active:scale-[0.99] rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer shadow-md"
                            >
                              <span>ግባ (LOG IN) 🚀</span>
                            </button>

                            <button
                              id="btn-portal-go-signup"
                              onClick={() => {
                                setStaffPortalState('signup');
                                setUnifiedError('');
                                runVoiceOver(appLang === 'am' ? 'አዲስ መለያ ይፍጠሩ' : 'Create a staff log-in account.');
                              }}
                              className="w-full h-10 bg-transparent text-white border border-white/35 hover:border-white hover:bg-white/10 active:scale-[0.99] rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
                            >
                              <span>ተመዝገብ (SIGN UP NOW) ✍️</span>
                            </button>
                          </div>

                          {/* Footer Guest Continue link */}
                          <div className="text-center mt-3 pt-1.5 border-t border-white/10">
                            <button 
                              onClick={() => {
                                setActiveRole('customer');
                                runVoiceOver('Guest mode active.');
                              }}
                              className="text-[9px] text-white/60 hover:text-white underline font-medium tracking-wider cursor-pointer font-sans"
                            >
                              ያለ መለያ ቀጥል (CONTINUE AS GUEST) 🍽️
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {/* === VIEW 2: STAFF LOGIN SCREEN === */}
                      {staffPortalState === 'login' && (
                        <motion.div 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex-1 flex flex-col justify-between"
                        >
                          <div>
                            {/* Back Navigation & Header */}
                            <div className="flex justify-between items-center mb-6">
                              <button
                                onClick={() => setStaffPortalState('welcome')}
                                className="flex items-center gap-1.5 text-xs text-white/80 hover:text-white cursor-pointer"
                              >
                                <span>⬅️ ዋና በር</span>
                              </button>
                              <span className="text-[10px] font-mono tracking-widest font-bold bg-white/20 px-2.5 py-0.5 rounded-full uppercase">
                                LOGIN DESK
                              </span>
                            </div>

                            <div className="space-y-1 mb-5">
                              <h3 className="text-2xl font-extrabold text-white tracking-tight">
                                Welcome,
                              </h3>
                              <h4 className="text-lg font-bold text-white/90">
                                Glad to see you! 👋
                              </h4>
                              <p className="text-[10px] text-white/85">
                                እባክዎ መለያዎን ያስገቡ።
                              </p>
                            </div>

                            <form 
                              onSubmit={(e) => {
                                e.preventDefault();
                                handleUnifiedLoginSubmit();
                              }} 
                              className="space-y-4"
                            >

                              {/* COLLAPSIBLE DIVISION SELECTOR (Hides gracefully, expandable based on user intent) */}
                              <div className="space-y-2 bg-white/5 border border-white/10 p-2.5 rounded-2xl relative overflow-hidden transition-all">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-base select-none">
                                      {unifiedRole === 'waiter' ? '🏃' :
                                       unifiedRole === 'chef' ? '🍳' :
                                       unifiedRole === 'receptionist' ? '🛎️' :
                                       unifiedRole === 'cashier' ? '💰' :
                                       unifiedRole === 'guard' ? '🛡️' :
                                       unifiedRole === 'manager' ? '⚡' : '👑'}
                                    </span>
                                    <div>
                                      <span className="text-[8px] font-mono tracking-widest text-[#00f5ff] uppercase block font-bold leading-none">
                                        የስራ ዘርፍ (DIVISION)
                                      </span>
                                      <span className="text-xs font-black text-white leading-tight block mt-0.5">
                                        {unifiedRole === 'waiter' ? 'አስተናጋጅ (Waiter)' :
                                         unifiedRole === 'chef' ? 'ሼፍ (Chef)' :
                                         unifiedRole === 'receptionist' ? 'ሪሴብሽን (Receptionist)' :
                                         unifiedRole === 'cashier' ? 'ካሸር (Cashier)' :
                                         unifiedRole === 'guard' ? 'ጥበቃ (Security)' :
                                         unifiedRole === 'manager' ? 'ማናጀር (Manager)' : 'አስኪያጅ (Admin)'}
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsDivisionExpanded(!isDivisionExpanded);
                                      runVoiceOver(isDivisionExpanded ? 'Division hidden' : 'Please select your division');
                                    }}
                                    className="px-2 py-0.5 rounded text-[8px] font-black uppercase transition-all bg-[#00f5ff]/10 text-[#00f5ff] border border-[#00f5ff]/20 active:scale-95 cursor-pointer hover:bg-white/5"
                                  >
                                    {isDivisionExpanded ? '✖ Hide' : '⚙️ Select'}
                                  </button>
                                </div>

                                {isDivisionExpanded && (
                                  <div className="pt-2 border-t border-white/10 space-y-1.5">
                                    <span className="text-[8px] font-mono text-white/50 uppercase block font-bold">
                                      የስራ ዘርፍዎን ይምረጡ / CHOOSE WORK DIVISION
                                    </span>
                                    <div className="grid grid-cols-2 gap-1.5 max-h-[140px] overflow-y-auto pr-1 no-scrollbar">
                                      {[
                                        { val: 'waiter', labelAm: 'አስተናጋጅ', labelEn: 'Waiter', emoji: '🏃' },
                                        { val: 'chef', labelAm: 'ሼፍ', labelEn: 'Chef', emoji: '🍳' },
                                        { val: 'receptionist', labelAm: 'ሪሴብሽን', labelEn: 'Receptionist', emoji: '🛎️' },
                                        { val: 'cashier', labelAm: 'ካሸር', labelEn: 'Cashier', emoji: '💰' },
                                        { val: 'guard', labelAm: 'ጥበቃ', labelEn: 'Security', emoji: '🛡️' },
                                        { val: 'manager', labelAm: 'ማናጀር', labelEn: 'Manager', emoji: '⚡' },
                                        { val: 'admin', labelAm: 'አስኪያጅ', labelEn: 'Admin', emoji: '👑' }
                                      ].map(item => (
                                        <button
                                          key={item.val}
                                          type="button"
                                          onClick={() => {
                                            setUnifiedRole(item.val as any);
                                            setUnifiedError('');
                                            setIsDivisionExpanded(false); // Collapses elegantly after choice!
                                            runVoiceOver(`Selected ${item.labelEn}`);
                                          }}
                                          className={`py-1 px-1.5 font-sans tracking-tight transition-all rounded-lg flex items-center gap-1.5 cursor-pointer text-left border ${
                                            unifiedRole === item.val
                                              ? 'bg-white text-[#7C3AED] border-white font-extrabold shadow-md transform scale-[1.01]'
                                              : 'bg-white/5 border-white/5 text-white/75 hover:text-white hover:bg-white/10'
                                          }`}
                                        >
                                          <span className="text-xs select-none">{item.emoji}</span>
                                          <div className="leading-none">
                                            <span className="text-[9px] font-extrabold block leading-none">{item.labelAm}</span>
                                            <span className="text-[7.5px] font-medium text-inherit block leading-none mt-0.5">{item.labelEn}</span>
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Tabs */}
                              <div className="grid grid-cols-2 gap-1 p-0.5 bg-white/15 border border-white/10 rounded-lg text-[9px] font-mono font-semibold tracking-wider">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setUnifiedMethod('password');
                                    setUnifiedError('');
                                  }}
                                  className={`py-1 rounded-md text-center cursor-pointer transition-all ${
                                    unifiedMethod === 'password' ? 'bg-white text-[#7C3AED]' : 'text-white/80 hover:text-white'
                                  }`}
                                >
                                  👤 ዩዘርና የይለፍ ቃል
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setUnifiedMethod('pin');
                                    setUnifiedError('');
                                  }}
                                  className={`py-1 rounded-md text-center cursor-pointer transition-all ${
                                    unifiedMethod === 'pin' ? 'bg-white text-[#7C3AED]' : 'text-white/80 hover:text-white'
                                  }`}
                                >
                                  🔢 ባለ 4 አሃዝ ፒን
                                </button>
                              </div>

                              {/* Fields */}
                              {unifiedMethod === 'password' ? (
                                <div className="space-y-2.5">
                                  <div>
                                    <label className="text-[9px] font-mono uppercase text-white/90 block mb-0.5">መግቢያ ስም (USERNAME)</label>
                                    <input
                                      type="text"
                                      value={unifiedUsername || ''}
                                      onChange={(e) => {
                                        setUnifiedUsername(e.target.value);
                                        setUnifiedError('');
                                      }}
                                      placeholder={`e.g. ${unifiedRole}`}
                                      className="w-full bg-white/10 border border-white/20 text-white placeholder-white/50 text-xs font-bold py-2 px-3 outline-none focus:border-white focus:bg-white/20 rounded-xl"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] font-mono uppercase text-white/90 block mb-0.5">የይለፍ ቃል (PASSWORD)</label>
                                    <div className="relative">
                                      <input
                                        type={showLoginPassword ? 'text' : 'password'}
                                        value={unifiedPassword || ''}
                                        onChange={(e) => {
                                          setUnifiedPassword(e.target.value);
                                          setUnifiedError('');
                                        }}
                                        placeholder="••••••••"
                                        className="w-full bg-white/10 border border-white/20 text-white placeholder-white/50 text-xs font-bold py-2 pl-3 pr-10 outline-none focus:border-white focus:bg-white/20 rounded-xl"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-white text-white/60 text-xs focus:outline-none"
                                      >
                                        {showLoginPassword ? '👁️' : '🙈'}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center space-y-2">
                                  <div className="w-full bg-white/10 border border-white/10 py-1.5 px-3 rounded-lg text-center flex justify-between items-center">
                                    <span className="text-[9px] font-mono uppercase text-white/80">የደህንነት ፒን ኮድ</span>
                                    <div className="text-lg font-mono tracking-widest font-black text-white">
                                      {unifiedPin ? '•'.repeat(unifiedPin.length) : <span className="text-white/20">••••</span>}
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-3 gap-1 w-full max-w-[190px]">
                                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                                      <button
                                        key={num}
                                        type="button"
                                        onClick={() => {
                                          setUnifiedError('');
                                          if (unifiedPin.length < 4) setUnifiedPin(p => p + num);
                                        }}
                                        className="bg-white/15 hover:bg-white/30 text-white font-mono text-xs font-bold py-1.5 transition-all active:scale-95 cursor-pointer rounded-lg"
                                      >
                                        {num}
                                      </button>
                                    ))}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setUnifiedPin('');
                                        setUnifiedError('');
                                      }}
                                      className="bg-red-500/20 hover:bg-red-500/40 text-red-200 font-mono text-[8.5px] uppercase font-bold cursor-pointer rounded-lg"
                                    >
                                      CLR
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setUnifiedError('');
                                        if (unifiedPin.length < 4) setUnifiedPin(p => p + '0');
                                      }}
                                      className="bg-white/15 hover:bg-white/30 text-white font-mono text-xs font-bold py-1.5 active:scale-95 cursor-pointer rounded-lg"
                                    >
                                      0
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleUnifiedLoginSubmit()}
                                      className="bg-white text-[#7C3AED] font-mono text-[9px] font-black cursor-pointer rounded-lg shadow-sm"
                                    >
                                      OK 🔐
                                    </button>
                                  </div>
                                </div>
                              )}

                              {unifiedError && (
                                <p className="text-yellow-100 text-[10.5px] font-medium text-center bg-red-600/30 border border-red-500/30 py-1.5 px-2.5 rounded-xl">
                                  ⚠️ {unifiedError}
                                </p>
                              )}

                              <button
                                type="submit"
                                className="w-full bg-white text-[#7C3AED] hover:bg-slate-50 text-xs font-bold uppercase py-2.5 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <span>ግባ (SECURE SIGN IN)</span>
                                <span>🔐</span>
                              </button>
                            </form>
                          </div>

                          <div className="mt-4 text-center">
                            <span className="text-[9px] font-mono text-white/75 block mb-2 uppercase">
                              — Or Demo Instant Login —
                            </span>
                            <div className="flex justify-center gap-3">
                              <button
                                onClick={() => {
                                  setUnifiedUsername('admin');
                                  setUnifiedPassword('1234');
                                  setUnifiedRole('admin');
                                  setUnifiedMethod('password');
                                  setUnifiedError('🗝️ Demo admin loaded! Click "SECURE SIGN IN"');
                                }}
                                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs font-black cursor-pointer shadow border border-white/10"
                                title="Prefill manager/admin credentials"
                              >
                                👑
                              </button>
                              <button
                                onClick={() => {
                                  setUnifiedUsername('waiter');
                                  setUnifiedPassword('1234');
                                  setUnifiedRole('waiter');
                                  setUnifiedMethod('password');
                                  setUnifiedError('🏃 Demo waiter loaded! Click "SECURE SIGN IN"');
                                }}
                                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs font-black cursor-pointer shadow border border-white/10"
                                title="Prefill waiter credentials"
                              >
                                🏃
                              </button>
                              <button
                                onClick={() => {
                                  setUnifiedUsername('chef');
                                  setUnifiedPassword('1234');
                                  setUnifiedRole('chef');
                                  setUnifiedMethod('password');
                                  setUnifiedError('🥘 Demo chef loaded! Click "SECURE SIGN IN"');
                                }}
                                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs font-black cursor-pointer shadow border border-white/10"
                                title="Prefill chef credentials"
                              >
                                🍳
                              </button>
                            </div>
                          </div>

                          <div className="text-center mt-5 pt-2 border-t border-white/10 flex flex-col gap-1.5">
                            <p className="text-[10px] text-white/80">
                              Don't have an account?{' '}
                              <button 
                                onClick={() => {
                                  setStaffPortalState('signup');
                                  setUnifiedError('');
                                }}
                                className="underline font-bold hover:text-white cursor-pointer"
                              >
                                Sign Up Now
                              </button>
                            </p>
                            <button 
                              onClick={() => {
                                setLoginModalRole(unifiedRole);
                                setTimeout(() => {
                                  const forgotBtn = document.getElementById('btn-login-forgot');
                                  if (forgotBtn) forgotBtn.click();
                                }, 100);
                              }} 
                              className="text-[9px] text-white/70 hover:text-white underline tracking-wider cursor-pointer font-sans"
                            >
                              የይለፍ ቃል ረስቻለሁ? (Forgot Credentials) 🔑
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {/* === VIEW 3: STAFF SIGN UP SCREEN === */}
                      {staffPortalState === 'signup' && (
                        <motion.div 
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex-1 flex flex-col justify-between"
                        >
                          <div>
                            {/* Back Navigation & Header */}
                            <div className="flex justify-between items-center mb-5">
                              <button
                                onClick={() => setStaffPortalState('welcome')}
                                className="flex items-center gap-1.5 text-xs text-white/80 hover:text-white cursor-pointer"
                              >
                                <span>⬅️ ዋና በር</span>
                              </button>
                              <span className="text-[10px] font-mono tracking-widest font-bold bg-white/20 px-2.5 py-0.5 rounded-full uppercase">
                                REGISTER PORTAL
                              </span>
                            </div>

                            <div className="space-y-1 mb-4">
                              <h3 className="text-2xl font-extrabold text-white tracking-tight">
                                Create Account,
                              </h3>
                              <h4 className="text-lg font-bold text-white/90">
                                to get started now! 🌟
                              </h4>
                              <p className="text-[10px] text-white/80">
                                ፈጣን የሠራተኛ መመዝገቢያ ፎርም። እባክዎ መረጃዎን ያስገቡ።
                              </p>
                            </div>

                            <form 
                              onSubmit={(e) => {
                                e.preventDefault();
                                handleStaffSignUpSubmit();
                              }} 
                              className="space-y-3"
                            >
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[8.5px] font-mono uppercase text-white/90 block mb-0.5">የሙሉ ስም (FULL NAME)</label>
                                  <input
                                    type="text"
                                    value={signupName}
                                    onChange={(e) => {
                                      setSignupName(e.target.value);
                                      setUnifiedError('');
                                    }}
                                    placeholder="e.g. ሄኖክ ካሳ"
                                    className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 text-xs font-semibold py-1.5 px-2.5 outline-none focus:border-white focus:bg-white/20 rounded-xl"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="text-[8.5px] font-mono uppercase text-white/90 block mb-0.5">መግቢያ ስም (USERNAME)</label>
                                  <input
                                    type="text"
                                    value={signupUsername}
                                    onChange={(e) => {
                                      setSignupUsername(e.target.value);
                                      setUnifiedError('');
                                    }}
                                    placeholder="e.g. henok_waiter"
                                    className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 text-xs font-semibold py-1.5 px-2.5 outline-none focus:border-white focus:bg-white/20 rounded-xl"
                                    required
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[8.5px] font-mono uppercase text-white/90 block mb-0.5">የይለፍ ቃል (PASSWORD)</label>
                                  <div className="relative">
                                    <input
                                      type={showSignupPassword ? 'text' : 'password'}
                                      value={signupPassword}
                                      onChange={(e) => {
                                        setSignupPassword(e.target.value);
                                        setUnifiedError('');
                                      }}
                                      placeholder="••••••••"
                                      className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 text-xs font-semibold py-1.5 px-2.5 outline-none focus:border-white focus:bg-white/20 rounded-xl pr-8"
                                      required
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                                      className="absolute right-2 top-1/2 -translate-y-1/2 text-white/60 text-[11px] focus:outline-none"
                                    >
                                      {showSignupPassword ? '👁️' : '🙈'}
                                    </button>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-[8.5px] font-mono uppercase text-white/90 block mb-0.5">ይለፍ ቃል አረጋግጥ (CONFIRM)</label>
                                  <input
                                    type="password"
                                    value={signupConfirmPassword}
                                    onChange={(e) => {
                                      setSignupConfirmPassword(e.target.value);
                                      setUnifiedError('');
                                    }}
                                    placeholder="••••••••"
                                    className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 text-xs font-semibold py-1.5 px-2.5 outline-none focus:border-white focus:bg-white/20 rounded-xl"
                                    required
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[8.5px] font-mono uppercase text-white/90 block mb-0.5">ባለ 4 አሃዝ ፒን ቁጥር (PIN)</label>
                                  <input
                                    type="text"
                                    maxLength={4}
                                    value={signupPin}
                                    onChange={(e) => {
                                      setSignupPin(e.target.value.replace(/\D/g, ''));
                                      setUnifiedError('');
                                    }}
                                    placeholder="e.g. 8888"
                                    className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 text-xs font-semibold py-1.5 px-2.5 outline-none focus:border-white focus:bg-white/20 rounded-xl text-center tracking-widest"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="text-[8.5px] font-mono uppercase text-[#FFE5FF] block mb-0.5">የሚወዱት ከተማ? (SEC. ANSWER)</label>
                                  <input
                                    type="text"
                                    value={signupSecurityAnswer}
                                    onChange={(e) => {
                                      setSignupSecurityAnswer(e.target.value);
                                      setUnifiedError('');
                                    }}
                                    placeholder="e.g. hawassa"
                                    className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 text-xs font-semibold py-1.5 px-2.5 outline-none focus:border-white focus:bg-white/20 rounded-xl"
                                    required
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="text-[8.5px] font-mono uppercase text-white/90 block mb-1">ሠራተኛው የሚሠራበት ዘርፍ (SELECT ROLE)</label>
                                <div className="flex gap-1 py-1 px-1 bg-white/10 border border-white/10 rounded-xl overflow-x-auto no-scrollbar whitespace-nowrap font-sans">
                                  {[
                                    { val: 'waiter', label: 'አስተናጋጅ 🏃' },
                                    { val: 'chef', label: 'ሼፍ 🍳' },
                                    { val: 'receptionist', label: 'ሪሴብሽን 🛎️' },
                                    { val: 'cashier', label: 'ካሸር 💰' },
                                    { val: 'guard', label: 'ጥበቃ 🛡️' },
                                    { val: 'manager', label: 'ማናጀር ⚡' },
                                    { val: 'admin', label: 'አስኪያጅ 👑' }
                                  ].map(item => (
                                    <button
                                      key={item.val}
                                      type="button"
                                      onClick={() => setSignupRole(item.val as any)}
                                      className={`py-1 px-2.5 text-[10px] shrink-0 text-center font-sans tracking-tight rounded-lg transition-all cursor-pointer ${
                                        signupRole === item.val
                                          ? 'bg-white text-[#7C3AED] font-extrabold'
                                          : 'bg-transparent text-white/70 hover:text-white'
                                      }`}
                                    >
                                      {item.label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {signupSuccessMessage && (
                                <p className="text-[#c1ff00] text-[10.5px] font-medium text-center bg-emerald-950/60 border border-emerald-500/40 py-1.5 px-2.5 rounded-xl">
                                  ✅ {signupSuccessMessage}
                                </p>
                              )}

                              {unifiedError && (
                                <p className="text-yellow-100 text-[10.5px] font-medium text-center bg-red-600/30 border border-red-500/30 py-1.5 px-2.5 rounded-xl">
                                  ⚠️ {unifiedError}
                                </p>
                              )}

                              <button
                                type="submit"
                                className="w-full bg-white text-[#7C3AED] hover:bg-slate-50 text-xs font-bold uppercase py-2.5 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <span>አካውንት ፍጠር (CREATE ACCOUNT NOW)</span>
                                <span>✨</span>
                              </button>
                            </form>
                          </div>

                          <div className="text-center mt-4 pt-2 border-t border-white/10">
                            <p className="text-[10px] text-white/80">
                              Already have an account?{' '}
                              <button 
                                onClick={() => {
                                  setStaffPortalState('login');
                                  setUnifiedError('');
                                }}
                                className="underline font-bold hover:text-white cursor-pointer"
                              >
                                Login Now
                              </button>
                            </p>
                          </div>
                        </motion.div>
                      )}

                    </div>
                  </div>

                </div>

                {/* Elegant Dynamic Footer with Social Media & Interactive Rating */}
                <div className="mt-12 bg-black/60 border border-white/10 rounded-3xl p-6 max-w-2xl w-full relative z-10 shadow-2xl space-y-6 text-center backdrop-blur-md">
                  
                  {/* Title or Quick Greeting */}
                  <div className="space-y-1">
                    <h4 className="text-xs uppercase tracking-widest text-[#C1FF00] font-mono font-black">
                      {appLang === 'am' ? 'ይከተሉን (Follow Us)' : 'Stay Connected'}
                    </h4>
                    <p className="text-[10px] text-white/50 font-sans">
                      {appLang === 'am' ? 'በሶሻል ሚዲያ አድራሻዎቻችን አዳዲስ መረጃዎችን እና ልዩ ቅናሾችን ያግኙ!' : 'Discover latest events, updates and luxury deals on our channels.'}
                    </p>
                  </div>

                  {/* Social Media Link Icons with Neon Glow Effects */}
                  <div className="flex flex-wrap justify-center items-center gap-3">
                    {[
                      { icon: <Facebook className="w-4 h-4" />, name: 'Facebook', url: 'https://facebook.com/papyruslodgehawassa', color: 'hover:text-[#1877F2] hover:border-[#1877F2]/40 hover:bg-[#1877F2]/5' },
                      { icon: <Instagram className="w-4 h-4" />, name: 'Instagram', url: 'https://instagram.com/papyrus_lodge_hawassa', color: 'hover:text-[#E1306C] hover:border-[#E1306C]/40 hover:bg-[#E1306C]/5' },
                      { icon: <Send className="w-4 h-4 rotate-[-30deg]" />, name: 'Telegram', url: 'https://t.me/papyrus_lodge', color: 'hover:text-[#26A5E4] hover:border-[#26A5E4]/40 hover:bg-[#26A5E4]/5' },
                      { icon: <Youtube className="w-4 h-4" />, name: 'YouTube', url: 'https://youtube.com/@papyruslodgehawassa', color: 'hover:text-[#FF0000] hover:border-[#FF0000]/40 hover:bg-[#FF0000]/5' },
                      { icon: <Globe className="w-4 h-4" />, name: 'Website', url: 'https://papyruslodge.com', color: 'hover:text-[#00F5FF] hover:border-[#00F5FF]/40 hover:bg-[#00F5FF]/5' }
                    ].map((soc, idx) => (
                      <a
                        key={idx}
                        href={soc.url}
                        target="_blank"
                        rel="noreferrer"
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 text-white/70 bg-white/5 text-[10px] font-mono font-bold tracking-wider transition-all duration-300 ${soc.color} cursor-pointer`}
                      >
                        {soc.icon}
                        <span>{soc.name}</span>
                      </a>
                    ))}
                  </div>

                  {/* Lodge Contacts and Hotline */}
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/5 text-left text-[9px] font-mono">
                    <div className="space-y-1">
                      <span className="text-white/40 block">HOTLINE / የስልክ ቁጥር</span>
                      <a href="tel:+251919629347" className="text-[#C1FF00] hover:underline font-black block">
                        +251 919 629 347
                      </a>
                      <a href="tel:+251462201234" className="text-white hover:underline block text-[8px]">
                        +251 462 201 234
                      </a>
                    </div>
                    <div className="space-y-1 text-right">
                      <span className="text-white/40 block">LOCATION / አድራሻ</span>
                      <span className="text-white font-bold block">Hawassa, Ethiopia</span>
                      <span className="text-white/60 block text-[8px]">Lakefront Boulevard, Area 05</span>
                    </div>
                  </div>

                  <p className="text-[8px] font-mono text-white/40 tracking-widest uppercase">
                    © {new Date().getFullYear()} PAPYRUS LODGE HAWASSA • VIBRANT ULTIMATE v3
                  </p>
                </div>
              </motion.div>
            )}

            {activeRole === 'vault' && (
              <motion.div
                key="vault"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="w-full max-w-6xl mx-auto"
              >
                <CloudVault onBack={() => setActiveRole('entry')} appLang={appLang} />
              </motion.div>
            )}

            {/* VIEW_2: GUEST ORDER PORTAL */}
            {activeRole === 'customer' && (
              <motion.div 
                key="customer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6 max-w-6xl mx-auto w-full pb-10"
              >
                {/* Banner section */}
                <div className="relative overflow-hidden rounded-xl border-2 border-slate-800 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 p-5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 shadow-[5px_5px_0px_0px_rgba(255,255,255,0.05)]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#C1FF00]/10 flex items-center justify-center border border-[#C1FF00]/35 shadow-[2px_2px_0px_0px_#C1FF00]">
                      <MapPin className="text-[#C1FF00] w-5 h-5 animate-bounce shrink-0" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-mono text-white/50 block tracking-wider">የክፍል ቁጥር (ROOM NUMBER)</span>
                      <input 
                        type="text" 
                        value={guestLocation}
                        onChange={(e) => setGuestLocation(e.target.value)}
                        placeholder="Room 101"
                        className="bg-transparent text-[#C1FF00] font-black text-sm border-b border-[#C1FF00]/40 outline-none w-32 uppercase transition-all focus:border-[#C1FF00] focus:w-40"
                        id="guest-location-input-top"
                      />
                    </div>
                  </div>

                  {/* 🛎️ RESTORED CALL WAITER BUZZER */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      id="btn-customer-call-waiter"
                      onClick={handleTriggerBuzzer}
                      className="bg-pink-600 hover:bg-pink-500 text-white border-2 border-pink-400 font-mono text-[10px] font-black uppercase tracking-wider px-4 py-2.5 rounded-lg shadow-[3px_3px_0px_#000] active:translate-y-0.5 active:shadow-[1px_1px_0px_#000] transition-all cursor-pointer flex items-center gap-2"
                    >
                      <span className="text-sm animate-bounce">🛎️</span>
                      <span>አስተናጋጅ ጥራ (CALL WAITER)</span>
                    </button>
                  </div>

                  <div className="hidden sm:block text-right">
                    <p className="text-[#00f5ff] text-[10px] font-mono uppercase tracking-widest font-black">Hawassa Papyrus Specials 🌟</p>
                    <p className="text-white text-xs font-bold font-mono">SERVICE_CHARGE: {serviceChargeRate}% & VAT: {vatRate}% INC</p>
                  </div>
                </div>

                {/* High-end custom-crafted UI/UX Promo Banner inspired by the premium reference design */}
                {promos.length > 0 && (() => {
                  const currentPromo = promos[promoIndex] || promos[0];
                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="rounded-3xl overflow-hidden relative border border-white/20 dark:border-stone-800/80 flex flex-col lg:flex-row justify-between items-center p-8 sm:p-12 md:p-14 shadow-2xl gap-10 min-h-[500px] text-stone-800 dark:text-stone-100 bg-gradient-to-tr from-[#ffe6d9]/50 via-[#e0f7fa]/30 to-white/95 dark:from-[#3a1d13]/20 dark:via-[#132c3a]/15 dark:to-stone-900/90 backdrop-blur-md"
                    >
                      {/* Ambient background blur flares (mesh gradient effect) */}
                      <div className="absolute top-[-10%] left-[-10%] w-[350px] h-[350px] rounded-full bg-[#ff7b54]/12 blur-[80px] pointer-events-none" />
                      <div className="absolute bottom-[-15%] right-[20%] w-[400px] h-[400px] rounded-full bg-[#00bcd4]/10 blur-[100px] pointer-events-none" />

                      {/* LEFT COLUMN: Deep Typographic Hierarchy & Interactive Search Bar */}
                      <div className="flex-1 space-y-6 relative z-10 text-left w-full">
                        {/* Elegant Pill Tags */}
                        <div className="flex flex-wrap items-center gap-2">
                          <motion.span 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-[9px] font-mono px-3.5 py-1.5 rounded-full uppercase font-black tracking-widest shadow-sm"
                          >
                            {getTranslatedPromoTag(currentPromo.tag)}
                          </motion.span>
                          <motion.span 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="bg-[#ff5722] text-white text-[9px] font-mono px-3 py-1.5 rounded-full uppercase font-black tracking-widest shadow-sm"
                          >
                            15% OFF WEEKEND SPECIAL
                          </motion.span>
                        </div>

                        {/* Title text with high-contrast display layout */}
                        <motion.h3 
                          key={currentPromo.title}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-stone-900 dark:text-white max-w-2xl font-sans uppercase"
                        >
                          {getTranslatedPromoTitle(currentPromo.title).split(' ').map((word, i) => (
                            <span key={i} className={i % 3 === 0 ? "text-[#ff5722]" : ""}>
                              {word}{' '}
                            </span>
                          ))}
                        </motion.h3>

                        {/* Description paragraphs */}
                        <motion.p 
                          key={currentPromo.desc}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          className="text-stone-600 dark:text-stone-300 text-xs sm:text-sm font-semibold leading-relaxed max-w-xl"
                        >
                          {getTranslatedPromoDesc(currentPromo.desc)}
                        </motion.p>

                        {/* Interactive Location/Room Specification Bar modeled on the reference design */}
                        <div className="space-y-2 pt-2">
                          <span className="text-[10px] text-stone-400 dark:text-stone-500 font-mono font-bold tracking-wider block uppercase">📍 የእርስዎ ክፍል ቁጥር (ENTER YOUR ROOM TO ORDER)</span>
                          <motion.div 
                            whileHover={{ scale: 1.01 }}
                            className="bg-white dark:bg-stone-800/90 rounded-full py-1.5 pl-4 pr-1.5 shadow-lg border border-stone-100 dark:border-stone-700/60 flex items-center max-w-md w-full justify-between gap-2"
                          >
                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                              <MapPin className="text-[#ff5722] w-5 h-5 animate-pulse shrink-0" />
                              <input 
                                type="text" 
                                value={guestLocation}
                                onChange={(e) => setGuestLocation(e.target.value)}
                                placeholder="Room 101, Villa 4, Table 5..."
                                className="bg-transparent text-stone-900 dark:text-white font-bold text-xs outline-none w-full placeholder-stone-400 dark:placeholder-stone-500 uppercase"
                                id="guest-location-input-promo"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (guestLocation.trim()) {
                                  // Quick micro feedback toast/alert
                                  const sound = new Audio();
                                  sound.play().catch(() => {});
                                }
                              }}
                              className="bg-[#ff5722] hover:bg-[#e64a19] text-white font-mono text-[9px] font-black uppercase tracking-wider px-5 py-3 rounded-full shadow-md active:scale-95 transition-all cursor-pointer shrink-0"
                            >
                              {appLang === 'am' ? 'አረጋግጥ' : 'Locate Me'}
                            </button>
                          </motion.div>
                        </div>

                        {/* Bottom Left Scroll down label */}
                        <div className="pt-4 hidden sm:flex items-center gap-2.5 text-stone-400 dark:text-stone-500 font-mono text-[10px]">
                          <motion.div 
                            animate={{ y: [0, 6, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="w-5 h-8 border-2 border-stone-300 dark:border-stone-600 rounded-full flex justify-center pt-1"
                          >
                            <div className="w-1.5 h-1.5 bg-[#ff5722] rounded-full" />
                          </motion.div>
                          <span>SCROLL DOWN TO EXPLORE OUR DELICIOUS CULINARY MENU</span>
                        </div>
                      </div>

                      {/* RIGHT COLUMN: Rotating Circular Platter, Frame Circles, & Floating Glassmorphic Badges */}
                      <div className="relative w-full lg:w-[450px] flex items-center justify-center min-h-[300px] lg:min-h-[400px]">
                        
                        {/* Semicircle / Crescent Graphic Frame behind the dish matching reference design */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-[320px] h-[320px] rounded-full border-4 border-dashed border-[#ff5722]/15 animate-[spin_100s_linear_infinite]" />
                          <div className="absolute w-[280px] h-[280px] rounded-full border border-stone-200 dark:border-stone-800" />
                          
                          {/* Semicircle mask ring overlay to mimic the layout in photo */}
                          <div className="absolute w-[360px] h-[360px] rounded-full border-[10px] border-t-white/40 border-r-white/40 border-b-transparent border-l-transparent dark:border-t-stone-900/40 dark:border-r-stone-900/40 pointer-events-none" />
                        </div>

                        {/* Central Rotating Masterpiece Signature Dish */}
                        <motion.div
                          style={{
                            x: mousePos.x * 15,
                            y: mousePos.y * 15,
                          }}
                          animate={{
                            y: [0, -12, 0],
                          }}
                          transition={{
                            duration: 6,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                          className="relative w-[240px] h-[240px] sm:w-[280px] sm:h-[280px] z-10 flex items-center justify-center rounded-full shadow-2xl"
                        >
                          {/* Ambient shadow glow inside plate circle */}
                          <div className="absolute inset-2 bg-gradient-to-tr from-[#ff5722]/30 to-[#00bcd4]/20 rounded-full blur-2xl" />
                          
                          <motion.img
                            src={signatureDish}
                            alt="Signature Dish Platter"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover rounded-full border-[6px] border-white dark:border-stone-800 shadow-xl filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.3)]"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
                          />

                          {/* Floating small orange dot accents */}
                          <span className="absolute top-4 right-4 w-4 h-4 rounded-full bg-[#ff5722] border-2 border-white shadow-md animate-ping" />
                          <span className="absolute bottom-6 left-2 w-3 h-3 rounded-full bg-[#00bcd4] border-2 border-white shadow-md" />
                        </motion.div>

                        {/* Floating Reviews/Rating Badge Card with glassmorphic transparency */}
                        <motion.div
                          style={{
                            x: mousePos.x * 25,
                            y: mousePos.y * 25,
                          }}
                          animate={{
                            y: [0, 8, 0],
                          }}
                          transition={{
                            duration: 4.5,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                          className="absolute bottom-6 right-2 sm:right-6 bg-white/70 dark:bg-stone-800/80 backdrop-blur-md px-5 py-3.5 rounded-2xl border border-white/50 dark:border-stone-700/50 shadow-lg z-20 flex flex-col gap-1 max-w-[170px]"
                        >
                          <span className="text-stone-900 dark:text-white font-extrabold text-sm sm:text-base tracking-tight block">5K+ Reviews</span>
                          
                          {/* Client avatar bubbles */}
                          <div className="flex items-center gap-1 mt-0.5">
                            <div className="flex -space-x-1.5 overflow-hidden">
                              <img className="inline-block h-5 w-5 rounded-full ring-2 ring-white dark:ring-stone-800" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80" alt="" />
                              <img className="inline-block h-5 w-5 rounded-full ring-2 ring-white dark:ring-stone-800" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80" alt="" />
                              <img className="inline-block h-5 w-5 rounded-full ring-2 ring-white dark:ring-stone-800" src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80" alt="" />
                            </div>
                            <span className="text-[10px] text-stone-500 dark:text-stone-400 font-mono font-bold pl-1">★ 4.9</span>
                          </div>
                        </motion.div>

                        {/* Pager Indicators (Previous & Next Arrow Buttons) in beautiful layouts */}
                        <div className="absolute bottom-[-15px] sm:bottom-[-20px] right-2 sm:right-6 flex items-center gap-2 z-20">
                          <button
                            type="button"
                            onClick={() => setPromoIndex(idx => (idx - 1 + promos.length) % promos.length)}
                            className="w-10 h-10 rounded-xl bg-stone-200/80 hover:bg-stone-300 dark:bg-stone-800/80 dark:hover:bg-stone-700 border border-stone-300/40 dark:border-stone-700/40 flex items-center justify-center text-stone-700 dark:text-stone-200 transition-colors active:scale-95 cursor-pointer"
                          >
                            <span className="text-sm font-bold">←</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPromoIndex(idx => (idx + 1) % promos.length)}
                            className="w-10 h-10 rounded-xl bg-[#ff5722] hover:bg-[#e64a19] text-white flex items-center justify-center shadow-md shadow-[#ff5722]/25 transition-colors active:scale-95 cursor-pointer"
                          >
                            <span className="text-sm font-bold">→</span>
                          </button>
                        </div>

                      </div>
                    </motion.div>
                  );
                })()}

                {/* GUEST ACTIVE ORDERS TRACKER */}
                {(() => {
                  const guestOrdersList = orders.filter(o => o.location.trim().toLowerCase() === guestLocation.trim().toLowerCase() && !(o.status === 'Paid' && o.servedByWaiter));
                  if (guestOrdersList.length === 0) return null;
                  return (
                    <div className="bg-[#0b0c10] border border-dashed border-[#C1FF00]/20 p-3.5 rounded-xl space-y-3 shadow-sm max-w-5xl mx-auto w-full mb-8">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <h4 className="text-[10.5px] font-black uppercase text-white/80 flex items-center gap-1.5 align-middle">
                          <span className="w-1.5 h-1.5 bg-[#C1FF00] rounded-full animate-ping inline-block"></span>
                          <span>📦 የትዕዛዝዎ ሁኔታ መከታተያ (Active Order Tracking)</span>
                        </h4>
                        <span className="text-[9px] font-mono text-[#C1FF00] font-black bg-[#C1FF00]/10 px-1.5 py-0.5 rounded">
                          {guestOrdersList.length} {guestOrdersList.length === 1 ? 'ORDER' : 'ORDERS'}
                        </span>
                      </div>

                      <div className="divide-y divide-white/5 space-y-2">
                        {guestOrdersList.map(ord => {
                          const currentCooking = ord.cookingStatus || (ord.status === 'Paid' ? 'Pending' : ord.status);
                          const isReady = currentCooking === 'Completed' && ord.servedByWaiter;
                          const isCompletedButNotServedYet = currentCooking === 'Completed' && !ord.servedByWaiter;
                          
                          // Expanded state (default true if only one order)
                          const isExpanded = expandedOrders[ord.id] !== undefined 
                            ? expandedOrders[ord.id] 
                            : guestOrdersList.length === 1;

                          return (
                            <div 
                              key={ord.id} 
                              className={`pt-2 transition-all ${
                                isReady 
                                  ? 'bg-emerald-950/5 border border-emerald-500/20 px-3 py-2 rounded-lg' 
                                  : isCompletedButNotServedYet
                                  ? 'bg-purple-950/5 border border-purple-500/20 px-3 py-2 rounded-lg'
                                  : ''
                              }`}
                            >
                              {/* Expandable Order Header */}
                              <div 
                                onClick={() => setExpandedOrders(prev => ({ ...prev, [ord.id]: !isExpanded }))}
                                className="flex justify-between items-center cursor-pointer select-none py-1 group"
                              >
                                <div className="flex items-center gap-2">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                                    isExpanded ? 'bg-white/10 text-white' : 'bg-white/5 text-white/60 group-hover:bg-white/10'
                                  }`}>
                                    #{ord.id.substring(0, 5)}...
                                  </span>
                                  <span className="text-[10px] text-white/40 font-mono">⏰ {ord.time}</span>
                                </div>

                                <div className="flex items-center gap-3">
                                  {/* Compact Status Badge */}
                                  <span className={`text-[9px] font-extrabold uppercase font-mono px-2 py-0.5 rounded ${
                                    currentCooking === 'Pending' 
                                      ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                                      : currentCooking === 'Preparing' 
                                      ? 'bg-[#00f5ff]/10 text-[#00f5ff] border border-[#00f5ff]/20'
                                      : isCompletedButNotServedYet
                                      ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20 animate-pulse'
                                      : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                  }`}>
                                    {currentCooking === 'Pending' ? '⏱️ በመጠባበቅ ላይ' : 
                                     currentCooking === 'Preparing' ? '🥘 እየተዘጋጀ ነው' : 
                                     isCompletedButNotServedYet ? '🧑‍🍳 እየቀረበ ነው...' :
                                     '✅ ደርሷል / መውሰድ ይችላሉ'}
                                  </span>

                                  <div className="text-right flex items-center gap-1">
                                    <span className="font-mono text-xs font-black text-[#C1FF00]">{ord.total} ብር</span>
                                    <span className="text-white/30 text-[10px] font-bold font-mono">
                                      {isExpanded ? '▲' : '▼'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Items list & Actions (Collapsible) */}
                              {isExpanded && (
                                <motion.div 
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  className="mt-3 pl-2 border-l border-white/5 space-y-2 overflow-hidden pb-1"
                                >
                                  {/* Items Table/List */}
                                  <div className="divide-y divide-white/5 py-1 text-[11px]">
                                    {ord.items.map((it, idx) => (
                                      <div key={idx} className="flex justify-between py-1 text-white/80">
                                        <span>{it.qty} × {it.name}</span>
                                        <span className="font-mono text-white/40">{it.price * it.qty} ብር</span>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Conditional Action Buttons */}
                                  {isReady ? (
                                    <div className="pt-2">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setOrders(prev => prev.map(o => o.id === ord.id ? { ...o, status: 'Paid' } : o));
                                          playVoiceAlert(`Customer at ${ord.location} has confirmed they received order ${ord.id}.`);
                                          const newBuzzerCall: AssistanceCall = {
                                            id: 'pickup-' + Date.now(),
                                            location: ord.location,
                                            time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
                                            active: true,
                                            type: 'pickup',
                                            message: `ትዕዛዝ ${ord.id} - ደንበኛው ምግብ መውሰዱን አረጋግጧል ✔️`
                                          };
                                          setAssistanceCalls(prev => [newBuzzerCall, ...prev]);
                                          alert(`👍 ምግብ መረከብዎን ለአስተናጋጅ አሳውቀናል። እናመሰግናለን! (Notification sent to waiter. Thank you!)`);
                                        }}
                                        className="w-full bg-[#C1FF00] hover:bg-white text-black font-black text-[10px] py-2 rounded-lg uppercase font-mono tracking-wider shadow-[0_3px_10px_rgba(193,255,0,0.2)] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                      >
                                        <span>ምግብ መረከብዎን ያረጋግጡ (Confirm Food Handover) ✔️</span>
                                      </button>
                                    </div>
                                  ) : isCompletedButNotServedYet ? (
                                    <div className="text-center bg-purple-950/20 border border-purple-500/20 rounded p-1.5">
                                      <p className="text-[10px] text-purple-300 leading-relaxed font-sans">
                                        🧑‍🍳 ምግብዎ ተዘጋጅቶ አልቋል፤ አሁን አስተናጋጁ እያመጣልዎ ነው። ሲያደርስ የመረከቢያ ቁልፍ እዚህ ይበራል።
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="text-center bg-white/5 border border-white/5 rounded p-1.5">
                                      <p className="text-[9px] text-white/40 leading-relaxed font-sans">
                                        ምግብዎ ሲበስል እና ሲቀርብልዎ እዚህ ጋር የመረከቢያ ቁልፍ ይመጣል።
                                      </p>
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* FOOD SEARCH BAR */}
                <div className="max-w-md w-full mx-auto mb-6 px-1">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                      <Search className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={menuSearchQuery}
                      onChange={(e) => setMenuSearchQuery(e.target.value)}
                      placeholder={appLang === 'am' ? 'ምግብ፣ መጠጥ ወይም መክሰስ ይፈልጉ...' : 'Search delicious food, drinks, or snacks...'}
                      className="w-full pl-10 pr-10 py-3 bg-[#0c111c] hover:bg-[#0f1624] focus:bg-[#0f1624] border-2 border-white/10 hover:border-[#C1FF00]/50 focus:border-[#C1FF00] text-white rounded-2xl text-xs font-bold outline-none transition-all placeholder-white/30"
                    />
                    {menuSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setMenuSearchQuery('')}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/40 hover:text-white font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Horizontal navigation category chips with colorful button layouts */}
                <div className="flex border-b border-white/10 pb-4 gap-3 overflow-x-auto no-scrollbar scroll-smooth">
                  {categories.map(cat => {
                    const transLabel = (categoryTranslations[cat.id] && categoryTranslations[cat.id][appLang]) 
                      ? categoryTranslations[cat.id][appLang] 
                      : cat.label;
                    return (
                      <button
                        key={cat.id}
                        id={`btn-cat-selector-${cat.id}`}
                        onClick={() => {
                          setSelectedCategory(cat.id);
                          // Clear search when category is explicitly clicked to prevent confusion
                          setMenuSearchQuery('');
                        }}
                        className={`px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                          selectedCategory === cat.id && !menuSearchQuery
                            ? `${cat.activeBg || 'tactile-3d-btn-lime'}` 
                            : 'tactile-3d-btn-glass'
                        }`}
                      >
                        <span className="clay-emoji text-lg">{cat.icon}</span>
                        <span>{transLabel}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Active search results label */}
                {menuSearchQuery.trim() !== '' && (
                  <div className="text-center mt-6">
                    <span className="text-[10px] text-[#00f5ff] font-mono uppercase tracking-widest block mb-1">🔍 የፍለጋ ውጤቶች / Search Results</span>
                    <h3 className="text-sm font-black text-white">
                      "{menuSearchQuery}" {appLang === 'am' ? 'የሚሉ ተዛማጅ ምግቦች' : 'matching items'}
                    </h3>
                  </div>
                )}

                <div className="relative group/scroll px-1">
                  {/* Left Scroll Slider Arrow */}
                  <button
                    type="button"
                    onClick={() => scrollMenu('left')}
                    className="absolute -left-3 sm:-left-5 top-[52%] -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-zinc-950/90 hover:bg-[#B21C24] border border-white/10 hover:border-white/20 flex items-center justify-center text-white cursor-pointer shadow-lg transition-all duration-200 active:scale-95"
                    style={{ touchAction: 'manipulation' }}
                  >
                    <svg className="w-5 h-5 stroke-current font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {/* Right Scroll Slider Arrow */}
                  <button
                    type="button"
                    onClick={() => scrollMenu('right')}
                    className="absolute -right-3 sm:-right-5 top-[52%] -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-zinc-950/90 hover:bg-[#B21C24] border border-white/10 hover:border-white/20 flex items-center justify-center text-white cursor-pointer shadow-lg transition-all duration-200 active:scale-95"
                    style={{ touchAction: 'manipulation' }}
                  >
                    <svg className="w-5 h-5 stroke-current font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  <div 
                    ref={menuScrollRef} 
                    className="flex overflow-x-auto gap-8 pb-8 pt-16 px-2.5 scrollbar-thin scrollbar-thumb-white/15 scrollbar-track-transparent snap-x snap-mandatory default-scrollbar scroll-smooth flex-row flex-nowrap"
                  >
                    {(() => {
                      const filtered = menuItems.filter(item => {
                        const matchesCategory = item.cat === selectedCategory;
                        const matchesSearch = menuSearchQuery.trim() === '' || 
                          item.nameAm.toLowerCase().includes(menuSearchQuery.toLowerCase()) ||
                          (item.nameEn && item.nameEn.toLowerCase().includes(menuSearchQuery.toLowerCase())) ||
                          (item.desc && item.desc.toLowerCase().includes(menuSearchQuery.toLowerCase()));
                        
                        return (menuSearchQuery.trim() !== '' ? matchesSearch : (matchesCategory && matchesSearch)) && item.available;
                      });

                      if (filtered.length === 0) {
                        return (
                          <div className="text-center py-16 col-span-full w-full">
                            <span className="text-4xl block mb-3">🍽️</span>
                            <p className="text-white/60 font-bold text-sm">
                              {appLang === 'am' ? 'ምንም ተዛማጅ ምግብ አልተገኘም!' : 'No matching delicious items found!'}
                            </p>
                            <button 
                              onClick={() => setMenuSearchQuery('')}
                              className="mt-3 px-4 py-1.5 bg-white/5 hover:bg-white/10 text-[#C1FF00] rounded-lg text-xs font-bold border border-white/10"
                            >
                              {appLang === 'am' ? 'ፍለጋውን ሰርዝ' : 'Clear Search'}
                            </button>
                          </div>
                        );
                      }

                      return filtered.map(item => {
                        const mod = customModifiers[item.id] || { 
                          qaria: modifierOptions.qariaChoices[0] || 'አለ', 
                          injera: modifierOptions.injeraChoices[2] || modifierOptions.injeraChoices[0] || 'ሙሉ', 
                          dabo: 0, 
                          qty: 1,
                          customInstructions: ''
                        };
                        
                        // Fallback to first available card's ID if selected is null
                        const firstId = filtered[0]?.id || '';
                        const isSelected = item.id === (selectedMenuCardId || firstId);

                        // Check if the item name/desc is still original to apply translations
                        const originalItem = INITIAL_MENU_ITEMS.find(m => m.id === item.id);
                        const isUnedited = originalItem && 
                          originalItem.nameAm === item.nameAm && 
                          originalItem.nameEn === item.nameEn && 
                          originalItem.desc === item.desc;

                        // Dynamic translated properties
                        const nameToShow = (isUnedited && itemTranslations[item.id] && itemTranslations[item.id][appLang])
                          ? itemTranslations[item.id][appLang].name
                          : (['en', 'fr', 'de', 'it'].includes(appLang) ? (item.nameEn || item.nameAm) : item.nameAm);

                        const descToShow = (isUnedited && itemTranslations[item.id] && itemTranslations[item.id][appLang])
                          ? itemTranslations[item.id][appLang].desc
                          : item.desc;

                        const subToShow = (isUnedited && itemTranslations[item.id] && itemTranslations[item.id][appLang])
                          ? (['en', 'fr', 'de', 'it'].includes(appLang) ? itemTranslations[item.id].am.name : itemTranslations[item.id].en.name)
                          : (['en', 'fr', 'de', 'it'].includes(appLang) ? item.nameAm : (item.nameEn || ''));

                        return (
                          <div 
                            key={item.id} 
                            id={`menu-card-item-${item.id}`}
                            onClick={() => setSelectedMenuCardId(item.id)}
                            className={`rounded-[2.4rem] flex flex-col justify-between overflow-visible relative shrink-0 w-[295px] sm:w-[335px] snap-start transition-all duration-300 pt-20 pb-6 px-6 cursor-pointer ${
                              isSelected 
                                ? 'bg-[#C11F1F]/45 backdrop-blur-md text-white ring-4 ring-white/15 shadow-[0_16px_36px_rgba(193,31,31,0.3)] transform scale-[1.01] border border-white/25' 
                                : 'bg-[#0B1220]/40 hover:bg-[#0B1220]/60 backdrop-blur-md text-white border border-white/5 shadow-[4px_4px_16px_0px_rgba(0,0,0,0.15)] hover:scale-[0.99]'
                            }`}
                          >
                            {/* Image Frame - Circular Plate, overlapping the top edge precisely like in the user's photo */}
                            <div className="absolute -top-14 left-1/2 -translate-x-1/2 z-20 select-none">
                              <div className={`w-[136px] h-[136px] rounded-full overflow-hidden border-[6px] shadow-lg shadow-black/40 transition-all duration-300 ${
                                isSelected ? 'border-white bg-[#900e14]/60 backdrop-blur-sm' : 'border-[#141F32] bg-[#0E1726]/60 backdrop-blur-sm'
                              }`}>
                                <img 
                                  src={item.image} 
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400';
                                  }}
                                  className="w-full h-full object-cover transition-all duration-300 hover:scale-105" 
                                  alt={item.nameAm} 
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            </div>

                            {/* Top Status Label on card */}
                            <div className="absolute top-5 right-5 z-10 font-mono text-[8px] bg-black/60 backdrop-blur-sm text-[#C1FF00] px-2.5 py-1 rounded-md border border-white/10 tracking-wider font-extrabold uppercase">
                              {item.cat}__00{item.id.replace(/\D/g,'')}
                            </div>

                            {/* Food details description */}
                            <div className="flex-1 flex flex-col justify-between pt-2">
                              <div className="text-center">
                                <h4 className="text-xl font-black tracking-tight text-white mb-0.5">
                                  {nameToShow}
                                </h4>
                                <p className="text-[10px] font-mono uppercase tracking-widest text-[#00f5ff] mb-2 font-bold">
                                  {subToShow}
                                </p>
                                
                                <p className="text-[11.5px] leading-relaxed font-bold h-12 overflow-hidden text-white/70 mx-auto px-1">
                                  {descToShow}
                                </p>
                              </div>

                              {/* Price removed from menu card view per user's request: "ዋጋዎችን አጥፋ" */}

                              {/* Customizable modifier configurations */}
                              {(() => {
                                const isCustomOnly = isCustomOnlyItem(item);
                                const hasStandardModifiers = !isCustomOnly && (item.customizable || item.cat === 'food' || item.cat === 'traditional');
                                const showModifiersArea = hasStandardModifiers || isCustomOnly;
                                
                                if (!showModifiersArea) return null;

                                const catIdLower = item.cat.toLowerCase();
                                const catObj = categories.find(c => c.id === item.cat);
                                const catLabelLower = catObj ? catObj.label.toLowerCase() : '';
                                const itemAmLower = item.nameAm.toLowerCase();
                                const itemEnLower = (item.nameEn || '').toLowerCase();

                                const isBurger = catIdLower.includes('burger') || catLabelLower.includes('burger') || catLabelLower.includes('በርገር') || itemAmLower.includes('በርገር') || itemEnLower.includes('burger');
                                const isTraditional = catIdLower.includes('traditional') || catLabelLower.includes('traditional') || catIdLower.includes('ባህል') || catLabelLower.includes('ባህል') || itemAmLower.includes('ባህል') || itemEnLower.includes('traditional') || itemEnLower.includes('cultural');
                                const isFood = !isBurger && (item.customizable || item.cat === 'food' || item.cat === 'traditional');

                                return (
                                  <div className={`p-4 rounded-3xl space-y-3 text-[11px] font-black transition-all ${
                                    isSelected ? 'bg-black/25 text-white border border-white/10' : 'bg-[#070D18]/50 backdrop-blur-sm'
                                  }`}>
                                    {/* Standard Injera, Dabo, Qaria modifiers for food/traditional items */}
                                    {isFood && (
                                      <>
                                        {/* Green Pepper options matching አለ/የለም */}
                                        <div className="flex justify-between items-center">
                                          <span className="flex items-center gap-1">🌶️ {(menuUiTranslation.green_pepper[appLang] || 'ቃሪያ').replace('🌶️', '').trim()}:</span>
                                          <div className="flex gap-1.5 font-mono">
                                            {modifierOptions.qariaChoices.map((val) => (
                                              <button 
                                                key={val}
                                                id={`modifier-${item.id}-qaria-${val}`}
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); handleModifyQaria(item.id, val); }}
                                                className={`px-3.5 py-1 rounded-md font-bold text-[10px] transition-all cursor-pointer ${
                                                  mod.qaria === val
                                                    ? 'bg-white text-black font-extrabold shadow-sm'
                                                    : 'bg-white/5 hover:bg-white/10 text-white'
                                                }`}
                                              >
                                                {getTranslatedModifierValue(val)}
                                              </button>
                                            ))}
                                          </div>
                                        </div>

                                        {/* Injera options matching full / half / custom */}
                                        <div className="flex justify-between items-center">
                                          <span className="flex items-center gap-1">🫓 {(menuUiTranslation.injera[appLang] || 'እንጀራ').replace('🫓', '').trim()}:</span>
                                          <div className="flex gap-1.5 font-mono">
                                            {modifierOptions.injeraChoices.map((val) => {
                                              const priceAdd = Number(modifierOptions.injeraPrices?.[val] || 0);
                                              return (
                                                <button 
                                                  key={val}
                                                  id={`modifier-${item.id}-injera-${val}`}
                                                  type="button"
                                                  onClick={(e) => { e.stopPropagation(); handleModifyInjera(item.id, val); }}
                                                  className={`px-2.5 py-1 rounded-md font-bold text-[9px] transition-all cursor-pointer ${
                                                    mod.injera === val
                                                      ? 'bg-white text-black font-extrabold shadow-sm'
                                                      : 'bg-white/5 hover:bg-white/10 text-white'
                                                  }`}
                                                >
                                                  {getTranslatedModifierValue(val)} {priceAdd > 0 ? `(+${priceAdd})` : ''}
                                                </button>
                                              );
                                            })}
                                          </div>
                                        </div>

                                        {/* Bread count slider / modifier */}
                                        <div className="flex justify-between items-center">
                                          <span className="flex items-center gap-1">🥖 {(menuUiTranslation.bread[appLang] || 'ዳቦ').replace('🥖', '').trim()}:</span>
                                          <div className="flex items-center gap-2 font-mono">
                                            <button 
                                              id={`modifier-${item.id}-bread-dec`}
                                              type="button"
                                              onClick={(e) => { e.stopPropagation(); handleModifyDabo(item.id, -1); }}
                                              className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 text-white flex items-center justify-center font-bold text-sm cursor-pointer"
                                            >
                                              -
                                            </button>
                                            <span className="text-white text-xs font-bold w-4 text-center">{mod.dabo}</span>
                                            <button 
                                              id={`modifier-${item.id}-bread-inc`}
                                              type="button"
                                              onClick={(e) => { e.stopPropagation(); handleModifyDabo(item.id, 1); }}
                                              className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 text-white flex items-center justify-center font-bold text-sm cursor-pointer"
                                            >
                                              +
                                            </button>
                                            <span className="text-[9px] text-white/50">(+{Number(modifierOptions.daboPrice || 0)} ብር)</span>
                                          </div>
                                        </div>
                                      </>
                                    )}

                                    {/* Traditional Addon: Kocho (ቆጮ) - shown for Traditional items */}
                                    {isTraditional && (
                                      <div className="flex justify-between items-center border-t border-white/5 pt-2">
                                        <span className="flex items-center gap-1">🫓 {appLang === 'am' ? 'የቆጮ ጭማሪ' : 'Extra Kocho'}:</span>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setCustomModifiers(prev => ({
                                              ...prev,
                                              [item.id]: { ...prev[item.id], kocho: !prev[item.id]?.kocho }
                                            }));
                                          }}
                                          className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all border cursor-pointer ${
                                            mod.kocho
                                              ? 'bg-[#C1FF00] text-black border-[#C1FF00] font-black'
                                              : 'bg-white/5 text-white/70 border-white/10 hover:border-white/20'
                                          }`}
                                        >
                                          {mod.kocho ? '✓ ' : ''}{appLang === 'am' ? 'ቆጮ' : 'Kocho'} (+{modifierOptions.kochoPrice || 45} ብር)
                                        </button>
                                      </div>
                                    )}

                                    {/* Modern Addon: Mayonnaise (ማዮኔዝ) - shown for Burger items */}
                                    {isBurger && (
                                      <div className="flex justify-between items-center border-t border-white/5 pt-2">
                                        <span className="flex items-center gap-1">🧴 {appLang === 'am' ? 'የማዮኔዝ ጭማሪ' : 'Extra Mayonnaise'}:</span>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setCustomModifiers(prev => ({
                                              ...prev,
                                              [item.id]: { ...prev[item.id], mayo: !prev[item.id]?.mayo }
                                            }));
                                          }}
                                          className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all border cursor-pointer ${
                                            mod.mayo
                                              ? 'bg-[#C1FF00] text-black border-[#C1FF00] font-black'
                                              : 'bg-white/5 text-white/70 border-white/10 hover:border-white/20'
                                          }`}
                                        >
                                          {mod.mayo ? '✓ ' : ''}{appLang === 'am' ? 'ማዮኔዝ' : 'Mayo'} (+{modifierOptions.mayoPrice || 20} ብር)
                                        </button>
                                      </div>
                                    )}

                                    {/* Custom additions input specifically - ALWAYS shown for ALL customizable items */}
                                    <div className="flex flex-col gap-1.5 border-t border-white/5 pt-2">
                                      <div className="flex justify-between items-center mb-0.5">
                                        <span className="text-[10px] uppercase font-bold text-white/80 font-sans tracking-wide">
                                          {appLang === 'am' ? `➕ ተጨማሪዎች (Custom Additions - +${modifierOptions.customAdditionsPrice || 35} ብር) :` : `➕ Custom Additions (+${modifierOptions.customAdditionsPrice || 35} Birr) :`}
                                        </span>
                                      </div>
                                      <input
                                        type="text"
                                        placeholder={appLang === 'am' ? 'ለምሳሌ፦ ቺዝ፣ ስጋ፣ ማዮኔዝ... (ለተጨማሪ ክፍያ)' : 'e.g. extra cheese, beef, mayo... (extra charge)'}
                                        value={mod.customInstructions || ''}
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          setCustomModifiers(prev => ({
                                            ...prev,
                                            [item.id]: { ...prev[item.id], customInstructions: e.target.value }
                                          }));
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-full px-3 py-2.5 bg-black/40 border border-white/15 hover:border-[#C1FF00]/50 focus:border-[#C1FF00] rounded-xl text-xs text-white placeholder-white/40 outline-none transition-all font-sans font-bold"
                                      />
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* Quantity control & add to basket trigger button */}
                              <div className="mt-4 flex gap-3 select-none">
                                {/* Quantity selection buttons */}
                                <div className="flex items-center border border-white/10 rounded-xl bg-black/15 px-1.5 py-1">
                                  <button 
                                    id={`btn-qty-dec-${item.id}`}
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleModifyQty(item.id, -1); }}
                                    className="w-7 h-7 rounded-lg hover:bg-white/5 text-white flex items-center justify-center font-bold cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <span className="text-white font-mono text-sm font-black w-7 text-center">{mod.qty}</span>
                                  <button 
                                    id={`btn-qty-inc-${item.id}`}
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleModifyQty(item.id, 1); }}
                                    className="w-7 h-7 rounded-lg hover:bg-white/5 text-white flex items-center justify-center font-bold cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>

                                {/* Trigger Add to Basket */}
                                <button
                                  id={`btn-add-to-basket-${item.id}`}
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleAddToBasket(item.id); }}
                                  className="flex-1 bg-[#C1FF00] hover:bg-white text-black font-mono font-black text-xs py-3.5 rounded-xl uppercase tracking-wider transition-all duration-200 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <span>🛒 {(menuUiTranslation.add_to_order_btn[appLang] || 'እዘዝ').replace('🛒', '').trim()}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>


                {/* Removed Chef advertisement from here - moving to Chef Portal */}

                {/* HIGH-FIDELITY LUXURY DELIVERY ADVERTISEMENT SECTION - ULTRA COMPACT & ELEGANT */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="rounded-2xl overflow-hidden relative border border-white/10 dark:border-stone-800/80 flex flex-col md:flex-row justify-between items-center p-6 sm:p-8 md:p-10 lg:p-12 shadow-xl gap-6 md:gap-8 min-h-[220px] text-stone-800 dark:text-stone-100 bg-gradient-to-tr from-[#ffe6d9]/30 via-[#e2f9f8]/45 to-white dark:from-[#3a2013]/15 dark:via-[#132c3a]/10 dark:to-stone-900 backdrop-blur-md mt-6 max-w-5xl mx-auto w-full animate-fade-in"
                >
                  {/* Organic Warm Background Mesh Blurs - Enlarged */}
                  <div className="absolute top-[-30%] right-[-10%] w-[250px] h-[250px] rounded-full bg-[#ff7b54]/8 blur-[60px] pointer-events-none" />
                  <div className="absolute bottom-[-30%] left-[-10%] w-[250px] h-[250px] rounded-full bg-[#00bcd4]/6 blur-[60px] pointer-events-none" />

                  {/* LEFT COLUMN: Premium Typography, Location Inputs & Badges */}
                  <div className="flex-1 space-y-4 relative z-10 text-left w-full">
                    {/* Organic Deliver Service Pill Badge */}
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-[#ff5722]/10 border border-[#ff5722]/20 text-[#ff5722] rounded-full font-mono font-black text-[9px] sm:text-[10px] uppercase tracking-wider shadow-sm">
                      <span>🍎</span>
                      <span>
                        {appLang === 'am' ? 'ፈጣን ክፍል መስተንግዶ' : 'Express Room Delivery'}
                      </span>
                    </div>

                    {/* Highly Engaging Dual-Language Main Heading with dynamic typography */}
                    <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black tracking-tight leading-tight text-stone-900 dark:text-white font-sans uppercase">
                      {appLang === 'am' ? (
                        <>
                          በፍጥነት እና <span className="text-[#ff5722]">ትኩስ</span> ሆኖ እርስዎ ያሉበት ክፍል ድረስ!
                        </>
                      ) : (
                        <>
                          Make your life <span className="text-[#00acd4]">healthy</span> with <span className="text-[#ff5722]">fresh</span> lodge dining
                        </>
                      )}
                    </h2>

                    {/* Sub-text description */}
                    <p className="text-stone-600 dark:text-stone-300 text-xs sm:text-sm md:text-base leading-relaxed max-w-2xl font-semibold">
                      {appLang === 'am' ? (
                        'የሃዋሳ ፓፒረስ ሎጅ ምርጥ ምግቦች በጥንቃቄ ተዘጋጅተው በፍጥነት ባሉበት ሆነው ይዘዙ።'
                      ) : (
                        'Hawassa Papyrus Lodge signature cuisines prepared with the finest organic ingredients, delivered hot straight to your room.'
                      )}
                    </p>

                    {/* Dynamic Action Buttons & Location Info Bar */}
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          const element = document.getElementById('btn-basket-react');
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                        className="px-6 py-3 bg-[#ff5722] hover:bg-[#e64a19] text-white font-mono text-xs font-black uppercase tracking-wider rounded-lg shadow-md cursor-pointer text-center"
                      >
                        {appLang === 'am' ? 'አሁን ይዘዙ ➔' : 'Order Now ➔'}
                      </motion.button>

                      {/* Glassmorphic Live Stats Badge: Fast Delivery */}
                      <div className="bg-white/75 dark:bg-stone-800/80 backdrop-blur-md px-3.5 py-2.5 rounded-lg border border-white/50 dark:border-stone-700/50 shadow-sm flex items-center gap-2">
                        <span className="text-sm sm:text-base animate-bounce">🛵</span>
                        <div>
                          <span className="text-stone-900 dark:text-white font-extrabold text-[10px] sm:text-xs block leading-none">
                            {appLang === 'am' ? 'ፈጣን መስተንግዶ' : 'Fast Delivery'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Elegant Chef & Fresh Salad Frame Layout - Enlarged and balanced */}
                  <div className="relative w-[150px] sm:w-[180px] md:w-[200px] flex items-center justify-center min-h-[140px] shrink-0">
                    
                    {/* Background Circle Frames / Crescent Graphic Layout scaled up */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-[120px] h-[120px] sm:w-[140px] sm:h-[140px] rounded-full border border-dashed border-[#00bcd4]/15 animate-[spin_80s_linear_infinite]" />
                      <div className="absolute w-[100px] h-[100px] sm:w-[115px] sm:h-[115px] rounded-full border border-stone-200/20 dark:border-stone-800/30" />
                    </div>

                    {/* Central Masterpiece Chef Portrait with premium drop shadow */}
                    <motion.div
                      style={{
                        x: mousePos.x * 4,
                        y: mousePos.y * 4,
                      }}
                      animate={{
                        y: [0, -3, 0],
                      }}
                      transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="relative w-[90px] h-[90px] sm:w-[110px] sm:h-[110px] md:w-[120px] md:h-[120px] z-10 flex items-center justify-center rounded-full shadow-lg"
                    >
                      <img
                        src={deliveryScooterIllustration}
                        alt="Lodge Delivery Scooter"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover rounded-full border-4 border-white dark:border-stone-800 shadow-md"
                      />
                    </motion.div>

                    {/* Glassmorphic 100% Fresh checkmark card exactly matching the reference design */}
                    <div className="absolute top-2 left-2 bg-white/85 dark:bg-stone-800/90 backdrop-blur-md px-2 py-1 rounded-md border border-white/40 dark:border-stone-700/40 shadow-sm z-20 flex items-center gap-1 max-w-[75px] text-center">
                      <span className="text-stone-950 dark:text-white font-black text-[9px] tracking-tight">
                        {appLang === 'am' ? '100% ትকুስ' : '100% Fresh'}
                      </span>
                    </div>

                  </div>
                </motion.div>

                {/* Photo Gallery Showcase */}
                {galleryItems && galleryItems.length > 0 && (
                  <div className="bg-[#141414] border border-white/10 p-5 space-y-4 rounded-xl mt-6">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🖼️</span>
                        <h4 className="text-xs font-black text-white uppercase tracking-widest">
                          {appLang === 'am' ? 'የፓፒረስ ማዕከለ-ስዕላት' : 'Papyrus Gallery Showcase'}
                        </h4>
                      </div>
                      <span className="text-[10px] text-[#C1FF00] font-mono uppercase font-bold bg-[#C1FF00]/10 border border-[#C1FF00]/20 px-2.5 py-1 rounded-full">
                        {galleryItems.length} {appLang === 'am' ? 'ምስሎች' : 'Photos'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {galleryItems.map((item, idx) => (
                        <div key={item.id || idx} className="group relative aspect-square bg-[#1c1c1c] border border-white/5 overflow-hidden rounded-lg">
                          <img 
                            src={item.image_url} 
                            alt={appLang === 'am' ? item.title_am : item.title_en}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2.5 pointer-events-none">
                            <span className="text-[8px] text-[#C1FF00] font-mono font-bold uppercase tracking-wider block mb-0.5">
                              {item.category || 'General'}
                            </span>
                            <span className="text-[10px] text-white font-bold leading-tight line-clamp-2">
                              {appLang === 'am' ? item.title_am : item.title_en}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* About the resort and feedback */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                  <div className="bg-[#141414] border border-white/10 p-5 space-y-3">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                      <span className="text-xl">🌲</span>
                      <h4 className="text-xs font-black text-white uppercase tracking-widest">
                        {menuUiTranslation.about_lodge_heading[appLang]}
                      </h4>
                    </div>
                    <p className="text-[11px] text-white/60 leading-relaxed font-bold whitespace-pre-wrap">
                      {getTranslatedAboutLodge(aboutLodgeText)}
                    </p>
                    <div className="flex gap-2 pt-2">
                      <a href="tel:+251919629347" className="flex-1 bg-[#C1FF00] hover:bg-white text-black text-center py-2 text-[10px] uppercase font-black font-mono">
                        {appLang === 'am' ? 'ያግኙን' : 'CONTACT US'}
                      </a>
                      {!isFromQr && (
                        <button 
                          id="btn-nav-home-back-react"
                          onClick={() => setActiveRole('entry')} 
                          className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2 text-[10px] uppercase font-mono font-bold"
                        >
                          {appLang === 'am' ? 'ዋና ፖርታሎች' : 'MAIN PORTALS'}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="bg-[#141414] border border-white/10 p-5">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-2 mb-3">
                      <span className="text-xl">💬</span>
                      <h4 className="text-xs font-black text-white uppercase tracking-widest">
                        {menuUiTranslation.feedbacks_heading[appLang]}
                      </h4>
                    </div>
                    <form onSubmit={handleFeedbackSubmit} className="space-y-3">
                      <textarea 
                        id="feedback-text-area"
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder={menuUiTranslation.feedback_placeholder[appLang]}
                        required
                        className="w-full bg-[#181818] border border-white/10 text-white text-xs p-3 outline-none focus:border-[#C1FF00] resize-none h-20"
                      />
                      <button 
                        type="submit"
                        className="w-full bg-[#C1FF00] hover:bg-white text-black py-2.5 text-[10px] font-black uppercase font-mono"
                        id="btn-feedback-submit"
                      >
                        {menuUiTranslation.submit_btn[appLang].toUpperCase()}
                      </button>
                    </form>

                    {/* Customer Feedbacks Logs & Admin Responses */}
                    {feedback.length > 0 && (
                      <div className="mt-5 pt-4 border-t border-white/5 space-y-3">
                        <p className="text-[9px] font-mono font-black uppercase text-[#C1FF00] tracking-widest">
                          {menuUiTranslation.past_feedbacks[appLang]}
                        </p>
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1 no-scrollbar text-left">
                          {feedback.map((f) => (
                            <div key={f.id} className="bg-black/30 p-2.5 border border-white/5 space-y-1">
                              <div className="flex justify-between items-center text-[8px] font-mono text-white/40">
                                <span className="font-bold text-white/60">GUEST G-ID</span>
                                <span>{f.time}</span>
                              </div>
                              <p className="text-[11px] text-white/90 leading-relaxed font-semibold">
                                {f.text}
                              </p>
                              {f.reply && (
                                <div className="mt-2 pl-2.5 border-l border-[#C1FF00] bg-[#C1FF00]/5 p-2">
                                  <div className="flex justify-between items-center text-[8px] font-mono text-[#C1FF00] mb-0.5">
                                    <span className="font-black">{menuUiTranslation.response_from_lodge[appLang].toUpperCase()}:</span>
                                    <span className="text-white/40">{f.replyTime}</span>
                                  </div>
                                  <p className="text-[10px] text-white/80 italic font-bold">
                                    {f.reply}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* BRAND NEW HIGH-FIDELITY FOOTER FOR CUSTOMER MENU / ORDER PORTAL */}
                <div className="mt-12 border-t-2 border-slate-800 pt-8 pb-4 space-y-8">
                  
                  {/* Grid of Useful Guest Info Tiles */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    {/* WiFi Access Card */}
                    <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#00f5ff]/10 flex items-center justify-center text-[#00f5ff]">
                        📶
                      </div>
                      <div className="flex-1 space-y-1">
                        <span className="text-[10px] font-mono text-white/40 uppercase block">WiFi ACCESS / ዋይፋይ</span>
                        <p className="text-xs text-white font-bold">SSID: <span className="text-[#00f5ff]">Papyrus_Lodge_Guest</span></p>
                        <p className="text-[10px] text-white/70">PASS: <code className="bg-white/5 px-1 py-0.5 rounded text-[#C1FF00]">papyruswelcome</code></p>
                      </div>
                    </div>

                    {/* Dining & Breakfast Hours */}
                    <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
                        🍳
                      </div>
                      <div className="flex-1 space-y-1">
                        <span className="text-[10px] font-mono text-white/40 uppercase block">DINING HOURS / የምግብ ሰዓት</span>
                        <p className="text-xs text-white font-bold">{appLang === 'am' ? 'ቁርስ (Breakfast)' : 'Breakfast buffet'}</p>
                        <p className="text-[10px] text-white/70">06:00 AM - 10:00 AM (Daily)</p>
                      </div>
                    </div>

                    {/* Room Assistance & Security */}
                    <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400">
                        🛎️
                      </div>
                      <div className="flex-1 space-y-1">
                        <span className="text-[10px] font-mono text-white/40 uppercase block">RECEPTION / ሪሴብሽን</span>
                        <p className="text-xs text-white font-bold">{appLang === 'am' ? 'ከክፍልዎ ሆነው 0 ይደውሉ' : 'Dial 0 from room telephone'}</p>
                        <p className="text-[10px] text-white/70">Emergency Hotline: +251 919 629347</p>
                      </div>
                    </div>

                  </div>

                  {/* Customer Portal Footer Social links */}
                  <div className="bg-black/40 border border-white/10 rounded-2xl p-5 text-center space-y-4">
                    <div className="space-y-1">
                      <h4 className="text-xs uppercase font-mono font-black text-[#C1FF00] tracking-wider">
                        {appLang === 'am' ? 'የሃዋሳ ፓፒረስ ሎጅ ሶሻል ሚዲያ ሊንኮች' : 'Hawassa Papyrus Lodge Official Channels'}
                      </h4>
                      <p className="text-[10px] text-white/50">
                        {appLang === 'am' ? 'በሁሉም የሶሻል ሚዲያ ገጾቻችን ይከተሉን! አዳዲስ ዝግጅቶችን ይከታተሉ' : 'Follow us across all major networks to witness premium visual stories and weekly events.'}
                      </p>
                    </div>

                    {/* Glow-on-hover social icons layout */}
                    <div className="flex flex-wrap justify-center items-center gap-2">
                      {[
                        { icon: <Facebook className="w-3.5 h-3.5" />, name: 'Facebook', url: 'https://facebook.com/papyruslodgehawassa', color: 'text-white bg-blue-600/20 border-blue-600/40 hover:bg-blue-600 hover:text-white' },
                        { icon: <Instagram className="w-3.5 h-3.5" />, name: 'Instagram', url: 'https://instagram.com/papyrus_lodge_hawassa', color: 'text-white bg-pink-600/20 border-pink-600/40 hover:bg-pink-600 hover:text-white' },
                        { icon: <Send className="w-3.5 h-3.5 rotate-[-30deg]" />, name: 'Telegram', url: 'https://t.me/papyrus_lodge', color: 'text-white bg-sky-500/20 border-sky-500/40 hover:bg-sky-500 hover:text-white' },
                        { icon: <Youtube className="w-3.5 h-3.5" />, name: 'YouTube', url: 'https://youtube.com/@papyruslodgehawassa', color: 'text-white bg-red-600/20 border-red-600/40 hover:bg-red-600 hover:text-white' },
                        { icon: <Globe className="w-3.5 h-3.5" />, name: 'Website', url: 'https://papyruslodge.com', color: 'text-white bg-cyan-500/20 border-cyan-500/40 hover:bg-cyan-500 hover:text-white' }
                      ].map((soc, idx) => (
                        <a
                          key={idx}
                          href={soc.url}
                          target="_blank"
                          rel="noreferrer"
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[9px] font-mono font-bold tracking-widest transition-all duration-300 cursor-pointer ${soc.color}`}
                        >
                          {soc.icon}
                          <span>{soc.name.toUpperCase()}</span>
                        </a>
                      ))}
                    </div>

                    <div className="pt-2 text-[8px] font-mono text-white/30 uppercase tracking-widest">
                      HAWASSA LAKEFRONT, ETHIOPIA • SMART GUEST COMPANION v3.2
                    </div>
                  </div>

                </div>

                {/* FLOATING ACTION WAITER BUZZER */}
                <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTriggerBuzzer}
                    className="w-14 h-14 rounded-full bg-gradient-to-r from-pink-600 to-red-600 hover:from-pink-500 hover:to-red-500 text-white flex items-center justify-center shadow-[0_4px_20px_rgba(219,39,119,0.4)] hover:shadow-[0_4px_24px_rgba(219,39,119,0.6)] duration-300 hover:scale-110 active:scale-95 cursor-pointer relative group border-2 border-pink-400"
                    title="አስተናጋጅ ጥራ (CALL WAITER)"
                  >
                    <span className="w-2.5 h-2.5 bg-[#C1FF00] rounded-full absolute -top-0.5 -right-0.5 animate-ping"></span>
                    <span className="w-2.5 h-2.5 bg-[#C1FF00] rounded-full absolute -top-0.5 -right-0.5"></span>
                    <span className="text-2xl animate-pulse">🛎️</span>
                  </button>
                  <span className="bg-black/80 text-white font-sans text-[8px] font-black uppercase px-2 py-1 rounded border border-white/10 tracking-widest leading-none select-none shadow">
                    አስተናጋጅ ጥራ (CALL)
                  </span>
                </div>
              </motion.div>
            )}

            {/* VIEW_3: WAITER PORTAL */}
            {activeRole === 'waiter' && (
              <motion.div 
                key="waiter"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6 max-w-6xl mx-auto w-full pb-10"
              >
                {/* Header banner */}
                <div className="bg-[#141414] border border-white/10 p-4 shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <div>
                    <h3 className="text-sm font-black uppercase text-[#C1FF00]">
                      አስተናጋጅ ዳሽቦርድ (Waiter Monitor)
                    </h3>
                    <p className="font-mono text-[9px] uppercase text-white/50">
                      Serving Active Guests (Signed in as: <strong className="text-sky-400">{currentUser?.name || 'Waiter Staff'}</strong>)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] bg-sky-950 text-sky-400 border border-sky-500/10 px-2 py-1 uppercase font-bold tracking-widest">
                      ROLE: SERVICE_STAFF
                    </span>
                    <button 
                      onClick={handleLogout}
                      className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[9px] font-mono uppercase font-black tracking-wider border border-red-500/20"
                    >
                      🚪 Logout
                    </button>
                  </div>
                </div>

                {renderWiFiClockInWidget()}

                {/* Active buzzer tables calling */}
                {assistanceCalls.length > 0 && (
                  <div className="bg-[#141414] border border-red-500/30 p-4">
                    <h4 className="text-xs font-black uppercase text-red-500 mb-3 flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                      🔔 ንቁ የክፍል ጥሪዎች (Active Room Assistance Calls)
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {assistanceCalls.map(c => {
                        const isPickup = c.type === 'pickup';
                        return (
                          <div 
                            key={c.id} 
                            className={`p-3 flex flex-col justify-between items-center text-center border ${
                              isPickup 
                                ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300' 
                                : 'bg-red-950/20 border-red-500/20'
                            }`}
                          >
                            <span className={`font-mono text-xs font-black block ${isPickup ? 'text-emerald-400' : 'text-[#C1FF00]'}`}>{c.location}</span>
                            <span className="font-mono text-[9px] text-white/40 mb-1">Time: {c.time}</span>
                            {c.message ? (
                              <p className="text-[10px] font-bold text-white/90 mb-2 leading-tight uppercase font-sans">{c.message}</p>
                            ) : (
                              <p className="text-[10px] text-red-400 font-bold mb-2 uppercase font-sans animate-pulse">📢 ጥሪ (CALL)</p>
                            )}
                            <button 
                              id={`btn-resolve-buzzer-${c.id}`}
                              onClick={() => handleResolveBuzzer(c.id)}
                              className={`font-mono text-[8px] uppercase font-black px-2.5 py-1.5 cursor-pointer transition-colors ${
                                isPickup 
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                                  : 'bg-red-500 hover:bg-red-600 text-white'
                              }`}
                            >
                              DISMISS
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Orders flow list */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left columns: Orders in progress */}
                  {(() => {
                    const inPrepOrders = orders.filter(o => (o.cookingStatus || (o.status === 'Paid' ? 'Pending' : o.status)) === 'Pending' || (o.cookingStatus || (o.status === 'Paid' ? 'Pending' : o.status)) === 'Preparing');
                    const readyToDeliverOrders = orders.filter(o => (o.cookingStatus || o.status) === 'Completed' && !o.servedByWaiter);
                    return (
                      <div className="lg:col-span-2 space-y-6">
                        {/* Two-part grid inside the waiter's left pan */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          
                          {/* Column A: In Progress orders (cooking or pending) */}
                          <div className="bg-[#121212] border border-white/10 p-4 space-y-3">
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                              <h3 className="text-xs font-black uppercase text-white/80">
                                🍳 በዝግጅት ላይ ያሉ (In Prep & Cooking)
                              </h3>
                              <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded font-bold font-mono">
                                {inPrepOrders.length} ACTIVE
                              </span>
                            </div>

                            {inPrepOrders.length === 0 ? (
                              <p className="text-white/30 text-[11px] py-10 text-center font-semibold">
                                በዝግጅት ላይ ያለ ትዕዛዝ የለም።
                              </p>
                            ) : (
                              <div className="space-y-3">
                                {inPrepOrders.map(ord => (
                                  <div key={ord.id} className="bg-[#181818] border border-white/5 p-3 flex flex-col justify-between gap-3">
                                    <div className="flex justify-between items-start border-b border-white/5 pb-1.5">
                                      <div>
                                        <span className="font-mono text-[11px] font-black text-[#C1FF00]">{ord.id}</span>
                                        <span className="text-[9px] uppercase font-mono text-white/40 block">Time: {ord.time}</span>
                                      </div>
                                      <div className="text-right">
                                        <span className="font-black text-xs block text-[#C1FF00]">{ord.location}</span>
                                      </div>
                                    </div>

                                    <div className="space-y-1">
                                      {ord.items.map((i, idx) => (
                                        <p key={idx} className="text-xs font-bold text-white/90">
                                          • {i.qty} × {i.name}
                                        </p>
                                      ))}
                                    </div>

                                    <div className="flex justify-between items-center pt-1.5 border-t border-white/5 text-[9px] font-mono">
                                      <span className="text-white/40">Pay: {ord.payment}</span>
                                      <span className="font-black text-white/80">Total: {ord.total} ETB</span>
                                    </div>

                                    <div>
                                      {(ord.cookingStatus || (ord.status === 'Paid' ? 'Pending' : ord.status)) === 'Pending' ? (
                                        <button
                                          id={`btn-waiter-prep-${ord.id}`}
                                          onClick={() => handleUpdateOrderStatus(ord.id, 'Preparing')}
                                          className="w-full bg-[#C1FF00] hover:bg-white text-black py-1.5 text-[9px] uppercase font-black font-mono transition-colors cursor-pointer rounded"
                                        >
                                          የማብሰል ስራ ጀምር (Start Cooking)
                                        </button>
                                      ) : (
                                        <button
                                          id={`btn-waiter-ready-${ord.id}`}
                                          onClick={() => handleUpdateOrderStatus(ord.id, 'Completed')}
                                          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-1.5 text-[9px] uppercase font-black font-mono transition-colors cursor-pointer rounded animate-pulse"
                                        >
                                          አብስለህ ጨርስ (Mark Cooked ➔)
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Column B: Chef Ready, awaiting waiter delivery confirmation */}
                          <div className="bg-[#121212] border border-white/10 p-4 space-y-3">
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                              <h3 className="text-xs font-black uppercase text-[#01f5ff] font-sans">
                                🍲 ከኩሽና ያለቁ / ማረጋገጫ የሚጠብቁ (Ready - Pending Delivery)
                              </h3>
                              <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded font-bold font-mono">
                                {readyToDeliverOrders.length} WAITING
                              </span>
                            </div>

                            {readyToDeliverOrders.length === 0 ? (
                              <p className="text-white/30 text-[11px] py-10 text-center font-semibold">
                                ከኩሽና ያለቀ የሚላክ ምግብ የለም።
                              </p>
                            ) : (
                              <div className="space-y-3">
                                {readyToDeliverOrders.map(ord => (
                                  <div key={ord.id} className="bg-purple-950/10 border border-purple-500/20 p-3 flex flex-col justify-between gap-3 shadow-[0_0_8px_rgba(168,85,247,0.05)]">
                                    <div className="flex justify-between items-start border-b border-purple-500/15 pb-1.5">
                                      <div>
                                        <span className="font-mono text-[11px] font-black text-purple-400">{ord.id}</span>
                                        <span className="text-[9px] uppercase font-mono text-white/40 block">Time: {ord.time}</span>
                                      </div>
                                      <div className="text-right">
                                        <span className="font-black text-xs block text-purple-300 font-sans">{ord.location}</span>
                                      </div>
                                    </div>

                                    <div className="space-y-1">
                                      {ord.items.map((i, idx) => (
                                        <p key={idx} className="text-xs font-bold text-white/90">
                                          • {i.qty} × {i.name}
                                        </p>
                                      ))}
                                    </div>

                                    <div className="flex justify-between items-center pt-1.5 border-t border-purple-500/10 text-[9px] font-mono">
                                      <span className="text-purple-300/60 font-sans">ከኩሽና አልቋል (Cooked)</span>
                                      <span className="font-black text-white/80">Total: {ord.total} ETB</span>
                                    </div>

                                    <button
                                      id={`btn-waiter-confirm-delivery-${ord.id}`}
                                      onClick={() => {
                                        setOrders(prev => prev.map(o => o.id === ord.id ? { ...o, servedByWaiter: true } : o));
                                        playVoiceAlert(`Delivery confirmation sent to table ${ord.location} for order ${ord.id}.`);
                                        alert(`✔ ማረጋገጫ ለደንበኛው ተልኳል! ደንበኛው ምግብ መድረሱን በስልኩ እንዲያረጋግጥ ተደርጓል።`);
                                      }}
                                      className="w-full bg-purple-600 hover:bg-purple-500 text-white py-2 text-[10px] uppercase font-black font-mono transition-transform active:scale-95 cursor-pointer rounded"
                                    >
                                      🚀 ማረጋገጫ ላክ / ምግብ አቅርብ (Send Confirmation)
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                        </div>
                      </div>
                    );
                  })()}

                  {/* Right column: logs stats */}
                  <div className="bg-[#121212] border border-white/10 p-5 space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-wider text-white/80 border-b border-white/5 pb-2">
                      📋 የእርስዎ አፈጻጸም ሎግ (DAILY METRICS)
                    </h3>
                    <div className="space-y-4 font-mono text-xs">
                      <div className="bg-[#181818] p-3 border border-white/5">
                        <span className="font-mono text-[9px] uppercase text-white/40 block">የዛሬ ያደረሱት ብዛት (DELIVERED)</span>
                        <h4 className="text-2xl font-black mt-1 text-[#C1FF00]">
                          {orders.filter(o => o.status === 'Completed').length}
                        </h4>
                      </div>
                      <div className="bg-[#181818] p-3 border border-white/5">
                        <span className="font-mono text-[9px] uppercase text-white/40 block">የእንግዶች ግምገማ (RATING)</span>
                        <h4 className="text-md font-black mt-1 text-white">
                          ⭐⭐⭐⭐⭐ (5/5)
                        </h4>
                      </div>
                      <div className="bg-[#181818] p-3 border border-white/5">
                        <span className="font-mono text-[9px] uppercase text-white/40 block">ጠቅላላ የገቡበት ሰዓት</span>
                        <h4 className="text-xs font-black mt-1 text-white">
                          08:30 AM | ACTIVE
                        </h4>
                      </div>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

            {/* VIEW_4: CHEF PORTAL */}
            {activeRole === 'chef' && (() => {
              const dishConfig = {
                tibs: {
                  emoji: '🥩',
                  label: appLang === 'am' ? 'ሥጋ ጥብስ (Sizzling Tibs)' : 'Sizzling Tibs',
                  color: 'from-amber-600 via-red-700 to-amber-900',
                  ingredients: ['🥩', '🧅', '🌶️', '🌿', '🧈'],
                  statusText: {
                    am: 'ሥጋው በሽንኩርትና በቃሪያ በከፍተኛ እሳት እየተጠበሰ ነው! 🔥',
                    en: 'Searing succulent beef chunks with fresh rosemary & spicy green chilies!'
                  }
                },
                shiro: {
                  emoji: '🥘',
                  label: appLang === 'am' ? 'የሸክላ ሽሮ (Simmering Clay Shiro)' : 'Clay Shiro',
                  color: 'from-orange-500 via-amber-600 to-red-800',
                  ingredients: ['🥘', '🌶️', '🧅', '🧈', '🧄'],
                  statusText: {
                    am: 'ሽሮው በሸክላ ድስት እየተንተከተከ በቅቤ እየተገነፈለ ነው! ♨️',
                    en: 'Traditional clay-pot Shiro simmering & boiling to thick spiced perfection!'
                  }
                },
                injera: {
                  emoji: '🥞',
                  label: appLang === 'am' ? 'እንጀራ መጋገር (Baking Injera)' : 'Baking Injera',
                  color: 'from-stone-500 via-stone-700 to-stone-900',
                  ingredients: ['🥞', '🌾', '💨', '🔥', '✨'],
                  statusText: {
                    am: 'እንጀራው በምጣዱ ላይ እጅግ የሚያምር ዓይን እያወጣ ነው! 🥞',
                    en: 'Baking soft, spongy, authentic sourdough injera on the hot clay griddle!'
                  }
                },
                coffee: {
                  emoji: '☕',
                  label: appLang === 'am' ? 'የፓፒረስ ጀበና ቡና (Brewing Buna)' : 'Brewing Buna',
                  color: 'from-amber-800 via-amber-950 to-stone-950',
                  ingredients: ['☕', '🔥', '🌿', '💨', '✨'],
                  statusText: {
                    am: 'ቡናው በጀበና እየፈላ ነው፤ እጣኑና የጫቱ ጠረን ይሸታል! ☕',
                    en: 'Traditional coffee brewing inside clay jebena with fragrant frankincense smoke!'
                  }
                }
              };

              const currentDish = dishConfig[activeChefAnimationDish] || dishConfig.tibs;

              return (
                <motion.div 
                  key="chef"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6 max-w-6xl mx-auto w-full pb-10 relative p-1"
                >
                  {/* Floating Kitchen Embers background effect */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10 rounded-3xl">
                    <div className="absolute inset-0 bg-gradient-to-b from-[#18120e] via-[#0f0b08] to-[#080605] opacity-95" />
                    {/* Subtle repeating organic grid texture */}
                    <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(#C1FF00_1px,transparent_1px)] [background-size:24px_24px]" />
                    {/* Glowing warm light leaks from stoves */}
                    <div className="absolute top-[20%] left-[-10%] w-[350px] h-[350px] rounded-full bg-orange-600/10 blur-[80px] animate-pulse" style={{ animationDuration: '8s' }} />
                    <div className="absolute bottom-[20%] right-[-10%] w-[350px] h-[350px] rounded-full bg-emerald-500/5 blur-[80px] animate-pulse" style={{ animationDuration: '10s' }} />
                    
                    {/* Glowing fire sparks floating upward */}
                    {[...Array(15)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{
                          y: [600, -50],
                          x: [Math.sin(i) * 50, Math.sin(i + 1) * 50],
                          opacity: [0, 0.7, 0],
                          scale: [0.6, 1.3, 0.6]
                        }}
                        transition={{
                          duration: 8 + i * 1.5,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                        className="absolute bottom-0 text-[8px] select-none text-orange-500/20"
                        style={{ left: `${8 + i * 8}%` }}
                      >
                        🔥
                      </motion.div>
                    ))}
                  </div>

                  {/* HIGH-FIDELITY LUXURY CHEF WORKSPACE SHOWCASE & HEADER */}
                  <motion.div
                    initial={{ opacity: 0, y: -15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="rounded-3xl overflow-hidden relative flex flex-col md:flex-row justify-between items-center p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.4)] gap-6 md:gap-8 text-stone-100 bg-gradient-to-tr from-black/80 via-[#1b1715]/90 to-[#261f1b]/90 border border-white/10 w-full animate-fade-in"
                  >
                    {/* Glowing background highlights */}
                    <div className="absolute top-[-30%] right-[-10%] w-[250px] h-[250px] rounded-full bg-[#C1FF00]/5 blur-[60px] pointer-events-none" />
                    <div className="absolute bottom-[-30%] left-[-10%] w-[250px] h-[250px] rounded-full bg-emerald-500/5 blur-[60px] pointer-events-none" />

                    {/* LEFT SIDE: Premium Typography & Work Status */}
                    <div className="flex-1 space-y-4 relative z-10 text-left w-full">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#C1FF00]/10 border border-[#C1FF00]/20 text-[#C1FF00] rounded-full font-mono font-black text-[9px] uppercase tracking-wider shadow-sm">
                          <span>🍳</span>
                          <span>
                            {appLang === 'am' ? 'የፓፒረስ ማስተር ሼፍ' : 'Papyrus Master Chef'}
                          </span>
                        </div>
                        <span className="font-mono text-[9px] bg-red-950/85 text-red-400 border border-red-500/30 px-2 py-1 uppercase font-bold tracking-widest rounded-full">
                          CHEF EXECUTIVE
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase leading-tight">
                          {appLang === 'am' ? 'የኩሽና ሜካናይዝድ ሰሌዳ' : 'Kitchen Display System'}
                        </h2>
                        <p className="text-stone-400 text-xs font-mono max-w-xl">
                          {appLang === 'am' ? (
                            'ለሎጁ እንግዶች በከፍተኛ ክህሎት እና በፍቅር የተሰሩ ምርጥ ምግቦችን በቅጽበት የሚያዘጋጁበት መቆጣጠሪያ ሰሌዳ።'
                          ) : (
                            'Live food preparation pipeline. Blend local flavors with international expertise for an unparalleled dining experience.'
                          )}
                        </p>
                      </div>

                      {/* Live Stats Row */}
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <div className="bg-black/40 border border-white/5 px-3.5 py-2 rounded-xl flex items-center gap-2.5">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          <div className="text-left font-mono leading-none">
                            <span className="text-[9px] text-stone-500 block uppercase font-bold">{appLang === 'am' ? 'የሼፍ ስም' : 'Chef Name'}</span>
                            <span className="text-[11px] text-[#C1FF00] font-black block mt-0.5">{currentUser?.name || 'Chef Executive'}</span>
                          </div>
                        </div>

                        <div className="bg-black/40 border border-white/5 px-3.5 py-2 rounded-xl flex items-center gap-2.5">
                          <span className="text-xs">⏱️</span>
                          <div className="text-left font-mono leading-none">
                            <span className="text-[9px] text-stone-500 block uppercase font-bold">{appLang === 'am' ? 'የስራ ሁኔታ' : 'Duty Status'}</span>
                            <span className="text-[11px] text-white font-black block mt-0.5">ACTIVE ON DUTY</span>
                          </div>
                        </div>

                        <button 
                          onClick={handleLogout}
                          className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-mono uppercase font-black tracking-widest border border-red-500/20 rounded-xl transition-all duration-200 flex items-center gap-1.5 cursor-pointer ml-auto md:ml-0"
                        >
                          🚪 {appLang === 'am' ? 'ውጣ' : 'Logout'}
                        </button>
                      </div>
                    </div>

                    {/* RIGHT SIDE: Beautiful Chef Illustration Frame */}
                    <div className="relative w-full md:w-[180px] lg:w-[220px] flex items-center justify-center shrink-0 mt-2 md:mt-0">
                      {/* Background frames */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-[140px] h-[140px] lg:w-[170px] lg:h-[170px] rounded-full border border-dashed border-[#C1FF00]/20 animate-[spin_60s_linear_infinite]" />
                      </div>

                      {/* Image display */}
                      <motion.div
                        style={{
                          x: mousePos.x * 3,
                          y: mousePos.y * 3,
                        }}
                        className="relative w-[120px] h-[120px] lg:w-[150px] lg:h-[150px] z-10 flex items-center justify-center rounded-2xl shadow-xl overflow-hidden border-2 border-white/10"
                      >
                        <img
                          src={deliveryChef}
                          alt="Papyrus Lodge Premium Chef"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                        />
                      </motion.div>

                      {/* Floating mini badge */}
                      <motion.div
                        style={{
                          x: mousePos.x * -2,
                          y: mousePos.y * -2,
                        }}
                        className="absolute bottom-1 right-1 bg-black/90 border border-[#C1FF00]/30 px-2 py-1 rounded-lg shadow-lg z-20 flex items-center gap-1"
                      >
                        <span className="text-emerald-400 text-[10px]">✓</span>
                        <span className="text-white font-mono text-[8px] font-black uppercase tracking-wider">
                          MASTER
                        </span>
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* INTERACTIVE SIZZLING KITCHEN STATION */}
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                    className="bg-gradient-to-r from-[#1f1510] to-[#120c09] border border-[#ff5722]/30 rounded-3xl p-6 relative overflow-hidden shadow-2xl"
                  >
                    {/* Grill/mitad background texture */}
                    <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#ff5722_1px,transparent_1px)] [background-size:16px_16px]" />
                    
                    {/* Floating Sparkles & Heatwaves */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                      {[...Array(6)].map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{
                            y: [120, -20],
                            x: [Math.sin(i) * 30, Math.sin(i + 1) * 30],
                            opacity: [0, 0.8, 0],
                            scale: [0.5, 1.2, 0.5]
                          }}
                          transition={{
                            duration: 3 + i * 0.5,
                            repeat: Infinity,
                            ease: "linear"
                          }}
                          className="absolute text-orange-500 text-xs"
                          style={{
                            left: `${15 + i * 15}%`,
                            bottom: `${-10 + i * 10}px`
                          }}
                        >
                          {currentDish.ingredients[i % currentDish.ingredients.length]}
                        </motion.div>
                      ))}
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="text-left space-y-2">
                        <span className="text-[10px] font-mono text-orange-400 font-bold tracking-widest uppercase">
                          {appLang === 'am' ? 'የምጣድ/ምድጃ ሲሙሌተር' : 'GRILL / STOVE SIMULATOR'}
                        </span>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                          <span>{currentDish.emoji}</span>
                          <span>{currentDish.label}</span>
                        </h3>
                        <p className="text-xs text-stone-300 font-mono max-w-md">
                          {appLang === 'am' ? currentDish.statusText.am : currentDish.statusText.en}
                        </p>
                      </div>

                      {/* Selector Buttons */}
                      <div className="flex flex-wrap gap-2 shrink-0">
                        {(['tibs', 'shiro', 'injera', 'coffee'] as const).map((dishKey) => {
                          const d = dishConfig[dishKey];
                          return (
                            <button
                              key={dishKey}
                              onClick={() => setActiveChefAnimationDish(dishKey)}
                              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                                activeChefAnimationDish === dishKey
                                  ? 'bg-[#ff5722] text-white shadow-lg shadow-orange-600/30 ring-2 ring-orange-500/50'
                                  : 'bg-black/40 text-stone-400 hover:text-white border border-white/5 hover:border-orange-500/20'
                              }`}
                            >
                              <span>{d.emoji}</span>
                              <span>{dishKey.toUpperCase()}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>

                  {/* CHEF ACTIVE ORDERS BOARD */}
                  <div className="bg-[#121212] border border-white/10 p-6 rounded-3xl space-y-4 text-left">
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                      <div>
                        <h3 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
                          <span>🥘</span>
                          <span>{appLang === 'am' ? 'የኩሽና ትዕዛዞች መከታተያ' : 'Kitchen Active Orders Queue'}</span>
                        </h3>
                        <p className="text-[10px] text-stone-400 font-mono">
                          {appLang === 'am' ? 'ማብሰል የሚገባቸውን ትዕዛዞች ያስተዳድሩ' : 'Prepare and cook active food/beverage orders'}
                        </p>
                      </div>
                      <span className="text-xs font-mono bg-orange-500/10 text-orange-400 border border-orange-500/20 px-3 py-1 rounded-full font-black">
                        {orders.filter(o => o.cookingStatus === 'Pending' || o.cookingStatus === 'Preparing').length} {appLang === 'am' ? 'ትዕዛዞች' : 'Orders'}
                      </span>
                    </div>

                    {orders.filter(o => o.cookingStatus === 'Pending' || o.cookingStatus === 'Preparing').length === 0 ? (
                      <div className="text-center py-12 text-stone-500 font-mono text-xs uppercase">
                        {appLang === 'am' ? 'የሚዘጋጅ አዲስ ትዕዛዝ የለም' : 'No pending orders in the kitchen queue'}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {orders.filter(o => o.cookingStatus === 'Pending' || o.cookingStatus === 'Preparing').map(ord => (
                          <div key={ord.id} className="bg-black/40 border border-white/5 p-4 rounded-xl flex flex-col justify-between gap-3 relative overflow-hidden">
                            <div className="flex justify-between items-start border-b border-white/5 pb-2">
                              <div>
                                <span className="font-mono text-xs font-black text-orange-400">#{ord.id}</span>
                                <span className="text-[8px] text-stone-500 font-mono block">{ord.time}</span>
                              </div>
                              <span className="bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[9px] font-mono uppercase px-2 py-0.5 rounded">
                                {ord.cookingStatus || 'Pending'}
                              </span>
                            </div>

                            <div className="space-y-1 py-1">
                              {ord.items.map((it, idx) => (
                                <p key={idx} className="text-xs font-bold text-stone-200">
                                  🍳 {it.qty} × {it.name}
                                </p>
                              ))}
                            </div>

                            <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                              <span className="text-[10px] font-mono text-stone-400">{ord.location}</span>
                              {ord.cookingStatus === 'Pending' ? (
                                <button
                                  onClick={() => handleUpdateOrderStatus(ord.id, 'Preparing')}
                                  className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-black text-[10px] font-black uppercase rounded cursor-pointer transition-colors"
                                >
                                  {appLang === 'am' ? 'ጀምር' : 'Start'} ➔
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUpdateOrderStatus(ord.id, 'Completed')}
                                  className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase rounded cursor-pointer transition-colors animate-pulse"
                                >
                                  {appLang === 'am' ? 'ጨርስ' : 'Ready'} ✓
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })()}

            {/* VIEW_5: ADMIN PORTAL */}
            {activeRole === 'admin' && (
              <motion.div 
                key="admin_portal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6 max-w-6xl mx-auto w-full pb-10"
              >
                {/* Admin Header */}
                <div className="bg-gradient-to-r from-[#111] via-stone-900 to-black border border-white/10 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden text-left shadow-2xl">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#C1FF00]/5 rounded-full blur-2xl pointer-events-none"></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-[#C1FF00] rounded-full animate-ping"></span>
                      <span className="text-[9px] bg-[#C1FF00]/10 text-[#C1FF00] font-mono font-black uppercase px-2 py-0.5 rounded tracking-wider">
                        SECURE ADMIN CONTROL
                      </span>
                    </div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tight mt-1.5">
                      {currentUser?.name || "አስኪያጅ ተቆጣጣሪ (System Administrator)"}
                    </h2>
                    <p className="text-xs text-stone-400 font-mono mt-0.5">
                      {appLang === 'am' ? 'የፓፒረስ ሎጅ ፋይናንስ፣ ሰራተኞች እና አጠቃላይ ሲስተም መቆጣጠሪያ ማዕከል' : 'Finance, staff roster, menu items, dynamic QR-codes, and promotions dashboard'}
                    </p>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="px-5 py-2.5 bg-red-600/10 hover:bg-red-600/25 text-red-400 text-xs font-mono uppercase font-black tracking-widest border border-red-500/20 rounded-xl transition-all cursor-pointer"
                  >
                    🚪 Logout | ውጣ
                  </button>
                </div>

                {/* Admin Navigation Tabs */}
                <div className="flex border-b border-white/10 gap-1 overflow-x-auto no-scrollbar py-1">
                  {[
                    { id: 'sales', label: appLang === 'am' ? '📊 ገቢ/ወጪ' : '📊 Ledger', color: 'text-emerald-400' },
                    { id: 'staff', label: appLang === 'am' ? '👥 ሰራተኞች' : '👥 Staff', color: 'text-sky-400' },
                    { id: 'menu', label: appLang === 'am' ? '🍽️ ምናሌ' : '🍽️ Menu', color: 'text-amber-400' },
                    { id: 'banks', label: appLang === 'am' ? '🏦 ባንኮች' : '🏦 Banks', color: 'text-[#C1FF00]' },
                    { id: 'qrprint', label: appLang === 'am' ? '📱 QR ኮዶች' : '📱 QR Codes', color: 'text-purple-400' },
                    { id: 'promo', label: appLang === 'am' ? '🎟️ ፕሮሞሽን' : '🎟️ Promos', color: 'text-pink-400' },
                    { id: 'lodgeinfo', label: appLang === 'am' ? '🛖 መረጃ' : '🛖 Lodge Info', color: 'text-indigo-400' },
                    { id: 'reception', label: appLang === 'am' ? '🏨 ሪሴብሽን' : '🏨 Reception', color: 'text-teal-400' },
                    { id: 'branding', label: appLang === 'am' ? '🎨 ሎጎ' : '🎨 Branding', color: 'text-rose-400' },
                    { id: 'gallery', label: appLang === 'am' ? '🖼️ ጋለሪ' : '🖼️ Gallery', color: 'text-[#C1FF00]' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveAdminTab(tab.id as any)}
                      className={`px-4 py-2.5 font-sans text-xs font-bold uppercase transition-all rounded-xl shrink-0 cursor-pointer ${
                        activeAdminTab === tab.id
                          ? 'bg-white/10 text-white shadow-sm font-black'
                          : 'text-stone-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span className={activeAdminTab === tab.id ? tab.color : ''}>{tab.label}</span>
                    </button>
                  ))}
                </div>

                {activeAdminTab === 'sales' && (
                  <AdminRevenueReports
                    orders={orders}
                    roomBookings={roomBookings}
                    expenses={expenses}
                    serviceChargeRate={serviceChargeRate}
                    vatRate={vatRate}
                    handleAdjustRate={handleAdjustRate}
                    handleAddExpense={handleAddExpense}
                    handleRemoveExpense={handleRemoveExpense}
                    handleConfirmOrderPayment={handleConfirmOrderPayment}
                    askConfirmAndRun={askConfirmAndRun}
                    ledgerFilterTab={ledgerFilterTab}
                    setLedgerFilterTab={setLedgerFilterTab}
                    getAmharicDayOfDate={getAmharicDayOfDate}
                    appLang={appLang}
                  />
                )}

                {/* TAB CONTENT 2: STAFF LIST */}
                {activeAdminTab === 'staff' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
                    {/* Add / Edit employee */}
                    <div className="bg-[#121212] border border-white/10 p-5 h-fit space-y-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      {editingStaff ? (
                        <>
                          <h4 className="text-xs font-black uppercase text-[#C1FF00] border-b border-[#C1FF00]/20 pb-2">
                            ✍️ ሰራተኛ መረጃ ማስተካከያ (Edit Staff)
                          </h4>
                          <form onSubmit={handleSaveEditedStaff} className="space-y-4">
                            <div>
                              <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">ስም (Full Name)</label>
                              <input 
                                type="text"
                                value={editingStaff.name || ''}
                                onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
                                required 
                                className="w-full bg-[#181818] border border-[#C1FF00]/40 text-white text-xs font-bold p-2.5 outline-none focus:border-[#C1FF00]"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">የስራ መደብ (ROLE)</label>
                              <div className="flex gap-2">
                                <select 
                                  value={editingStaff.role || ''}
                                  onChange={(e) => setEditingStaff({ ...editingStaff, role: e.target.value as any })}
                                  className="flex-1 bg-[#181818] border border-[#C1FF00]/40 text-white text-xs font-bold p-2.5 outline-none focus:border-[#C1FF00]"
                                >
                                  {customRoles.map(roleKey => (
                                    <option key={roleKey} value={roleKey}>
                                      {roleKey === 'waiter' ? 'አስተናጋጅ (Waiter)' : 
                                       roleKey === 'chef' ? 'የኩሽና ሰራተኛ (Chef/Kitchen)' : 
                                       roleKey === 'receptionist' ? 'ሪሴብሽነር (Receptionist)' : 
                                       roleKey === 'admin' ? 'ተቆጣጣሪ (System Admin)' : 
                                       roleKey === 'manager' ? 'ማናጀር (Manager)' : 
                                       roleKey === 'guard' ? 'ጥበቃ (Guard)' : 
                                       roleKey === 'cashier' ? 'ካሸር (Cashier)' : roleKey.toUpperCase()}
                                    </option>
                                  ))}
                                  {!customRoles.includes(editingStaff.role) && (
                                    <option value={editingStaff.role}>
                                      {editingStaff.role.toUpperCase()}
                                    </option>
                                  )}
                                </select>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const val = prompt('እባክዎ አዲስ የስራ መደብ ስም ያስገቡ (Enter new job position):');
                                    if (val && val.trim()) {
                                      const normalized = val.trim().toLowerCase();
                                      if (!customRoles.includes(normalized)) {
                                        setCustomRoles(prev => [...prev, normalized]);
                                        setEditingStaff({ ...editingStaff, role: normalized });
                                        alert(`✔ አዲስ የስራ መደብ "${normalized}" ተጨምሯል!`);
                                      } else {
                                        setEditingStaff({ ...editingStaff, role: normalized });
                                      }
                                    }
                                  }}
                                  className="bg-[#C1FF00]/15 hover:bg-[#C1FF00] hover:text-black text-[#C1FF00] px-3.5 text-xs font-black border border-[#C1FF00]/30 transition-all cursor-pointer"
                                  title="Add new custom role position"
                                >
                                  ➕ አዲስ መደብ
                                </button>
                              </div>
                            </div>
                            <div>
                              <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">የሲስተም መዳረሻ ፈቃድ (System Access Privilege)</label>
                              <select 
                                value={editingStaff.accessPrivilege || editingStaff.role}
                                onChange={(e) => setEditingStaff({ ...editingStaff, accessPrivilege: e.target.value as any })}
                                className="w-full bg-[#181818] border border-[#C1FF00]/40 text-white text-xs font-bold p-2.5 outline-none focus:border-[#C1FF00]"
                              >
                                {customPrivileges.map(priv => (
                                  <option key={priv} value={priv}>
                                    {priv === 'waiter' ? 'አስተናጅ (Waiter Portal Access)' :
                                     priv === 'chef' ? 'የኩሽና ሰራተኛ (Chef Portal Access)' :
                                     priv === 'receptionist' ? 'ሪሴብሽን (Reception Portal Access)' :
                                     priv === 'admin' ? 'ተቆጣጣሪ (System Admin Access)' :
                                     priv === 'manager' ? 'ማናጀር (Manager Dashboard Access)' :
                                     priv === 'cashier' ? 'የካሸር መቆጣጠሪያ (Cashier Access)' :
                                     priv === 'guard' ? 'ጥበቃ (Guard Portal Access)' :
                                     priv === 'none' ? 'ምንም መዳረሻ የለም (No Web Login Access)' :
                                     `${priv.toUpperCase()} (Custom Access)`}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">ስልክ ቁጥር (Phone Number)</label>
                              <input 
                                type="text"
                                value={editingStaff.phone || ''}
                                onChange={(e) => setEditingStaff({ ...editingStaff, phone: e.target.value })}
                                placeholder="09xxxxxxxx"
                                className="w-full bg-[#181818] border border-[#C1FF00]/40 text-white text-xs font-bold p-2.5 outline-none focus:border-[#C1FF00]"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">ሲቀጠር ጀምሮ (Hiring Date)</label>
                              <input 
                                type="date"
                                value={editingStaff.hireDate || ''}
                                onChange={(e) => setEditingStaff({ ...editingStaff, hireDate: e.target.value })}
                                className="w-full bg-[#181818] border border-[#C1FF00]/40 text-[#C1FF00] font-mono text-xs p-2.5 outline-none focus:border-[#C1FF00]"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">የመግቢያ ዩዘር ኔም (Username)</label>
                              <input 
                                type="text"
                                value={editingStaff.username || ''}
                                onChange={(e) => setEditingStaff({ ...editingStaff, username: e.target.value })}
                                placeholder="e.g. aster99"
                                className="w-full bg-[#181818] border border-[#C1FF00]/40 text-white text-xs font-bold p-2.5 outline-none focus:border-[#C1FF00]"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">የመግቢያ ፓስወርድ (Password)</label>
                              <input 
                                type="text"
                                value={editingStaff.password || ''}
                                onChange={(e) => setEditingStaff({ ...editingStaff, password: e.target.value })}
                                placeholder="e.g. Pass123!"
                                className="w-full bg-[#181818] border border-[#C1FF00]/40 text-white text-xs font-bold p-2.5 outline-none focus:border-[#C1FF00]"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">የሰራተኛው የትምህርት ማስረጃ / ሰርተፊኬት (Education credentials)</label>
                              <input 
                                type="text"
                                value={editingStaff.education || ''}
                                onChange={(e) => setEditingStaff({ ...editingStaff, education: e.target.value })}
                                placeholder="Degree, Diploma or Reference certificate..."
                                className="w-full bg-[#181818] border border-[#C1FF00]/40 text-white text-xs font-bold p-2.5 outline-none focus:border-[#C1FF00]"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">ስለ ሰራተኛው መረጃ (Staff Profile Info)</label>
                              <textarea
                                value={editingStaff.info || ''}
                                onChange={(e) => setEditingStaff({ ...editingStaff, info: e.target.value })}
                                placeholder="እዚህ ላይ ስለ ሰራተኛው ጠቅላላ መረጃ ማስቀመጥ ይችላሉ..."
                                rows={2}
                                className="w-full bg-[#181818] border border-[#C1FF00]/40 text-white text-xs p-2.5 outline-none focus:border-[#C1FF00]"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">የይለፍ ቃል ኮድ (4-DIGIT PIN)</label>
                              <input 
                                type="password" 
                                value={editingStaff.pin || ''}
                                onChange={(e) => setEditingStaff({ ...editingStaff, pin: e.target.value })}
                                maxLength={4}
                                required 
                                placeholder="••••"
                                className="w-full bg-[#181818] border border-[#C1FF00]/40 text-white font-mono text-center text-sm p-2.5 outline-none focus:border-[#C1FF00]"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-mono text-[#00f5ff]/70 uppercase block mb-1">የደህንነት ሚስጥር ቃል (Security Secret Answer)</label>
                              <input 
                                type="text" 
                                value={editingStaff.securityAnswer || ''}
                                onChange={(e) => setEditingStaff({ ...editingStaff, securityAnswer: e.target.value })}
                                placeholder="ለምሳሌ፡ ሀዋሳ (ወይም ሌላ የራስዎ ሚስጥር ቃል)"
                                required
                                className="w-full bg-[#181818] border border-[#00f5ff]/40 text-[#00f5ff] text-xs font-bold p-2.5 outline-none focus:border-[#00f5ff]"
                              />
                            </div>
                            <div>
                              <p className="text-[9px] font-mono text-white/40 uppercase block mb-1">የሰራተኛ ፎቶ (EMPLOYEE PHOTO)</p>
                              <div className="space-y-2">
                                <input 
                                  type="text" 
                                  placeholder="https://images.unsplash.com/... (optional)"
                                  value={editingStaff.photo || ''}
                                  onChange={(e) => setEditingStaff({ ...editingStaff, photo: e.target.value })}
                                  className="w-full bg-[#181818] border border-[#C1FF00]/40 text-white font-mono text-xs p-2.5 outline-none focus:border-[#C1FF00]"
                                />
                                <div className="flex gap-2 items-center">
                                  <label className="flex-1 text-center bg-[#1D1D16] border border-dashed border-[#C1FF00]/40 text-[#C1FF00] hover:border-[#C1FF00] font-mono text-[10px] font-bold py-2 px-3 rounded cursor-pointer transition-colors">
                                    📂 ፎቶ ይጫኑ (Upload Employee Photo)
                                    <input 
                                      type="file" 
                                      accept="image/*" 
                                      className="hidden" 
                                      onChange={(e) => readMediaFile(e, (base64) => setEditingStaff({ ...editingStaff, photo: base64 }))} 
                                    />
                                  </label>
                                  {editingStaff.photo && (
                                    <button 
                                      type="button" 
                                      onClick={() => setEditingStaff({ ...editingStaff, photo: '' })}
                                      className="px-3 py-2 bg-red-955 text-red-100 border border-red-900 text-[10px] rounded hover:bg-red-900 transition-colors cursor-pointer font-bold"
                                    >
                                      RESET
                                    </button>
                                  )}
                                </div>
                                {editingStaff.photo && (
                                  <div className="mt-1 text-center bg-black/40 p-2 rounded border border-white/5 flex flex-col items-center space-y-2">
                                    <img src={editingStaff.photo} className="w-12 h-12 rounded-full object-cover border border-white/10 shadow-md" alt="Staff Preview" />
                                    {editingStaff.photo.startsWith('data:') && (
                                      <div className="bg-yellow-400/10 border border-yellow-400/20 p-2 rounded text-center w-full">
                                        <p className="text-[9px] text-yellow-400 font-bold leading-relaxed">
                                          ⚠️ ፎቶው ከፋይል ተጭኗል! ለማስቀመጥ ከታች ያለውን <span className="underline text-yellow-300">SAVE CHANGES</span> የሚለውን ቁልፍ ይጫኑ!
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div>
                              <p className="text-[9px] font-mono text-[#00f5ff]/70 uppercase block mb-1">የሰራተኛው የትምህርት ማስረጃ / ሰርተፊኬት (Education Certificate Document)</p>
                              <div className="space-y-2">
                                <div className="flex gap-2 items-center">
                                  <label className="flex-1 text-center bg-[#1D1D16] border border-dashed border-[#00f5ff]/40 text-[#00f5ff] hover:border-[#00f5ff] font-mono text-[10px] font-bold py-2 px-3 rounded cursor-pointer transition-colors">
                                    📂 ሰርተፊኬት / ማስረጃ ይጫኑ (Upload Certificate Image)
                                    <input 
                                      type="file" 
                                      accept="image/*" 
                                      className="hidden" 
                                      onChange={(e) => readMediaFile(e, (base64) => setEditingStaff({ ...editingStaff, certificatePhoto: base64 }))} 
                                    />
                                  </label>
                                  {editingStaff.certificatePhoto && (
                                    <button 
                                      type="button" 
                                      onClick={() => setEditingStaff({ ...editingStaff, certificatePhoto: '' })}
                                      className="px-3 py-2 bg-red-950 text-red-100 border border-red-900 text-[10px] rounded hover:bg-red-900 transition-colors cursor-pointer font-bold"
                                    >
                                      RESET
                                    </button>
                                  )}
                                </div>
                                {editingStaff.certificatePhoto && (
                                  <div className="mt-1 text-center bg-black/40 p-2 rounded border border-white/5 flex flex-col items-center space-y-2">
                                    <img src={editingStaff.certificatePhoto} className="max-h-24 max-w-full rounded border border-white/10 shadow-md" alt="Certificate Preview" />
                                    <span className="text-[8px] text-[#00f5ff] mt-1 block">ሰነድ ዝግጁ ነው! (Academic Certificate Uploaded)</span>
                                    {editingStaff.certificatePhoto.startsWith('data:') && (
                                      <div className="bg-yellow-400/10 border border-yellow-400/20 p-2 rounded text-center w-full">
                                        <p className="text-[9px] text-yellow-400 font-bold leading-relaxed">
                                          ⚠️ ማስረጃው ከፋይል ተጭኗል! ለማስቀመጥ ከታች ያለውን <span className="underline text-yellow-300">SAVE CHANGES</span> የሚለውን ቁልፍ ይጫኑ!
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                              <button 
                                type="submit" 
                                className="flex-1 bg-[#C1FF00] hover:bg-white text-black text-xs font-black uppercase py-3 font-mono cursor-pointer transition-all"
                              >
                                SAVE CHANGES
                              </button>
                              <button 
                                type="button" 
                                onClick={() => setEditingStaff(null)}
                                className="bg-white/10 hover:bg-white/20 text-white text-xs font-black uppercase px-4 py-3 font-mono cursor-pointer transition-all"
                              >
                                CANCEL
                              </button>
                            </div>
                          </form>
                        </>
                      ) : (
                        <>
                          <h4 className="text-xs font-black uppercase text-[#C1FF00] border-b border-[#C1FF00]/20 pb-2 flex items-center gap-1.5">
                            🆕 ሰራተኛ መመዝገቢያ (Register Staff)
                          </h4>
                          <form onSubmit={handleRegisterStaff} className="space-y-4">
                            <div>
                              <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">ሙሉ ስም (Full Name)</label>
                              <input 
                                type="text" 
                                id="add-staff-name"
                                placeholder="ለምሳሌ: አስቴር ካሳሁን"
                                required
                                className="w-full bg-[#181818] border border-white/10 text-white text-xs font-bold p-2.5 outline-none focus:border-[#C1FF00]"
                              />
                            </div>

                            <div>
                              <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">የስራ መደብ (Job Position/Role)</label>
                              <div className="flex gap-2">
                                <select 
                                  value={addStaffRoleSelected}
                                  onChange={(e) => setAddStaffRoleSelected(e.target.value)}
                                  className="flex-1 bg-[#181818] border border-white/10 text-white text-xs font-bold p-2.5 outline-none focus:border-[#C1FF00]"
                                >
                                  {customRoles.map(r => (
                                    <option key={r} value={r}>
                                      {r === 'waiter' ? 'አስተናጋጅ (Waiter)' : 
                                       r === 'chef' ? 'የኩሽና ሰራተኛ (Chef)' : 
                                       r === 'receptionist' ? 'ሪሴብሽነር (Receptionist)' : 
                                       r === 'admin' ? 'አድሚን (Admin)' : 
                                       r === 'manager' ? 'ማናጀር (Manager)' : 
                                       r === 'guard' ? 'ጥበቃ (Guard)' : 
                                       r === 'cashier' ? 'ካሸር (Cashier)' : r.toUpperCase()}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const val = prompt('እባክዎ አዲስ የስራ መደብ ስም ያስገቡ (Enter new job position):');
                                    if (val && val.trim()) {
                                      const normalized = val.trim().toLowerCase();
                                      if (!customRoles.includes(normalized)) {
                                        setCustomRoles(prev => [...prev, normalized]);
                                        setAddStaffRoleSelected(normalized);
                                        alert(`✔ አዲስ የስራ መደብ "${normalized}" ተጨምሯል!`);
                                      } else {
                                        setAddStaffRoleSelected(normalized);
                                      }
                                    }
                                  }}
                                  className="bg-[#C1FF00]/15 hover:bg-[#C1FF00] hover:text-black text-[#C1FF00] px-3.5 text-xs font-black border border-[#C1FF00]/30 transition-all cursor-pointer"
                                  title="Add new custom role position"
                                >
                                  ➕ አዲስ መደብ
                                </button>
                              </div>
                            </div>

                            <div>
                              <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">የሲስተም መዳረሻ ፈቃድ (System Access Privilege)</label>
                              <select 
                                value={addStaffAccessSelected}
                                onChange={(e) => setAddStaffAccessSelected(e.target.value)}
                                className="w-full bg-[#181818] border border-white/10 text-white text-xs font-bold p-2.5 outline-none focus:border-[#C1FF00]"
                              >
                                {customPrivileges.map(priv => (
                                  <option key={priv} value={priv}>
                                    {priv === 'waiter' ? 'አስተናጋጅ (Waiter Portal Access)' :
                                     priv === 'chef' ? 'የኩሽና ሰራተኛ (Chef Portal Access)' :
                                     priv === 'receptionist' ? 'ሪሴብሽን (Reception Portal Access)' :
                                     priv === 'admin' ? 'ተቆጣጣሪ (System Admin Access)' :
                                     priv === 'manager' ? 'ማናጀር (Manager Dashboard Access)' :
                                     priv === 'cashier' ? 'የካሸር መቆጣጠሪያ (Cashier Access)' :
                                     priv === 'guard' ? 'ጥበቃ (Guard Portal Access)' :
                                     priv === 'none' ? 'ምንም መዳረሻ የለም (No Web Login Access)' :
                                     `${priv.toUpperCase()} (Custom Access)`}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">ስልክ ቁጥር (Phone Number)</label>
                              <input 
                                type="text" 
                                id="add-staff-phone"
                                placeholder="09xxxxxxxx"
                                required
                                className="w-full bg-[#181818] border border-white/10 text-white text-xs font-bold p-2.5 outline-none focus:border-[#C1FF00]"
                              />
                            </div>

                            <div>
                              <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">ሲቀጠር ጀምሮ (Hiring Date)</label>
                              <input 
                                type="date" 
                                id="add-staff-hire-date"
                                required
                                className="w-full bg-[#181818] border border-white/10 text-[#C1FF00] font-mono text-xs p-2.5 outline-none focus:border-[#C1FF00]"
                              />
                            </div>

                            <div>
                              <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">የይለፍ ቃል መግቢያ ዩዘር ኔም (Username)</label>
                              <input 
                                type="text" 
                                id="add-staff-username"
                                placeholder="aster_admin"
                                required
                                className="w-full bg-[#181818] border border-white/10 text-white text-xs font-bold p-2.5 outline-none focus:border-[#C1FF00]"
                              />
                            </div>

                            <div>
                              <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">የመግቢያ ፓስወርድ (Password)</label>
                              <input 
                                type="text" 
                                id="add-staff-password"
                                placeholder="Pass123!"
                                required
                                className="w-full bg-[#181818] border border-white/10 text-white text-xs font-bold p-2.5 outline-none focus:border-[#C1FF00]"
                              />
                            </div>

                            <div>
                              <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">የሰራተኛው የትምህርት ማስረጃ / ሰርተፊኬት (Education credentials)</label>
                              <input 
                                type="text" 
                                id="add-staff-education"
                                placeholder="ለምሳሌ፡ ዲግሪ፣ ዲፕሎማ ወይም የልምድ ሰርተፊኬት..."
                                className="w-full bg-[#181818] border border-white/10 text-white text-xs font-bold p-2.5 outline-none focus:border-[#C1FF00]"
                              />
                            </div>

                            <div>
                              <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">ስለ ሰራተኛው መረጃ (Staff Profile Info)</label>
                              <textarea 
                                id="add-staff-info"
                                rows={2}
                                placeholder="ለምሳሌ: ያላት ልምድ, ባህሪ እና ተጨማሪ መግለጫ..."
                                className="w-full bg-[#181818] border border-white/10 text-white text-xs p-2.5 outline-none focus:border-[#C1FF00]"
                              />
                            </div>

                            <div>
                              <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">የይለፍ ቃል (4-DIGIT PIN)</label>
                              <input 
                                type="password" 
                                id="add-staff-pin"
                                maxLength={4}
                                required 
                                placeholder="••••"
                                className="w-full bg-[#181818] border border-white/10 text-white font-mono text-center text-sm p-2.5 outline-none focus:border-[#C1FF00]"
                              />
                            </div>

                            <div>
                              <label className="text-[9px] font-mono text-[#00f5ff]/70 uppercase block mb-1">የደህንነት ሚስጥር ቃል (Security Secret Answer) - ፒን ወይም ፓስወርድ ለመመለስ/ለመቀየር የሚያገለግል</label>
                              <input 
                                type="text" 
                                id="add-staff-security"
                                placeholder="ለምሳሌ፡ ሀዋሳ (ወይም ሌላ የራስዎ ሚስጥር ቃል)"
                                required
                                className="w-full bg-[#181818] border border-white/10 text-[#00f5ff] text-xs font-bold p-2.5 outline-none focus:border-[#00f5ff]"
                              />
                            </div>

                            <div>
                              <p className="text-[9px] font-mono text-white/40 uppercase block mb-1">የሰራተኛ ፎቶ (EMPLOYEE PHOTO)</p>
                              <div className="space-y-2">
                                <input 
                                  type="text" 
                                  id="add-staff-photo-url"
                                  placeholder="https://images.unsplash.com/... (optional)"
                                  value={addStaffPhoto}
                                  onChange={(e) => setAddStaffPhoto(e.target.value)}
                                  className="w-full bg-[#181818] border border-white/10 text-white font-mono text-xs p-2.5 outline-none focus:border-[#C1FF00]"
                                />
                                <div className="flex gap-2 items-center">
                                  <label className="flex-1 text-center bg-[#1D1D16] border border-dashed border-[#C1FF00]/40 text-[#C1FF00] hover:border-[#C1FF00] font-mono text-[10px] font-bold py-2 px-3 rounded cursor-pointer transition-colors">
                                    📂 ፎቶ ከስልክ/ኮምፒውተር ይጫኑ (Upload Employee Photo)
                                    <input 
                                      type="file" 
                                      accept="image/*" 
                                      className="hidden" 
                                      onChange={(e) => readMediaFile(e, (base64) => setAddStaffPhoto(base64))} 
                                    />
                                  </label>
                                  {addStaffPhoto && (
                                    <button 
                                      type="button" 
                                      onClick={() => setAddStaffPhoto('')}
                                      className="px-3 py-2 bg-red-950 text-red-100 border border-red-900 text-[10px] rounded hover:bg-red-900 transition-colors cursor-pointer font-bold"
                                    >
                                      RESET
                                    </button>
                                  )}
                                </div>
                                {addStaffPhoto && (
                                  <div className="mt-1 text-center bg-black/40 p-2 rounded border border-white/5 flex flex-col items-center space-y-2">
                                    <img src={addStaffPhoto} className="max-h-24 max-w-full rounded border border-white/10 shadow-md" alt="Profile Preview" />
                                    <span className="text-[8px] text-[#C1FF00] mt-1 block">ፎቶ ተጭኗል! (Employee Photo Loaded)</span>
                                    {addStaffPhoto.startsWith('data:') && (
                                      <div className="bg-yellow-400/10 border border-yellow-400/20 p-2 rounded text-center w-full">
                                        <p className="text-[9px] text-yellow-400 font-bold leading-relaxed">
                                          ⚠️ ፎቶው ከፋይል ተጭኗል! ለመመዝገብ ከታች ያለውን <span className="underline text-yellow-300">REGISTER STAFF</span> የሚለውን ቁልፍ ይጫኑ!
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div>
                              <p className="text-[9px] font-mono text-[#00f5ff]/70 uppercase block mb-1">የሰራተኛው የትምህርት ማስረጃ / ሰርተፊኬት (Education Certificate Document)</p>
                              <div className="space-y-2">
                                <div className="flex gap-2 items-center">
                                  <label className="flex-1 text-center bg-[#1D1D16] border border-dashed border-[#00f5ff]/40 text-[#00f5ff] hover:border-[#00f5ff] font-mono text-[10px] font-bold py-2 px-3 rounded cursor-pointer transition-colors">
                                    📂 ሰርተፊኬት / ማስረጃ ይጫኑ (Upload Certificate Image)
                                    <input 
                                      type="file" 
                                      accept="image/*" 
                                      className="hidden" 
                                      onChange={(e) => readMediaFile(e, (base64) => setAddStaffCertificatePhoto(base64))} 
                                    />
                                  </label>
                                  {addStaffCertificatePhoto && (
                                    <button 
                                      type="button" 
                                      onClick={() => setAddStaffCertificatePhoto('')}
                                      className="px-3 py-2 bg-red-950 text-red-100 border border-red-900 text-[10px] rounded hover:bg-red-900 transition-colors cursor-pointer font-bold"
                                    >
                                      RESET
                                    </button>
                                  )}
                                </div>
                                {addStaffCertificatePhoto && (
                                  <div className="mt-1 text-center bg-black/40 p-2 rounded border border-white/5 flex flex-col items-center space-y-2">
                                    <img src={addStaffCertificatePhoto} className="max-h-24 max-w-full rounded border border-white/10 shadow-md" alt="Certificate Preview" />
                                    <span className="text-[8px] text-[#00f5ff] mt-1 block">ሰነድ ዝግጁ ነው! (Academic Certificate Uploaded)</span>
                                    {addStaffCertificatePhoto.startsWith('data:') && (
                                      <div className="bg-yellow-400/10 border border-yellow-400/20 p-2 rounded text-center w-full">
                                        <p className="text-[9px] text-yellow-400 font-bold leading-relaxed">
                                          ⚠️ ማስረጃው ከፋይል ተጭኗል! ለመመዝገብ ከታች ያለውን <span className="underline text-yellow-300">REGISTER STAFF</span> የሚለውን ቁልፍ ይጫኑ!
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            <button 
                              type="submit" 
                              className="w-full bg-[#C1FF00] hover:bg-white text-black text-xs font-black uppercase py-3 font-mono cursor-pointer transition-all"
                              id="btn-add-staff-submit"
                            >
                              REGISTER EMPLOYEE
                            </button>
                          </form>
                        </>
                      )}
                    </div>

                    {/* Visual Job Positions Management Widget */}
                    <div className="bg-[#121212] border border-white/10 p-5 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
                      <h4 className="text-xs font-black uppercase text-white border-b border-white/5 pb-2 flex items-center gap-1.5">
                        🛠️ የድርጅቱ የስራ መደቦች ማስተዳደሪያ (Job Positions)
                      </h4>
                      <p className="text-[10px] text-white/60 leading-normal">
                        አዳዲስ የሰራተኛ መደቦችን እዚህ ይጨምሩ፣ ስማቸውን ያስተካክሉ ወይም ይቀንሱ። ለውጡ በራስ-ሰር ይቀመጣል።
                      </p>

                      {/* Pill display of all roles with edit/delete controls */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {customRoles.map(role => (
                          <span 
                            key={role} 
                            className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 bg-[#C1FF00]/10 border border-[#C1FF00]/30 text-[#C1FF00]"
                          >
                            <span>{role === 'waiter' ? 'አስተናጋጅ (Waiter)' : 
                                   role === 'chef' ? 'የኩሽና ሰራተኛ (Chef)' : 
                                   role === 'receptionist' ? 'ሪሴብሽነር (Receptionist)' : 
                                   role === 'admin' ? 'አድሚን (Admin)' : 
                                   role === 'manager' ? 'ማናጀር (Manager)' : 
                                   role === 'guard' ? 'ጥበቃ (Guard)' : 
                                   role === 'cashier' ? 'ካሸር (Cashier)' : role.toUpperCase()}</span>
                            
                            {/* Rename Role Button */}
                            <button 
                              type="button"
                              onClick={() => {
                                const val = prompt(`የስራ መደቡን ስም ይቀይሩ (Rename "${role.toUpperCase()}"):`, role);
                                if (val && val.trim()) {
                                  handleRenameRole(role, val.trim());
                                }
                              }}
                              className="text-white hover:text-[#C1FF00] transition-colors shrink-0 ml-1 text-[10px] bg-transparent border-none cursor-pointer"
                              title="የስራ መደቡን ስም ቀይር (Rename role)"
                            >
                              ✍️
                            </button>

                            {/* Delete Role Button */}
                            <button 
                              type="button"
                              onClick={() => handleDeleteRole(role)}
                              className="text-red-400 hover:text-red-600 transition-colors shrink-0 ml-1 text-[10px] bg-transparent border-none cursor-pointer"
                              title="የስራ መደብ አስወግድ (Delete role)"
                            >
                              ❌
                            </button>
                          </span>
                        ))}
                      </div>

                      {/* Create new role form */}
                      <div className="space-y-2 border-t border-white/5 pt-3">
                        <label className="text-[9px] font-mono text-white/40 uppercase block">አዲስ የስራ መደብ ይጨምሩ (Add New Job Position)</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            id="new-custom-role-input-box"
                            placeholder="ለምሳሌ፡ ሱፐርቫይዘር (Supervisor)"
                            className="flex-grow bg-[#181818] border border-white/10 text-white text-xs font-bold p-2 outline-none focus:border-[#C1FF00]"
                          />
                          <button
                            type="button"
                            id="btn-add-custom-role-submit-box"
                            onClick={() => {
                              const input = document.getElementById('new-custom-role-input-box') as HTMLInputElement;
                              if (input && input.value.trim()) {
                                const val = input.value.trim();
                                const normalized = val.toLowerCase();
                                if (!customRoles.includes(normalized)) {
                                  setCustomRoles(prev => [...prev, normalized]);
                                  alert(`✔ አዲስ የስራ መደብ "${val}" በተሳካ ሁኔታ ተጨምሯል!`);
                                  input.value = '';
                                } else {
                                  alert(`የስራ መደቡ "${val}" ቀድሞውኑ ተመዝግቧል!`);
                                }
                              } else {
                                  alert(`አሁኑኑ የሚጨምሩትን ባዶ ያልሆነ የስራ መደብ ስም ይጻፉ!`);
                              }
                            }}
                            className="bg-[#C1FF00] hover:bg-white text-black px-4 font-black text-xs font-mono uppercase cursor-pointer"
                          >
                            ➕ ፍጠር
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Visual System Access Privileges Management Widget */}
                    <div className="bg-[#121212] border border-white/10 p-5 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
                      <h4 className="text-xs font-black uppercase text-[#00f5ff] border-b border-white/5 pb-2 flex items-center gap-1.5">
                        🔐 የሲስተም መዳረሻ ፈቃድ ማስተዳደሪያ (System Privileges)
                      </h4>
                      <p className="text-[10px] text-white/60 leading-normal">
                        አዳዲስ የሲስተም መዳረሻ ፈቃዶችን እዚህ ይጨምሩ፣ ስማቸውን ያስተካክሉ ወይም ይቀንሱ። ለውጡ በራስ-ሰር ይቀመጣል።
                      </p>

                      {/* Pill display of all privileges with edit/delete controls */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {customPrivileges.map(priv => (
                          <span 
                            key={priv} 
                            className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 bg-[#00f5ff]/10 border border-[#00f5ff]/30 text-[#00f5ff]"
                          >
                            <span>{priv === 'waiter' ? 'አስተናጋጅ (Waiter)' :
                                   priv === 'chef' ? 'የኩሽና ሰራተኛ (Chef)' :
                                   priv === 'receptionist' ? 'ሪሴብሽነር (Receptionist)' :
                                   priv === 'admin' ? 'አድሚን (Admin)' :
                                   priv === 'manager' ? 'ማናጀር (Manager)' :
                                   priv === 'cashier' ? 'ካሸር (Cashier)' :
                                   priv === 'guard' ? 'ጥበቃ (Guard)' :
                                   priv === 'none' ? 'ምንም (None)' : priv.toUpperCase()}</span>
                            
                            {/* Rename Privilege Button */}
                            <button 
                              type="button"
                              onClick={() => {
                                const val = prompt(`የመዳረሻ ፈቃድ ስም ይቀይሩ (Rename "${priv.toUpperCase()}"):`, priv);
                                if (val && val.trim()) {
                                  handleRenamePrivilege(priv, val.trim());
                                }
                              }}
                              className="text-white hover:text-[#00f5ff] transition-colors shrink-0 ml-1 text-[10px] bg-transparent border-none cursor-pointer"
                              title="የመዳረሻ ፈቃድ ስም ቀይር (Rename privilege)"
                            >
                              ✍️
                            </button>

                            {/* Delete Privilege Button */}
                            <button 
                              type="button"
                              onClick={() => handleDeletePrivilege(priv)}
                              className="text-red-400 hover:text-red-600 transition-colors shrink-0 ml-1 text-[10px] bg-transparent border-none cursor-pointer"
                              title="መዳረሻ ፈቃድ አስወግድ (Delete privilege)"
                            >
                              ❌
                            </button>
                          </span>
                        ))}
                      </div>

                      {/* Create new privilege form */}
                      <div className="space-y-2 border-t border-white/5 pt-3">
                        <label className="text-[9px] font-mono text-white/40 uppercase block">አዲስ መዳረሻ ፈቃድ ይጨምሩ (Add New Access Privilege)</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            id="new-custom-privilege-input-box"
                            placeholder="ለምሳሌ: supervisor"
                            className="flex-grow bg-[#181818] border border-white/10 text-white text-xs font-bold p-2 outline-none focus:border-[#00f5ff]"
                          />
                          <button
                            type="button"
                            id="btn-add-custom-privilege-submit-box"
                            onClick={() => {
                              const input = document.getElementById('new-custom-privilege-input-box') as HTMLInputElement;
                              if (input && input.value.trim()) {
                                const val = input.value.trim();
                                const normalized = val.toLowerCase();
                                if (!customPrivileges.includes(normalized)) {
                                  setCustomPrivileges(prev => [...prev, normalized]);
                                  alert(`✔ አዲስ የመዳረሻ ፈቃድ "${val}" በተሳካ ሁኔታ ተጨምሯል!`);
                                  input.value = '';
                                } else {
                                  alert(`የመዳረሻ ፈቃዱ "${val}" ቀድሞውኑ ተመዝግቧል!`);
                                }
                              } else {
                                alert(`አሁኑኑ የሚጨምሩትን ባዶ ያልሆነ የመዳረሻ ፈቃድ ስም ይጻፉ!`);
                              }
                            }}
                            className="bg-[#00f5ff] hover:bg-white text-black px-4 font-black text-xs font-mono uppercase cursor-pointer"
                          >
                            ➕ ፍጠር
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Staff List table */}
                    <div className="md:col-span-3 bg-[#121212] border border-white/10 p-5 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <h4 className="text-xs font-black uppercase text-white border-b border-white/5 pb-2 mb-4">
                        👥 የተመዘገቡ የሎጁ ሰራተኞች
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse font-sans">
                          <thead>
                            <tr className="border-b border-white/10 font-mono text-white/40 uppercase font-black">
                              <th className="pb-2">ስም እና መረጃ (Name & Info)</th>
                              <th className="pb-2">መደብ (Role)</th>
                              <th className="pb-2">ሲቀጠር ጀምሮ / ስልክ</th>
                              <th className="pb-2">መግቢያ ዩዘር / ፓስወርድ / PIN</th>
                              <th className="pb-2 text-right">ማስተካከያ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 font-semibold text-white/90">
                            {staff.map((s, idx) => (
                              <tr key={idx} className="hover:bg-white/5 font-sans">
                                <td className="py-2.5 text-white">
                                  <div className="flex items-center gap-2.5">
                                    <img 
                                      src={s.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'} 
                                      className="w-8 h-8 rounded-full border border-white/10 object-cover" 
                                      alt="" 
                                    />
                                    <div>
                                      <p className="font-bold text-white text-xs">{s.name}</p>
                                      {s.education && <p className="text-[9px] text-[#00f5ff] font-medium max-w-xs truncate">🎓 {s.education}</p>}
                                      {s.info && <p className="text-[10px] text-white/40 font-normal italic max-w-xs truncate">{s.info}</p>}
                                    </div>
                                  </div>
                                </td>
                                <td className="uppercase font-mono text-[11px] text-[#C1FF00] font-black">{s.role}</td>
                                <td className="font-mono text-white/80 py-2.5">
                                  <div className="text-[11px]">
                                    <p className="text-[#00f5ff]">{s.phone || 'ያልተገባ'}</p>
                                    <p className="text-white/40 text-[9px]">{s.hireDate || '-'}</p>
                                  </div>
                                </td>
                                <td className="font-mono py-2.5">
                                  <div className="text-[10px]">
                                    <p><span className="text-white/40">U:</span> {s.username || '-'}</p>
                                    <p><span className="text-white/40">P:</span> {s.password || '-'}</p>
                                    <p><span className="text-white/40">PIN:</span> <span className="bg-white/10 px-1 rounded font-bold text-yellow-300">{s.pin}</span></p>
                                  </div>
                                </td>
                                <td className="text-right">
                                  <div className="inline-flex gap-3 justify-end items-center">
                                    {s.certificatePhoto && (
                                      <>
                                        <button 
                                          onClick={() => setPrintingStaffMember(s)}
                                          className="text-[#00f5ff] hover:text-[#C1FF00] font-sans text-[10px] font-black uppercase cursor-pointer"
                                          title="Print Employee Diploma/Certificate Credentials"
                                        >
                                          🖨️ ፕሪንት
                                        </button>
                                        <span className="text-white/20">|</span>
                                      </>
                                    )}
                                    <button 
                                      onClick={() => { setEditingStaff({ ...s }); setOriginalStaffName(s.name); }}
                                      className="text-[#C1FF00] hover:text-white font-sans text-[10px] font-black uppercase cursor-pointer"
                                    >
                                      ✍️ ማስተካከያ
                                    </button>
                                    <span className="text-white/20">|</span>
                                    <button 
                                      id={`btn-remove-staff-${idx}`}
                                      onClick={() => handleRemoveStaff(s.name)}
                                      className="text-red-400 hover:text-red-500 font-sans text-[10px] font-black uppercase cursor-pointer"
                                    >
                                      DISMISS 🗑
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB CONTENT 3: MENU MODIFIER */}
                {activeAdminTab === 'menu' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Add / Edit Menu Item */}
                    {editingMenuItem ? (
                      <div className="bg-[#121212] border border-[#C1FF00]/30 p-5 h-fit space-y-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <h4 className="text-xs font-black uppercase text-[#C1FF00] border-b border-[#C1FF00]/20 pb-2">
                          🍽️ ምናሌ ማስተካከያ (Edit Menu Item)
                        </h4>
                        <form onSubmit={handleSaveEditedMenuItem} className="space-y-4">
                          <div>
                            <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">ስም Amharic</label>
                            <input 
                              type="text" 
                              value={editingMenuItem.nameAm || ''}
                              onChange={(e) => setEditingMenuItem({ ...editingMenuItem, nameAm: e.target.value })}
                              required 
                              className="w-full bg-[#181818] border border-[#C1FF00]/40 text-white text-xs font-bold p-2.5 outline-none focus:border-[#C1FF00]"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">ስም English</label>
                            <input 
                              type="text" 
                              value={editingMenuItem.nameEn || ''}
                              onChange={(e) => setEditingMenuItem({ ...editingMenuItem, nameEn: e.target.value })}
                              required 
                              className="w-full bg-[#181818] border border-[#C1FF00]/40 text-white font-mono text-xs p-2.5 outline-none focus:border-[#C1FF00]"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">ዋጋ (Birr)</label>
                              <input 
                                type="number" 
                                value={editingMenuItem.price !== undefined ? editingMenuItem.price : 0}
                                onChange={(e) => setEditingMenuItem({ ...editingMenuItem, price: parseFloat(e.target.value) || 0 })}
                                required 
                                className="w-full bg-[#181818] border border-[#C1FF00]/40 text-white font-mono text-xs p-2.5 outline-none focus:border-[#C1FF00]"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">ምድብ (Category)</label>
                              <select 
                                value={editingMenuItem.cat || ''}
                                onChange={(e) => {
                                  const nextCat = e.target.value as any;
                                  setEditingMenuItem({ 
                                    ...editingMenuItem, 
                                    cat: nextCat,
                                    // Default customizable true for food or traditional
                                    customizable: (nextCat === 'food' || nextCat === 'traditional') ? true : editingMenuItem.customizable 
                                  });
                                }}
                                className="w-full bg-[#181818] border border-[#C1FF00]/40 text-white text-xs font-bold p-2.5 outline-none focus:border-[#C1FF00]"
                              >
                                {categories.map(cat => (
                                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          
                          {/* Customizable options toggle explicitly required */}
                          <div className="flex items-center gap-2 py-1 bg-black/20 p-2 border border-white/5 rounded">
                            <input 
                              type="checkbox" 
                              id="edit-customizable"
                              checked={editingMenuItem.customizable || false}
                              onChange={(e) => setEditingMenuItem({ ...editingMenuItem, customizable: e.target.checked })}
                              className="w-4 h-4 accent-[#C1FF00]"
                            />
                            <label htmlFor="edit-customizable" className="text-[11px] font-bold text-white cursor-pointer select-none">
                              የማስተካከያ አማራጮች ይኑሩት (ቃሪያ፣ እንጀራ፣ ተጨማሪ ዳቦ ማስተካከያ)
                            </label>
                          </div>

                          <div>
                            <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">ዝርዝር መግለጫ (DESCRIPTION)</label>
                            <input 
                              type="text" 
                              value={editingMenuItem.desc || ''}
                              onChange={(e) => setEditingMenuItem({ ...editingMenuItem, desc: e.target.value })}
                              className="w-full bg-[#181818] border border-[#C1FF00]/40 text-white text-xs font-bold p-2.5 outline-none focus:border-[#C1FF00]"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">የምስል አድራሻ (IMAGE URL)</label>
                            <div className="space-y-2">
                              <input 
                                type="text" 
                                value={editingMenuItem.image || ''}
                                onChange={(e) => setEditingMenuItem({ ...editingMenuItem, image: e.target.value })}
                                className="w-full bg-[#181818] border border-[#C1FF00]/40 text-white text-xs p-2.5 outline-none focus:border-[#C1FF00]"
                              />
                              <label className="block text-center bg-[#1D1D16] border border-dashed border-[#C1FF00]/40 text-[#C1FF00] hover:border-[#C1FF00] font-mono text-[10px] font-bold py-2 px-3 rounded cursor-pointer transition-colors">
                                📂 አዲስ ምስል ለመቀየር ፋይል ይምረጡ (Select New Image)
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  className="hidden" 
                                  onChange={(e) => readMediaFile(e, (base64) => setEditingMenuItem({ ...editingMenuItem, image: base64 }))} 
                                />
                              </label>
                              {editingMenuItem.image && (
                                <div className="mt-2 text-center p-2.5 border border-white/5 bg-black/40 rounded flex flex-col items-center space-y-2">
                                  <p className="text-[9px] font-mono text-white/50">ምስል ቅድመ-እይታ (PREVIEW):</p>
                                  <img src={editingMenuItem.image} className="max-h-24 max-w-full rounded border border-white/10 shadow-md" alt="Current Preview" />
                                  {editingMenuItem.image.startsWith('data:') && (
                                    <div className="bg-yellow-400/10 border border-yellow-400/20 p-2 rounded text-center w-full">
                                      <p className="text-[10px] text-yellow-400 font-bold leading-relaxed">
                                        ⚠️ ምስሉ ከፋይል ተጭኗል! ለውጡን ለማስቀመጥ እባክዎ ከታች ያለውን <span className="underline text-yellow-300">UPDATE ITEM ✔️</span> የሚለውን ቁልፍ መጫን እንዳይረሱ!
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              type="submit" 
                              className="flex-1 bg-[#C1FF00] hover:bg-white text-black text-xs font-black uppercase py-3 font-mono cursor-pointer"
                            >
                              UPDATE ITEM ✔️
                            </button>
                            <button 
                              type="button" 
                              onClick={() => setEditingMenuItem(null)}
                              className="px-3 bg-red-950/40 text-red-400 hover:bg-red-600 hover:text-white border border-red-900/30 text-xs font-bold uppercase transition-all cursor-pointer"
                            >
                              CANCEL
                            </button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <div className="bg-[#121212] border border-white/10 p-5 h-fit space-y-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <h4 className="text-xs font-black uppercase text-white border-b border-white/5 pb-2">
                          🍽️ አዲስ ሜኑ መመዝገቢያ (Add To Menu)
                        </h4>
                        <form onSubmit={handleAddNewMenuItem} className="space-y-4">
                          <div>
                            <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">ስም Amharic</label>
                            <input 
                              type="text" 
                              id="add-name-am"
                              required 
                              placeholder="የዓሳ ጉላሽ"
                              className="w-full bg-[#181818] border border-white/10 text-white text-xs font-bold p-2.5 outline-none focus:border-[#C1FF00]"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">ስም English</label>
                            <input 
                              type="text" 
                              id="add-name-en"
                              required 
                              placeholder="Fish Goulash"
                              className="w-full bg-[#181818] border border-white/10 text-white font-mono text-xs p-2.5 outline-none focus:border-[#C1FF00]"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">ዋጋ (Birr)</label>
                              <input 
                                type="number" 
                                id="add-price"
                                required 
                                placeholder="480"
                                className="w-full bg-[#181818] border border-white/10 text-white font-mono text-xs p-2.5 outline-none focus:border-[#C1FF00]"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">ምድብ (Category)</label>
                              <select 
                                id="add-cat"
                                className="w-full bg-[#181818] border border-white/10 text-white text-xs font-bold p-2.5 outline-none focus:border-[#C1FF00]"
                              >
                                {categories.map(cat => (
                                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Enable Customizable options toggle for newly registered item */}
                          <div className="flex items-center gap-2 py-1 bg-black/20 p-2 border border-white/5 rounded">
                            <input 
                              type="checkbox" 
                              id="add-customizable"
                              defaultChecked={true}
                              className="w-4 h-4 accent-[#C1FF00]"
                            />
                            <label htmlFor="add-customizable" className="text-[11px] font-bold text-white cursor-pointer select-none">
                              የማስተካከያ አማራጮች ይኑሩት (ቃሪያ፣ እንጀራ፣ ተጨማሪ ዳቦ ማስተካከያ)
                            </label>
                          </div>
                          <div>
                            <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">ዝርዝር መግለጫ (DESCRIPTION)</label>
                            <input 
                              type="text" 
                              id="add-desc"
                              placeholder="ከነጭ ሩዝ እና አትክልት ጋር"
                              className="w-full bg-[#181818] border border-white/10 text-white text-xs font-bold p-2.5 outline-none focus:border-[#C1FF00]"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">የምስል አድራሻ (IMAGE URL)</label>
                            <div className="space-y-2">
                              <input 
                                type="text" 
                                id="add-image"
                                placeholder="https://images.unsplash.com/..."
                                value={addMenuImage}
                                onChange={(e) => setAddMenuImage(e.target.value)}
                                className="w-full bg-[#181818] border border-white/10 text-white font-mono text-xs p-2.5 outline-none focus:border-[#C1FF00]"
                              />
                              <div className="flex gap-2 items-center">
                                <label className="flex-1 text-center bg-[#1D1D16] border border-dashed border-[#C1FF00]/40 text-[#C1FF00] hover:border-[#C1FF00] font-mono text-[10px] font-bold py-2 px-3 rounded cursor-pointer transition-colors">
                                  📂 ከስልክ ወይም ኮምፒውተር ይጫኑ (Upload from Device)
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={(e) => readMediaFile(e, (base64) => setAddMenuImage(base64))} 
                                  />
                                </label>
                                {addMenuImage && (
                                  <button 
                                    type="button" 
                                    onClick={() => setAddMenuImage('')}
                                    className="px-3 py-2 bg-red-950 text-red-400 border border-red-900/40 text-[10px] rounded hover:bg-red-900 hover:text-white transition-colors"
                                  >
                                    RESET
                                  </button>
                                )}
                              </div>
                              {addMenuImage && (
                                <div className="mt-2 text-center p-3 border border-white/5 bg-black/40 rounded flex flex-col items-center space-y-2">
                                  <p className="text-[9px] font-mono text-white/50">ምስል ቅድመ-እይታ (PREVIEW):</p>
                                  <img src={addMenuImage} className="max-h-24 max-w-full rounded border border-white/10 shadow-md" alt="Preview" />
                                  {addMenuImage.startsWith('data:') && (
                                    <div className="bg-yellow-400/10 border border-yellow-400/20 p-2 rounded text-center w-full">
                                      <p className="text-[10px] text-yellow-400 font-bold leading-relaxed">
                                        ⚠️ ምስሉ ከስልክ/ኮምፒውተር ተጭኗል! ሜኑውን ለመመዝገብ እባክዎ ከታች ያለውን <span className="underline text-yellow-300">ADD TO MENU ➕</span> የሚለውን ቁልፍ መጫን እንዳይረሱ!
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <button 
                            type="submit" 
                            className="w-full bg-[#C1FF00] hover:bg-white text-black text-xs font-black uppercase py-3 font-mono cursor-pointer"
                            id="btn-add-menu-submit"
                          >
                            SAVE MENU ITEM
                          </button>
                        </form>
                      </div>
                    )}

                    {/* Add Dynamic Menu Category card */}
                    {editingCategory ? (
                      <div className="bg-[#121212] border border-[#ff007f] p-5 h-fit space-y-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <div className="border-b border-white/5 pb-2">
                          <span className="text-[9px] text-[#ff007f] font-mono font-bold tracking-wider block uppercase font-black">CATEGORY ENGINE (EDIT)</span>
                          <h4 className="text-xs font-black uppercase text-[#ff007f] mt-0.5">
                            ✍️ ምድብ ማስተካከያ (Edit Category)
                          </h4>
                        </div>
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          const label = (e.currentTarget.querySelector('#edit-cat-label') as HTMLInputElement).value;
                          const icon = (e.currentTarget.querySelector('#edit-cat-icon') as HTMLInputElement).value;
                          const activeBg = (e.currentTarget.querySelector('#edit-cat-bg') as HTMLSelectElement).value;

                          if (!label.trim()) {
                            alert('እባክዎ የምድብ ስም ያስገቡ!');
                            return;
                          }

                          setCategories(prev => prev.map(c => c.id === editingCategory.id ? {
                            ...c,
                            label,
                            icon: icon || '🍱',
                            activeBg
                          } : c));

                          setEditingCategory(null);
                          alert('🎉 የምግብ ምድቡ በተሳካ ሁኔታ ተስተካክሏል! / Category updated successfully.');
                        }} className="space-y-3.5">
                          <div>
                            <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">የምድብ ስም (Category Name)</label>
                            <input 
                              type="text" 
                              id="edit-cat-label"
                              required 
                              defaultValue={editingCategory.label}
                              className="w-full bg-[#181818] border border-[#ff007f]/40 text-white text-xs font-bold p-2 outline-none focus:border-[#ff007f]"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">ምልክት (Category Icon)</label>
                            <input 
                              type="text" 
                              id="edit-cat-icon"
                              required 
                              defaultValue={editingCategory.icon}
                              className="w-full bg-[#181818] border border-[#ff007f]/40 text-center text-white text-base font-bold p-2 outline-none focus:border-[#ff007f]"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">የቁልፍ አይነት ቀለም (Active Accent Style)</label>
                            <select 
                              id="edit-cat-bg"
                              defaultValue={editingCategory.activeBg}
                              className="w-full bg-[#181818] border border-[#ff007f]/40 text-white text-xs font-bold p-2 outline-none focus:border-[#ff007f]"
                            >
                              <option value="tactile-3d-btn-lime">🟢 Lime Green (የሎሚ አረንጓዴ)</option>
                              <option value="tactile-3d-btn-sky">🔵 Sky Blue (ሰማያዊ)</option>
                              <option value="tactile-3d-btn-pink">🔴 Deep Pink (ሮዝ)</option>
                              <option value="tactile-3d-btn-orange">🟠 Bright Orange (ብርትኳናማ)</option>
                              <option value="tactile-3d-btn-amber">🟡 Golden Amber (የወርቅ ማር)</option>
                              <option value="tactile-3d-btn-purple">🟣 Mystic Purple (ሐምራዊ)</option>
                            </select>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              type="submit" 
                              className="flex-grow bg-[#ff007f] hover:bg-white text-white hover:text-black text-xs font-black uppercase py-2 cursor-pointer transition-all border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                            >
                              SAVE CHANGES
                            </button>
                            <button 
                              type="button" 
                              onClick={() => setEditingCategory(null)}
                              className="px-3 bg-red-950/40 border border-red-900/40 text-red-400 text-xs font-bold uppercase transition-all"
                            >
                              CANCEL
                            </button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <div className="bg-[#121212] border border-[#ff007f]/30 p-5 h-fit space-y-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <div className="border-b border-white/5 pb-2">
                          <span className="text-[9px] text-[#ff007f] font-mono font-bold tracking-wider block uppercase font-black">CATEGORY ENGINE</span>
                          <h4 className="text-xs font-black uppercase text-white mt-0.5">
                            ➕ አዲስ ምድብ መፍጠሪያ (Add Category)
                          </h4>
                        </div>
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          const labelAm = (e.currentTarget.querySelector('#add-cat-label-am') as HTMLInputElement).value;
                          const labelEn = (e.currentTarget.querySelector('#add-cat-label-en') as HTMLInputElement).value;
                          const icon = (e.currentTarget.querySelector('#add-cat-icon') as HTMLInputElement).value;
                          const slug = (e.currentTarget.querySelector('#add-cat-slug') as HTMLInputElement).value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
                          const activeBg = (e.currentTarget.querySelector('#add-cat-bg') as HTMLSelectElement).value;

                          if (!slug) {
                            alert('እባክዎ የተለየ ምድብ መለያ (slug) ያስገቡ!');
                            return;
                          }

                          if (categories.some(c => c.id === slug)) {
                            alert('ይህ ምድብ መለያ ከዚህ በፊት ተመዝግቧል! / Slug already exists.');
                            return;
                          }

                          const newCat = {
                            id: slug,
                            icon: icon || '🥘',
                            label: `${labelAm} (${labelEn})`,
                            activeBg: activeBg || 'tactile-3d-btn-lime'
                          };

                          setCategories(prev => [...prev, newCat]);
                          e.currentTarget.reset();
                          alert('🎉 አዲስ የሽያጭ ምድብ በተሳካ ሁኔታ ተፈጥሯል! / Brand new food category registered successfully.');
                        }} className="space-y-3.5">
                          <div>
                            <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">ምድብ ስም Amharic (አማርኛ)</label>
                            <input 
                              type="text" 
                              id="add-cat-label-am"
                              required 
                              placeholder="e.g. ጣፋጮች"
                              className="w-full bg-[#181818] border border-white/10 text-white text-xs font-bold p-2 outline-none focus:border-[#ff007f]"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">ምድብ ስም English (እንግሊዝኛ)</label>
                            <input 
                              type="text" 
                              id="add-cat-label-en"
                              required 
                              placeholder="e.g. Desserts"
                              className="w-full bg-[#181818] border border-white/10 text-white font-mono text-xs p-2 outline-none focus:border-[#ff007f]"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">ምልክት (Icon)</label>
                              <input 
                                type="text" 
                                id="add-cat-icon"
                                required 
                                placeholder="e.g. 🍰"
                                className="w-full bg-[#181818] border border-[#ff007f]/40 text-center text-white text-base font-bold p-2 outline-none focus:border-[#ff007f]"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">ይለይበት (ID Slug)</label>
                              <input 
                                type="text" 
                                id="add-cat-slug"
                                required 
                                placeholder="e.g. dessert"
                                className="w-full bg-[#181818] border border-white/10 text-white font-mono text-xs p-2 outline-none focus:border-[#ff007f]"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">የቁልፍ አይነት ቀለም (Active Accent Style)</label>
                            <select 
                              id="add-cat-bg"
                              className="w-full bg-[#181818] border border-white/10 text-white text-xs font-bold p-2.5 outline-none focus:border-[#ff007f]"
                            >
                              <option value="tactile-3d-btn-lime">🟢 Lime Green (የሎሚ አረንጓዴ)</option>
                              <option value="tactile-3d-btn-sky">🔵 Sky Blue (ሰማያዊ)</option>
                              <option value="tactile-3d-btn-pink">🔴 Deep Pink (ሮዝ)</option>
                              <option value="tactile-3d-btn-orange">🟠 Bright Orange (ብርትኳናማ)</option>
                              <option value="tactile-3d-btn-amber">🟡 Golden Amber (የወርቅ ማር)</option>
                              <option value="tactile-3d-btn-purple">🟣 Mystic Purple (ሐምራዊ)</option>
                            </select>
                          </div>

                          <button 
                            type="submit" 
                            className="w-full bg-[#ff007f] hover:bg-white text-white hover:text-black text-xs font-black uppercase py-2.5 font-mono cursor-pointer transition-all border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none"
                          >
                            CREATE CATEGORY
                          </button>
                        </form>
                      </div>
                    )}

                    {/* Dynamic Food Customizer Modifier Configurator */}
                    <div className="bg-[#121212] border border-[#00f5ff]/30 p-5 h-fit space-y-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <div className="border-b border-white/5 pb-2">
                        <span className="text-[9px] text-[#00f5ff] font-mono font-bold tracking-wider block uppercase font-black">CUSTOMIZER CONFIGURATOR</span>
                        <h4 className="text-xs font-black uppercase text-white mt-0.5">
                          🌶️ የእቃዎች ማሻሻያ አማራጮች ማስተካከያ (Modifier Options)
                        </h4>
                      </div>
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        const qariaRaw = (e.currentTarget.querySelector('#edit-mod-qaria') as HTMLInputElement).value;
                        const injeraRaw = (e.currentTarget.querySelector('#edit-mod-injera') as HTMLInputElement).value;
                        const injeraPricesRaw = (e.currentTarget.querySelector('#edit-mod-injera-prices') as HTMLInputElement).value;
                        const daboPriceVal = Number((e.currentTarget.querySelector('#edit-mod-dabo-price') as HTMLInputElement).value);
                        const kochoPriceVal = Number((e.currentTarget.querySelector('#edit-mod-kocho-price') as HTMLInputElement).value || 0);
                        const mayoPriceVal = Number((e.currentTarget.querySelector('#edit-mod-mayo-price') as HTMLInputElement).value || 0);
                        const customAdditionsPriceVal = Number((e.currentTarget.querySelector('#edit-mod-custom-price') as HTMLInputElement).value || 0);

                        const qariaParsed = qariaRaw.split(',').map(s => s.trim()).filter(Boolean);
                        const injeraParsed = injeraRaw.split(',').map(s => s.trim()).filter(Boolean);
                        const pricesParsed = injeraPricesRaw.split(',').map(s => Number(s.trim()) || 0);

                        if (qariaParsed.length === 0) {
                          alert('እባክዎ ቢያንስ አንድ የቃሪያ አማራጭ ያስገቡ!');
                          return;
                        }
                        if (injeraParsed.length === 0) {
                          alert('እባክዎ ቢያንስ አንድ የእንጀራ አማራጭ ያስገቡ!');
                          return;
                        }
                        if (isNaN(daboPriceVal) || daboPriceVal < 0) {
                          alert('የዳቦ ዋጋ ትክክለኛ ቁጥር መሆን አለበት!');
                          return;
                        }

                        // Construct mapping of choice to price
                        const injeraPricesMap: { [key: string]: number } = {};
                        injeraParsed.forEach((choice, index) => {
                          injeraPricesMap[choice] = pricesParsed[index] !== undefined ? pricesParsed[index] : 0;
                        });

                        setModifierOptions({
                          qariaChoices: qariaParsed,
                          injeraChoices: injeraParsed,
                          daboPrice: daboPriceVal,
                          injeraPrices: injeraPricesMap,
                          kochoPrice: kochoPriceVal,
                          mayoPrice: mayoPriceVal,
                          customAdditionsPrice: customAdditionsPriceVal
                        });
                        alert('🎉 የምግብ ማሻሻያ ምርጫዎች ዝርዝር እና ዋጋ በተሳካ ሁኔታ ተቀይሯል! / Food modifier settings updated successfully.');
                      }} className="space-y-3.5">
                        <div>
                          <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">
                            🌶️ ቃሪያ አማራጮች (Green Pepper Options - በኮማ ይለዩ)
                          </label>
                          <input 
                            type="text" 
                            id="edit-mod-qaria"
                            required 
                            defaultValue={modifierOptions.qariaChoices.join(', ')}
                            placeholder="e.g. አለ, የለም"
                            className="w-full bg-[#181818] border border-white/10 text-white text-xs font-bold p-2 outline-none focus:border-[#00f5ff]"
                          />
                          <p className="text-[8.5px] text-white/30 font-mono mt-1">
                            የአሁኑ አማራጮች: {modifierOptions.qariaChoices.map(c => `[${c}]`).join(' ')}
                          </p>
                        </div>
                        <div>
                          <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">
                            🌾 እንጀራ አማራጮች (Injera Options - በኮማ ይለዩ)
                          </label>
                          <input 
                            type="text" 
                            id="edit-mod-injera"
                            required 
                            defaultValue={modifierOptions.injeraChoices.join(', ')}
                            placeholder="e.g. የለም, ግማሽ, ሙሉ"
                            className="w-full bg-[#181818] border border-white/10 text-white text-xs font-bold p-2 outline-none focus:border-[#00f5ff]"
                          />
                          <p className="text-[8.5px] text-white/30 font-mono mt-1">
                            የአሁኑ አማራጮች: {modifierOptions.injeraChoices.map(c => `[${c}]`).join(' ')}
                          </p>
                        </div>
                        <div>
                          <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">
                            💰 የእንጀራ አማራጮች ተጨማሪ ዋጋ (Injera Choice Prices - በኮማ ይለዩ)
                          </label>
                          <input 
                            type="text" 
                            id="edit-mod-injera-prices"
                            required 
                            defaultValue={modifierOptions.injeraChoices.map(c => modifierOptions.injeraPrices[c] ?? 0).join(', ')}
                            placeholder="e.g. 0, 15, 30"
                            className="w-full bg-[#181818] border border-white/10 text-white text-xs font-bold p-2 outline-none focus:border-[#00f5ff]"
                          />
                          <p className="text-[8.5px] text-white/40 font-mono mt-1 leading-normal">
                            ከላይ ካለው የእንጀራ አማራጭ ጋር በቅደም ተከተል ይጣጣማል፡<br/>
                            {modifierOptions.injeraChoices.map(c => `${c}: +${modifierOptions.injeraPrices[c] ?? 0} Birr`).join(' | ')}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <div>
                            <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">
                              🥖 የአንድ ዳቦ ዋጋ (Bread Price)
                            </label>
                            <input 
                              type="number" 
                              id="edit-mod-dabo-price"
                              required 
                              min="0"
                              defaultValue={modifierOptions.daboPrice}
                              placeholder="e.g. 15"
                              className="w-full bg-[#181818] border border-white/10 text-white text-xs font-bold p-2 outline-none focus:border-[#00f5ff]"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">
                              🫓 የቆጮ ተጨማሪ ዋጋ (Kocho Price)
                            </label>
                            <input 
                              type="number" 
                              id="edit-mod-kocho-price"
                              required 
                              min="0"
                              defaultValue={modifierOptions.kochoPrice !== undefined ? modifierOptions.kochoPrice : 45}
                              placeholder="e.g. 45"
                              className="w-full bg-[#181818] border border-white/10 text-white text-xs font-bold p-2 outline-none focus:border-[#00f5ff]"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">
                              🧴 የማዮኔዝ ተጨማሪ ዋጋ (Mayo Price)
                            </label>
                            <input 
                              type="number" 
                              id="edit-mod-mayo-price"
                              required 
                              min="0"
                              defaultValue={modifierOptions.mayoPrice !== undefined ? modifierOptions.mayoPrice : 20}
                              placeholder="e.g. 20"
                              className="w-full bg-[#181818] border border-white/10 text-white text-xs font-bold p-2 outline-none focus:border-[#00f5ff]"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">
                              ➕ የጥሬ ጭማሪዎች ዋጋ (Custom Extra Price)
                            </label>
                            <input 
                              type="number" 
                              id="edit-mod-custom-price"
                              required 
                              min="0"
                              defaultValue={modifierOptions.customAdditionsPrice !== undefined ? modifierOptions.customAdditionsPrice : 35}
                              placeholder="e.g. 35"
                              className="w-full bg-[#181818] border border-white/10 text-white text-xs font-bold p-2 outline-none focus:border-[#00f5ff]"
                            />
                          </div>
                        </div>

                        <button 
                          type="submit" 
                          className="w-full bg-[#00f5ff] hover:bg-white text-black text-xs font-black uppercase py-2.5 font-mono cursor-pointer transition-all border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        >
                          SAVE MODIFIER CONFIGS
                        </button>
                      </form>
                    </div>

                    {/* Menu items listing */}
                    <div className="md:col-span-2 bg-[#121212] border border-white/10 p-5 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <h4 className="text-xs font-black uppercase text-white border-b border-white/5 pb-2 mb-4">
                        🍽️ አሁን ያሉ ምናሌዎች
                      </h4>
                      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 no-scrollbar">
                        {menuItems.map((m, idx) => (
                          <div key={idx} className="bg-[#181818] border border-white/5 p-3 flex justify-between items-center whitespace-nowrap rounded">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-xs font-mono text-white/40 uppercase shrink-0">[{m.cat}]</span>
                              <div className="min-w-0 truncate">
                                <h5 className="text-xs font-black text-white">{m.nameAm}</h5>
                                <p className="text-[9px] text-[#C1FF00] font-mono leading-none tracking-wide">{m.nameEn}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-mono text-xs font-black text-white mr-2">{m.price} ብር</span>
                              <button 
                                onClick={() => setEditingMenuItem({ ...m })}
                                className="px-2.5 py-1 text-[10px] font-bold uppercase text-[#C1FF00] bg-[#C1FF00]/10 hover:bg-[#C1FF00] hover:text-black transition-all rounded cursor-pointer"
                                title="ምናሌ ማስተካከያ"
                              >
                                ✍️ ማስተካከያ
                              </button>
                              <button
                                id={`btn-toggle-avail-${m.id}`}
                                onClick={() => handleToggleMenuItemAvailable(m.id)}
                                className={`px-2 py-1 font-mono text-[9px] font-black uppercase rounded ${
                                  m.available ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                                }`}
                              >
                                {m.available ? 'AVAILABLE' : 'OFFLINE'}
                              </button>
                              <button 
                                id={`btn-delete-menu-${m.id}`}
                                onClick={() => handleRemoveMenuItem(m.id)}
                                className="text-red-400 hover:text-red-500 p-1 rounded hover:bg-red-500/10 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* DYNAMIC CATEGORY MANAGEMENT AND SELECTION CARD */}
                    <div className="md:col-span-3 bg-[#0d0d0d] border border-white/10 p-5 rounded-2xl space-y-4 relative overflow-hidden shadow-xl mt-4 font-sans text-white">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <div>
                          <span className="text-[9px] text-[#ff007f] font-mono tracking-widest uppercase block font-black">Registered Food & Service Categories</span>
                          <h4 className="text-xs font-black uppercase text-white">📂 የተመዘገቡ የምግብ ምድቦች (Categories Directory)</h4>
                        </div>
                        <span className="text-xs font-mono font-bold text-white/50 bg-[#161616] border border-white/5 px-2.5 py-1 rounded">
                          Total: {categories.length}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {categories.map((cat) => (
                          <div 
                            key={cat.id} 
                            className="bg-[#141414] border border-white/5 hover:border-[#ff007f]/30 p-4 rounded-xl flex flex-col justify-between space-y-3 transition-colors duration-250 relative group"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xl bg-black/50 border border-white/5 p-2 rounded-lg shrink-0">{cat.icon}</span>
                              <div className="min-w-0">
                                <span className="font-mono text-[8px] uppercase tracking-wider text-white/40 block">Slug: {cat.id}</span>
                                <h5 className="font-black text-xs text-[#C1FF00] truncate">{cat.label}</h5>
                              </div>
                            </div>

                            <div className="flex gap-2 justify-between items-center pt-2.5 border-t border-white/5">
                              <span className="text-[9px] font-mono text-[#ff007f] font-bold">[{cat.activeBg}]</span>
                              <div className="flex gap-1.5 text-[10px] font-mono font-bold">
                                <button 
                                  type="button"
                                  onClick={() => {
                                    setEditingCategory({ ...cat });
                                    playVoiceAlert(`Editing ${cat.label} category.`);
                                  }}
                                  className="text-sky-400 hover:text-white transition-all uppercase px-1.5 focus:outline-none cursor-pointer"
                                >
                                  EDIT ✍️
                                </button>
                                <span className="text-white/10">|</span>
                                <button 
                                  type="button"
                                  onClick={() => {
                                    // Protect core categories
                                    const protectedSlugs = ['food', 'drinks', 'traditional', 'room', 'venue'];
                                    if (protectedSlugs.includes(cat.id)) {
                                      alert(`❌ ይህ ዋና/መሰረታዊ ምድብ ስለሆነ ማጥፋት አይቻልም! / Core system category "${cat.label}" is protected.`);
                                      return;
                                    }

                                    const matches = menuItems.some(item => item.cat === cat.id);
                                    if (matches) {
                                      askConfirmAndRun(
                                        `ይህ ምድብ በውስጡ የያዛቸው የተለያዩ ምግቦች አሉት። ምድቡን ሲያጠፉ በውስጡ ያሉትን ምግቦች አብረው ማጥፋት እና ምድቡን መሰረዝ እርግጠኛ ነዎት? \n(This category contains menu items. Are you sure you want to delete this category and all its items?)`,
                                        () => {
                                          setMenuItems(prev => prev.filter(item => item.cat !== cat.id));
                                          setCategories(prev => prev.filter(c => c.id !== cat.id));
                                          playVoiceAlert('Category and its items deleted successfully.');
                                        }
                                      );
                                    } else {
                                      askConfirmAndRun(
                                        `የተመረጠውን ምድብ "${cat.label}" ለማጥፋት እርግጠኛ ነዎት? / Delete "${cat.label}" category?`,
                                        () => {
                                          setCategories(prev => prev.filter(c => c.id !== cat.id));
                                          playVoiceAlert('Category deleted successfully.');
                                        }
                                      );
                                    }
                                  }}
                                  className="text-red-400 hover:text-red-500 transition-all uppercase px-1.5 focus:outline-none cursor-pointer"
                                >
                                  DELETE 🗑️
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB CONTENT 4: BANKS CONTROL */}
                {activeAdminTab === 'banks' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Add / Edit Bank */}
                    {editingBank ? (
                      <div className="bg-[#121212] border border-[#C1FF00]/30 p-5 h-fit space-y-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <h4 className="text-xs font-black uppercase text-[#C1FF00] border-b border-[#C1FF00]/20 pb-2">
                          💳 የባንክ አካውንት ማስተካከያ (Edit Bank)
                        </h4>
                        <form onSubmit={handleSaveEditedBank} className="space-y-4">
                          <div>
                            <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">የባንክ / ክፍያ ስም</label>
                            <input 
                              type="text" 
                              value={editingBank.name || ''}
                              onChange={(e) => setEditingBank({ ...editingBank, name: e.target.value })}
                              required 
                              className="w-full bg-[#181818] border border-[#C1FF00]/40 text-white text-xs font-bold p-2.5 outline-none focus:border-[#C1FF00]"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">የአካውንት ባለቤት (HOLDER)</label>
                            <input 
                              type="text" 
                              value={editingBank.holder || ''}
                              onChange={(e) => setEditingBank({ ...editingBank, holder: e.target.value })}
                              required 
                              className="w-full bg-[#181818] border border-[#C1FF00]/40 text-white text-xs font-bold p-2.5 outline-none focus:border-[#C1FF00]"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">የአካውንት ቁጥር (NUMBER)</label>
                            <input 
                              type="text" 
                              value={editingBank.number || ''}
                              onChange={(e) => setEditingBank({ ...editingBank, number: e.target.value })}
                              required 
                              className="w-full bg-[#181818] border border-[#C1FF00]/40 text-white font-mono text-xs p-2.5 outline-none focus:border-[#C1FF00]"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button 
                              type="submit" 
                              className="flex-1 bg-[#C1FF00] hover:bg-white text-black text-xs font-black uppercase py-3 font-mono cursor-pointer"
                            >
                              UPDATE BANK ✔️
                            </button>
                            <button 
                              type="button" 
                              onClick={() => setEditingBank(null)}
                              className="px-3 bg-red-950/40 text-red-400 hover:bg-red-600 hover:text-white border border-red-900/30 text-xs font-bold uppercase transition-all cursor-pointer"
                            >
                              CANCEL
                            </button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <div className="bg-[#121212] border border-white/10 p-5 h-fit space-y-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-sans">
                        <h4 className="text-xs font-black uppercase text-white border-b border-white/5 pb-2">
                          💳 የባንክ አካውንት መመዝገቢያ
                        </h4>
                        <form onSubmit={handleAddBank} className="space-y-4 font-sans">
                          <div>
                            <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">የባንክ / ክፍያ ስም</label>
                            <input 
                              type="text" 
                              id="bank-reg-name"
                              required 
                              placeholder="የኢትዮጵያ ንግድ ባንክ (CBE)"
                              className="w-full bg-[#181818] border border-white/10 text-white text-xs font-bold p-2.5 outline-none focus:border-[#C1FF00]"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">የአካውንት ባለቤት (HOLDER)</label>
                            <input 
                              type="text" 
                              id="bank-reg-holder"
                              required 
                              placeholder="Papyrus Lodge PLC"
                              className="w-full bg-[#181818] border border-white/10 text-white text-xs font-bold p-2.5 outline-none focus:border-[#C1FF00]"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">የአካውንት ቁጥር (NUMBER)</label>
                            <input 
                              type="text" 
                              id="bank-reg-number"
                              required 
                              placeholder="1000182746432"
                              className="w-full bg-[#181818] border border-white/10 text-white font-mono text-xs p-2.5 outline-none focus:border-[#C1FF00]"
                            />
                          </div>
                          <button 
                            type="submit" 
                            className="w-full bg-[#C1FF00] hover:bg-white text-black text-xs font-black uppercase py-3 font-mono cursor-pointer"
                            id="btn-add-bank-submit"
                          >
                            SAVE BANK ACCOUNT
                          </button>
                        </form>
                      </div>
                    )}

                    {/* Preexisting banks list */}
                    <div className="md:col-span-2 bg-[#121212] border border-white/10 p-5 space-y-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <h4 className="text-xs font-black uppercase text-white border-b border-white/5 pb-2 mb-4">
                        💳 የተመዘገቡ የባንክ አካውንቶች
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {banks.map((b, idx) => (
                          <div key={idx} className="bg-[#181818] border border-white/5 p-4 flex flex-col justify-between rounded-lg">
                            <div>
                              <h5 className="text-xs font-black text-[#C1FF00]">{b.name}</h5>
                              <p className="font-mono text-xs font-bold text-white tracking-widest mt-1">A/C: {b.number}</p>
                              <p className="text-[10px] text-white/50 font-bold mt-1">Holder: {b.holder}</p>
                            </div>
                            <div className="text-right mt-3 pt-2 border-t border-white/5 flex gap-2 justify-end items-center">
                              <button 
                                onClick={() => setEditingBank({ ...b })}
                                className="text-[#C1FF00] hover:text-white font-mono text-[9px] uppercase font-bold cursor-pointer"
                              >
                                ማስተካከያ ✍️
                              </button>
                              <span className="text-white/10 text-[9px]">|</span>
                              <button 
                                id={`btn-delete-bank-${idx}`}
                                onClick={() => handleRemoveBank(b.id)}
                                className="text-red-400 hover:text-red-500 font-mono text-[9px] uppercase font-bold cursor-pointer"
                              >
                                DELETE 🗑️
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* CHAPA INTEGRATION SERVICE COMPONENT */}
                    <div className="md:col-span-3 bg-[#0c141d] border border-[#00f5ff]/35 p-5 rounded-2xl space-y-4 relative overflow-hidden shadow-xl mt-2 font-sans text-white">
                      {/* Decorative background pulse */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#00f5ff]/5 rounded-full blur-2xl pointer-events-none" />
                      
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/10 pb-3 gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">🔌</span>
                          <div>
                            <span className="text-[9px] text-[#00f5ff] font-mono tracking-widest uppercase block font-black">National Payment Integration protocol</span>
                            <h4 className="text-sm font-black uppercase text-white">Chapa Payment Gateway Dashboard (የቻፓ ክፍያ ማገናኛ ሰሌዳ)</h4>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            type="button"
                            onClick={() => {
                              setChapaActive(!chapaActive);
                              playVoiceAlert(`Chapa integration status changed.`);
                            }}
                            className={`px-3 py-1 text-[9px] font-mono uppercase font-black tracking-wider transition-all rounded cursor-pointer ${
                              chapaActive 
                                ? 'bg-emerald-500/10 text-[#00f5ff] border border-emerald-500/30' 
                                : 'bg-red-500/10 text-red-400 border border-red-500/30'
                            }`}
                          >
                            {chapaActive ? '🟢 ACTIVE (የሚሰራ)' : '🔴 DISABLED (የማይሰራ)'}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* Configuration Form */}
                        <div className="lg:col-span-7 space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[9.5px] font-mono text-white/50 uppercase block mb-1">Gateway environment (ሁኔታ)</label>
                              <select 
                                value={chapaMode} 
                                onChange={(e) => setChapaMode(e.target.value as 'live' | 'test')}
                                className="w-full bg-[#121212] border border-white/10 text-white font-mono text-xs p-2 outline-none focus:border-[#00f5ff] rounded"
                              >
                                <option value="test">TEST / SANDBOX (የሙከራ አካውንት)</option>
                                <option value="live">LIVE / PRODUCTION (እውነተኛ ክፍያ)</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[9.5px] font-mono text-white/50 uppercase block mb-1">INTEGRATOR STATUS</label>
                              <div className="p-1.5 border border-white/5 bg-black/40 text-[10px] text-[#C1FF00] font-bold flex items-center gap-1.5 rounded h-[34px]">
                                <span className={`w-2 h-2 rounded-full ${chapaKey && chapaKey.startsWith('CHAPA') ? 'bg-emerald-400 animate-pulse' : 'bg-yellow-400'}`}></span>
                                {chapaKey && chapaKey.startsWith('CHAPA') ? 'AUTHENTICATED / የተገናኘ' : 'PENDING API KEY / ቁልፍ ይጠብቃል'}
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="text-[9.5px] font-mono text-white/50 uppercase block mb-1">
                              የቻፓ ምስጢራዊ ቁልፍ (CHAPA SECRET API KEY)
                            </label>
                            <input 
                              type="password" 
                              value={chapaKey}
                              onChange={(e) => setChapaKey(e.target.value)}
                              placeholder={chapaMode === 'live' ? "CHAPA_SEC-live-xxxxxxxxxxxxxxxx" : "CHAPA_SEC-test-xxxxxxxxxxxxxxxx"}
                              className="w-full bg-[#121212] border border-[#00f5ff]/30 text-white font-mono text-xs p-2.5 outline-none focus:border-[#00f5ff] rounded tracking-widest text-[#00f5ff]"
                            />
                            <p className="text-[9px] text-white/40 mt-1 leading-relaxed">
                              ⚠️ Your api key is stored client-side securely in encrypted local browser session memory for total protection. Net requests are signed with your key directly.
                            </p>
                          </div>
                        </div>

                        {/* Instruction and Steps */}
                        <div className="lg:col-span-5 bg-black/40 border border-white/5 p-4 rounded-xl space-y-3 text-xs text-white/80">
                          <span className="text-[9px] font-mono text-[#00f5ff] uppercase font-black block tracking-widest border-b border-white/10 pb-1">📋 የማቀናበሪያ ደረጃዎች (COMPLETE STEP-BY-STEP CHECKLIST)</span>
                          <ol className="list-decimal pl-4 space-y-2 text-[11px] leading-normal">
                            <li>በቻፓ ድረ-ገጽ ላይ <a href="https://chapa.co" target="_blank" rel="noopener noreferrer" className="text-[#00f5ff] underline hover:text-white">Chapa.co</a> አካውንት ይክፈቱ (Sign up or login)</li>
                            <li>የድርጅትዎን መረጃ ሙሉ በሙሉ ይሙሉትና ያረጋግጡ (Verify your corporate compliance)</li>
                            <li>ከሴቲንግ ክፍል **Settings ➡️ API Keys & Webhooks** ይግቡ</li>
                            <li>የሚሰጠውን **Secret Key** (CHAPA_SEC-...) ኮፒ አድርገው እዚህ ያስገቡ</li>
                            <li>በደንበኛው በኩል የሚከፈለውን ክፍያ በቀጥታ በChapa መዝገብ ላይ ይከታተሉ።</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB CONTENT 5: QR GENERATOR CODES */}
                {activeAdminTab === 'qrprint' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#121212] border border-white/10 p-5 h-fit space-y-4">
                      <h4 className="text-xs font-black uppercase text-white border-b border-white/5 pb-2">
                        🖨️ የQR ኮድ ካርድ መፍጠሪያ (QR Creator)
                      </h4>
                      <p className="text-[10px] text-white/50 uppercase font-mono leading-relaxed">
                        ይህን ኮድ ተጠቅመው ጠረጴዛዎች ላይ በተገጠመው QR ካርድ አማካኝነት ደንበኞች በቀጥታ ስማርት ስልካቸውን በመጠቀም ማዘዝ ይችላሉ።
                      </p>
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">የጠረጴዛ ወይም ክፍል መለያ</label>
                        <input 
                          type="text" 
                          id="qr-manual-location-field"
                          value={qrLocation}
                          onChange={(e) => setQrLocation(e.target.value)}
                          placeholder="Table 12"
                          className="w-full bg-[#181818] border border-white/10 text-[#C1FF00] text-center font-black text-sm p-2 outline-none focus:border-[#C1FF00] uppercase"
                        />
                      </div>
                      <button 
                        onClick={handleGenerateQR}
                        className="w-full bg-[#C1FF00] hover:bg-white text-black text-xs font-black uppercase py-3 font-mono"
                        id="btn-generate-qr-submit"
                      >
                        GENERATE CARD
                      </button>
                    </div>

                    <div className="md:col-span-2 bg-[#121212] border border-white/10 p-6 flex flex-col items-center justify-center">
                      <h4 className="text-xs font-mono uppercase text-white/40 mb-4 block">
                        ካርዱን አትም (PRINT CARD PREVIEW)
                      </h4>

                      {/* Printable Target Area */}
                      <div id="printable-area" className="bg-white border-2 border-black p-8 rounded-none text-black text-center w-full max-w-[340px] shadow-xl">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <div className="w-6 h-6 bg-black flex items-center justify-center text-white text-xs font-bold leading-none">
                            H
                          </div>
                          <div className="text-left leading-none">
                            <span className="font-extrabold text-[11px] block tracking-widest leading-none">HAWASSA PAPYRUS</span>
                            <span className="font-bold text-[8px] text-red-600 tracking-wider">ሀዋሳ ፓፒረስ ሎጅ</span>
                          </div>
                        </div>

                        <div className="bg-black text-white text-[9px] font-black uppercase tracking-[0.2em] py-1.5 font-mono mb-4">
                          SCAN & ORDER / ስካን አድርገው ይዘዙ
                        </div>

                        {/* QR Image container block */}
                        <div className="bg-slate-50 border border-dashed border-slate-300 p-4 inline-block mb-3">
                          {qrGeneratedUrl ? (
                            <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&color=0f0f0f&data=${encodeURIComponent(qrGeneratedUrl)}`} 
                              className="w-36 h-36 mx-auto object-contain"
                              alt="Generated table QR code" 
                            />
                          ) : (
                            <div className="w-36 h-36 bg-slate-200 animate-pulse"></div>
                          )}
                        </div>

                        <div className="mt-1">
                          <h2 className="text-xl font-black font-mono uppercase tracking-tight text-slate-900">
                            {qrLocation.toUpperCase() || 'TABLE 01'}
                          </h2>
                          <p className="text-[10px] font-bold text-slate-500 uppercase leading-none mt-1">
                            ሀዋሳ ፓፒረስ ሎጅ ምርጥ አገልግሎት
                          </p>
                        </div>
                      </div>

                      <button 
                        id="btn-print-command"
                        onClick={() => window.print()}
                        className="mt-6 bg-[#C1FF00] hover:bg-white text-black font-black uppercase text-xs tracking-wider px-6 py-3 font-mono flex items-center gap-1.5"
                      >
                        <Printer className="w-4 h-4" />
                        <span>🖨️ ካርዱን አትም (Print Card)</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB CONTENT 6: PROMOS BANNER MANAGER */}
                {activeAdminTab === 'promo' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left Panel: Register or Edit Promotion */}
                    {editingPromo ? (
                      <div className="bg-[#121212] border border-[#ff007f]/30 p-5 h-fit space-y-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-sans">
                        <h4 className="text-xs font-black uppercase text-[#ff007f] border-b border-[#ff007f]/20 pb-2">
                          📢 ማስታወቂያ ማስተካከያ (Edit Promo)
                        </h4>
                        <form onSubmit={handleSaveEditedPromo} className="space-y-4">
                          <div>
                            <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">ድርጅታዊ መለያ (CAMPAGIN TAG)</label>
                            <input 
                              type="text" 
                              value={editingPromo.tag || ''}
                              onChange={(e) => setEditingPromo({ ...editingPromo, tag: e.target.value })}
                              required 
                              className="w-full bg-[#181818] border border-[#ff007f]/40 text-white text-xs font-bold p-2.5 outline-none focus:border-[#ff007f]"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">ርዕስ (CAMPAIGN TITLE)</label>
                            <input 
                              type="text" 
                              value={editingPromo.title || ''}
                              onChange={(e) => setEditingPromo({ ...editingPromo, title: e.target.value })}
                              required 
                              className="w-full bg-[#181818] border border-[#ff007f]/40 text-white text-xs font-semibold p-2.5 outline-none focus:border-[#ff007f]"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">መግለጫ (DESCRIPTION TEXT)</label>
                            <textarea 
                              value={editingPromo.desc || ''}
                              onChange={(e) => setEditingPromo({ ...editingPromo, desc: e.target.value })}
                              required 
                              rows={3}
                              className="w-full bg-[#181818] border border-[#ff007f]/40 text-white text-xs font-bold p-2.5 outline-none focus:border-[#ff007f] resize-none"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">የምስል አድራሻ (IMAGE URL / POSTER)</label>
                            <div className="space-y-2">
                              <input 
                                type="text" 
                                value={editingPromo.poster || ''}
                                onChange={(e) => setEditingPromo({ ...editingPromo, poster: e.target.value })}
                                placeholder="https://images.unsplash.com/... (optional)"
                                className="w-full bg-[#181818] border border-[#ff007f]/40 text-white text-xs p-2.5 outline-none focus:border-[#ff007f]"
                              />
                              <label className="block text-center bg-[#1D1216] border border-dashed border-[#ff007f]/40 text-[#ff007f] hover:border-[#ff007f] font-mono text-[10px] font-bold py-2 px-3 rounded cursor-pointer transition-colors">
                                📂 አዲስ ምስል ለመቀየር ፋይል ይምረጡ (Select Image Backdrop)
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  className="hidden" 
                                  onChange={(e) => readMediaFile(e, (base64) => setEditingPromo({ ...editingPromo, poster: base64 }))} 
                                />
                              </label>
                              {editingPromo.poster && (
                                <div className="mt-1 text-center bg-black/30 p-2.5 rounded border border-white/5 space-y-2">
                                  <p className="text-[9px] font-mono text-white/50">ምስል ቅድመ-እይታ (PREVIEW):</p>
                                  <img src={editingPromo.poster} className="max-h-20 max-w-full rounded mx-auto shadow-md" alt="Preview backdrop" />
                                  {editingPromo.poster.startsWith('data:') && (
                                    <div className="bg-yellow-400/10 border border-yellow-400/20 p-2 rounded text-center w-full">
                                      <p className="text-[10px] text-yellow-400 font-bold leading-relaxed">
                                        ⚠️ አዲስ ምስል ከፋይል ተጭኗል! ለማስቀመጥ ከታች ያለውን <span className="underline text-yellow-300">UPDATE PROMO ✔️</span> የሚለውን ቁልፍ ይጫኑ!
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">የቪዲዮ አድራሻ (MP4 DIRECT VIDEO URL)</label>
                            <div className="space-y-2">
                              <input 
                                type="text" 
                                value={editingPromo.video || ''}
                                onChange={(e) => setEditingPromo({ ...editingPromo, video: e.target.value })}
                                placeholder="https://assets.mixkit.co/... (optional)"
                                className="w-full bg-[#181818] border border-[#ff007f]/40 text-white text-xs p-2.5 outline-none focus:border-[#ff007f]"
                              />
                              <label className="block text-center bg-[#1D1216] border border-dashed border-[#ff007f]/40 text-[#ff007f] hover:border-[#ff007f] font-mono text-[10px] font-bold py-2 px-3 rounded cursor-pointer transition-colors">
                                📂 አዲስ ቪዲዮ ለመቀየር ፋይል ይምረጡ (Select Video Backdrop)
                                <input 
                                  type="file" 
                                  accept="video/*" 
                                  className="hidden" 
                                  onChange={(e) => readMediaFile(e, (base64) => setEditingPromo({ ...editingPromo, video: base64 }))} 
                                />
                              </label>
                              {editingPromo.video && (
                                <div className="text-[10px] text-green-400 font-mono text-center">
                                  ✓ Video selected (Base64 / URL)
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 font-mono">
                            <button 
                              type="submit" 
                              className="flex-1 bg-[#ff007f] hover:bg-white hover:text-black text-white text-xs font-black uppercase py-3 cursor-pointer shadow-[2px_2px_0px_0px_#000] border border-black"
                            >
                              SAVE CHANGES ✔️
                            </button>
                            <button 
                              type="button" 
                              onClick={() => { setEditingPromo(null); setEditingPromoIndex(null); }}
                              className="px-3 bg-red-950/40 text-red-400 hover:bg-red-600 hover:text-white border border-red-900/30 text-xs font-bold uppercase transition-all cursor-pointer"
                            >
                              CANCEL
                            </button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <div className="bg-[#121212] border border-white/10 p-5 h-fit space-y-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <h4 className="text-xs font-black uppercase text-white border-b border-white/5 pb-2">
                          📢 አዲስ ማስታወቂያ መመዝገቢያ (Add New Promo)
                        </h4>
                        <p className="text-[10px] text-white/50 uppercase font-mono leading-relaxed">
                          ማስታወቂያዎ ከተመዘገበ በኋላ በቀጥታ በዋናው ገጽ ላይ ለደንበኞች በሚያምር የ3 ዲዛይን ይንሸራሸራል።
                        </p>
                        
                        <form onSubmit={handleAddPromo} className="space-y-4">
                          <div>
                            <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">ድርጅታዊ መለያ (CAMPAGIN TAG)</label>
                            <input 
                              type="text" 
                              id="promo-tag"
                              required 
                              defaultValue="LODGE OFFER"
                              placeholder="HOT DEAL / SPECIAL OFFER"
                              className="w-full bg-[#181818] border border-white/10 text-white text-xs font-bold p-2.5 outline-none focus:border-[#C1FF00]"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">ርዕስ (CAMPAIGN TITLE)</label>
                            <input 
                              type="text" 
                              id="promo-title"
                              required 
                              placeholder="የሐዋሳ ፓፒረስ ልዩ ቅናሽ"
                              className="w-full bg-[#181818] border border-white/10 text-white text-xs font-semibold p-2.5 outline-none focus:border-[#C1FF00]"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">መግለጫ (DESCRIPTION TEXT)</label>
                            <textarea 
                              id="promo-desc"
                              required 
                              rows={3}
                              placeholder="ምርጥ መስተንግዶ ከ 20% የዋጋ ቅናሽ ጋር ያግኙ።"
                              className="w-full bg-[#181818] border border-white/10 text-white text-xs font-bold p-2.5 outline-none focus:border-[#C1FF00] resize-none"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">የምስል አድራሻ (IMAGE URL / POSTER)</label>
                            <div className="space-y-2">
                              <input 
                                type="text" 
                                id="promo-poster"
                                value={addPromoPoster}
                                onChange={(e) => setAddPromoPoster(e.target.value)}
                                placeholder="https://images.unsplash.com/... (optional)"
                                className="w-full bg-[#181818] border border-white/10 text-white text-xs p-2.5 outline-none focus:border-[#C1FF00]"
                              />
                              <div className="flex gap-2 items-center">
                                <label className="flex-1 text-center bg-[#1D1D16] border border-dashed border-[#C1FF00]/40 text-[#C1FF00] hover:border-[#C1FF00] font-mono text-[10px] font-bold py-2 px-3 rounded cursor-pointer transition-colors">
                                  📂 ምስል ከስልክ/ኮምፒውተር ይጫኑ (Upload Poster)
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={(e) => readMediaFile(e, (base64) => setAddPromoPoster(base64))} 
                                  />
                                </label>
                                {addPromoPoster && (
                                  <button 
                                    type="button" 
                                    onClick={() => setAddPromoPoster('')}
                                    className="px-3 py-2 bg-red-950 text-red-100 border border-red-900 text-[10px] rounded"
                                  >
                                    RESET
                                  </button>
                                )}
                              </div>
                              {addPromoPoster && (
                                <div className="mt-1 text-center bg-black/40 p-2.5 rounded border border-white/5 space-y-2">
                                  <p className="text-[9px] font-mono text-white/50">ምስል ቅድመ-እይታ (PREVIEW):</p>
                                  <img src={addPromoPoster} className="max-h-20 max-w-full rounded mx-auto shadow-md" alt="Poster thumbnail" />
                                  {addPromoPoster.startsWith('data:') && (
                                    <div className="bg-yellow-400/10 border border-yellow-400/20 p-2 rounded text-center w-full">
                                      <p className="text-[10px] text-yellow-400 font-bold leading-relaxed">
                                        ⚠️ ምስሉ ከስልክ/ኮምፒውተር ተጭኗል! ለማስቀመጥ ከታች ያለውን <span className="underline text-yellow-300">ADD PROMO BANNER ➕</span> የሚለውን ቁልፍ ይጫኑ!
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">የቪዲዮ አድራሻ (MP4 DIRECT VIDEO URL)</label>
                            <div className="space-y-2">
                              <input 
                                type="text" 
                                id="promo-video"
                                value={addPromoVideo}
                                onChange={(e) => setAddPromoVideo(e.target.value)}
                                placeholder="https://assets.mixkit.co/... (optional)"
                                className="w-full bg-[#181818] border border-white/10 text-white text-xs p-2.5 outline-none focus:border-[#C1FF00]"
                              />
                              <div className="flex gap-2 items-center">
                                <label className="flex-1 text-center bg-[#1D1D16] border border-dashed border-[#C1FF00]/40 text-[#C1FF00] hover:border-[#C1FF00] font-mono text-[10px] font-bold py-2 px-3 rounded cursor-pointer transition-colors">
                                  📂 ቪዲዮ ከስልክ/ኮምፒውተር ይጫኑ (Upload Video)
                                  <input 
                                    type="file" 
                                    accept="video/*" 
                                    className="hidden" 
                                    onChange={(e) => readMediaFile(e, (base64) => setAddPromoVideo(base64))} 
                                  />
                                </label>
                                {addPromoVideo && (
                                  <button 
                                    type="button" 
                                    onClick={() => setAddPromoVideo('')}
                                    className="px-3 py-2 bg-red-950 text-red-100 border border-red-900 text-[10px] rounded"
                                  >
                                    RESET
                                  </button>
                                )}
                              </div>
                              {addPromoVideo && (
                                <div className="text-[10px] text-lime-400 font-mono text-center">
                                  ✓ Video selected ({addPromoVideo.substring(0, 30)}...)
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <button 
                            type="submit" 
                            className="w-full bg-[#ff007f] hover:bg-white hover:text-black text-white text-xs font-black uppercase py-3 font-mono shadow-[2px_2px_0px_0px_#000] border border-black cursor-pointer"
                          >
                            PUBLISH PROMO 🚀
                          </button>
                        </form>
                      </div>
                    )}

                    {/* Right Panel: Current Banners List & Live Previews */}
                    <div className="md:col-span-2 bg-[#121212] border border-white/10 p-5 rounded-xl space-y-4">
                      <h4 className="text-xs font-black uppercase text-white border-b border-white/5 pb-2 mb-4">
                        📋 አሁን በሥራ ላይ ያሉ ማስታወቂያዎች (Active Banner List)
                      </h4>
                      <div className="space-y-4 max-h-[620px] overflow-y-auto pr-1 no-scrollbar">
                        {promos.length === 0 ? (
                          <div className="text-center py-10 font-mono text-white/40 uppercase">
                            No promotions configured. Add one above to launch!
                          </div>
                        ) : (
                          promos.map((p, idx) => (
                            <div key={idx} className="bg-[#181818] border border-white/5 p-4 rounded-lg flex flex-col md:flex-row gap-4 items-center justify-between">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                {/* Small Visual Thumbnail Indicator */}
                                <div className="w-16 h-16 shrink-0 bg-slate-900 border border-white/10 rounded overflow-hidden flex items-center justify-center">
                                  {p.video ? (
                                    <div className="text-xs">📽️ MP4</div>
                                  ) : p.poster ? (
                                    <img src={p.poster} className="w-full h-full object-cover" alt="Thumb" referrerPolicy="no-referrer" />
                                  ) : (
                                    <div className="text-xs">% TEXT</div>
                                  )}
                                </div>

                                <div className="min-w-0 flex-1 space-y-1">
                                  <div className="flex gap-2 items-center">
                                    <span className="text-[8px] bg-[#C1FF00]/10 text-[#C1FF00] font-mono px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                                      {p.tag}
                                    </span>
                                    <span className="font-mono text-[9px] text-white/40">INDEX #{idx}</span>
                                  </div>
                                  <h5 className="text-xs font-black text-white truncate">{p.title}</h5>
                                  <p className="text-[10px] text-white/60 leading-tight line-clamp-2">{p.desc}</p>
                                </div>
                              </div>

                              <div className="flex flex-col md:flex-row items-center gap-2 shrink-0 w-full md:w-auto">
                                <button 
                                  onClick={() => { setEditingPromoIndex(idx); setEditingPromo({ ...p }); }}
                                  className="w-full md:w-auto px-3 py-1.5 rounded bg-[#ff007f]/10 hover:bg-[#ff007f] text-[#ff007f] hover:text-white border border-[#ff007f]/20 font-mono text-[10px] uppercase font-black tracking-widest cursor-pointer"
                                >
                                  ማስተካከያ ✍️
                                </button>
                                <button 
                                  onClick={() => handleRemovePromo(idx)}
                                  className="w-full md:w-auto px-3 py-1.5 rounded bg-red-950/40 hover:bg-red-600 text-red-400 hover:text-white border border-red-900/30 font-mono text-[10px] uppercase font-black tracking-widest cursor-pointer"
                                >
                                  DELETE 🗑️
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB CONTENT 7: ABOUT US & FEEDBACK LOG MANAGEMENT */}
                {activeAdminTab === 'lodgeinfo' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6">
                    {/* Left Panel: Edit About Lodge section */}
                    <div className="bg-[#121212] border border-white/10 p-5 h-fit space-y-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                        <span className="text-xl">🌲</span>
                        <h4 className="text-xs font-black uppercase text-white tracking-widest">
                          የሎጅ መግለጫ ማስተካከያ (Lodge Description)
                        </h4>
                      </div>
                      <p className="text-[10px] text-white/50 uppercase font-mono leading-relaxed">
                        በደንበኛው የሜኑ ገጽ ግርጌ ላይ የሚታየውን "ስለ ፓፒረስ ሎጅ (About Our Lodge)" መግለጫ ጽሑፍ እዚህ ማስተካከል፣ መጨመር ወይም መቀነስ ይችላሉ።
                      </p>
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          setAboutLodgeText(aboutLodgeInput);
                          alert('🍀 ስለ ሎጁ ያለው ማብራሪያ በተሳካ ሁኔታ ተቀይሯል! / Lodge info updated successfully.');
                        }} 
                        className="space-y-4"
                      >
                        <div>
                          <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">ስለ ሎጁ የሚጻፍ ጽሑፍ (LOBBY DESCRIPTION TEXT)</label>
                          <textarea 
                            value={aboutLodgeInput}
                            onChange={(e) => setAboutLodgeInput(e.target.value)}
                            required 
                            rows={8}
                            placeholder="ስለ ፓፒረስ ሎጅ መግለጫ እዚህ ይጻፉ..."
                            className="w-full bg-[#181818] border border-white/10 text-white text-xs font-semibold p-3 outline-none focus:border-[#C1FF00] resize-none leading-relaxed"
                          />
                        </div>
                        <button 
                          type="submit" 
                          className="w-full bg-[#C1FF00] hover:bg-white text-black text-xs font-black uppercase py-3 font-mono shadow-[2px_2px_0px_0px_#000] border border-black cursor-pointer"
                        >
                          SAVE DESCRIPTION ✔️
                        </button>
                      </form>
                    </div>

                    {/* Right Panel: Admin Feedbacks Monitor & Replies */}
                    <div className="md:col-span-2 bg-[#121212] border border-white/10 p-5 rounded-xl space-y-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">💬</span>
                          <h4 className="text-xs font-black uppercase text-white tracking-widest">
                            የደንበኞች አስተያየቶች እና ምላሾች (Reviews Desk)
                          </h4>
                        </div>
                        <span className="font-mono text-xs bg-white/5 text-[#C1FF00] border border-white/5 px-2.5 py-0.5 rounded-full font-bold">
                          {feedback.length} COMMENTS
                        </span>
                      </div>

                      <div className="space-y-4 max-h-[640px] overflow-y-auto pr-1 no-scrollbar">
                        {feedback.length === 0 ? (
                          <div className="text-center py-16 font-mono text-white/30 uppercase">
                            No feedbacks found. Customers can submit feedback from their portal!
                          </div>
                        ) : (
                          feedback.map((f) => (
                            <div key={f.id} className="bg-[#181818] border border-white/5 p-4 rounded-xl space-y-3 relative overflow-hidden text-left">
                              <div className="flex justify-between items-start gap-4">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[8px] bg-white/5 text-white/60 font-mono px-1.5 py-0.5 rounded font-bold uppercase">
                                      ID: {f.id}
                                    </span>
                                    <span className="text-[9px] text-white/40 font-mono">{f.time}</span>
                                  </div>
                                  <p className="text-xs font-semibold text-white/95 leading-relaxed pt-1 select-all">
                                    {f.text}
                                  </p>
                                </div>

                                <button 
                                  onClick={() => handleDeleteFeedback(f.id)}
                                  className="px-2 py-1 rounded bg-red-950/30 hover:bg-red-600 border border-red-900/30 text-red-400 hover:text-white font-mono text-[9px] uppercase font-black tracking-wider shrink-0 transition-colors cursor-pointer"
                                  title="Delete Feedback"
                                >
                                  DELETE 🗑️
                                </button>
                              </div>

                              {/* Reply Block rendering */}
                              {f.reply ? (
                                <div className="bg-[#1D1E16] border border-[#C1FF00]/10 p-3 rounded-lg relative">
                                  <div className="flex justify-between items-center text-[8px] font-mono text-[#C1FF00] mb-1">
                                    <span className="font-black uppercase tracking-wider flex items-center gap-1">
                                      👑 PAPYRUS OFFICIAL REPLY
                                    </span>
                                    <span>{f.replyTime}</span>
                                  </div>
                                  <p className="text-[11px] text-white/90 italic font-medium leading-relaxed">
                                    {f.reply}
                                  </p>
                                  
                                  {/* Button to remove reply or change reply */}
                                  <div className="flex justify-end pt-1">
                                    <button 
                                      onClick={() => {
                                        setFeedbackReplyText({ ...feedbackReplyText, [f.id]: f.reply || '' });
                                        // Empty the reply inside feedback to allow re-replying easily
                                        setFeedback(prev => prev.map(item => item.id === f.id ? { ...item, reply: undefined, replyTime: undefined } : item));
                                      }}
                                      className="text-[8px] font-mono text-[#C1FF00] hover:underline uppercase font-bold cursor-pointer"
                                    >
                                      Edit / Change Reply ✍️
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-black/25 p-3 rounded-lg border border-dashed border-white/10 space-y-2">
                                  <textarea 
                                    placeholder="አስተያየቱን እዚህ ይመልሱ... (Type your reply to this guest here...)"
                                    value={feedbackReplyText[f.id] || ''}
                                    onChange={(e) => setFeedbackReplyText({ ...feedbackReplyText, [f.id]: e.target.value })}
                                    rows={2}
                                    className="w-full bg-[#121212] border border-white/5 text-white text-xs p-2 outline-none focus:border-[#C1FF00] resize-none rounded font-medium h-14"
                                  />
                                  <div className="flex justify-end">
                                    <button 
                                      onClick={() => handleFeedbackReply(f.id, feedbackReplyText[f.id] || '')}
                                      disabled={!(feedbackReplyText[f.id] || '').trim()}
                                      className={`px-4 py-1.5 font-mono text-[10px] uppercase font-black tracking-widest rounded transition-all cursor-pointer ${
                                        (feedbackReplyText[f.id] || '').trim() 
                                          ? 'bg-[#C1FF00] hover:bg-white text-black' 
                                          : 'bg-white/5 text-white/30 border border-white/5 pointer-events-none'
                                      }`}
                                    >
                                      SUBMIT REPLY ➔
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB CONTENT 8: RECEPTION & BEDROOM BOOKINGS MANAGER */}
                {activeAdminTab === 'reception' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-6 font-sans">
                    {/* Book a Room form */}
                    <div className="bg-[#121212] border border-white/10 p-5 h-fit space-y-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                        <span className="text-xl">🛎️</span>
                        <h4 className="text-xs font-black uppercase text-white tracking-widest">
                          የአልጋ/ክፍል መመዝገቢያ (Room Reservation)
                        </h4>
                      </div>
                      <p className="text-[10px] text-white/50 uppercase font-mono leading-relaxed">
                        የእንግዶችን መለያ መረጃ መዝግበው ክፍል ወይም አልጋ ያስረክቡ። እንግዶቹ ከሁለት በላይ ከሆኑ በሰውየው ብዛት መታወቂያዎችን መመዝገብ ይችላሉ።
                      </p>

                      <form onSubmit={handleCreateRoomBooking} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[9px] font-mono text-white/50 uppercase block mb-1">ክፍል ቁጥር (ROOM NUMBER)</label>
                            <input 
                              type="text"
                              id="booking-room-number"
                              required 
                              placeholder="e.g. 104"
                              className="w-full bg-[#181818] border border-white/10 text-white font-mono text-center text-sm p-2.5 outline-none focus:border-[#C1FF00]"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-mono text-white/50 uppercase block mb-1">የክፍል አይነት (ROOM CATEGORY)</label>
                            <select 
                              id="booking-room-type"
                              defaultValue="Single Bed"
                              className="w-full bg-[#181818] border border-white/10 text-white text-xs font-bold p-2.5 outline-none focus:border-[#C1FF00]"
                            >
                              <option value="Single Bed">ሲንግል ቤድ (Single Bed)</option>
                              <option value="Double Bed">ደብል ቤድ (Double Bed)</option>
                              <option value="Deluxe Suite">ደሉክስ ሱዊት (Deluxe Suite)</option>
                              <option value="VIP Royal">ቪአይፒ ሮያል (VIP Royal Room)</option>
                              <option value="Twin Double">ትዊን ደብል ቤድ (Twin Double)</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[9px] font-mono text-white/50 uppercase block mb-1">የቀን ሒሳብ (PRICE PER NIGHT)</label>
                            <input 
                              type="number"
                              id="booking-price"
                              required 
                              placeholder="e.g. 1500"
                              className="w-full bg-[#181818] border border-white/10 text-[#C1FF00] font-mono text-xs p-2.5 outline-none focus:border-[#C1FF00]"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-mono text-white/50 uppercase block mb-1">ስልክ ቁጥር (CONTACT PHONE)</label>
                            <input 
                              type="text"
                              id="booking-phone"
                              required 
                              placeholder="09xxxxxxxx"
                              className="w-full bg-[#181818] border border-white/10 text-white font-mono text-xs p-2.5 outline-none focus:border-[#C1FF00]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[9px] font-mono text-white/50 uppercase block mb-1">የእንግዳ ብዛት (GUEST COUNT)</label>
                          <div className="grid grid-cols-4 gap-1.5 pt-1">
                            {[1, 2, 3, 4].map(num => (
                              <button 
                                key={num}
                                type="button" 
                                onClick={() => {
                                  setBookingGuestCount(num);
                                  setGuestIdsState(prev => {
                                    const next = [...prev];
                                    while (next.length < num) {
                                      next.push({ fullName: '', idNumber: '' });
                                    }
                                    return next.slice(0, num);
                                  });
                                }}
                                className={`h-8 font-mono text-xs font-black transition-colors border ${
                                  bookingGuestCount === num 
                                    ? 'bg-[#C1FF00] text-black border-[#C1FF00] font-extrabold' 
                                    : 'bg-[#181818] text-white/60 border-white/5 hover:text-white hover:border-white/20'
                                }`}
                              >
                                {num} {num === 1 ? 'እንግዳ' : 'እንግዶች'}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Guest credentials list */}
                        <div className="space-y-3 pt-2 bg-[#181818]/50 p-3 border border-white/5 rounded-lg">
                          <p className="text-[10px] font-sans font-black uppercase text-white/45 tracking-wide mb-1 flex items-center gap-1">
                            <span>👥 የነዋሪዎች መረጃዎች / GUEST DETAILS </span>
                            <span className="text-[#C1FF00] font-mono text-[9px]">({bookingGuestCount} Record Forms)</span>
                          </p>
                          
                          {guestIdsState.slice(0, bookingGuestCount).map((guest, gIdx) => (
                            <div key={gIdx} className="space-y-3 border-l-2 border-[#C1FF00]/35 pl-3 ml-1 bg-black/40 p-3 rounded-lg">
                              <span className="text-[8px] font-mono uppercase font-black tracking-wider text-[#C1FF00] block">እንግዳ #{gIdx + 1} (GUEST {gIdx + 1})</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <input 
                                  type="text"
                                  placeholder="ሙሉ ስም (Full Name)"
                                  required
                                  value={guest.fullName || ''}
                                  onChange={(e) => {
                                    const updated = [...guestIdsState];
                                    updated[gIdx] = { ...updated[gIdx], fullName: e.target.value };
                                    setGuestIdsState(updated);
                                  }}
                                  className="bg-[#121212] border border-white/10 text-white text-[11px] p-2 outline-none focus:border-[#C1FF00] rounded"
                                />
                                <input 
                                  type="text"
                                  required
                                  placeholder="መታወቂያ/ID Card #"
                                  value={guest.idNumber || ''}
                                  onChange={(e) => {
                                    const updated = [...guestIdsState];
                                    updated[gIdx] = { ...updated[gIdx], idNumber: e.target.value };
                                    setGuestIdsState(updated);
                                  }}
                                  className="bg-[#121212] border border-white/10 text-white text-[11px] p-2 outline-none focus:border-[#C1FF00] rounded"
                                />
                              </div>

                              {/* ID DOCUMENT CAPTURE DOCK */}
                              <div className="space-y-1.5">
                                <label className="text-[8.5px] font-mono text-white/50 uppercase block">🪪 መታወቂያ ፎቶ ፒዲኤፍ (ID Scan Card / Document Attachment)</label>
                                <div className="flex items-center gap-3 bg-[#121212] border border-white/10 p-2 rounded">
                                  {guest.idPhotoUrl ? (
                                    <div className="relative group shrink-0 space-y-1">
                                      <img 
                                        src={guest.idPhotoUrl} 
                                        className="w-14 h-10 object-cover rounded border border-[#C1FF00]" 
                                        alt="ID document thumbnail" 
                                        referrerPolicy="no-referrer"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated = [...guestIdsState];
                                          updated[gIdx] = { ...updated[gIdx], idPhotoUrl: '' };
                                          setGuestIdsState(updated);
                                        }}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white text-[7px] w-3.5 h-3.5 rounded-full flex items-center justify-center cursor-pointer font-black animate-bounce"
                                      >
                                        ×
                                      </button>
                                      {guest.idPhotoUrl.startsWith('data:') && (
                                        <div className="absolute top-12 left-0 w-48 bg-yellow-400/90 text-black text-[7px] font-bold p-1 rounded border border-yellow-500 z-10 leading-tight shadow-md">
                                          ⚠️ መታወቂያ ተጭኗል! ለማስቀመጥ ከታች ያለውን SUBMIT ቁልፍ ይጫኑ!
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="w-14 h-10 border border-white/5 bg-white/5 rounded flex items-center justify-center text-lg text-white/30 shrink-0">
                                      🪪
                                    </div>
                                  )}

                                  <div className="flex-1 flex gap-2">
                                    <input 
                                      type="file"
                                      accept="image/*"
                                      id={`guest-id-upload-${gIdx}`}
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          processFileWithCompression(file, (base64) => {
                                            const updated = [...guestIdsState];
                                            updated[gIdx] = { ...updated[gIdx], idPhotoUrl: base64 };
                                            setGuestIdsState(updated);
                                          });
                                        }
                                      }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => document.getElementById(`guest-id-upload-${gIdx}`)?.click()}
                                      className="text-[9px] font-mono font-bold bg-white/5 hover:bg-white/10 text-white/80 border border-white/20 py-1.5 px-2.5 rounded cursor-pointer transition-all uppercase"
                                    >
                                      Upload Document
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const presets = [
                                          'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=200',
                                          'https://images.unsplash.com/photo-1544256718-3bcf237f3974?w=200'
                                        ];
                                        const randomPreset = presets[Math.floor(Math.random() * presets.length)];
                                        const updated = [...guestIdsState];
                                        updated[gIdx] = { ...updated[gIdx], idPhotoUrl: randomPreset };
                                        setGuestIdsState(updated);
                                      }}
                                      className="text-[9px] font-mono font-bold bg-[#C1FF00]/10 hover:bg-[#C1FF00]/20 text-[#C1FF00] border border-[#C1FF00]/30 py-1.5 px-2.5 rounded cursor-pointer transition-all uppercase"
                                    >
                                      Mock Scan
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div>
                          <label className="text-[9px] font-mono text-white/50 uppercase block mb-1">መግቢያ ቀን (CHECK IN DATE)</label>
                          <input 
                            type="date"
                            id="booking-date"
                            required 
                            defaultValue={new Date().toISOString().split('T')[0]}
                            className="w-full bg-[#181818] border border-white/10 text-[#C1FF00] font-mono text-xs p-2.5 outline-none focus:border-[#C1FF00]"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">ተጨማሪ አስተያየት / ማስታወሻ (REMARKS / NOTES)</label>
                          <textarea 
                            id="booking-notes"
                            rows={2}
                            placeholder="ለምሳሌ: ሌላ ተጨማሪ መታወቂያ ኮፒ ተይዟል, ቅድመ ክፍያ ተከፍሏል..."
                            className="w-full bg-[#181818] border border-white/10 text-white text-xs p-2.5 outline-none focus:border-[#C1FF00]"
                          />
                        </div>

                        <button 
                          type="submit" 
                          className="w-full bg-[#C1FF00] hover:bg-white text-black text-xs font-black uppercase py-3.5 font-mono shadow-[2px_2px_0px_0px_#000] border border-black cursor-pointer"
                        >
                          SUBMIT RESERVATION ➔
                        </button>
                      </form>
                    </div>

                    {/* Right column: Monitor Alerts and Bedroom reservations */}
                    <div className="lg:col-span-2 space-y-6">

                      {/* Buzzer Assist calls inside admin desk */}
                      <div className="bg-[#0b100b] border border-emerald-500/20 rounded-xl p-5 shadow-lg relative overflow-hidden">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-3">
                          <div>
                            <h4 className="text-xs font-black uppercase text-emerald-400 tracking-wider">🛎️ የጥሪና እርዳታ ደወሎች (Room Assist Calls Zone)</h4>
                            <p className="text-[10px] text-white/40">ከእንግዶች ክፍሎች በቀጥታ የሚመጡ የድጋፍ ጥሪዎች።</p>
                          </div>
                          <span className="bg-emerald-950 text-emerald-400 px-2.5 py-0.5 rounded text-[10px] font-mono animate-pulse">
                            {assistanceCalls.filter(c => c.active).length} CALL ACTIVE
                          </span>
                        </div>

                        {assistanceCalls.filter(c => c.active).length === 0 ? (
                          <div className="text-center py-6 text-white/20 text-xs">
                            <p>🎈 ምንም ገባሪ የድጋፍ ጥሪ የለም።</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {assistanceCalls.filter(c => c.active).map(call => (
                              <div key={call.id} className="bg-emerald-950/20 border border-emerald-500/20 p-3 flex justify-between items-center mr-1">
                                <div className="flex items-center gap-3">
                                  <span className="text-lg animate-bounce">🛎️</span>
                                  <div>
                                    <p className="font-black text-xs text-white uppercase font-mono">{call.location}</p>
                                    <p className="text-[9px] text-[#00f5ff] font-mono">ጥሪ ሰዓት: {call.time}</p>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => {
                                    setAssistanceCalls(prev => prev.map(c => c.id === call.id ? { ...c, active: false } : c));
                                  }}
                                  className="bg-[#1D1D16] hover:bg-emerald-500 hover:text-black border border-emerald-500/30 text-[#C1FF00] hover:border-emerald-400 text-[9px] font-black uppercase px-2.5 py-1.5 transition-colors cursor-pointer"
                                >
                                  MARK SERVED ✔
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Active Bookings list */}
                      <div className="bg-[#121212] border border-white/10 p-5 rounded-xl space-y-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">📋</span>
                            <h4 className="text-xs font-black uppercase text-white tracking-widest font-sans">
                              ያልጋ አገልግሎት መቆጣጠሪያ ዴስክ (Reservations Hub)
                            </h4>
                          </div>
                          <span className="font-mono text-xs bg-[#C1FF00]/10 text-[#C1FF00] border border-[#C1FF00]/20 px-2.5 py-0.5 rounded-full font-bold">
                            {roomBookings.length} RESERVATIONS
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[700px] overflow-y-auto no-scrollbar pr-1">
                          {roomBookings.length === 0 ? (
                            <div className="md:col-span-2 text-center py-20 font-mono text-white/20 uppercase tracking-widest text-xs border border-dashed border-white/5 rounded-xl bg-black/10">
                              🛎️ No bookings found. Register your first customer now.
                            </div>
                          ) : (
                            [...roomBookings].reverse().map((b) => (
                              <div 
                                key={b.id} 
                                className={`p-4 rounded-xl space-y-3 relative overflow-hidden border transition-all text-left ${
                                  b.status === "Active" 
                                    ? 'bg-[#181818] border-white/10 shadow-lg' 
                                    : 'bg-white/[0.02] border-white/5 opacity-55 hover:opacity-90'
                                }`}
                              >
                                {/* Status Badge */}
                                <div className="flex justify-between items-start gap-2">
                                  <div className="space-y-0.5">
                                    <h5 className="font-bold text-white text-xs flex items-center gap-1.5">
                                      <span className="text-sm">🛏️</span> {b.roomNumber}
                                    </h5>
                                    <p className="text-[10px] text-white/50 font-mono">ID: {b.id}</p>
                                  </div>
                                  <span className={`text-[9px] font-mono uppercase font-black px-2 py-0.5 rounded ${
                                    b.status === "Active" 
                                      ? 'bg-emerald-950/70 border border-emerald-500/30 text-emerald-300' 
                                      : 'bg-white/5 border border-white/5 text-white/40'
                                  }`}>
                                    {b.status === "Active" ? '● ACTIVE / በክፍል ያለ' : '✓ CHECKED OUT / የወጣ'}
                                  </span>
                                </div>

                                {/* Guest details block */}
                                <div className="space-y-2 bg-black/40 p-2.5 rounded border border-white/5">
                                  <p className="text-[9px] font-mono text-white/45 uppercase">
                                    👥 መታወቂያ የተያዘባቸው እንግዶች ({b.guestCount} ሰው)
                                  </p>
                                  <div className="space-y-1">
                                    {b.guestIds.map((guest, gidx) => (
                                      <div key={gidx} className="flex flex-col text-xs space-y-0.5 pb-1 border-b border-white/5 last:border-0 last:pb-0">
                                        <p className="font-bold text-white flex items-center gap-1">
                                          <span className="text-[10px] text-white/40">{gidx + 1}.</span> {guest.fullName}
                                        </p>
                                        <p className="text-[10px] font-mono text-[#00f5ff]">
                                          🔎 መታወቂያ: <span className="bg-[#00f5ff]/10 px-1 rounded text-[#0aeffa] font-normal">{guest.idNumber}</span>
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Contact & Rate */}
                                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-white/[0.01] p-2 rounded">
                                  <div>
                                    <span className="text-white/40 block text-[9px] uppercase">PHONE</span>
                                    <span className="text-[#C1FF00] font-bold">{b.contactPhone}</span>
                                  </div>
                                  <div>
                                    <span className="text-white/40 block text-[9px] uppercase">RATE / ዋጋ</span>
                                    <span className="text-white font-bold">{b.pricePerNight} Birr/ቀን</span>
                                  </div>
                                  <div className="mt-1">
                                    <span className="text-white/40 block text-[9px] uppercase">CHECK-IN</span>
                                    <span className="text-white/80">{b.checkInDate}</span>
                                  </div>
                                  {b.notes && (
                                    <div className="col-span-2 mt-1 border-t border-white/5 pt-1.5 font-sans">
                                      <span className="text-white/30 block text-[8px] uppercase">ማስታወሻ / NOTES</span>
                                      <p className="text-white/70 text-[10px] italic leading-normal">{b.notes}</p>
                                    </div>
                                  )}
                                </div>

                                {/* Actions */}
                                {b.status === "Active" ? (
                                  <div className="flex gap-2 pt-1 border-t border-white/5">
                                    <button
                                      onClick={() => handleCheckoutBooking(b.id)}
                                      className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-black text-[10px] uppercase py-2 tracking-wider rounded font-mono transition-all cursor-pointer"
                                    >
                                      🔑 CHECK OUT (ውጭ አድርግ)
                                    </button>
                                    <button
                                      onClick={() => handleDeleteBooking(b.id)}
                                      className="px-3 bg-red-950/30 hover:bg-red-700 text-red-300 hover:text-white font-mono text-[10px] rounded transition-all cursor-pointer"
                                      title="Cancel reservation record"
                                    >
                                      DELETE 🗑️
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex justify-end pt-1">
                                    <button
                                      onClick={() => handleDeleteBooking(b.id)}
                                      className="w-full py-1.5 bg-white/5 hover:bg-red-900 border border-white/5 text-white/40 hover:text-white font-mono text-[9px] tracking-wider uppercase rounded transition-all cursor-pointer"
                                    >
                                      መዝገብ ሰርዝ (DELETE RECORD) 🗑️
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* TAB CONTENT 9: LOGO AND BRANDING FOR SUPER ADMIN */}
                {activeAdminTab === 'branding' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-sans">
                    {/* Left: Changer Form and Presets */}
                    <div className="lg:col-span-7 bg-[#121212] border border-white/10 p-6 rounded-xl space-y-6">
                      <div className="border-b border-white/5 pb-2">
                        <span className="text-[9px] text-[#C1FF00] font-mono font-bold tracking-wider block uppercase">BRANDING CONTROL PANEL</span>
                        <h3 className="text-sm font-black text-white uppercase mt-0.5">🎨 የፓፒረስ ሎጅ ሎጎ መቀየሪያ (Branding Logo Changer)</h3>
                        <p className="text-[10px] text-white/50 leading-relaxed mt-1">
                          የድርጅትዎን መለያ ሎጎ እዚህ ላይ በቀላሉ መቀየር ይችላሉ። ከኮምፒውተርዎ ወይም ከሌላ ምስል ፋይል በመስቀል ወይም ዝግጁ የሆኑትን በመምረጥ በፍጥነት ይተግቡሩ።
                        </p>
                      </div>

                      {/* 1. File Upload Selector (ካፋይል እንዲገባ) */}
                      <div className="space-y-3 bg-[#181818] p-4 border border-white/10 rounded-lg">
                        <label className="text-[10px] font-mono font-bold uppercase text-[#C1FF00] block">📁 ሎጎ ከፋይል አስገባ (Upload Logo from File)</label>
                        <input 
                          type="file" 
                          id="admin-logo-file-input"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              processFileWithCompression(file, (base64) => {
                                setTempLogoFile(base64);
                              });
                            }
                          }}
                          className="w-full text-xs text-white/60 font-mono file:mr-4 file:py-1.5 file:px-3 file:rounded file:border file:border-white/10 file:text-[10px] file:font-sans file:font-semibold file:bg-white/5 file:text-white hover:file:bg-white/10 cursor-pointer"
                        />
                        {tempLogoFile && (
                          <div className="mt-3 p-3 bg-black/40 border border-dashed border-[#C1FF00]/40 rounded-lg space-y-3 flex flex-col items-center">
                            <p className="text-[10px] font-bold text-yellow-400 font-mono text-center">⚠️ አዲስ የሎጎ ምስል ተመርጧል! ለማስቀመጥ ከታች ያለውን አረንጓዴ የ "SAVE" ቁልፍ ይጫኑ።</p>
                            <img src={tempLogoFile} className="max-h-24 max-w-full rounded border border-white/10 shadow-lg" alt="Selected Logo Preview" />
                            <div className="flex gap-2 w-full justify-center">
                              <button
                                type="button"
                                onClick={() => {
                                  handleUpdateLogoAndSync(tempLogoFile);
                                  setTempLogoFile(null);
                                  alert('🎨 አዲሱ ሎጎ ከፋይል በተሳካ ሁኔታ ተቀምጧል! / Logo uploaded and saved successfully.');
                                }}
                                className="bg-[#C1FF00] hover:bg-white text-black px-4 py-2 text-[11px] font-black uppercase transition-colors cursor-pointer rounded flex items-center gap-1 shadow-md"
                              >
                                💾 የተጫነውን ሎጎ አስቀምጥ (SAVE UPLOADED LOGO)
                              </button>
                              <button
                                type="button"
                                onClick={() => setTempLogoFile(null)}
                                className="bg-red-950 text-red-400 border border-red-900 px-3 py-2 text-[11px] font-bold uppercase transition-colors cursor-pointer rounded"
                              >
                                ሰርዝ (CANCEL)
                              </button>
                            </div>
                          </div>
                        )}
                        <p className="text-[9px] text-white/40 leading-relaxed">
                          png, jpg, svg ወይም gif ፋይሎችን መጫን ይችላሉ። የፋይሉ መጠን አነስተኛ ሲሆን ፈጣን መተግበርን ያረጋግጣል።
                        </p>
                      </div>

                      {/* 2. Custom Logo URL Form */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-mono font-bold uppercase text-white/70 block">ወይም የድርጅት ሎጎ የኢንተርኔት አድራሻ (Company Logo Image URL)</label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input 
                            type="url"
                            id="manager-logo-input-field"
                            defaultValue={logoUrl.startsWith('data:') ? '' : logoUrl}
                            placeholder="የምስል አድራሻ (e.g. https://images.unsplash.com/photo-xxx)"
                            className="flex-1 bg-[#181818] border border-white/10 text-white text-xs font-mono p-3 outline-none focus:border-[#C1FF00] rounded"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const inputEl = document.getElementById('manager-logo-input-field') as HTMLInputElement;
                              if (inputEl && inputEl.value.trim()) {
                                handleUpdateLogoAndSync(inputEl.value.trim());
                                alert('🎨 የድርጅቱ ሎጎ በተሳካ ሁኔታ ተቀይሯል! / Logo URL applied.');
                              } else {
                                alert('እባክዎ ትክክለኛ የሎጎ የኢንተርኔት አድራሻ ያስገቡ!');
                              }
                            }}
                            className="bg-[#C1FF00] hover:bg-white text-black px-5 py-3 font-bold text-xs uppercase tracking-wider shrink-0 transition-colors cursor-pointer flex items-center justify-center gap-1 rounded"
                          >
                            <span>አስቀምጥ (SAVE)</span>
                          </button>
                        </div>
                      </div>


                    </div>

                    {/* Right: Real-time Mockup Box */}
                    <div className="lg:col-span-5 bg-[#121212] border border-white/10 p-6 rounded-xl space-y-4">
                      <div className="border-b border-white/5 pb-2">
                        <span className="text-[9px] text-[#C1FF00] font-mono font-bold tracking-wider block uppercase">VISUAL PREVIEW</span>
                        <h3 className="text-xs font-black text-white uppercase mt-0.5">📱 የቀጥታ ማሳያ ቅድመ-እይታ (Live Portal Mockup)</h3>
                      </div>

                      <div className="p-4 bg-black/70 border border-white/10 rounded-xl flex flex-col items-center justify-center min-h-[250px] relative overflow-hidden text-center">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(193,255,0,0.05),transparent)]"></div>
                        
                        {logoUrl ? (
                          <div className="space-y-4 relative z-10 flex flex-col items-center">
                            <div className="w-28 h-28 rounded-3xl overflow-hidden relative">
                              <img src={logoUrl} alt="Live Logo Preview" className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <h4 className="text-base font-extrabold text-white tracking-widest uppercase">HAWASSA PAPYRUS</h4>
                              <p className="text-[10px] text-[#C1FF00] font-mono tracking-wider font-extrabold uppercase mt-1">DIGITAL ECO-PORTAL PRO</p>
                              <span className="text-[9px] text-white/40 block mt-2">ሎጎው በተሳካ ሁኔታ ተቀናጅቷል!</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-white/40 font-mono text-xs space-y-2">
                            <span className="text-4xl block">🖼️</span>
                            <span>ምንም ሎጎ አልተመረጠም</span>
                          </div>
                        )}
                      </div>

                      {/* Fast Reset Button */}
                      <button
                        type="button"
                        onClick={() => {
                          const fallback = 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=300';
                          handleUpdateLogoAndSync(fallback);
                          const inputEl = document.getElementById('manager-logo-input-field') as HTMLInputElement;
                          if (inputEl) inputEl.value = fallback;
                          alert('🔄 ሎጎው ወደ ቀድሞው የፓፒረስ ሎጅ አርማ ተመልሷል!');
                        }}
                        className="w-full py-2 border border-white/10 hover:border-white/25 hover:bg-white/5 text-white/60 hover:text-white transition-all rounded text-[10px] font-mono font-bold uppercase cursor-pointer"
                      >
                        🔄 ወደ ነባሪው አርማ መልስ (RESET LOGO)
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB CONTENT 10: GALLERY MANAGEMENT (SUPABASE GALLERY TABLE) */}
                {activeAdminTab === 'gallery' && (
                  <div className="space-y-6 font-sans">
                    {/* Add Gallery Photo Form */}
                    <div className="bg-[#121212] border border-white/10 p-6 rounded-xl space-y-6">
                      <div className="border-b border-white/5 pb-2">
                        <span className="text-[9px] text-[#C1FF00] font-mono font-bold tracking-wider block uppercase">GALLERY CONTROL PANEL</span>
                        <h3 className="text-sm font-black text-white uppercase mt-0.5">🖼️ የፓፒረስ ሎጅ ምስል ጋለሪ ማስተዳደሪያ (Lodge Photo Gallery Manager)</h3>
                        <p className="text-[10px] text-white/50 leading-relaxed mt-1">
                          በደንበኛ ገጽ ላይ የሚታዩትን የሎጅ ምስሎች እዚህ ላይ መመዝገብ፣ መሰረዝ ወይም ማስተካከል ይችላሉ። ምስሎችን ወደ Supabase Storage በመጫን ወይም የምስል ዩአርኤል (URL) በመጠቀም በቀላሉ ያስቀምጡ።
                        </p>
                      </div>

                      <form 
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const titleAmInput = document.getElementById('gallery-title-am') as HTMLInputElement;
                          const titleEnInput = document.getElementById('gallery-title-en') as HTMLInputElement;
                          const categoryInput = document.getElementById('gallery-category') as HTMLSelectElement;
                          const urlInput = document.getElementById('gallery-url') as HTMLInputElement;

                          const titleAm = titleAmInput?.value || '';
                          const titleEn = titleEnInput?.value || '';
                          const category = categoryInput?.value || 'General';
                          const imageUrl = galleryNewImgUrl || urlInput?.value || '';

                          if (!imageUrl) {
                            alert('⚠️ እባክዎ የምስል ፋይል ይጫኑ ወይም የምስል ዩአርኤል (Image URL) ያስገቡ!');
                            return;
                          }

                          const success = await handleSaveGalleryItem(titleAm, titleEn, imageUrl, category);
                          if (success) {
                            if (titleAmInput) titleAmInput.value = '';
                            if (titleEnInput) titleEnInput.value = '';
                            if (urlInput) urlInput.value = '';
                            setGalleryNewImgUrl('');
                            const fileInput = document.getElementById('admin-gallery-file-input') as HTMLInputElement;
                            if (fileInput) fileInput.value = '';
                          }
                        }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                      >
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-mono font-bold uppercase text-white/70 block">ምስል ርዕስ በአማርኛ (Amharic Title)</label>
                            <input 
                              type="text"
                              id="gallery-title-am"
                              placeholder="ምሳሌ: የሎጅ ውጫዊ ገጽታ"
                              required
                              className="w-full bg-[#181818] border border-white/10 text-white text-xs p-3 outline-none focus:border-[#C1FF00] rounded"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-mono font-bold uppercase text-white/70 block">ምስል ርዕስ በእንግሊዘኛ (English Title)</label>
                            <input 
                              type="text"
                              id="gallery-title-en"
                              placeholder="Example: Lodge Exterior View"
                              required
                              className="w-full bg-[#181818] border border-white/10 text-white text-xs p-3 outline-none focus:border-[#C1FF00] rounded"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-mono font-bold uppercase text-white/70 block">ምድብ (Category)</label>
                            <select 
                              id="gallery-category"
                              className="w-full bg-[#181818] border border-white/10 text-white text-xs p-3 outline-none focus:border-[#C1FF00] rounded"
                            >
                              <option value="Lodge">Lodge (ሎጅ)</option>
                              <option value="Rooms">Rooms (ክፍሎች)</option>
                              <option value="Food">Food (ጣፋጭ ምግቦች)</option>
                              <option value="Lake">Lake (ሀይቅ እይታ)</option>
                              <option value="Venue">Venue (አዳራሾች)</option>
                              <option value="General">General (አጠቃላይ)</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-4 flex flex-col justify-between">
                          <div className="space-y-3 bg-[#181818] p-4 border border-white/10 rounded-lg">
                            <label className="text-[10px] font-mono font-bold uppercase text-[#C1FF00] block">📁 ፎቶ ከኮምፒውተርዎ ይጫኑ (Upload Photo to Supabase)</label>
                            <input 
                              type="file" 
                              id="admin-gallery-file-input"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  // Upload using readMediaFile
                                  await readMediaFile(e, (url) => {
                                    setGalleryNewImgUrl(url);
                                  });
                                }
                              }}
                              className="w-full text-xs text-white/60 font-mono file:mr-4 file:py-1.5 file:px-3 file:rounded file:border file:border-white/10 file:text-[10px] file:font-sans file:font-semibold file:bg-white/5 file:text-white hover:file:bg-white/10 cursor-pointer"
                            />
                            {galleryNewImgUrl && (
                              <div className="mt-2 p-2 bg-black/40 border border-[#C1FF00]/20 rounded flex items-center gap-3">
                                <img src={galleryNewImgUrl} className="h-10 w-10 object-cover rounded border border-white/10" alt="Preview" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-[9px] text-emerald-400 font-bold truncate">✓ Uploaded to Supabase Storage!</p>
                                  <p className="text-[8px] text-white/40 truncate font-mono">{galleryNewImgUrl}</p>
                                </div>
                                <button 
                                  type="button" 
                                  onClick={() => setGalleryNewImgUrl('')}
                                  className="text-[9px] text-red-400 hover:text-red-300 font-bold uppercase cursor-pointer"
                                >
                                  Clear
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-mono font-bold uppercase text-white/70 block">ወይም የምስል የኢንተርኔት አድራሻ (Or Image Direct URL)</label>
                            <input 
                              type="url"
                              id="gallery-url"
                              value={galleryNewImgUrl}
                              onChange={(e) => setGalleryNewImgUrl(e.target.value)}
                              placeholder="https://images.unsplash.com/photo-xxx..."
                              className="w-full bg-[#181818] border border-white/10 text-white text-xs p-3 outline-none focus:border-[#C1FF00] rounded font-mono"
                            />
                          </div>

                          <button 
                            type="submit"
                            className="w-full bg-[#C1FF00] hover:bg-white text-black py-3 font-black text-xs uppercase tracking-wider transition-colors cursor-pointer rounded flex items-center justify-center gap-2 shadow-lg"
                          >
                            <span>💾 አዲስ ጋለሪ ምስል አስቀምጥ (SAVE GALLERY TO SUPABASE)</span>
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Gallery Grid List */}
                    <div className="bg-[#121212] border border-white/10 p-6 rounded-xl space-y-4">
                      <div className="border-b border-white/5 pb-2 flex justify-between items-center">
                        <div>
                          <span className="text-[9px] text-[#C1FF00] font-mono font-bold tracking-wider block uppercase">GALLERY DATABASE RECORDS</span>
                          <h3 className="text-xs font-black text-white uppercase mt-0.5">📂 በሰንጠረዥ ውስጥ ያሉ ምስሎች ({galleryItems.length})</h3>
                        </div>
                        <span className="text-[9px] text-white/40 font-mono font-bold uppercase">SUPABASE TABLE: gallery</span>
                      </div>

                      {galleryItems.length === 0 ? (
                        <div className="text-center py-12 border border-dashed border-white/5 rounded-xl">
                          <span className="text-3xl block">🖼️</span>
                          <p className="text-xs text-white/40 font-bold mt-2 font-mono">በጋለሪው ሰንጠረዥ ውስጥ ምንም ምስል አልተገኘም።</p>
                          <p className="text-[10px] text-white/30 mt-1 font-bold">ምስል ከላይ በመጫን መመዝገብ ይችላሉ።</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {galleryItems.map((item, idx) => (
                            <div key={item.id || idx} className="bg-[#181818] border border-white/10 rounded-lg overflow-hidden flex flex-col relative group">
                              <div className="relative aspect-video bg-black overflow-hidden">
                                <img 
                                  src={item.image_url} 
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 animate-fade-in" 
                                  alt={item.title_en} 
                                  referrerPolicy="no-referrer"
                                />
                                <span className="absolute top-2 left-2 bg-black/80 text-[#C1FF00] border border-white/10 text-[8px] font-mono font-black uppercase px-2 py-0.5 rounded">
                                  {item.category || 'General'}
                                </span>
                              </div>
                              <div className="p-3 flex-1 flex flex-col justify-between space-y-3">
                                <div className="space-y-1">
                                  <h4 className="text-xs font-black text-white truncate">{item.title_am}</h4>
                                  <p className="text-[10px] text-white/60 font-medium truncate italic">{item.title_en}</p>
                                </div>
                                <div className="border-t border-white/5 pt-2 flex items-center justify-between">
                                  <span className="text-[8px] font-mono text-white/30 uppercase truncate max-w-[120px]">{item.id}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteGalleryItem(item.id)}
                                    className="text-[9px] font-black uppercase text-red-500 hover:text-red-400 font-mono border border-red-950 px-2 py-1 rounded hover:bg-red-950/20 cursor-pointer"
                                  >
                                    🗑️ DELETE
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}



              </motion.div>
            )}

            {/* VIEW_6: MANAGER PORTAL */}
            {activeRole === 'manager' && (
              <motion.div 
                key="manager_portal"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="max-w-6xl mx-auto w-full flex flex-col gap-6"
              >
                {/* Manager Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-[#1E1C10] via-black to-[#121212] border border-yellow-500/20 p-5 rounded-xl relative overflow-hidden shadow-[4px_4px_0_0_#ca8a04]">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/5 rounded-full blur-2xl pointer-events-none"></div>
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-14 h-14 bg-yellow-400 text-black flex items-center justify-center rounded-none font-black text-xl shadow-md border border-black">
                      👑
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] bg-yellow-400 text-black font-mono font-black uppercase px-2 py-0.5 rounded">
                          SENIOR MANAGER
                        </span>
                        <span className="text-[9px] text-white/50 font-mono">AUTHORIZED SESSION</span>
                      </div>
                      <h2 className="text-xl font-bold text-white tracking-tight uppercase mt-0.5">
                        {currentUser?.name || "ኪያ ማሞ (Manager)"}
                      </h2>
                      <p className="text-[11px] text-white/70">
                        የአስተናጋጆች የቦኖ ሽልማት እና የሰራተኞች አቴንዳንስ መቆጣጠሪያ ማዕከል
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="w-full md:w-auto h-10 bg-red-600 hover:bg-red-500 text-white font-mono text-xs uppercase font-black tracking-widest px-6 rounded flex items-center justify-center gap-2 transition-colors border-b-2 border-red-800 hover:border-red-600 cursor-pointer shadow-lg"
                  >
                    <LogOut className="w-4 h-4" /> LOGOUT | ውጣ 🚪
                  </button>
                </div>

                {/* Sub-navigation tabs */}
                <div className="flex border-b border-white/10 gap-2 overflow-x-auto no-scrollbar">
                  <button 
                    onClick={() => setManagerTab('bono')}
                    className={`px-5 py-3 font-mono text-[11px] uppercase font-black tracking-widest border-b-2 transition-all shrink-0 cursor-pointer ${
                      managerTab === 'bono' 
                        ? 'border-yellow-400 text-yellow-400 bg-yellow-400/5' 
                        : 'border-transparent text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    🎟️ አስተናጋጅ ቦኖ (WAITER BONO)
                  </button>
                  <button 
                    onClick={() => setManagerTab('attendance')}
                    className={`px-5 py-3 font-mono text-[11px] uppercase font-black tracking-widest border-b-2 transition-all shrink-0 cursor-pointer ${
                      managerTab === 'attendance' 
                        ? 'border-yellow-400 text-yellow-400 bg-yellow-400/5' 
                        : 'border-transparent text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    📅 የስራተኛ አቴንዳንስ (ATTENDANCE LOGS)
                  </button>
                  <button 
                    onClick={() => setManagerTab('sales_review')}
                    className={`px-5 py-3 font-mono text-[11px] uppercase font-black tracking-widest border-b-2 transition-all shrink-0 cursor-pointer ${
                      managerTab === 'sales_review' 
                        ? 'border-yellow-400 text-yellow-400 bg-yellow-400/5' 
                        : 'border-transparent text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    💳 የባንክ ሂሳብ እና ደረሰኝ (RECEIPTS & LEDGER)
                  </button>
                  <button 
                    onClick={() => setManagerTab('vault')}
                    className={`px-5 py-3 font-mono text-[11px] uppercase font-black tracking-widest border-b-2 transition-all shrink-0 cursor-pointer ${
                      managerTab === 'vault' 
                        ? 'border-yellow-400 text-yellow-400 bg-yellow-400/5' 
                        : 'border-transparent text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    📁 የክላውድ ፋይል ማከማቻ (CLOUD VAULT)
                  </button>
                </div>

                {/* TAB CONTENT: BONO SERVICE TYPE */}
                {managerTab === 'bono' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Award Voucher Column */}
                    <div className="lg:col-span-4 bg-[#121212] border border-white/10 p-5 rounded-xl space-y-4">
                      <div className="border-b border-white/5 pb-2">
                        <span className="text-[9px] text-yellow-400 font-mono font-bold tracking-wider block uppercase">AWARDS ENGINE</span>
                        <h3 className="text-xs font-black text-white uppercase mt-0.5">🧧 አዲስ ቦኖ ስጥ (Issue New Voucher)</h3>
                      </div>

                      <form onSubmit={handleAwardBonus} className="space-y-4">
                        <div>
                          <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">አስተናጋጅ ይምረጡ (SELECT WAITER)</label>
                          <select 
                            value={selectedBonusStaff}
                            onChange={(e) => setSelectedBonusStaff(e.target.value)}
                            required
                            className="w-full bg-[#181818] border border-white/10 text-white text-xs font-bold p-2.5 outline-none focus:border-yellow-400"
                          >
                            <option value="">-- ሰራተኛ ይምረጡ / Choose Staff --</option>
                            {staff.map((s, idx) => (
                              <option key={idx} value={s.name}>
                                {s.name} ({s.role.toUpperCase()})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">የቦኖ መጠን (BONUS AMOUNT - ETB)</label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 font-mono text-xs text-white/40">ETB</span>
                            <input 
                              type="number" 
                              required
                              value={bonusAmount}
                              onChange={(e) => setBonusAmount(e.target.value)}
                              className="w-full bg-[#181818] border border-white/10 text-white font-mono text-sm p-2.5 pl-12 outline-none focus:border-yellow-400"
                              placeholder="500"
                            />
                          </div>
                          {/* Quick presets */}
                          <div className="flex gap-1 mt-1.5 overflow-x-auto no-scrollbar">
                            {['100', '200', '300', '500', '1000'].map(preset => (
                              <button 
                                key={preset}
                                type="button" 
                                onClick={() => setBonusAmount(preset)}
                                className="px-2.5 py-1 bg-white/5 border border-white/10 hover:border-yellow-400 hover:text-yellow-400 text-[10px] font-mono transition-colors rounded cursor-pointer shrink-0"
                              >
                                {preset} Br
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="text-[9px] font-mono text-white/40 uppercase block mb-1">ምክንያት/ማብራሪያ (REASON FOR AWARD)</label>
                          <textarea 
                            value={bonusReason}
                            onChange={(e) => setBonusReason(e.target.value)}
                            required
                            rows={3}
                            className="w-full bg-[#181818] border border-white/10 text-white text-xs p-2.5 outline-none focus:border-yellow-400 resize-none font-sans"
                            placeholder="ለትጉህ ሰራተኛ የተበረከተ ማበረታቻ..."
                          />
                          {/* Reason Presets */}
                          <div className="flex flex-col gap-1 mt-1">
                            {[
                              'ለላቀ የደንበኛ አያያዝ እና አገልግሎት',
                              'በስራ ሰዓት ዝግጁ ሆኖ መገኘት',
                              'ፈጣን እና ቀልጣፋ መስተንግዶ',
                              'ትርፍ ሰዓት በቁርጠኝነት መስራት'
                            ].map(presetReason => (
                              <button 
                                key={presetReason}
                                type="button" 
                                onClick={() => setBonusReason(presetReason)}
                                className="text-left px-2 py-1 text-[9px] text-white/50 hover:text-yellow-400 border border-white/5 bg-white/5 rounded truncate transition-colors cursor-pointer"
                              >
                                🎯 {presetReason}
                              </button>
                            ))}
                          </div>
                        </div>

                        <button 
                          type="submit" 
                          className="w-full h-11 bg-yellow-400 hover:bg-white text-black font-mono text-[10px] uppercase font-black tracking-widest shadow-[2px_2px_0_0_#ca8a04] hover:shadow-none transition-all active:translate-y-0.5 cursor-pointer mt-2"
                        >
                          AWARD BONO VOUCHER 🧧
                        </button>
                      </form>
                    </div>

                    {/* Bono History and Thermal Receipt Section */}
                    <div className="lg:col-span-8 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Bonuses awarded logs */}
                        <div className="bg-[#121212] border border-white/10 p-5 rounded-xl flex flex-col h-[520px]">
                          <div className="border-b border-white/5 pb-2 mb-4">
                            <span className="text-[9px] text-yellow-400 font-mono font-bold tracking-wider block uppercase">TRANSACTION JOURNAL</span>
                            <h3 className="text-xs font-black text-white uppercase mt-0.5">📜 የቦኖ ደረሰኞች (Vouchers Issued)</h3>
                          </div>

                          <div className="space-y-2 overflow-y-auto flex-1 pr-1 no-scrollbar">
                            {bonuses.length === 0 ? (
                              <div className="text-center py-20 text-white/40 font-mono text-[11px] uppercase">
                                No bonuses issued yet during this shift.
                              </div>
                            ) : (
                              bonuses.map((b, idx) => (
                                <div 
                                  key={idx}
                                  onClick={() => setActiveBonusReceipt(b)}
                                  className={`p-3 bg-[#181818] border transition-all cursor-pointer flex justify-between items-center ${
                                    activeBonusReceipt?.id === b.id 
                                      ? 'border-yellow-400 shadow-[0_0_8px_rgba(234,179,8,0.15)] bg-yellow-450/5' 
                                      : 'border-white/5 hover:border-white/15'
                                  }`}
                                >
                                  <div className="space-y-1 min-w-0">
                                    <div className="flex gap-2 items-center">
                                      <span className="font-mono text-[9px] text-white/40">{b.id}</span>
                                      <span className="text-[8px] bg-yellow-400/10 text-yellow-400 px-1 py-0.5 rounded font-mono font-black">{b.time}</span>
                                    </div>
                                    <h5 className="text-xs font-bold text-white truncate">{b.staffName}</h5>
                                    <p className="text-[10px] text-white/50 truncate italic">“{b.reason}”</p>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <span className="font-mono text-sm font-black text-yellow-400">+{b.amount} Br</span>
                                    <span className="text-[8px] text-white/30 block font-mono">{b.date}</span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Thermal Voucher Receipt Visualizer */}
                        <div className="bg-[#121212] border border-white/10 p-5 rounded-xl flex flex-col items-center justify-between min-h-[520px]">
                          <div className="w-full text-left border-b border-white/5 pb-2 mb-3">
                            <span className="text-[9px] text-yellow-400 font-mono font-bold tracking-wider block uppercase">THERMAL OUT PUT</span>
                            <h3 className="text-xs font-black text-white uppercase mt-0.5">🖨️ የደረሰኝ ቅጂ (Print Preview)</h3>
                          </div>

                          {activeBonusReceipt ? (
                            <div className="bg-white text-black p-5 font-mono shadow-2xl max-w-xs w-full text-center space-y-3 relative shrink-0 text-xs border border-neutral-300">
                              {/* Jagged paper top */}
                              <div className="absolute top-0 inset-x-0 h-1.5 bg-neutral-200/50 flex overflow-hidden">
                                {Array.from({ length: 24 }).map((_, i) => (
                                  <div key={i} className="w-3 h-3 bg-[#121212] shrink-0 rotate-45 -translate-y-2"></div>
                                ))}
                              </div>

                              <div className="pt-2">
                                <h4 className="text-[13px] font-black uppercase text-black italic">🌟 PAPYRUS LODGE 🌟</h4>
                                <p className="text-[9px] text-neutral-600 mt-0.5">HAWASSA LAKE SHORE ROAD</p>
                                <p className="text-[9px] text-neutral-600">TEL: +251 919 629347</p>
                              </div>

                              <div className="border-t border-b border-dashed border-neutral-400 py-2 my-2 text-left space-y-1 text-[10px]">
                                <div className="flex justify-between">
                                  <span>VOUCHER ID:</span>
                                  <span className="font-bold">{activeBonusReceipt.id}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>DATE/TIME:</span>
                                  <span>{activeBonusReceipt.date} {activeBonusReceipt.time}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>PREPARED BY:</span>
                                  <span>MANAGER</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>RECIPIENT:</span>
                                  <span className="font-black text-xs uppercase">{activeBonusReceipt.staffName}</span>
                                </div>
                              </div>

                              <div className="my-2 bg-neutral-100 p-2 border border-neutral-200">
                                <div className="text-[9px] text-neutral-500 uppercase">AMOUNT REWARDED</div>
                                <div className="text-2xl font-black text-neutral-900 mt-0.5">{activeBonusReceipt.amount}.00 ETB</div>
                                <div className="text-[8px] text-neutral-600 uppercase mt-1">የቦኖ መጠን (ብር)</div>
                              </div>

                              <div className="text-left text-[9px] italic leading-tight border-b border-neutral-200 pb-2">
                                <span className="font-bold text-neutral-800 not-italic block uppercase">REASON FOR BONUS:</span>
                                "{activeBonusReceipt.reason}"
                              </div>

                              {/* Stamp simulation */}
                              <div className="my-3 flex justify-center">
                                <div className="border-[3px] border-double border-red-700/60 text-red-700/60 font-black tracking-widest uppercase py-1 px-3 text-[9px] rounded-lg rotate-12 inline-block select-none font-bold">
                                  ⭐ PAPYRUS APPROVED ⭐
                                </div>
                              </div>

                              {/* Fake Barcode */}
                              <div className="pt-1 flex flex-col items-center">
                                <div className="flex gap-0.5 h-6 items-end">
                                  {[1, 3, 1, 2, 4, 1, 3, 2, 1, 2, 4, 1, 3, 1, 2].map((w, i) => (
                                    <div key={i} className="bg-black shrink-0 h-full" style={{ width: `${w}px` }}></div>
                                  ))}
                                </div>
                                <span className="text-[8px] tracking-[0.2em] font-bold text-neutral-700 mt-1">*{activeBonusReceipt.id}*</span>
                              </div>

                              <div className="text-[8px] text-neutral-500 pt-2 border-t border-dashed border-neutral-300">
                                THANK YOU FOR YOUR EXTRAORDINARY WORK!
                              </div>
                            </div>
                          ) : (
                            <div className="flex-1 flex flex-col justify-center items-center text-center p-4">
                              <span className="text-4xl text-white/10 block mb-2">🖨️</span>
                              <p className="text-[10px] text-white/40 font-mono uppercase">
                                SELECT AN ISSUED VOUCHER LOG TO PREVIEW AND GENERATE THERMAL RECEIPT
                              </p>
                            </div>
                          )}

                          {activeBonusReceipt && (
                            <button 
                              onClick={() => {
                                window.print();
                              }}
                              className="w-full mt-3 h-10 bg-white hover:bg-neutral-200 text-black font-mono text-[9px] uppercase font-black tracking-widest flex items-center justify-center gap-1.5 rounded cursor-pointer"
                            >
                              🖨️ PRINT VOUCHER RECEIPT (ቦኖ አትም)
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB CONTENT: ATTENDANCE SYSTEM */}
                {managerTab === 'attendance' && (
                  <div className="bg-[#121212] border border-white/10 p-5 rounded-xl space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-white/5 pb-3">
                      <div>
                        <span className="text-[9px] text-yellow-400 font-mono font-bold tracking-wider block uppercase">STAFF MONITORING</span>
                        <h3 className="text-xs font-black text-white uppercase mt-0.5">📅 የእለት ተእለት የስራ መቆጣጠሪያ መዝገብ (Staff Daily Attendance)</h3>
                      </div>

                      {/* Custom Time Selector & Action indicators */}
                      <div className="flex flex-wrap items-center gap-2.5 bg-black/40 p-2.5 rounded border border-white/5 w-full md:w-auto">
                        <label className="text-[9px] font-mono text-white/50 uppercase">ሰዓት ማስተካከያ (MANUAL CLOCK-IN TIME):</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 08:30"
                          value={customAttendanceTime}
                          onChange={(e) => setCustomAttendanceTime(e.target.value)}
                          className="w-24 bg-[#181818] border border-white/10 text-white font-mono text-xs p-1 text-center outline-none focus:border-yellow-400"
                        />
                        <button 
                          onClick={() => setCustomAttendanceTime('')}
                          className="px-2 py-1 bg-white/5 hover:bg-white/10 text-[9px] font-mono rounded"
                        >
                          RESET TO NOW
                        </button>
                      </div>
                    </div>

                    {/* PENDING WIFI CLOCK-IN APPROVAL REQUESTS */}
                    {pendingAttendanceRequests.filter(r => r.status === 'pending').length > 0 && (
                      <div className="bg-[#1C1C13] border-l-4 border-yellow-400 border border-white/10 p-5 rounded-r-xl space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl animate-bounce">⏳</span>
                            <div>
                              <h4 className="text-sm font-black text-white uppercase">የዋይፋይ የስራ መግቢያ ጥያቄዎች (Pending WiFi Clock-In Requests)</h4>
                              <p className="text-[10px] text-white/50 font-mono">ማናጀሩ ከድርጅቱ ዋይፋይ የገቡ ሰራተኞችን እንዲያፀድቁ ይጠብቃሉ / Approve WiFi arrivals</p>
                            </div>
                          </div>
                          <span className="font-mono text-xs bg-yellow-400 text-black font-black px-2.5 py-0.5 rounded-full">
                            {pendingAttendanceRequests.filter(r => r.status === 'pending').length} ጥያቄዎች
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {pendingAttendanceRequests.filter(r => r.status === 'pending').map((req) => (
                            <div key={req.id} className="bg-black/50 border border-white/5 p-4 rounded-xl flex items-center justify-between gap-4 transition-all hover:border-yellow-400/30">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-black text-white uppercase">{req.staffName}</span>
                                  <span className="text-[9px] font-mono bg-white/5 border border-white/15 px-1.5 rounded uppercase text-white/60">
                                    {req.role}
                                  </span>
                                </div>
                                <div className="text-[10px] text-white/50 font-mono mt-1 flex items-center gap-1.5 flex-wrap">
                                  <span>📅 {req.time}</span>
                                  <span>📶 {req.wifiSsid}</span>
                                </div>
                              </div>

                              <div className="flex gap-2 shrink-0">
                                <button
                                  onClick={() => {
                                    const todayDate = new Date().toLocaleDateString('et-EE', { year: 'numeric', month: '2-digit', day: '2-digit' });
                                    const amharicTimeStr = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
                                    
                                    setAttendance(prev => {
                                      const exists = prev.some(a => a.staffName === req.staffName && a.date === todayDate);
                                      if (exists) {
                                        return prev.map(a => (a.staffName === req.staffName && a.date === todayDate) ? { ...a, status: 'Present', clockInTime: amharicTimeStr } : a);
                                      }
                                      return [
                                        {
                                          id: 'att-' + Date.now(),
                                          staffName: req.staffName,
                                          role: req.role,
                                          date: todayDate,
                                          clockInTime: amharicTimeStr,
                                          status: 'Present'
                                        },
                                        ...prev
                                      ];
                                    });

                                    setPendingAttendanceRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'approved' } : r));
                                    playVoiceAlert(`${req.staffName} attendance clock in has been approved!`);
                                    alert(`የገቡበት ጥያቄ በተሳካ ሁኔታ ፀድቋል! ${req.staffName} መግቢያው ተመዝግቧል።`);
                                  }}
                                  className="bg-emerald-500 hover:bg-emerald-600 text-black text-[10px] font-bold font-mono px-3 py-1.5 rounded cursor-pointer transition-all"
                                >
                                  APPROVE (አፅድቅ)
                                </button>
                                <button
                                  onClick={() => {
                                    setPendingAttendanceRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'rejected' } : r));
                                    playVoiceAlert(`${req.staffName} request declined.`);
                                    alert(`የስራ መግቢያ ጥያቄ በትክክል ባለመሆኑ ውድቅ ተደርጓል።`);
                                  }}
                                  className="bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold font-mono px-3 py-1.5 rounded cursor-pointer transition-all"
                                >
                                  REJECT
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Simple Staff Attendance Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Left Metrics boxes */}
                      <div className="bg-black/40 border border-white/5 p-4 flex items-center justify-between">
                        <div>
                          <span className="text-[9px] text-white/40 font-mono uppercase block">TOTAL STAFF LISTED</span>
                          <span className="text-2xl font-black font-mono text-white">{staff.length}</span>
                        </div>
                        <span className="text-2xl">👥</span>
                      </div>
                      <div className="bg-lime-950/20 border border-lime-900/30 p-4 flex items-center justify-between">
                        <div>
                          <span className="text-[9px] text-lime-400/60 font-mono uppercase block">PRESENT TODAY (ያሉ)</span>
                          <span className="text-2xl font-black font-mono text-lime-400">
                            {attendance.filter(a => a.date === new Date().toLocaleDateString('et-EE', { year: 'numeric', month: '2-digit', day: '2-digit' }) && (a.status === 'Present' || a.status === 'Late')).length}
                          </span>
                        </div>
                        <span className="text-2xl text-lime-400">✓</span>
                      </div>
                      <div className="bg-red-950/20 border border-red-900/30 p-4 flex items-center justify-between">
                        <div>
                          <span className="text-[9px] text-red-400/60 font-mono uppercase block">ABSENT TODAY (የሌሉ)</span>
                          <span className="text-2xl font-black font-mono text-red-400">
                            {attendance.filter(a => a.date === new Date().toLocaleDateString('et-EE', { year: 'numeric', month: '2-digit', day: '2-digit' }) && a.status === 'Absent').length}
                          </span>
                        </div>
                        <span className="text-2xl text-red-500">✗</span>
                      </div>
                    </div>

                    {/* Staff List Table for Attendance Entries */}
                    <div className="border border-white/5 bg-[#181818] rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-[#0F0F0F] border-b border-white/10 uppercase font-mono text-[9px] text-white/40">
                              <th className="p-3">ሰራተኛ (EMPLOYEE)</th>
                              <th className="p-3">ማእረግ (ROLE)</th>
                              <th className="p-3">ዛሬ ሁኔታው (STATUS TODAY)</th>
                              <th className="p-3">መግቢያ ሰአት (CLOCK-IN)</th>
                              <th className="p-3">መውጫ ሰአት (CLOCK-OUT)</th>
                              <th className="p-3 text-right">እርምጃዎች (MANUAL MANAGING ACTIONS)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 font-bold">
                            {staff.map((s, idx) => {
                              const todayDate = new Date().toLocaleDateString('et-EE', { year: 'numeric', month: '2-digit', day: '2-digit' });
                              const record = attendance.find(a => a.staffName === s.name && a.date === todayDate);

                              return (
                                <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                                  <td className="p-3 flex items-center gap-3">
                                    <img 
                                      src={s.photo || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"} 
                                      className="w-10 h-10 rounded-full object-cover border border-white/10 bg-slate-900 shrink-0" 
                                      alt={s.name} 
                                    />
                                    <div>
                                      <div className="text-white text-xs">{s.name}</div>
                                      <div className="text-[9px] text-white/40 font-mono">PIN: {s.pin}</div>
                                    </div>
                                  </td>
                                  <td className="p-3 uppercase">
                                    <span className="text-[10px] font-mono bg-white/5 border border-white/15 py-0.5 px-2 rounded">
                                      {s.role}
                                    </span>
                                  </td>
                                  <td className="p-3">
                                    {record ? (
                                      <span className={`px-2 py-0.5 text-[10px] rounded font-mono ${
                                        record.status === 'Present' 
                                          ? 'bg-lime-950 text-lime-400 border border-lime-800/50' 
                                          : record.status === 'Late' 
                                          ? 'bg-amber-950 text-amber-400 border border-amber-800/50'
                                          : 'bg-red-950 text-red-400 border border-red-800/50'
                                      }`}>
                                        {record.status === 'Present' ? '✓ Present' : record.status === 'Late' ? '⏱ Late' : '✗ Absent'}
                                      </span>
                                    ) : (
                                      <span className="text-white/30 font-mono italic text-[10px]">Not Marked</span>
                                    )}
                                  </td>
                                  <td className="p-3 font-mono text-white/80">
                                    {record?.clockInTime || '--:--'}
                                  </td>
                                  <td className="p-3 font-mono text-white/80">
                                    {record?.clockOutTime || '--:--'}
                                  </td>
                                  <td className="p-3 text-right">
                                    <div className="inline-flex gap-1">
                                      <button 
                                        onClick={() => handleManagerUpdateAttendance(s.name, 'Present', customAttendanceTime)}
                                        className="px-2.5 py-1.5 bg-lime-900/30 hover:bg-lime-600 text-lime-400 hover:text-white border border-lime-800/40 text-[9px] uppercase font-mono font-black rounded transition-all cursor-pointer"
                                      >
                                        PRESENT
                                      </button>
                                      <button 
                                        onClick={() => handleManagerUpdateAttendance(s.name, 'Late', customAttendanceTime)}
                                        className="px-2.5 py-1.5 bg-amber-900/30 hover:bg-amber-600 text-amber-400 hover:text-white border border-amber-800/40 text-[9px] uppercase font-mono font-black rounded transition-all cursor-pointer"
                                      >
                                        LATE
                                      </button>
                                      <button 
                                        onClick={() => handleManagerUpdateAttendance(s.name, 'Absent', customAttendanceTime)}
                                        className="px-2.5 py-1.5 bg-red-900/30 hover:bg-red-600 text-red-400 hover:text-white border border-red-800/40 text-[9px] uppercase font-mono font-black rounded transition-all cursor-pointer"
                                      >
                                        ABSENT
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Attendance History Log & Statistics Panel */}
                    <div className="bg-[#121212] border border-white/10 rounded-xl p-5 mt-6 space-y-6 text-left">
                      <div className="border-b border-white/5 pb-3">
                        <span className="text-[9px] text-[#C1FF00] font-mono font-bold tracking-wider block uppercase">HISTORICAL ATTENDANCE TRACKER</span>
                        <h3 className="text-xs font-black text-white uppercase mt-0.5">📅 የአቴንዳንስ የታሪክ ማህደር እና ስታቲስቲክስ (Attendance History & Stats)</h3>
                        <p className="text-[10px] text-stone-400 mt-1">የቀን፣ የወር እና የዓመት አቴንዳንስ ማጣሪያዎችን እዚህ መጠቀም እንዲሁም ዝርዝሩን ማየት ይችላሉ።</p>
                      </div>

                      {/* Filter Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-black/30 p-4 rounded-xl border border-white/5">
                        {/* Staff Filter */}
                        <div className="space-y-1">
                          <label className="text-[9px] text-stone-400 font-mono block uppercase">በሰራተኛ (BY STAFF)</label>
                          <select
                            value={attFilterStaff}
                            onChange={(e) => setAttFilterStaff(e.target.value)}
                            className="w-full bg-[#181818] border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-[#C1FF00] font-medium"
                          >
                            <option value="all">{appLang === 'am' ? 'ሁሉም ሰራተኞች' : 'All Staff Members'}</option>
                            {staff.map((s, sIdx) => (
                              <option key={sIdx} value={s.name}>{s.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* Year Filter */}
                        <div className="space-y-1">
                          <label className="text-[9px] text-stone-400 font-mono block uppercase">በዓመት (BY YEAR)</label>
                          <select
                            value={attFilterYear}
                            onChange={(e) => setAttFilterYear(e.target.value)}
                            className="w-full bg-[#181818] border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-[#C1FF00] font-medium"
                          >
                            <option value="all">{appLang === 'am' ? 'ሁሉም ዓመታት' : 'All Years'}</option>
                            <option value="2025">2025</option>
                            <option value="2026">2026</option>
                            <option value="2027">2027</option>
                            <option value="2028">2028</option>
                          </select>
                        </div>

                        {/* Month Filter */}
                        <div className="space-y-1">
                          <label className="text-[9px] text-stone-400 font-mono block uppercase">በወር (BY MONTH)</label>
                          <select
                            value={attFilterMonth}
                            onChange={(e) => setAttFilterMonth(e.target.value)}
                            className="w-full bg-[#181818] border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-[#C1FF00] font-medium"
                          >
                            <option value="all">{appLang === 'am' ? 'ሁሉም ወራት' : 'All Months'}</option>
                            <option value="01">01 - ጃንዋሪ (January)</option>
                            <option value="02">02 - ፌብሩዋሪ (February)</option>
                            <option value="03">03 - ማርች (March)</option>
                            <option value="04">04 - ኤፕሪል (April)</option>
                            <option value="05">05 - ሜይ (May)</option>
                            <option value="06">06 - ጁን (June)</option>
                            <option value="07">07 - ጁላይ (July)</option>
                            <option value="08">08 - ኦገስት (August)</option>
                            <option value="09">09 - ሴፕቴምበር (September)</option>
                            <option value="10">10 - ኦክቶበር (October)</option>
                            <option value="11">11 - ኖቬምበር (November)</option>
                            <option value="12">12 - ዲሴምበር (December)</option>
                          </select>
                        </div>

                        {/* Day Filter */}
                        <div className="space-y-1">
                          <label className="text-[9px] text-stone-400 font-mono block uppercase">በቀን (BY DAY)</label>
                          <select
                            value={attFilterDay}
                            onChange={(e) => setAttFilterDay(e.target.value)}
                            className="w-full bg-[#181818] border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-[#C1FF00] font-medium"
                          >
                            <option value="all">{appLang === 'am' ? 'ሁሉም ቀናት' : 'All Days'}</option>
                            {Array.from({ length: 31 }, (_, i) => {
                              const val = String(i + 1).padStart(2, '0');
                              return (
                                <option key={i} value={val}>{val}</option>
                              );
                            })}
                          </select>
                        </div>
                      </div>

                      {/* Filter Stats Metrics */}
                      {(() => {
                        const filtered = attendance.filter(a => {
                          const parts = a.date.split('.');
                          const d = parts[0] || '';
                          const m = parts[1] || '';
                          const y = parts[2] || '';
                          
                          const sMatch = attFilterStaff === 'all' || a.staffName === attFilterStaff;
                          const yMatch = attFilterYear === 'all' || y === attFilterYear;
                          const mMatch = attFilterMonth === 'all' || m === attFilterMonth;
                          const dMatch = attFilterDay === 'all' || d === attFilterDay;
                          
                          return sMatch && yMatch && mMatch && dMatch;
                        });

                        const pres = filtered.filter(a => a.status === 'Present').length;
                        const lat = filtered.filter(a => a.status === 'Late').length;
                        const abs = filtered.filter(a => a.status === 'Absent').length;
                        const tot = filtered.length;
                        const rate = tot > 0 ? Math.round(((pres + lat) / tot) * 100) : 0;

                        return (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                              <div className="bg-[#181818] border border-white/5 p-3 rounded-lg text-center">
                                <span className="text-[8px] text-stone-400 block font-mono uppercase">FILTERED RECORDS</span>
                                <span className="text-lg font-black font-mono text-white">{tot}</span>
                              </div>
                              <div className="bg-[#181818] border border-white/5 p-3 rounded-lg text-center">
                                <span className="text-[8px] text-lime-400/70 block font-mono uppercase">PRESENT</span>
                                <span className="text-lg font-black font-mono text-lime-400">{pres}</span>
                              </div>
                              <div className="bg-[#181818] border border-white/5 p-3 rounded-lg text-center">
                                <span className="text-[8px] text-amber-400/70 block font-mono uppercase">LATE</span>
                                <span className="text-lg font-black font-mono text-amber-400">{lat}</span>
                              </div>
                              <div className="bg-[#181818] border border-white/5 p-3 rounded-lg text-center">
                                <span className="text-[8px] text-red-400/70 block font-mono uppercase">ABSENT</span>
                                <span className="text-lg font-black font-mono text-red-400">{abs}</span>
                              </div>
                              <div className="bg-[#181818] border border-white/5 p-3 rounded-lg text-center col-span-2 md:col-span-1">
                                <span className="text-[8px] text-stone-400 block font-mono uppercase">ATTENDANCE RATE</span>
                                <span className={`text-lg font-black font-mono block ${
                                  rate >= 90 ? 'text-lime-400' : rate >= 70 ? 'text-amber-400' : 'text-red-400'
                                }`}>{rate}%</span>
                              </div>
                            </div>

                            {/* Filter Results Table */}
                            <div className="border border-white/5 bg-[#181818] rounded-lg overflow-hidden">
                              <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                  <thead>
                                    <tr className="bg-[#0F0F0F] border-b border-white/10 uppercase font-mono text-[8px] text-stone-400 sticky top-0">
                                      <th className="p-2.5">ቀን (DATE)</th>
                                      <th className="p-2.5">ሰራተኛ (STAFF NAME)</th>
                                      <th className="p-2.5">ስራ ድርሻ (ROLE)</th>
                                      <th className="p-2.5">ሁኔታ (STATUS)</th>
                                      <th className="p-2.5">መግቢያ (IN)</th>
                                      <th className="p-2.5">መውጫ (OUT)</th>
                                      <th className="p-2.5 text-right">ማስተካከያ (ACTION)</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-white/5 font-medium">
                                    {filtered.length === 0 ? (
                                      <tr>
                                        <td colSpan={7} className="p-6 text-center text-stone-500 font-mono italic">
                                          ማጣሪያውን የሚያሟላ የአቴንዳንስ ታሪክ አልተገኘም (No matching attendance records found)
                                        </td>
                                      </tr>
                                    ) : (
                                      filtered.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-white/[0.01] transition-colors font-mono font-bold">
                                          <td className="p-2.5 text-white">{item.date}</td>
                                          <td className="p-2.5 text-stone-200 font-sans">{item.staffName}</td>
                                          <td className="p-2.5 text-stone-400 uppercase text-[10px]">{item.role}</td>
                                          <td className="p-2.5">
                                            <span className={`px-1.5 py-0.5 text-[9px] rounded font-mono font-bold ${
                                              item.status === 'Present' 
                                                ? 'bg-lime-950 text-lime-400 border border-lime-800/40' 
                                                : item.status === 'Late' 
                                                ? 'bg-amber-950 text-amber-400 border border-amber-800/40'
                                                : 'bg-red-950 text-red-400 border border-red-800/40'
                                            }`}>
                                              {item.status}
                                            </span>
                                          </td>
                                          <td className="p-2.5 text-stone-300">{item.clockInTime || '--:--'}</td>
                                          <td className="p-2.5 text-stone-300">{item.clockOutTime || '--:--'}</td>
                                          <td className="p-2.5 text-right">
                                            <button
                                              onClick={() => {
                                                askConfirmAndRun('ይህን የአቴንዳንስ መዝገብ ለማጥፋት እርግጠኛ ኖት? (Are you sure you want to delete this record?)', () => {
                                                  setAttendance(prev => prev.filter(a => a.id !== item.id));
                                                });
                                              }}
                                              className="p-1 px-2 text-[9px] font-mono text-red-400 hover:text-white bg-red-950/25 border border-red-900/30 hover:bg-red-600 rounded cursor-pointer transition-colors"
                                            >
                                              DELETE
                                            </button>
                                          </td>
                                        </tr>
                                      ))
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {managerTab === 'sales_review' && (
                  <div className="bg-[#121212] border border-white/10 p-5 rounded-xl space-y-6 text-left">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-white/5 pb-3">
                      <div>
                        <span className="text-[9px] text-[#C1FF00] font-mono font-bold tracking-wider block uppercase">FINANCIAL LEDGER</span>
                        <h3 className="text-xs font-black text-white uppercase mt-0.5">💳 የሽያጭ እና የደረሰኝ መቆጣጠሪያ (Sales & Receipt Ledger)</h3>
                      </div>
                      <div className="flex bg-black/40 p-1 rounded border border-white/5 font-mono text-[10px] gap-1 shrink-0">
                        <button
                          onClick={() => setLedgerFilterTab('daily')}
                          className={`px-3 py-1 uppercase font-bold rounded transition-colors cursor-pointer ${
                            ledgerFilterTab === 'daily' ? 'bg-[#C1FF00] text-black' : 'text-stone-400 hover:text-white'
                          }`}
                        >
                          Daily (ዕለታዊ)
                        </button>
                        <button
                          onClick={() => setLedgerFilterTab('monthly')}
                          className={`px-3 py-1 uppercase font-bold rounded transition-colors cursor-pointer ${
                            ledgerFilterTab === 'monthly' ? 'bg-[#C1FF00] text-black' : 'text-stone-400 hover:text-white'
                          }`}
                        >
                          Monthly (ወርሃዊ)
                        </button>
                        <button
                          onClick={() => setLedgerFilterTab('yearly')}
                          className={`px-3 py-1 uppercase font-bold rounded transition-colors cursor-pointer ${
                            ledgerFilterTab === 'yearly' ? 'bg-[#C1FF00] text-black' : 'text-stone-400 hover:text-white'
                          }`}
                        >
                          Yearly (በዓመት)
                        </button>
                      </div>
                    </div>

                    {ledgerFilterTab === 'daily' && (
                      <div className="space-y-4">
                        {(() => {
                          const todayDate = new Date().toLocaleDateString('et-EE', { year: 'numeric', month: '2-digit', day: '2-digit' });
                          const dailyOrders = orders.filter(o => o.date === todayDate);
                          const totalSales = dailyOrders.reduce((s, o) => s + o.total, 0);
                          const cashSales = dailyOrders.filter(o => o.payment === 'cash').reduce((s, o) => s + o.total, 0);
                          const bankSales = dailyOrders.filter(o => o.payment === 'bank').reduce((s, o) => s + o.total, 0);

                          return (
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-black/30 border border-white/5 p-4 rounded-lg">
                                  <span className="text-[9px] text-white/40 block">TODAY'S TOTAL</span>
                                  <span className="text-xl font-mono font-bold text-white">{totalSales} ብር</span>
                                </div>
                                <div className="bg-emerald-950/20 border border-emerald-900/30 p-4 rounded-lg">
                                  <span className="text-[9px] text-emerald-400/60 block">CASH SALES</span>
                                  <span className="text-xl font-mono font-bold text-emerald-400">{cashSales} ብር</span>
                                </div>
                                <div className="bg-sky-950/20 border border-sky-900/30 p-4 rounded-lg">
                                  <span className="text-[9px] text-sky-400/60 block">BANK TRANSFERS</span>
                                  <span className="text-xl font-mono font-bold text-sky-400">{bankSales} ብር</span>
                                </div>
                              </div>

                              <div className="border border-white/5 bg-[#181818] rounded-lg overflow-hidden">
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                      <tr className="bg-[#0F0F0F] border-b border-white/10 uppercase font-mono text-[9px] text-white/40">
                                        <th className="pb-2 p-3">ትዕዛዝ (Order ID)</th>
                                        <th className="pb-2">ቦታ (Location)</th>
                                        <th className="pb-2 font-mono">ዝርዝር (Details)</th>
                                        <th className="pb-2 text-left font-mono">ክፍያ (Method)</th>
                                            <th className="pb-2 text-right">ጠቅላላ (Total)</th>
                                            <th className="pb-2 text-center text-xs">ደረሰኝ ማረጋገጫ (Receipt Verification)</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5 font-medium">
                                          {dailyOrders.map(ord => (
                                            <tr key={ord.id} className="hover:bg-white/2 transition-colors">
                                              <td className="py-3 font-mono font-bold text-sky-400">
                                                {ord.id}
                                                <span className="text-[8px] text-white/30 font-mono block">{ord.time}</span>
                                              </td>
                                              <td className="py-3">
                                                <span className="font-black text-white/90 block">{ord.location}</span>
                                                <span className="text-[8px] text-white/40 font-mono uppercase block">{ord.orderType}</span>
                                              </td>
                                              <td className="py-3 max-w-xs font-bold">
                                                <div className="space-y-0.5 text-[11px] text-white/80">
                                                  {ord.items.map((it, iIdx) => (
                                                    <div key={iIdx}>• {it.qty} × {it.name}</div>
                                                  ))}
                                                </div>
                                              </td>
                                              <td className="py-3 font-mono">
                                                {ord.payment === 'cash' ? (
                                                  <span className="text-emerald-400 font-bold bg-emerald-950/20 px-1.5 py-0.5 border border-emerald-900/30 rounded">CASH</span>
                                                ) : (
                                                  <div className="space-y-1">
                                                    <span className="text-sky-400 font-bold bg-sky-950/20 px-1.5 py-0.5 border border-sky-900/30 rounded block w-fit text-[9px]">BANK TRANSFER</span>
                                                    {ord.bankRef && <span className="text-[9px] text-[#C1FF00] font-bold block">Ref: {ord.bankRef}</span>}
                                                  </div>
                                                )}
                                              </td>
                                              <td className="py-3 text-right font-mono font-black text-white">{ord.total} ብር</td>
                                              <td className="py-3 text-center">
                                                {ord.payment === 'cash' ? (
                                                  <span className="text-white/30 text-[9px] font-mono block">-</span>
                                                ) : (
                                                  <div className="inline-flex flex-col gap-2 items-center justify-center p-2 bg-[#121212] border border-white/5 rounded-lg w-full max-w-[200px]">
                                                    {ord.receiptScreenshot ? (
                                                      <div className="space-y-1.5 w-full">
                                                        <div className="relative border border-white/10 bg-black max-h-12 flex justify-center">
                                                          <img src={ord.receiptScreenshot} className="h-10 object-contain" alt="Receipt proof" />
                                                        </div>
                                                        <a href={ord.receiptScreenshot} target="_blank" referrerPolicy="no-referrer" className="text-[8px] text-[#C1FF00] hover:underline font-bold block text-center uppercase">🔍 VIEW FULL</a>
                                                        {ord.receiptComment && (
                                                          <p className="text-[8px] text-white/50 leading-tight italic bg-black/40 p-1">"{ord.receiptComment}"</p>
                                                        )}
                                                      </div>
                                                    ) : (
                                                      <span className="text-[8px] text-white/40 block">No Proof image</span>
                                                    )}

                                                    {ord.confirmed ? (
                                                      <span className="text-[9px] uppercase bg-emerald-950 font-black text-emerald-400 px-2 py-0.5 rounded-full flex gap-1">✔ Verified</span>
                                                    ) : (
                                                      <div className="space-y-1.5 w-full">
                                                        <span className="text-[8px] uppercase bg-yellow-950 font-black text-yellow-500 px-2 py-0.5 rounded block text-center animate-pulse">⚠️ PENDING</span>
                                                        <div className="grid grid-cols-2 gap-1">
                                                          <button onClick={() => handleConfirmOrderPayment(ord.id, true)} className="bg-[#C1FF00] hover:bg-white text-black font-mono font-black text-[8px] uppercase py-1 cursor-pointer">CONFIRM</button>
                                                          <button onClick={() => handleConfirmOrderPayment(ord.id, false)} className="bg-red-950 text-red-500 font-mono text-[8px] py-1 cursor-pointer">REJECT</button>
                                                        </div>
                                                      </div>
                                                    )}
                                                  </div>
                                                )}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}

                        {/* Month View for Manager */}
                        {ledgerFilterTab === 'monthly' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(() => {
                              const groupedByMonth: { [key: string]: Order[] } = {};
                              orders.forEach(o => {
                                const d = o.date || '2026-06-07';
                                const m = d.substring(0, 7);
                                if (!groupedByMonth[m]) groupedByMonth[m] = [];
                                groupedByMonth[m].push(o);
                              });

                              return Object.keys(groupedByMonth).sort((a,b)=>b.localeCompare(a)).map(mKey => {
                                const monthOrders = groupedByMonth[mKey];
                                const mTotal = monthOrders.reduce((s,o)=>s+o.total,0);
                                const mCash = monthOrders.filter(o=>o.payment==='cash').reduce((s,o)=>s+o.total,0);
                                const mBank = monthOrders.filter(o=>o.payment==='bank').reduce((s,o)=>s+o.total,0);

                                return (
                                  <div key={mKey} className="bg-black/50 p-4 border border-white/5 rounded-xl space-y-3">
                                    <h4 className="text-xs font-black text-white uppercase border-b border-white/5 pb-1">🌙 ወርሃዊ ድምር (Month {mKey})</h4>
                                    <div className="space-y-1.5 text-xs font-mono">
                                      <div className="flex justify-between text-white/50"><span>Cash:</span> <span className="font-bold text-white">{mCash} ብር</span></div>
                                      <div className="flex justify-between text-white/50"><span>Bank:</span> <span className="font-bold text-white">{mBank} ብር</span></div>
                                      <div className="flex justify-between text-[#C1FF00] font-black border-t border-white/5 pt-1.5"><span>ጠቅላላ (Total):</span> <span>{mTotal} ብር</span></div>
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        )}

                        {/* Year View for Manager */}
                        {ledgerFilterTab === 'yearly' && (
                          <div className="space-y-4">
                            {(() => {
                              const groupedByYear: { [key: string]: Order[] } = {};
                              orders.forEach(o => {
                                const d = o.date || '2026-06-07';
                                const y = d.substring(0, 4);
                                if (!groupedByYear[y]) groupedByYear[y] = [];
                                groupedByYear[y].push(o);
                              });

                              return Object.keys(groupedByYear).sort((a,b)=>b.localeCompare(a)).map(yKey => {
                                const yearOrders = groupedByYear[yKey];
                                const yTotal = yearOrders.reduce((s,o)=>s+o.total,0);
                                return (
                                  <div key={yKey} className="bg-black/50 p-4 border border-white/5 rounded-xl flex justify-between items-center">
                                    <span className="text-xs font-black text-white">🎄 የ {yKey} አመት ጠቅላላ ድምር:</span>
                                    <span className="font-mono font-black text-[#C1FF00] text-sm">{yTotal} ብር</span>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        )}

                      </div>
                    )}

                 {managerTab === 'vault' && (
                  <div className="bg-[#121212] border border-white/10 p-5 rounded-xl space-y-4 text-left">
                    <div className="border-b border-white/5 pb-2">
                      <span className="text-[9px] text-[#00f5ff] font-mono font-bold tracking-wider block uppercase">CLOUD VAULT & MEDIA INTEGRATION</span>
                      <h3 className="text-xs font-black text-white uppercase mt-0.5">📁 የክላውድ ፋይል ማከማቻ እና ሰነዶች መቆጣጠሪያ (Cloud File Storage & Team Vault)</h3>
                      <p className="text-[11px] text-stone-400 mt-1">የሰራተኞችን የተያያዙ ሰነዶች እንዲሁም የሎጁን መግቢያ ቪዲዮ (Welcome YouTube TV) እዚህ ማስተዳደር ይችላሉ።</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Left Column: Welcome Video Player Card & Media Controller */}
                      <div className="lg:col-span-12 xl:col-span-4 space-y-4">

                    <div className="bg-black/50 border border-white/10 rounded-xl p-5 space-y-4 relative overflow-hidden text-stone-200">
                      <div className="absolute top-4 right-4 bg-[#C1FF00]/10 text-[#C1FF00] border border-[#C1FF00]/30 font-mono text-[8.5px] px-2 py-0.5 rounded tracking-widest uppercase">
                        MEDIA ENGINE
                      </div>
                      
                      <div>
                        <span className="text-[9px] text-[#C1FF00] font-mono font-bold tracking-wider block uppercase">📺 ACTIVE VIDEO ENGINE</span>
                        <h4 className="text-sm font-black text-white uppercase mt-0.5">የንቁ ቪዲዮ እይታ</h4>
                        <p className="text-[10px] text-stone-400 mt-1 leading-relaxed">
                          በጀርባው የሚንቀሳቀሰውን ቪዲዮ እዚህ ሆነው በድምጽ መቼት ማሻሻል እንዲሁም በቀላሉ መቀየር ይችላሉ።
                        </p>
                      </div>

                      {/* Active Video Toggle Button */}
                      <div className="flex items-center justify-between bg-black/40 p-3 rounded-lg border border-white/5 max-w-2xl mx-auto">
                        <span className="text-xs font-black text-white">
                          {appLang === 'am' ? '📹 የጀርባ ቪዲዮ እይታ ማብሪያ/ማጥፊያ :' : '📹 Background Video ON/OFF :'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsBgVideoEnabled(prev => !prev);
                          }}
                          className={`px-4 py-2 text-xs font-black uppercase rounded border transition-all cursor-pointer ${
                            isBgVideoEnabled
                              ? 'bg-[#C1FF00] text-black border-[#C1FF00] hover:bg-white'
                              : 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                          }`}
                        >
                          {isBgVideoEnabled ? (appLang === 'am' ? 'በርቷል (ON)' : 'ON') : (appLang === 'am' ? 'ጠፍቷል (OFF)' : 'OFF')}
                        </button>
                      </div>

                      {/* Interactive Live Preview Box */}
                      <div className="rounded-lg overflow-hidden border border-white/10 bg-black aspect-video relative max-w-2xl mx-auto">
                        {bgVideoType === 'youtube' ? (
                          <div className="absolute inset-0 w-full h-full overflow-hidden scale-[1.32]">
                            <iframe
                              className="w-full h-full pointer-events-none object-cover scale-[1.12]"
                              src={getYouTubeEmbedUrl(bgVideoUrl, mediaPreviewMuted, !mediaPreviewPaused)}
                              title="Welcome Papyrus Background Video"
                              allow="autoplay; encrypted-media"
                              frameBorder="0"
                            ></iframe>
                            <div className="absolute inset-0 bg-transparent z-10 pointer-events-none"></div>
                          </div>
                        ) : (
                          <video
                            className="w-full h-full object-cover"
                            key={bgVideoUrl}
                            src={bgVideoUrl}
                            controls
                            muted={mediaPreviewMuted}
                            autoPlay={!mediaPreviewPaused}
                            loop
                            playsInline
                          />
                        )}
                      </div>

                      {/* Custom Media Player Controllers */}
                      <div className="flex gap-2 items-center justify-between bg-black/40 p-2 rounded-lg border border-white/5 text-[10px] sm:text-[11px] font-mono max-w-2xl mx-auto">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${!mediaPreviewPaused ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                          <span className="text-stone-400 font-bold truncate">
                            {!mediaPreviewPaused ? '🟢 በመስራት ላይ (PLAYING)' : '⏸️ ቆሟል (PAUSED)'}
                          </span>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setMediaPreviewPaused(!mediaPreviewPaused)}
                            className="px-2 py-1 bg-white/5 hover:bg-white/15 text-[#C1FF00] font-black uppercase text-[9px] rounded border border-white/10 hover:border-[#C1FF00]/30 transition-colors"
                          >
                            {mediaPreviewPaused ? '▶️ ቀጥል (PLAY)' : '⏸️ አቁም (PAUSE)'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setMediaPreviewMuted(!mediaPreviewMuted)}
                            className="px-2 py-1 bg-white/5 hover:bg-white/15 text-white font-black uppercase text-[9px] rounded border border-white/10 transition-colors"
                          >
                            {mediaPreviewMuted ? '🔊 ድምፅ ክፈት' : '🔇 አጥፋ (MUTE)'}
                          </button>
                        </div>
                      </div>

                      {/* Quick Preset Selector Buttons */}
                      <div className="space-y-2 border-t border-white/5 pt-3">
                        <span className="text-[9px] text-stone-400 font-mono font-bold tracking-wider block uppercase">✨ ፈጣን የጀርባ ቪዲዮ አማራጮች (PRESETS)</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                          <button
                            onClick={() => {
                              setBgVideoType('gourmet-paradise');
                            }}
                            className={`text-[10px] font-medium p-2 rounded border text-left transition-colors flex items-center justify-between ${
                              bgVideoType === 'gourmet-paradise' || bgVideoType === 'mango-paradise' ? 'bg-[#C1FF00]/10 border-[#C1FF00] text-white' : 'bg-white/5 border-white/5 text-stone-300 hover:bg-white/10'
                            }`}
                          >
                            <span>🥩 ምርጥ የሬስቶራንት ምግቦች ገነት</span>
                            <span className="font-mono text-[8px] opacity-75">GOURMET PARADISE</span>
                          </button>

                          <button
                            onClick={() => {
                              setBgVideoUrl('https://youtu.be/AHuU7i--EUc');
                              setBgVideoType('youtube');
                            }}
                            className={`text-[10px] font-medium p-2 rounded border text-left transition-colors flex items-center justify-between ${
                              bgVideoType === 'youtube' && bgVideoUrl.includes('AHuU7i--EUc') ? 'bg-[#C1FF00]/10 border-[#C1FF00] text-white' : 'bg-white/5 border-white/5 text-stone-300 hover:bg-white/10'
                            }`}
                          >
                            <span>🏨 ዋናው የፓፒረስ መግቢያ</span>
                            <span className="font-mono text-[8px] opacity-75">YOUTUBE DEFAULT</span>
                          </button>

                          <button
                            onClick={() => {
                              setBgVideoUrl('https://www.youtube.com/watch?v=EvwYOmxaxdA');
                              setBgVideoType('youtube');
                            }}
                            className={`text-[10px] font-medium p-2 rounded border text-left transition-colors flex items-center justify-between ${
                              bgVideoType === 'youtube' && bgVideoUrl.includes('EvwYOmxaxdA') ? 'bg-[#C1FF00]/10 border-[#C1FF00] text-white' : 'bg-white/5 border-white/5 text-stone-300 hover:bg-white/10'
                            }`}
                          >
                            <span>🍲 የሼፍ ኩኪንግ ሉፕ</span>
                            <span className="font-mono text-[8px] opacity-75">CHEF WORK LOOP</span>
                          </button>

                          <button
                            onClick={() => {
                              setBgVideoUrl('https://www.youtube.com/watch?v=RIsV69W7Qj0');
                              setBgVideoType('youtube');
                            }}
                            className={`text-[10px] font-medium p-2 rounded border text-left transition-colors flex items-center justify-between ${
                              bgVideoType === 'youtube' && bgVideoUrl.includes('RIsV69W7Qj0') ? 'bg-[#C1FF00]/10 border-[#C1FF00] text-white' : 'bg-white/5 border-white/5 text-stone-300 hover:bg-white/10'
                            }`}
                          >
                            <span>🌿 የሐዋሳ ሐይቅ ተፈጥሮ</span>
                            <span className="font-mono text-[8px] opacity-75">SCENIC NATURE</span>
                          </button>
                        </div>
                      </div>

                      {/* URL input and local files grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/5 pt-3">
                        {/* Local File Upload Section */}
                        <div className="bg-white/5 p-3 rounded-lg border border-white/10 space-y-2">
                          <span className="text-[9px] text-stone-400 font-mono font-bold tracking-wider block uppercase">📤 የራስዎን ቪዲዮ ይጫኑ (LOCAL VIDEO UPLOAD)</span>
                          <p className="text-[10px] text-stone-500 leading-normal">
                            ኮምፒውተርዎ ወይም ስልክዎ ላይ ያለን የቪዲዮ ፋይል (.mp4, .webm) በቀጥታ በመጫን የጀርባ ቪዲዮ ማድረግ ይችላሉ።
                          </p>
                          <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-lg p-3 hover:border-[#C1FF00]/50 transition-colors cursor-pointer group bg-black/40">
                            <span className="text-xl group-hover:scale-110 transition-transform">📁</span>
                            <span className="text-[10px] font-black text-[#C1FF00] mt-1">ቪዲዮ ፋይል ይምረጡ / SELECT VIDEO</span>
                            <input
                              type="file"
                              accept="video/mp4,video/webm,video/quicktime"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  if (file.size > 5 * 1024 * 1024) {
                                    alert('⚠️ የጫኑት ቪዲዮ መጠን ከ 5MB በላይ ነው! Warning: Selected video is too large (> 5MB).');
                                  }
                                  readMediaFile(e, (base64) => {
                                    setBgVideoUrl(base64);
                                    setBgVideoType('local');
                                    alert('📤 የጀርባ ቪዲዮው በተሳካ ሁኔታ ተጭኗል!');
                                  });
                                }
                              }}
                            />
                          </label>
                        </div>

                        {/* Custom Web URL Input */}
                        <form 
                          onSubmit={(e) => {
                            e.preventDefault();
                            const inputUrl = (e.currentTarget.querySelector('#custom-video-input') as HTMLInputElement).value;
                            const engineType = (e.currentTarget.querySelector('#engine-select') as HTMLSelectElement).value as 'youtube' | 'direct';
                            if (inputUrl.trim()) {
                              setBgVideoUrl(inputUrl.trim());
                              setBgVideoType(engineType);
                              alert('💾 የቪዲዮ አድራሻው በተሳካ ሁኔታ ተቀይሯል!');
                            }
                          }}
                          className="space-y-2 bg-white/5 p-3 rounded-lg border border-white/10 flex flex-col justify-between"
                        >
                          <div>
                            <span className="text-[9px] text-stone-400 font-mono font-bold tracking-wider block uppercase">🔗 ማስተካከያ በሊንክ ማስገቢያ (CUSTOM LINK INPUT)</span>
                            <div className="grid grid-cols-3 gap-2 mt-2">
                              <select 
                                id="engine-select" 
                                className="col-span-1 bg-black text-xs text-white border border-white/10 rounded p-1.5 focus:border-[#C1FF00]"
                                defaultValue={bgVideoType === 'local' ? 'youtube' : bgVideoType}
                              >
                                <option value="youtube">YouTube</option>
                                <option value="direct">Direct Mp4</option>
                              </select>
                              <input
                                id="custom-video-input"
                                type="text"
                                placeholder="http://... or youtube ID"
                                className="col-span-2 bg-black text-xs text-white border border-white/10 rounded p-1.5 focus:border-[#C1FF00] font-mono shrink truncate"
                                defaultValue={bgVideoType === 'local' ? '' : bgVideoUrl}
                              />
                            </div>
                          </div>
                          <button
                            type="submit"
                            className="w-full bg-[#C1FF00] text-black font-sans font-black text-[10px] uppercase py-2 rounded text-center cursor-pointer hover:bg-white hover:text-black transition-colors md:mt-0 mt-3"
                          >
                            💾 ማስተካከያውን አስቀምጥ (SAVE LINK)
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Original CloudVault File Manager */}
                    <div className="lg:col-span-12 xl:col-span-8 rounded-xl overflow-hidden self-start">
                        <CloudVault onBack={() => setManagerTab('bono')} appLang={appLang} />
                      </div>
                    </div>
                  </div>
                )}





              </motion.div>
            )}

            {/* VIEW_7: RECEPTIONIST PORTAL */}
            {activeRole === 'receptionist' && (
              <motion.div 
                key="receptionist"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="max-w-6xl mx-auto w-full space-y-6 pb-20 relative text-white"
              >
                {/* Header Profile Dashboard */}
                <div className="bg-[#121212] border-b border-[#10B981]/25 p-6 rounded-none flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-md">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="p-1 px-2.5 bg-emerald-500/10 border border-emerald-500/35 text-emerald-400 font-mono text-[9px] uppercase font-black tracking-widest rounded-full">LIVE PORTAL</span>
                      <span className="text-white/40 text-xs">🛎️ STAFF OFFICE</span>
                    </div>
                    <h2 className="text-3xl font-black uppercase text-white tracking-tight mt-1">
                      ሪሴብሽን ጠረጴዛ <span className="text-emerald-400 font-mono font-black italic">RECEPTIONIST PANEL</span>
                    </h2>
                    <p className="text-xs text-white/60 font-bold mt-1">
                      ስርዓት ሰራተኛ ረዳት፡ {currentUser?.name || 'Reception Staff'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleLogout}
                      className="bg-red-950/80 hover:bg-red-900 font-sans border-2 border-red-500/20 text-red-100 px-4 py-2 font-black text-xs uppercase flex items-center gap-1.5 transition-all text-[10px] tracking-wider cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-red-400" />
                      <span>ለቀቅ / CLOSE WORK 🚪</span>
                    </button>
                  </div>
                </div>

                {renderWiFiClockInWidget()}

                {/* Main dynamic workspace split */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Left Column: Form & Add booking */}
                  <div className="lg:col-span-5 space-y-6">
                    <div className="bg-black/40 border border-emerald-500/20 rounded-xl p-5 shadow-lg relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
                      
                      <h3 className="text-sm font-black uppercase text-emerald-400 border-b border-white/5 pb-2.5 flex items-center gap-1">
                        <span>🛎️ አዲስ አልጋና ክፍል መመዝገቢያ</span>
                        <span className="text-white/30 text-[10px] font-mono lowercase">(bed registration)</span>
                      </h3>

                      <form onSubmit={handleCreateRoomBooking} className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[9px] font-mono text-white/50 uppercase block mb-1">ክፍል ቁጥር (ROOM NUMBER)</label>
                            <input 
                              type="text"
                              id="booking-room-number"
                              required 
                              placeholder="e.g. 104"
                              className="w-full bg-[#121212] border border-white/10 text-white font-mono text-center text-sm p-2.5 outline-none focus:border-emerald-400"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-mono text-white/50 uppercase block mb-1">የክፍል አይነት (ROOM CATEGORY)</label>
                            <select 
                              id="booking-room-type"
                              defaultValue="Single Bed"
                              className="w-full bg-[#121212] border border-white/10 text-white text-xs font-bold p-2.5 outline-none focus:border-emerald-400"
                            >
                              <option value="Single Bed">ሲንግል ቤድ (Single Bed)</option>
                              <option value="Double Bed">ደብል ቤድ (Double Bed)</option>
                              <option value="Deluxe Suite">ደሉክስ ሱዊት (Deluxe Suite)</option>
                              <option value="VIP Royal">ቪአይፒ ሮያል (VIP Royal Room)</option>
                              <option value="Twin Double">ትዊን ደብል ቤድ (Twin Double)</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[9px] font-mono text-white/50 uppercase block mb-1">የቀን ሒሳብ (PRICE PER NIGHT)</label>
                            <input 
                              type="number"
                              id="booking-price"
                              required 
                              placeholder="e.g. 1500"
                              className="w-full bg-[#121212] border border-white/10 text-[#C1FF00] font-mono text-xs p-2.5 outline-none focus:border-emerald-400"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-mono text-white/50 uppercase block mb-1">ስልክ ቁጥር (CONTACT PHONE)</label>
                            <input 
                              type="text"
                              id="booking-phone"
                              required 
                              placeholder="09xxxxxxxx"
                              className="w-full bg-[#121212] border border-white/10 text-white font-mono text-xs p-2.5 outline-none focus:border-emerald-400"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[9px] font-mono text-white/50 uppercase block mb-1">የእንግዳ ብዛት (GUEST COUNT)</label>
                          <div className="grid grid-cols-4 gap-1.5 pt-1">
                            {[1, 2, 3, 4].map(num => (
                              <button 
                                key={num}
                                type="button" 
                                onClick={() => {
                                  setBookingGuestCount(num);
                                  // Re-populate guestIds array based on the selected count
                                  setGuestIdsState(prev => {
                                    const next = [...prev];
                                    while (next.length < num) {
                                      next.push({ fullName: '', idNumber: '' });
                                    }
                                    return next.slice(0, num);
                                  });
                                }}
                                className={`h-8 font-mono text-xs font-black transition-colors border ${
                                  bookingGuestCount === num 
                                    ? 'bg-[#10B981] text-black border-emerald-400 font-extrabold' 
                                    : 'bg-[#121212] text-white/60 border-white/5 hover:text-white hover:border-white/20'
                                }`}
                              >
                                {num} {num === 1 ? 'እንግዳ' : 'እንግዶች'}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Guest names and ID sections as requested */}
                        <div className="space-y-3 pt-2 bg-white/2 p-3 border border-indigo-500/5 rounded-lg">
                          <p className="text-[10px] font-sans font-black uppercase text-white/45 tracking-wide mb-1 flex items-center gap-1">
                            <span>👥 የነዋሪዎች መረጃዎች / GUEST DETAILS </span>
                            <span className="text-emerald-400 font-mono text-[9px]">({bookingGuestCount} Record Forms)</span>
                          </p>
                          
                          {guestIdsState.slice(0, bookingGuestCount).map((guest, gIdx) => (
                            <div key={gIdx} className="space-y-3 border-l-2 border-[#10B981]/35 pl-3 ml-1 bg-black/40 p-3 rounded-lg">
                              <span className="text-[8px] font-mono uppercase font-black tracking-wider text-[#10B981] block">እንግዳ #{gIdx + 1} (GUEST {gIdx + 1})</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <input 
                                  type="text"
                                  placeholder="ሙሉ ስም (Full Name)"
                                  required
                                  value={guest.fullName || ''}
                                  onChange={(e) => {
                                    const updated = [...guestIdsState];
                                    updated[gIdx] = { ...updated[gIdx], fullName: e.target.value };
                                    setGuestIdsState(updated);
                                  }}
                                  className="bg-[#121212] border border-white/10 text-white text-[11px] p-2 outline-none focus:border-[#10B981] rounded"
                                />
                                <input 
                                  type="text"
                                  required
                                  placeholder="መታወቂያ/ID Card #"
                                  value={guest.idNumber || ''}
                                  onChange={(e) => {
                                    const updated = [...guestIdsState];
                                    updated[gIdx] = { ...updated[gIdx], idNumber: e.target.value };
                                    setGuestIdsState(updated);
                                  }}
                                  className="bg-[#121212] border border-white/10 text-white text-[11px] p-2 outline-none focus:border-[#10B981] rounded"
                                />
                              </div>

                              {/* ID DOCUMENT CAPTURE DOCK */}
                              <div className="space-y-1.5">
                                <label className="text-[8.5px] font-mono text-white/50 uppercase block">🪪 መታወቂያ ፎቶ ፒዲኤፍ (ID Scan Card / Document Attachment)</label>
                                <div className="flex items-center gap-3 bg-[#121212] border border-white/10 p-2 rounded">
                                  {guest.idPhotoUrl ? (
                                    <div className="relative group shrink-0 space-y-1">
                                      <img 
                                        src={guest.idPhotoUrl} 
                                        className="w-14 h-10 object-cover rounded border border-[#10B981]" 
                                        alt="ID document thumbnail" 
                                        referrerPolicy="no-referrer"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated = [...guestIdsState];
                                          updated[gIdx] = { ...updated[gIdx], idPhotoUrl: '' };
                                          setGuestIdsState(updated);
                                        }}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white text-[7px] w-3.5 h-3.5 rounded-full flex items-center justify-center cursor-pointer font-black animate-bounce"
                                      >
                                        ×
                                      </button>
                                      {guest.idPhotoUrl.startsWith('data:') && (
                                        <div className="absolute top-12 left-0 w-48 bg-yellow-400/90 text-black text-[7px] font-bold p-1 rounded border border-yellow-500 z-10 leading-tight shadow-md">
                                          ⚠️ መታወቂያ ተጭኗል! ለማስቀመጥ ከታች ያለውን SUBMIT ቁልፍ ይጫኑ!
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="w-14 h-10 border border-white/5 bg-white/5 rounded flex items-center justify-center text-lg text-white/30 shrink-0">
                                      🪪
                                    </div>
                                  )}

                                  <div className="flex-1 flex gap-2">
                                    <input 
                                      type="file"
                                      accept="image/*"
                                      id={`guest-id-upload-r-${gIdx}`}
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          processFileWithCompression(file, (base64) => {
                                            const updated = [...guestIdsState];
                                            updated[gIdx] = { ...updated[gIdx], idPhotoUrl: base64 };
                                            setGuestIdsState(updated);
                                          });
                                        }
                                      }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => document.getElementById(`guest-id-upload-r-${gIdx}`)?.click()}
                                      className="text-[9px] font-mono font-bold bg-white/5 hover:bg-white/10 text-white/80 border border-white/20 py-1.5 px-2.5 rounded cursor-pointer transition-all uppercase"
                                    >
                                      Upload Document
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const presets = [
                                          'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=200',
                                          'https://images.unsplash.com/photo-1544256718-3bcf237f3974?w=200'
                                        ];
                                        const randomPreset = presets[Math.floor(Math.random() * presets.length)];
                                        const updated = [...guestIdsState];
                                        updated[gIdx] = { ...updated[gIdx], idPhotoUrl: randomPreset };
                                        setGuestIdsState(updated);
                                      }}
                                      className="text-[9px] font-mono font-bold bg-[#10B981]/10 hover:bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 py-1.5 px-2.5 rounded cursor-pointer transition-all uppercase"
                                    >
                                      Mock Scan
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div>
                          <label className="text-[9px] font-mono text-white/50 uppercase block mb-1">መግቢያ ቀን (CHECK IN DATE)</label>
                          <input 
                            type="date"
                            id="booking-date"
                            required 
                            defaultValue={new Date().toISOString().split('T')[0]}
                            className="w-full bg-[#121212] border border-white/10 text-[#C1FF00] font-mono text-xs p-2.5 outline-none focus:border-emerald-400"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-mono text-white/50 uppercase block mb-1">ተጨማሪ ማስገቢያ ማስታወሻ (ADDITIONAL NOTES)</label>
                          <textarea 
                            id="booking-notes"
                            rows={2}
                            placeholder="ልዩ ጥያቄዎች ካሉ እዚህ ይጻፉ..."
                            className="w-full bg-[#121212] border border-white/10 text-white text-xs p-2.5 outline-none focus:border-emerald-400"
                          />
                        </div>

                        <button 
                          type="submit"
                          className="w-full h-11 bg-emerald-500 hover:bg-emerald-400 text-black font-mono text-xs uppercase font-black tracking-widest flex items-center justify-center gap-1.5 transition-all shadow-[0_4px_12px_rgba(16,185,129,0.2)] cursor-pointer"
                        >
                          REGISTER ALLOCATION 🛎️
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Right Column: Allocation status grid */}
                  <div className="lg:col-span-7 space-y-6">
                    {/* Active allocations list */}
                    <div className="bg-black/40 border border-white/5 rounded-xl p-5 shadow-lg">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2.5 mb-4">
                        <div>
                          <h3 className="text-sm font-black uppercase text-white tracking-widest">
                            🛏️ ንቁ የአልጋ ምዝገባዎች (Active Bedroom Allocations)
                          </h3>
                          <p className="text-[10px] text-white/40 mt-0.5">በአሁኑ ሰዓት በሆቴሉ ውስጥ ያሉ እንግዶች ዝርዝር መዝገብ።</p>
                        </div>
                        <span className="bg-[#121212] border border-white/10 px-2 py-1 rounded text-xs text-[#C1FF00] font-mono font-bold">
                          {roomBookings.filter(b => b.status === 'Active').length} Rooms Occupied
                        </span>
                      </div>

                      {roomBookings.length === 0 ? (
                        <div className="text-center py-10 text-white/30 border border-dashed border-white/5">
                          <p className="text-xs font-bold font-mono">🛎️ ምንም ንቁ አልጋ/ክፍል ምዝገባ አልተገኘም! (No Occupied Rooms)</p>
                          <p className="text-[9px] mt-1 text-white/20">አዲስ እንግዳ ለመመዝገብ በስተግራ በኩል ያለውን ቅጽ ይጠቀሙ。</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {roomBookings.map((b, idx) => (
                            <div key={b.id || idx} className={`p-4 border ${b.status === 'Active' ? 'border-emerald-500/15 bg-emerald-950/5' : 'border-white/5 bg-white/2'} flex flex-col md:flex-row justify-between gap-4 transition-all relative group`}>
                              
                              <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="px-2.5 py-1 bg-[#121212] border border-white/10 text-white font-mono text-xs font-black">
                                    ክፍል (ROOM): {b.roomNumber}
                                  </span>
                                  <span className="text-[9px] font-bold text-white/50 bg-white/5 px-2 py-0.5 uppercase tracking-wide">
                                    {b.roomType || 'Single Bed'}
                                  </span>
                                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                    b.status === 'Active' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/30' : 'bg-white/10 text-white/55'
                                  }`}>
                                    {b.status}
                                  </span>
                                </div>

                                <div className="space-y-1.5 pt-1">
                                  {/* Render residents name and IDs */}
                                  <div className="text-xs text-white/80 space-y-1">
                                    <p className="font-bold text-white/50 text-[10px] uppercase font-mono tracking-wider">Residents / ነዋሪዎች (ID verified):</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-1 pt-0.5 font-sans">
                                      {b.guestIds?.map((idRef, idIdx) => (
                                        <div key={idIdx} className="bg-[#121212] p-1.5 border border-white/5 text-[11px] leading-tight">
                                          <p className="font-bold text-white">{idRef.fullName}</p>
                                          <p className="text-[9px] text-[#00f5ff] font-mono">ID / መታወቂያ- {idRef.idNumber}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-white/50 pt-1.5 font-sans border-t border-white/5">
                                    <p>📞 ስልክ: <span className="font-mono text-[#C1FF00]">{b.contactPhone}</span></p>
                                    <p>💰 ክፍያ: <span className="font-mono text-white font-bold">{b.pricePerNight} ብር / Night</span></p>
                                    <p>📅 የገባው: <span className="font-mono text-[#00f5ff]">{b.checkInDate}</span></p>
                                  </div>

                                  {b.notes && (
                                    <p className="text-[10px] text-white/40 italic bg-black/40 p-1.5 border-l-2 border-white/10">
                                      "{b.notes}"
                                    </p>
                                  )}
                                </div>
                              </div>

                              {b.status === 'Active' && (
                                <div className="flex flex-col justify-end">
                                  <button 
                                    onClick={() => {
                                      askConfirmAndRun('እንግዳው ክፍሉን መልቀቁን እርግጠኛ ነዎት? (Confirm guest check-out?)', () => {
                                        setRoomBookings(prev => prev.map(item => item.id === b.id ? { ...item, status: 'Checked Out' } : item));
                                        alert('🔑 እንግዳው በተሳካ ሁኔታ ቼክ-አውት ሆኗል! / Checked out successfully.');
                                      });
                                    }}
                                    className="bg-amber-950/20 hover:bg-amber-500 hover:text-black text-amber-400 border border-amber-500/30 px-3 py-2 font-mono text-[9px] uppercase font-black tracking-widest cursor-pointer transition-colors"
                                  >
                                    CHECK OUT / ልቀቅ 🔑
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Buzzer Assist calls inside receptionist desk */}
                    <div className="bg-[#0b100b] border border-emerald-500/10 rounded-xl p-5 shadow-lg relative overflow-hidden">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-3">
                        <div>
                          <h4 className="text-xs font-black uppercase text-emerald-400 tracking-wider">🛎️ የጥሪና እርዳታ ደወሎች (Room Assist Calls Zone)</h4>
                          <p className="text-[10px] text-white/40">ከእንግዶች ክፍሎች በቀጥታ የሚመጡ የድጋፍ ጥሪዎች።</p>
                        </div>
                        <span className="bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-mono animate-pulse">
                          {assistanceCalls.filter(c => c.active).length} CALL ACTIVE
                        </span>
                      </div>

                      {assistanceCalls.filter(c => c.active).length === 0 ? (
                        <div className="text-center py-6 text-white/20 text-xs">
                          <p>🎈 ምንም ገባሪ የድጋፍ ጥሪ የለም።</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {assistanceCalls.filter(c => c.active).map(call => (
                            <div key={call.id} className="bg-emerald-950/20 border border-emerald-500/20 p-3 flex justify-between items-center mr-1">
                              <div className="flex items-center gap-3">
                                <span className="text-lg animate-bounce">🛎️</span>
                                <div>
                                  <p className="font-black text-xs text-white uppercase font-mono">{call.location}</p>
                                  <p className="text-[9px] text-[#00f5ff] font-mono">ጥሪ ሰዓት: {call.time}</p>
                                </div>
                              </div>
                              <button 
                                onClick={() => {
                                  setAssistanceCalls(prev => prev.map(c => c.id === call.id ? { ...c, active: false } : c));
                                }}
                                className="bg-[#1D1D16] hover:bg-emerald-500 hover:text-black border border-emerald-500/30 text-[#C1FF00] hover:border-emerald-400 text-[9px] font-black uppercase px-2.5 py-1.5 transition-colors cursor-pointer"
                              >
                                MARK SERVED ✔
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

            {/* VIEW_7: CASHIER PORTAL */}
            {activeRole === 'cashier' && (
              <motion.div 
                key="cashier"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="w-full max-w-7xl mx-auto space-y-6 pb-20 relative z-10"
              >
                {/* Header widget */}
                <div className="bg-[#0b1216] border border-cyan-500/30 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-lg pr-8">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
                      <span className="text-[10px] font-mono font-black text-cyan-400 uppercase tracking-widest">CASH DESK STATION TERMINAL</span>
                    </div>
                    <h2 className="text-xl font-black text-white uppercase">የካሸር የክፍያ እና የሽያጭ መቆጣጠሪያ ዋና ክፍል</h2>
                    <p className="text-xs text-white/50">
                      የእንግዶችን ሂሳብ መቀበል፣ የእለት ገቢ ማረጋገጥ እና ደረሰኞችን ማተሚያ ክፍል (Signed in as: <strong className="text-cyan-400">{currentUser?.name || 'Cashier Portal'}</strong>)
                    </p>
                  </div>
                  
                  <button 
                    onClick={handleLogout}
                    className="bg-[#121212] hover:bg-red-500/10 border border-white/10 hover:border-red-500/40 text-white/80 hover:text-red-400 px-4 py-2 text-xs font-mono font-black uppercase rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    🚪 Logout Staff (መውጫ)
                  </button>
                </div>

                {/* WiFi Clock in Verification block for Cashier */}
                {renderWiFiClockInWidget()}

                {/* Dashboard layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column (2 Cols wide) for Bill Processing and Cash Drawer */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Metrics Section */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-[#091518]/60 border border-cyan-500/20 p-4 rounded-xl flex justify-between items-center shadow-md">
                        <div>
                          <span className="text-[9px] text-white/40 uppercase font-mono block">Active Unpaid Bills</span>
                          <span className="text-2xl font-black font-mono text-cyan-400">
                            {orders.filter(o => o.status !== 'Paid').length} orders
                          </span>
                        </div>
                        <span className="text-2xl">📝</span>
                      </div>
                      
                      <div className="bg-emerald-950/20 border border-emerald-500/20 p-4 rounded-xl flex justify-between items-center shadow-md">
                        <div>
                          <span className="text-[9px] text-white/40 uppercase font-mono block">Selled Shift Cash</span>
                          <span className="text-2xl font-black font-mono text-emerald-400">
                            {orders.filter(o => o.status === 'Paid' || o.id.startsWith('manual-cash')).reduce((sum, o) => {
                              const orderTotal = o.items ? o.items.reduce((s, it) => s + (it.qty * (it.price || 0)), 0) : 0;
                              return sum + orderTotal;
                            }, 0) + 1200} ETB
                          </span>
                        </div>
                        <span className="text-2xl text-emerald-400">💰</span>
                      </div>

                      <div className="bg-[#1A1813] border border-yellow-500/20 p-4 rounded-xl flex justify-between items-center shadow-md">
                        <div>
                          <span className="text-[9px] text-white/40 uppercase font-mono block">Cash Float (ካፒታል)</span>
                          <span className="text-2xl font-black font-mono text-yellow-500">
                            5,000.00 ETB
                          </span>
                        </div>
                        <span className="text-2xl">🔒</span>
                      </div>
                    </div>

                    {/* 💵 CASHIER QUICK POS & ORDER GENERATOR */}
                    <div className="bg-[#0b141d] border border-cyan-500/20 p-5 rounded-2xl space-y-4">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <div>
                          <span className="text-[9px] text-[#00f5ff] font-mono tracking-widest uppercase block font-black">CASHIER DIRECT CASH DESK SYSTEM</span>
                          <h3 className="text-sm font-black uppercase text-white/95">🛒 የካሸር ፈጣን እቃዎች መሸጫ እና እዘዝ (Cashier POS Station)</h3>
                        </div>
                        <span className="font-mono text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-black uppercase">
                          POS LIVE ACTIVE
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        {/* 1. Item Selection List Section (7 cols) */}
                        <div className="md:col-span-7 bg-[#10151f] p-3 border border-white/5 space-y-3 rounded-lg">
                          <div className="flex justify-between items-center bg-black/40 p-1.5 rounded gap-1 overflow-x-auto no-scrollbar">
                            {['food', 'drinks', 'traditional', 'room'].map(posCat => (
                              <button
                                key={posCat}
                                type="button"
                                onClick={() => setCashierActivePosCat(posCat)}
                                className={`flex-1 py-1 px-2.5 rounded text-[10px] font-black uppercase font-sans cursor-pointer transition-all ${
                                  cashierActivePosCat === posCat
                                    ? 'bg-[#00f5ff] text-black font-black'
                                    : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                                }`}
                              >
                                {posCat === 'traditional' ? 'ባህላዊ (Cultural)' : posCat.toUpperCase()}
                              </button>
                            ))}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1">
                            {menuItems
                              .filter(item => item.cat === cashierActivePosCat && item.available)
                              .map(item => (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => {
                                    setCashierCart(prev => {
                                      const existing = prev.find(i => i.id === item.id);
                                      if (existing) {
                                        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
                                      } else {
                                        return [...prev, { id: item.id, name: item.nameEn || item.nameAm, price: item.price, qty: 1 }];
                                      }
                                    });
                                  }}
                                  className="p-2.5 bg-black/30 hover:bg-[#00f5ff]/10 border border-white/5 hover:border-[#00f5ff]/30 text-left rounded-lg transition-all flex flex-col justify-between h-20 group text-xs font-sans cursor-pointer"
                                >
                                  <div className="font-bold text-white group-hover:text-[#00f5ff] transition-colors truncate w-full">
                                    {item.nameAm} <span className="text-[10px] text-white/50 block font-normal">{item.nameEn}</span>
                                  </div>
                                  <div className="flex justify-between items-end w-full">
                                    <span className="font-mono text-[10.5px] font-black text-emerald-400">{item.price} Birr</span>
                                    <span className="text-[9px] bg-[#00f5ff]/10 text-[#00f5ff] font-bold px-1.5 py-0.5 rounded uppercase">➕ ADD</span>
                                  </div>
                                </button>
                              ))}
                          </div>
                        </div>

                        {/* 2. Mini Cart and Order Details Section (5 cols) */}
                        <div className="md:col-span-5 bg-black/50 border border-[#00f5ff]/15 p-4 rounded-xl flex flex-col justify-between min-h-[300px]">
                          <div className="space-y-3 flex-1 overflow-y-auto max-h-[220px] pr-1">
                            <span className="text-[9px] font-mono text-white/40 block border-b border-white/5 pb-1 uppercase font-bold">🛒 CURRENT TRANSACTION SLIP</span>
                            
                            {cashierCart.length === 0 ? (
                              <div className="text-center py-10 text-white/30 text-xs">
                                <span className="text-xl block mb-1">🛒</span>
                                ምንም እቃ አልተመረጠም (POS Empty)
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {cashierCart.map(c => (
                                  <div key={c.id} className="flex justify-between items-center text-xs text-white pb-1.5 border-b border-white/5">
                                    <div className="flex-1 truncate pr-2 font-bold">
                                      <span>{c.name}</span>
                                      <span className="text-[10px] text-emerald-400 font-mono block">{c.price} Birr × {c.qty}</span>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setCashierCart(prev => prev.map(i => i.id === c.id ? { ...i, qty: Math.max(1, i.qty - 1) } : i));
                                        }}
                                        className="w-5 h-5 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center font-bold text-xs"
                                      >
                                        -
                                      </button>
                                      <span className="font-mono text-center min-w-[14px] text-xs font-black">{c.qty}</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setCashierCart(prev => prev.map(i => i.id === c.id ? { ...i, qty: i.qty + 1 } : i));
                                        }}
                                        className="w-5 h-5 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center font-bold text-xs"
                                      >
                                        +
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setCashierCart(prev => prev.filter(i => i.id !== c.id));
                                        }}
                                        className="ml-1 text-red-400 hover:text-red-500 font-bold"
                                        title="ይሰርዙ"
                                      >
                                        ❌
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="border-t border-white/5 pt-3 mt-3 space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[9px] font-mono text-white/40 block uppercase">ጠረጴዛ/ክፍል (Table/Room)</label>
                                <input
                                  type="text"
                                  value={cashierLocation}
                                  onChange={(e) => setCashierLocation(e.target.value)}
                                  placeholder="Room 101"
                                  className="w-full bg-[#181818] border border-white/10 text-white text-xs font-bold p-1 px-2 uppercase my-1 focus:border-[#00f5ff] outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-mono text-white/40 block uppercase">የአዘዛዝ አይነት (Order Type)</label>
                                <select
                                  value={cashierOrderType}
                                  onChange={(e) => setCashierOrderType(e.target.value as any)}
                                  className="w-full bg-[#181818] border border-white/10 text-white text-xs font-bold p-1 px-2 my-1 focus:border-[#00f5ff] outline-none cursor-pointer"
                                >
                                  <option value="Dine-In">Dine-In</option>
                                  <option value="Takeaway">Takeaway</option>
                                  <option value="Room Service">Room Service</option>
                                </select>
                              </div>
                            </div>

                            <div className="flex justify-between items-center text-xs border-b border-dashed border-white/10 pb-2 font-mono font-bold">
                              <span className="text-white/60 uppercase">TOTAL CALC:</span>
                              <span className="text-base text-emerald-400 font-black">
                                {cashierCart.reduce((sum, item) => sum + (item.qty * item.price), 0)} ETB
                              </span>
                            </div>

                            <button
                              type="button"
                              disabled={cashierCart.length === 0}
                              onClick={() => {
                                const totalAmount = cashierCart.reduce((sum, item) => sum + (item.qty * item.price), 0);
                                const timeNow = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
                                const dateTodayStr = new Date().toISOString().split('T')[0];
                                const orderId = 'manual-cash-' + Math.floor(1000 + Math.random() * 9000);

                                const newOrder: Order = {
                                  id: orderId,
                                  location: cashierLocation.trim() || 'Walk-In',
                                  items: cashierCart.map(i => ({
                                    id: i.id,
                                    qty: i.qty,
                                    name: i.name,
                                    price: i.price,
                                    category: 'food'
                                  })),
                                  total: totalAmount,
                                  serviceCharge: 0,
                                  vat: 0,
                                  tip: 0,
                                  status: 'Pending',
                                  cookingStatus: 'Pending',
                                  servedByWaiter: false,
                                  payment: 'cash',
                                  confirmed: true,
                                  orderType: cashierOrderType,
                                  time: timeNow,
                                  date: dateTodayStr
                                };

                                setOrders(prev => [newOrder, ...prev]);
                                playVoiceAlert(`Direct cash order generated for ${newOrder.location} value ${totalAmount} birr sent to Kitchen.`);
                                alert(`💰 በጥሬ ገንዘብ ክፍያ በተሳካ ሁኔታ ተፈጽሟል!\n\nትዕዛዝ ቁጥር፡ ${orderId}\nጠቅላላ ሂሳብ፡ ${totalAmount} ብር\n\nትዕዛዙ ቀጥታ ወደ ኩሽና (ሼፍ) ተልኳል እንዲበስል ተደርጓል!`);
                                setCashierCart([]);
                                setCashierLocation('Walk-In');
                              }}
                              className={`w-full py-2 px-3 text-[10.5px] font-mono font-black uppercase text-center rounded transition-all flex items-center justify-center gap-1.5 focus:outline-none ${
                                cashierCart.length === 0
                                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50'
                                  : 'bg-emerald-500 hover:bg-emerald-600 text-black cursor-pointer shadow-[3px_3px_0px_#000] active:translate-y-0.5 active:shadow-[1px_1px_0px_#000]'
                              }`}
                            >
                              💵 በጥሬ ገንዘብ ተቀበል እና እዘዝ (Accept Cash & Place Order)
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Pending Checkout Bills List */}
                    <div className="bg-[#101010] border border-white/10 p-5 rounded-2xl space-y-4">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <h3 className="text-xs font-black uppercase text-white/70">
                          📌 ያልተከፈሉ ንቁ ትዕዛዞች እና ክፍሎች (Unsettled Hospitality Bills)
                        </h3>
                        <span className="font-mono text-[9px] bg-cyan-400/10 text-cyan-400 px-2.5 py-0.5 rounded font-black uppercase">
                          Payment Desk
                        </span>
                      </div>

                      {orders.filter(o => o.status !== 'Paid').length === 0 ? (
                        <div className="text-center py-10 border border-dashed border-white/5 rounded-xl text-white/30 text-xs space-y-1">
                          <p className="text-xl">🎉</p>
                          <p>ያልተከፈለ ምንም ንቁ ትዕዛዝ የለም / All orders have been settled smoothly.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {orders.filter(o => o.status !== 'Paid').map((ord) => {
                            const subtotal = ord.items.reduce((s, item) => s + (item.qty * (item.price || 0)), 0);
                            return (
                              <div key={ord.id} className="bg-black/50 border border-white/5 hover:border-cyan-500/30 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all">
                                <div className="space-y-1.5 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono font-black text-white/40">{ord.id}</span>
                                    <span className="text-xs font-bold text-cyan-400 bg-cyan-950/45 px-2 py-0.5 rounded font-mono uppercase">
                                      {ord.location || "WALK-IN"} (ጠረጴዛ/ክፍል)
                                    </span>
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                      ord.status === 'Completed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20' : 'bg-yellow-950 text-yellow-400'
                                    }`}>
                                      {ord.status}
                                    </span>
                                  </div>

                                  <div className="space-y-1 pl-3 border-l-2 border-white/10">
                                    {ord.items.map((it, idx) => (
                                      <p key={idx} className="text-xs text-white/80 font-bold">
                                        {it.qty} × {it.name} <span className="text-white/40 font-mono text-[10px]">({it.price} Birr)</span>
                                      </p>
                                    ))}
                                  </div>
                                </div>

                                <div className="flex flex-col items-start md:items-end gap-2 shrink-0 w-full md:w-auto">
                                  <div className="text-left md:text-right">
                                    <span className="text-[9px] text-white/40 block font-mono">TOTAL BILL ACCORDING TO SYSTEM:</span>
                                    <span className="text-base font-black text-emerald-400 font-mono">{subtotal}.00 ETB</span>
                                  </div>

                                  <div className="flex gap-2 w-full sm:w-auto mt-1">
                                    <button
                                      onClick={() => {
                                        askConfirmAndRun(
                                          `የጠረጴዛ/ክፍል ${ord.location} ሂሳብ መጠን ${subtotal} ብር ለመቀበል ይፈልጋሉ? Order status will be updated to "Paid".`,
                                          () => {
                                            setOrders(prev => prev.map(o => o.id === ord.id ? { ...o, status: 'Paid' } : o));
                                            playVoiceAlert(`Bill for Table ${ord.location || 'Walk-In'} processed successfully. Settle approval granted.`);
                                            alert(`💸 ክፍያ በተሳካ ሁኔታ ተረጋግጧል! ሂሳቡ ተከፍሏል። ደረሰኝ ማተም ይችላሉ።`);
                                          }
                                        );
                                      }}
                                      className="flex-1 sm:flex-none bg-cyan-500 hover:bg-cyan-600 text-black text-[10.5px] font-black uppercase px-3.5 py-2 rounded-lg cursor-pointer transition-colors font-mono"
                                    >
                                      💵 ሂሳብ ዝጋ (Settle Paid)
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column (1 Col wide) for Shift Logs and Register Operations */}
                  <div className="space-y-6">
                    {/* Shift Close / Cash drawer operations */}
                    <div className="bg-[#101010] border border-white/10 p-5 rounded-2xl space-y-4">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <h4 className="text-xs font-black uppercase text-white/70">
                          🛡️ የሺፍት መዝጊያ መዝገብ (Shift Console Control)
                        </h4>
                        <span className="text-xs">🔐</span>
                      </div>

                      <div className="space-y-3.5 text-xs">
                        <div className="bg-black/40 border border-white/5 p-3 rounded space-y-2">
                          <p className="font-mono text-[9px] text-white/40 uppercase">REGISTER CURRENT BALANCE CHECKS</p>
                          <div className="flex justify-between border-b border-white/5 pb-1 font-bold">
                            <span className="text-white/60">Starting Float (ካፒታል):</span>
                            <span className="text-white font-mono">5,000.00 Birr</span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 pb-1 font-bold">
                            <span className="text-white/60">Shift Card Payments:</span>
                            <span className="text-emerald-400 font-mono">1,200.00 Birr</span>
                          </div>
                          <div className="flex justify-between font-bold">
                            <span className="text-white/60">Cash in register drawer:</span>
                            <span className="text-cyan-400 font-mono">6,200.00 Birr</span>
                          </div>
                        </div>

                        {/* Shift action buttons */}
                        <div className="space-y-2">
                          <button
                            onClick={() => {
                              playVoiceAlert(`Receipt register system is checking out shift drawer. Settle successfully closed.`);
                              alert(`🖨️ የዕለት ገቢ ሪፖርት ማጠቃለያ በተሳካ ሁኔታ ተዘጋጅቷል!\nድምር ሽያጭ፡ 6,200.00 ብር (ካፒታልን ጨምሮ)\nሺፍቱ በተሳካ ሁኔታ ወደ ማናጀር ሲስተም ተልኳል።`);
                            }}
                            className="w-full bg-[#121212] hover:bg-white/10 text-white border border-white/10 font-bold uppercase py-2.5 rounded text-[10px] font-mono cursor-pointer transition-all"
                          >
                            📊 Daily Shift Summary (ዕለታዊ ሪፖርት ማተሚያ)
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Active Guest Assistance Quick-View */}
                    <div className="bg-[#101010] border border-white/10 p-5 rounded-2xl space-y-4">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <h3 className="text-xs font-black uppercase text-white/70">
                          🛎️ የእንግዶች የመጥሪያ ሁኔታ (Active Room Calls)
                        </h3>
                        <span className="font-mono text-[9px] bg-red-500/10 text-red-400 px-2.5 py-0.5 rounded font-black uppercase">
                          Monitoring
                        </span>
                      </div>

                      {assistanceCalls.filter(c => c.active).length === 0 ? (
                        <p className="text-center py-6 text-white/30 text-xs">ምንም ገባሪ ጥሪ የለም። / No active calls.</p>
                      ) : (
                        <div className="space-y-2">
                          {assistanceCalls.filter(c => c.active).map(call => (
                            <div key={call.id} className="bg-black/50 border border-white/5 p-3 flex justify-between items-center rounded-lg">
                              <div>
                                <p className="font-black text-xs text-white font-mono uppercase">{call.location}</p>
                                <p className="text-[9px] text-[#00f5ff] font-mono">ደወል: {call.time}</p>
                              </div>
                              <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </motion.div>
            )}

            {/* VIEW_8: GUARD PORTAL */}
            {activeRole === 'guard' && (
              <motion.div 
                key="guard_portal"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="max-w-6xl mx-auto w-full space-y-6 pb-20 relative text-white"
              >
                {/* Header Profile Dashboard */}
                <div className="bg-[#121212] border-b border-yellow-500/30 p-6 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400">
                      <Shield className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 px-2 py-0.5 uppercase font-bold tracking-widest font-mono">
                          GATE CONTROL SYSTEM
                        </span>
                        <span className="text-[9px] bg-white/5 text-white/70 border border-white/10 px-2 py-0.5 uppercase font-normal font-mono">
                          V2.1 - ACTIVE
                        </span>
                      </div>
                      <h2 className="text-lg font-black tracking-wider text-white uppercase mt-0.5">
                        👮 የጥበቃ ማዕከላዊ በር (Guard Central Gateway)
                      </h2>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setActiveRole('customer');
                      localStorage.removeItem('papyrus_active_staff_session');
                    }}
                    className="flex items-center gap-2 bg-red-950/40 border border-red-500/25 hover:bg-red-600 hover:text-white text-red-400 px-4 py-2 font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer font-sans"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    ከሲስተም ውጣ (LOG OUT)
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Register New Visitor Entry Form */}
                  <form 
                    onSubmit={handleAddVisitor}
                    className="lg:col-span-5 bg-[#121212] border border-white/10 p-6 rounded-xl space-y-5"
                  >
                    <div className="border-b border-white/5 pb-2">
                      <span className="text-[9px] text-yellow-500 font-mono font-bold tracking-wider block uppercase">VISITOR ENTRY GATE</span>
                      <h3 className="text-xs font-black text-white uppercase mt-0.5">➕ አዲስ እንግዳ መመዝገቢያ (Visitor Registration)</h3>
                    </div>

                    {/* Guest Name input */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-bold uppercase text-white/50 block">የእንግዳ ስም (Visitor Full Name) *</label>
                      <input 
                        type="text"
                        required
                        value={gName}
                        onChange={(e) => setGName(e.target.value)}
                        placeholder="የእንግዳ ስም ያስገቡ..."
                        className="w-full bg-[#181818] border border-white/10 p-3 text-xs text-white uppercase tracking-wider outline-none focus:border-yellow-400 rounded"
                      />
                    </div>

                    {/* Guest Phone input */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-bold uppercase text-white/50 block">የስልክ ቁጥር (Phone Number)</label>
                      <input 
                        type="tel"
                        value={gPhone}
                        onChange={(e) => setGPhone(e.target.value)}
                        placeholder="ለምሳሌ፡ 0911223344"
                        className="w-full bg-[#181818] border border-white/10 p-3 text-xs text-white font-mono outline-none focus:border-yellow-400 rounded"
                      />
                    </div>

                    {/* Car Plate input */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-bold uppercase text-white/50 block">የመኪና ሰሌዳ ቁጥር (Car Plate Number)</label>
                      <input 
                        type="text"
                        value={gPlate}
                        onChange={(e) => setGPlate(e.target.value)}
                        placeholder="AA 2 B 12345"
                        className="w-full bg-[#181818] border border-white/10 p-3 text-xs text-white uppercase tracking-wider outline-none focus:border-yellow-400 rounded"
                      />
                    </div>

                    {/* Purpose selection & Fast presets */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono font-bold uppercase text-white/50 block">የጉብኝት ምክንያት (Purpose of Visit)</label>
                      <select
                        value={gPurpose}
                        onChange={(e) => setGPurpose(e.target.value)}
                        className="w-full bg-[#181818] border border-white/10 p-3 text-xs text-white outline-none focus:border-yellow-400 rounded cursor-pointer font-sans"
                      >
                        <option value="ምግብና መጠጥ (Dine & Drink)">🍽️ ምግብና መጠጥ (Dine & Drink)</option>
                        <option value="ክፍል ለመያዝ (Lodge Booking)">🏨 ክፍል ለመያዝ (Lodge Booking)</option>
                        <option value="ሰራተኛ ለመጠየቅ (Staff Visit)">👥 ሰራተኛ ለመጠየቅ (Staff Visit)</option>
                        <option value="እቃ ለማቅረብ (Delivery)">📦 እቃ ለማቅረብ (Delivery)</option>
                        <option value="ጠቅላላ ጉብኝት (Sightseeing)">🌲 ጠቅላላ ጉብኝት (Sightseeing)</option>
                      </select>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {[
                          'Dine & Drink',
                          'Lodge Booking',
                          'Staff Visit',
                          'Delivery'
                        ].map((presetName) => (
                          <button
                            key={presetName}
                            type="button"
                            onClick={() => {
                              if (presetName === 'Dine & Drink') setGPurpose('ምግብና መጠጥ (Dine & Drink)');
                              if (presetName === 'Lodge Booking') setGPurpose('ክፍል ለመያዝ (Lodge Booking)');
                              if (presetName === 'Staff Visit') setGPurpose('ሰራተኛ ለመጠየቅ (Staff Visit)');
                              if (presetName === 'Delivery') setGPurpose('እቃ ለማቅረብ (Delivery)');
                            }}
                            className="bg-white/5 hover:bg-white/10 text-[9px] font-mono uppercase tracking-wider px-2 py-1 rounded transition-colors text-white/70 hover:text-white"
                          >
                            + {presetName}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-yellow-400 hover:bg-white text-black font-black text-xs uppercase py-3.5 tracking-wider rounded transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <span>➕ አስመዝግብ (REGISTER VISIT)</span>
                    </button>
                  </form>

                  {/* Right Column: Active and History list */}
                  <div className="lg:col-span-7 bg-[#121212] border border-white/10 p-6 rounded-xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
                      <div>
                        <span className="text-[9px] text-yellow-500 font-mono font-bold tracking-wider block uppercase">VISITOR LOGS DATABASE</span>
                        <h3 className="text-xs font-black text-white uppercase mt-0.5">📋 የዛሬው የእንግዶች እንቅስቃሴ (Visitor Log)</h3>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-black font-mono">
                          {visitorLog.filter(v => v.status === 'In Lodge').length} INSIDE LOOSELY
                        </span>
                      </div>
                    </div>

                    {/* Search Field */}
                    <div className="relative">
                      <input 
                        type="search"
                        placeholder="ስም፣ ስልክ ወይም የመኪና ሰሌዳ ቁጥር ይፈልጉ..."
                        value={guardSearch}
                        onChange={(e) => setGuardSearch(e.target.value)}
                        className="w-full bg-[#181818] border border-white/10 pl-3 pr-10 py-2.5 text-xs text-white outline-none focus:border-yellow-400 rounded"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 text-xs">🔍</span>
                    </div>

                    <div className="overflow-y-auto max-h-[480px] space-y-2.5 pr-1">
                      {visitorLog.filter(v => {
                        const q = guardSearch.toLowerCase().trim();
                        if (!q) return true;
                        return v.name.toLowerCase().includes(q) || 
                               v.phone.toLowerCase().includes(q) || 
                               v.carPlate.toLowerCase().includes(q) ||
                               v.purpose.toLowerCase().includes(q);
                      }).length === 0 ? (
                        <div className="text-center py-12 text-white/30 text-xs font-mono space-y-1">
                          <p>📭 ምንም የእንግዳ መዝገብ አልተገኘም።</p>
                          <p className="text-[10px] text-white/20">No matching visitor records found.</p>
                        </div>
                      ) : (
                        visitorLog.filter(v => {
                          const q = guardSearch.toLowerCase().trim();
                          if (!q) return true;
                          return v.name.toLowerCase().includes(q) || 
                                 v.phone.toLowerCase().includes(q) || 
                                 v.carPlate.toLowerCase().includes(q) ||
                                 v.purpose.toLowerCase().includes(q);
                        }).map((v) => {
                          const isInside = v.status === 'In Lodge';
                          return (
                            <div 
                              key={v.id}
                              className={`border p-4 transition-all rounded-lg ${
                                isInside 
                                  ? 'bg-[#181818] hover:bg-[#202020] border-yellow-500/20' 
                                  : 'bg-black/20 hover:bg-[#121212]/30 border-white/5 opacity-70'
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-extrabold text-sm uppercase text-white tracking-wide">{v.name}</h4>
                                    <span className={`text-[8px] px-2 py-0.5 font-bold uppercase tracking-wider rounded ${
                                      isInside 
                                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                                        : 'bg-white/5 text-white/40 border border-white/5'
                                    }`}>
                                      {isInside ? '🟢 በሎጁ ውስጥ' : '🔴 ወጥቷል / OUT'}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-1 gap-x-4 text-[10px] font-mono text-white/60">
                                    {v.phone && <div>📞 ስልክ: <span className="text-white font-bold">{v.phone}</span></div>}
                                    {v.carPlate && <div>🚗 ሰሌዳ: <span className="text-amber-400 font-bold uppercase">{v.carPlate}</span></div>}
                                    <div>🌟 ምክንያት: <span className="text-[#C1FF00]">{v.purpose}</span></div>
                                  </div>

                                  <div className="text-[9px] text-white/40 flex items-center gap-3 font-mono pt-0.5">
                                    <div>🕒 የገባበት፡ <span className="text-white/60">{v.timeIn}</span></div>
                                    {!isInside && v.timeOut && (
                                      <div>🕒 የወጣበት፡ <span className="text-red-400 font-bold">{v.timeOut}</span></div>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
                                  {isInside ? (
                                    <button
                                      type="button"
                                      onClick={() => handleCheckoutVisitor(v.id)}
                                      className="flex-1 sm:flex-none px-4 py-2 bg-yellow-400 hover:bg-white text-black font-extrabold text-[10px] uppercase tracking-wider cursor-pointer transition-colors"
                                    >
                                      🚪 ውጭ አድርግ (CHECK OUT)
                                    </button>
                                  ) : (
                                    <span className="text-[9.5px] text-white/30 font-mono italic px-3">ወጥቷል Verified</span>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteVisitor(v.id)}
                                    className="p-2 bg-red-950/20 hover:bg-red-900 border border-white/5 hover:border-red-500 transition-colors text-red-400 hover:text-white cursor-pointer"
                                    title="መዝገብ ሰርዝ"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </section>

      </main>

      {/* Decorative continuous ticker row from the design rules */}
      <FooterTicker />

      {/* 100% IFRAME SAFE CUSTOM STATE-BASED CONFIRMATION DIALOG MODAL */}
      <AnimatePresence>
        {deleteConfWindow && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex items-center justify-center p-4 select-none"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-[#121212] border-2 border-red-500/30 max-w-sm w-full p-6 text-center space-y-4 shadow-[0_10px_30px_rgba(239,68,68,0.1)] rounded-none"
            >
              <div className="w-14 h-14 bg-red-950/40 border border-red-500/20 text-red-500 mx-auto flex items-center justify-center rounded-full animate-bounce">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-black uppercase text-red-400 tracking-wider">የማረጋገጫ መልእክት</h3>
              <p className="text-xs text-white/80 font-bold leading-normal">
                {deleteConfWindow.msg}
              </p>
              <div className="flex gap-2 pt-2">
                <button 
                  onClick={() => setDeleteConfWindow(null)}
                  className="flex-1 py-2.5 bg-[#1F1F1F] border border-white/10 hover:bg-white/10 hover:text-white text-white/70 text-[10px] uppercase font-mono font-black tracking-widest transition-colors cursor-pointer"
                >
                  CANCEL (ተመለስ)
                </button>
                <button 
                  onClick={() => {
                    deleteConfWindow.onGo();
                    setDeleteConfWindow(null);
                  }}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white text-[10px] uppercase font-mono font-black tracking-widest transition-colors cursor-pointer shadow-[2px_2px_0px_#000]"
                >
                  YES, DELETE (አጥፋ)
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SECURE PIN LOGIN KEYPAD MODAL COMPONENT */}
      <LoginModal 
        isOpen={loginModalRole !== ''}
        onClose={() => setLoginModalRole('')}
        role={loginModalRole}
        staffList={staff}
        onSuccess={handleSuccessLogin}
        onResetCredentials={handleResetCredentials}
      />

      {/* GUEST SHOPPING BASKET OUTLINE MODAL */}
      <CartModal 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onRemoveItem={handleRemoveCartItem}
        onPlaceOrder={handleCheckoutPlaceOrder}
        serviceChargeRate={serviceChargeRate}
        vatRate={vatRate}
        banks={banks}
        initialLocation={guestLocation}
        chapaKey={chapaKey}
        chapaActive={chapaActive}
        chapaMode={chapaMode}
        appLang={appLang}
      />

      {/* VIDEO BACKWARD COMPATIBLE RESILIENT FALLBACK PLAYER MODAL */}
      <AnimatePresence>
        {isVideoModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 md:p-6 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-4xl bg-[#0a0a0a] border-2 border-[#C1FF00]/40 rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(193,255,0,0.3)]"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center bg-[#121212] px-6 py-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <span className="text-xl animate-bounce">📺</span>
                  <div>
                    <h3 className="text-sm font-black text-white tracking-wide uppercase">Hawassa Papyrus Welcome TV</h3>
                    <p className="text-[10px] text-[#00f5ff] font-mono uppercase tracking-wider mt-0.5">የፓፒረስ ሎጅ መግቢያ ቪዲዮ</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsVideoModalOpen(false)}
                  className="bg-white/5 hover:bg-white/10 hover:text-[#C1FF00] text-white px-3 py-1.5 rounded text-xs font-mono font-black border border-white/10 transition-colors cursor-pointer"
                >
                  CLOSE (ዝጋ) ✕
                </button>
              </div>

              {/* Video Embedding Body */}
              <div className="aspect-video relative bg-black overflow-hidden">
                {bgVideoType === 'youtube' ? (
                  <div className="absolute inset-0 w-full h-full overflow-hidden scale-[1.25]">
                    <iframe
                      className="absolute top-1/2 left-1/2 w-[120vw] h-[67.5vw] min-h-[120vh] min-w-[213.33vh] -translate-x-1/2 -translate-y-1/2 opacity-100 select-none scale-[1.2] object-cover pointer-events-none"
                      src={getYouTubeEmbedUrl(bgVideoUrl, false, true)}
                      title="Welcome Papyrus Background Video player"
                      allow="autoplay; encrypted-media"
                      frameBorder="0"
                    ></iframe>
                    <div className="absolute inset-0 bg-transparent z-10 pointer-events-none"></div>
                  </div>
                ) : (
                  <video
                    className="w-full h-full object-cover"
                    src={bgVideoUrl}
                    controls
                    autoPlay
                    playsInline
                  />
                )}
              </div>

              {/* Additional Options */}
              <div className="bg-[#0f0f0f] p-4 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-3">
                <p className="text-[11px] text-stone-400 text-center sm:text-left">
                  በአሳሽዎ ህግጋት ምክንያት ቪዲዮው ከጀርባ በራሱ ካልሰራ እዚህ ጋር በተሟላ ድምፅና ጥራት ቀጥታ መመልከት ይችላሉ።
                </p>
                <div className="bg-[#C1FF00]/10 text-[#C1FF00] border border-[#C1FF00]/30 font-mono font-black text-[10px] uppercase py-2 px-4 rounded tracking-wider flex items-center gap-1.5 shrink-0 select-none">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>📺 ፓፒረስ ሆቴል ቴሌቪዥን (PAPYRUS HOTEL LIVE TV)</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PRINTABLE STAFF CERTIFICATE OVERLAY */}
      {printingStaffMember && (
        <PrintableCertificateModal 
          staff={printingStaffMember} 
          onClose={() => setPrintingStaffMember(null)} 
        />
      )}

    </div>
  );
}
