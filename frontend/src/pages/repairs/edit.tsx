import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { repairsApi, customersApi, devicesApi, employeesApi } from '@/api'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

const repairSchema = z.object({
  customer: z.string().min(1, 'Customer is required'),
  device: z.string().min(1, 'Device is required'),
  problem_description: z.string().min(1, 'Problem description is required'),
  estimated_cost: z.coerce.number().min(0, 'Estimated cost is required'),
  estimated_completion_date: z.string().optional().or(z.literal('')),
  internal_notes: z.string().optional().or(z.literal('')),
})

type RepairForm = z.infer<typeof repairSchema>

export default function RepairEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = Boolean(id)

  const { data: customersData } = useQuery({
    queryKey: ['customers-list'],
    queryFn: () => customersApi.list({ page_size: 100 }),
  })

  const { data: devicesData } = useQuery({
    queryKey: ['devices-list'],
    queryFn: () => devicesApi.list({ page_size: 100 }),
  })

  const { data: techniciansData } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => employeesApi.list({ role: 'technician', page_size: 100 }),
  })

  const { data: repair, isLoading } = useQuery({
    queryKey: ['repair', id],
    queryFn: () => repairsApi.get(id!),
    enabled: isEdit && Boolean(id),
  })

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RepairForm>({
    resolver: zodResolver(repairSchema),
    values: repair ? {
      customer: (repair as any).customer,
      device: (repair as any).device,
      problem_description: repair.problem_description,
      estimated_cost: repair.estimated_cost,
      estimated_completion_date: repair.estimated_completion_date || '',
      internal_notes: repair.internal_notes || '',
    } : undefined,
  })

  const mutation = useMutation({
    mutationFn: (data: RepairForm) =>
      isEdit ? repairsApi.update(id!, data) : repairsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repairs'] })
      toast.success(isEdit ? 'Repair updated' : 'Repair created')
      navigate('/repairs')
    },
    onError: () => toast.error('Failed to save repair'),
  })

  const onSubmit = (data: RepairForm) => {
    mutation.mutate(data)
  }

  if (isEdit && isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-md">
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{isEdit ? 'Edit Repair' : 'New Repair'}</h1>
          <p className="text-sm text-muted">{isEdit ? 'Update repair information' : 'Create a new repair ticket'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-surface rounded-lg border border-slate-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Customer *</label>
          <select {...register('customer')} className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="">Select customer</option>
            {customersData?.results?.map((c: any) => (
              <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
            ))}
          </select>
          {errors.customer && <p className="mt-1 text-sm text-danger">{errors.customer.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Device *</label>
          <select {...register('device')} className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="">Select device</option>
            {devicesData?.results?.map((d: any) => (
              <option key={d.id} value={d.id}>{d.brand} {d.model}</option>
            ))}
          </select>
          {errors.device && <p className="mt-1 text-sm text-danger">{errors.device.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Problem Description *</label>
          <textarea {...register('problem_description')} rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20" />
          {errors.problem_description && <p className="mt-1 text-sm text-danger">{errors.problem_description.message}</p>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Estimated Cost *</label>
            <input type="number" step="0.01" {...register('estimated_cost')} className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20" />
            {errors.estimated_cost && <p className="mt-1 text-sm text-danger">{errors.estimated_cost.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Estimated Completion Date</label>
            <input type="date" {...register('estimated_completion_date')} className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Internal Notes</label>
          <textarea {...register('internal_notes')} rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 text-sm border border-slate-200 rounded-md hover:bg-slate-50">Cancel</button>
          <button type="submit" disabled={isSubmitting || mutation.isPending} className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50">
            {mutation.isPending ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  )
}
