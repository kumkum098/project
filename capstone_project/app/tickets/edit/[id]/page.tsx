"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/**
 * Edit Ticket Listing Page
 * Allows sellers to edit their existing ticket listings.
 * Pre-fills form with existing data and updates via API.
 */
export default function EditTicketPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;

  // Form state
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
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Validation errors
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
  }>({});

  // Fetch ticket data on page load
  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  // Fetch ticket from API
  const fetchTicket = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get user ID from localStorage
      const userId = localStorage.getItem("userId") || "demo-user-123";

      // Fetch ticket details
      const response = await fetch(`/api/tickets/my-listings?userId=${userId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch ticket");
      }

      const data = await response.json();

      if (data.success) {
        // Find the specific ticket
        const ticket = data.data.find((t: any) => (t._id || t.id) === ticketId);

        if (!ticket) {
          setError("Ticket not found");
          return;
        }

        // Pre-fill form with existing data
        setTitle(ticket.title);
        setEventName(ticket.eventName);
        setDescription(ticket.description);
        
        // Convert date to YYYY-MM-DD format for date input
        const eventDateObj = new Date(ticket.eventDate);
        const dateString = eventDateObj.toISOString().split('T')[0];
        setEventDate(dateString);
        
        // Extract time from date
        const timeString = eventDateObj.toTimeString().split(' ')[0].substring(0, 5);
        setEventTime(timeString);
        
        setEventVenue(ticket.eventVenue);
        setCity(ticket.city);
        setCategory(ticket.category);
        setOriginalPrice(ticket.originalPrice.toString());
        setSellingPrice(ticket.sellingPrice.toString());
        setNumberOfTickets("1"); // Default since not in response
        setSeatInformation("Not specified"); // Default since not in response
        setImagePreview(ticket.imageUrl);
        setTermsAccepted(true);
      } else {
        throw new Error(data.message || "Failed to load ticket");
      }

    } catch (err) {
      console.error("Error fetching ticket:", err);
      setError("Unable to load ticket details.");
    } finally {
      setIsLoading(false);
    }
  };

  // Validate individual field
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
    }
    return undefined;
  };

  // Validate all fields
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
      image: validateField("image", imagePreview),
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== undefined);
  };

  // Check if form is valid
  const isFormValid = (): boolean => {
    const hasErrors = Object.values(errors).some(error => error !== undefined);
    const allFieldsFilled = Boolean(
      title && eventName && description && eventDate && eventTime &&
      eventVenue && city && category && originalPrice && sellingPrice &&
      numberOfTickets && seatInformation && imagePreview
    );
    
    return !hasErrors && allFieldsFilled;
  };

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
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

    const fieldError = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: fieldError
    }));
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setImage(file);
        setErrors(prev => ({
          ...prev,
          image: undefined
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove image
  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
    setErrors(prev => ({
      ...prev,
      image: "Please upload a ticket image"
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setApiError(null);
    
    const isValid = validateAllFields();
    
    if (!isValid) {
      const firstError = Object.entries(errors).find(([_, error]) => error !== undefined);
      if (firstError) {
        const element = document.getElementById(firstError[0]);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const userId = localStorage.getItem("userId") || "demo-user-123";

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
        userId: userId,
      };

      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && response.status === 200) {
        alert("Ticket listing updated successfully!");
        
        // Redirect to my listings after 2 seconds
        setTimeout(() => {
          router.push("/dashboard/my-listings");
        }, 2000);
      } 
      else if (response.status === 400) {
        const errorMessage = data.errors 
          ? data.errors.join(", ") 
          : data.message || "Validation failed";
        setApiError(errorMessage);
      } 
      else if (response.status === 401) {
        setApiError("Unauthorized: You can only edit your own listings");
      }
      else if (response.status === 404) {
        setApiError("Ticket not found");
      }
      else {
        setApiError("Something went wrong. Please try again.");
      }

    } catch (error) {
      console.error("Error updating ticket:", error);
      setApiError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading ticket details...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
            <svg
              className="w-10 h-10 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            {error?.includes("not found") ? "Ticket Not Found" : "Error Loading Ticket"}
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push("/dashboard/my-listings")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            Back to My Listings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        {/* Page Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Edit Ticket Listing
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Update your ticket details below.
          </p>
        </div>

        {/* Form Container */}
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Ticket Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Ticket Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={title}
                    onChange={handleChange}
                    placeholder="e.g., VIP Package - Front Row"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                      errors.title ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {errors.title && (
                    <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                  )}
                </div>

                {/* Event Name */}
                <div>
                  <label htmlFor="eventName" className="block text-sm font-medium text-gray-700 mb-2">
                    Event Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="eventName"
                    name="eventName"
                    value={eventName}
                    onChange={handleChange}
                    placeholder="e.g., Taylor Swift - The Eras Tour"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                      errors.eventName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {errors.eventName && (
                    <p className="text-red-500 text-sm mt-1">{errors.eventName}</p>
                  )}
                </div>

                {/* Event Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Event Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={description}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Describe the event and ticket details..."
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none ${
                      errors.description ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {errors.description && (
                    <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                  )}
                </div>

                {/* Event Date and Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700 mb-2">
                      Event Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      id="eventDate"
                      name="eventDate"
                      value={eventDate}
                      onChange={handleChange}
                      min={new Date().toISOString().split('T')[0]}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                        errors.eventDate ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    />
                    {errors.eventDate && (
                      <p className="text-red-500 text-sm mt-1">{errors.eventDate}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="eventTime" className="block text-sm font-medium text-gray-700 mb-2">
                      Event Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      id="eventTime"
                      name="eventTime"
                      value={eventTime}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                        errors.eventTime ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    />
                    {errors.eventTime && (
                      <p className="text-red-500 text-sm mt-1">{errors.eventTime}</p>
                    )}
                  </div>
                </div>

                {/* Event Venue */}
                <div>
                  <label htmlFor="eventVenue" className="block text-sm font-medium text-gray-700 mb-2">
                    Event Venue <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="eventVenue"
                    name="eventVenue"
                    value={eventVenue}
                    onChange={handleChange}
                    placeholder="e.g., Madison Square Garden"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                      errors.eventVenue ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {errors.eventVenue && (
                    <p className="text-red-500 text-sm mt-1">{errors.eventVenue}</p>
                  )}
                </div>

                {/* City */}
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={city}
                    onChange={handleChange}
                    placeholder="e.g., New York"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                      errors.city ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {errors.city && (
                    <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={category}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white ${
                      errors.category ? 'border-red-500' : 'border-gray-300'
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
                    <p className="text-red-500 text-sm mt-1">{errors.category}</p>
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Original Price */}
                <div>
                  <label htmlFor="originalPrice" className="block text-sm font-medium text-gray-700 mb-2">
                    Original Ticket Price (₹) <span className="text-red-500">*</span>
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
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                      errors.originalPrice ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {errors.originalPrice && (
                    <p className="text-red-500 text-sm mt-1">{errors.originalPrice}</p>
                  )}
                </div>

                {/* Selling Price */}
                <div>
                  <label htmlFor="sellingPrice" className="block text-sm font-medium text-gray-700 mb-2">
                    Selling Price (₹) <span className="text-red-500">*</span>
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
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                      errors.sellingPrice ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {errors.sellingPrice && (
                    <p className="text-red-500 text-sm mt-1">{errors.sellingPrice}</p>
                  )}
                  {!errors.sellingPrice && originalPrice && sellingPrice && (
                    <p className="text-sm text-gray-600 mt-1">
                      {parseFloat(sellingPrice) > parseFloat(originalPrice) * 1.3
                        ? "⚠️ Selling price exceeds 30% of original price"
                        : `✓ Within 30% markup limit`}
                    </p>
                  )}
                </div>

                {/* Number of Tickets */}
                <div>
                  <label htmlFor="numberOfTickets" className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Tickets <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="numberOfTickets"
                    name="numberOfTickets"
                    value={numberOfTickets}
                    onChange={handleChange}
                    placeholder="e.g., 2"
                    min="1"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                      errors.numberOfTickets ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {errors.numberOfTickets && (
                    <p className="text-red-500 text-sm mt-1">{errors.numberOfTickets}</p>
                  )}
                </div>

                {/* Seat Information */}
                <div>
                  <label htmlFor="seatInfo" className="block text-sm font-medium text-gray-700 mb-2">
                    Seat Information <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="seatInfo"
                    name="seatInfo"
                    value={seatInformation}
                    onChange={handleChange}
                    placeholder="e.g., A12, VIP Row B, Block C Seat 18"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                      errors.seatInformation ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {errors.seatInformation && (
                    <p className="text-red-500 text-sm mt-1">{errors.seatInformation}</p>
                  )}
                </div>

                {/* Ticket Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ticket Image <span className="text-red-500">*</span>
                  </label>
                  
                  {!imagePreview ? (
                    <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 rounded-lg transition-colors ${
                      errors.image 
                        ? 'border-red-500 bg-red-50' 
                        : 'border-gray-300 border-dashed hover:border-blue-400'
                    }`}>
                      <div className="space-y-1 text-center">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
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
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="imageUpload"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
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
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1 relative">
                      <img
                        src={imagePreview}
                        alt="Ticket preview"
                        className="w-full h-48 object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors"
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
                    <p className="text-red-500 text-sm mt-1">{errors.image}</p>
                  )}
                </div>
              </div>
            </div>

            {/* API Error Message */}
            {apiError && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{apiError}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={!isFormValid() || isSubmitting}
                className={`w-full md:w-auto px-8 py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
                  isFormValid() && !isSubmitting
                    ? "bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                {isSubmitting ? "Updating Listing..." : "Update Listing"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}