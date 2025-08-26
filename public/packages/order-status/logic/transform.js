/**
 * Transform raw API response -> DTO conforming to schema/data.schema.json
 * @param {any} api
 * @returns {any} dto
 */
export function toDTO(api) {
  if (!api || typeof api !== 'object') return { stateCode: "UNKNOWN", stateText: "Unbekannt", summaryDate: "", orderNo: "" };
  const code = api.summaryStateCode || "UNKNOWN";
  const map = {
    DELIVERED: "Dein Auftrag liegt zur Abholung bereit.",
    ERROR: "Auftragsnummer nicht gefunden.",
    IN_PROGRESS: "In Bearbeitung",
    CREATED: "Erstellt",
    UNKNOWN: "Unbekannt"
  };
  return {
    stateCode: code,
    stateText: api.summaryStateText || map[code] || "Status",
    summaryDate: api.summaryDate || "",
    priceText: api.summaryPriceText || "",
    orderNo: String(api.orderNo || ""),
    orderDate: api.orderDate || "",
    deliveryText: api.deliveryText || ""
  };
}
