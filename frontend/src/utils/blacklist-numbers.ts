import type { ValidationRules } from '@/types/blacklist-numbers';

// Phone number validation regex
const PHONE_REGEX = /^\+[1-9]\d{1,14}$/;

// Validation rules for blacklist numbers
export const validationRules: ValidationRules = {
    number: {
        required: true,
        pattern: PHONE_REGEX,
        custom: (value: string) => {
            if (!value) return 'Phone number is required';
            if (!PHONE_REGEX.test(value)) {
                return 'Please enter a valid international phone number (e.g., +905551234567)';
            }
            return true;
        },
    },
    type: {
        required: true,
        custom: (value: string) => {
            if (!value) return 'Type is required';
            if (!['sms', 'manual'].includes(value)) {
                return 'Type must be either SMS or Manual';
            }
            return true;
        },
    },
    reason: {
        maxLength: 500,
        custom: (value: string) => {
            if (value && value.length > 500) {
                return 'Reason must be less than 500 characters';
            }
            return true;
        },
    },
};

// Validate a single field
export const validateField = (field: keyof ValidationRules, value: any): string | true => {
    const rule = validationRules[field];
    
    if (rule.required && !value) {
        return `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
    }
    
    if (rule.minLength && value && value.length < rule.minLength) {
        return `${field.charAt(0).toUpperCase() + field.slice(1)} must be at least ${rule.minLength} characters`;
    }
    
    if (rule.maxLength && value && value.length > rule.maxLength) {
        return `${field.charAt(0).toUpperCase() + field.slice(1)} must be less than ${rule.maxLength} characters`;
    }
    
    if (rule.pattern && value && !rule.pattern.test(value)) {
        return `${field.charAt(0).toUpperCase() + field.slice(1)} format is invalid`;
    }
    
    if (rule.custom) {
        return rule.custom(value) as string | true;
    }
    
    return true;
};

// Validate entire form
export const validateForm = (data: Record<string, any>): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    Object.keys(validationRules).forEach((field) => {
        const result = validateField(field as keyof ValidationRules, data[field]);
        if (result !== true) {
            errors[field] = result as string;
        }
    });
    
    return errors;
};

// Format phone number for display
export const formatPhoneNumber = (number: string): string => {
    if (!number) return '';
    
    // Remove all non-digit characters except +
    let formatted = number.replace(/[^\d+]/g, '');
    
    // Ensure it starts with +
    if (!formatted.startsWith('+')) {
        formatted = '+' + formatted;
    }
    
    return formatted;
};

// Format phone number for input (with formatting)
export const formatPhoneNumberForInput = (number: string): string => {
    if (!number) return '';
    
    // Remove all non-digit characters except +
    let formatted = number.replace(/[^\d+]/g, '');
    
    // Ensure it starts with +
    if (!formatted.startsWith('+')) {
        formatted = '+' + formatted;
    }
    
    // Add spaces for better readability (optional)
    // +90 555 123 4567
    if (formatted.length > 3) {
        formatted = formatted.replace(/(\+\d{2})(\d{3})(\d{3})(\d{4})/, '$1 $2 $3 $4');
    }
    
    return formatted;
};

// Parse phone number from formatted string
export const parsePhoneNumber = (formattedNumber: string): string => {
    return formatPhoneNumber(formattedNumber);
};

// Get type display information
export const getTypeInfo = (type: 'sms' | 'manual') => {
    const typeInfo = {
        sms: {
            label: 'SMS',
            description: 'Automatically added via SMS',
            color: 'destructive',
            icon: 'MessageSquare',
        },
        manual: {
            label: 'Manual',
            description: 'Manually added by user',
            color: 'default',
            icon: 'User',
        },
    };
    
    return typeInfo[type];
};

// Format date for display
export const formatDate = (dateString: string, format: 'short' | 'long' | 'relative' = 'short'): string => {
    const date = new Date(dateString);
    const now = new Date();
    
    switch (format) {
        case 'short':
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
        case 'long':
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            });
        case 'relative':
            const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
            
            if (diffInSeconds < 60) return 'Just now';
            if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
            if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
            if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
            if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
            return `${Math.floor(diffInSeconds / 31536000)}y ago`;
        default:
            return date.toLocaleDateString();
    }
};

// Generate CSV content for export
export const generateCSVContent = (data: any[], headers: string[]): string => {
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row => 
        headers.map(header => {
            const value = row[header.toLowerCase().replace(/\s+/g, '_')] || '';
            // Escape commas and quotes
            return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
    );
    
    return [csvHeaders, ...csvRows].join('\n');
};

// Parse CSV content for import
export const parseCSVContent = (content: string): string[][] => {
    const lines = content.trim().split('\n');
    return lines.map(line => {
        const values: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        values.push(current.trim());
        return values;
    });
};

// Validate CSV data
export const validateCSVData = (data: string[][]): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (data.length === 0) {
        errors.push('File is empty');
        return { valid: false, errors };
    }
    
    // Check if first row might be headers
    const firstRow = data[0];
    const hasHeaders = firstRow.some(cell => 
        cell.toLowerCase().includes('number') || 
        cell.toLowerCase().includes('type') || 
        cell.toLowerCase().includes('reason')
    );
    
    const startIndex = hasHeaders ? 1 : 0;
    
    for (let i = startIndex; i < data.length; i++) {
        const row = data[i];
        const rowNumber = i + 1;
        
        if (row.length < 1) {
            errors.push(`Row ${rowNumber}: Missing phone number`);
            continue;
        }
        
        const phoneNumber = row[0];
        if (!phoneNumber || !PHONE_REGEX.test(formatPhoneNumber(phoneNumber))) {
            errors.push(`Row ${rowNumber}: Invalid phone number "${phoneNumber}"`);
        }
        
        if (row.length >= 2) {
            const type = row[1].toLowerCase();
            if (type && !['sms', 'manual'].includes(type)) {
                errors.push(`Row ${rowNumber}: Invalid type "${row[1]}" (must be SMS or Manual)`);
            }
        }
    }
    
    return { valid: errors.length === 0, errors };
};

// Generate unique filename for export
export const generateExportFilename = (prefix: string = 'blacklist-numbers'): string => {
    const now = new Date();
    const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-');
    return `${prefix}-${timestamp}.csv`;
};

// Debounce function for search
export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number
): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

// Sort function for blacklist numbers
export const sortBlacklistNumbers = (
    data: any[],
    sortBy: string,
    sortOrder: 'asc' | 'desc'
): any[] => {
    return [...data].sort((a, b) => {
        let aValue = a[sortBy];
        let bValue = b[sortBy];
        
        // Handle date sorting
        if (sortBy.includes('_at')) {
            aValue = new Date(aValue).getTime();
            bValue = new Date(bValue).getTime();
        }
        
        // Handle string sorting
        if (typeof aValue === 'string') {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
        }
        
        if (sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });
};

// Filter function for blacklist numbers
export const filterBlacklistNumbers = (
    data: any[],
    filters: { search?: string; type?: string }
): any[] => {
    return data.filter(item => {
        // Search filter
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            const matchesSearch = 
                item.number.toLowerCase().includes(searchTerm) ||
                (item.reason && item.reason.toLowerCase().includes(searchTerm));
            
            if (!matchesSearch) return false;
        }
        
        // Type filter
        if (filters.type && filters.type !== 'all') {
            if (item.type !== filters.type) return false;
        }
        
        return true;
    });
}; 