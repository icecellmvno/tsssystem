import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { UserInfo } from '@/components/user-info';
import { UserMenuContent } from '@/components/user-menu-content';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuthStore } from '@/stores/auth-store';
import { ChevronsUpDown } from 'lucide-react';

export function NavUser() {
    const { state } = useSidebar();
    const isMobile = useIsMobile();
    const { user } = useAuthStore();

    if (!user) {
        return null;
    }

    // Convert the user to the expected format
    const userInfo = {
        name: user.username,
        email: user.email,
        avatar: undefined, // You can add avatar support later if needed
    };

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton size="lg" className="group text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent">
                            <UserInfo user={userInfo as any} />
                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        align="end"
                        side={isMobile ? 'bottom' : state === 'collapsed' ? 'left' : 'bottom'}
                    >
                        <UserMenuContent user={userInfo as any} />
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
