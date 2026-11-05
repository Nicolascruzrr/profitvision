/**
 * Profit Vision — configuración centralizada
 * Sustituye URLs cuando existan endpoints reales.
 */
window.PROFIT_VISION = {
  brand: "Profit Vision",
  userRegistrationUrl: "registro-usuario.html",
  mentorRegistrationUrl: "registro-mentor.html",
  /** Endpoint futuro. Vacío = modo demostración local (sin envío externo). */
  formEndpoint: "",
  restrictedCategoriesUnder18: ["trading", "criptoactivos"],
  investmentRelatedCategories: [
    "mercado-de-valores",
    "trading",
    "criptoactivos",
    "bienes-raices",
    "planificacion-para-el-retiro",
  ],
};
