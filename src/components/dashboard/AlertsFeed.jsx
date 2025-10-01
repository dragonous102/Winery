
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, TrendingDown, Truck, CheckCircle } from "lucide-react";
import { format } from "date-fns";

export default function AlertsFeed({ alerts }) {
  const alertIcons = {
    stockout: <AlertTriangle className="w-4 h-4" />,
    shipment_delay: <Truck className="w-4 h-4" />,
    forecast_variance: <TrendingDown className="w-4 h-4" />,
    quality: <Clock className="w-4 h-4" />
  };

  const severityColors = {
    low: "bg-blue-100 text-blue-800",
    medium: "bg-yellow-100 text-yellow-800", 
    high: "bg-orange-100 text-orange-800",
    critical: "bg-red-100 text-red-800"
  };

  return (
    <Card className="glass-effect h-fit">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-slate-900">
          Active Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.length === 0 ? (
          <div className="text-center text-slate-500 py-8">
            <CheckCircle className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">All systems healthy</p>
          </div>
        ) : (
          alerts.map((alert, index) => (
            <div key={index} className="border-l-4 border-amber-400 bg-white p-3 rounded-r-lg shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {alertIcons[alert.type]}
                  <h4 className="font-medium text-sm">{alert.title}</h4>
                </div>
                <Badge className={severityColors[alert.severity]}>
                  {alert.severity}
                </Badge>
              </div>
              <p className="text-xs text-slate-600 mb-2">
                {alert.description}
              </p>
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>{alert.distributor && `• ${alert.distributor}`}</span>
                {alert.due_date && (
                  <span>Due: {format(new Date(alert.due_date), 'MMM d')}</span>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
