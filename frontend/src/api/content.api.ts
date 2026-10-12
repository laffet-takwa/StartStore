import { supabase } from '@/lib/supabase'
import type { Content } from '@/types'

export const contentApi = {
  list: async (params?: Record<string, unknown>) => {
    let query = supabase
      .from('content')
      .select('*')
      .eq('is_published', true)

    if (params?.content_type) {
      query = query.eq('content_type', params.content_type)
    }

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error
    return { results: (data || []) as Content[] }
  },
}
