// src/components/ui/sheet/index.jsx
import * as Dialog from '@radix-ui/react-dialog';
import { forwardRef } from 'react';
import clsx from 'clsx';

// Sheet root is Dialog.Root
export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;

// SheetClose simply uses Dialog.Close
export const SheetClose = Dialog.Close;

// SheetContent with slide-in animation from right and basic styling
export const SheetContent = forwardRef(({ className, children, ...props }, ref) => (
  <Dialog.Portal>
    {/* Overlay */}
    <Dialog.Overlay 
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity" 
    />
    {/* Content */}
    <Dialog.Content
      ref={ref}
      className={clsx(
        "fixed top-0 right-0 h-full w-[300px] max-w-full bg-white dark:bg-gray-900 shadow-lg p-6 overflow-auto transition-transform animate-slide-in",
        className
      )}
      {...props}
    >
      {children}
    </Dialog.Content>
  </Dialog.Portal>
));
SheetContent.displayName = 'SheetContent';
