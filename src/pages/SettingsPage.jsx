import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Bell, CreditCard, Shield } from 'lucide-react';

const SettingsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSave = (e) => {
    e.preventDefault();
    toast({
      title: "Settings Saved!",
      description: "Your changes have been saved successfully.",
    });
  };

  return (
    <>
      <Helmet>
        <title>Settings - Wishlist2Cart</title>
        <meta name="description" content="Manage your account settings, notifications, and payment methods." />
      </Helmet>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto max-w-4xl px-4 py-12"
      >
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight">Settings</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">Manage your account and preferences.</p>
        </div>

        <div className="space-y-8">
          {/* Profile Settings */}
          <div className="bg-white dark:bg-gray-950/30 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800">
            <h2 className="text-2xl font-semibold mb-6 flex items-center"><User className="mr-3 h-6 w-6 text-violet-500" /> Profile</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" type="text" defaultValue={user?.name} className="pl-10" />
                  <User className="absolute left-3 top-9 h-5 w-5 text-gray-400" />
                </div>
                <div className="relative">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" defaultValue={user?.email} className="pl-10" />
                  <Mail className="absolute left-3 top-9 h-5 w-5 text-gray-400" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </div>

          {/* Notification Settings */}
          <div className="bg-white dark:bg-gray-950/30 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800">
            <h2 className="text-2xl font-semibold mb-6 flex items-center"><Bell className="mr-3 h-6 w-6 text-violet-500" /> Notifications</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="price-drop">Price Drop Alerts</Label>
                <Input type="checkbox" id="price-drop" className="h-5 w-5" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="recommendations">Personalized Recommendations</Label>
                <Input type="checkbox" id="recommendations" className="h-5 w-5" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="newsletter">Weekly Newsletter</Label>
                <Input type="checkbox" id="newsletter" className="h-5 w-5" />
              </div>
              <div className="flex justify-end mt-4">
                <Button onClick={() => toast({ title: "Notifications settings saved!" })}>Save Notifications</Button>
              </div>
            </div>
          </div>

          {/* Payment Settings */}
          <div className="bg-white dark:bg-gray-950/30 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800">
            <h2 className="text-2xl font-semibold mb-6 flex items-center"><CreditCard className="mr-3 h-6 w-6 text-violet-500" /> Payment Methods</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">No payment methods saved.</p>
            <Button variant="outline" onClick={() => toast({ title: "Feature Not Implemented" })}>Add Payment Method</Button>
          </div>

          {/* Security Settings */}
          <div className="bg-white dark:bg-gray-950/30 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800">
            <h2 className="text-2xl font-semibold mb-6 flex items-center"><Shield className="mr-3 h-6 w-6 text-violet-500" /> Security</h2>
            <Button variant="outline" onClick={() => toast({ title: "Feature Not Implemented" })}>Change Password</Button>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default SettingsPage;