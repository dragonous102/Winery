import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Filter, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";

export default function FilterBar({ filters, onFilterChange }) {
  const [dateRange, setDateRange] = React.useState({
    from: new Date(new Date().getFullYear(), 0, 1), // Start of current year
    to: new Date()
  });
  
  const [comparisonPeriod, setComparisonPeriod] = React.useState("last_year");

  const handleDateRangeChange = (range) => {
    setDateRange(range);
    onFilterChange('dateRange', range);
  };

  const handleComparisonChange = (period) => {
    setComparisonPeriod(period);
    onFilterChange('comparisonPeriod', period);
  };

  const setQuickDateRange = (preset) => {
    const now = new Date();
    let from, to;
    
    switch (preset) {
      case 'this_month':
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        to = now;
        break;
      case 'last_month':
        from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        to = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'this_year':
        from = new Date(now.getFullYear(), 0, 1);
        to = now;
        break;
      case 'last_year':
        from = new Date(now.getFullYear() - 1, 0, 1);
        to = new Date(now.getFullYear() - 1, 11, 31);
        break;
      default:
        return;
    }
    
    const newRange = { from, to };
    setDateRange(newRange);
    onFilterChange('dateRange', newRange);
  };

  return (
    <div className="glass-effect rounded-lg p-4 mb-6 space-y-4">
      {/* Primary Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-slate-600">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filters:</span>
        </div>
        
        <div className="flex gap-3">
          <Select value={filters.region} onValueChange={(value) => onFilterChange('region', value)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="global">Global</SelectItem>
              <SelectItem value="nz">New Zealand</SelectItem>
              <SelectItem value="usa">USA</SelectItem>
              <SelectItem value="other">Others</SelectItem>
            </SelectContent>
          </Select>

          {/* <Select value={filters.distributor} onValueChange={(value) => onFilterChange('distributor', value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Distributor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Distributors</SelectItem>
              <SelectItem value="premium_wines_usa">Premium Wines USA</SelectItem>
              <SelectItem value="fine_wine_uk">Fine Wine UK</SelectItem>
              <SelectItem value="asia_pacific">Asia Pacific Wines</SelectItem>
            </SelectContent>
          </Select> */}

          <Select value={filters.brand} onValueChange={(value) => onFilterChange('brand', value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              <SelectItem value="jt">JT</SelectItem>
              <SelectItem value="otq">OTQ</SelectItem>
              <SelectItem value="tbh">TBH</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Date Filters */}
      <div className="border-t pt-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-slate-600">
            <CalendarIcon className="w-4 h-4" />
            <span className="text-sm font-medium">Date Range:</span>
          </div>
          
          {/* Quick Date Presets */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setQuickDateRange('this_month')}
              className="text-xs"
            >
              This Month
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setQuickDateRange('last_month')}
              className="text-xs"
            >
              Last Month
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setQuickDateRange('this_year')}
              className="text-xs"
            >
              This Year
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setQuickDateRange('last_year')}
              className="text-xs"
            >
              Last Year
            </Button>
          </div>

          {/* Custom Date Range Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="text-xs">
                <CalendarIcon className="mr-2 h-3 w-3" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  "Custom Range"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={handleDateRangeChange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          {/* Comparison Period */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">vs:</span>
            <Select value={comparisonPeriod} onValueChange={handleComparisonChange}>
              <SelectTrigger className="w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last_month">Last Month</SelectItem>
                <SelectItem value="last_year">Last Year</SelectItem>
                <SelectItem value="last_quarter">Last Quarter</SelectItem>
                <SelectItem value="previous_period">Previous Period</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}