import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  User,
  Mail,
  Bell,
  Home,
  Trash2,
} from 'lucide-react';

const defaultNotificationSettings = {
  priceDropAlerts: true,
  personalizedRecommendations: true,
  weeklyNewsletter: false,
};

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

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'notifications' | 'addresses'
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [notifications, setNotifications] = useState(defaultNotificationSettings);

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({ ...blankAddress });
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!user) return;
    const fetchUserSettings = async () => {
      setLoading(true);
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          setProfile({
            name: data.name || '',
            email: data.email || user.email || '',
          });
          setNotifications({
            priceDropAlerts: data.priceDropAlerts ?? defaultNotificationSettings.priceDropAlerts,
            personalizedRecommendations: data.personalizedRecommendations ?? defaultNotificationSettings.personalizedRecommendations,
            weeklyNewsletter: data.weeklyNewsletter ?? defaultNotificationSettings.weeklyNewsletter,
          });
          setAddresses(data.addresses || []);
        } else {
          setProfile({
            name: user.displayName || '',
            email: user.email || '',
          });
          setNotifications(defaultNotificationSettings);
          setAddresses([]);
        }
      } catch (error) {
        toast({
          title: 'Failed to load settings',
          description: error.message,
          variant: 'destructive',
        });
      }
      setLoading(false);
    };
    fetchUserSettings();
  }, [user, toast]);

  const handleSaveSettings = async e => {
    e.preventDefault();
    if (!user) {
      toast({ title: 'Not logged in', description: 'Please log in.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        name: profile.name,
        email: profile.email,
        priceDropAlerts: notifications.priceDropAlerts,
        personalizedRecommendations: notifications.personalizedRecommendations,
        weeklyNewsletter: notifications.weeklyNewsletter,
      }, { merge: true });
      toast({ title: 'Settings saved!' });
    } catch (e) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  const validateAddress = () => {
    const errs = {};
    if (!formData.fullName.trim()) errs.fullName = 'Full Name required';
    if (!formData.streetAddress.trim()) errs.streetAddress = 'Street Address required';
    if (!formData.city.trim()) errs.city = 'City required';
    if (!formData.postalCode.trim()) errs.postalCode = 'Postal Code required';
    if (!formData.country.trim()) errs.country = 'Country required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const startAddNewAddress = () => {
    setFormData({ ...blankAddress, id: Date.now().toString() });
    setIsAddingNew(true);
    setEditingAddress(null);
  };

  const startEditAddress = (address) => {
    setFormData({ ...address });
    setEditingAddress(address);
    setIsAddingNew(true);
  };

  const cancelForm = () => {
    setIsAddingNew(false);
    setEditingAddress(null);
    setFormData({ ...blankAddress });
    setErrors({});
  };

  const saveAddress = async () => {
    if (!validateAddress()) return;

    let newAddresses;
    if (editingAddress) {
      newAddresses = addresses.map(addr => (addr.id === editingAddress.id ? formData : addr));
    } else {
      newAddresses = [...addresses, formData];
    }

    if (!newAddresses.some(addr => addr.isDefault)) {
      newAddresses[0].isDefault = true;
    }

    setLoading(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { addresses: newAddresses });
      setAddresses(newAddresses);
      toast({ title: 'Address saved' });
      cancelForm();
      setActiveTab('addresses');
    } catch (e) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  const deleteAddress = async id => {
    if (!window.confirm('Delete this address?')) return;
    const newAddresses = addresses.filter(a => a.id !== id);
    if (!newAddresses.some(addr => addr.isDefault) && newAddresses.length > 0)
      newAddresses[0].isDefault = true;

    setLoading(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { addresses: newAddresses });
      setAddresses(newAddresses);
      toast({ title: 'Address deleted' });
      if (editingAddress?.id === id) cancelForm();
    } catch (e) {
      toast({ title: 'Delete failed', description: e.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  const setDefaultAddress = async id => {
    const newAddresses = addresses.map(addr => ({ ...addr, isDefault: addr.id === id }));

    setLoading(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { addresses: newAddresses });
      setAddresses(newAddresses);
      toast({ title: 'Default address updated' });
    } catch (e) {
      toast({ title: 'Update failed', description: e.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  if (loading) return <div className="container mx-auto py-20 text-center">Loading...</div>;
  if (!user) return <div className="container mx-auto py-20 text-center">Please log in to manage your settings.</div>;

  return (
    <>
      <Helmet>
        <title>Settings - Wishlist2Cart</title>
        <meta name="description" content="Manage your account, notifications, and address settings." />
      </Helmet>

      <motion.div
        className="container mx-auto max-w-4xl px-4 py-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >

        {/* Tabs */}
        <div className="flex space-x-6 border-b mb-8">
          <button
            className={`pb-2 ${activeTab === 'profile' ? 'border-b-2 border-violet-600 font-semibold' : 'text-gray-500'}`}
            onClick={() => setActiveTab('profile')}
          >Profile</button>
          <button
            className={`pb-2 ${activeTab === 'notifications' ? 'border-b-2 border-violet-600 font-semibold' : 'text-gray-500'}`}
            onClick={() => setActiveTab('notifications')}
          >Notifications</button>
          <button
            className={`pb-2 ${activeTab === 'addresses' ? 'border-b-2 border-violet-600 font-semibold' : 'text-gray-500'}`}
            onClick={() => setActiveTab('addresses')}
          >Addresses</button>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-8">
          {/* Profile */}
          {activeTab === 'profile' && (
            <section className="bg-white dark:bg-gray-950/30 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800">
              <h2 className="text-2xl font-semibold mb-6 flex items-center">
                <User className="mr-3 h-6 w-6 text-violet-500" /> Profile
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" type="text" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} className="pl-10" required disabled={loading} />
                  <User className="absolute left-3 top-9 h-5 w-5 text-gray-400" />
                </div>
                <div className="relative">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} className="pl-10" required disabled={loading} />
                  <Mail className="absolute left-3 top-9 h-5 w-5 text-gray-400" />
                </div>
              </div>
            </section>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <section className="bg-white dark:bg-gray-950/30 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800">
              <h2 className="text-2xl font-semibold mb-6 flex items-center">
                <Bell className="mr-3 h-6 w-6 text-violet-500" /> Notifications
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="price-drop">Price Drop Alerts</Label>
                  <input id="price-drop" type="checkbox" className="h-5 w-5" checked={notifications.priceDropAlerts} onChange={() => setNotifications(prev => ({ ...prev, priceDropAlerts: !prev.priceDropAlerts }))} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="recommendations">Personalized Recommendations</Label>
                  <input id="recommendations" type="checkbox" className="h-5 w-5" checked={notifications.personalizedRecommendations} onChange={() => setNotifications(prev => ({ ...prev, personalizedRecommendations: !prev.personalizedRecommendations }))} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="newsletter">Weekly Newsletter</Label>
                  <input id="newsletter" type="checkbox" className="h-5 w-5" checked={notifications.weeklyNewsletter} onChange={() => setNotifications(prev => ({ ...prev, weeklyNewsletter: !prev.weeklyNewsletter }))} />
                </div>
              </div>
            </section>
          )}

          {/* Addresses */}
          {activeTab === 'addresses' && (
            <section className="bg-white dark:bg-gray-950/30 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold flex items-center"><Home className="mr-3 h-6 w-6 text-violet-500" /> Your Addresses</h2>
                {!isAddingNew && (
                  <Button
                    onClick={startAddNewAddress}
                    size="sm"
                    variant="primary" // Ensures blue color button consistent with Shadcn/UI convention
                  >+ Add New</Button>
                )}
              </div>

              {addresses.length === 0 && !isAddingNew && (
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  No saved addresses found. Click "+ Add New" to add one.
                </p>
              )}

              {isAddingNew && (
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-4">{editingAddress ? 'Edit Address' : 'Add New Address'}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="relative">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input id="fullName" value={formData.fullName} onChange={e => setFormData(prev => ({ ...prev, fullName: e.target.value }))} required disabled={loading} />
                      {errors.fullName && <p className="text-red-500 text-xs">{errors.fullName}</p>}
                    </div>
                    <div className="relative">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" value={formData.phone} onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))} disabled={loading} placeholder="Optional" />
                    </div>
                    <div className="relative md:col-span-2">
                      <Label htmlFor="streetAddress">Street Address</Label>
                      <Input id="streetAddress" value={formData.streetAddress} onChange={e => setFormData(prev => ({ ...prev, streetAddress: e.target.value }))} required disabled={loading} />
                      {errors.streetAddress && <p className="text-red-500 text-xs">{errors.streetAddress}</p>}
                    </div>
                    <div className="relative">
                      <Label htmlFor="city">City</Label>
                      <Input id="city" value={formData.city} onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))} required disabled={loading} />
                      {errors.city && <p className="text-red-500 text-xs">{errors.city}</p>}
                    </div>
                    <div className="relative">
                      <Label htmlFor="postalCode">Postal Code</Label>
                      <Input id="postalCode" value={formData.postalCode} onChange={e => setFormData(prev => ({ ...prev, postalCode: e.target.value }))} required disabled={loading} />
                      {errors.postalCode && <p className="text-red-500 text-xs">{errors.postalCode}</p>}
                    </div>
                    <div className="relative">
                      <Label htmlFor="country">Country</Label>
                      <Input id="country" value={formData.country} onChange={e => setFormData(prev => ({ ...prev, country: e.target.value }))} required disabled={loading} />
                      {errors.country && <p className="text-red-500 text-xs">{errors.country}</p>}
                    </div>
                  </div>

                  <div className="mt-6 flex space-x-2">
  <Button
    type="button"
    variant="default"
    className="bg-violet-600 hover:bg-violet-700 text-white"
    onClick={saveAddress}
    disabled={loading}
  >
    {editingAddress ? 'Update Address' : 'Save Address'}
  </Button>
  <Button
    type="button"
    variant="ghost"
    onClick={cancelForm}
    disabled={loading}
  >
    Cancel
  </Button>
</div>

                </div>
              )}

              {!isAddingNew && (
                <div className="space-y-4">
                  {addresses.map(address => (
                    <div key={address.id} className="border border-gray-300 dark:border-gray-700 rounded p-4 flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{address.fullName}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
                          {address.streetAddress}, {address.city}, {address.postalCode}, {address.country}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Phone: {address.phone || 'N/A'}</p>
                        {address.isDefault && <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-violet-600 text-white rounded">Default</span>}
                      </div>
                      <div className="flex items-center space-x-2">
                        {!address.isDefault && (
                          <Button variant="outline" size="sm" onClick={() => setDefaultAddress(address.id)}>
                            Set Default
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => startEditAddress(address)} aria-label={`Edit address for ${address.fullName}`}>
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => deleteAddress(address.id)} aria-label={`Delete address for ${address.fullName}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {(activeTab === 'profile' || activeTab === 'notifications') && (
            <div className="flex justify-end">
              <Button type="submit" size="lg" disabled={loading}>
                Save
              </Button>
            </div>
          )}
        </form>
      </motion.div>
    </>
  );
}
