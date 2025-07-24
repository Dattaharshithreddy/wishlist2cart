
import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Twitter, Github, Linkedin } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const Footer = () => {
  const { toast } = useToast();

  const showToast = () => {
    toast({
      title: "Feature Not Implemented",
      description: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
    });
  };

  return (
    <footer className="bg-gray-100 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex flex-col items-start">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-blue-500 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-blue-600 dark:from-violet-400 dark:to-blue-400">
                Wishlist2Cart
              </span>
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400">Transform Your Desires Into Deliveries.</p>
          </div>
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Company</p>
            <ul className="space-y-2">
              <li><button onClick={showToast} className="text-sm text-gray-500 dark:text-gray-400 hover:text-violet-500 transition-colors">About</button></li>
              <li><button onClick={showToast} className="text-sm text-gray-500 dark:text-gray-400 hover:text-violet-500 transition-colors">Contact</button></li>
              <li><button onClick={showToast} className="text-sm text-gray-500 dark:text-gray-400 hover:text-violet-500 transition-colors">Careers</button></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Legal</p>
            <ul className="space-y-2">
              <li><button onClick={showToast} className="text-sm text-gray-500 dark:text-gray-400 hover:text-violet-500 transition-colors">Privacy Policy</button></li>
              <li><button onClick={showToast} className="text-sm text-gray-500 dark:text-gray-400 hover:text-violet-500 transition-colors">Terms of Service</button></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Follow Us</p>
            <div className="flex space-x-4">
              <button onClick={showToast} className="text-gray-500 dark:text-gray-400 hover:text-violet-500 transition-colors"><Twitter size={20} /></button>
              <button onClick={showToast} className="text-gray-500 dark:text-gray-400 hover:text-violet-500 transition-colors"><Github size={20} /></button>
              <button onClick={showToast} className="text-gray-500 dark:text-gray-400 hover:text-violet-500 transition-colors"><Linkedin size={20} /></button>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 dark:border-gray-800 pt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">&copy; {new Date().getFullYear()} Wishlist2Cart. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
  