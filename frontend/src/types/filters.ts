export interface FilterItem {
    id: number;
    name: string;
    type: string;
    description: string;
    is_active: boolean;
    config: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export interface PaginatedFilters {
    data: FilterItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: any[];
}

export interface FilterType {
    value: string;
    label: string;
    icon: any;
    description: string;
    routes: string;
}

export interface CreateFilterData {
    name: string;
    type: string;
    description: string;
    is_active: boolean;
    config: Record<string, any>;
}

export interface UpdateFilterData extends CreateFilterData {
    id: number;
} 