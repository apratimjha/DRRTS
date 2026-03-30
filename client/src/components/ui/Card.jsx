import React from 'react';

const Card = ({ children, className = '', title, subtitle }) => {
    return (
        <div className={`bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}>
            {(title || subtitle) && (
                <div className="px-6 py-4 border-b border-gray-100">
                    {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
                    {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
                </div>
            )}
            <div className={title || subtitle ? 'p-6' : ''}>
                {children}
            </div>
        </div>
    );
};

export default Card;
