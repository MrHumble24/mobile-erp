export type {
  CustomerView,
  CustomerSaleView,
  CreateCustomerDto,
  UpdateCustomerDto,
} from "./model/customer.types"
export { customerRepository } from "./api/customer.repository"
export { customerKeys } from "./api/customer.keys"
export {
  useCustomers,
  useCustomer,
  useCustomerSales,
  useCreateCustomer,
  useUpdateCustomer,
} from "./model/use-customers"
