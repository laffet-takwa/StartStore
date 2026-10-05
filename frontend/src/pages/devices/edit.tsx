import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { devicesApi, customersApi } from '@/api'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

const deviceSchema = z.object({
  customer: z.string().min(1, 'Customer is required'),
  device_type: z.string().min(1, 'Device type is required'),
  brand: z.string().min(1, 'Brand is required'),
  model: z.string().min(1, 'Model is required'),
  serial_number: z.string().optional().or(z.literal('')),
  accessories: z.string().optional().or(z.literal('')),
  physical_condition: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})

type DeviceForm = z.infer<typeof deviceSchema>

export default function DeviceEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = Boolean(id)

  const { data: customersData } = useQuery({
    queryKey: ['customers-list'],
    queryFn: () => customersApi.list({ page_size: 100 }),
  })

  const { data: device, isLoading } = useQuery({
    queryKey: ['device', id],
    queryFn: () => devicesApi.get(id!),
    enabled: isEdit && Boolean(id),
  })

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<DeviceForm>({
    resolver: zodResolver(deviceSchema),
    values: device ? {
      customer: (device as any).customer,
      device_type: device.device_type,
      brand: device.brand,
      model: device.model,
      serial_number: device.serial_number || '',
      accessories: device.accessories || '',
      physical_condition: device.physical_condition || '',
      notes: device.notes || '',
    } : undefined,
  })

  const mutation = useMutation({
    mutationFn: (data: DeviceForm) =>
      isEdit ? devicesApi.update(id!, data) : devicesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      toast.success(isEdit ? 'Device updated' : 'Device created')
      navigate('/devices')
    },
    onError: () => toast.error('Failed to save device'),
  })

  const onSubmit = (data: DeviceForm) => {
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
          <h1 className="text-2xl font-bold text-slate-900">{isEdit ? 'Edit Device' : 'New Device'}</h1>
          <p className="text-sm text-muted">{isEdit ? 'Update device information' : 'Register a new device'}</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Device Type *</label>
            <input {...register('device_type')} className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20" />
            {errors.device_type && <p className="mt-1 text-sm text-danger">{errors.device_type.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Brand *</label>
            <input {...register('brand')} className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20" />
            {errors.brand && <p className="mt-1 text-sm text-danger">{errors.brand.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Model *</label>
            <input {...register('model')} className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20" />
            {errors.model && <p className="mt-1 text-sm text-danger">{errors.model.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Serial Number</label>
            <input {...register('serial_number')} className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Accessories</label>
            <input {...register('accessories')} className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Physical Condition</label>
            <input {...register('physical_condition')} className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
          <textarea {...register('notes')} rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20" />
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
