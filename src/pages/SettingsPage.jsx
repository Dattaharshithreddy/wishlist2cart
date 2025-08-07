import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import Navbar from "@/components/Navbar";
import {
  User,
  Bell,
  Home,
  Trash2,
  LogOut,
} from "lucide-react";
import { useRewards } from "../contexts/RewardContext";

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
  const { coupons } = useRewards();

  const [activeTab, setActiveTab] = useState("profile"); // 'profile' | 'notifications' | 'addresses' | 'coupons'
  const [profile, setProfile] = useState({ name: "", email: "" });
  const [notifications, setNotifications] = useState(defaultNotificationSettings);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Address form states
  const [formData, setFormData] = useState(blankAddress);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [errors, setErrors] = useState({});

  const fetchCityStateFromPin = async (pinCode) => {
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pinCode}`);
      const data = await res.json();

      if (data[0].Status === "Success" && data[0].PostOffice?.length > 0) {
        const postOffice = data[0].PostOffice[0];
        setFormData((prev) => ({
          ...prev,
          city: postOffice.District,
          country: "India",
        }));
      } else {
        toast({
          title: "Invalid PIN code",
          description: "No matching location found.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Network Error",
        description: "Could not fetch city for PIN.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!user) return;

    async function fetchUserSettings() {
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
    }

    fetchUserSettings();
  }, [user, toast]);

  // -------- Profile & Notifications Handlers --------

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

  // -------- Address Handlers --------

  const handleAddressChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));

    if (field === "postalCode" && val.length === 6 && /^[1-9][0-9]{5}$/.test(val)) {
      fetchCityStateFromPin(val);
    }

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateAddress = () => {
    const errs = {};

    if (!formData.fullName.trim()) errs.fullName = "Full Name required";
    if (!formData.streetAddress.trim()) errs.streetAddress = "Street Address required";
    if (!formData.city.trim()) errs.city = "City required";

    if (!formData.postalCode.trim()) {
      errs.postalCode = "Postal Code required";
    } else if (!/^[1-9][0-9]{5}$/.test(formData.postalCode)) {
      errs.postalCode = "Enter a valid 6-digit Indian PIN code";
    }

    if (!formData.country.trim()) errs.country = "Country required";

    if (!formData.phone.trim()) {
      errs.phone = "Phone number is required";
    } else if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      errs.phone = "Enter a valid 10-digit Indian phone number";
    }

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

  // -------- Coupons Helpers --------
  const formatDate = (date) => {
    if (!date) return "N/A";
    let dt = date;
    if (typeof date === "object" && date.toDate) {
      dt = date.toDate();
    }
    if (typeof dt === "string") {
      dt = new Date(dt);
    }
    return dt.toLocaleDateString();
  };

  // Render loading or login prompt
  if (loading)
    return (
      <div className="container mx-auto py-20 text-center">
        Loading...
      </div>
    );
  if (!user)
    return (
      <div className="container mx-auto py-20 text-center">
        Please log in to manage your settings.
      </div>
    );

  return (
    <>
      <Helmet>
        <title>Settings - Wishlist</title>
        <meta name="description" content="Manage your profile, notifications, addresses, and coupons." />
      </Helmet>

      <Navbar />

      <motion.div
        className="container mx-auto max-w-5xl px-4 py-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Tabs */}
        <div className="flex flex-wrap gap-4 border-b border-gray-300 dark:border-gray-700 mb-8 overflow-x-auto no-scrollbar">
          {["profile", "notifications", "addresses", "coupons"].map((tab) => (
            <button
              key={tab}
              className={`px-4 py-2 rounded-t-md font-semibold whitespace-nowrap ${
                activeTab === tab
                  ? "border-b-2 border-violet-600 text-violet-600"
                  : "text-gray-500 hover:text-violet-600"
              }`}
              onClick={() => setActiveTab(tab)}
              type="button"
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <form onSubmit={handleSaveProfileAndNotifications} className="space-y-8">
          {/* Profile Tab */}
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
                    className="bg-white text-black dark:bg-gray-900 dark:text-white dark:placeholder-gray-400"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-black dark:text-white">Email Address</Label>
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
              <div className="mt-6 flex justify-start flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  aria-label="Logout"
                  className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white min-w-[120px]"
                  onClick={handleLogoutClick}
                  disabled={loading}
                >
                  <LogOut className="inline-block mr-2 h-5 w-5" /> Logout
                </Button>
              </div>
            </section>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <section className="bg-white dark:bg-gray-900/40 rounded-xl shadow p-6 border border-gray-300 dark:border-gray-700">
              <h2 className="flex items-center gap-2 text-xl font-semibold mb-6">
                <Bell className="text-violet-600" />
                Notifications
              </h2>
              <div className="space-y-4 max-w-md">
                {["priceDropAlerts", "personalizedRecommendations", "weeklyNewsletter"].map((key) => (
                  <div key={key} className="flex justify-between items-center">
                    <Label htmlFor={key}>
                      {key === "priceDropAlerts" && "Price Drop Alerts"}
                      {key === "personalizedRecommendations" && "Personalized Recommendations"}
                      {key === "weeklyNewsletter" && "Weekly Newsletter"}
                    </Label>
                    <input
                      id={key}
                      type="checkbox"
                      className={key === "weeklyNewsletter" ? "accent-violet-600 dark:accent-violet-400" : undefined}
                      checked={notifications[key]}
                      onChange={() => handleNotificationChange(key)}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Addresses Tab */}
          {activeTab === "addresses" && (
            <section className="bg-white dark:bg-gray-900/40 rounded-xl shadow p-6 border border-gray-300 dark:border-gray-700 max-w-full">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
                <h2 className="flex items-center gap-2 text-xl font-semibold">
                  <Home className="text-violet-600" />
                  Addresses
                </h2>
                {!isAddingNew && (
                  <Button variant="primary" onClick={startAddNewAddress} disabled={loading} className="whitespace-nowrap">
                    + Add New
                  </Button>
                )}
              </div>

              {isAddingNew ? (
                <div className="space-y-4 mb-6 max-w-full">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => handleAddressChange("fullName", e.target.value)}
                        disabled={loading}
                      />
                      {errors.fullName && <p className="text-red-600 dark:text-red-400 text-sm">{errors.fullName}</p>}
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
                      {errors.phone && <p className="text-red-600 dark:text-red-400 text-sm">{errors.phone}</p>}
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="streetAddress">Street Address</Label>
                      <Input
                        id="streetAddress"
                        value={formData.streetAddress}
                        onChange={(e) => handleAddressChange("streetAddress", e.target.value)}
                        disabled={loading}
                      />
                      {errors.streetAddress && <p className="text-red-600 text-sm">{errors.streetAddress}</p>}
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
                      {errors.postalCode && <p className="text-red-600 text-sm">{errors.postalCode}</p>}
                    </div>
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <select
                        id="country"
                        className="w-full border border-gray-300 text-black bg-white dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-900 dark:text-white dark:placeholder-gray-400"
                        value={formData.country}
                        onChange={(e) => handleAddressChange("country", e.target.value)}
                        disabled={loading}
                      >
                        <option value="">Select Country</option>
                        <option value="India">India</option>
                      </select>
                      {errors.country && <p className="text-red-600 text-sm">{errors.country}</p>}
                    </div>
                  </div>
                  <div className="flex gap-4 flex-wrap mt-4">
                    <Button variant="primary" onClick={saveAddress} disabled={loading} className="min-w-[140px]">
                      {editingAddress ? "Update Address" : "Save Address"}
                    </Button>
                    <Button
                      onClick={cancelAddressForm}
                      disabled={loading}
                      className="border border-gray-400 text-gray-800 hover:bg-gray-100 dark:border-gray-600 dark:text-white dark:hover:bg-gray-800 min-w-[100px]"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : addresses.length === 0 ? (
                <p>No saved addresses. Click "+ Add New" to add one.</p>
              ) : (
                <div className="max-h-[400px] overflow-auto space-y-4 pr-2">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="border border-gray-300 dark:border-gray-700 rounded p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center"
                      role="region"
                      aria-label={`Address of ${addr.fullName}`}
                    >
                      <div className="mb-4 sm:mb-0">
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
                      <div className="flex items-center space-x-2 flex-wrap gap-2 sm:gap-0">
                        {!addr.isDefault && (
                          <Button
                            size="sm"
                            onClick={() => setDefaultAddress(addr.id)}
                            className="border border-gray-400 text-gray-800 hover:bg-gray-100 dark:border-gray-600 dark:text-white dark:hover:bg-gray-800 whitespace-nowrap"
                          >
                            Set Default
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditAddress(addr)}
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
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Coupons Tab */}
          {activeTab === "coupons" && (
            <section className="bg-white dark:bg-gray-900/40 rounded-xl shadow p-6 border border-gray-300 dark:border-gray-700 max-w-full">
              <h2 className="flex items-center gap-2 text-xl font-semibold mb-6 text-violet-600">
                Your Coupons
              </h2>

              {coupons.length === 0 ? (
                <p>You have no available coupons earned yet.</p>
              ) : (
                <ul className="space-y-4 max-h-[400px] overflow-auto pr-2">
                  {coupons.map((coupon) => (
                    <li
                      key={coupon.id}
                      className={`p-4 rounded border ${
                        coupon.used
                          ? "bg-gray-200 dark:bg-gray-700 border-gray-400 dark:border-gray-600 line-through opacity-60"
                          : "bg-violet-50 dark:bg-violet-900 border-violet-300 dark:border-violet-700"
                      } flex flex-col sm:flex-row justify-between items-start sm:items-center`}
                    >
                      <div className="mb-4 sm:mb-0">
                        <p className="font-semibold text-lg">{coupon.code || "COUPON CODE"}</p>
                        <p>
                          ₹{coupon.value} off{" "}
                          {coupon.expiry
                            ? `(Expires: ${new Date(coupon.expiry).toLocaleDateString()})`
                            : ""}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(coupon.code);
                          toast({ title: "Coupon code copied to clipboard!" });
                        }}
                        disabled={coupon.used}
                        className={`px-3 py-1 rounded bg-violet-600 text-white font-semibold hover:bg-violet-700 transition min-w-[80px] text-center ${
                          coupon.used ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        aria-label={`Copy coupon code ${coupon.code || coupon.id}`}
                      >
                        Copy
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {(activeTab === "profile" || activeTab === "notifications") && (
            <div className="mt-6 flex justify-start">
              <Button type="submit" disabled={loading} className="min-w-[140px]">
                Save Changes
              </Button>
            </div>
          )}
        </form>
      </motion.div>

      <style jsx>{`
        /* Make containers max width 100% on small screens */
        @media (max-width: 640px) {
          .container {
            padding-left: 1rem !important;
            padding-right: 1rem !important;
          }
          form > section {
            padding: 1rem !important;
          }
          .grid {
            grid-template-columns: 1fr !important;
          }
          /* Tabs scroll horizontally on small width */
          .flex.flex-wrap {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
          .flex.flex-wrap button {
            flex-shrink: 0;
          }
        }
      `}</style>
    </>
  );
}
