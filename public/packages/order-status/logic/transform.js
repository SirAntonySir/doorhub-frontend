/**
 * Transform raw API response -> DTO conforming to schema/data.schema.json
 * @param {any} api
 * @returns {any} dto
 */
export function toDTO(api) {
  if (!api || typeof api !== "object")
    return {
      stateCode: "UNKNOWN",
      stateText: "Unbekannt",
      summaryDate: "",
      orderNo: "",
      status: "unknown",
      logo: "/packages/order-status/assets/Dm_Logo.svg",
    };

  const code = api.summaryStateCode || "UNKNOWN";

  // Map status codes to our internal status for styling
  const statusMap = {
    DELIVERED: "delivered",
    PROCESSING: "processing",
    IN_PROGRESS: "processing",
    CREATED: "processing",
    ERROR: "error",
    UNKNOWN: "unknown",
  };

  // Use i18n keys instead of hardcoded text
  const i18nKeyMap = {
    DELIVERED: "{i18n.status_delivered}",
    ERROR: "{i18n.status_error}",
    IN_PROGRESS: "{i18n.status_in_progress}",
    PROCESSING: "{i18n.status_processing}",
    CREATED: "{i18n.status_created}",
    UNKNOWN: "{i18n.status_unknown}",
  };

  return {
    stateCode: code,
    stateText:
      api.summaryStateText || i18nKeyMap[code] || "{i18n.status_unknown}",
    summaryDate: api.summaryDate || "",
    priceText: api.summaryPriceText || "",
    orderNo: String(api.orderNo || ""),
    orderDate: api.orderDate || "",
    deliveryText: api.deliveryText || "",
    status: statusMap[code] || "unknown",
    logo: "/packages/order-status/assets/Dm_Logo.svg",
  };
}
