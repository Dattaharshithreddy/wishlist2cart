import React, { useState, useEffect, useMemo } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useRewards } from '../contexts/RewardContext';

const blankAddress = {
  id: null,
  fullName: '',
  streetAddress: '',
  city: '',
  postalCode: '',
  country: '',
  phone: '',
  isDefault: false,
};

export default function CheckoutPage() {
  const {
    cartItems,
    clearCart,
    getTotalValue,
    couponApplied,
    couponDiscountPercent,
    applyCoupon,
  } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const { coupons, loyaltyPoints, markCouponUsed, appliedCoupon, applyCoupon: applyRewardCoupon } = useRewards();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [addingNew, setAddingNew] = useState(false);
  const [newAddress, setNewAddress] = useState({ ...blankAddress });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [selectedCouponId, setSelectedCouponId] = useState(null);

  const BACKEND_URL = import.meta.env.VITE_PUBLIC_API_URL;
  const RAZORPAY_KEY = import.meta.env.VITE_PUBLIC_RAZORPAY_KEY;

  // Calculate discounted total considering coupon discount from RewardContext appliedCoupon
  const discountedTotal = useMemo(() => {
    const total = getTotalValue;
    if (appliedCoupon && appliedCoupon.value) {
      // Assuming coupon discount value is a flat amount, adjust here if percent
      return Math.max(0, total - appliedCoupon.value);
    }
    return total;
  }, [getTotalValue, appliedCoupon]);

  // Load user addresses
  useEffect(() => {
    if (!user) return;
    async function fetchAddresses() {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userAddresses = userDoc.data()?.addresses || [];
          setAddresses(userAddresses);
          const def = userAddresses.find(a => a.isDefault);
          setSelectedAddressId(def ? def.id : (userAddresses[0]?.id || null));
        }
      } catch (error) {
        toast({ title: 'Failed to load addresses', description: error.message, variant: 'destructive' });
      }
    }
    fetchAddresses();
  }, [user, toast]);

  // Filter coupons: valid only if unexpired & unused
  const activeCoupons = useMemo(() => {
    const now = new Date();
    return coupons.filter(
      coupon =>
        !coupon.used && (!coupon.expiry || new Date(coupon.expiry) >= now)
    );
  }, [coupons]);

  const handleNewAddressChange = (field, val) => {
    setNewAddress(prev => ({ ...prev, [field]: val }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const validateNewAddress = () => {
    const errs = {};
    if (!newAddress.fullName?.trim()) errs.fullName = 'Full Name is required';
    if (!newAddress.streetAddress?.trim()) errs.streetAddress = 'Street Address is required';
    if (!newAddress.city?.trim()) errs.city = 'City is required';
    if (!newAddress.postalCode?.trim()) errs.postalCode = 'Postal Code is required';
    if (!newAddress.country?.trim()) errs.country = 'Country is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const addNewAddress = async () => {
    if (!validateNewAddress()) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' });
      return null;
    }
    setLoading(true);
    try {
      const id = crypto.randomUUID();
      const addressToAdd = { ...newAddress, id, isDefault: addresses.length === 0 };
      const updatedAddresses = [...addresses, addressToAdd];
      await updateDoc(doc(db, 'users', user.uid), { addresses: updatedAddresses });
      setAddresses(updatedAddresses);
      setSelectedAddressId(id);
      setNewAddress(blankAddress);
      setAddingNew(false);
      setErrors({});
      toast({ title: 'Address added successfully!' });
      return addressToAdd;
    } catch (error) {
      toast({ title: 'Failed to add address', description: error.message, variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const loadRazorpayScript = () =>
    new Promise(resolve => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => {
        toast({ title: 'Razorpay SDK failed to load.', variant: 'destructive' });
        resolve(false);
      };
      document.body.appendChild(script);
    });

  const handleRazorpayPayment = (amount, orderData) =>
    new Promise(async (resolve, reject) => {
      const loaded = await loadRazorpayScript();
      if (!loaded) return reject(new Error('Could not load Razorpay.'));

      const { data: order } = await axios.post(`${BACKEND_URL}/create-order`, {
        amount,
        receipt: `rcpt_${Date.now()}`,
        notes: { userId: orderData.userId, address: `${orderData.address.streetAddress}, ${orderData.address.city}` },
      });

      const options = {
        key: RAZORPAY_KEY,
        amount: order.amount,
        currency: order.currency,
        name: 'Wishlist2Cart',
        description: 'Order Payment',
        order_id: order.id,
        handler: async response => {
          clearCart();
          toast({ title: 'Payment Successful!' });
          await sendInvoiceEmail({ id: order.id, ...orderData, paymentId: response.razorpay_payment_id }, user.email);
          navigate(`/order-success?payment_id=${response.razorpay_payment_id}&order_id=${order.id}`);

          if (selectedCouponId) markCouponUsed(selectedCouponId);
          resolve(response);
        },
        prefill: { name: orderData.address.fullName, email: user.email, contact: orderData.address.phone },
        theme: { color: '#7c3aed' },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', response => {
        toast({ title: 'Payment Failed', description: response.error.description, variant: 'destructive' });
        reject(new Error(response.error.description));
      });
      rzp.open();
    });

  const sendInvoiceEmail = async (order, email) => {
    try {
      await axios.post(`${BACKEND_URL}/send-invoice`, { order, email });
      toast({ title: 'Invoice email sent successfully' });
    } catch (error) {
      console.error('Failed to send invoice email:', error);
      toast({ title: 'Failed to send invoice email', variant: 'destructive' });
    }
  };

  const placeOrder = async () => {
    if (!user || cartItems.length === 0 || loading) return;

    let addressToUse = addresses.find(addr => addr.id === selectedAddressId);
    if (addingNew) {
      const newAddr = await addNewAddress();
      if (!newAddr) return;
      addressToUse = newAddr;
    }
    if (!addressToUse) {
      toast({ title: 'Please select or add a shipping address', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const orderDetails = {
      userId: user.uid,
      userName: user.displayName || user.email,
      items: cartItems.map(({ addedAt, ...rest }) => rest),
      address: addressToUse,
      total: discountedTotal,
      paymentMethod,
      estimatedDelivery: new Date(Date.now() + 5 * 86400000),
      status: 'Pending Payment',
      createdAt: serverTimestamp(),
      couponApplied: !!appliedCoupon,
      couponDiscountPercent: appliedCoupon ? appliedCoupon.value : 0,
      appliedCouponId: selectedCouponId || null,
    };

    try {
      if (paymentMethod === 'cod') {
        const orderToSave = { ...orderDetails, status: 'Processing', paymentId: 'COD' };
        const docRef = await addDoc(collection(db, 'orders'), orderToSave);
        clearCart();
        toast({ title: 'Order placed successfully' });
        await sendInvoiceEmail({ id: docRef.id, ...orderToSave }, user.email);
        navigate(`/order-success?order_id=${docRef.id}`);

        if (selectedCouponId) markCouponUsed(selectedCouponId);
      } else if (paymentMethod === 'razorpay') {
        await handleRazorpayPayment(discountedTotal, orderDetails);
      }
    } catch (error) {
      toast({ title: 'Order Failed', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCoupon = coupon => {
    if (coupon.used) {
      toast({ title: 'Coupon Used', description: 'This coupon has already been used.', variant: 'destructive' });
      return;
    }
    if (appliedCoupon) {
      toast({ title: 'Coupon Already Applied', description: `You already have a coupon applied.` });
      return;
    }
    applyRewardCoupon(coupon); // Pass complete coupon to reward context
    setSelectedCouponId(coupon.id);
    toast({ title: 'Coupon Applied!', description: `You saved ₹${coupon.value}!`, variant: 'success' });
  };

  if (!user) return <div className="container mx-auto py-20 text-center">Please log in to checkout.</div>;
  if (cartItems.length === 0) return <div className="container mx-auto py-20 text-center">Your cart is empty.</div>;

  return (
    <div className="container mx-auto max-w-6xl p-6 bg-white dark:bg-gray-900 rounded-lg shadow-md text-gray-800 dark:text-gray-100">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left Column: Shipping Addresses */}
        <section>
          <h2 className="font-semibold mb-4">Shipping Address</h2>
          {!addingNew && addresses.length > 0 ? (
            <div className="space-y-4">
              {addresses.map(addr => (
                <div
                  key={addr.id}
                  onClick={() => setSelectedAddressId(addr.id)}
                  className={`p-4 border-2 rounded cursor-pointer transition ${
                    selectedAddressId === addr.id
                      ? 'border-violet-600 bg-violet-50 dark:bg-violet-900/30'
                      : 'border-gray-200 hover:border-violet-300 dark:border-gray-700 dark:hover:border-violet-400'
                  }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && setSelectedAddressId(addr.id)}
                >
                  <p className="font-medium text-lg">{addr.fullName}</p>
                  <p>{`${addr.streetAddress}, ${addr.city}, ${addr.postalCode}, ${addr.country}`}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Phone: {addr.phone || 'N/A'}</p>
                  {addr.isDefault && (
                    <span className="inline-block mt-2 px-2 py-1 text-xs bg-violet-600 text-white rounded-full">Default Address</span>
                  )}
                </div>
              ))}
              <Button onClick={() => setAddingNew(true)} disabled={loading} className="mt-4">
                + Add New Address
              </Button>
            </div>
          ) : (
            <div className="space-y-3 mt-4">
              {['fullName', 'streetAddress', 'city', 'postalCode', 'country'].map(field => (
                <Input
                  key={field}
                  placeholder={field.replace(/([A-Z])/g, ' $1')}
                  value={newAddress[field]}
                  onChange={e => handleNewAddressChange(field, e.target.value)}
                  disabled={loading}
                  className="dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400"
                />
              ))}
              <Input
                placeholder="Phone (optional)"
                value={newAddress.phone}
                onChange={e => handleNewAddressChange('phone', e.target.value)}
                disabled={loading}
                className="dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400"
              />
              <div className="flex gap-3 mt-3">
                <Button variant="secondary" onClick={() => setAddingNew(false)} disabled={loading}>
                  Cancel
                </Button>
                <Button onClick={addNewAddress} disabled={loading}>
                  Save Address
                </Button>
              </div>
            </div>
          )}
        </section>

        {/* Right Column: Loyalty Points, Coupons & Price Summary */}
        <section className="space-y-6">
          {/* Loyalty Points */}
          <div className="p-6 bg-yellow-100 dark:bg-yellow-900 rounded-lg shadow-inner text-center">
            <h2 className="text-lg font-semibold mb-2 text-yellow-800 dark:text-yellow-300">Your Loyalty Points</h2>
            <p className="text-4xl font-bold">{loyaltyPoints}</p>
            <p className="text-sm">Use these points on your order</p>
          </div>

          {/* Coupons */}
          {activeCoupons.length > 0 && (
            <div className="p-6 bg-blue-100 dark:bg-blue-900 rounded-lg max-h-56 overflow-auto text-gray-900 dark:text-gray-100">
              <h2 className="text-lg font-semibold mb-4 text-blue-800 dark:text-blue-400">Available Coupons</h2>
              <ul>
                {activeCoupons.map(coupon => (
                  <li key={coupon.id} className="flex justify-between bg-white dark:bg-gray-800 p-4 rounded shadow mb-2">
                    <div>
                      <p className="font-semibold">{coupon.code || 'COUPON'}</p>
                      <p className="text-sm">{`₹${coupon.value} off${coupon.expiry ? ` (Expires: ${new Date(coupon.expiry).toLocaleDateString()})` : ''}`}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleApplyCoupon(coupon)}
                      disabled={!!appliedCoupon || coupon.used}
                    >
                      Apply
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Price Summary and Payment */}
          <div className="p-6 bg-white dark:bg-gray-900 rounded-lg shadow border border-gray-200 dark:border-gray-700 max-w-sm mx-auto lg:mx-0">
            <h2 className="mb-4 text-2xl font-semibold dark:text-white">Summary</h2>
            <div className="text-lg space-y-2 dark:text-white">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              {!!appliedCoupon && (
                <div className="flex justify-between font-semibold text-green-600 dark:text-green-400">
                  <span>Coupon Discount</span>
                  <span>-₹{appliedCoupon.value}</span>
                </div>
              )}
              <div className="border-t border-gray-300 dark:border-gray-700 pt-4 flex justify-between font-extrabold text-xl">
                <span>Total</span>
                <span>₹{discountedTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <section>
                <h3 className="font-semibold mb-2 dark:text-white">Payment Method</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 dark:text-white">
                    <input
                      type="radio"
                      value="razorpay"
                      checked={paymentMethod === 'razorpay'}
                      onChange={() => setPaymentMethod('razorpay')}
                    />
                    Pay Online (UPI / Card / Netbanking)
                  </label>
                  <label className="flex items-center gap-2 dark:text-white">
                    <input
                      type="radio"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                    />
                    Cash on Delivery (COD)
                  </label>
                </div>
              </section>

              <Button
                size="lg"
                onClick={placeOrder}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Placing Order...' : paymentMethod === 'cod' ? 'Place Order' : `Pay ₹${discountedTotal.toFixed(2)}`}
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
