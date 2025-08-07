import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { db, storage } from "../lib/firebase"; // Adjust path as needed
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";


function isAdmin(user) {
  // Replace with your actual admin check, example:
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
const productTypes = [
  { value: "affiliate", label: "Affiliate (Redirect)" },
  { value: "dropship", label: "Dropship (You fulfill)" },
];


// Mock function to simulate metadata fetch — replace with real API call
async function fetchProductMetadata(url) {
  await new Promise((resolve) => setTimeout(resolve, 1000)); // simulate delay
  // Mock metadata, replace with your backend call results
  return {
    title: "Auto-fetched Product Title",
    description: "Description fetched from product URL.",
    image: "https://via.placeholder.com/300x300?text=Product+Image",
    price: 1299.99,
    category: "Mobiles",
    platform: platforms.find((p) => url.toLowerCase().includes(p.toLowerCase())) || platforms[0],
  };
}


export default function AdminAddEditProduct({
  user,
  existingProduct = null,
  onSaved = () => {},
}) {
  const { toast } = useToast();


  const [form, setForm] = useState({
    title: "",
    description: "",
    image: "",
    price: "",
    sourcePrice: "",
    category: categories[0],
    platform: platforms[0],
    url: "",
    type: productTypes[0].value,
    tags: "",
  });


  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fetchingMeta, setFetchingMeta] = useState(false);
  const [errors, setErrors] = useState({});


  useEffect(() => {
    if (existingProduct) {
      setForm({
        title: existingProduct.title || "",
        description: existingProduct.description || "",
        image: existingProduct.image || "",
        price: existingProduct.price?.toString() || "",
        sourcePrice: existingProduct.sourcePrice?.toString() || "",
        category: existingProduct.category || categories[0],
        platform: existingProduct.platform || platforms[0],
        url: existingProduct.url || "",
        type: existingProduct.type || productTypes[0].value,
        tags: existingProduct.tags?.join(", ") || "",
      });
    }
  }, [existingProduct]);


  const validate = () => {
    const e = {};
    if (form.type === "dropship") {
      if (!form.title.trim()) e.title = "Title required.";
      if (
        !form.price.trim() ||
        isNaN(Number(form.price)) ||
        Number(form.price) <= 0
      )
        e.price = "Valid price required.";
      if (!form.category) e.category = "Category required.";
      if (!form.platform) e.platform = "Platform required.";
      if (!form.url.trim()) e.url = "Product URL required.";
    } else if (form.type === "affiliate") {
      if (!form.url.trim()) e.url = "Affiliate product URL required.";
    }
    if (!form.type) e.type = "Product type required.";


    setErrors(e);
    return Object.keys(e).length === 0;
  };


  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };


  const handleUrlBlur = async () => {
    const url = form.url.trim();
    if (!url) return; 
    setFetchingMeta(true);
    try {
      const meta = await fetchProductMetadata(url);
      setForm((prev) => ({
        ...prev,
        title: prev.title || meta.title || "",
        description: prev.description || meta.description || "",
        image: prev.image || meta.image || "",
        price: prev.price || (meta.price ? meta.price.toString() : ""),
        category: prev.category || meta.category || categories[0],
        platform: prev.platform || meta.platform || platforms[0],
      }));
      toast({ title: "Product info auto-filled from URL" });
    } catch (error) {
      toast({ title: "Failed to fetch product info from URL", variant: "destructive" });
    } finally {
      setFetchingMeta(false);
    }
  };


  const handleImageUpload = (file) => {
    if (!file) return;
    setUploading(true);
    const storageRef = ref(storage, `product-images/${Date.now()}-${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);


    uploadTask.on(
      "state_changed",
      null,
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


  const handleDelete = async () => {
    if (!existingProduct || !existingProduct.id) return;
    if (
      !window.confirm(
        "Are you sure you want to delete this product? This action cannot be undone."
      )
    )
      return;


    if (!isAdmin(user)) {
      toast({ title: "Unauthorized", description: "You do not have permission to delete products.", variant: "destructive" });
      return;
    }


    setLoading(true);
    try {
      const refDoc = doc(db, "products", existingProduct.id);
      await deleteDoc(refDoc);
      toast({ title: "Product deleted successfully." });
      onSaved();
    } catch (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();


    if (!isAdmin(user)) {
      toast({ title: "Unauthorized", description: "You don't have permission.", variant: "destructive" });
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
      price: form.price.trim() ? Number(form.price) : undefined,
      sourcePrice: form.sourcePrice.trim()
        ? Number(form.sourcePrice)
        : undefined,
      category: form.category,
      platform: form.platform,
      url: form.url.trim(),
      type: form.type,
      tags,
      isCustom: form.type === "dropship",
      createdAt: existingProduct?.createdAt || serverTimestamp(),
    };


    Object.keys(productData).forEach((key) => {
      if (productData[key] === undefined) delete productData[key];
    });


    try {
      if (existingProduct && existingProduct.id) {
        const refDoc = doc(db, "products", existingProduct.id);
        await updateDoc(refDoc, productData);
        toast({ title: "Product updated!" });
      } else {
        await addDoc(collection(db, "products"), {
          ...productData,
          createdAt: serverTimestamp(),
        });
        toast({ title: "Product added!" });
      }
      
      setForm({
        title: "",
        description: "",
        image: "",
        price: "",
        sourcePrice: "",
        category: categories[0],
        platform: platforms[0],
        url: "",
        type: productTypes[0].value,
        tags: "",
      });
      setErrors({});
      onSaved();
    } catch (error) {
      toast({ title: "Error", description: error.message || "Failed to save product", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };


  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-900 rounded-lg p-8 max-w-xl mx-auto shadow space-y-6"
    >
      <h2 className="text-2xl font-bold mb-4">
        {existingProduct ? "Edit Product" : "Add New Product"}
      </h2>


      <div>
        <Label>Product Type *</Label>
        <select
          disabled={loading || uploading || fetchingMeta}
          value={form.type}
          onChange={(e) => handleChange("type", e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"

        >
          {productTypes.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        {errors.type && (
          <span className="text-red-500 text-xs">{errors.type}</span>
        )}
      </div>


      <div>
        <Label>Product URL *</Label>
        <Input
          disabled={loading || uploading || fetchingMeta}
          value={form.url}
          onChange={(e) => handleChange("url", e.target.value)}
          onBlur={handleUrlBlur}
          placeholder="Paste full affiliate or dropship product URL"
          required
        />
        {errors.url && <span className="text-red-500 text-xs">{errors.url}</span>}
      </div>


      <div>
        <Label>
          Product Title {form.type === "dropship" ? "*" : "(optional)"}
        </Label>
        <Input
          disabled={loading || uploading || fetchingMeta}
          value={form.title}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder={
            form.type === "affiliate"
              ? "Optional - enter or auto-filled"
              : ""
          }
        />
        {errors.title && (
          <span className="text-red-500 text-xs">{errors.title}</span>
        )}
      </div>


      <div>
        <Label>Description</Label>
        <textarea
          disabled={loading || uploading || fetchingMeta}
          value={form.description}
          onChange={(e) => handleChange("description", e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"

          rows={3}
          placeholder="Enter product description (optional)"
        />
      </div>


      <div>
        <Label>
          Product Image URL {form.type === "dropship" ? "*" : "(optional)"}
        </Label>
        <Input
          disabled={loading || uploading || fetchingMeta}
          value={form.image}
          onChange={(e) => handleChange("image", e.target.value)}
          placeholder="Paste image URL or upload below"
        />
        <div className="mt-2 flex items-center gap-4">
          <label
            htmlFor="image-upload"
            className={`cursor-pointer inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 ${uploading ? "opacity-60 cursor-wait" : ""}`}

            
          >
            Upload Image
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              disabled={loading || uploading || fetchingMeta}
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleImageUpload(e.target.files[0]);
                  e.target.value = null;
                }
              }}
            />
          </label>
          {uploading && (
            <span className="text-sm text-gray-500">Uploading...</span>
          )}
          {form.image && !uploading && (
            <img
              src={form.image}
              alt="Preview"
              className="h-12 w-12 rounded object-cover border"
            />
          )}
        </div>
        {errors.image && (
          <span className="text-red-500 text-xs">{errors.image}</span>
        )}
      </div>


      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Your Price {form.type === "dropship" ? "*" : "(optional)"}</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            disabled={loading || uploading || fetchingMeta}
            value={form.price}
            onChange={(e) => handleChange("price", e.target.value)}
          />
          {errors.price && (
            <span className="text-red-500 text-xs">{errors.price}</span>
          )}
        </div>


        <div>
          <Label>Source Price (optional)</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            disabled={loading || uploading || fetchingMeta}
            value={form.sourcePrice}
            onChange={(e) => handleChange("sourcePrice", e.target.value)}
          />
        </div>
      </div>


      <div>
        <Label>Tags (comma separated)</Label>
        <Input
          disabled={loading || uploading || fetchingMeta}
          value={form.tags}
          onChange={(e) => handleChange("tags", e.target.value)}
        />
      </div>


      <div>
        <Label>Platform *</Label>
        <select
          disabled={loading || uploading || fetchingMeta}
          value={form.platform}
          onChange={(e) => handleChange("platform", e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"

          required
        >
          {platforms.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        {errors.platform && (
          <span className="text-red-500 text-xs">{errors.platform}</span>
        )}
      </div>


      <div>
        <Label>Category *</Label>
        <select
          disabled={loading || uploading || fetchingMeta}
          value={form.category}
          onChange={(e) => handleChange("category", e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"

          required
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {errors.category && (
          <span className="text-red-500 text-xs">{errors.category}</span>
        )}
      </div>


      <div className="flex space-x-4">
        <Button
          type="submit"
          size="lg"
          variant="default"
          disabled={loading || uploading || fetchingMeta || !isAdmin(user)}
          className="flex-1"
        >
          {existingProduct
            ? "Update Product"
            : fetchingMeta
            ? "Fetching data..."
            : "Add Product"}
        </Button>


        {existingProduct && (
          <Button
            type="button"
            size="lg"
            variant="destructive"
            disabled={loading || uploading || fetchingMeta || !isAdmin(user)}
            onClick={handleDelete}
            className="flex-1"
          >
            Delete Product
          </Button>
        )}
      </div>


      {!isAdmin(user) && (
        <div className="text-red-600 mt-4 font-medium">
          Restricted: Only admins can add, edit, or delete products.
        </div>
      )}
    </form>
  );
} 