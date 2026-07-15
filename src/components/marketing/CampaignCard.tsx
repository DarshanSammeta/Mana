import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/utils';
import { Users, MousePointer2 } from 'lucide-react';

interface CampaignCardProps {
  campaign: any;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({ campaign }) => {
  const ctr = campaign.impressions > 0 ? (campaign.clicks / campaign.impressions) * 100 : 0;
  const conversionRate = campaign.clicks > 0 ? (campaign.conversions / campaign.clicks) * 100 : 0;
  const roi = campaign.spent > 0 ? ((Number(campaign.revenue) - Number(campaign.spent)) / Number(campaign.spent)) * 100 : 0;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg">{campaign.name}</CardTitle>
          <p className="text-sm text-muted-foreground">{campaign.type}</p>
        </div>
        <Badge variant={campaign.status === 'ACTIVE' ? 'default' : 'secondary'}>
          {campaign.status}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-1">
            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="w-4 h-4 mr-1" /> Impressions
            </div>
            <p className="text-xl font-bold">{campaign.impressions.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center text-sm text-muted-foreground">
              <MousePointer2 className="w-4 h-4 mr-1" /> Clicks
            </div>
            <p className="text-xl font-bold">{campaign.clicks.toLocaleString()}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>CTR</span>
              <span>{ctr.toFixed(2)}%</span>
            </div>
            <Progress value={ctr * 10} />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Conversion Rate</span>
              <span>{conversionRate.toFixed(2)}%</span>
            </div>
            <Progress value={conversionRate} />
          </div>
        </div>

        <div className="mt-6 pt-4 border-t grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Revenue</p>
            <p className="text-lg font-bold text-green-600">{formatCurrency(campaign.revenue)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">ROI</p>
            <p className={`text-lg font-bold ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {roi.toFixed(1)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
