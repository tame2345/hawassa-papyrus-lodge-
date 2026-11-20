/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MenuItem, StaffMember, BankAccount, PromoBanner } from './types';

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  {
    id: 'm1',
    cat: 'food',
    nameAm: 'የሽከላ ጥብስ',
    nameEn: 'Shekla Tibs',
    price: 650,
    desc: 'ጥሬ ስጋ, ቅቤ, ነጭ ሽንኩርት በተመረጡ ቅመማ ቅመሞች',
    image: 'https://images.unsplash.com/photo-1629812456605-4a044bd38729?w=400&auto=format&fit=crop',
    available: true,
    customizable: true
  },
  {
    id: 'm2',
    cat: 'food',
    nameAm: 'ልዩ ክትፎ',
    nameEn: 'Special Kitfo',
    price: 850,
    desc: 'ለስላሳ ስጋ, ሚጥሚጣ, አገር በቀል ቆንጆ ቅቤ, አይብ',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&auto=format&fit=crop',
    available: true,
    customizable: true
  },
  {
    id: 'm8',
    cat: 'food',
    nameAm: 'የሀዋሳ ዓሳ ጥብስ',
    nameEn: 'Fried Hawassa Fish',
    price: 450,
    desc: 'ትኩስ ከሀይቁ የወጣ አሳ በጥብስ, በቃሪያና በሎሚ',
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&auto=format&fit=crop',
    available: true,
    customizable: true
  },
  {
    id: 'm10',
    cat: 'food',
    nameAm: 'የበግ በረካ ጥብስ',
    nameEn: 'Special Mutton Tibs',
    price: 700,
    desc: 'በሽንኩርት, በቅቤ እና በቃሪያ የተጠበሰ ምርጥ ስጋ',
    image: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=400&auto=format&fit=crop',
    available: true,
    customizable: true
  },
  {
    id: 'm9',
    cat: 'food',
    nameAm: 'የዓሳ ጉላሽ',
    nameEn: 'Fish Goulash',
    price: 480,
    desc: 'በተመረጡ ቅመማቅመሞች የተሰራ ዝነኛው የዓሳ ጉላሽ ከሩዝ ጋር',
    image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400&auto=format&fit=crop',
    available: true
  },
  {
    id: 'm11',
    cat: 'food',
    nameAm: 'የጾም በያይነቱ',
    nameEn: 'Fasting Beyaynetu',
    price: 320,
    desc: 'ምስር ክክ, ሽሮ ወጥ, ጥቅል ጎመን, ቀይ ስር ሰላጣ',
    image: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=400&auto=format&fit=crop',
    available: true
  },
  {
    id: 'm3',
    cat: 'drinks',
    nameAm: 'ፓፒረስ ልዩ ጁስ',
    nameEn: 'Papyrus Special Juice',
    price: 180,
    desc: 'ከሀገር በቀል ትኩስ ፍራፍሬዎች (አቮካዶ, ማንጎ, ፓፓያ) የተጨመቀ',
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&auto=format&fit=crop',
    available: true
  },
  {
    id: 'm4',
    cat: 'drinks',
    nameAm: 'የቀዝቃዛ ቢራ (Draft)',
    nameEn: 'Cold Draft Beer',
    price: 110,
    desc: 'ትኩስነቱ የተጠበቀ ምርጥ ድራፍት ቢራ ቀዝቃዛ',
    image: 'https://images.unsplash.com/photo-1567696911980-2eed69a4604a?w=400&auto=format&fit=crop',
    available: true
  },
  {
    id: 'm12',
    cat: 'drinks',
    nameAm: 'የጀበና ቡና',
    nameEn: 'Traditional Coffee',
    price: 80,
    desc: 'በባህላዊ መንገድ የተቆላና በጀበና የፈላ ምርጥ የይርጋጨፌ ቡና',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop',
    available: true
  },
  {
    id: 'm13',
    cat: 'drinks',
    nameAm: 'የሀገር ባህል ጠጅ',
    nameEn: 'Honey Wine (Tej)',
    price: 200,
    desc: 'ከተፈጥሮ ንፁህ ማር የተዘጋጀ ልዩ የሀገር ባህል ጠጅ በብርሌ',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&auto=format&fit=crop',
    available: true
  },
  {
    id: 'm5',
    cat: 'room',
    nameAm: 'ስታንዳርድ አልጋ (Lakeside)',
    nameEn: 'Standard Room Single',
    price: 3500,
    desc: 'ምቹ አልጋ, ከነጻ የእንፋሎት መታጠቢያ, ቁርስ እና ፈጣን ኢንተርኔት ጋር',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&auto=format&fit=crop',
    available: true
  },
  {
    id: 'm6',
    cat: 'room',
    nameAm: 'ዴሉክስ ቪ አይ ፒ ሱዊት',
    nameEn: 'Deluxe VIP Suite',
    price: 6500,
    desc: 'ትልቅ ሳሎን ያለውና ወደ ውቡ ሀይቅ የሚመለከት የቅንጦት ማረፊያ',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&auto=format&fit=crop',
    available: true
  },
  {
    id: 'm7',
    cat: 'venue',
    nameAm: 'የባህር ዳርቻ አትክልት ቦታ',
    nameEn: 'Lakeside Garden Venue',
    price: 15000,
    desc: 'ለሰርግ, መጠነኛ ስራዎች እና ለትልልቅ ስብሰባዎች የሚሆን ውብ መናፈሻ',
    image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&auto=format&fit=crop',
    available: true
  },
  {
    id: 't1',
    cat: 'traditional',
    nameAm: 'ሙሉ የባህል በያይነቱ',
    nameEn: 'Cultural Beyaynetu Special',
    price: 450,
    desc: 'ድንቅ የባህል ምግብ በያይነቱ - ሽሮ, ክክ, ምስር, ጥቅል ጎመን, ሰላጣ ከቃሪያ ጋር',
    image: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=400&auto=format&fit=crop',
    available: true,
    customizable: true
  },
  {
    id: 't2',
    cat: 'traditional',
    nameAm: 'የሀገር ባህል ዶሮ ወጥ',
    nameEn: 'Traditional Ethiopian Doro Wot',
    price: 980,
    desc: 'በሀገር ቅቤ እና በኮረሪማ የተቀቀለ ድንቅ የዶሮ ወጥ ከቆንጆ እንቁላል እና ከአይብ ጋር',
    image: 'https://images.unsplash.com/photo-1629812456605-4a044bd38729?w=400&auto=format&fit=crop',
    available: true,
    customizable: true
  },
  {
    id: 't3',
    cat: 'traditional',
    nameAm: 'የገበታ ቦዘና ሽሮ',
    nameEn: 'Bozena Shiro Claypot',
    price: 390,
    desc: 'በንፁህ የተንቀጠቀጠ የበሬ ስጋ ቁርጥራጭ እና ቅቤ የተሰራ ልዩ የሸክላ ሽሮ ወጥ',
    image: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=400&auto=format&fit=crop',
    available: true
  },
  {
    id: 't4',
    cat: 'traditional',
    nameAm: 'የጉራጌ ባህል ክትፎ (በቆጮ)',
    nameEn: 'Gurage Kitfo with Kocho',
    price: 890,
    desc: 'የተቀቀለ ንፁህ ለስላሳ ስጋ በቅቤ እና በሚጥሚጣ ከባህላዊ ቆጮ, አይብ እና ጎመን ጋር',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&auto=format&fit=crop',
    available: true,
    customizable: true
  }
];

export const INITIAL_STAFF: StaffMember[] = [
  { name: 'ሄኖክ ወርቁ', role: 'admin', pin: '1111', active: false },
  { name: 'ኪያ ማሞ (Manager)', role: 'manager', pin: '4444', active: false },
  { name: 'ሶፊያ በቀለ', role: 'chef', pin: '2222', active: false },
  { name: 'ዳዊት አብርሃም', role: 'waiter', pin: '3333', active: false },
  { name: 'ቲጂ ጌታቸው (Cashier)', role: 'cashier', pin: '5555', active: false },
  { name: 'ጌታቸው ካሳ (Security)', role: 'guard', pin: '7777', active: false }
];

export const INITIAL_BANKS: BankAccount[] = [
  { id: 'b1', name: 'የኢትዮጵያ ንግድ ባንክ (CBE)', holder: 'Papyrus Lodge PLC', number: '1000182746432' },
  { id: 'b2', name: 'တယ်ሌብር (Telebirr)', holder: 'Hawassa Papyrus Lodge', number: '0919629347' }
];

export const PROMO_BANNERS: PromoBanner[] = [
  {
    title: 'በፓፒረስ ሎጅ ልዩ የሳምንቱ መጨረሻ ቅናሽ!',
    desc: 'የቪ አይ ፒ ክፍሎችን ሲይዙ የ15% ቅናሽ ያገኛሉ፤ እንዲሁም ነጻ የሀይቅ ላይ የጀልባ ጉዞ ተዘጋጅቶልዎታል።',
    tag: 'ልዩ ቅናሽ (Lodge Specials)',
    poster: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600&auto=format&fit=crop'
  },
  {
    title: 'የእንግዳ ማረፊያ እና የባህል ምግቦች',
    desc: 'የሀዋሳን ትኩስ ዓሳ እና ባህላዊ የሽከላ ጥብስ በቅናሽ ዋጋ እየተዝናኑ ይመገቡ።',
    tag: 'ምርጥ ምግቦች (Tasty Delights)',
    poster: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=600&auto=format&fit=crop'
  }
];
