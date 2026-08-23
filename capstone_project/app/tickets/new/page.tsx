"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Create Ticket Listing Page
 * Allows sellers to create a new ticket listing with all required details.
 * Includes comprehensive form validation and image upload preview.
 */
export default function CreateTicketPage() {
  // Individual state for each form field (controlled components)
  const [title, setTitle] = useState("");
  const [eventName, setEventName] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventVenue, setEventVenue] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [numberOfTickets, setNumberOfTickets] = useState("");
  const [seatInformation, setSeatInformation] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const router = useRouter();

  // Validation error messages for each field
  const [errors, setErrors] = useState<{
    title?: string;
    eventName?: string;
    description?: string;
    eventDate?: string;
    eventTime?: string;
    eventVenue?: string;
    city?: string;
    category?: string;
    originalPrice?: string;
    sellingPrice?: string;
    numberOfTickets?: string;
    seatInformation?: string;
    image?: string;
    termsAccepted?: string;
  }>({});

  // Validate individual fields and return error messages
  const validateField = (field: string, value: any): string | undefined => {
    switch (field) {
      case "title":
        if (!value || value.trim() === "") return "Ticket title is required";
        break;
      
      case "eventName":
        if (!value || value.trim() === "") return "Event name is required";
        break;
      
      case "description":
        if (!value || value.trim() === "") return "Event description is required";
        break;
      
      case "eventDate":
        if (!value) return "Event date is required";
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate < today) return "Event date cannot be in the past";
        break;
      
      case "eventTime":
        if (!value) return "Event time is required";
        break;
      
      case "eventVenue":
        if (!value || value.trim() === "") return "Event venue is required";
        break;
      
      case "city":
        if (!value || value.trim() === "") return "City is required";
        break;
      
      case "category":
        if (!value) return "Please select a category";
        break;
      
      case "originalPrice":
        if (!value || value === "") return "Original price is required";
        const origPrice = parseFloat(value);
        if (isNaN(origPrice) || origPrice <= 0) return "Original price must be greater than 0";
        break;
      
      case "sellingPrice":
        if (!value || value === "") return "Selling price is required";
        const sellPrice = parseFloat(value);
        if (isNaN(sellPrice) || sellPrice <= 0) return "Selling price must be greater than 0";
        if (originalPrice && sellPrice > parseFloat(originalPrice) * 1.3) {
          return "Selling price cannot exceed 130% of original price";
        }
        break;
      
      case "numberOfTickets":
        if (!value || value === "") return "Number of tickets is required";
        const numTickets = parseInt(value);
        if (isNaN(numTickets) || numTickets < 1) return "Must sell at least 1 ticket";
        break;
      
      case "seatInformation":
        if (!value || value.trim() === "") return "Seat information is required";
        break;
      
      case "image":
        if (!value) return "Please upload a ticket image";
        break;
      
      case "termsAccepted":
        if (!value) return "You must accept the terms and conditions";
        break;
    }
    
    return undefined;
  };

  // Validate all fields and update errors state
  const validateAllFields = (): boolean => {
    const newErrors = {
      title: validateField("title", title),
      eventName: validateField("eventName", eventName),
      description: validateField("description", description),
      eventDate: validateField("eventDate", eventDate),
      eventTime: validateField("eventTime", eventTime),
      eventVenue: validateField("eventVenue", eventVenue),
      city: validateField("city", city),
      category: validateField("category", category),
      originalPrice: validateField("originalPrice", originalPrice),
      sellingPrice: validateField("sellingPrice", sellingPrice),
      numberOfTickets: validateField("numberOfTickets", numberOfTickets),
      seatInformation: validateField("seatInformation", seatInformation),
      image: validateField("image", image),
      termsAccepted: validateField("termsAccepted", termsAccepted),
    };

    setErrors(newErrors);

    // Check if any errors exist
    return !Object.values(newErrors).some(error => error !== undefined);
  };

  // Check if form is valid (all fields filled and no errors)
  const isFormValid = (): boolean => {
    const hasErrors = Object.values(errors).some(error => error !== undefined);
    const allFieldsFilled = 
      title && eventName && description && eventDate && eventTime &&
      eventVenue && city && category && originalPrice && sellingPrice &&
      numberOfTickets && seatInformation && image && termsAccepted;
    
    return !hasErrors && allFieldsFilled;
  };

  // Handle input changes with validation
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    // Update the corresponding state
    switch (name) {
      case "title": setTitle(value); break;
      case "eventName": setEventName(value); break;
      case "description": setDescription(value); break;
      case "eventDate": setEventDate(value); break;
      case "eventTime": setEventTime(value); break;
      case "eventVenue": setEventVenue(value); break;
      case "city": setCity(value); break;
      case "category": setCategory(value); break;
      case "originalPrice": setOriginalPrice(value); break;
      case "sellingPrice": setSellingPrice(value); break;
      case "numberOfTickets": setNumberOfTickets(value); break;
      case "seatInfo": setSeatInformation(value); break;
    }

    // Validate the field and update errors
    const fieldError = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: fieldError
    }));
  };

  // Handle image upload (simulated - no backend)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create a preview URL (in a real app, this would upload to a server)
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setImage(file);
        
        // Clear any image error
        setErrors(prev => ({
          ...prev,
          image: undefined
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove uploaded image
  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
    
    // Set image error
    setErrors(prev => ({
      ...prev,
      image: "Please upload a ticket image"
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear any previous API errors
    setApiError(null);
    
    // Validate all fields before submission
    const isValid = validateAllFields();
    
    if (!isValid) {
      // Scroll to first error
      const firstError = Object.entries(errors).find(([_, error]) => error !== undefined);
      if (firstError) {
        const element = document.getElementById(firstError[0]);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Start API submission
    setIsSubmitting(true);

    try {
      // Prepare form data for API
      const formData = {
        title: title.trim(),
        eventName: eventName.trim(),
        description: description.trim(),
        eventDate: eventDate,
        eventTime: eventTime,
        eventVenue: eventVenue.trim(),
        city: city.trim(),
        category: category,
        originalPrice: parseFloat(originalPrice),
        sellingPrice: parseFloat(sellingPrice),
        numberOfTickets: parseInt(numberOfTickets),
        seatInformation: seatInformation.trim(),
        imageUrl: imagePreview,
      };

      // Send POST request to API
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      // Parse response
      const data = await response.json();

      // Handle success response (201)
      if (response.ok && response.status === 201) {
        // Show success message
        alert("Ticket listing created successfully!");
        
        // Reset form
        resetForm();
        
        // Wait 2 seconds before redirect
        setTimeout(() => {
          // Redirect to my listings page
          router.push("/dashboard/my-listings");
        }, 2000);
      } 
      // Handle validation errors (400)
      else if (response.status === 400) {
        // Display API validation errors
        const errorMessage = data.errors 
          ? data.errors.join(", ") 
          : data.message || "Validation failed";
        setApiError(errorMessage);
      } 
      // Handle server errors (500)
      else {
        setApiError("Something went wrong. Please try again.");
      }

    } catch (error) {
      // Handle network or unexpected errors
      console.error("Error submitting form:", error);
      setApiError("Something went wrong. Please try again.");
    } finally {
      // Stop loading state
      setIsSubmitting(false);
    }
  };

  // Reset form to initial state
  const resetForm = () => {
    setTitle("");
    setEventName("");
    setDescription("");
    setEventDate("");
    setEventTime("");
    setEventVenue("");
    setCity("");
    setCategory("");
    setOriginalPrice("");
    setSellingPrice("");
    setNumberOfTickets("");
    setSeatInformation("");
    setImage(null);
    setImagePreview(null);
    setTermsAccepted(false);
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-canvas">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        {/* Page Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-ink mb-4">
            Create Ticket Listing
          </h1>
          <p className="text-lg text-ink-muted max-w-2xl mx-auto">
            Fill in the details below to list your ticket.
          </p>
        </div>

        {/* Form Container */}
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="bg-surface-1 rounded-xl border border-hairline p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Ticket Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-ink mb-2">
                    Ticket Title <span className="text-semantic-error">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={title}
                    onChange={handleChange}
                    placeholder="e.g., VIP Package - Front Row"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all bg-surface-2 text-ink placeholder:text-ink-tertiary ${
                      errors.title ? 'border-semantic-error' : 'border-hairline'
                    }`}
                    required
                  />
                  {errors.title && (
                    <p className="text-semantic-error text-sm mt-1">{errors.title}</p>
                  )}
                </div>

                {/* Event Name */}
                <div>
                  <label htmlFor="eventName" className="block text-sm font-medium text-ink mb-2">
                    Event Name <span className="text-semantic-error">*</span>
                  </label>
                  <input
                    type="text"
                    id="eventName"
                    name="eventName"
                    value={eventName}
                    onChange={handleChange}
                    placeholder="e.g., Taylor Swift - The Eras Tour"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all bg-surface-2 text-ink placeholder:text-ink-tertiary ${
                      errors.eventName ? 'border-semantic-error' : 'border-hairline'
                    }`}
                    required
                  />
                  {errors.eventName && (
                    <p className="text-semantic-error text-sm mt-1">{errors.eventName}</p>
                  )}
                </div>

                {/* Event Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-ink mb-2">
                    Event Description <span className="text-semantic-error">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={description}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Describe the event and ticket details..."
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none bg-surface-2 text-ink placeholder:text-ink-tertiary ${
                      errors.description ? 'border-semantic-error' : 'border-hairline'
                    }`}
                    required
                  />
                  {errors.description && (
                    <p className="text-semantic-error text-sm mt-1">{errors.description}</p>
                  )}
                </div>

                {/* Event Date and Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="eventDate" className="block text-sm font-medium text-ink mb-2">
                      Event Date <span className="text-semantic-error">*</span>
                    </label>
                    <input
                      type="date"
                      id="eventDate"
                      name="eventDate"
                      value={eventDate}
                      onChange={handleChange}
                      min={new Date().toISOString().split('T')[0]}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all bg-surface-2 text-ink ${
                        errors.eventDate ? 'border-semantic-error' : 'border-hairline'
                      }`}
                      required
                    />
                    {errors.eventDate && (
                      <p className="text-semantic-error text-sm mt-1">{errors.eventDate}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="eventTime" className="block text-sm font-medium text-ink mb-2">
                      Event Time <span className="text-semantic-error">*</span>
                    </label>
                    <input
                      type="time"
                      id="eventTime"
                      name="eventTime"
                      value={eventTime}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all bg-surface-2 text-ink ${
                        errors.eventTime ? 'border-semantic-error' : 'border-hairline'
                      }`}
                      required
                    />
                    {errors.eventTime && (
                      <p className="text-semantic-error text-sm mt-1">{errors.eventTime}</p>
                    )}
                  </div>
                </div>

                {/* Event Venue */}
                <div>
                  <label htmlFor="eventVenue" className="block text-sm font-medium text-ink mb-2">
                    Event Venue <span className="text-semantic-error">*</span>
                  </label>
                  <input
                    type="text"
                    id="eventVenue"
                    name="eventVenue"
                    value={eventVenue}
                    onChange={handleChange}
                    placeholder="e.g., Madison Square Garden"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all bg-surface-2 text-ink placeholder:text-ink-tertiary ${
                      errors.eventVenue ? 'border-semantic-error' : 'border-hairline'
                    }`}
                    required
                  />
                  {errors.eventVenue && (
                    <p className="text-semantic-error text-sm mt-1">{errors.eventVenue}</p>
                  )}
                </div>

                {/* City */}
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-ink mb-2">
                    City <span className="text-semantic-error">*</span>
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={city}
                    onChange={handleChange}
                    placeholder="e.g., New York"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all bg-surface-2 text-ink placeholder:text-ink-tertiary ${
                      errors.city ? 'border-semantic-error' : 'border-hairline'
                    }`}
                    required
                  />
                  {errors.city && (
                    <p className="text-semantic-error text-sm mt-1">{errors.city}</p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-ink mb-2">
                    Category <span className="text-semantic-error">*</span>
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={category}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all bg-surface-2 text-ink ${
                      errors.category ? 'border-semantic-error' : 'border-hairline'
                    }`}
                    required
                  >
                    <option value="">Select a category</option>
                    <option value="MUSIC">Music</option>
                    <option value="SPORTS">Sports</option>
                    <option value="THEATRE">Theatre</option>
                    <option value="COMEDY">Comedy</option>
                    <option value="OTHER">Other</option>
                  </select>
                  {errors.category && (
                    <p className="text-semantic-error text-sm mt-1">{errors.category}</p>
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Original Price */}
                <div>
                  <label htmlFor="originalPrice" className="block text-sm font-medium text-ink mb-2">
                    Original Ticket Price (₹) <span className="text-semantic-error">*</span>
                  </label>
                  <input
                    type="number"
                    id="originalPrice"
                    name="originalPrice"
                    value={originalPrice}
                    onChange={handleChange}
                    placeholder="e.g., 6000"
                    min="0"
                    step="0.01"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all bg-surface-2 text-ink placeholder:text-ink-tertiary ${
                      errors.originalPrice ? 'border-semantic-error' : 'border-hairline'
                    }`}
                    required
                  />
                  {errors.originalPrice && (
                    <p className="text-semantic-error text-sm mt-1">{errors.originalPrice}</p>
                  )}
                </div>

                {/* Selling Price */}
                <div>
                  <label htmlFor="sellingPrice" className="block text-sm font-medium text-ink mb-2">
                    Selling Price (₹) <span className="text-semantic-error">*</span>
                  </label>
                  <input
                    type="number"
                    id="sellingPrice"
                    name="sellingPrice"
                    value={sellingPrice}
                    onChange={handleChange}
                    placeholder="e.g., 4500"
                    min="0"
                    step="0.01"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all bg-surface-2 text-ink placeholder:text-ink-tertiary ${
                      errors.sellingPrice ? 'border-semantic-error' : 'border-hairline'
                    }`}
                    required
                  />
                  {errors.sellingPrice && (
                    <p className="text-semantic-error text-sm mt-1">{errors.sellingPrice}</p>
                  )}
                  {!errors.sellingPrice && originalPrice && sellingPrice && (
                    <p className="text-sm text-ink-muted mt-1">
                      {parseFloat(sellingPrice) > parseFloat(originalPrice) * 1.3
                        ? "⚠️ Selling price exceeds 30% of original price"
                        : `✓ Within 30% markup limit`}
                    </p>
                  )}
                </div>

                {/* Number of Tickets */}
                <div>
                  <label htmlFor="numberOfTickets" className="block text-sm font-medium text-ink mb-2">
                    Number of Tickets <span className="text-semantic-error">*</span>
                  </label>
                  <input
                    type="number"
                    id="numberOfTickets"
                    name="numberOfTickets"
                    value={numberOfTickets}
                    onChange={handleChange}
                    placeholder="e.g., 2"
                    min="1"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all bg-surface-2 text-ink placeholder:text-ink-tertiary ${
                      errors.numberOfTickets ? 'border-semantic-error' : 'border-hairline'
                    }`}
                    required
                  />
                  {errors.numberOfTickets && (
                    <p className="text-semantic-error text-sm mt-1">{errors.numberOfTickets}</p>
                  )}
                </div>

                {/* Seat Information */}
                <div>
                  <label htmlFor="seatInfo" className="block text-sm font-medium text-ink mb-2">
                    Seat Information <span className="text-semantic-error">*</span>
                  </label>
                  <input
                    type="text"
                    id="seatInfo"
                    name="seatInfo"
                    value={seatInformation}
                    onChange={handleChange}
                    placeholder="e.g., A12, VIP Row B, Block C Seat 18"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all bg-surface-2 text-ink placeholder:text-ink-tertiary ${
                      errors.seatInformation ? 'border-semantic-error' : 'border-hairline'
                    }`}
                    required
                  />
                  {errors.seatInformation && (
                    <p className="text-semantic-error text-sm mt-1">{errors.seatInformation}</p>
                  )}
                </div>

                {/* Ticket Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-ink mb-2">
                    Ticket Image <span className="text-semantic-error">*</span>
                  </label>
                  
                  {!imagePreview ? (
                    <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 rounded-lg transition-colors ${
                      errors.image 
                        ? 'border-semantic-error bg-semantic-error/10' 
                        : 'border-hairline border-dashed hover:border-hairline-strong'
                    }`}>
                      <div className="space-y-1 text-center">
                        <svg
                          className="mx-auto h-12 w-12 text-ink-muted"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div className="flex text-sm text-ink-muted">
                          <label
                            htmlFor="imageUpload"
                            className="relative cursor-pointer bg-surface-2 rounded-md font-medium text-primary hover:text-primary-hover focus-within:outline-none"
                          >
                            <span>Upload a file</span>
                            <input
                              id="imageUpload"
                              name="imageUpload"
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="sr-only"
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-ink-tertiary">PNG, JPG, GIF up to 10MB</p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1 relative">
                      <img
                        src={imagePreview}
                        alt="Ticket preview"
                        className="w-full h-48 object-cover rounded-lg border border-hairline"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 bg-semantic-error hover:bg-semantic-error/80 text-white rounded-full p-2 transition-colors"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                  {errors.image && (
                    <p className="text-semantic-error text-sm mt-1">{errors.image}</p>
                  )}
                </div>

                {/* Terms and Conditions */}
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={termsAccepted}
                    onChange={(e) => {
                      setTermsAccepted(e.target.checked);
                      // Validate terms when changed
                      const error = validateField("termsAccepted", e.target.checked);
                      setErrors(prev => ({
                        ...prev,
                        termsAccepted: error
                      }));
                    }}
                    className="mt-1 h-4 w-4 text-primary focus:ring-primary border-hairline rounded bg-surface-2"
                    required
                  />
                  <label htmlFor="terms" className="ml-2 text-sm text-ink">
                    I confirm that this ticket is genuine and I agree to the marketplace policies.{" "}
                    <span className="text-semantic-error">*</span>
                  </label>
                </div>
                {errors.termsAccepted && (
                  <p className="text-semantic-error text-sm mt-1">{errors.termsAccepted}</p>
                )}
              </div>
            </div>

            {/* API Error Message */}
            {apiError && (
              <div className="mb-4 p-4 bg-semantic-error/10 border border-semantic-error/20 rounded-lg">
                <p className="text-semantic-error text-sm">{apiError}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={!isFormValid() || isSubmitting}
                className={`w-full md:w-auto px-8 py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
                  isFormValid() && !isSubmitting
                    ? "bg-primary hover:bg-primary-hover shadow-md hover:shadow-lg"
                    : "bg-surface-3 cursor-not-allowed opacity-50"
                }`}
              >
                {isSubmitting ? "Creating Listing..." : "Create Listing"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}