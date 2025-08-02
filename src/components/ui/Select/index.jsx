import * as RadixSelect from '@radix-ui/react-select';
import { forwardRef } from 'react';
import clsx from 'clsx';

// Export the root Radix Select as Select
export const Select = RadixSelect.Root;

// Select Trigger (the toggle button)
export const SelectTrigger = forwardRef(({ className, children, ...props }, ref) => (
  <RadixSelect.Trigger
    ref={ref}
    className={clsx(
      "inline-flex items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white",
      className
    )}
    {...props}
  >
    {children}
  </RadixSelect.Trigger>
));
SelectTrigger.displayName = 'SelectTrigger';

// Select Value (displays selected item text)
export const SelectValue = RadixSelect.Value;

// Select Content (dropdown panel), with overlay and portal
export const SelectContent = forwardRef(({ className, children, ...props }, ref) => (
  <RadixSelect.Portal>
    <RadixSelect.Overlay className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm" />
    <RadixSelect.Content
      ref={ref}
      className={clsx(
        "z-50 overflow-hidden rounded-md border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800",
        className
      )}
      {...props}
    >
      <RadixSelect.Viewport className="p-1">{children}</RadixSelect.Viewport>
    </RadixSelect.Content>
  </RadixSelect.Portal>
));
SelectContent.displayName = 'SelectContent';

// Individual item in the dropdown
export const SelectItem = forwardRef(({ className, children, ...props }, ref) => (
  <RadixSelect.Item
    ref={ref}
    className={clsx(
      "relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none focus:bg-blue-500 focus:text-white data-[highlighted]:bg-blue-500 data-[highlighted]:text-white dark:text-gray-300 dark:data-[highlighted]:bg-blue-600",
      className
    )}
    {...props}
  >
    <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
  </RadixSelect.Item>
));
SelectItem.displayName = 'SelectItem';
