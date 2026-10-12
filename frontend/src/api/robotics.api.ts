import { supabase } from '@/lib/supabase'
import type { RoboticsProject } from '@/types'

export const roboticsApi = {
  list: async (params?: Record<string, unknown>) => {
    let query = supabase
      .from('robotics_projects')
      .select('*')

    if (params?.status) {
      query = query.eq('status', params.status)
    }

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error
    return { results: (data || []) as RoboticsProject[] }
  },
}
