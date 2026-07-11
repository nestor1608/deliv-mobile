// Fix icon library types
declare module '@expo/vector-icons/Ionicons' {
  import { ComponentType } from 'react';
  import { TextStyle, ViewStyle } from 'react-native';
  interface IconProps {
    name: string;
    size?: number;
    color?: string;
    style?: TextStyle | ViewStyle;
  }
  const Ionicons: ComponentType<IconProps>;
  export default Ionicons;
}

// Fix for any untyped icon modules
declare module '@expo/vector-icons' {
  import { ComponentType } from 'react';
  import { TextStyle, ViewStyle } from 'react-native';
  interface IconProps {
    name: string;
    size?: number;
    color?: string;
    style?: TextStyle | ViewStyle;
  }
  export const Ionicons: ComponentType<IconProps>;
  export const MaterialIcons: ComponentType<IconProps>;
  export const MaterialCommunityIcons: ComponentType<IconProps>;
  export const FontAwesome: ComponentType<IconProps>;
  export const Feather: ComponentType<IconProps>;
  export const AntDesign: ComponentType<IconProps>;
}

// Fix context type issue (AuthContext defaults)
declare module '../context/AuthContext' {
  export interface AuthContextType {
    isLoading: boolean;
    userToken: string | null;
    userData: any;
    API_BASE_URL: string;
    login: (username: string, password: string, userType: string) => Promise<any>;
    register: (userData: any) => Promise<any>;
    logout: () => Promise<any>;
    updateProfile: (profileData: any) => Promise<{ success: boolean; data: any }>;
    refreshAccessToken: () => Promise<string | null>;
    isAuthenticated: boolean;
    authenticatedFetch: (url: string, options?: any) => Promise<Response>;
  }
  export const AuthContext: React.Context<AuthContextType>;
  export const AuthProvider: React.ComponentType<{ children: React.ReactNode }>;
}

declare module '../../src/context/AuthContext' {
  export interface AuthContextType {
    isLoading: boolean;
    userToken: string | null;
    userData: any;
    API_BASE_URL: string;
    login: (username: string, password: string, userType: string) => Promise<any>;
    register: (userData: any) => Promise<any>;
    logout: () => Promise<any>;
    updateProfile: (profileData: any) => Promise<{ success: boolean; data: any }>;
    refreshAccessToken: () => Promise<string | null>;
    isAuthenticated: boolean;
    authenticatedFetch: (url: string, options?: any) => Promise<Response>;
  }
  export const AuthContext: React.Context<AuthContextType>;
}

// Fix expo-location with extended types
declare module 'expo-location' {
  export interface LocationObject {
    coords: {
      latitude: number;
      longitude: number;
      altitude: number | null;
      accuracy: number | null;
      altitudeAccuracy: number | null;
      heading: number | null;
      speed: number | null;
    };
    timestamp: number;
  }
  export interface LocationCoords {
    latitude: number;
    longitude: number;
    altitude: number | null;
    accuracy: number | null;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
  }
  export interface LocationData {
    coords: LocationCoords;
    timestamp: number;
  }
  export type LocationSubscription = { remove: () => void };
  export const Accuracy: {
    Low: number;
    Lowest: number;
    Medium: number;
    High: number;
    Highest: number;
    Best: number;
    BestForNavigation: number;
  };
  export function getCurrentPositionAsync(options?: any): Promise<LocationObject>;
  export function requestForegroundPermissionsAsync(): Promise<{ status: string }>;
  export function requestBackgroundPermissionsAsync(): Promise<{ status: string }>;
  export function watchPositionAsync(options: any, callback: (location: LocationObject) => void): Promise<LocationSubscription>;
  export function geocodeAsync(address: string): Promise<{ latitude: number; longitude: number }[]>;
  export function reverseGeocodeAsync(location: { latitude: number; longitude: number }): Promise<{
    street?: string;
    streetNumber?: string;
    district?: string;
    city?: string;
    region?: string;
    country?: string;
    postalCode?: string;
    isoCountryCode?: string;
  }[]>;
}

declare module 'expo-secure-store' {
  export function getItemAsync(key: string): Promise<string | null>;
  export function setItemAsync(key: string, value: string): Promise<void>;
  export function deleteItemAsync(key: string): Promise<void>;
}

declare module 'expo-notifications' {
  export interface NotificationContent {
    title?: string;
    body?: string;
    data?: any;
    sound?: boolean;
    badge?: number;
  }
  export interface NotificationRequest {
    identifier: string;
    content: NotificationContent;
    trigger: any;
  }
  export interface Notification {
    date: number;
    request: NotificationRequest;
    manifest?: any;
  }
  export interface NotificationBehavior {
    shouldShowAlert: boolean;
    shouldPlaySound: boolean;
    shouldSetBadge: boolean;
    shouldShowBanner: boolean;
    shouldShowList: boolean;
  }
  export interface NotificationResponse {
    notification: Notification;
    actionIdentifier: string;
  }
  export enum PermissionStatus {
    NOT_DETERMINED = 'not_determined',
    DENIED = 'denied',
    AUTHORIZED = 'authorized',
    LIMITED = 'limited',
  }
  export type ExpoPushToken = string;
  export function getExpoPushTokenAsync(options?: any): Promise<{ data: string }>;
  export function getPermissionsAsync(): Promise<{ status: string; granted?: boolean }>;
  export function requestPermissionsAsync(): Promise<{ status: string; granted?: boolean }>;
  export function scheduleNotificationAsync(notification: { content: NotificationContent; trigger?: any }): Promise<string>;
  export function addNotificationReceivedListener(handler: (event: Notification) => void): { remove: () => void };
  export function addNotificationResponseReceivedListener(handler: (event: NotificationResponse) => void): { remove: () => void };
  export function setNotificationCategoryAsync(categoryId: string, actions: any[]): Promise<void>;
  export function setNotificationHandler(handler: (notification: Notification) => NotificationBehavior | Promise<NotificationBehavior>): void;
  export function addPushTokenListener(listener: (token: ExpoPushToken) => void): { remove: () => void };
}

declare module 'expo-sqlite' {
  export interface SQLResultSet {
    rows: { _array: any[]; length: number; item: (i: number) => any };
    insertId?: number;
    rowsAffected: number;
  }
  export interface SQLResultSetRowList {
    _array: any[];
    length: number;
    item: (i: number) => any;
  }
  export interface SQLiteDatabase {
    transaction(fn: (tx: SQLTransaction) => void): void;
    execute(sql: string, params?: any[]): Promise<SQLResultSet>;
  }
  export interface SQLTransaction {
    execute(sql: string, params?: any[]): Promise<SQLResultSet>;
  }
  export type SQLiteDatabase = any;
  export function openDatabase(name: string): SQLiteDatabase;
  export function openDatabaseAsync(name: string): Promise<SQLiteDatabase>;
}

declare module 'i18next' {
  export interface i18n {
    language: string;
    changeLanguage(lng: string): Promise<any>;
    t(key: string, options?: any): string;
    use(lanner: any): any;
    init(options?: any): Promise<any>;
  }
  const i18n: i18n;
  export default i18n;
}

declare module 'react-i18next' {
  export function useTranslation(): {
    t: (key: string, options?: any) => string;
    i18n: i18n;
  };
  export function initReactI18next(): any;
}

declare module 'expo-router' {
  import { ComponentType } from 'react';
  import { AnchorHTMLAttributes, CSSProperties } from 'react';
  export function useRouter(): { push: (path: string | { pathname: string; params?: any }) => void; back: () => void; replace: (path: string) => void };
  export function useLocalSearchParams(): Record<string, string | string[]>;
  export function useFocusEffect(callback: () => void | (() => void)): void;
  export const Stack: ComponentType<{ children?: any; screenOptions?: any }> & { Screen: ComponentType<{ name: string; options?: any }> };
  export const Tabs: ComponentType<{ children?: React.ReactNode; screenOptions?: any }> & { Screen: ComponentType<{ name: string; options?: any }> };
  export const router: { push: (path: string) => void; back: () => void };
  export const Link: ComponentType<{
    href: string;
    children?: React.ReactNode;
    style?: CSSProperties;
    className?: string;
  } & AnchorHTMLAttributes<HTMLAnchorElement>>;
}

declare module 'expo-device' {
  export const isDevice: boolean;
  export function getDeviceTypeAsync(): Promise<number>;
  export function getModelName(): string;
}

declare module '@react-native-community/datetimepicker' {
  import { ComponentType } from 'react';
  export interface DateTimePickerProps {
    value?: Date;
    mode?: 'date' | 'time' | 'datetime';
    display?: 'default' | 'spinner' | 'calendar' | 'clock';
    onChange?: (event: any, date?: Date) => void;
    minimumDate?: Date;
    maximumDate?: Date;
  }
  const DateTimePicker: ComponentType<DateTimePickerProps>;
  export default DateTimePicker;
}

declare module 'expo-linear-gradient' {
  import { ComponentType, ReactNode } from 'react';
  export const LinearGradient: ComponentType<{ colors: string[]; start?: { x: number; y: number }; end?: { x: number; y: number }; style?: any; children?: ReactNode }>;
}

declare module 'react-native-gesture-handler' {
  export const GestureHandlerRootView: React.ComponentType<{ children: React.ReactNode; style?: any }>;
  export const Swipeable: React.ComponentType<{ children: React.ReactNode; onSwipeableOpen?: () => void; renderRightActions?: () => React.ReactNode }>;
}

declare module 'react-native-reanimated' {
  const Reanimated: any;
  export default Reanimated;
  export function useSharedValue(value: any): any;
  export function useAnimatedStyle(updater: () => any): any;
  export function withSpring(toValue: any, config?: any): any;
  export function withTiming(toValue: any, config?: any): any;
}

declare module 'expo-image-picker' {
  export interface ImagePickerOptions {
    mediaTypes?: any;
    allowsEditing?: boolean;
    aspect?: number[];
    quality?: number;
    base64?: boolean;
  }
  export interface ImageInfo {
    uri: string;
    type?: string;
    fileName?: string;
  }
  export function launchImageLibraryAsync(options?: ImagePickerOptions): Promise<{ canceled: boolean; assets?: ImageInfo[] }>;
  export function requestMediaLibraryPermissionsAsync(): Promise<{ status: string }>;
  export const MediaTypeOptions: any;
}

// Fix for uuid
declare module 'uuid' {
  export function v4(): string;
  export function v1(): string;
}

// Global for any other untyped module
declare module 'react-native-chart-kit' {
  const ChartKit: any;
  export default ChartKit;
  export const LineChart: any;
  export const BarChart: any;
  export const PieChart: any;
}

// React SVG module declarations
declare module 'react-native-svg' {
  import React from 'react';
  const Svg: React.ComponentType<any>;
  const Path: React.ComponentType<any>;
  const Rect: React.ComponentType<any>;
  const Circle: React.ComponentType<any>;
  const Line: React.ComponentType<any>;
  const Polyline: React.ComponentType<any>;
  const Text: React.ComponentType<any>;
  const G: React.ComponentType<any>;
  export { Svg, Path, Rect, Circle, Line, Polyline, Text, G };
  export default Svg;
}

// Jest global types
declare var jest: {
  fn(): any;
  mockResolvedValue(value: any): any;
  mockResolvedValueOnce(value: any): any;
  mockImplementation(fn: any): any;
  mockImplementationOnce(fn: any): any;
  clearAllMocks(): void;
};

declare function beforeEach(fn: () => void | Promise<void>): void;
declare function afterEach(fn: () => void | Promise<void>): void;
declare function describe(name: string, fn: () => void): void;
declare function test(name: string, fn: () => void | Promise<void>): void;
declare function it(name: string, fn: () => void | Promise<void>): void;
declare function expect(value: any): any;

// WebSocket service module
declare module '../../src/services/ws' {
  const ws: any;
  export default ws;
}
declare module '../../hooks/useWebSocket' {
  export function useWebSocket(url: string, options?: any): any;
}

// WebSocket service module (alternate path)
declare module '../services/ws' {
  export interface WebSocketMessage {
    type: string;
    data: any;
  }
  export class WebSocketService {
    constructor(url: string);
    connect(): void;
    disconnect(): void;
    send(message: WebSocketMessage): void;
    onMessage(callback: (message: WebSocketMessage) => void): void;
    onError(callback: (error: any) => void): void;
    onClose(callback: () => void): void;
  }
  export default WebSocketService;
}

// react-native-maps declaration
declare module 'react-native-maps' {
  import React from 'react';
  const MapView: React.ComponentType<any>;
  const Marker: React.ComponentType<any>;
  const Polyline: React.ComponentType<any>;
  const Callout: React.ComponentType<any>;
  const Overlay: React.ComponentType<any>;
  export const PROVIDER_GOOGLE: string;
  export { MapView, Marker, Polyline, Callout, Overlay };
  export default MapView;
}
