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

export type StaffRole = 'waiter' | 'chef' | 'admin' | 'manager' | 'receptionist' | 'cashier' | 'guard' | 'delivery' | string;

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
  accessPrivilege?: 'waiter' | 'chef' | 'admin' | 'manager' | 'receptionist' | 'cashier' | 'guard' | 'delivery' | 'none' | string;
  username?: string;
  password?: string;
  securityAnswer?: string;
  vehicleType?: string;
  plateNumber?: string;
  deliveryZone?: string;
}

export interface DeliveryDriverState {
  staffName: string;
  status: 'available' | 'on_delivery' | 'offline';
  activeOrderId?: string;
  completedTrips?: number;
  lastReturnedAt?: string;
  updatedAt?: number;
}

export interface DeliveryPartnerCompany {
  id: string;
  nameAm: string;
  nameEn: string;
  serviceType: 'Food & Express' | 'Moto Courier' | 'City & Lodge Logistics' | 'On-Demand Ride & Parcel' | string;
  coverageCities: string;
  phone: string;
  whatsapp?: string;
  webhookOrPortalUrl?: string;
  baseFeeBirr: number;
  commissionPercent: number;
  active: boolean;
  notes?: string;
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
  nights?: number;
  paidAmount?: number;
  paymentStatus?: 'Paid' | 'Pending' | 'Partial';
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

export type OrderStatus = 'Pending' | 'Preparing' | 'Completed' | 'Paid' | 'Cancelled';
export type OrderType = 'dine' | 'delivery';
export type PaymentMethod = 'cash' | 'bank' | 'chapa';
export type DeliveryTrackingStage = 'Waiting Driver' | 'Assigned' | 'Picked Up' | 'Arrived' | 'Delivered';

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
  paymentVerified?: boolean;
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
  deliveryDriverName?: string;
  deliveryDriverPhone?: string;
  deliveryVehicleInfo?: string;
  deliveryStatus?: DeliveryTrackingStage;
  deliveryPinCode?: string;
  deliveryAssignedAt?: string;
  deliveryPickedUpAt?: string;
  deliveryArrivedAt?: string;
  deliveryDeliveredAt?: string;
  deliveryReturnedAt?: string;
  deliveryProofPhoto?: string;
  deliveryVerifiedByPin?: boolean;
  deliveryCashCollected?: boolean;
  deliveryMode?: 'internal' | 'partner';
  deliveryPartnerId?: string;
  deliveryPartnerName?: string;
  deliveryPartnerPhone?: string;
  deliveryPartnerTrackingCode?: string;
  deliveryPartnerFee?: number;
  time: string;
  date?: string;
  createdAt?: number;
  cookingStatus?: 'Pending' | 'Preparing' | 'Completed';
  servedByWaiter?: boolean;
  checkedByWaiter?: boolean;
  readyAt?: string;
  servedAt?: string;
  customerConfirmedReceipt?: boolean;
  customerReceivedAt?: string;
  cashPayMode?: 'cashier_desk' | 'waiter_or_delivery';
  cashPaymentRequested?: boolean;
  cashPaymentCode?: string;
  cashTenderedAmount?: number;
  cashChangeAmount?: number;
  cashRequestedAt?: string;
  cashConfirmedAt?: string;
  updatedAt?: number;
}

export interface AssistanceCall {
  id: string;
  location: string;
  time: string;
  active: boolean;
  type?: 'call' | 'pickup' | 'new_order' | 'cash_request' | 'room_booking' | 'table_booking';
  message?: string;
  targetWaiter?: string;
  targetRole?: 'waiter' | 'chef' | 'cashier' | 'manager' | 'admin' | 'support' | 'delivery' | 'receptionist';
  reason?: string;
  handledBy?: string;
  orderId?: string;
  createdAt?: number;
  repeatCount?: number;
}

export interface OnlineRoomBooking {
  id: string;
  roomType: string;
  preferredRoomNumber?: string;
  assignedRoomNumber?: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  guestCount: number;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  notes?: string;
  pricePerNight: number;
  totalAmount: number;
  paymentMethod: 'pay_on_arrival' | 'bank' | 'chapa';
  paymentStatus: 'Pending' | 'Paid';
  bankId?: string;
  bankRef?: string;
  receiptScreenshot?: string;
  status: 'Pending' | 'Confirmed' | 'Checked In' | 'Cancelled';
  linkedBookingId?: string;
  confirmedByStaff?: string;
  time: string;
  date: string;
  createdAt: number;
  updatedAt?: number;
}

export type TableSeatingZone = 'Main Dining' | 'Lakeview Terrace' | 'Garden Gazebo' | 'VIP Lounge';

export interface OnlineTableReservation {
  id: string;
  guestName: string;
  guestPhone: string;
  partySize: number;
  reservationDate: string;
  reservationTime: string;
  seatingZone: TableSeatingZone | string;
  assignedTable?: string;
  specialRequests?: string;
  bookingMode: 'table_only' | 'table_and_food';
  preOrderItems: OrderItem[];
  preOrderSubtotal: number;
  serviceCharge: number;
  vat: number;
  totalAmount: number;
  paymentMethod: 'pay_on_arrival' | 'bank' | 'chapa';
  paymentStatus: 'Pending' | 'Paid';
  bankId?: string;
  bankRef?: string;
  receiptScreenshot?: string;
  status: 'Pending' | 'Confirmed' | 'In Kitchen' | 'Seated' | 'Completed' | 'Cancelled';
  linkedOrderId?: string;
  confirmedByStaff?: string;
  time: string;
  date: string;
  createdAt: number;
  updatedAt?: number;
}

export interface LeadershipContacts {
  managerName: string;
  managerPhone: string;
  managerTelegram?: string;
  managerWhatsapp?: string;
  managerAvailable?: boolean;
  gmName: string;
  gmPhone: string;
  gmTelegram?: string;
  gmWhatsapp?: string;
  gmAvailable?: boolean;
  supportName: string;
  supportPhone: string;
  supportTelegram?: string;
  supportWhatsapp?: string;
  supportAvailable?: boolean;
}

export interface LeadershipMessage {
  id: string;
  target: 'manager' | 'admin' | 'support' | 'both';
  location: string;
  senderName?: string;
  senderPhone?: string;
  topic: string;
  message: string;
  time: string;
  date: string;
  status: 'Pending' | 'Replied' | 'Resolved';
  reply?: string;
  repliedBy?: string;
  replyTime?: string;
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

export type ShiftPeriod = 'Morning' | 'Afternoon' | 'Evening' | 'Night' | 'Full Day';

export interface ShiftAssignment {
  id: string;
  staffName: string;
  staffRole: 'waiter' | 'chef';
  location: string;
  locationType: 'table' | 'room';
  shiftPeriod: ShiftPeriod;
  date: string;
  active: boolean;
  assignedBy?: string;
  notes?: string;
}

export interface StockAlertLogEntry {
  id: string;
  menuItemId: string;
  itemNameAm: string;
  itemNameEn: string;
  category: string;
  previousAvailable: boolean;
  newAvailable: boolean;
  changedByName: string;
  changedByRole: string;
  time: string;
  date: string;
  timestamp: number;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  pushDispatched?: boolean;
  smsDispatched?: boolean;
}

export interface StockAlertSettings {
  audioEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  managerPhone: string;
  customerSoldOutMode: 'show_sold_out' | 'hide';
}

export interface QrPrintLogEntry {
  id: string;
  location: string;
  qrUrl: string;
  printedByName: string;
  printedByRole: string;
  time: string;
  date: string;
  timestamp: number;
}
