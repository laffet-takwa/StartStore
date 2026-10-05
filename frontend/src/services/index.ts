/** Barrel for the service layer. Components import from `@/services`. */

export { ApiError, api } from './api'
export { authService } from './auth.service'
export { adminProductService, categoryService, productService } from './product.service'
export { cartService } from './cart.service'
export { wishlistService } from './wishlist.service'
export { adminOrderService, orderService } from './order.service'
export { adminDashboardService, adminUserService, userService } from './user.service'
export { addressService } from './address.service'
export { newsletterService } from './newsletter.service'
