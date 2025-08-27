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

  const map = {
    DELIVERED: "Dein Auftrag liegt zur Abholung bereit.",
    ERROR: "Auftragsnummer nicht gefunden.",
    IN_PROGRESS: "In Bearbeitung",
    PROCESSING: "Dein Auftrag wird gefertigt.",
    CREATED: "Erstellt",
    UNKNOWN: "Unbekannt",
  };

  return {
    stateCode: code,
    stateText: api.summaryStateText || map[code] || "Status",
    summaryDate: api.summaryDate || "",
    priceText: api.summaryPriceText || "",
    orderNo: String(api.orderNo || ""),
    orderDate: api.orderDate || "",
    deliveryText: api.deliveryText || "",
    status: statusMap[code] || "unknown",
    logo: "/packages/order-status/assets/Dm_Logo.svg",
  };
}
