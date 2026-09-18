// Điểm nhập tương thích cho giao diện hiện tại.
// Mỗi nhóm truy vấn nằm trong repository riêng để dễ mở rộng và kiểm thử.
export { getCategories } from "@/lib/repositories/categories";
export { getAdminProduct, getAdminProductDashboard, getAdminProductOrder, getAdminProductsPage, getProductBySlug, getProducts, getPublishedProductsPage } from "@/lib/repositories/products";
export type { AdminProductDashboard, AdminProductStatus, ProductPage } from "@/lib/repositories/products";
export { getSiteSettings } from "@/lib/repositories/settings";
export { getAuditLogs, getProductVersions } from "@/lib/repositories/admin-workflow";
