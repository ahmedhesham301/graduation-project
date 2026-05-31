import { useState, useEffect } from "react";
import { api } from "../components/Axios";
import { 
    LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend 
} from "recharts";
import { Download, Calendar, Filter, RefreshCw, Users, Home, DollarSign, Eye, Trophy, Target, Clock, MessageCircle } from "lucide-react";
import "./AdminAnalytics.css";

export default function AdminAnalytics() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data } = await api.get("/admin/reports");
            // Normalize counts to numbers just in case
            if (data.offerStatuses) {
                data.offerStatuses = data.offerStatuses.map(o => ({ ...o, count: Number(o.count) }));
            }
            if (data.leadMethods) {
                data.leadMethods = data.leadMethods.map(l => ({ ...l, count: Number(l.count) }));
            }
            setData(data);
        } catch (err) {
            console.error("Failed to load analytics:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899"];

    // KPI Calculations
    const totalUsers = data?.userDist?.reduce((acc, curr) => acc + Number(curr.count), 0) || 0;
    const totalListings = data?.propertyDist?.reduce((acc, curr) => acc + Number(curr.count), 0) || 0;
    const totalSalesValue = data?.salesTrends?.reduce((acc, curr) => acc + Number(curr.total_value), 0) || 0;
    const totalViews = data?.viewsTrends?.reduce((acc, curr) => acc + Number(curr.count), 0) || 0;

    const handleExport = () => {
        if (!data) return;
        
        let csv = "Category,Label,Value\n";
        csv += `KPI,Total Users,${totalUsers}\n`;
        csv += `KPI,Total Listings,${totalListings}\n`;
        csv += `KPI,Sales Volume,${totalSalesValue}\n`;
        csv += `KPI,Total Views,${totalViews}\n\n`;
        
        csv += "Monthly Trends,Month,Users,Listings,Contacts\n";
        data.registrations.forEach((r, i) => {
            csv += `Trend,${r.month},${r.count},${data.listings[i]?.count || 0},${data.contacts[i]?.count || 0}\n`;
        });
        csv += "\n";

        csv += "Regional Popularity,City,Properties\n";
        data.topCities.forEach(c => {
            csv += `Region,${c.city},${c.count}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `3akarati_analytics_${new Date().toISOString().split('T')[0]}.csv`);
        link.click();
    };

    if (loading) return <div className="analytics-loading">Analyzing system data...</div>;
    if (!data) return <div className="analytics-error">Failed to load data.</div>;

    const renderChart = (title, icon, subtitle, content, isEmpty) => (
        <section className={`chart-card ${title === 'Growth & Engagement' || title === 'Top Sellers' || title === 'High-Performance Properties' ? 'full-width' : ''}`}>
            <div className="chart-header">
                <h3>{icon} {title}</h3>
                <p>{subtitle}</p>
            </div>
            <div className="chart-container">
                {isEmpty ? <div className="empty-chart">No data available for this metric.</div> : content}
            </div>
        </section>
    );

    return (
        <div className="admin-analytics">
            <div className="analytics-header">
                <div>
                    <h2>Data Insights & Analytics</h2>
                    <p>Advanced metrics for platform health, user behavior, and market performance.</p>
                </div>
                <div className="analytics-actions">
                    <button className="icon-btn" onClick={fetchData} title="Refresh Data"><RefreshCw size={18} /></button>
                    <button className="secondary-btn" onClick={() => window.print()} title="Print / Save PDF">Print</button>
                    <button className="primary-btn" onClick={handleExport}><Download size={18} /> Export CSV</button>
                </div>
            </div>

            <section className="analytics-kpis">
                <div className="kpi-mini-card">
                    <div className="kpi-icon blue"><Users size={20} /></div>
                    <div className="kpi-data"><span className="label">Total Users</span><span className="value">{totalUsers.toLocaleString()}</span></div>
                </div>
                <div className="kpi-mini-card">
                    <div className="kpi-icon green"><Home size={20} /></div>
                    <div className="kpi-data"><span className="label">Total Listings</span><span className="value">{totalListings.toLocaleString()}</span></div>
                </div>
                <div className="kpi-mini-card">
                    <div className="kpi-icon purple"><DollarSign size={20} /></div>
                    <div className="kpi-data"><span className="label">Sales Volume</span><span className="value">{(totalSalesValue / 1000000).toFixed(1)}M EGP</span></div>
                </div>
                <div className="kpi-mini-card">
                    <div className="kpi-icon yellow"><Eye size={20} /></div>
                    <div className="kpi-data"><span className="label">Total Views</span><span className="value">{totalViews.toLocaleString()}</span></div>
                </div>
            </section>

            <div className="analytics-grid">
                {renderChart("Growth & Engagement", <Target size={18} className="title-icon" />, "Platform expansion over the last 12 months.", (
                    <ResponsiveContainer width="100%" height={350}>
                        <AreaChart data={data.registrations.map((r, i) => ({
                            month: r.month,
                            users: Number(r.count),
                            listings: Number(data.listings[i]?.count || 0),
                            contacts: Number(data.contacts[i]?.count || 0)
                        }))}>
                            <defs><linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                            <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                            <YAxis stroke="#9ca3af" fontSize={12} />
                            <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "12px" }} />
                            <Legend verticalAlign="top" height={36}/>
                            <Area type="monotone" dataKey="users" name="New Users" stroke="#3b82f6" fillOpacity={1} fill="url(#colorUsers)" strokeWidth={3} />
                            <Area type="monotone" dataKey="listings" name="New Listings" stroke="#10b981" fill="none" strokeWidth={3} />
                            <Area type="monotone" dataKey="contacts" name="Leads" stroke="#f59e0b" fill="none" strokeWidth={3} />
                        </AreaChart>
                    </ResponsiveContainer>
                ), !data.registrations || data.registrations.length === 0)}

                {renderChart("Lead Sources", <MessageCircle size={18} className="title-icon" />, "How buyers prefer to contact sellers.", (
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie 
                                data={data.leadMethods} 
                                cx="50%" cy="50%" 
                                innerRadius={60} outerRadius={80} 
                                paddingAngle={5} dataKey="count" nameKey="label"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {data.leadMethods.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "12px" }} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                ), !data.leadMethods || data.leadMethods.length === 0)}

                {renderChart("Avg. Time to Sell", <Clock size={18} className="title-icon" />, "Average days on market by property type.", (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data.timeToSell}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                            <XAxis dataKey="label" stroke="#9ca3af" fontSize={11} />
                            <YAxis stroke="#9ca3af" fontSize={12} unit=" days" />
                            <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "12px" }} />
                            <Bar dataKey="value" name="Days" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                ), !data.timeToSell || data.timeToSell.length === 0)}

                {renderChart("Top Sellers", <Trophy size={18} className="title-icon" />, "Best performing sellers by revenue generated.", (
                    <div className="table-container-mini">
                        <table className="mini-leaderboard">
                            <thead><tr><th>Seller Name</th><th>Listings</th><th>Sold</th><th>Total Revenue</th></tr></thead>
                            <tbody>
                                {data.sellers.map((seller, i) => (
                                    <tr key={i}>
                                        <td className="seller-name-td"><div className="rank-badge">{i+1}</div>{seller.name}</td>
                                        <td>{seller.total_listings}</td>
                                        <td><span className="sold-count-tag">{seller.sold_count}</span></td>
                                        <td className="revenue-td">{Number(seller.total_revenue).toLocaleString()} EGP</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ), !data.sellers || data.sellers.length === 0)}

                {renderChart("High-Performance Properties", <Target size={18} className="title-icon" />, "Most viewed and active property listings.", (
                    <div className="table-container-mini">
                        <table className="mini-leaderboard">
                            <thead><tr><th>Property ID</th><th>Location</th><th>Type</th><th>Views</th><th>Leads</th><th>Saves</th></tr></thead>
                            <tbody>
                                {data.topProperties.map((prop, i) => (
                                    <tr key={i}>
                                        <td>#{prop.id}</td><td>{prop.city}, {prop.district}</td><td><span className="type-tag-mini">{prop.type}</span></td><td><strong>{prop.views}</strong></td><td>{prop.leads}</td><td>{prop.saves}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ), !data.topProperties || data.topProperties.length === 0)}
{/* Offer Status */}
{renderChart("Offer Status", <Target size={18} className="title-icon" />, "Breakdown of all purchase offers.", (
    <ResponsiveContainer width="100%" height={300}>
        <PieChart>
            <Pie 
                data={data.offerStatuses} 
                cx="50%" cy="50%" 
                innerRadius={60} outerRadius={80} 
                dataKey="count" nameKey="label"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
                {data.offerStatuses.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[(index + 4) % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "12px" }} />
            <Legend />
        </PieChart>
    </ResponsiveContainer>
), !data.offerStatuses || data.offerStatuses.length === 0)}


                {renderChart("Market Visibility", <Eye size={18} className="title-icon" />, "Property interaction trends.", (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={data.viewsTrends}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                            <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                            <YAxis stroke="#9ca3af" fontSize={12} />
                            <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "12px" }} />
                            <Line type="monotone" dataKey="count" name="Views" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: "#ef4444" }} />
                        </LineChart>
                    </ResponsiveContainer>
                ), !data.viewsTrends || data.viewsTrends.length === 0)}
            </div>
        </div>
    );
}
