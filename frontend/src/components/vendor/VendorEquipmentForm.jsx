import { useState } from "react";
import toast from "react-hot-toast";
import { equipmentAPI } from "../../api/axiosConfig";

const CATEGORIES = [
  { value: "camera", label: "Camera" },
  { value: "construction", label: "Construction" },
  { value: "event", label: "Event" },
  { value: "industrial", label: "Industrial" },
  { value: "audio", label: "Audio" },
  { value: "vehicles", label: "Vehicles" },
  { value: "other", label: "Other" },
];

function FieldLabel({ children }) {
  return <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">{children}</label>;
}

function DarkInput(props) {
  return (
    <input
      {...props}
      className="w-full rounded-xl border border-[#2d2d30] bg-[#202024] px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-[#0a84ff] focus:outline-none focus:ring-2 focus:ring-[#0a84ff]/20"
    />
  );
}

export default function VendorEquipmentForm({ equipment, onSaved, onCancel }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: equipment?.name || "",
    description: equipment?.description || "",
    category: equipment?.category || "other",
    price_per_day: equipment?.price_per_day || "",
    deposit_amount: equipment?.deposit_amount || "",
    quantity: equipment?.quantity || 1,
    location: equipment?.location || "",
    image_url: equipment?.image_url || "",
    tags: equipment?.tags || "",
    is_active: equipment?.is_active ?? true,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price_per_day) {
      toast.error("Name and price per day are required.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        price_per_day: Number(form.price_per_day),
        deposit_amount: Number(form.deposit_amount) || 0,
        quantity: Number(form.quantity) || 1,
      };

      let result;
      if (equipment?.id) {
        result = await equipmentAPI.update(equipment.id, payload);
        toast.success("Equipment updated.");
      } else {
        result = await equipmentAPI.create(payload);
        toast.success("Equipment created.");
      }
      if (onSaved) onSaved(result);
    } catch (err) {
      toast.error(err.message || "Failed to save equipment.");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-[28px] border border-[#2d2d30] bg-[linear-gradient(180deg,#171719,#111113)] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.24)]">
      <div className="mb-6 flex items-center justify-between gap-4 border-b border-[#2d2d30] pb-5">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#7cc6ff]">Vendor Catalog</div>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            {equipment ? "Edit Equipment" : "Create New Listing"}
          </h3>
        </div>
        <div className="rounded-2xl border border-[#2d2d30] bg-[#1d1d1f] px-3 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#f2d27f]">
          Dark Mode
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-[#2d2d30] bg-[#121214] px-4 py-3 text-sm text-gray-300">
        Publish-ready listings use your active vendor workflow styling automatically.
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <FieldLabel>Name *</FieldLabel>
          <DarkInput type="text" value={form.name} onChange={(e) => handleChange("name", e.target.value)} required />
        </div>

        <div className="md:col-span-2">
          <FieldLabel>Description</FieldLabel>
          <textarea
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-[#2d2d30] bg-[#202024] px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-[#0a84ff] focus:outline-none focus:ring-2 focus:ring-[#0a84ff]/20"
          />
        </div>

        <div>
          <FieldLabel>Category</FieldLabel>
          <select
            value={form.category}
            onChange={(e) => handleChange("category", e.target.value)}
            className="w-full rounded-xl border border-[#2d2d30] bg-[#202024] px-4 py-3 text-sm text-white focus:border-[#0a84ff] focus:outline-none focus:ring-2 focus:ring-[#0a84ff]/20"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <FieldLabel>Location</FieldLabel>
          <DarkInput type="text" value={form.location} onChange={(e) => handleChange("location", e.target.value)} placeholder="e.g., Mumbai, Delhi" />
        </div>

        <div>
          <FieldLabel>Price Per Day (Rs.) *</FieldLabel>
          <DarkInput type="number" value={form.price_per_day} onChange={(e) => handleChange("price_per_day", e.target.value)} required min="0" step="0.01" />
        </div>

        <div>
          <FieldLabel>Deposit Amount (Rs.)</FieldLabel>
          <DarkInput type="number" value={form.deposit_amount} onChange={(e) => handleChange("deposit_amount", e.target.value)} min="0" step="0.01" />
        </div>

        <div>
          <FieldLabel>Quantity</FieldLabel>
          <DarkInput type="number" value={form.quantity} onChange={(e) => handleChange("quantity", e.target.value)} min="1" />
        </div>

        <div className="md:col-span-2">
          <FieldLabel>Image URL</FieldLabel>
          <DarkInput type="url" value={form.image_url} onChange={(e) => handleChange("image_url", e.target.value)} placeholder="https://example.com/image.jpg" />
        </div>

        <div className="md:col-span-2">
          <FieldLabel>Tags (comma-separated)</FieldLabel>
          <DarkInput type="text" value={form.tags} onChange={(e) => handleChange("tags", e.target.value)} placeholder="camera, 4k, video" />
        </div>

        {equipment && (
          <div className="md:col-span-2 flex items-center gap-3 rounded-xl border border-[#2d2d30] bg-[#19191c] px-4 py-3">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={(e) => handleChange("is_active", e.target.checked)}
              className="rounded border-[#4b4b52] bg-[#202024] text-[#0a84ff]"
            />
            <label htmlFor="is_active" className="text-sm text-gray-300">
              Active (visible to buyers)
            </label>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-[#3a3a3f] px-5 py-3 text-sm font-medium text-gray-300 hover:bg-[#202024]"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-[#0a84ff] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0071e3] disabled:opacity-50"
        >
          {saving ? "Saving..." : equipment ? "Update Equipment" : "Create Equipment"}
        </button>
      </div>
    </form>
  );
}
