import { useState, useEffect } from "react";
import { api } from "../components/Axios";
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
    AreaChart, Area
} from "recharts";
import { 
    Users, Home, MessageSquare, TrendingUp, 
    DollarSign, Eye, CheckCircle, Activity, Download
} from "lucide-react";
import Skeleton from "../components/Skeleton";
import "./AdminReports.css";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#6366f1", "#ec4899"];

export default function AdminReports() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const { data: reports } = await api.get("/admin/reports");
                setData(reports);
            } catch (err) {
                console.error("Failed to load reports:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, []);

    const handleExport = () => {
        if (!data) return;
        
        let csv = "3akarati System Audit Report\n";
        csv += `Generated on,${new Date().toLocaleString()}\n\n`;
        
        csv += "Metric,Value\n";
        csv += `Total Users,${data.userDist.reduce((acc, curr) => acc + Number(curr.count), 0)}\n`;
        csv += `Total Listings,${data.propertyDist.reduce((acc, curr) => acc + Number(curr.count), 0)}\n`;
        csv += `Total Sales Value,${data.salesTrends.reduce((acc, curr) => acc + Number(curr.total_value), 0)}\n`;
        csv += `Total Views,${data.viewsTrends.reduce((acc, curr) => acc + Number(curr.count), 0)}\n\n`;

        csv += "Monthly Activity,Users,Listings,Contacts\n";
        data.registrations.forEach((reg, i) => {
            csv += `${reg.month},${reg.count},${data.listings[i]?.count || 0},${data.contacts[i]?.count || 0}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `system_audit_${new Date().toISOString().split('T')[0]}.csv`);
        link.click();
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) return (
        <div className="admin-reports">
            <h2>System Reports</h2>
            <div className="kpi-grid">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="kpi-card">
                        <Skeleton height="100px" />
                    </div>
                ))}
            </div>
            <div className="charts-grid">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="chart-card">
                        <Skeleton height="300px" />
                    </div>
                ))}
            </div>
        </div>
    );

    if (!data) return <div className="reports-loading">Failed to load reports.</div>;

    // Data Normalization
    const activityData = data.registrations.map((reg, i) => ({
        month: reg.month,
        users: Number(reg.count),
        listings: Number(data.listings[i]?.count || 0),
        contacts: Number(data.contacts[i]?.count || 0)
    }));

    const salesTrendData = data.salesTrends.map(s => ({
        month: s.month,
        count: Number(s.count),
        value: Number(s.total_value)
    }));

    const cityData = data.topCities.map(c => ({
        city: c.city,
        count: Number(c.count)
    }));

    const propertyDist = data.propertyDist.map(d => ({
        label: d.label,
        count: Number(d.count)
    }));

    const userDist = data.userDist.map(d => ({
        label: d.label,
        count: Number(d.count)
    }));

    const avgPriceData = data.avgPriceByType.map(d => ({
        label: d.label,
        value: Number(d.value)
    }));

    const totalUsers = userDist.reduce((acc, curr) => acc + curr.count, 0);
    const totalListings = propertyDist.reduce((acc, curr) => acc + curr.count, 0);
    const totalSalesValue = salesTrendData.reduce((acc, curr) => acc + curr.value, 0);
    const totalViews = data.viewsTrends.reduce((acc, curr) => acc + Number(curr.count), 0);

    return (
        <div className="admin-reports">
            <div className="reports-header">
                <div>
                    <h2>Detailed Platform Reports</h2>
                    <p className="subtitle">Comprehensive data audit and performance verification.</p>
                </div>
                <div className="report-actions">
                    <button className="secondary-btn" onClick={handleExport}>Download CSV</button>
                    <button className="primary-action" onClick={handlePrint}>Generate PDF</button>
                </div>
            </div>

            <section className="kpi-grid">
                <div className="kpi-card">
                    <div className="kpi-icon blue"><Users size={24} /></div>
                    <div className="kpi-info">
                        <span className="kpi-label">Total Users</span>
                        <span className="kpi-value">{totalUsers.toLocaleString()}</span>
                        <span className="kpi-trend positive">Verified Accounts</span>
                    </div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-icon green"><Home size={24} /></div>
                    <div className="kpi-info">
                        <span className="kpi-label">Total Listings</span>
                        <span className="kpi-value">{totalListings.toLocaleString()}</span>
                        <span className="kpi-trend positive">Active Properties</span>
                    </div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-icon purple"><DollarSign size={24} /></div>
                    <div className="kpi-info">
                        <span className="kpi-label">Sales Volume</span>
                        <span className="kpi-value">{(totalSalesValue / 1000000).toFixed(1)}M EGP</span>
                        <span className="kpi-trend positive">Total Transactions</span>
                    </div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-icon yellow"><Eye size={24} /></div>
                    <div className="kpi-info">
                        <span className="kpi-label">Total Views</span>
                        <span className="kpi-value">{totalViews.toLocaleString()}</span>
                        <span className="kpi-trend positive">System Engagement</span>
                    </div>
                </div>
            </section>

            <div className="charts-grid">
                <section className="chart-card wide">
                    <div className="chart-header">
                        <h3>Market Growth Trends</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={activityData}>
                            <defs>
                                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} dy={10} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip
                                contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 12 }}
                            />
                            <Legend verticalAlign="top" height={36}/>
                            <Area type="monotone" dataKey="users" stroke="#3b82f6" fillOpacity={1} fill="url(#colorUsers)" name="New Users" strokeWidth={3} />
                            <Area type="monotone" dataKey="listings" stroke="#10b981" fill="none" name="New Listings" strokeWidth={3} />
                            <Area type="monotone" dataKey="contacts" stroke="#f59e0b" fill="none" name="Contacts" strokeWidth={3} />
                        </AreaChart>
                    </ResponsiveContainer>
                </section>

                <section className="chart-card">
                    <div className="chart-header">
                        <h3>Monthly Sales Volume</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={salesTrendData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip
                                contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 12 }}
                                formatter={(value) => [`${Number(value).toLocaleString()} EGP`, 'Value']}
                            />
                            <Bar dataKey="value" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Sales Value" />
                        </BarChart>
                    </ResponsiveContainer>
                </section>

                <section className="chart-card">
                    <div className="chart-header">
                        <h3>Average Property Price</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={avgPriceData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#374151" />
                            <XAxis type="number" hide />
                            <YAxis dataKey="label" type="category" axisLine={false} tickLine={false} width={100} />
                            <Tooltip
                                contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 12 }}
                                formatter={(value) => [`${Number(value).toLocaleString()} EGP`, 'Avg Price']}
                            />
                            <Bar dataKey="value" fill="#3b82f6" radius={[0, 6, 6, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </section>

                <section className="chart-card">
                    <div className="chart-header">
                        <h3>Property Distribution</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={propertyDist}
                                dataKey="count"
                                nameKey="label"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                innerRadius={40}
                                paddingAngle={5}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {propertyDist.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 12 }} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </section>

                <section className="chart-card">
                    <div className="chart-header">
                        <h3>User Roles</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={userDist}
                                dataKey="count"
                                nameKey="label"
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {userDist.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 12 }} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </section>

                <section className="chart-card wide">
                    <div className="chart-header">
                        <h3>Regional Listing Density</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={cityData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                            <XAxis dataKey="city" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 12 }} />
                            <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Properties" />
                        </BarChart>
                    </ResponsiveContainer>
                </section>
            </div>
        </div>
    );
}
