import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useExecutiveSummary } from '@/hooks/use-finance';
import { formatCurrency } from '@/lib/utils';
import {
  TrendingUp,
  DollarSign,
  Users,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert
} from 'lucide-react';

export const ExecutiveDashboard: React.FC = () => {
  const { data: summary, isLoading } = useExecutiveSummary();

  if (isLoading) return <div>Loading BI Dashboard...</div>;

  const cards = [
    {
      title: 'Total GTV',
      value: formatCurrency(summary.totalGTV),
      icon: DollarSign,
      trend: '+12.5%',
      trendUp: true,
      desc: 'Gross Transaction Value'
    },
    {
      title: 'Net Revenue',
      value: formatCurrency(summary.netRevenue),
      icon: TrendingUp,
      trend: '+8.2%',
      trendUp: true,
      desc: 'Platform Commission'
    },
    {
      title: 'Customers',
      value: summary.customerCount.toLocaleString(),
      icon: Users,
      trend: '+450',
      trendUp: true,
      desc: 'Active Customers'
    },
    {
      title: 'Take Rate',
      value: `${summary.takeRate.toFixed(1)}%`,
      icon: ShoppingBag,
      trend: '-0.4%',
      trendUp: false,
      desc: 'Avg. Commission Rate'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <div className="flex items-center mt-1">
                {card.trendUp ? (
                  <ArrowUpRight className="w-3 h-3 text-green-500 mr-1" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 text-red-500 mr-1" />
                )}
                <span className={`text-xs font-medium ${card.trendUp ? 'text-green-500' : 'text-red-500'}`}>
                  {card.trend}
                </span>
                <span className="text-xs text-muted-foreground ml-2">{card.desc}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Revenue Analytics</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-lg">
             [Revenue Chart Visualization]
          </CardContent>
        </Card>

        <Card className="col-span-1 border-red-100 bg-red-50/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-red-600 flex items-center">
              <ShieldAlert className="w-5 h-5 mr-2" /> Fraud & Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
               <div className="flex items-center justify-between p-3 bg-white rounded-md border border-red-100">
                  <span className="text-sm font-medium">Refund Abuse Detected</span>
                  <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded">HIGH</span>
               </div>
               <div className="flex items-center justify-between p-3 bg-white rounded-md border border-orange-100">
                  <span className="text-sm font-medium">Coupon Velocity Alert</span>
                  <span className="text-xs px-2 py-1 bg-orange-100 text-orange-600 rounded">MEDIUM</span>
               </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
