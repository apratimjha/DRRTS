import React from 'react';

const ActionButton = ({ icon, label, description, onClick, variant = 'primary', fullWidth = true, disabled = false }) => {
    const variants = {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md',
        secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300',
        success: 'bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md',
        warning: 'bg-orange-600 hover:bg-orange-700 text-white shadow-sm hover:shadow-md',
        danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow-md',
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
        ${fullWidth ? 'w-full' : ''}
        ${variants[variant]}
        px-4 py-3 rounded-lg font-medium text-sm
        transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        flex items-center justify-center gap-2
      `}
        >
            {icon && <span className="text-lg">{icon}</span>}
            <div className="flex flex-col items-start">
                <span className="font-semibold">{label}</span>
                {description && <span className="text-xs opacity-90">{description}</span>}
            </div>
        </button>
    );
};

export default ActionButton;
