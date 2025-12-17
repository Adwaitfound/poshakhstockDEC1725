import React, { useMemo, useState } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Package, Users, Calendar, PieChart, Crown } from 'lucide-react'

export default function FinancialInsights({ inventoryItems = [], allOrders = [] }) {
    const cleanNumber = (val) => {
        if (typeof val === 'number') return val
        if (!val) return 0
        const s = String(val).replace(/[^0-9.-]/g, '')
        return parseFloat(s) || 0
    }

    const metrics = useMemo(() => {
        const now = new Date()
        const currentMonth = now.getMonth()
        const currentYear = now.getFullYear()

        // Filter completed orders only
        const completedOrders = allOrders.filter(o => o.status !== 'Cancelled')

        // Revenue Analytics
        const totalRevenue = completedOrders.reduce((sum, o) =>
            sum + (cleanNumber(o.finalSellingPrice) || cleanNumber(o.orderTotal) || 0), 0)

        const monthlyRevenue = completedOrders
            .filter(o => {
                const orderDate = o.orderDate?.toDate ? o.orderDate.toDate() : new Date(o.orderDate)
                return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear
            })
            .reduce((sum, o) => sum + (cleanNumber(o.finalSellingPrice) || cleanNumber(o.orderTotal) || 0), 0)

        const avgOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0

        // Revenue by category
        const fabricRevenue = completedOrders
            .filter(o => o.type === 'fabric')
            .reduce((sum, o) => sum + (cleanNumber(o.finalSellingPrice) || cleanNumber(o.orderTotal) || 0), 0)

        const outfitRevenue = completedOrders
            .filter(o => o.type === 'outfit' || o.outfitName)
            .reduce((sum, o) => sum + (cleanNumber(o.finalSellingPrice) || cleanNumber(o.orderTotal) || 0), 0)

        // Profit Analysis
        const totalCosts = completedOrders.reduce((sum, o) => {
            const fabricCost = cleanNumber(o.fabricCost) || 0
            const stitchCost = cleanNumber(o.stitchingCost) || 0
            const shipCost = cleanNumber(o.shippingCost) || 0
            const codCharge = o.paymentMode === 'COD' ? cleanNumber(o.codCharge) || 0 : 0
            return sum + fabricCost + stitchCost + shipCost + codCharge
        }, 0)

        const grossProfit = totalRevenue - totalCosts
        const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0

        // Cash Flow
        const codPending = allOrders
            .filter(o => o.paymentMode === 'COD' && o.status === 'Shipped')
            .reduce((sum, o) => sum + (cleanNumber(o.finalSellingPrice) || cleanNumber(o.orderTotal) || 0), 0)

        const prepaidRevenue = completedOrders
            .filter(o => o.paymentMode === 'Prepaid')
            .reduce((sum, o) => sum + (cleanNumber(o.finalSellingPrice) || cleanNumber(o.orderTotal) || 0), 0)

        const codRevenue = completedOrders
            .filter(o => o.paymentMode === 'COD')
            .reduce((sum, o) => sum + (cleanNumber(o.finalSellingPrice) || cleanNumber(o.orderTotal) || 0), 0)

        // Inventory Financial Health
        const totalInventoryValue = inventoryItems.reduce((sum, item) => {
            if (item.type === 'fabric') {
                const length = parseFloat(item.currentLength) || 0
                const costPerMeter = cleanNumber(item.costPerMeter) || 0
                return sum + (length * costPerMeter)
            } else {
                const stock = Object.values(item.stockBreakdown || {}).reduce((s, v) => s + (parseFloat(v) || 0), 0)
                const cost = cleanNumber(item.costPerMeter) || 0
                return sum + (stock * cost)
            }
        }, 0)

        // Expense Breakdown
        const fabricCosts = completedOrders.reduce((sum, o) => sum + (cleanNumber(o.fabricCost) || 0), 0)
        const stitchingCosts = completedOrders.reduce((sum, o) => sum + (cleanNumber(o.stitchingCost) || 0), 0)
        const shippingCosts = completedOrders.reduce((sum, o) => sum + (cleanNumber(o.shippingCost) || 0), 0)
        const codCharges = completedOrders.reduce((sum, o) => {
            return o.paymentMode === 'COD' ? sum + (cleanNumber(o.codCharge) || 0) : sum
        }, 0)

        // Customer Metrics
        const uniqueCustomers = new Set(completedOrders.map(o => o.customerName?.toLowerCase().trim()).filter(Boolean))
        const avgCustomerValue = uniqueCustomers.size > 0 ? totalRevenue / uniqueCustomers.size : 0

        // Top customers by spending
        const customerSpending = {}
        completedOrders.forEach(o => {
            if (o.customerName) {
                const name = o.customerName
                const revenue = cleanNumber(o.finalSellingPrice) || cleanNumber(o.orderTotal) || 0
                customerSpending[name] = (customerSpending[name] || 0) + revenue
            }
        })
        const topCustomers = Object.entries(customerSpending)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)

        // Top products by revenue
        const productRevenue = {}
        completedOrders.forEach(o => {
            const name = o.outfitName || o.productName || o.fabricName || 'Unknown'
            const revenue = cleanNumber(o.finalSellingPrice) || cleanNumber(o.orderTotal) || 0
            productRevenue[name] = (productRevenue[name] || 0) + revenue
        })
        const topProducts = Object.entries(productRevenue)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)

        // Monthly trends (last 6 months)
        const monthlyData = []
        for (let i = 5; i >= 0; i--) {
            const date = new Date(currentYear, currentMonth - i, 1)
            const monthRevenue = completedOrders
                .filter(o => {
                    const orderDate = o.orderDate?.toDate ? o.orderDate.toDate() : new Date(o.orderDate)
                    return orderDate.getMonth() === date.getMonth() && orderDate.getFullYear() === date.getFullYear()
                })
                .reduce((sum, o) => sum + (cleanNumber(o.finalSellingPrice) || cleanNumber(o.orderTotal) || 0), 0)

            monthlyData.push({
                month: date.toLocaleDateString('en-US', { month: 'short' }),
                revenue: monthRevenue
            })
        }

        // Calculate growth rate
        const lastMonthRevenue = monthlyData[4]?.revenue || 0
        const currentMonthRevenue = monthlyData[5]?.revenue || 0
        const growthRate = lastMonthRevenue > 0 ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0

        // Customer revenue metrics
        const customerRevenueData = Object.entries(customerSpending)
            .sort((a, b) => b[1] - a[1])
            .map(([name, revenue]) => {
                const orders = completedOrders.filter(o => o.customerName === name)
                return {
                    name,
                    revenue,
                    orderCount: orders.length,
                    avgOrderValue: orders.length > 0 ? revenue / orders.length : 0
                }
            })

        const totalCustomerRevenue = customerRevenueData.reduce((sum, c) => sum + c.revenue, 0)
        const customerRevenuePercentages = customerRevenueData.map(c => ({
            ...c,
            percentage: totalCustomerRevenue > 0 ? (c.revenue / totalCustomerRevenue) * 100 : 0
        }))

        return {
            totalRevenue,
            monthlyRevenue,
            avgOrderValue,
            fabricRevenue,
            outfitRevenue,
            grossProfit,
            profitMargin,
            codPending,
            prepaidRevenue,
            codRevenue,
            totalInventoryValue,
            fabricCosts,
            stitchingCosts,
            shippingCosts,
            codCharges,
            totalCosts,
            uniqueCustomers: uniqueCustomers.size,
            avgCustomerValue,
            topCustomers,
            topProducts,
            monthlyData,
            growthRate,
            customerRevenueData: customerRevenuePercentages
        }
    }, [inventoryItems, allOrders])

    const formatCurrency = (amount) => `₹${(amount / 1000).toFixed(1)}k`
    const formatCurrencyFull = (amount) => `₹${amount.toLocaleString('en-IN')}`
    const [showAllCustomers, setShowAllCustomers] = useState(false)

    return (
        <div className="space-y-6 fade-in pb-20">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-lime-glow">Financial Insights</h2>
            </div>

            {/* Key Metrics Overview */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-pine p-4 rounded-2xl shadow-card text-lime-glow border-2 border-lime-glow/60">
                    <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-5 h-5 text-lime-glow" />
                        <p className="text-xs opacity-90">Total Revenue</p>
                    </div>
                    <p className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</p>
                    <p className="text-xs opacity-80 mt-1">All time</p>
                </div>
                <div className="bg-green-tea p-4 rounded-2xl shadow-card text-emerald-pine border-2 border-lime-glow">
                    <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-5 h-5 text-emerald-pine" />
                        <p className="text-xs font-semibold">This Month</p>
                    </div>
                    <p className="text-2xl font-bold">{formatCurrency(metrics.monthlyRevenue)}</p>
                    <div className="flex items-center gap-1 mt-1 text-emerald-pine/80">
                        {metrics.growthRate >= 0 ? (
                            <TrendingUp className="w-3 h-3" />
                        ) : (
                            <TrendingDown className="w-3 h-3" />
                        )}
                        <p className="text-xs">{Math.abs(metrics.growthRate).toFixed(1)}% vs last month</p>
                    </div>
                </div>
                <div className="bg-green-tea p-4 rounded-2xl shadow-card text-emerald-pine border-2 border-lime-glow">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-emerald-pine" />
                        <p className="text-xs font-semibold">Gross Profit</p>
                    </div>
                    <p className="text-2xl font-bold">{formatCurrency(metrics.grossProfit)}</p>
                    <p className="text-xs text-emerald-pine/80 mt-1">Margin: {metrics.profitMargin.toFixed(1)}%</p>
                </div>
                <div className="bg-green-tea p-4 rounded-2xl shadow-card text-emerald-pine border-2 border-lime-glow">
                    <div className="flex items-center gap-2 mb-2">
                        <Package className="w-5 h-5 text-emerald-pine" />
                        <p className="text-xs font-semibold">Avg Order Value</p>
                    </div>
                    <p className="text-2xl font-bold">{formatCurrency(metrics.avgOrderValue)}</p>
                    <p className="text-xs text-emerald-pine/80 mt-1">Per transaction</p>
                </div>
            </div>

            {/* Revenue Breakdown */}
            <div className="bg-emerald-pine p-5 rounded-2xl shadow-card border-2 border-lime-glow">
                <h3 className="font-bold text-lime-glow mb-4 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-lime-glow" />
                    Revenue by Category
                </h3>
                <div className="space-y-3">
                    <div>
                        <div className="flex justify-between mb-1 text-lime-glow">
                            <span className="text-sm">Outfits</span>
                            <span className="text-sm font-bold">{formatCurrency(metrics.outfitRevenue)}</span>
                        </div>
                        <div className="h-2 bg-emerald-pine/40 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-lime-glow rounded-full"
                                style={{ width: `${(metrics.outfitRevenue / metrics.totalRevenue) * 100}%` }}
                            />
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between mb-1 text-lime-glow">
                            <span className="text-sm">Fabrics</span>
                            <span className="text-sm font-bold">{formatCurrency(metrics.fabricRevenue)}</span>
                        </div>
                        <div className="h-2 bg-emerald-pine/40 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-tea rounded-full"
                                style={{ width: `${(metrics.fabricRevenue / metrics.totalRevenue) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Monthly Revenue Trend */}
            <div className="bg-green-tea p-5 rounded-2xl shadow-card border-2 border-lime-glow">
                <h3 className="font-bold text-emerald-pine mb-4">Revenue Trend (Last 6 Months)</h3>
                <div className="flex items-end justify-between gap-2 h-32">
                    {metrics.monthlyData.map((data, idx) => {
                        const maxRevenue = Math.max(...metrics.monthlyData.map(d => d.revenue))
                        const height = maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0
                        return (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                                <span className="text-xs font-bold text-emerald-pine">{formatCurrency(data.revenue / 1000)}k</span>
                                <div className="w-full bg-emerald-pine/30 rounded-t-lg" style={{ height: `${height}%`, minHeight: '4px' }}>
                                    <div className="h-full w-full bg-lime-glow" />
                                </div>
                                <span className="text-xs text-emerald-pine/70">{data.month}</span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Expense Breakdown */}
            <div className="bg-green-tea p-5 rounded-2xl shadow-card border-2 border-lime-glow">
                <h3 className="font-bold text-emerald-pine mb-4">Expense Breakdown</h3>
                <div className="space-y-3 text-emerald-pine">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-emerald-pine/80">Fabric Costs</span>
                        <span className="text-sm font-bold">{formatCurrency(metrics.fabricCosts)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-emerald-pine/80">Stitching Costs</span>
                        <span className="text-sm font-bold">{formatCurrency(metrics.stitchingCosts)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-emerald-pine/80">Shipping Costs</span>
                        <span className="text-sm font-bold">{formatCurrency(metrics.shippingCosts)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-emerald-pine/80">COD Charges</span>
                        <span className="text-sm font-bold">{formatCurrency(metrics.codCharges)}</span>
                    </div>
                    <div className="border-t border-emerald-pine/30 pt-2 flex justify-between items-center">
                        <span className="text-sm font-bold">Total Expenses</span>
                        <span className="text-sm font-bold text-emerald-pine">{formatCurrency(metrics.totalCosts)}</span>
                    </div>
                </div>
            </div>

            {/* Cash Flow */}
            <div className="bg-green-tea p-5 rounded-2xl shadow-card border-2 border-lime-glow">
                <h3 className="font-bold text-emerald-pine mb-4">Cash Flow Overview</h3>
                <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-emerald-pine/10 border border-lime-glow rounded-xl text-emerald-pine">
                        <span className="text-sm">Prepaid Revenue</span>
                        <span className="text-sm font-bold">{formatCurrency(metrics.prepaidRevenue)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-emerald-pine/10 border border-lime-glow rounded-xl text-emerald-pine">
                        <span className="text-sm">COD Revenue</span>
                        <span className="text-sm font-bold">{formatCurrency(metrics.codRevenue)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-emerald-pine/10 border border-lime-glow rounded-xl text-emerald-pine">
                        <span className="text-sm">Pending COD Collections</span>
                        <span className="text-sm font-bold">{formatCurrency(metrics.codPending)}</span>
                    </div>
                </div>
            </div>

            {/* Inventory Value */}
            <div className="bg-gradient-to-br from-emerald-pine to-lime-glow p-5 rounded-2xl shadow-card text-emerald-pine">
                <h3 className="font-bold mb-2 flex items-center gap-2 text-emerald-pine">
                    <Package className="w-5 h-5" />
                    Total Inventory Value
                </h3>
                <p className="text-3xl font-bold text-emerald-pine">{formatCurrency(metrics.totalInventoryValue)}</p>
                <p className="text-xs text-emerald-pine/80 mt-1">Current stock valuation</p>
            </div>

            {/* Customer Metrics */}
            <div className="bg-green-tea p-5 rounded-2xl shadow-card border-2 border-lime-glow">
                <h3 className="font-bold text-emerald-pine mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-pine" />
                    Customer Insights
                </h3>
                <div className="grid grid-cols-2 gap-4 text-emerald-pine">
                    <div>
                        <p className="text-xs text-emerald-pine/70 mb-1">Total Customers</p>
                        <p className="text-2xl font-bold">{metrics.totalCustomers}</p>
                    </div>
                    <div>
                        <p className="text-xs text-emerald-pine/70 mb-1">Avg Customer Value</p>
                        <p className="text-2xl font-bold">{formatCurrency(metrics.avgCustomerValue)}</p>
                    </div>
                </div>
            </div>

            {/* Customer Revenue Breakdown */}
            <div className="bg-green-tea p-5 rounded-2xl shadow-card border-2 border-lime-glow">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-emerald-pine flex items-center gap-2">
                        <Crown className="w-5 h-5 text-lime-glow" />
                        Customer Revenue Breakdown
                    </h3>
                    {metrics.customerRevenueData.length > 10 && (
                        <button
                            onClick={() => setShowAllCustomers(!showAllCustomers)}
                            className="text-xs text-emerald-pine underline-offset-2 hover:underline"
                        >
                            {showAllCustomers ? 'Show Top 10' : `Show All ${metrics.customerRevenueData.length}`}
                        </button>
                    )}
                </div>
                <div className="space-y-2">
                    {(showAllCustomers ? metrics.customerRevenueData : metrics.customerRevenueData.slice(0, 10)).map((customer, idx) => (
                        <div key={idx} className="p-3 hover:bg-emerald-pine/5 rounded-lg transition-colors">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-lime-glow text-emerald-pine' :
                                        idx === 1 ? 'bg-emerald-pine/20 text-emerald-pine' :
                                            idx === 2 ? 'bg-green-tea text-emerald-pine' :
                                                'bg-emerald-pine/10 text-emerald-pine'
                                        }`}>
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-emerald-pine truncate">{customer.name}</p>
                                        <p className="text-xs text-emerald-pine/70">{customer.orders} orders • Avg: ₹{(customer.avgOrderValue / 1000).toFixed(1)}k</p>
                                    </div>
                                </div>
                                <div className="text-right ml-3">
                                    <p className="text-sm font-bold text-emerald-pine">{formatCurrency(customer.revenue)}</p>
                                    <p className="text-xs text-emerald-pine/70">{((customer.revenue / metrics.totalRevenue) * 100).toFixed(1)}%</p>
                                </div>
                            </div>
                            <div className="h-1.5 bg-emerald-pine/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-pine to-lime-glow rounded-full transition-all"
                                    style={{ width: `${customer.percentage}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Top 10 Products */}
            <div className="bg-green-tea p-5 rounded-2xl shadow-card border-2 border-lime-glow">
                <h3 className="font-bold text-emerald-pine mb-4">Top 10 Products by Revenue</h3>
                <div className="space-y-2">
                    {metrics.topProducts.map(([name, revenue], idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 hover:bg-emerald-pine/5 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-lime-glow text-emerald-pine text-xs font-bold flex items-center justify-center border border-emerald-pine/30">
                                    {idx + 1}
                                </div>
                                <span className="text-sm text-emerald-pine truncate">{name}</span>
                            </div>
                            <span className="text-sm font-bold text-emerald-pine">{formatCurrency(revenue)}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
