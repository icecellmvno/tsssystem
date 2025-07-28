import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@/components/ui/sidebar';
import { LayoutGrid, Users, Database, Building2, Server, Clock, CreditCard, BarChart3, UserCog, Shield, KeyRound, Send, Filter, PhoneOff, MessageSquare, Settings, Route } from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems = [
    {
        title: 'Dashboard',
        url: '/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Country Management',
        url: '#',
        icon: Building2,
        items: [
            {
                title: 'Country Management',
                url: '/country-sites',
            },
            {
                title: 'Site Device Groups',
                url: '/device-groups',
            },
            {
                title: 'Android or Modem',
                url: '/devices',
            },
            {
                title: 'Sim Card Management',
                url: '/sim-cards',
                icon: CreditCard,
            },
        ],
    },

    {
        title: 'Reports',
        url: '#',
        icon: BarChart3,
        items: [
            {
                title: 'SMS Logs',
                url: '/sms-logs',
            },
            {
                title: 'USSD Logs',
                url: '/ussd-logs',
            },
            {
                title: 'Alarm Logs',
                url: '/alarm-logs',
            },
        ],
    },
    {
        title: 'SMPP Management',
        url: '#',
        icon: Server,
        items: [
            {
                title: 'SMPP Users',
                url: '/smpp-users',
            },
            {
                title: 'SMPP Routings',
                url: '/smpp-routings',
                icon: Route,
            },

        ],
    },
    {
        title: 'User Management',
        url: '#',
        icon: UserCog,
        items: [
            {
                title: 'Users',
                url: '/users',
                icon: Users,
            },
            {
                title: 'Roles',
                url: '/roles',
                icon: Shield,
            },
            {
                title: 'Permissions',
                url: '/permissions',
                icon: KeyRound,
            },
        ],
    },
    {
        title: 'System Settings',
        url: '#',
        icon: Settings,
        items: [
    
            {
                title: 'Schedule Tasks',
                url: '/schedule-tasks',
                icon: Clock,
            },
            {
                title: 'Blacklist Numbers',
                url: '/blacklist-numbers',
                icon: PhoneOff,
            },
            {
                title: 'Filters',
                url: '/filters',
                icon: Filter,
            },
            {
                title: 'MCC-MNC',
                url: '/mcc-mnc',
                icon: Database,
            },
            {
                title: 'Operator Commands',
                url: '/operator-commands',
                icon: Send,
            },
        ]
    }
];

export function AppSidebar() {
    return (
        <Sidebar>
            <SidebarHeader>
                <AppLogo />
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
                <NavFooter items={[]} />
            </SidebarFooter>
        </Sidebar>
    );
}
