import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import CheckCircleIcon from '@heroicons/react/24/solid/CheckCircleIcon';
import { useRewards } from '@/contexts/RewardContext';

const OrderSuccess = () => {
  const { addPoints } = useRewards();

  useEffect(() => {
    // Award 100 loyalty points after order is successfully placed
    addPoints(100);
  }, [addPoints]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e0f6ff] via-[#f3f7ff] to-[#c0e3ff]">
      <div className="max-w-md w-full mx-auto p-8 bg-white shadow-2xl rounded-2xl relative">
        {/* Large Success Icon (centered, brand color) */}
        <div className="flex justify-center mb-5">
          <CheckCircleIcon className="w-16 h-16 text-green-500 animate-bounce" />
        </div>
        {/* Main Message */}
        <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-3 tracking-tight">
          Order Placed Successfully!
        </h2>
        <p className="text-center text-gray-600 mb-7 text-lg">
          Thank you for shopping with us.<br />
          You’ll shortly receive your order details by email.
        </p>
        {/* Action Buttons */}
        <div className="flex gap-4 justify-center mt-6">
          <Link
            to="/orders"
            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition-all text-base"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path d="M3 3h2l.357 2.01M7 13h10l4-8H5.793"></path>
              <circle cx="9" cy="20" r="1"></circle>
              <circle cx="17" cy="20" r="1"></circle>
            </svg>
            My Orders
          </Link>
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gray-100 text-blue-600 font-semibold shadow hover:bg-blue-200 transition-all border border-blue-100 text-base"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path d="M4 4h16v16H4z"></path>
            </svg>
            Dashboard
          </Link>
        </div>
        {/* Success Ribbon */}
        <div className="absolute -top-4 right-4 bg-green-100 text-green-700 px-4 py-1 rounded-full font-medium text-xs shadow">
          🎉 Success
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
