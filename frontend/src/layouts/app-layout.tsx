import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { WebSocketProvider } from '@/contexts/websocket-context';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode } from 'react';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

const AppLayout = ({ children, breadcrumbs, ...props }: AppLayoutProps) => (
    <WebSocketProvider>
        <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
            {children}
        </AppLayoutTemplate>
    </WebSocketProvider>
);

export default AppLayout;
export { AppLayout };
