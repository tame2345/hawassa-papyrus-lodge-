/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CategoryType = 'food' | 'drinks' | 'room' | 'venue' | 'traditional' | string;

export interface MenuItem {
  id: string;
  cat: CategoryType;
  nameAm: string;
  nameEn: string;
  price: number;
  desc: string;
  image: string;
  available: boolean;
  customizable?: boolean;
}

export type StaffRole = 'waiter' | 'chef' | 'admin' | 'manager' | 'receptionist' | string;

export interface StaffMember {
  name: string;
  role: StaffRole;
  pin: string;
  active: boolean;
  photo?: string;
  phone?: string;
  hireDate?: string;
  info?: string;
  education?: string;
  certificatePhoto?: string;
  accessPrivilege?: 'waiter' | 'chef' | 'admin' | 'manager' | 'receptionist' | 'cashier' | 'none' | string;
  username?: string;
  password?: string;
  securityAnswer?: string;
}

export interface GuestIdDetail {
  fullName: string;
  idNumber: string;
  idPhotoUrl?: string;
}

export interface RoomBooking {
  id: string;
  roomNumber: string;
  roomType?: string;
  guestCount: number;
  guestIds: GuestIdDetail[];
  contactPhone: string;
  checkInDate: string;
  checkOutDate?: string;
  status: 'Active' | 'Checked Out' | string;
  pricePerNight?: number;
  notes?: string;
  receptionistName?: string;
  checkedOutByStaff?: string;
}

export interface BankAccount {
  id: string;
  name: string;
  holder: string;
  number: string;
}

export type OrderStatus = 'Pending' | 'Preparing' | 'Completed' | 'Paid';
export type OrderType = 'dine' | 'delivery';
export type PaymentMethod = 'cash' | 'bank' | 'chapa';

export interface OrderItem {
  id: string;
  baseId: string;
  name: string;
  qty: number;
  price: number;
}

export interface Order {
  id: string;
  location: string;
  items: OrderItem[];
  total: number;
  serviceCharge: number;
  vat: number;
  tip: number;
  status: OrderStatus;
  payment: PaymentMethod;
  bankRef?: string;
  bankId?: string;
  receiptScreenshot?: string;
  receiptComment?: string;
  confirmed: boolean;
  waiter?: string;
  createdByRole?: string;
  chefName?: string;
  cashierName?: string;
  orderType: OrderType;
  deliveryPhone?: string;
  deliveryAddress?: string;
  time: string;
  date?: string;
  createdAt?: number;
  cookingStatus?: 'Pending' | 'Preparing' | 'Completed';
  servedByWaiter?: boolean;
}

export interface AssistanceCall {
  id: string;
  location: string;
  time: string;
  active: boolean;
  type?: 'call' | 'pickup';
  message?: string;
}

export interface Feedback {
  id: string;
  text: string;
  time: string;
  reply?: string;
  replyTime?: string;
}

export interface PromoBanner {
  title: string;
  desc: string;
  tag: string;
  video: string;
  poster: string;
}

export interface AttendanceRecord {
  id: string;
  staffName: string;
  role: string;
  date: string;
  clockInTime?: string;
  clockOutTime?: string;
  status: 'Present' | 'Absent' | 'Late';
}

export interface BonusRecord {
  id: string;
  staffName: string;
  amount: number;
  reason: string;
  date: string;
  time: string;
}

export interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  time: string;
  notes?: string;
  recordedByStaff?: string;
  recordedByRole?: string;
}

export interface VisitorLog {
  id: string;
  name: string;
  phone: string;
  carPlate: string;
  purpose: string;
  timeIn: string;
  timeOut?: string;
  status: 'In Lodge' | 'Checked Out' | string;
  vehicleType?: 'car' | 'motorcycle' | 'walk' | string;
  ticketTagNumber?: string;
  registeredByGuard?: string;
  registeredByRole?: string;
  verifiedByGuard?: string;
}



