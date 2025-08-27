/**
 * Transform raw DHL Shipment Tracking - Unified API response -> DTO conforming to schema/data.schema.json
 * Sources:
 * - DHL Shipment Tracking - Unified API response format
 * - Tracking states: pre-transit, transit, delivered, failure, unknown
 *
 * @param {any} api
 * @returns {any} dto
 */
export function toDTO(api) {
  const fallback = {
    primaryField: "-",
    secondaryField: "No data",
    status: "unknown",
    logo: "/packages/doorhub-dhl-tracking/assets/DHL_Logo.svg",
  };

  if (!api || typeof api !== "object") return fallback;

  try {
    // Handle API error responses
    if (api.errors && api.errors.length > 0) {
      return {
        primaryField: "Error",
        secondaryField: api.errors[0].detail || "API Error",
        status: "error",
        logo: "/packages/doorhub-dhl-tracking/assets/DHL_Logo.svg",
      };
    }

    // Handle successful response - Unified API format
    const shipment = api.shipments && api.shipments[0];
    if (!shipment) return fallback;

    const trackingNumber = shipment.id || shipment.trackingNumber || "-";
    const events = shipment.events || [];
    const currentStatus = shipment.status || "unknown";
    const estimatedDelivery = shipment.estimatedDelivery || null;

    // Get the latest event for status details
    const latestEvent = events.length > 0 ? events[0] : null;
    const eventDescription = latestEvent?.description || "No events available";
    const eventLocation = latestEvent?.location || null;

    // Map DHL Unified API status to widget status
    let status = "unknown";
    let secondary = "Unknown status";

    switch (currentStatus.toLowerCase()) {
      case "delivered":
        status = "delivered";
        secondary = "Delivered";
        break;
      case "in_transit":
      case "transit":
        status = "processing";
        secondary = eventLocation
          ? `In transit - ${eventLocation}`
          : "In transit";
        break;
      case "pre_transit":
      case "label_created":
        status = "processing";
        secondary = "Label created";
        break;
      case "failure":
      case "exception":
      case "returned":
        status = "error";
        secondary = "Delivery issue";
        break;
      case "pending":
        status = "processing";
        secondary = "Pending pickup";
        break;
      default:
        status = "processing";
        secondary = eventDescription || "Processing";
    }

    // Add estimated delivery date if available
    if (estimatedDelivery && status === "processing") {
      const deliveryDate = new Date(estimatedDelivery);
      const formattedDate = deliveryDate.toLocaleDateString();
      secondary = `${secondary} (ETA: ${formattedDate})`;
    }

    // Add progress percentage if available
    if (
      shipment.progress &&
      shipment.progress.current &&
      shipment.progress.total
    ) {
      const percentage = Math.round(
        (shipment.progress.current / shipment.progress.total) * 100
      );
      if (status === "processing" && percentage > 0) {
        secondary = `In transit (${percentage}%)`;
      }
    }

    return {
      primaryField: trackingNumber,
      secondaryField: secondary,
      status: status, // delivered | processing | error
      logo: "/packages/doorhub-dhl-tracking/assets/DHL_Logo.svg",
    };
  } catch (error) {
    console.error("DHL Unified API transform error:", error);
    return {
      primaryField: "Error",
      secondaryField: "Transform failed",
      status: "error",
      logo: "/packages/doorhub-dhl-tracking/assets/DHL_Logo.svg",
    };
  }
}
