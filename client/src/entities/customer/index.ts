export type {
  CustomerView,
  CreateCustomerDto,
  UpdateCustomerDto,
} from "./model/customer.types"
export { customerRepository } from "./api/customer.repository"
export { customerKeys } from "./api/customer.keys"
export {
  useCustomers,
  useCustomer,
  useCreateCustomer,
  useUpdateCustomer,
} from "./model/use-customers"
