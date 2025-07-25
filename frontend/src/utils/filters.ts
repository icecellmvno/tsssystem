import { Filter, Route, Calendar, Clock, Tag, Code, User, Users, MessageSquare } from 'lucide-react';
import type { FilterType } from '@/types/filters';

export const filterTypes: FilterType[] = [
    { 
        value: 'TransparentFilter', 
        label: 'Transparent Filter', 
        icon: Filter, 
        description: 'Always matches any message criteria', 
        routes: 'All' 
    },
    { 
        value: 'ConnectorFilter', 
        label: 'Connector Filter', 
        icon: Route, 
        description: 'Matches the source connector of a message', 
        routes: 'MO' 
    },
    { 
        value: 'UserFilter', 
        label: 'User Filter', 
        icon: User, 
        description: 'Matches the owner of a MT message', 
        routes: 'MT' 
    },
    { 
        value: 'GroupFilter', 
        label: 'Group Filter', 
        icon: Users, 
        description: 'Matches the owner\'s group of a MT message', 
        routes: 'MT' 
    },
    { 
        value: 'SourceAddrFilter', 
        label: 'Source Address Filter', 
        icon: MessageSquare, 
        description: 'Matches the source address of a MO message', 
        routes: 'All' 
    },
    { 
        value: 'DestinationAddrFilter', 
        label: 'Destination Address Filter', 
        icon: MessageSquare, 
        description: 'Matches the destination address of a MT message', 
        routes: 'All' 
    },
    { 
        value: 'ShortMessageFilter', 
        label: 'Short Message Filter', 
        icon: MessageSquare, 
        description: 'Matches the content of a message', 
        routes: 'All' 
    },
    { 
        value: 'DateIntervalFilter', 
        label: 'Date Interval Filter', 
        icon: Calendar, 
        description: 'Matches the date of a message', 
        routes: 'All' 
    },
    { 
        value: 'TimeIntervalFilter', 
        label: 'Time Interval Filter', 
        icon: Clock, 
        description: 'Matches the time of a message', 
        routes: 'All' 
    },
    { 
        value: 'TagFilter', 
        label: 'Tag Filter', 
        icon: Tag, 
        description: 'Checks if message has a defined tag', 
        routes: 'All' 
    },
    { 
        value: 'EvalPyFilter', 
        label: 'Python Script Filter', 
        icon: Code, 
        description: 'Passes message to a third party python script for user-defined filtering', 
        routes: 'All' 
    },
];

export const getFilterTypeInfo = (type: string): FilterType => {
    return filterTypes.find(ft => ft.value === type) || {
        value: type,
        label: type,
        icon: Filter,
        description: 'Unknown filter type',
        routes: 'Unknown'
    };
};

export const getRouteBadgeVariant = (routes: string): 'default' | 'secondary' | 'outline' => {
    switch (routes) {
        case 'All':
            return 'default';
        case 'MO':
            return 'secondary';
        case 'MT':
            return 'outline';
        default:
            return 'default';
    }
};

export const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const formatLongDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}; 