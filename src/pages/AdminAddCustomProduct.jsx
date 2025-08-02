import React, { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "../lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

function isAdmin(user) {
  // TODO: Replace with your real admin check
 // return user?.role === "admin";
 return true;
}

const categories = [
  "Mobiles",
  "Fashion",
  "Home Essentials",
  "Sports & Fitness",
];

const platforms = [
  "Amazon",
  "Flipkart",
  "Myntra",
  "Alibaba",
  "Meesho",
  "Other",
];

export default function AdminAddCustomProduct({ user, onSaved = () => {} }) {
  const { toast } = useToast();

  // Form fields state
  const [form, setForm] = useState({
    title: "",
    description: "",
    image: "",
    price: "",
    sourcePrice: "",
    category: categories[0],
    platform: platforms[0],
    url: "",
    tags: "",
  });

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});

  // Validate form data
  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required.";
    if (!form.image.trim()) e.image = "Product image URL or upload is required.";
    if (
      !form.price.trim() ||
      isNaN(Number(form.price)) ||
      Number(form.price) <= 0
    )
      e.price = "Valid price is required.";
    if (!form.category) e.category = "Category is required.";
    if (!form.platform) e.platform = "Platform is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Update form state
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Handle image upload to Firebase Storage
  const handleImageUpload = (file) => {
    if (!file) return;
    setUploading(true);

    const storageRef = ref(storage, `custom-product-images/${Date.now()}-${file.name}`);

    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      () => {
        // Optional: Could implement progress indicator here
      },
      (error) => {
        toast({ title: "Upload failed", description: error.message, variant: "destructive" });
        setUploading(false);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setForm((prev) => ({ ...prev, image: downloadURL }));
          toast({ title: "Image uploaded successfully." });
          setUploading(false);
        });
      }
    );
  };

  // Submit new custom product to Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAdmin(user)) {
      toast({ title: "Unauthorized", description: "You do not have permission.", variant: "destructive" });
      return;
    }
    if (!validate()) return;

    setLoading(true);

    const tags = form.tags
      ? form.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    const productData = {
      title: form.title.trim(),
      description: form.description.trim(),
      image: form.image.trim(),
      price: Number(form.price),
      sourcePrice: form.sourcePrice.trim() ? Number(form.sourcePrice) : null,
      category: form.category,
      platform: form.platform,
      url: form.url.trim() || null,
      tags,
      type: "custom",
      isCustom: true,
      createdAt: serverTimestamp(),
    };

    // Clean up null fields
    Object.keys(productData).forEach((key) => {
      if (productData[key] === null) delete productData[key];
    });

    try {
      await addDoc(collection(db, "wishlist2cart_brands"), productData);
      toast({ title: "Custom product added successfully." });

      // Reset the form after successful submission
      setForm({
        title: "",
        description: "",
        image: "",
        price: "",
        sourcePrice: "",
        category: categories[0],
        platform: platforms[0],
        url: "",
        tags: "",
      });
      setErrors({});
      onSaved();  // Notify parent if any action needed on success
    } catch (error) {
      toast({ title: "Failed to add product", description: error.message || "Unknown error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // DON'T show unauthorized message here, instead prevent rendering from parent or router:
  if (!isAdmin(user)) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto p-6 bg-white rounded shadow space-y-6 dark:bg-gray-900" noValidate>
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Add New Custom Product</h2>

      <div>
        <Label htmlFor="title">Product Title *</Label>
        <Input
          id="title"
          value={form.title}
          onChange={(e) => handleChange("title", e.target.value)}
          disabled={loading || uploading}
          required
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? "title-error" : undefined}
        />
        {errors.title && <p id="title-error" className="text-red-500 text-sm mt-1">{errors.title}</p>}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          value={form.description}
          onChange={(e) => handleChange("description", e.target.value)}
          disabled={loading || uploading}
          className="w-full border rounded p-2 dark:bg-gray-800 dark:text-white"
          rows={4}
          placeholder="Optional"
        />
      </div>

      <div>
        <Label htmlFor="image">Product Image URL *</Label>
        <Input
          id="image"
          value={form.image}
          onChange={(e) => handleChange("image", e.target.value)}
          disabled={loading || uploading}
          placeholder="Paste image URL or upload below"
          required
          aria-invalid={!!errors.image}
          aria-describedby={errors.image ? "image-error" : undefined}
        />
        <div className="mt-2 flex items-center gap-4">
          <label
            htmlFor="image-upload"
            className={`cursor-pointer inline-flex items-center gap-2 rounded border border-gray-300 bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 ${
              uploading ? "opacity-60 cursor-wait" : ""
            }`}
          >
            Upload Image
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              disabled={loading || uploading}
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleImageUpload(e.target.files[0]);
                  e.target.value = null;
                }
              }}
            />
          </label>
          {uploading && <p className="text-sm text-gray-500 dark:text-gray-300">Uploading...</p>}
          {form.image && !uploading && (
            <img
              src={form.image}
              alt="Preview"
              className="h-12 w-12 rounded object-cover border"
            />
          )}
        </div>
        {errors.image && <p id="image-error" className="text-red-500 text-sm mt-1">{errors.image}</p>}
      </div>

      <div>
        <Label htmlFor="price">Your Price *</Label>
        <Input
          id="price"
          type="number"
          min="0"
          step="0.01"
          value={form.price}
          onChange={(e) => handleChange("price", e.target.value)}
          disabled={loading || uploading}
          required
          aria-invalid={!!errors.price}
          aria-describedby={errors.price ? "price-error" : undefined}
        />
        {errors.price && <p id="price-error" className="text-red-500 text-sm mt-1">{errors.price}</p>}
      </div>

      <div>
        <Label htmlFor="sourcePrice">Source Price (optional)</Label>
        <Input
          id="sourcePrice"
          type="number"
          min="0"
          step="0.01"
          value={form.sourcePrice}
          onChange={(e) => handleChange("sourcePrice", e.target.value)}
          disabled={loading || uploading}
          placeholder="Optional"
        />
      </div>

      <div>
        <Label htmlFor="category">Category *</Label>
        <select
          id="category"
          value={form.category}
          onChange={(e) => handleChange("category", e.target.value)}
          disabled={loading || uploading}
          required
          className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-white"
          aria-invalid={!!errors.category}
          aria-describedby={errors.category ? "category-error" : undefined}
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {errors.category && <p id="category-error" className="text-red-500 text-sm mt-1">{errors.category}</p>}
      </div>

      <div>
        <Label htmlFor="platform">Platform *</Label>
        <select
          id="platform"
          value={form.platform}
          onChange={(e) => handleChange("platform", e.target.value)}
          disabled={loading || uploading}
          required
          className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-white"
          aria-invalid={!!errors.platform}
          aria-describedby={errors.platform ? "platform-error" : undefined}
        >
          {platforms.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        {errors.platform && <p id="platform-error" className="text-red-500 text-sm mt-1">{errors.platform}</p>}
      </div>

      <div>
        <Label htmlFor="url">Product URL (optional)</Label>
        <Input
          id="url"
          value={form.url}
          onChange={(e) => handleChange("url", e.target.value)}
          disabled={loading || uploading}
          placeholder="Optional"
          type="url"
        />
      </div>

      <div>
        <Label htmlFor="tags">Tags (comma separated)</Label>
        <Input
          id="tags"
          value={form.tags}
          onChange={(e) => handleChange("tags", e.target.value)}
          disabled={loading || uploading}
          placeholder="e.g. electronics, mobile, 5G"
        />
      </div>

      <div className="flex justify-end space-x-4 pt-4">
        <Button
          type="submit"
          disabled={loading || uploading}
          size="lg"
          variant="default"
          aria-disabled={loading || uploading}
        >
          {loading ? "Saving..." : "Add Custom Product"}
        </Button>
      </div>
    </form>
  );
}
