import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import {
  User,
  Mail,
  Bell,
  Home,
  Trash2,
  LogOut,
} from "lucide-react";

const defaultNotificationSettings = {
  priceDropAlerts: true,
  personalizedRecommendations: true,
  weeklyNewsletter: false,
};

const blankAddress = {
  id: null,
  fullName: "",
  streetAddress: "",
  city: "",
  postalCode: "",
  country: "",
  phone: "",
  isDefault: false,
};

export default function Settings() {
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("profile"); // 'profile' | 'notifications' | 'addresses'
  const [profile, setProfile] = useState({ name: "", email: "" });
  const [notifications, setNotifications] = useState(defaultNotificationSettings);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState(blankAddress);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!user) return;

    const fetchUserSettings = async () => {
      setLoading(true);
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          setProfile({
            name: data.name || "",
            email: data.email || user.email || "",
          });
          setNotifications({
            priceDropAlerts:
              data.priceDropAlerts ?? defaultNotificationSettings.priceDropAlerts,
            personalizedRecommendations:
              data.personalizedRecommendations ??
              defaultNotificationSettings.personalizedRecommendations,
            weeklyNewsletter:
              data.weeklyNewsletter ?? defaultNotificationSettings.weeklyNewsletter,
          });
          setAddresses(data.addresses || []);
        } else {
          setProfile({
            name: user.displayName || "",
            email: user.email || "",
          });
          setNotifications(defaultNotificationSettings);
          setAddresses([]);
        }
      } catch (error) {
        toast({
          title: "Failed to load settings",
          description: error.message,
          variant: "destructive",
        });
      }
      setLoading(false);
    };

    fetchUserSettings();
  }, [user, toast]);

  const handleSaveProfileAndNotifications = async (e) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Not logged in", description: "Please log in.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(
        userDocRef,
        {
          name: profile.name,
          email: profile.email,
          priceDropAlerts: notifications.priceDropAlerts,
          personalizedRecommendations: notifications.personalizedRecommendations,
          weeklyNewsletter: notifications.weeklyNewsletter,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      toast({ title: "Settings saved!" });
    } catch (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const handleLogoutClick = () => {
    logout();
    toast({ title: "Logged out", description: "You have been logged out." });
  };

  const handleProfileChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleNotificationChange = (field) => {
    setNotifications((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleAddressChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateAddress = () => {
    const errs = {};
    if (!formData.fullName.trim()) errs.fullName = "Full Name required";
    if (!formData.streetAddress.trim()) errs.streetAddress = "Street Address required";
    if (!formData.city.trim()) errs.city = "City required";
    if (!formData.postalCode.trim()) errs.postalCode = "Postal Code required";
    if (!formData.country.trim()) errs.country = "Country required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const startAddNewAddress = () => {
    setFormData({ ...blankAddress, id: Date.now().toString() });
    setIsAddingNew(true);
    setEditingAddress(null);
  };

  const startEditAddress = (address) => {
    setFormData(address);
    setEditingAddress(address);
    setIsAddingNew(true);
  };

  const cancelAddressForm = () => {
    setFormData(blankAddress);
    setIsAddingNew(false);
    setEditingAddress(null);
    setErrors({});
  };

  const saveAddress = async () => {
    if (!validateAddress()) return;

    let updatedAddresses;
    if (editingAddress) {
      updatedAddresses = addresses.map((a) => (a.id === editingAddress.id ? formData : a));
    } else {
      updatedAddresses = [...addresses, formData];
    }

    if (!updatedAddresses.some((addr) => addr.isDefault) && updatedAddresses.length > 0) {
      updatedAddresses[0].isDefault = true;
    }

    setLoading(true);
    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, { addresses: updatedAddresses });
      setAddresses(updatedAddresses);
      toast({ title: "Address saved" });
      cancelAddressForm();
      setActiveTab("addresses");
    } catch (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const deleteAddress = async (id) => {
    if (!window.confirm("Are you sure you want to delete this address?")) return;

    const updatedAddresses = addresses.filter((a) => a.id !== id);

    if (!updatedAddresses.some((addr) => addr.isDefault) && updatedAddresses.length > 0) {
      updatedAddresses[0].isDefault = true;
    }

    setLoading(true);
    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, { addresses: updatedAddresses });
      setAddresses(updatedAddresses);
      toast({ title: "Address deleted" });
      if (editingAddress?.id === id) {
        cancelAddressForm();
      }
    } catch (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const setDefaultAddress = async (id) => {
    const updatedAddresses = addresses.map((addr) => ({
      ...addr,
      isDefault: addr.id === id,
    }));

    setLoading(true);
    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, { addresses: updatedAddresses });
      setAddresses(updatedAddresses);
      toast({ title: "Default address updated" });
    } catch (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  };

  if (loading) return <div className="container mx-auto py-20 text-center">Loading...</div>;
  if (!user) return <div className="container mx-auto py-20 text-center">Please log in to manage your settings.</div>;

  return (
    <>
      <Helmet>
        <title>Settings - Wishlist</title>
        <meta name="description" content="Manage your profile, notifications, and addresses." />
      </Helmet>

      <motion.div
        className="container mx-auto max-w-5xl px-4 py-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Tabs */}
        <div className="flex flex-wrap gap-4 border-b border-gray-300 dark:border-gray-700 mb-8">
          <button
            className={`px-4 py-2 rounded-t-md font-semibold ${
              activeTab === "profile"
                ? "border-b-2 border-violet-600 text-violet-600"
                : "text-gray-500 hover:text-violet-600"
            }`}
            onClick={() => setActiveTab("profile")}
            type="button"
          >
            Profile
          </button>
          <button
            className={`px-4 py-2 rounded-t-md font-semibold ${
              activeTab === "notifications"
                ? "border-b-2 border-violet-600 text-violet-600"
                : "text-gray-500 hover:text-violet-600"
            }`}
            onClick={() => setActiveTab("notifications")}
            type="button"
          >
            Notifications
          </button>
          <button
            className={`px-4 py-2 rounded-t-md font-semibold ${
              activeTab === "addresses"
                ? "border-b-2 border-violet-600 text-violet-600"
                : "text-gray-500 hover:text-violet-600"
            }`}
            onClick={() => setActiveTab("addresses")}
            type="button"
          >
            Addresses
          </button>
        </div>

        <form onSubmit={handleSaveProfileAndNotifications} className="space-y-8">
          {activeTab === "profile" && (
            <section className="bg-white dark:bg-gray-900/40 rounded-xl shadow p-6 border border-gray-300 dark:border-gray-700">
              <h2 className="flex items-center gap-2 text-xl font-semibold mb-6">
                <User className="text-violet-600" />
                Profile Settings
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => handleProfileChange("name", e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => handleProfileChange("email", e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  aria-label="Logout"
                  className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
                  onClick={logout}
                  disabled={loading}
                >
                  <LogOut className="inline-block mr-2 h-5 w-5" /> Logout
                </Button>
              </div>
            </section>
          )}
          {activeTab === "notifications" && (
            <section className="bg-white dark:bg-gray-900/40 rounded-xl shadow p-6 border border-gray-300 dark:border-gray-700">
              <h2 className="flex items-center gap-2 text-xl font-semibold mb-6">
                <Bell className="text-violet-600" />
                Notifications
              </h2>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label htmlFor="priceDropAlerts">Price Drop Alerts</Label>
                  <input
                    id="priceDropAlerts"
                    type="checkbox"
                    checked={notifications.priceDropAlerts}
                    onChange={() => handleNotificationChange("priceDropAlerts")}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <Label htmlFor="personalizedRecommendations">Personalized Recommendations</Label>
                  <input
                    id="personalizedRecommendations"
                    type="checkbox"
                    checked={notifications.personalizedRecommendations}
                    onChange={() => handleNotificationChange("personalizedRecommendations")}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <Label htmlFor="weeklyNewsletter">Weekly Newsletter</Label>
                  <input
                    id="weeklyNewsletter"
                    type="checkbox"
                    checked={notifications.weeklyNewsletter}
                    onChange={() => handleNotificationChange("weeklyNewsletter")}
                  />
                </div>
              </div>
            </section>
          )}
          {activeTab === "addresses" && (
            <section className="bg-white dark:bg-gray-900/40 rounded-xl shadow p-6 border border-gray-300 dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="flex items-center gap-2 text-xl font-semibold">
                  <Home className="text-violet-600" />
                  Addresses
                </h2>
                {!isAddingNew && (
                  <Button variant="primary" onClick={() => setIsAddingNew(true)} disabled={loading}>
                    + Add New
                  </Button>
                )}
              </div>

              {isAddingNew ? (
                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => handleAddressChange("fullName", e.target.value)}
                        disabled={loading}
                      />
                      {errors.fullName && <p className="text-red-600 text-sm">{errors.fullName}</p>}
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleAddressChange("phone", e.target.value)}
                        placeholder="Optional"
                        disabled={loading}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="streetAddress">Street Address</Label>
                      <Input
                        id="streetAddress"
                        value={formData.streetAddress}
                        onChange={(e) => handleAddressChange("streetAddress", e.target.value)}
                        disabled={loading}
                      />
                      {errors.streetAddress && (
                        <p className="text-red-600 text-sm">{errors.streetAddress}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleAddressChange("city", e.target.value)}
                        disabled={loading}
                      />
                      {errors.city && <p className="text-red-600 text-sm">{errors.city}</p>}
                    </div>
                    <div>
                      <Label htmlFor="postalCode">Postal Code</Label>
                      <Input
                        id="postalCode"
                        value={formData.postalCode}
                        onChange={(e) => handleAddressChange("postalCode", e.target.value)}
                        disabled={loading}
                      />
                      {errors.postalCode && (
                        <p className="text-red-600 text-sm">{errors.postalCode}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={formData.country}
                        onChange={(e) => handleAddressChange("country", e.target.value)}
                        disabled={loading}
                      />
                      {errors.country && <p className="text-red-600 text-sm">{errors.country}</p>}
                    </div>
                  </div>
                  <div className="flex gap-4 mt-4">
                    <Button variant="primary" onClick={saveAddress} disabled={loading}>
                      {editingAddress ? "Update Address" : "Save Address"}
                    </Button>
                    <Button variant="outline" onClick={() => { setIsAddingNew(false); setEditingAddress(null); setFormData(blankAddress); setErrors({}); }} disabled={loading}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : addresses.length === 0 ? (
                <p>No saved addresses. Click "+ Add New" to add one.</p>
              ) : (
                addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="border border-gray-300 dark:border-gray-700 rounded p-4 mb-4 flex justify-between items-center"
                    role="region"
                    aria-label={`Address of ${addr.fullName}`}
                  >
                    <div>
                      <p className="font-semibold">{addr.fullName}</p>
                      <p>
                        {addr.streetAddress}, {addr.city}, {addr.postalCode}, {addr.country}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Phone: {addr.phone || "N/A"}
                      </p>
                      {addr.isDefault && (
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-violet-600 text-white rounded">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {!addr.isDefault && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setDefaultAddress(addr.id);
                          }}
                        >
                          Set Default
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          startEditAddress(addr);
                        }}
                        aria-label={`Edit address for ${addr.fullName}`}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteAddress(addr.id)}
                        aria-label={`Delete address for ${addr.fullName}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </section>
          )}
        </form>
        </motion.div>
      </>
  );
}
