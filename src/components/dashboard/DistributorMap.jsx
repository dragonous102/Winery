import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, AlertTriangle, CheckCircle, Clock } from "lucide-react";

export default function DistributorMap({ distributors }) {
  const statusIcons = {
    ACTIVE: <CheckCircle className="w-3 h-3" />,
    warning: <Clock className="w-3 h-3" />,
    critical: <AlertTriangle className="w-3 h-3" />
  };

  const statusColors = {
    ACTIVE: "bg-green-100 text-green-700 border-green-200",
    warning: "bg-amber-100 text-amber-700 border-amber-200",
    critical: "bg-red-100 text-red-700 border-red-200"
  };

  return (
    <Card className="glass-effect">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-slate-900">
          Global Distributor Network
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Simplified world view with distributor cards */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {distributors.map((distributor, index) => (
              <div 
                key={index}
                className={`border rounded-lg p-4 ${statusColors[distributor.stock_status]}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <h3 className="font-medium">{distributor.name}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    {statusIcons[distributor.stock_status]}
                    <span className="text-xs font-medium">
                      {distributor.stock_status.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Stock:</span>
                    <span className="font-medium">{distributor.current_stock.toLocaleString()} cases</span>
                  </div>
                  {/* <div className="flex justify-between">
                    <span>Coverage:</span>
                    <span className="font-medium">{distributor.days_of_cover} days</span>
                  </div> */}
                  <div className="flex justify-between">
                    <span>Region:</span>
                    <span className="font-medium capitalize">{distributor.region}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}