import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  BarChart3, Image as ImageIcon, FileText, Settings as SettingsIcon, 
  Users, Home, Utensils, Calendar, ShieldCheck, Mail, Phone, MapPin, 
  Sparkles, Trash2, Edit, Plus, Check, X, LogOut, Upload, RefreshCw, Eye
} from 'lucide-react';
import { MenuItem, RoomBooking, StaffMember } from '../types';

interface SuperAdminCMSProps {
  appLang: 'am' | 'en';
  onLogout: () => void;
  // Fallbacks to keep local state synchronized if database connection fails
  menuItems: MenuItem[];
  setMenuItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  roomBookings: RoomBooking[];
  setRoomBookings: React.Dispatch<React.SetStateAction<RoomBooking[]>>;
  promos: any[];
  setPromos: React.Dispatch<React.SetStateAction<any[]>>;
  aboutLodgeText: string;
  setAboutLodgeText: (txt: string) => void;
  logoUrl: string;
  setLogoUrl: (url: string) => void;
  bgVideoUrl: string;
  setBgVideoUrl: (url: string) => void;
  isBgVideoEnabled: boolean;
  setIsBgVideoEnabled: (enabled: boolean) => void;
}

export const SuperAdminCMS: React.FC<SuperAdminCMSProps> = ({
  appLang,
  onLogout,
  menuItems,
  setMenuItems,
  roomBookings,
  setRoomBookings,
  promos,
  setPromos,
  aboutLodgeText,
  setAboutLodgeText,
  logoUrl,
  setLogoUrl,
  bgVideoUrl,
  setBgVideoUrl,
  isBgVideoEnabled,
  setIsBgVideoEnabled
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'hero' | 'rooms' | 'restaurant' | 'gallery' | 'testimonials' | 'bookings' | 'contact' | 'settings' | 'admins'>('overview');
  
  // Roster of administrators (custom db table 'admin_users')
  const [adminUsers, setAdminUsers] = useState<{ id: string; name: string; email: string; role: string; status: string; created_at: string }[]>([]);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminRole, setNewAdminRole] = useState('Admin');

  // Hero Section State
  const [heroTitleAm, setHeroTitleAm] = useState('ውብና ሰላማዊው የሀዋሳ ማረፊያዎ');
  const [heroTitleEn, setHeroTitleEn] = useState('Your Sanctuary of Peace in Hawassa');
  const [heroSubtitleAm, setHeroSubtitleAm] = useState('በታዋቂው የሀዋሳ ሀይቅ ዳርቻ ላይ የተንጣለለ፣ ልዩ መስተንግዶ እና ባህላዊ ምግቦች የሚቀርቡበት ተመራጭ ሎጅ።');
  const [heroSubtitleEn, setHeroSubtitleEn] = useState('Nestled elegantly along the shore of Lake Hawassa, offering luxury suites, traditional organic culinary delights, and breathtaking lake vistas.');
  const [heroBgImage, setHeroBgImage] = useState('https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&auto=format&fit=crop');
  const [heroBgVideo, setHeroBgVideo] = useState('https://www.youtube.com/watch?v=AHuU7i--EUc');

  // Contact Info State
  const [contactPhone, setContactPhone] = useState('+251 919 629 347');
  const [contactEmail, setContactEmail] = useState('info@papyruslodgehawassa.com');
  const [addressAm, setAddressAm] = useState('ሀዋሳ፣ ባህር ዳር መንገድ፣ ኢትዮጵያ');
  const [addressEn, setAddressEn] = useState('Lakefront Blvd, Hawassa, Ethiopia');
  const [telegramLink, setTelegramLink] = useState('https://t.me/papyruslodge');
  const [facebookLink, setFacebookLink] = useState('https://facebook.com/papyruslodgehawassa');
  const [instagramLink, setInstagramLink] = useState('https://instagram.com/papyruslodge');

  // Testimonials State
  const [testimonials, setTestimonials] = useState<{ id: string; guest_name: string; avatar_url: string; review_am: string; review_en: string; rating: number; status: string }[]>([]);
  const [newTestimonialName, setNewTestimonialName] = useState('');
  const [newTestimonialReviewAm, setNewTestimonialReviewAm] = useState('');
  const [newTestimonialReviewEn, setNewTestimonialReviewEn] = useState('');
  const [newTestimonialRating, setNewTestimonialRating] = useState(5);

  // Gallery State
  const [galleryItems, setGalleryItems] = useState<{ id: string; title_am: string; title_en: string; image_url: string; category: string }[]>([]);
  const [newGalleryTitleAm, setNewGalleryTitleAm] = useState('');
  const [newGalleryTitleEn, setNewGalleryTitleEn] = useState('');
  const [newGalleryImage, setNewGalleryImage] = useState('');
  const [newGalleryCat, setNewGalleryCat] = useState('Lodge');

  // Selected editable items
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editingRoomNameAm, setEditingRoomNameAm] = useState('');
  const [editingRoomNameEn, setEditingRoomNameEn] = useState('');
  const [editingRoomPrice, setEditingRoomPrice] = useState(0);
  const [editingRoomDesc, setEditingRoomDesc] = useState('');
  const [editingRoomImage, setEditingRoomImage] = useState('');

  // Restaurant Menu editor
  const [editingMenuItemId, setEditingMenuItemId] = useState<string | null>(null);
  const [menuNameAm, setMenuNameAm] = useState('');
  const [menuNameEn, setMenuNameEn] = useState('');
  const [menuPrice, setMenuPrice] = useState(0);
  const [menuDesc, setMenuDesc] = useState('');
  const [menuCat, setMenuCat] = useState('food');
  const [menuImage, setMenuImage] = useState('');
  const [menuAvailable, setMenuAvailable] = useState(true);

  // General Notification Alert
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | '' }>({ message: '', type: '' });
  const [loading, setLoading] = useState(false);

  // Load Content on mount
  useEffect(() => {
    fetchCMSData();
  }, []);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification({ message: '', type: '' });
    }, 4000);
  };

  const fetchCMSData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Admin Users
      const { data: admins } = await supabase.from('admin_users').select('*');
      if (admins) setAdminUsers(admins);

      // 2. Fetch Hero
      const { data: hero } = await supabase.from('hero_section').select('*').eq('id', 'main').single();
      if (hero) {
        setHeroTitleAm(hero.title_am);
        setHeroTitleEn(hero.title_en);
        setHeroSubtitleAm(hero.subtitle_am);
        setHeroSubtitleEn(hero.subtitle_en);
        if (hero.bg_video_url) setHeroBgVideo(hero.bg_video_url);
        if (hero.bg_image_url) setHeroBgImage(hero.bg_image_url);
      }

      // 3. Fetch Contact Info
      const { data: contact } = await supabase.from('contact_info').select('*').eq('id', 'main').single();
      if (contact) {
        setContactPhone(contact.phone);
        setContactEmail(contact.email);
        setAddressAm(contact.address_am);
        setAddressEn(contact.address_en);
        setTelegramLink(contact.telegram || '');
        setFacebookLink(contact.facebook || '');
        setInstagramLink(contact.instagram || '');
      }

      // 4. Fetch Testimonials
      const { data: testimonialList } = await supabase.from('testimonials').select('*');
      if (testimonialList) setTestimonials(testimonialList);

      // 5. Fetch Gallery
      const { data: galleryList } = await supabase.from('gallery').select('*');
      if (galleryList) setGalleryItems(galleryList);

      // 6. Sync menu items from local state into custom schema if table exists
      const { data: menuList } = await supabase.from('menu_items_cms').select('*');
      if (menuList && menuList.length > 0) {
        const mapped: MenuItem[] = menuList.map((item: any) => ({
          id: item.id,
          cat: item.cat,
          nameAm: item.name_am,
          nameEn: item.name_en,
          price: Number(item.price),
          desc: item.description_en || item.description_am || '',
          image: item.image,
          available: item.available,
          customizable: item.customizable
        }));
        setMenuItems(mapped);
      }
    } catch (err) {
      console.warn("CMS Database tables not fully setup or unreachable, working in standard offline fallback mode.");
    } finally {
      setLoading(false);
    }
  };

  // Image Upload helper using Supabase Storage
  const handleImageUpload = async (file: File, pathPrefix: string): Promise<string> => {
    try {
      const fileName = `${pathPrefix}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const { data, error } = await supabase.storage
        .from('lodge-media')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('lodge-media')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (err: any) {
      console.error("Storage upload failed: ", err);
      // Fallback: use temporary Data URL
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Save Hero CMS Section
  const handleSaveHero = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        title_am: heroTitleAm,
        title_en: heroTitleEn,
        subtitle_am: heroSubtitleAm,
        subtitle_en: heroSubtitleEn,
        bg_video_url: heroBgVideo,
        bg_image_url: heroBgImage,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase.from('hero_section').upsert({ id: 'main', ...payload });
      if (error) throw error;

      // Update local variables too
      setBgVideoUrl(heroBgVideo);
      showNotification('Lodge hero section updated successfully! (የሄሮ ክፍል መረጃ ተዘምኗል)', 'success');
    } catch (err: any) {
      showNotification(err.message || 'Failed to update hero section', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Manage Testimonial
  const handleAddTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTestimonialName || !newTestimonialReviewEn) return;
    try {
      const payload = {
        guest_name: newTestimonialName,
        review_am: newTestimonialReviewAm || newTestimonialReviewEn,
        review_en: newTestimonialReviewEn,
        rating: newTestimonialRating,
        avatar_url: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100`,
        status: 'Approved'
      };

      const { data, error } = await supabase.from('testimonials').insert([payload]).select();
      if (error) throw error;

      if (data) {
        setTestimonials(prev => [...prev, data[0]]);
      } else {
        setTestimonials(prev => [...prev, { id: String(Date.now()), ...payload }]);
      }

      setNewTestimonialName('');
      setNewTestimonialReviewAm('');
      setNewTestimonialReviewEn('');
      showNotification('New review added successfully!', 'success');
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    try {
      await supabase.from('testimonials').delete().eq('id', id);
      setTestimonials(prev => prev.filter(t => t.id !== id));
      showNotification('Review deleted successfully!', 'success');
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  // Manage Gallery
  const handleAddGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGalleryImage) return;
    try {
      const payload = {
        title_am: newGalleryTitleAm,
        title_en: newGalleryTitleEn || newGalleryTitleAm,
        image_url: newGalleryImage,
        category: newGalleryCat
      };

      const { data, error } = await supabase.from('gallery').insert([payload]).select();
      if (error) throw error;

      if (data) {
        setGalleryItems(prev => [...prev, data[0]]);
      } else {
        setGalleryItems(prev => [...prev, { id: String(Date.now()), ...payload }]);
      }

      setNewGalleryTitleAm('');
      setNewGalleryTitleEn('');
      setNewGalleryImage('');
      showNotification('Image added to gallery!', 'success');
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  const handleDeleteGallery = async (id: string) => {
    try {
      await supabase.from('gallery').delete().eq('id', id);
      setGalleryItems(prev => prev.filter(g => g.id !== id));
      showNotification('Gallery photo removed!', 'success');
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  // Create Admin
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail || !newAdminName || !newAdminPassword) return;

    try {
      setLoading(true);
      // Sign up in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newAdminEmail.trim(),
        password: newAdminPassword
      });

      if (authError) throw authError;

      const payload = {
        email: newAdminEmail.trim(),
        name: newAdminName,
        role: newAdminRole,
        status: 'Active'
      };

      // Record in custom db roster
      const { data, error: dbError } = await supabase.from('admin_users').insert([payload]).select();
      if (dbError) throw dbError;

      if (data) {
        setAdminUsers(prev => [...prev, data[0]]);
      } else {
        setAdminUsers(prev => [...prev, { id: String(Date.now()), created_at: new Date().toISOString(), ...payload }]);
      }

      setNewAdminEmail('');
      setNewAdminName('');
      setNewAdminPassword('');
      showNotification(`Admin user ${newAdminName} registered successfully!`, 'success');
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Toggle Admin Status
  const handleToggleAdminStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Active' ? 'Disabled' : 'Active';
    try {
      await supabase.from('admin_users').update({ status: nextStatus }).eq('id', id);
      setAdminUsers(prev => prev.map(a => a.id === id ? { ...a, status: nextStatus } : a));
      showNotification(`Admin status changed to ${nextStatus}`, 'success');
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  // Delete Admin
  const handleDeleteAdmin = async (id: string, email: string) => {
    if (email === 'tamecolorgrading@gmail.com') {
      showNotification('Security Breach: Primary Super Admin account cannot be deleted!', 'error');
      return;
    }
    try {
      await supabase.from('admin_users').delete().eq('id', id);
      setAdminUsers(prev => prev.filter(a => a.id !== id));
      showNotification('Admin account removed successfully!', 'success');
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  // Manage Bookings
  const handleConfirmBooking = (bookingId: string) => {
    setRoomBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'Active' } : b));
    showNotification('Booking confirmed successfully!', 'success');
  };

  const handleCancelBooking = (bookingId: string) => {
    setRoomBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'Checked Out' } : b));
    showNotification('Booking checked out / cancelled!', 'success');
  };

  const handleDeleteBooking = (bookingId: string) => {
    setRoomBookings(prev => prev.filter(b => b.id !== bookingId));
    showNotification('Booking deleted forever!', 'success');
  };

  // Save Contact Info
  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        phone: contactPhone,
        email: contactEmail,
        address_am: addressAm,
        address_en: addressEn,
        telegram: telegramLink,
        facebook: facebookLink,
        instagram: instagramLink,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase.from('contact_info').upsert({ id: 'main', ...payload });
      if (error) throw error;

      showNotification('Contact information updated successfully!', 'success');
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  // Edit Room Details
  const handleStartEditRoom = (roomItem: MenuItem) => {
    setEditingRoomId(roomItem.id);
    setEditingRoomNameAm(roomItem.nameAm);
    setEditingRoomNameEn(roomItem.nameEn);
    setEditingRoomPrice(roomItem.price);
    setEditingRoomDesc(roomItem.desc || '');
    setEditingRoomImage(roomItem.image);
    setActiveTab('rooms');
  };

  const handleSaveRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoomId) return;

    setMenuItems(prev => prev.map(item => {
      if (item.id === editingRoomId) {
        return {
          ...item,
          nameAm: editingRoomNameAm,
          nameEn: editingRoomNameEn,
          price: editingRoomPrice,
          desc: editingRoomDesc,
          image: editingRoomImage
        };
      }
      return item;
    }));

    setEditingRoomId(null);
    showNotification('Room details and price updated successfully!', 'success');
  };

  // Restaurant Menu
  const handleStartEditMenu = (menuItem: MenuItem) => {
    setEditingMenuItemId(menuItem.id);
    setMenuNameAm(menuItem.nameAm);
    setMenuNameEn(menuItem.nameEn);
    setMenuPrice(menuItem.price);
    setMenuDesc(menuItem.desc || '');
    setMenuCat(menuItem.cat);
    setMenuImage(menuItem.image);
    setMenuAvailable(menuItem.available);
  };

  const handleSaveMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingMenuItemId) {
      // Edit mode
      const updatedList = menuItems.map(item => {
        if (item.id === editingMenuItemId) {
          return {
            ...item,
            nameAm: menuNameAm,
            nameEn: menuNameEn,
            price: menuPrice,
            desc: menuDesc,
            cat: menuCat,
            image: menuImage,
            available: menuAvailable
          };
        }
        return item;
      });
      setMenuItems(updatedList);
      setEditingMenuItemId(null);
      showNotification('Menu item updated successfully!', 'success');
    } else {
      // Add mode
      const newItem: MenuItem = {
        id: `m-${Date.now()}`,
        cat: menuCat,
        nameAm: menuNameAm,
        nameEn: menuNameEn,
        price: menuPrice,
        desc: menuDesc,
        image: menuImage || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400',
        available: menuAvailable
      };
      setMenuItems(prev => [...prev, newItem]);
      showNotification('New restaurant menu item added successfully!', 'success');
    }

    // Reset fields
    setMenuNameAm('');
    setMenuNameEn('');
    setMenuPrice(0);
    setMenuDesc('');
    setMenuImage('');
    setMenuAvailable(true);
  };

  const handleDeleteMenuItem = (id: string) => {
    setMenuItems(prev => prev.filter(item => item.id !== id));
    showNotification('Menu item deleted!', 'success');
  };

  return (
    <div className="w-full text-left bg-[#0c0c0c] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
      {/* Background glow lines */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#C1FF00]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Banner Alert notification */}
      {notification.message && (
        <div className={`fixed top-6 right-6 z-50 p-4 rounded-2xl border text-xs font-bold shadow-lg animate-bounce flex items-center gap-2 ${
          notification.type === 'success' 
            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400' 
            : 'bg-red-500/15 border-red-500/40 text-red-400'
        }`}>
          <span>{notification.type === 'success' ? '✔️' : '⚠️'}</span>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Admin Dashboard Header */}
      <div className="bg-gradient-to-r from-stone-900 via-[#111] to-black p-6 border-b border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#C1FF00] rounded-full animate-ping" />
            <span className="text-[9px] bg-[#C1FF00]/15 text-[#C1FF00] font-mono font-black uppercase px-2 py-0.5 rounded tracking-widest border border-[#C1FF00]/20">
              SUPABASE SECURE SUPER CMS
            </span>
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight mt-2 flex items-center gap-2">
            <span>PAPYRUS LODGE PORTAL</span>
            <span className="text-xs text-[#00f5ff] font-mono">v3.5</span>
          </h1>
          <p className="text-xs text-white/50 mt-1">
            {appLang === 'am' ? 'ሙሉ የአርትዖት መቆጣጠሪያ፣ የምስልና የጽሑፍ ማስተካከያ እንዲሁም የቦታ ማስያዣ ማስተዳደሪያ ማዕከል' : 'Full real-time website control, content management & booking center'}
          </p>
        </div>

        <button 
          onClick={onLogout}
          className="px-5 h-11 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-600/20 text-xs font-mono font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>LOGOUT CMS</span>
        </button>
      </div>

      {/* CMS Workspace Main Layout */}
      <div className="flex flex-col lg:flex-row min-h-[680px]">
        {/* Left Side Navigation bar */}
        <div className="w-full lg:w-[240px] border-r border-white/10 bg-[#0f0f0f] p-4 flex flex-col gap-1 shrink-0">
          <p className="text-[8px] font-mono text-white/30 uppercase tracking-widest font-black px-2.5 mb-2 block">
            CMS NAVIGATION MENU
          </p>

          {[
            { id: 'overview', label: '📊 Overview', tab: 'overview' },
            { id: 'hero', label: '✨ Hero Section', tab: 'hero' },
            { id: 'rooms', label: '🛖 Rooms & Suites', tab: 'rooms' },
            { id: 'restaurant', label: '🍽️ Restaurant Menu', tab: 'restaurant' },
            { id: 'gallery', label: '🖼️ Gallery Manager', tab: 'gallery' },
            { id: 'testimonials', label: '💬 Testimonials', tab: 'testimonials' },
            { id: 'bookings', label: '🏨 Bookings Desk', tab: 'bookings' },
            { id: 'contact', label: '📞 Contact Details', tab: 'contact' },
            { id: 'settings', label: '⚙️ Settings', tab: 'settings' },
            { id: 'admins', label: '👥 Admin Users', tab: 'admins' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.tab as any)}
              className={`w-full h-11 px-4 text-xs font-bold text-left rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                activeTab === tab.tab 
                  ? 'bg-[#C1FF00] text-black shadow-md font-black scale-[1.02]' 
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{tab.label}</span>
              {activeTab === tab.tab && <span className="w-1.5 h-1.5 bg-black rounded-full" />}
            </button>
          ))}
        </div>

        {/* Right Side Content Panel */}
        <div className="flex-1 p-6 lg:p-8 overflow-y-auto max-h-[750px] bg-[#0c0c0c] text-left">
          
          {/* 1. OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="border-b border-white/5 pb-4">
                <h3 className="text-lg font-black uppercase text-white tracking-wide">
                  Welcome to Super CMS Panel ⚡
                </h3>
                <p className="text-xs text-white/40 mt-1">
                  Manage all lodge information securely. Choose an option from the left to start editing.
                </p>
              </div>

              {/* Stats Cards Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#121212] border border-white/10 p-5 rounded-2xl">
                  <span className="text-stone-400 font-mono text-[9px] uppercase font-bold tracking-wider block">Total Rooms</span>
                  <span className="text-3xl font-black text-[#C1FF00] mt-1.5 block">
                    {menuItems.filter(item => item.cat === 'room').length}
                  </span>
                </div>
                <div className="bg-[#121212] border border-white/10 p-5 rounded-2xl">
                  <span className="text-stone-400 font-mono text-[9px] uppercase font-bold tracking-wider block">Menu Items</span>
                  <span className="text-3xl font-black text-white mt-1.5 block">
                    {menuItems.filter(item => item.cat === 'food' || item.cat === 'drinks' || item.cat === 'traditional').length}
                  </span>
                </div>
                <div className="bg-[#121212] border border-white/10 p-5 rounded-2xl">
                  <span className="text-stone-400 font-mono text-[9px] uppercase font-bold tracking-wider block">Active Bookings</span>
                  <span className="text-3xl font-black text-sky-400 mt-1.5 block">
                    {roomBookings.filter(b => b.status === 'Active').length}
                  </span>
                </div>
                <div className="bg-[#121212] border border-white/10 p-5 rounded-2xl">
                  <span className="text-stone-400 font-mono text-[9px] uppercase font-bold tracking-wider block">Admin Roster</span>
                  <span className="text-3xl font-black text-purple-400 mt-1.5 block">
                    {adminUsers.length || 1}
                  </span>
                </div>
              </div>

              {/* Quick Actions Panel */}
              <div className="bg-[#121212] border border-white/10 p-6 rounded-2xl text-left">
                <h4 className="text-xs font-black uppercase text-white tracking-widest mb-4">
                  CMS Quick Shortcuts
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button 
                    onClick={() => setActiveTab('hero')}
                    className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-[#C1FF00]/40 rounded-xl transition-all text-left flex items-start gap-3 cursor-pointer"
                  >
                    <span className="text-xl">✨</span>
                    <div>
                      <span className="text-xs font-bold text-white block">Update Landing Hero Section</span>
                      <span className="text-[10px] text-white/40 block mt-0.5">Edit main background video and title</span>
                    </div>
                  </button>

                  <button 
                    onClick={() => setActiveTab('restaurant')}
                    className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-[#C1FF00]/40 rounded-xl transition-all text-left flex items-start gap-3 cursor-pointer"
                  >
                    <span className="text-xl">🍔</span>
                    <div>
                      <span className="text-xs font-bold text-white block">Manage Menu Items</span>
                      <span className="text-[10px] text-white/40 block mt-0.5">Add new dishes, beverages and change prices</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. HERO SECTION TAB */}
          {activeTab === 'hero' && (
            <form onSubmit={handleSaveHero} className="space-y-6">
              <div className="border-b border-white/5 pb-4">
                <h3 className="text-lg font-black uppercase text-white">✨ Landing Hero Editor</h3>
                <p className="text-xs text-white/40 mt-1">Customize the first thing visitors see when loading the website.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5 text-left">
                  <label className="text-[9px] font-mono text-stone-400 uppercase tracking-widest font-bold block">የቪዲዮ አድራሻ (YOUTUBE PROMO BG VIDEO)</label>
                  <input
                    type="text"
                    required
                    value={heroBgVideo}
                    onChange={(e) => setHeroBgVideo(e.target.value)}
                    className="w-full h-11 px-4 bg-black/40 border border-white/10 rounded-xl text-xs outline-none focus:border-[#C1FF00]"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[9px] font-mono text-stone-400 uppercase tracking-widest font-bold block">የጀርባ ፎቶ (BACKDROP HERO IMAGE URL / UPLOAD)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={heroBgImage}
                      onChange={(e) => setHeroBgImage(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 h-11 px-4 bg-black/40 border border-white/10 rounded-xl text-xs outline-none focus:border-[#C1FF00]"
                    />
                    <label className="h-11 px-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#C1FF00]/40 rounded-xl flex items-center justify-center cursor-pointer transition-colors shrink-0 text-xs text-white/80 hover:text-white" title="Upload local image">
                      <Upload className="w-4 h-4 mr-1.5 text-[#C1FF00]" />
                      <span>{loading ? '...' : 'Upload'}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setLoading(true);
                            const url = await handleImageUpload(file, 'hero');
                            setHeroBgImage(url);
                            setLoading(false);
                            showNotification('Hero image uploaded successfully!', 'success');
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[9px] font-mono text-stone-400 uppercase tracking-widest font-bold block">አማርኛ ርዕስ (HERO TITLE - AMHARIC)</label>
                  <input
                    type="text"
                    required
                    value={heroTitleAm}
                    onChange={(e) => setHeroTitleAm(e.target.value)}
                    className="w-full h-11 px-4 bg-black/40 border border-white/10 rounded-xl text-xs outline-none focus:border-[#C1FF00]"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[9px] font-mono text-stone-400 uppercase tracking-widest font-bold block">እንግሊዘኛ ርዕስ (HERO TITLE - ENGLISH)</label>
                  <input
                    type="text"
                    required
                    value={heroTitleEn}
                    onChange={(e) => setHeroTitleEn(e.target.value)}
                    className="w-full h-11 px-4 bg-black/40 border border-white/10 rounded-xl text-xs outline-none focus:border-[#C1FF00]"
                  />
                </div>

                <div className="space-y-1.5 text-left md:col-span-2">
                  <label className="text-[9px] font-mono text-stone-400 uppercase tracking-widest font-bold block">አማርኛ ንዑስ-ርዕስ (SUBTITLE - AMHARIC)</label>
                  <textarea
                    rows={3}
                    required
                    value={heroSubtitleAm}
                    onChange={(e) => setHeroSubtitleAm(e.target.value)}
                    className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-xs outline-none focus:border-[#C1FF00] resize-none"
                  />
                </div>

                <div className="space-y-1.5 text-left md:col-span-2">
                  <label className="text-[9px] font-mono text-stone-400 uppercase tracking-widest font-bold block">እንግሊዘኛ ንዑስ-ርዕስ (SUBTITLE - ENGLISH)</label>
                  <textarea
                    rows={3}
                    required
                    value={heroSubtitleEn}
                    onChange={(e) => setHeroSubtitleEn(e.target.value)}
                    className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-xs outline-none focus:border-[#C1FF00] resize-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-6 h-12 bg-[#C1FF00] hover:bg-white text-black font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-md transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'SAVING DATA...' : 'SAVE HERO CHANGES ✔️'}
              </button>
            </form>
          )}

          {/* 3. ROOMS & SUITES TAB */}
          {activeTab === 'rooms' && (
            <div className="space-y-6 text-left">
              <div className="border-b border-white/5 pb-4">
                <h3 className="text-lg font-black uppercase text-white">🛖 Rooms & Suites Price Editor</h3>
                <p className="text-xs text-white/40 mt-1">Manage all available luxury rooms and venue prices instantly.</p>
              </div>

              {/* Edit Room Form */}
              {editingRoomId && (
                <form onSubmit={handleSaveRoom} className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-4">
                  <h4 className="text-xs font-black text-[#C1FF00] uppercase tracking-wider">✏️ Editing Room Room-ID: {editingRoomId}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1 text-left">
                      <label className="text-[8px] font-mono text-white/50 block">Name (Amharic)</label>
                      <input 
                        type="text" 
                        required 
                        value={editingRoomNameAm} 
                        onChange={(e) => setEditingRoomNameAm(e.target.value)}
                        className="w-full h-10 px-3 bg-black/50 border border-white/10 rounded-lg text-xs" 
                      />
                    </div>
                    <div className="space-y-1 text-left">
                      <label className="text-[8px] font-mono text-white/50 block">Name (English)</label>
                      <input 
                        type="text" 
                        required 
                        value={editingRoomNameEn} 
                        onChange={(e) => setEditingRoomNameEn(e.target.value)}
                        className="w-full h-10 px-3 bg-black/50 border border-white/10 rounded-lg text-xs" 
                      />
                    </div>
                    <div className="space-y-1 text-left">
                      <label className="text-[8px] font-mono text-white/50 block">Price per Night (ETB)</label>
                      <input 
                        type="number" 
                        required 
                        value={editingRoomPrice} 
                        onChange={(e) => setEditingRoomPrice(Number(e.target.value))}
                        className="w-full h-10 px-3 bg-black/50 border border-white/10 rounded-lg text-xs" 
                      />
                    </div>
                    <div className="space-y-1 text-left md:col-span-3">
                      <label className="text-[8px] font-mono text-white/50 block">Room Image URL / Upload</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          required 
                          value={editingRoomImage} 
                          onChange={(e) => setEditingRoomImage(e.target.value)}
                          placeholder="https://..."
                          className="flex-1 h-10 px-3 bg-black/50 border border-white/10 rounded-lg text-xs outline-none focus:border-[#C1FF00]" 
                        />
                        <label className="h-10 px-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#C1FF00]/40 rounded-lg flex items-center justify-center cursor-pointer transition-colors shrink-0 text-xs text-white/80 hover:text-white" title="Upload local image">
                          <Upload className="w-4 h-4 mr-1.5 text-[#C1FF00]" />
                          <span>{loading ? '...' : 'Upload'}</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setLoading(true);
                                const url = await handleImageUpload(file, 'rooms');
                                setEditingRoomImage(url);
                                setLoading(false);
                                showNotification('Room image uploaded successfully!', 'success');
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="px-4 py-2 bg-[#C1FF00] text-black text-[10px] font-black uppercase rounded-lg">Save Room Details</button>
                    <button type="button" onClick={() => setEditingRoomId(null)} className="px-4 py-2 bg-stone-800 text-white text-[10px] uppercase rounded-lg">Cancel</button>
                  </div>
                </form>
              )}

              {/* Rooms List Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {menuItems.filter(item => item.cat === 'room' || item.cat === 'venue').map(room => (
                  <div key={room.id} className="bg-[#121212] border border-white/10 rounded-2xl overflow-hidden p-4 flex gap-4 text-left">
                    <img src={room.image} className="w-20 h-20 object-cover rounded-xl border border-white/10" alt="Room thumbnail" />
                    <div className="flex-1 space-y-1 relative">
                      <h4 className="text-xs font-black text-white">{room.nameEn} ({room.nameAm})</h4>
                      <p className="text-[9px] text-[#C1FF00] font-mono font-bold">{room.price.toLocaleString()} ETB / Night</p>
                      <p className="text-[9px] text-white/55 line-clamp-2">{room.desc}</p>
                      <button 
                        onClick={() => handleStartEditRoom(room)}
                        className="absolute bottom-0 right-0 p-1.5 bg-white/5 hover:bg-[#C1FF00] text-white hover:text-black rounded-lg transition-colors cursor-pointer"
                        title="Edit Details"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. RESTAURANT MENU TAB */}
          {activeTab === 'restaurant' && (
            <div className="space-y-6 text-left">
              <div className="border-b border-white/5 pb-4">
                <h3 className="text-lg font-black uppercase text-white">🍽️ Restaurant Menu Items CMS</h3>
                <p className="text-xs text-white/40 mt-1">Manage breakfast, fastings, main courses, and custom beverages.</p>
              </div>

              {/* Add / Edit Menu Item Form */}
              <form onSubmit={handleSaveMenuItem} className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-4">
                <h4 className="text-xs font-black text-[#C1FF00] uppercase tracking-wider">
                  {editingMenuItemId ? `✏️ EDIT MENU ITEM ID: ${editingMenuItemId}` : '➕ ADD NEW RESTAURANT DISH / BEVERAGE'}
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1 text-left">
                    <label className="text-[8px] font-mono text-white/50 block">አማርኛ ስም (NAME AMHARIC)</label>
                    <input 
                      type="text" 
                      required 
                      value={menuNameAm} 
                      onChange={(e) => setMenuNameAm(e.target.value)}
                      className="w-full h-10 px-3 bg-black/50 border border-white/10 rounded-lg text-xs outline-none focus:border-[#C1FF00]" 
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="text-[8px] font-mono text-white/50 block">ENGLISH NAME</label>
                    <input 
                      type="text" 
                      required 
                      value={menuNameEn} 
                      onChange={(e) => setMenuNameEn(e.target.value)}
                      className="w-full h-10 px-3 bg-black/50 border border-white/10 rounded-lg text-xs outline-none focus:border-[#C1FF00]" 
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="text-[8px] font-mono text-white/50 block">PRICE (ETB)</label>
                    <input 
                      type="number" 
                      required 
                      value={menuPrice} 
                      onChange={(e) => setMenuPrice(Number(e.target.value))}
                      className="w-full h-10 px-3 bg-black/50 border border-white/10 rounded-lg text-xs outline-none focus:border-[#C1FF00]" 
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[8px] font-mono text-white/50 block">CATEGORY</label>
                    <select 
                      value={menuCat} 
                      onChange={(e) => setMenuCat(e.target.value)}
                      className="w-full h-10 px-3 bg-black/50 border border-white/10 rounded-lg text-xs text-white outline-none focus:border-[#C1FF00]"
                    >
                      <option value="food">🍽️ Food Dishes</option>
                      <option value="drinks">🍹 Soft Drinks & Spirits</option>
                      <option value="traditional">🍲 Traditional Delights</option>
                    </select>
                  </div>

                  <div className="space-y-1 text-left md:col-span-2">
                    <label className="text-[8px] font-mono text-white/50 block">IMAGE URL / UPLOAD</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={menuImage} 
                        onChange={(e) => setMenuImage(e.target.value)}
                        placeholder="https://..."
                        className="flex-1 h-10 px-3 bg-black/50 border border-white/10 rounded-lg text-xs outline-none focus:border-[#C1FF00]" 
                      />
                      <label className="h-10 px-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#C1FF00]/40 rounded-lg flex items-center justify-center cursor-pointer transition-colors shrink-0 text-xs text-white/80 hover:text-white" title="Upload local image">
                        <Upload className="w-4 h-4 mr-1.5 text-[#C1FF00]" />
                        <span>{loading ? '...' : 'Upload'}</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setLoading(true);
                              const url = await handleImageUpload(file, 'restaurant');
                              setMenuImage(url);
                              setLoading(false);
                              showNotification('Menu image uploaded successfully!', 'success');
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1 text-left md:col-span-3">
                    <label className="text-[8px] font-mono text-white/50 block">DESCRIPTION</label>
                    <input 
                      type="text" 
                      value={menuDesc} 
                      onChange={(e) => setMenuDesc(e.target.value)}
                      className="w-full h-10 px-3 bg-black/50 border border-white/10 rounded-lg text-xs outline-none focus:border-[#C1FF00]" 
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button type="submit" className="px-4 py-2 bg-[#C1FF00] text-black text-[10px] font-black uppercase rounded-lg">
                    {editingMenuItemId ? 'Update Item ✔️' : 'Add to Menu ➕'}
                  </button>
                  {editingMenuItemId && (
                    <button type="button" onClick={() => setEditingMenuItemId(null)} className="px-4 py-2 bg-stone-800 text-white text-[10px] uppercase rounded-lg">
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              {/* Menu List */}
              <div className="space-y-2">
                <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest font-black block">Lodge Food Menu Items</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {menuItems.filter(item => item.cat === 'food' || item.cat === 'drinks' || item.cat === 'traditional').map(dish => (
                    <div key={dish.id} className="bg-[#121212] border border-white/10 rounded-2xl overflow-hidden p-4 flex gap-4 text-left">
                      <img src={dish.image} className="w-16 h-16 object-cover rounded-xl border border-white/10" alt="dish thumbnail" />
                      <div className="flex-1 space-y-0.5 relative text-left">
                        <span className="text-[7.5px] font-mono text-[#C1FF00] bg-[#C1FF00]/10 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                          {dish.cat}
                        </span>
                        <h4 className="text-xs font-black text-white mt-1">{dish.nameEn} ({dish.nameAm})</h4>
                        <p className="text-[9px] text-[#C1FF00] font-mono font-black">{dish.price} ETB</p>
                        <div className="absolute bottom-0 right-0 flex gap-1">
                          <button 
                            onClick={() => handleStartEditMenu(dish)}
                            className="p-1.5 bg-white/5 hover:bg-[#C1FF00] text-white hover:text-black rounded-lg transition-colors"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => handleDeleteMenuItem(dish.id)}
                            className="p-1.5 bg-red-950/20 hover:bg-red-600 text-red-400 hover:text-white rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 5. GALLERY TAB */}
          {activeTab === 'gallery' && (
            <div className="space-y-6 text-left">
              <div className="border-b border-white/5 pb-4">
                <h3 className="text-lg font-black uppercase text-white">🖼️ Gallery Photo Manager</h3>
                <p className="text-xs text-white/40 mt-1">Upload and categorize photos from lake views, lodge suites and events.</p>
              </div>

              {/* Add to Gallery Form */}
              <form onSubmit={handleAddGallery} className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-4">
                <h4 className="text-xs font-black text-[#C1FF00] uppercase tracking-wider">🖼️ UPLOAD PHOTO TO LODGE GALLERY</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1 text-left">
                    <label className="text-[8px] font-mono text-white/50 block">አማርኛ መግለጫ (CAPTION AMHARIC)</label>
                    <input 
                      type="text" 
                      required 
                      value={newGalleryTitleAm} 
                      onChange={(e) => setNewGalleryTitleAm(e.target.value)}
                      className="w-full h-10 px-3 bg-black/50 border border-white/10 rounded-lg text-xs" 
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="text-[8px] font-mono text-white/50 block">ENGLISH CAPTION</label>
                    <input 
                      type="text" 
                      required 
                      value={newGalleryTitleEn} 
                      onChange={(e) => setNewGalleryTitleEn(e.target.value)}
                      className="w-full h-10 px-3 bg-black/50 border border-white/10 rounded-lg text-xs" 
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="text-[8px] font-mono text-white/50 block">CATEGORY</label>
                    <select 
                      value={newGalleryCat} 
                      onChange={(e) => setNewGalleryCat(e.target.value)}
                      className="w-full h-10 px-3 bg-black/50 border border-white/10 rounded-lg text-xs text-white"
                    >
                      <option value="Lodge">🪵 Lodge Exterior</option>
                      <option value="Food">🍲 Dining & Kitchen</option>
                      <option value="Lake">⛵ Lake Hawassa Views</option>
                      <option value="Rooms">🛏️ Rooms & Suites</option>
                    </select>
                  </div>
                  <div className="space-y-1 text-left md:col-span-3">
                    <label className="text-[8px] font-mono text-white/50 block">IMAGE URL / UPLOAD</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        required 
                        value={newGalleryImage} 
                        onChange={(e) => setNewGalleryImage(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="flex-1 h-10 px-3 bg-black/50 border border-white/10 rounded-lg text-xs outline-none focus:border-[#C1FF00]" 
                      />
                      <label className="h-10 px-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#C1FF00]/40 rounded-lg flex items-center justify-center cursor-pointer transition-colors shrink-0 text-xs text-white/80 hover:text-white" title="Upload local image">
                        <Upload className="w-4 h-4 mr-1.5 text-[#C1FF00]" />
                        <span>{loading ? '...' : 'Upload'}</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setLoading(true);
                              const url = await handleImageUpload(file, 'gallery');
                              setNewGalleryImage(url);
                              setLoading(false);
                              showNotification('Gallery image uploaded successfully!', 'success');
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
                <button type="submit" className="px-4 py-2 bg-[#C1FF00] text-black text-[10px] font-black uppercase rounded-lg">
                  ADD PHOTO ✔️
                </button>
              </form>

              {/* Photos Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {galleryItems.map(item => (
                  <div key={item.id} className="bg-[#121212] border border-white/10 rounded-xl overflow-hidden relative group">
                    <img src={item.image_url} className="w-full aspect-square object-cover" alt="Gallery item" />
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-between">
                      <div>
                        <span className="text-[7px] font-mono text-[#C1FF00] uppercase font-bold">{item.category}</span>
                        <p className="text-[9px] font-bold text-white mt-1 leading-snug">{item.title_en}</p>
                      </div>
                      <button 
                        onClick={() => handleDeleteGallery(item.id)}
                        className="w-full h-8 bg-red-600 text-white text-[8px] uppercase font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        DELETE PHOTO
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. TESTIMONIALS TAB */}
          {activeTab === 'testimonials' && (
            <div className="space-y-6 text-left">
              <div className="border-b border-white/5 pb-4">
                <h3 className="text-lg font-black uppercase text-white">💬 Testimonials & Customer Reviews</h3>
                <p className="text-xs text-white/40 mt-1">Approve and showcase reviews written by guests visiting Papyrus Lodge.</p>
              </div>

              {/* Add Review Form */}
              <form onSubmit={handleAddTestimonial} className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-4">
                <h4 className="text-xs font-black text-[#C1FF00] uppercase tracking-wider">💬 WRITE CUSTOM TESTIMONIAL</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 text-left">
                    <label className="text-[8px] font-mono text-white/50 block">GUEST NAME</label>
                    <input 
                      type="text" 
                      required 
                      value={newTestimonialName} 
                      onChange={(e) => setNewTestimonialName(e.target.value)}
                      placeholder="e.g., Samuel Kassahun"
                      className="w-full h-10 px-3 bg-black/50 border border-white/10 rounded-lg text-xs" 
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="text-[8px] font-mono text-white/50 block">RATING STAR (1-5)</label>
                    <select 
                      value={newTestimonialRating} 
                      onChange={(e) => setNewTestimonialRating(Number(e.target.value))}
                      className="w-full h-10 px-3 bg-black/50 border border-white/10 rounded-lg text-xs text-white"
                    >
                      <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
                      <option value="4">⭐⭐⭐⭐ 4 Stars</option>
                    </select>
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="text-[8px] font-mono text-white/50 block">REVIEW IN AMHARIC</label>
                    <textarea 
                      required 
                      value={newTestimonialReviewAm} 
                      onChange={(e) => setNewTestimonialReviewAm(e.target.value)}
                      className="w-full p-3 bg-black/50 border border-white/10 rounded-lg text-xs resize-none" 
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="text-[8px] font-mono text-white/50 block">REVIEW IN ENGLISH</label>
                    <textarea 
                      required 
                      value={newTestimonialReviewEn} 
                      onChange={(e) => setNewTestimonialReviewEn(e.target.value)}
                      className="w-full p-3 bg-black/50 border border-white/10 rounded-lg text-xs resize-none" 
                    />
                  </div>
                </div>
                <button type="submit" className="px-4 py-2 bg-[#C1FF00] text-black text-[10px] font-black uppercase rounded-lg">
                  ADD TESTIMONIAL
                </button>
              </form>

              {/* Reviews List */}
              <div className="space-y-3">
                {testimonials.map(item => (
                  <div key={item.id} className="bg-[#121212] border border-white/10 p-4 rounded-xl flex gap-4 text-left">
                    <img src={item.avatar_url} className="w-10 h-10 rounded-full object-cover" alt="Avatar" />
                    <div className="flex-1 space-y-1 relative">
                      <h4 className="text-xs font-black text-white">{item.guest_name}</h4>
                      <p className="text-[8px] text-amber-400">{'★'.repeat(item.rating)}</p>
                      <p className="text-[10px] text-white/80">" {item.review_en} "</p>
                      <p className="text-[10px] text-white/50">" {item.review_am} "</p>
                      <button 
                        onClick={() => handleDeleteTestimonial(item.id)}
                        className="absolute top-0 right-0 p-1.5 bg-red-950/20 hover:bg-red-600 text-red-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                        title="Delete Testimonial"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. BOOKINGS DESK TAB */}
          {activeTab === 'bookings' && (
            <div className="space-y-6 text-left">
              <div className="border-b border-white/5 pb-4">
                <h3 className="text-lg font-black uppercase text-white">🏨 Booking Manager & Receptionist Desk</h3>
                <p className="text-xs text-white/40 mt-1">Verify check-ins, approve digital room requests and change guest booking statuses.</p>
              </div>

              {/* Bookings List */}
              <div className="space-y-3">
                {roomBookings.length === 0 ? (
                  <div className="text-center py-10 font-mono text-white/30 text-xs">NO ACTIVE BOOKINGS FOUND</div>
                ) : (
                  [...roomBookings].reverse().map(b => (
                    <div key={b.id} className="bg-[#121212] border border-white/10 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${b.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          <h4 className="text-xs font-black text-white">{b.roomNumber}</h4>
                        </div>
                        <p className="text-[10px] text-[#C1FF00] font-mono">Guest: {b.guestIds[0]?.fullName || 'Lodge Guest'}</p>
                        <p className="text-[9px] text-stone-400 font-mono">Phone: {b.contactPhone} | Count: {b.guestCount} guests</p>
                        <p className="text-[9px] text-stone-500">Check-in: {b.checkInDate} {b.notes ? `| Notes: ${b.notes}` : ''}</p>
                      </div>

                      <div className="flex gap-1.5 self-end md:self-auto">
                        {b.status !== 'Active' && (
                          <button 
                            onClick={() => handleConfirmBooking(b.id)}
                            className="px-3 h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] uppercase font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            CONFIRM
                          </button>
                        )}
                        <button 
                          onClick={() => handleCancelBooking(b.id)}
                          className="px-3 h-8 bg-stone-800 hover:bg-stone-700 text-white text-[9px] uppercase font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          CHECK OUT
                        </button>
                        <button 
                          onClick={() => handleDeleteBooking(b.id)}
                          className="px-3 h-8 bg-red-950/20 hover:bg-red-600 text-red-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                        >
                          DELETE
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 8. CONTACT DETAILS TAB */}
          {activeTab === 'contact' && (
            <form onSubmit={handleSaveContact} className="space-y-6 text-left">
              <div className="border-b border-white/5 pb-4">
                <h3 className="text-lg font-black uppercase text-white">📞 Contact & Address Information CMS</h3>
                <p className="text-xs text-white/40 mt-1">Configure lodge reception phone numbers, general emails and social coordinates.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5 text-left">
                  <label className="text-[9px] font-mono text-stone-400 uppercase tracking-widest font-bold block">RECEPTION PHONE NUMBER</label>
                  <input
                    type="text"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full h-11 px-4 bg-black/40 border border-white/10 rounded-xl text-xs outline-none focus:border-[#C1FF00]"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[9px] font-mono text-stone-400 uppercase tracking-widest font-bold block">GENERAL LOBBY EMAIL</label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full h-11 px-4 bg-black/40 border border-white/10 rounded-xl text-xs outline-none focus:border-[#C1FF00]"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[9px] font-mono text-stone-400 uppercase tracking-widest font-bold block">LODGE ADDRESS - AMHARIC</label>
                  <input
                    type="text"
                    required
                    value={addressAm}
                    onChange={(e) => setAddressAm(e.target.value)}
                    className="w-full h-11 px-4 bg-black/40 border border-white/10 rounded-xl text-xs outline-none focus:border-[#C1FF00]"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[9px] font-mono text-stone-400 uppercase tracking-widest font-bold block">LODGE ADDRESS - ENGLISH</label>
                  <input
                    type="text"
                    required
                    value={addressEn}
                    onChange={(e) => setAddressEn(e.target.value)}
                    className="w-full h-11 px-4 bg-black/40 border border-white/10 rounded-xl text-xs outline-none focus:border-[#C1FF00]"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[9px] font-mono text-stone-400 uppercase tracking-widest font-bold block">TELEGRAM LINK</label>
                  <input
                    type="text"
                    value={telegramLink}
                    onChange={(e) => setTelegramLink(e.target.value)}
                    className="w-full h-11 px-4 bg-black/40 border border-white/10 rounded-xl text-xs outline-none focus:border-[#C1FF00]"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[9px] font-mono text-stone-400 uppercase tracking-widest font-bold block">FACEBOOK PAGE LINK</label>
                  <input
                    type="text"
                    value={facebookLink}
                    onChange={(e) => setFacebookLink(e.target.value)}
                    className="w-full h-11 px-4 bg-black/40 border border-white/10 rounded-xl text-xs outline-none focus:border-[#C1FF00]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-6 h-12 bg-[#C1FF00] hover:bg-white text-black font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all"
              >
                SAVE CONTACT CHANGES ✔️
              </button>
            </form>
          )}

          {/* 9. SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="space-y-6 text-left">
              <div className="border-b border-white/5 pb-4">
                <h3 className="text-lg font-black uppercase text-white">⚙️ Website Settings & Control</h3>
                <p className="text-xs text-white/40 mt-1">Configure general lodge brand metadata, active visual modes, and asset URLs.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-stone-400 uppercase tracking-widest font-bold block">ACTIVE LOGO FILE URL / UPLOAD</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 h-11 px-4 bg-black/40 border border-white/10 rounded-xl text-xs outline-none focus:border-[#C1FF00]"
                    />
                    <label className="h-11 px-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#C1FF00]/40 rounded-xl flex items-center justify-center cursor-pointer transition-colors shrink-0 text-xs text-white/80 hover:text-white" title="Upload local image">
                      <Upload className="w-4 h-4 mr-1.5 text-[#C1FF00]" />
                      <span>{loading ? '...' : 'Upload'}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setLoading(true);
                            const url = await handleImageUpload(file, 'logo');
                            setLogoUrl(url);
                            setLoading(false);
                            showNotification('Logo image uploaded successfully!', 'success');
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-stone-400 uppercase tracking-widest font-bold block">BACKGROUND LIVE PROMO VIDEO (YOUTUBE URL)</label>
                  <input
                    type="text"
                    value={bgVideoUrl}
                    onChange={(e) => setBgVideoUrl(e.target.value)}
                    className="w-full h-11 px-4 bg-black/40 border border-white/10 rounded-xl text-xs outline-none focus:border-[#C1FF00]"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl md:col-span-2">
                  <div>
                    <span className="text-xs font-bold text-white block">ENABLE BACKGROUND VIDEO</span>
                    <span className="text-[9px] text-white/40 block mt-0.5">Toggle live cinematic motion loop on landing portals</span>
                  </div>
                  <button 
                    onClick={() => setIsBgVideoEnabled(!isBgVideoEnabled)}
                    className={`px-4 h-9 rounded-lg text-[10px] uppercase font-mono font-black ${
                      isBgVideoEnabled ? 'bg-[#C1FF00] text-black' : 'bg-stone-800 text-stone-400'
                    }`}
                  >
                    {isBgVideoEnabled ? '🟢 ENABLED' : '🔴 DISABLED'}
                  </button>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[9px] font-mono text-stone-400 uppercase tracking-widest font-bold block">EDIT ABOUT US (LOBBY FOOTER TEXT)</label>
                  <textarea
                    rows={6}
                    value={aboutLodgeText}
                    onChange={(e) => setAboutLodgeText(e.target.value)}
                    className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-xs outline-none focus:border-[#C1FF00] resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 10. ADMIN USERS TAB */}
          {activeTab === 'admins' && (
            <div className="space-y-6 text-left">
              <div className="border-b border-white/5 pb-4">
                <h3 className="text-lg font-black uppercase text-white">👥 Admin & Staff Users Account Panel</h3>
                <p className="text-xs text-white/40 mt-1">Super Administrator has full power to register new admins, reset passwords or block active roles.</p>
              </div>

              {/* Add New Admin Form */}
              <form onSubmit={handleCreateAdmin} className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-4 text-left">
                <h4 className="text-xs font-black text-[#C1FF00] uppercase tracking-wider">👥 REGISTER NEW ADMINISTRATOR USER</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[8px] font-mono text-white/50 block">ADMIN FULL NAME</label>
                    <input 
                      type="text" 
                      required 
                      value={newAdminName} 
                      onChange={(e) => setNewAdminName(e.target.value)}
                      placeholder="e.g., Yoseph Abraham"
                      className="w-full h-10 px-3 bg-black/50 border border-white/10 rounded-lg text-xs" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-mono text-white/50 block">EMAIL ADDRESS</label>
                    <input 
                      type="email" 
                      required 
                      value={newAdminEmail} 
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      placeholder="name@papyruslodge.com"
                      className="w-full h-10 px-3 bg-black/50 border border-white/10 rounded-lg text-xs" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-mono text-white/50 block">SECURE PASSWORD</label>
                    <input 
                      type="password" 
                      required 
                      value={newAdminPassword} 
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-10 px-3 bg-black/50 border border-white/10 rounded-lg text-xs" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-mono text-white/50 block">ACCESS ROLE</label>
                    <select 
                      value={newAdminRole} 
                      onChange={(e) => setNewAdminRole(e.target.value)}
                      className="w-full h-10 px-3 bg-black/50 border border-white/10 rounded-lg text-xs text-white"
                    >
                      <option value="Admin">🛡️ Standard Admin User</option>
                      <option value="SuperAdmin">👑 Super Administrator</option>
                    </select>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-[#C1FF00] text-black text-[10px] font-black uppercase rounded-lg disabled:opacity-50">
                  {loading ? 'REGISTERING...' : 'CREATE ACCOUNT ✔️'}
                </button>
              </form>

              {/* Roster list */}
              <div className="space-y-3">
                <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest font-black block">Lodge Active Administrative Users</p>
                {adminUsers.length === 0 ? (
                  <div className="bg-[#121212] border border-white/10 p-4 rounded-xl text-left">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-xs font-black text-white">Super Admin (Primary Roster)</h4>
                        <p className="text-[10px] text-[#C1FF00] font-mono">tamecolorgrading@gmail.com</p>
                      </div>
                      <span className="text-[8px] font-mono bg-[#C1FF00]/10 text-[#C1FF00] border border-[#C1FF00]/20 px-2 py-1 rounded font-black uppercase tracking-wider">
                        SUPER ADMIN
                      </span>
                    </div>
                  </div>
                ) : (
                  adminUsers.map(admin => (
                    <div key={admin.id} className="bg-[#121212] border border-white/10 p-4 rounded-xl flex justify-between items-center text-left">
                      <div>
                        <h4 className="text-xs font-black text-white">{admin.name}</h4>
                        <p className="text-[10px] text-[#C1FF00] font-mono">{admin.email}</p>
                        <span className="text-[7px] font-mono text-white/40">Created: {new Date(admin.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[8px] font-mono border px-2 py-0.5 rounded font-black tracking-wider uppercase ${
                          admin.role === 'SuperAdmin' 
                            ? 'bg-[#C1FF00]/10 text-[#C1FF00] border-[#C1FF00]/20' 
                            : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                        }`}>
                          {admin.role}
                        </span>

                        <button 
                          onClick={() => handleToggleAdminStatus(admin.id, admin.status)}
                          className={`px-2.5 h-7 rounded text-[8px] font-black uppercase transition-colors ${
                            admin.status === 'Active' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-600 hover:text-white' 
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-600 hover:text-white'
                          }`}
                        >
                          {admin.status === 'Active' ? 'ACTIVE 🟢' : 'DISABLED 🔴'}
                        </button>

                        <button 
                          onClick={() => handleDeleteAdmin(admin.id, admin.email)}
                          className="p-1.5 bg-red-950/20 hover:bg-red-600 text-red-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                          title="Remove Admin Account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
