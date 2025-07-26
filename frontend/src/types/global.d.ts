import type { route as routeFn } from 'ziggy-js';

declare global {
    const route: typeof routeFn;
    const router: any;
    const Head: any;
    const useForm: <T = any>(data?: T) => {
        data: T;
        setData: (...args: any[]) => void;
        post: (url: string, options?: any) => void;
        processing: boolean;
        errors: any;
        reset: (...args: any[]) => void;
    };
}
