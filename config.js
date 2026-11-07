/**
 * Profit Vision — configuración centralizada
 * Sustituye URLs cuando existan endpoints reales.
 */
window.PROFIT_VISION = {
  brand: "Profit Vision",
  userRegistrationUrl:
    "https://docs.google.com/forms/d/e/1FAIpQLSf2mDGD-x_x-rUlwFLxHR5821kTaFTbmP_8YhHlcYnOsv6cgA/viewform",
  mentorRegistrationUrl: "registro-mentor.html",
  /** Endpoint futuro. Vacío = se usa el Google Form de usuarios. */
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
