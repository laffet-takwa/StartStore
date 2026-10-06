import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '@/api'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardBody, Skeleton, Select } from '@/components/ui'

const COLORS = ['#2563EB', '#16A34A', '#F59E0B', '#DC2626', '#0EA5E9', '#8B5CF6', '#EC4899']

export default function ReportsPage() {
  const [period, setPeriod] = useState('month')

  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['reports-sales', period],
    queryFn: () => reportsApi.sales({ period }),
  })

  const { data: repairsData, isLoading: repairsLoading } = useQuery({
    queryKey: ['reports-repairs', period],
    queryFn: () => reportsApi.repairs({ period }),
  })

  const { data: inventoryData, isLoading: inventoryLoading } = useQuery({
    queryKey: ['reports-inventory'],
    queryFn: () => reportsApi.inventory(),
  })

  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ['reports-customers', period],
    queryFn: () => reportsApi.customers({ period }),
  })

  const salesChart = Array.isArray(salesData) ? salesData : []
  const repairsChart = Array.isArray(repairsData) ? repairsData : []
  const inventoryChart = Array.isArray(inventoryData) ? inventoryData : []
  const customersChart = Array.isArray(customersData) ? customersData : []

  return (
    <div className="space-y-6 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <p className="text-sm text-muted">Business insights and analytics</p>
        </div>
        <Select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          options={[
            { value: 'week', label: 'This Week' },
            { value: 'month', label: 'This Month' },
            { value: 'quarter', label: 'This Quarter' },
            { value: 'year', label: 'This Year' },
          ]}
          className="w-40"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardBody>
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Sales Overview</h2>
            {salesLoading ? (
              <Skeleton className="h-72 w-full" />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${Number(value).toLocaleString()} TND`} />
                    <Bar dataKey="value" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Repairs Overview</h2>
            {repairsLoading ? (
              <Skeleton className="h-72 w-full" />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={repairsChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Inventory by Category</h2>
            {inventoryLoading ? (
              <Skeleton className="h-72 w-full" />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={inventoryChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {inventoryChart.map((_entry: any, index: number) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Customer Growth</h2>
            {customersLoading ? (
              <Skeleton className="h-72 w-full" />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={customersChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#16A34A" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
