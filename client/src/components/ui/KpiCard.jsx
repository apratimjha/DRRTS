import React from 'react';

const KpiCard = ({ icon, title, value, subtitle, trend, color = 'blue' }) => {
    const colorClasses = {
        blue: 'from-blue-500 to-blue-600',
        green: 'from-green-500 to-green-600',
        purple: 'from-purple-500 to-purple-600',
        orange: 'from-orange-500 to-orange-600',
        red: 'from-red-500 to-red-600'
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
            <div className="p-5">
                <div className="flex items-start justify-between">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center text-2xl shadow-lg`}>
                        {icon}
                    </div>

                    {/* Value */}
                    <div className="text-right">
                        <div className="text-3xl font-bold text-gray-900">{value}</div>
                        {trend && (
                            <div className={`text-xs font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'} mt-1`}>
                                {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-4">
                    <h4 className="text-sm font-semibold text-gray-700">{title}</h4>
                    <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
                </div>
            </div>
        </div>
    );
};

export default KpiCard;
