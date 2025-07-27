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
  const { cartItems, clearCart, getTotalValue } = useCart();
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

  // Load user addresses
  useEffect(() => {
    if (!user) return;
    async function fetchAddresses() {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setAddresses(data.addresses || []);
          const def = (data.addresses || []).find(a => a.isDefault);
          setSelectedAddressId(def ? def.id : null);
        }
      } catch (error) {
        toast({ title: 'Failed to load addresses', description: error.message, variant: 'destructive' });
      }
    }
    fetchAddresses();
  }, [user, toast]);

  const handleNewAddressChange = (field, val) => {
    setNewAddress(prev => ({ ...prev, [field]: val }));
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
      return null; // null indicates failure
    }
    setLoading(true);
    try {
      const id = Date.now().toString();
      const addressToAdd = { ...newAddress, id, isDefault: addresses.length === 0 };

      await updateDoc(doc(db, 'users', user.uid), {
        addresses: [...addresses, addressToAdd],
      });

      setAddresses(prev => [...prev, addressToAdd]);
      setSelectedAddressId(id);
      setNewAddress(blankAddress);
      setAddingNew(false);
      setErrors({});
      toast({ title: 'Address added successfully!' });
      return addressToAdd; // return newly added address to use in order
    } catch (error) {
      toast({ title: 'Failed to add address', description: error.message, variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Razorpay load and handler
  const loadRazorpayScript = () =>
    new Promise((resolve, reject) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error('Razorpay SDK failed to load.'));
      document.body.appendChild(script);
    });

  const handleRazorpay = async (amount) => {
    await loadRazorpayScript();
    return new Promise((resolve, reject) => {
      const options = {
        key: 'rzp_test_cJphd4cqU1ois3', // Replace with your real key
        amount: amount * 100,
        currency: 'INR',
        name: 'Wishlist2Cart',
        description: 'Order Payment',
        handler: response => resolve(response.razorpay_payment_id),
        prefill: {
          name: user.displayName || '',
          email: user.email,
        },
        theme: { color: '#7c3aed' },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
      rzp.on('payment.failed', err => {
        toast({ title: 'Payment Failed', description: err.error?.description, variant: 'destructive' });
        reject(err);
      });
    });
  };

  const handleOrderSuccess = async (orderDetails, userEmail) => {
    try {
      await axios.post("http://localhost:3001/send-invoice", {
        order: orderDetails,
        email: userEmail,
      });
      console.log("✅ Invoice sent to:", userEmail);
    } catch (err) {
      console.error("❌ Error sending invoice:", err);
    }
  };

  const placeOrder = async () => {
    if (!user) {
      toast({
        title: 'Not logged in',
        description: 'Sign in to proceed.',
        variant: 'destructive',
      });
      return;
    }

    if (cartItems.length === 0) {
      toast({ title: 'Cart is empty', variant: 'destructive' });
      return;
    }

    let addressToUse = null;

    if (addingNew) {
      const newAddr = await addNewAddress();
      if (!newAddr) return;
      addressToUse = newAddr;
    } else {
      addressToUse = addresses.find(addr => addr.id === selectedAddressId);
    }

    if (!addressToUse) {
      toast({ title: 'Invalid address selected', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      const totalAmount = getTotalValue;  // getTotalValue is a number from useCart context
      let paymentId = 'COD';

      if (paymentMethod === 'razorpay') {
        paymentId = await handleRazorpay(totalAmount);
      }

      const orderDataToSave = {
        userId: user.uid,
        userName: user.displayName || user.email || 'Customer',
        items: cartItems,
        address: addressToUse,
        total: totalAmount,
        paymentId,
        paymentMethod,
        estimatedDelivery: new Date(Date.now() + 5 * 86400000),
        status: 'Processing',
        createdAt: serverTimestamp(),
      };

      // Save order to Firestore and get document ID
      const docRef = await addDoc(collection(db, 'orders'), orderDataToSave);

      // Build order data with ID
      const orderData = {
        ...orderDataToSave,
        id: docRef.id,
      };

      // Send invoice to user email
      await handleOrderSuccess(orderData, user.email);

      clearCart();
      toast({ title: 'Order placed successfully' });

      navigate('/order-success');
    } catch (error) {
      toast({
        title: 'Order failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

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
            {addresses.map(addr => (
              <div
                key={addr.id}
                onClick={() => setSelectedAddressId(addr.id)}
                className={`p-4 border-2 rounded cursor-pointer transition ${
                  selectedAddressId === addr.id ? 'border-violet-600 bg-violet-50' : 'border-gray-200 hover:border-violet-300'
                }`}
              >
                <p className="font-medium text-lg">{addr.fullName}</p>
                <p>{addr.streetAddress}, {addr.city}, {addr.postalCode}, {addr.country}</p>
                <p className="text-sm text-gray-600">Phone: {addr.phone || 'N/A'}</p>
                {addr.isDefault && (
                  <span className="inline-block mt-2 px-2 py-1 text-xs bg-violet-600 text-white rounded-full">Default Address</span>
                )}
              </div>
            ))}
            <Button onClick={() => setAddingNew(true)} disabled={loading}>+ Add New Address</Button>
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
              />
            ))}
            <Input placeholder="Phone (optional)" value={newAddress.phone} onChange={e => handleNewAddressChange('phone', e.target.value)} disabled={loading} />
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setAddingNew(false)} disabled={loading}>Cancel</Button>
              <Button onClick={addNewAddress} disabled={loading}>Save Address</Button>
            </div>
          </div>
        )}
      </section>

      {/* Payment Method Section */}
      <section className="space-y-4">
        <h2 className="font-semibold">Payment Method</h2>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" value="razorpay" checked={paymentMethod === 'razorpay'} onChange={() => setPaymentMethod('razorpay')} />
            Pay Online (UPI / Card / Netbanking)
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
            Cash on Delivery (COD)
          </label>
        </div>
      </section>

      <div className="text-sm text-gray-500">
        <strong>Estimated Delivery:</strong> {new Date(Date.now() + 5 * 86400000).toDateString()}
      </div>

      <Button size="lg" onClick={placeOrder} disabled={loading} className="w-full">
        {loading ? 'Placing Order...' : `Pay ₹${getTotalValue.toFixed(2)}`}
      </Button>
    </div>
  );
}
