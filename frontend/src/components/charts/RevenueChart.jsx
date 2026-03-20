// src/components/charts/RevenueChart.jsx
import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function RevenueChart({ data = [] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#fff', 
            border: '1px solid #e5e7eb',
            borderRadius: '8px'
          }}
        />
        <Line 
          type="monotone" 
          dataKey="revenue" 
          stroke="#2563eb" 
          strokeWidth={2}
          dot={{ fill: "#2563eb" }}
        />
        <Line 
          type="monotone" 
          dataKey="bookings" 
          stroke="#10b981" 
          strokeWidth={2}
          dot={{ fill: "#10b981" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
