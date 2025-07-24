export interface BlacklistNumber {
    id: number;
    number: string;
    type: 'sms' | 'manual';
    reason: string | null;
    created_at: string;
    updated_at: string;
}

export interface CreateBlacklistNumberData {
    number: string;
    type: 'sms' | 'manual';
    reason?: string;
}

export interface UpdateBlacklistNumberData {
    number?: string;
    type?: 'sms' | 'manual';
    reason?: string;
}

export interface BlacklistNumbersFilters {
    search?: string;
    type?: string;
    sort_by?: string;
    sort_order?: string;
    page?: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: any[];
}

export interface ImportResult {
    success: boolean;
    message: string;
    imported?: number;
    failed?: number;
    errors?: string[];
}

export interface BulkDeleteRequest {
    ids: number[];
}

export interface BulkPasteRequest {
    lines: string;
}

export interface ExportFilters {
    search?: string;
    type?: string;
    sort_by?: string;
    sort_order?: string;
    format?: 'csv' | 'xlsx';
}

// Form validation types
export interface BlacklistNumberFormErrors {
    number?: string;
    type?: string;
    reason?: string;
}

// API response types
export interface ApiResponse<T> {
    data: T;
    message?: string;
    success: boolean;
}

export interface ApiError {
    message: string;
    errors?: Record<string, string[]>;
    status: number;
}

// Component props types
export interface BlacklistNumbersIndexProps {
    blacklistNumbers: PaginatedResponse<BlacklistNumber>;
    filters: BlacklistNumbersFilters;
}

export interface BlacklistNumberShowProps {
    blacklistNumber: BlacklistNumber;
}

export interface BlacklistNumberEditProps {
    blacklistNumber: BlacklistNumber;
}

export interface BlacklistNumberCreateProps {
    // No props needed for create page
}

// Table column types
export interface BlacklistNumberTableColumn {
    key: keyof BlacklistNumber;
    label: string;
    sortable?: boolean;
    render?: (value: any, record: BlacklistNumber) => React.ReactNode;
}

// Filter types
export interface BlacklistNumberTypeOption {
    value: string;
    label: string;
    icon?: React.ReactNode;
}

export interface SortOption {
    value: string;
    label: string;
    field: keyof BlacklistNumber;
}

// Action types
export interface BlacklistNumberAction {
    id: number;
    type: 'view' | 'edit' | 'delete';
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

// Bulk action types
export interface BulkAction {
    label: string;
    action: (ids: number[]) => Promise<void>;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    icon?: React.ReactNode;
    confirmMessage?: string;
}

// Import/Export types
export interface ImportOptions {
    file?: File;
    text?: string;
    format: 'csv' | 'xlsx' | 'text';
    delimiter?: string;
    hasHeader?: boolean;
}

export interface ExportOptions {
    format: 'csv' | 'xlsx';
    filename?: string;
    includeHeaders?: boolean;
    filters?: BlacklistNumbersFilters;
}

// Statistics types
export interface BlacklistNumberStats {
    total: number;
    byType: {
        sms: number;
        manual: number;
    };
    recentAdditions: number;
    recentDeletions: number;
}

// Search and filter types
export interface SearchFilters {
    query: string;
    type: string;
    dateRange?: {
        start: string;
        end: string;
    };
    sortBy: keyof BlacklistNumber;
    sortOrder: 'asc' | 'desc';
}

// Validation types
export interface ValidationRule {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any) => boolean | string;
}

export interface ValidationRules {
    number: ValidationRule;
    type: ValidationRule;
    reason: ValidationRule;
} 