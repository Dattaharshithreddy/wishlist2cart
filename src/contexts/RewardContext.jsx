import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const RewardContext = createContext();

const POINTS_STORAGE_KEY = "loyaltyPoints";
const COUPONS_STORAGE_KEY = "userCoupons";
const LAST_SPIN_KEY = "lastSpinDate";

export const RewardProvider = ({ children }) => {
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [coupons, setCoupons] = useState([]);
  const [lastSpin, setLastSpin] = useState(null);
  const [appliedCoupon, setAppliedCoupon] = useState(null); // New: store applied coupon

  // Load persisted data
  useEffect(() => {
    const savedPoints = parseInt(localStorage.getItem(POINTS_STORAGE_KEY) || "0", 10);
    setLoyaltyPoints(savedPoints);

    try {
      const savedCoupons = JSON.parse(localStorage.getItem(COUPONS_STORAGE_KEY)) || [];
      setCoupons(savedCoupons);
    } catch {
      setCoupons([]);
    }
    const savedSpin = localStorage.getItem(LAST_SPIN_KEY);
    if (savedSpin) setLastSpin(new Date(savedSpin));
  }, []);

  // Persist data
  useEffect(() => {
    localStorage.setItem(POINTS_STORAGE_KEY, loyaltyPoints.toString());
  }, [loyaltyPoints]);

  useEffect(() => {
    localStorage.setItem(COUPONS_STORAGE_KEY, JSON.stringify(coupons));
  }, [coupons]);

  useEffect(() => {
    if (lastSpin) localStorage.setItem(LAST_SPIN_KEY, lastSpin.toISOString());
  }, [lastSpin]);

  // Add points
  const addPoints = useCallback((amount) => {
    setLoyaltyPoints((prev) => prev + amount);
  }, []);

  // Add coupon
  const addCoupon = useCallback((coupon) => {
    setCoupons((prev) => [...prev, coupon]);
  }, []);

  // Mark coupon used
  const markCouponUsed = useCallback((couponId) => {
    setCoupons((prev) => prev.map(c => c.id === couponId ? { ...c, used: true } : c));
    if (appliedCoupon?.id === couponId) {
      setAppliedCoupon(null); // clear applied coupon if marked used
    }
  }, [appliedCoupon]);

  // Mark coupon unused (revert)
  const markCouponUnused = useCallback((couponId) => {
    setCoupons((prev) => prev.map(c => c.id === couponId ? { ...c, used: false } : c));
  }, []);

  // Record spin
  const recordSpin = useCallback((date) => {
    setLastSpin(date);
  }, []);

  // Can spin today
  const canSpin = (() => {
    if (!lastSpin) return true;
    const now = new Date();
    return now.toDateString() !== lastSpin.toDateString();
  })();

  // Get valid coupons (non expired and not used)
  const getValidCoupons = useCallback(() => {
    const now = new Date();
    return coupons.filter(c => !c.used && (!c.expiry || new Date(c.expiry) > now));
  }, [coupons]);

  // Apply coupon - new method to handle coupon application logic
  const applyCoupon = useCallback((coupon) => {
    if (!appliedCoupon) {
      setAppliedCoupon(coupon);
    }
  }, [appliedCoupon]);

  // Remove applied coupon
  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
  }, []);

  return (
    <RewardContext.Provider
      value={{
        loyaltyPoints,
        coupons,
        appliedCoupon, // expose applied coupon
        addPoints,
        addCoupon,
        markCouponUsed,
        markCouponUnused,
        recordSpin,
        canSpin,
        getValidCoupons,
        applyCoupon, // method to apply coupon
        removeCoupon, // method to clear applied coupon
      }}
    >
      {children}
    </RewardContext.Provider>
  );
};

export const useRewards = () => {
  const context = useContext(RewardContext);
  if (!context) {
    throw new Error("useRewards must be used within a RewardProvider");
  }
  return context;
};
