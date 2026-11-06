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
export { CustomerPicker, type CustomerSelection } from "./ui/CustomerPicker"
export { CustomerPoints } from "./ui/CustomerPoints"
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
