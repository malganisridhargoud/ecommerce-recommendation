import { useState } from "react";
import toast from "react-hot-toast";
import { equipmentAPI } from "../../api/axiosConfig";

// ==========================================
// 1. CONSTANTS & HELPER COMPONENTS
// ==========================================

const CATEGORIES = [
  { value: "camera", label: "Camera" },
  { value: "construction", label: "Construction" },
  { value: "event", label: "Event" },
  { value: "industrial", label: "Industrial" },
  { value: "audio", label: "Audio" },
  { value: "vehicles", label: "Vehicles" },
  { value: "other", label: "Other" },
];

// A simple wrapper to make all our form labels look identical
function FieldLabel({ children }) {
  return (
    <label className="mb-1 d-block text-xs fw-semibold text-uppercase tracking-wider text-muted-custom">
      {children}
    </label>
  );
}

// A reusable input component with our dark mode styling applied
function DarkInput(props) {
  return (
    <input
      {...props}
      className="w-100 rounded-xl border px-3 py-2 text-sm text-white focus-outline-none focus-border-brand"
      style={{ backgroundColor: '#202024', borderColor: '#2d2d30' }}
    />
  );
}

// ==========================================
// 2. MAIN COMPONENT
// ==========================================

export default function VendorEquipmentForm({ equipment, onSaved, onCancel }) {
  // --- STATE SETUP ---

  // Keep track of whether we are currently waiting for the server
  const [saving, setSaving] = useState(false);

  // Set up blank default values for a new listing
  const initialValues = {
    name: "",
    description: "",
    category: "other",
    price_per_day: "",
    deposit_amount: "",
    quantity: 1,
    location: "",
    image_url: "",
    tags: "",
    is_active: true,
  };

  // If we passed in existing equipment (Edit Mode), overwrite the blank defaults
  if (equipment) {
    initialValues.name = equipment.name || "";
    initialValues.description = equipment.description || "";
    initialValues.category = equipment.category || "other";
    initialValues.price_per_day = equipment.price_per_day || "";
    initialValues.deposit_amount = equipment.deposit_amount || "";
    initialValues.quantity = equipment.quantity || 1;
    initialValues.location = equipment.location || "";
    initialValues.image_url = equipment.image_url || "";
    initialValues.tags = equipment.tags || "";

    // Only set to false if it explicitly equals false, otherwise keep it true
    if (equipment.is_active === false) {
      initialValues.is_active = false;
    }
  }

  // Store all our form data in one state object using the values we just prepared
  const [form, setForm] = useState(initialValues);

  // --- EVENT HANDLERS ---

  // Updates specific fields in our form state when a user types
  const handleChange = (field, value) => {
    setForm(function (previousState) {
      // Create a copy of the old state, but update the specific field that changed
      return {
        ...previousState,
        [field]: value,
      };
    });
  };

  // Handles the form submission when the user clicks save
  const handleSubmit = async (e) => {
    e.preventDefault(); // Stop the page from refreshing

    // 1. Basic Validation
    if (!form.name || !form.price_per_day) {
      toast.error("Name and price per day are required.");
      return; // Stop running the function here if validation fails
    }

    setSaving(true);

    try {
      // 2. Prepare the data: convert string inputs into actual Numbers for the database
      const payload = {
        ...form,
        price_per_day: Number(form.price_per_day),
        deposit_amount: Number(form.deposit_amount) || 0,
        quantity: Number(form.quantity) || 1,
      };

      let result;

      // 3. Check if we are updating an existing item or creating a new one
      const isUpdating = equipment && equipment.id;

      if (isUpdating) {
        result = await equipmentAPI.update(equipment.id, payload);
        toast.success("Equipment updated.");
      } else {
        result = await equipmentAPI.create(payload);
        toast.success("Equipment created.");
      }

      // 4. If the parent component gave us an 'onSaved' function, run it
      if (onSaved) {
        onSaved(result);
      }

    } catch (err) {
      // Show error message if something fails
      toast.error(err.message || "Failed to save equipment.");
    } finally {
      // Turn off the saving state regardless of whether it succeeded or failed
      setSaving(false);
    }
  };

  // --- UI LOGIC ---

  // Decide what text to show on the page based on whether we are editing or creating
  const formTitle = equipment ? "Edit Equipment" : "Create New Listing";

  // Decide what the submit button should say (Replacing a confusing nested ternary)
  let buttonText = "Create Equipment";
  if (saving) {
    buttonText = "Saving...";
  } else if (equipment) {
    buttonText = "Update Equipment";
  }

  // ==========================================
  // 3. COMPONENT RENDER
  // ==========================================

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border p-4 shadow-lg" style={{ backgroundColor: '#171719', borderColor: '#2d2d30', background: 'linear-gradient(180deg,#171719,#111113)' }}>

      {/* Header Section */}
      <div className="mb-4 d-flex align-items-center justify-content-between gap-3 border-bottom pb-3" style={{ borderColor: '#2d2d30' }}>
        <div>
          <div className="text-2xs fw-bold text-uppercase tracking-wider" style={{ color: '#7cc6ff' }}>Vendor Catalog</div>
          <h3 className="mt-2 text-2xl fw-semibold tracking-tight text-white">
            {formTitle}
          </h3>
        </div>
        <div className="rounded-xl border px-2 py-1 text-2xs fw-bold text-uppercase tracking-wider" style={{ backgroundColor: '#1d1d1f', borderColor: '#2d2d30', color: '#f2d27f' }}>
          Dark Mode
        </div>
      </div>

      <div className="mb-4 rounded-xl border px-3 py-2 text-sm text-white-50" style={{ backgroundColor: '#121214', borderColor: '#2d2d30' }}>
        Publish-ready listings use your active vendor workflow styling automatically.
      </div>

      {/* Form Fields Section */}
      <div className="row g-3">
        <div className="col-12">
          <FieldLabel>Name *</FieldLabel>
          <DarkInput type="text" value={form.name} onChange={(e) => handleChange("name", e.target.value)} required />
        </div>

        <div className="col-12">
          <FieldLabel>Description</FieldLabel>
          <textarea
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            rows={4}
            className="w-100 rounded-xl border px-3 py-2 text-sm text-white focus-outline-none focus-border-brand"
            style={{ backgroundColor: '#202024', borderColor: '#2d2d30' }}
          />
        </div>

        <div className="col-12 col-md-6">
          <FieldLabel>Category</FieldLabel>
          <select
            value={form.category}
            onChange={(e) => handleChange("category", e.target.value)}
            className="w-100 rounded-xl border px-3 py-2 text-sm text-white focus-outline-none focus-border-brand"
            style={{ backgroundColor: '#202024', borderColor: '#2d2d30' }}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div className="col-12 col-md-6">
          <FieldLabel>Location</FieldLabel>
          <DarkInput type="text" value={form.location} onChange={(e) => handleChange("location", e.target.value)} placeholder="e.g., Mumbai, Delhi" />
        </div>

        <div className="col-12 col-md-6">
          <FieldLabel>Price Per Day (Rs.) *</FieldLabel>
          <DarkInput type="number" value={form.price_per_day} onChange={(e) => handleChange("price_per_day", e.target.value)} required min="0" step="0.01" />
        </div>

        <div className="col-12 col-md-6">
          <FieldLabel>Deposit Amount (Rs.)</FieldLabel>
          <DarkInput type="number" value={form.deposit_amount} onChange={(e) => handleChange("deposit_amount", e.target.value)} min="0" step="0.01" />
        </div>

        <div className="col-12 col-md-6">
          <FieldLabel>Quantity</FieldLabel>
          <DarkInput type="number" value={form.quantity} onChange={(e) => handleChange("quantity", e.target.value)} min="1" />
        </div>

        <div className="col-12">
          <FieldLabel>Image URL</FieldLabel>
          <DarkInput type="url" value={form.image_url} onChange={(e) => handleChange("image_url", e.target.value)} placeholder="https://example.com/image.jpg" />
        </div>

        <div className="col-12">
          <FieldLabel>Tags (comma-separated)</FieldLabel>
          <DarkInput type="text" value={form.tags} onChange={(e) => handleChange("tags", e.target.value)} placeholder="camera, 4k, video" />
        </div>

        {/* Only show the 'Active' checkbox if we are editing existing equipment */}
        {equipment && (
          <div className="col-12">
            <div className="d-flex align-items-center gap-2 rounded-xl border px-3 py-2" style={{ backgroundColor: '#19191c', borderColor: '#2d2d30' }}>
              <input
                type="checkbox"
                id="is_active"
                checked={form.is_active}
                onChange={(e) => handleChange("is_active", e.target.checked)}
                className="form-check-input mt-0"
              />
              <label htmlFor="is_active" className="text-sm text-white-50 mb-0">
                Active (visible to buyers)
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Footer / Action Buttons */}
      <div className="mt-4 d-flex justify-content-end gap-2">
        {/* Only show cancel button if a cancel function was provided */}
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn rounded-xl border text-sm fw-medium text-white-50"
            style={{ borderColor: '#3a3a3f' }}
          >
            Cancel
          </button>
        )}

        <button
          type="submit"
          disabled={saving}
          className="btn rounded-xl text-sm fw-semibold text-white px-4 py-2"
          style={{ backgroundColor: '#0a84ff' }}
        >
          {buttonText}
        </button>
      </div>
    </form>
  );
}