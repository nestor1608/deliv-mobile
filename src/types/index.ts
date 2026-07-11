// src/types/index.ts - Shared TypeScript types across the Deliv app

export interface UserData {
  id: number;
  username: string;
  email: string;
  role: 'customer' | 'vendor' | 'delivery' | 'driver' | 'admin';
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
  userType: string;
}

export interface RegisterData {
  username: string;
  password: string;
  email: string;
  userType: string;
  phone?: string;
}

export interface ApiError {
  status: number;
  data: any;
  message: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface StoreProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  image?: string;
  category: string;
  is_available: boolean;
}

export interface OrderItem {
  id: number;
  product: StoreProduct;
  quantity: number;
  unit_price: number;
}

export interface Order {
  id: number;
  status: string;
  total: number;
  created_at: string;
  items: OrderItem[];
  delivery_address?: string;
}

export interface SalesStats {
  todayOrders: number;
  todayRevenue: number;
  monthlyRevenue: number;
  averageRating: number;
}

export interface VendorProfile {
  id: number;
  name: string;
  description: string;
  is_open: boolean;
  logo?: string;
  cover_image?: string;
  delivery_range_km: number;
  minimum_order: number;
}

export interface Notification {
  id: number;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
  type: string;
}

export interface LocationCoords {
  latitude: number;
  longitude: number;
  latitudeDelta?: number;
  longitudeDelta?: number;
}

export interface ChartData {
  labels: string[];
  datasets: { data: number[]; color?: string; label?: string }[];
}

// Auth API response types
export interface LoginResponse {
  access: string;
  refresh: string;
  user?: UserData;
}

export interface RegisterResponse {
  access?: string;
  refresh?: string;
  user?: UserData;
  id?: number;
  username?: string;
}

// Location tracking types
export interface LocationUpdate {
  latitude: number;
  longitude: number;
  timestamp?: string;
}

export interface LocationQueueItem {
  coords: {
    latitude: number;
    longitude: number;
  };
  timestamp?: number;
}

// Vendor types
export interface ProductFormData {
  name: string;
  description: string;
  price: number;
  category: string;
  is_available: boolean;
  image?: {
    uri: string;
    type: string;
    name: string;
  };
}

export interface OrderStatusUpdate {
  orderId: number;
  status: string;
  notes?: string;
}

// Notification types
export interface PushTokenRegistration {
  token: string;
  platform: string;
  user_type: string;
}

export interface NotificationListener {
  id: string;
  title?: string;
  body?: string;
  data?: Record<string, any>;
  timestamp: string;
  read: boolean;
}

// === API Response interfaces ===

// Generic paginated response wrapper
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status?: string;
}

export interface ProfileResponse {
  id: number;
  username: string;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  phone: string;
  avatar: string | null;
  address?: AddressData;
  business_name?: string;
  is_open?: boolean;
  delivery_range_km?: number;
  minimum_order?: number;
}

export interface AddressData {
  id: number;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  latitude: number;
  longitude: number;
  notes?: string;
  is_default?: boolean;
}

export interface CartItem {
  id: number;
  product: StoreProduct;
  quantity: number;
  unit_price: number;
  subtotal: number;
  notes?: string;
}

export interface CartData {
  id: number;
  items: CartItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  store: { id: number; name: string };
}

export interface OrderStatus {
  status: string;
  timestamp: string;
  note?: string;
}

export interface TripData {
  id: number;
  status: string;
  pickup: { latitude: number; longitude: number; address: string };
  dropoff: { latitude: number; longitude: number; address: string };
  rider: { name: string; phone: string; rating: number };
  driver?: { name: string; phone: string; vehicle: string };
  fare: number;
  distance: number;
  duration: number;
  created_at: string;
}

export interface DriverProfile {
  id: number;
  user: number;
  vehicle_type: string;
  vehicle_model: string;
  license_plate: string;
  is_online: boolean;
  rating: number;
  total_trips: number;
  total_earnings: number;
  current_location?: LocationCoords;
}

export interface DeliveryStats {
  todayOrders: number;
  todayRevenue: number;
  totalOrders: number;
  totalRevenue: number;
  averageRating: number;
  totalDistance: number;
  onlineHours: number;
}

export interface AdminStats {
  total_users: number;
  total_customers: number;
  total_vendors: number;
  total_delivery: number;
  total_drivers: number;
  total_orders: number;
  total_trips: number;
  total_revenue: number;
  active_vendors: number;
  active_delivery: number;
  active_drivers: number;
  pending_orders: number;
  orders_today: number;
  revenue_today: number;
  growth_percentage: number;
}

export interface DashboardData {
  stats: AdminStats;
  recent_orders: Order[];
  recent_trips: TripData[];
  sales_chart: { labels: string[]; data: number[] };
}

export interface DailyStats {
  date: string;
  revenue: number;
  orders: number;
}

export interface AdminDashboardResponse {
  total_revenue: number;
  total_orders: number;
  active_vendors: number;
  active_delivery: number;
  active_drivers: number;
  total_commission: number;
  daily_stats: DailyStats[];
  total_platform_revenue: number;
  total_platform_orders: number;
}

export interface NotificationData {
  id: number;
  title: string;
  body: string;
  data?: Record<string, any>;
  read: boolean;
  created_at: string;
  type: string;
}

// Generic type helper for API responses
export type QueryData<T> = T | undefined;
export type ListData<T> = T[];
