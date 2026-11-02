export type {
  CustomerView,
  CustomerListItem,
  CustomerPage,
  CustomerStats,
  CustomerListFilters,
  CustomerSaleView,
  CreateCustomerDto,
  UpdateCustomerDto,
} from "./model/customer.types"
export { customerRepository } from "./api/customer.repository"
export { customerKeys } from "./api/customer.keys"
export {
  useCustomers,
  useCustomerList,
  useCustomerStats,
  useCustomer,
  useCustomerSales,
  useCreateCustomer,
  useUpdateCustomer,
} from "./model/use-customers"
