import type { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href?: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
    items?: NavItem[];
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}

export interface SmppUser {
  id: number;
  system_id: string;
  password: string;
  max_connection_speed: number;
  is_active: boolean;
  is_online: boolean;
  last_connected_at?: string;
  last_disconnected_at?: string;
  last_ip_address?: string;
  connection_count: number;
  total_messages_sent: number;
  total_messages_received: number;
  
  // MT Messaging Credentials
  mt_src_addr?: string;
  mt_http_throughput?: string;
  mt_balance?: string;
  mt_smpps_throughput?: string;
  mt_sms_count?: string;
  mt_early_percent?: string;
  mt_priority_filter?: string;
  mt_content_filter?: string;
  mt_src_addr_filter?: string;
  mt_dst_addr_filter?: string;
  mt_validity_period_filter?: string;
  mt_http_send: boolean;
  mt_http_dlr_method: boolean;
  mt_http_balance: boolean;
  mt_smpps_send: boolean;
  mt_priority: boolean;
  mt_http_long_content: boolean;
  mt_src_addr_auth: boolean;
  mt_dlr_level: boolean;
  mt_http_rate: boolean;
  mt_validity_period: boolean;
  mt_http_bulk: boolean;
  mt_hex_content: boolean;
  
  created_at: string;
  updated_at: string;
}

export interface SmppUserCreateRequest {
  system_id: string;
  password: string;
  max_connection_speed: number;
  is_active: boolean;
  
  // MT Messaging Credentials
  mt_src_addr?: string;
  mt_http_throughput?: string;
  mt_balance?: string;
  mt_smpps_throughput?: string;
  mt_sms_count?: string;
  mt_early_percent?: string;
  mt_priority_filter?: string;
  mt_content_filter?: string;
  mt_src_addr_filter?: string;
  mt_dst_addr_filter?: string;
  mt_validity_period_filter?: string;
  mt_http_send?: boolean;
  mt_http_dlr_method?: boolean;
  mt_http_balance?: boolean;
  mt_smpps_send?: boolean;
  mt_priority?: boolean;
  mt_http_long_content?: boolean;
  mt_src_addr_auth?: boolean;
  mt_dlr_level?: boolean;
  mt_http_rate?: boolean;
  mt_validity_period?: boolean;
  mt_http_bulk?: boolean;
  mt_hex_content?: boolean;
}

export interface SmppUserUpdateRequest extends Partial<SmppUserCreateRequest> {} 