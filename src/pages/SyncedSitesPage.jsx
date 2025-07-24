import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Link, PlusCircle, Trash2 } from 'lucide-react';

const syncedSites = [
  { id: 1, name: "Amazon", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg", items: 12 },
  { id: 2, name: "Flipkart", logo: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Flipkart_logo_vector.svg", items: 5 },
  { id: 3, name: "Myntra", logo: "https://upload.wikimedia.org/wikipedia/commons/d/d5/Myntra_logo.svg", items: 8 },
];

const SyncedSitesPage = () => {
  const { toast } = useToast();

  const handleUnlink = (siteName) => {
    toast({
      title: `${siteName} Unlinked`,
      description: `You have successfully unlinked your ${siteName} account.`,
      variant: "destructive",
    });
  };

  return (
    <>
      <Helmet>
        <title>Synced Sites - Wishlist2Cart</title>
        <meta name="description" content="Manage your synced e-commerce accounts to automatically import wishlists." />
      </Helmet>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto max-w-4xl px-4 py-12"
      >
        <div className="flex justify-between items-center mb-10">
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-bold tracking-tight">Synced Sites</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">Manage your connected store accounts.</p>
          </div>
          <Button onClick={() => toast({ title: "Feature Not Implemented" })}>
            <PlusCircle className="mr-2 h-5 w-5" /> Sync New Site
          </Button>
        </div>

        <div className="space-y-4">
          {syncedSites.map((site, index) => (
            <motion.div
              key={site.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="p-4 rounded-2xl bg-white dark:bg-gray-800/50 shadow-md border border-gray-200 dark:border-gray-800 flex items-center gap-4"
            >
              <div className="w-16 h-16 bg-white rounded-lg flex-shrink-0 flex items-center justify-center p-2">
                <img src={site.logo} alt={`${site.name} logo`} className="max-h-full max-w-full object-contain" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{site.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{site.items} items in wishlist</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => toast({ title: "Feature Not Implemented" })}>
                  <Link className="mr-2 h-4 w-4" /> Resync
                </Button>
                <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30" onClick={() => handleUnlink(site.name)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Unlink
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </>
  );
};

export default SyncedSitesPage;