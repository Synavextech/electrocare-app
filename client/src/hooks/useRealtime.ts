import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../utils/supabase';

/**
 * Custom hook to listen for real-time changes on a Supabase table
 * and automatically invalidate associated TanStack Query keys.
 * 
 * @param table - The table name to subscribe to
 * @param queryKeys - The TanStack Query keys to invalidate upon change
 */
export const useRealtime = (table: string, queryKeys: any[]) => {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!table) return;

        const channel = supabase
            .channel(`realtime:${table}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: table },
                (payload) => {
                    console.log(`Real-time change detected in ${table}:`, payload);
                    // Invalidate the provided query keys to trigger a refetch
                    queryClient.invalidateQueries({ queryKey: queryKeys });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [table, queryKeys, queryClient]);
};
