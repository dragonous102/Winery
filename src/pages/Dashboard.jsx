
import React, { useState, useEffect, useCallback } from "react";
import KPITile from "../components/dashboard/KPITile";
import FilterBar from "../components/dashboard/FilterBar";
import SalesChart from "../components/dashboard/SalesChart";
import StockChart from "../components/dashboard/StockChart";
import DistributorMap from "../components/dashboard/DistributorMap";
import AlertsFeed from "../components/dashboard/AlertsFeed";
import DrilldownModal from "../components/dashboard/DrilldownModal";
import { set } from "date-fns";

export default function Dashboard() {
  const [stockFloat, setStockFloat] = useState(0);
  const [usaStockFloat, setUsaStockFloat] = useState(0);
  const [kpis, setKpis] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [stockData, setStockData] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [filters, setFilters] = useState({
    region: 'global',
    distributor: 'all',
    brand: 'all',
    dateRange: 'last_12_months', // New default filter
    comparisonPeriod: 'previous_year' // New default filter
  });
  const [selectedKPI, setSelectedKPI] = useState(null);
  const [drilldownData, setDrilldownData] = useState(null);
  const [comparisonData, setComparisonData] = useState({
    sales: [],
    stock: []
  });

  // Load uploaded data from localStorage (if any) and convert to chart-ready structures
  useEffect(() => {
    const loadUploadedData = () => {
      try {
        const manhattanRaw = localStorage.getItem('vc_manhattan_data');
        const cin7Raw = localStorage.getItem('vc_cin7_data');
        const salesRaw = localStorage.getItem('vc_sales_data');
        const totals = {};
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        if (manhattanRaw && (filters.region === 'global' || filters.region === 'nz')) {
            const manhattan = JSON.parse(manhattanRaw);
            manhattan.forEach(r => {
            if (filters.brand === 'all' || filters.brand === "jt" && r.ClientStockDescription?.slice(0, 2) === "JT" ||
              filters.brand === "otq" && r.ClientStockDescription?.includes("OTQ") ||
              filters.brand === "tbh" && r.ClientStockDescription?.includes("TBH")
            ) {
                const family = "Available";
                let available = parseFloat(r.Available) || 0;
                if (r.Units === "Dozen") available = available * 2;
                if (r.Units === "Eaches") available = available / 6;
                totals[family] = (totals[family] || 0) + available;

                // By variety (case-insensitive contains checks)
                const desc = (r.ClientStockDescription || '').toLowerCase();
                if (desc.includes('sab') || desc.includes('sauvignon')) {
                  totals['SAB'] = (totals['SAB'] || 0) + available;
                }
                if (desc.includes('pin') || desc.includes('pinot')) {
                  totals['PIN'] = (totals['PIN'] || 0) + available;
                }
                if (desc.includes('chr') || desc.includes('chardonnay')) {
                  totals['CHR'] = (totals['CHR'] || 0) + available;
                }

              }
            });
            
           
            
          }
        if (cin7Raw) {
          const cin7 = JSON.parse(cin7Raw);
          cin7.forEach(r => {
            if (filters.region === 'global' || r.AdditionalAttribute2 === "NZL" && filters.region === "nz" ||
              r.AdditionalAttribute2 === "USA" && filters.region === "usa" ||
              (!["NZL","USA"].includes(r.AdditionalAttribute2) && filters.region === "other")
            ){
              if (filters.brand === 'all' || filters.brand === "jt" && r.Brand === "JT" ||
                filters.brand === "otq" && r.Brand === "OTQ" ||
                filters.brand === "tbh" && r.Brand === "TBH"
              ) {
                const family = "Available";
                let available = parseFloat(r.Available) || 0;
                if (r.Unit === "12x750ml") available = available * 2;
                if (r.Unit === "1x750ml") available = available / 2;
                if (r.Unit === "Litre" || r.Units === "Item" ) available = available / 6;

                totals[family] = (totals[family] || 0) + available;
              }
            }

            if ( r.AdditionalAttribute2 === "USA")
            {
              if (filters.brand === 'all' || filters.brand === "jt" && r.Brand === "JT" ||
                filters.brand === "otq" && r.Brand === "OTQ" ||
                filters.brand === "tbh" && r.Brand === "TBH"
              ) {
                const family = "USA_Available";
                let available = parseFloat(r.Available) || 0;
                if (r.Unit === "12x750ml") available = available * 2;
                if (r.Unit === "1x750ml") available = available / 2;
                if (r.Unit === "Litre" || r.Units === "Item" ) available = available / 6;

                totals[family] = (totals[family] || 0) + available;

                 // By variety (case-insensitive contains checks)
                const desc = (r.ClientStockDescription || '').toLowerCase();
                if (desc.includes('sab') || desc.includes('sauvignon')) {
                  totals['SAB'] = (totals['SAB'] || 0) + available;
                }
                if (desc.includes('pin') || desc.includes('pinot')) {
                  totals['PIN'] = (totals['PIN'] || 0) + available;
                }
                if (desc.includes('chr') || desc.includes('chardonnay')) {
                  totals['CHR'] = (totals['CHR'] || 0) + available;
                }
                
              }
            }

          });

          const distributorSummary = Object.values(
            cin7.reduce((acc, row) => {
              const distributor = row.Location?.trim();
              let available = parseFloat(row.Available) || 0;
              if (row.Unit === "12x750ml") available = available * 2;
              if (row.Unit === "1x750ml") available = available / 2;
              if (row.Unit === "Litre" || row.Units === "Item" ) available = available / 6;
              
              const cases = available || 0;
              
              if (!distributor) return acc; // skip if no location

              if (!acc[distributor]) {
                acc[distributor] = { name: distributor, stock_status: row.Status, region: row.AdditionalAttribute2 || '', current_stock: 0 };
              }

              // Only overwrite region if the current row has a non-empty AdditionalAttribute2
              if (row.AdditionalAttribute2) {
                acc[distributor].region = row.AdditionalAttribute2;
              }

              acc[distributor].current_stock += cases;
              return acc;
            }, {})
          );
          setDistributors(distributorSummary)    
        }

        
        const stockChartData = months.map(month => ({
          month,
          sauvignon_blanc: Math.round(totals['SAB'] || totals['Sauvignon Blanc'] || 0),
          pinot_noir: Math.round(totals['PIN'] || totals['Pinot Noir'] || 0),
          chardonnay: Math.round(totals['CHR'] || totals['Chardonnay'] || 0)
        }));
        setStockData(stockChartData);
        setUsaStockFloat(totals["USA_Available"] || 0);
        setStockFloat(totals["Available"] || 0);

      if (salesRaw) {
          const sales = JSON.parse(salesRaw);
          // Build month list according to filters.dateRange (inclusive)
          const now = new Date();
          const from = filters.dateRange?.from || new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const to = filters.dateRange?.to || new Date(now.getFullYear(), now.getMonth(), 0);

          const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

          const monthsBetween = [];
          const cur = new Date(from.getFullYear(), from.getMonth(), 1);
          while (cur <= to) {
            monthsBetween.push({ year: cur.getFullYear().toString(), month: monthNames[cur.getMonth()] });
            cur.setMonth(cur.getMonth() + 1);
          }

          const salesChartData = monthsBetween.map(({ year, month }) => {
            const actual = (sales[year] && typeof sales[year][month] !== 'undefined') ? sales[year][month] : 0;
            const prevYear = String(Number(year) - 1);
            const previousActual = (sales[prevYear] && typeof sales[prevYear][month] !== 'undefined') ? sales[prevYear][month] : 0;
            // simple forecast: previousActual grown by 5% or a small smoothing between actual and previousActual
            const forecast = Math.round((previousActual * 1.05 + actual) / 2);
            return {
              month: `${month} ${year.slice(-2)}`,
              actual: Number(Number(actual).toFixed(2)),
              forecast,
              previousActual: Number(Number(previousActual).toFixed(2))
            };
          });
          setSalesData(salesChartData);
          console.log("Sales Chart Data:", salesChartData);
          // Generate comparison data for the previous year (aligned to monthsBetween)
          const comparisonSalesData = monthsBetween.map(({ year, month }) => {
            const prevYear = String(Number(year) - 1);
            const actual = (sales[prevYear] && typeof sales[prevYear][month] !== 'undefined') ? sales[prevYear][month] : 0;
            const forecast = Math.round(actual * 1.02); // small uplift for forecast comparison
            return {
              month: `${month} ${year.slice(-2)}`,
              actual: Number(Number(actual).toFixed(2)),
              forecast
            };
          });

          // Build comparison stock using totals we computed earlier (stockChartData contains month labels without years)
          // Map monthsBetween to the same month names used in stockChartData, and use those values where available.
          const stockMapByMonth = Object.fromEntries(
            stockChartData.map(s => [s.month, s])
          );

          const comparisonStockData = monthsBetween.map(({ year, month }) => {
            // stockChartData used simple month keys like 'Jan' — find by month name
            const key = month;
            const base = stockMapByMonth[key] || { sauvignon_blanc: 0, pinot_noir: 0, chardonnay: 0 };
            // For comparison we use previous-year values: here we simply reuse base as a proxy.
            // If you have historical stock per year, replace with a proper lookup.
            return {
              month: `${month} ${year.slice(-2)}`,
              sauvignon_blanc: Math.round(base.sauvignon_blanc || 0),
              pinot_noir: Math.round(base.pinot_noir || 0),
              chardonnay: Math.round(base.chardonnay || 0)
            };
          });

          setComparisonData({
            sales: comparisonSalesData,
            stock: comparisonStockData
          });
          
        }

        
      } catch (err) {
        console.warn('Failed to load uploaded data:', err);
      }
    };

    loadUploadedData();

    const handler = () => loadUploadedData();
    window.addEventListener('vc:data:uploaded', handler);
    return () => window.removeEventListener('vc:data:uploaded', handler);
  }, [filters]); // Re-run if region filter changes, as it affects data loading


  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));


  };

  const handleKPIClick = (kpi) => {
    setSelectedKPI(kpi);
    // Generate mock drilldown data
    setDrilldownData([
      { brand: 'Sauvignon Blanc 2023', region: 'USA', distributor: 'Premium Wines USA', value: '2,340', status: 'healthy' },
      { brand: 'Pinot Noir 2022', region: 'UK', distributor: 'Fine Wine UK', value: '1,890', status: 'warning' },
      { brand: 'Chardonnay 2023', region: 'Asia', distributor: 'Asia Pacific Wines', value: '3,120', status: 'critical' },
    ]);
  };

  const handleExport = (type) => {
    // Mock export functionality
    console.log(`Exporting ${type} data...`);
    
    let csvContent = '';
    let filename = '';

    if (type === 'sales') {
      csvContent = salesData.map(row => `${row.month},${row.actual},${row.forecast}`).join('\n');
      filename = 'sales_vs_forecast.csv';
    } else if (type === 'stock') {
      csvContent = stockData.map(row => `${row.month},${row.sauvignon_blanc},${row.pinot_noir},${row.chardonnay}`).join('\n');
      filename = 'stock_float_trend.csv';
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getKPIByName = (name) => {
    return kpis.find(kpi => kpi.metric_name === name) || { current_value: 0, previous_value: 0, unit: '', status: 'healthy' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Filter Bar */}
        <FilterBar filters={filters} onFilterChange={handleFilterChange} />

        {/* Hero KPI Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPITile
            title="Current Stock Float"
            value={stockFloat}
            previousValue={getKPIByName('stock_float').previous_value || 13400}
            unit="cases"
           
            status={getKPIByName('stock_float').status}
            onClick={() => handleKPIClick(getKPIByName('stock_float'))}
          />
          
          <KPITile
            title="Inventory Turnover"
            value={getKPIByName('inventory_turnover').current_value || 42}
            previousValue={getKPIByName('inventory_turnover').previous_value || 38}
            unit="days"
            status={getKPIByName('inventory_turnover').status}
            onClick={() => handleKPIClick(getKPIByName('inventory_turnover'))}
          />
          
          <KPITile
            title="USA Distributor Stock"
            value={usaStockFloat}
            previousValue={getKPIByName('usa_stock').previous_value || 5100}
            unit="cases"
           
            status={getKPIByName('usa_stock').status}
            onClick={() => handleKPIClick(getKPIByName('usa_stock'))}
          />
          
          <KPITile
            title="Forecast Accuracy"
            value={getKPIByName('forecast_accuracy').current_value || 87.5}
            previousValue={getKPIByName('forecast_accuracy').previous_value || 84.2}
            unit="%"
            status={getKPIByName('forecast_accuracy').status}
            onClick={() => handleKPIClick(getKPIByName('forecast_accuracy'))}
          />
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          <SalesChart 
            data={salesData} 
            comparisonData={comparisonData.sales}
            comparisonPeriod={filters.comparisonPeriod}
            onExport={handleExport} 
          />
          <StockChart 
            data={stockData} 
            comparisonData={comparisonData.stock}
            comparisonPeriod={filters.comparisonPeriod}
            onExport={handleExport} 
          />
        </div>

        {/* Map and Alerts Row */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <DistributorMap distributors={distributors} />
          </div>
          <AlertsFeed alerts={alerts} />
        </div>

      </div>

      {/* Drilldown Modal */}
      {/* <DrilldownModal
        isOpen={!!selectedKPI}
        onClose={() => setSelectedKPI(null)}
        title={selectedKPI?.metric_name}
        data={drilldownData}
        onExport={() => handleExport('drilldown')}
      /> */}
    </div>
  );
}
