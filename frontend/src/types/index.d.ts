import { LucideIcon } from 'lucide-react';
import type { Config } from 'ziggy-js';

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
    ziggy: Config & { location: string };
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

export interface UssdLog {
    id: number;
    session_id: string;
    device_id: string;
    device_name?: string;
    device_imei?: string;
    device_imsi?: string;
    sim_slot?: number;
    ussd_code: string;
    request_message?: string;
    response_message?: string;
    status: string;
    sent_at?: string;
    received_at?: string;
    error_message?: string;
    metadata?: any;
    device_group_id?: number;
    device_group?: string;
    country_site_id?: number;
    country_site?: string;
    created_at: string;
    updated_at: string;
}
