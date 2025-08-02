import React, { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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
  const { cartItems, clearCart, getTotalValue, couponApplied, couponDiscountPercent } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [addingNew, setAddingNew] = useState(false);
  const [newAddress, setNewAddress] = useState({ ...blankAddress });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('razorpay');

  const BACKEND_URL = import.meta.env.VITE_PUBLIC_API_URL;
  const RAZORPAY_KEY = import.meta.env.VITE_PUBLIC_RAZORPAY_KEY;

  const discountedTotal = getTotalValue;

  useEffect(() => {
    if (!user) return;
    async function fetchAddresses() {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userAddresses = userDoc.data()?.addresses || [];
          setAddresses(userAddresses);
          const def = userAddresses.find(a => a.isDefault);
          if (def) {
            setSelectedAddressId(def.id);
          } else if (userAddresses.length > 0) {
            setSelectedAddressId(userAddresses[0].id);
          }
        }
      } catch (error) {
        toast({ title: 'Failed to load addresses', description: error.message, variant: 'destructive' });
      }
    }
    fetchAddresses();
  }, [user, toast]);

  const handleNewAddressChange = (field, val) => {
    setNewAddress(prev => ({ ...prev, [field]: val }));
    if (errors[field]) {
      setErrors(prev => ({...prev, [field]: null}));
    }
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

      await updateDoc(doc(db, 'users', user.uid), {
        addresses: updatedAddresses,
      });

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
    new Promise((resolve) => {
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

  const handleRazorpayPayment = (amount, orderData) => {
  return new Promise(async (resolve, reject) => {
    const loaded = await loadRazorpayScript();
    if (!loaded) return reject(new Error("Could not load Razorpay."));

    const { data: order } = await axios.post(`${BACKEND_URL}/create-order`, {
      amount: amount, // Amount in paise
      receipt: `rcpt_${Date.now()}`,
      notes: {
        userId: orderData.userId,
        address: `${orderData.address.streetAddress}, ${orderData.address.city}`
      }
    });

    const options = {
      key: RAZORPAY_KEY,
      amount: order.amount,
      currency: order.currency,
      name: 'Wishlist2Cart',
      description: 'Order Payment',
      order_id: order.id,
      handler: async (response) => {
          clearCart();
          toast({ title: 'Payment Successful!' });

          // SEND INVOICE EMAIL HERE
          await sendInvoiceEmail({ id: order.id, ...orderData, paymentId: response.razorpay_payment_id }, user.email);

          navigate(`/order-success?payment_id=${response.razorpay_payment_id}&order_id=${order.id}`);
          resolve(response);
      },
      prefill: {
          name: orderData.address.fullName,
          email: user.email,
          contact: orderData.address.phone,
      },
      theme: { color: '#7c3aed' },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (response) => {
      toast({ title: 'Payment Failed', description: response.error.description, variant: 'destructive' });
      reject(new Error(response.error.description));
    });
    rzp.open();
  });
};

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

    const totalAmount = discountedTotal;
    const orderDetails = {
      userId: user.uid,
      userName: user.displayName || user.email,
      items: cartItems.map(({ addedAt, ...rest }) => rest),
      address: addressToUse,
      total: totalAmount,
      paymentMethod,
      estimatedDelivery: new Date(Date.now() + 5 * 86400000),
      status: 'Pending Payment',
      createdAt: serverTimestamp(),
      couponApplied,
      couponDiscountPercent,
    };
    
    try {
      if (paymentMethod === 'cod') {
        const orderToSave = { ...orderDetails, status: 'Processing', paymentId: 'COD' };
        const docRef = await addDoc(collection(db, 'orders'), orderToSave);
        clearCart();
        toast({ title: 'Order placed successfully' });
        await sendInvoiceEmail({ id: docRef.id, ...orderToSave }, user.email);
        navigate(`/order-success?order_id=${docRef.id}`);
      } else if (paymentMethod === 'razorpay') {
        await handleRazorpayPayment(totalAmount, orderDetails);
      }
    } catch (error) {
      toast({ title: 'Order Failed', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };



  // ... UI rendering remains unchanged
  // ✅ You don’t need to change anything below this line
  // ✅ Full JSX code remains as you gave it
  if (!user) return <div className="container mx-auto py-20 text-center">Please log in to checkout.</div>;
  if (cartItems.length === 0) return <div className="container mx-auto py-20 text-center">Your cart is empty.</div>;

  return (
    <div className="container mx-auto max-w-xl p-6 bg-white rounded-lg shadow-md space-y-6">
      <h1 className="text-3xl font-bold">Checkout</h1>

      {/* Shipping Address Section */}
      <section>
        <h2 className="font-semibold mb-3">Shipping Address</h2>
        {!addingNew && addresses.length > 0 ? (
          <div className="space-y-4">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                onClick={() => setSelectedAddressId(addr.id)}
                className={`p-4 border-2 rounded cursor-pointer transition ${
                  selectedAddressId === addr.id ? 'border-violet-600 bg-violet-50' : 'border-gray-200 hover:border-violet-300'
                }`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setSelectedAddressId(addr.id);
                }}
              >
                <p className="font-medium text-lg">{addr.fullName}</p>
                <p>
                  {addr.streetAddress}, {addr.city}, {addr.postalCode}, {addr.country}
                </p>
                <p className="text-sm text-gray-600">Phone: {addr.phone || 'N/A'}</p>
                {addr.isDefault && (
                  <span className="inline-block mt-2 px-2 py-1 text-xs bg-violet-600 text-white rounded-full">
                    Default Address
                  </span>
                )}
              </div>
            ))}
            <Button onClick={() => setAddingNew(true)} disabled={loading}>
              + Add New Address
            </Button>
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {['fullName', 'streetAddress', 'city', 'postalCode', 'country'].map((field) => (
              <Input
                key={field}
                placeholder={field.replace(/([A-Z])/g, ' $1')}
                value={newAddress[field]}
                onChange={(e) => handleNewAddressChange(field, e.target.value)}
                disabled={loading}
              />
            ))}
            <Input
              placeholder="Phone (optional)"
              value={newAddress.phone}
              onChange={(e) => handleNewAddressChange('phone', e.target.value)}
              disabled={loading}
            />
            <div className="flex gap-3">
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

      {/* Payment Method Section */}
      <section className="space-y-4">
        <h2 className="font-semibold">Payment Method</h2>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="razorpay"
              checked={paymentMethod === 'razorpay'}
              onChange={() => setPaymentMethod('razorpay')}
            />
            Pay Online (UPI / Card / Netbanking)
          </label>
          <label className="flex items-center gap-2">
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

      <div className="text-sm text-gray-500">
        <strong>Estimated Delivery:</strong> {new Date(Date.now() + 5 * 86400000).toDateString()}
      </div>

      <Button size="lg" onClick={placeOrder} disabled={loading} className="w-full">
        {loading ? 'Placing Order...' : `Pay ₹${discountedTotal.toFixed(2)}`}
      </Button>
    </div>
  );
}


