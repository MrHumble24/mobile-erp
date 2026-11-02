package uz.malika.erp.features.sales.data

import uz.malika.erp.core.runApi

/** List filters for the customer directory. */
data class CustomerFilters(
    val search: String? = null,
    val hasPurchases: Boolean? = null,
    val sort: String = "recent", // recent | name
) {
    fun toQuery(): Map<String, String> = buildMap {
        search?.takeIf { it.isNotBlank() }?.let { put("search", it) }
        hasPurchases?.let { put("hasPurchases", it.toString()) }
        put("sort", sort)
    }
}

/** The only HTTP door for the customers endpoints. Every read and write is online. */
class CustomersRepository(private val api: SalesApi) {

    suspend fun list(filters: CustomerFilters): List<CustomerListItem> = runApi {
        api.customers(filters.toQuery()).items.map { it.toDomain() }
    }

    suspend fun lookup(query: String?): List<Customer> = runApi {
        api.customerLookup(query?.takeIf { it.isNotBlank() }).map { it.toDomain() }
    }

    suspend fun sales(customerId: String): List<CustomerSale> = runApi {
        api.customerSales(customerId).map { it.toCustomerSale() }
    }

    suspend fun create(name: String, phone: String?, notes: String?): Customer = runApi {
        api.createCustomer(
            CreateCustomerBody(
                name = name.trim(),
                phone = phone?.takeIf { it.isNotBlank() }?.trim(),
                notes = notes?.takeIf { it.isNotBlank() }?.trim(),
            ),
        ).toDomain()
    }

    suspend fun update(id: String, name: String, phone: String?, notes: String?): Customer = runApi {
        api.updateCustomer(
            id,
            UpdateCustomerBody(
                name = name.trim(),
                phone = phone?.takeIf { it.isNotBlank() }?.trim(),
                notes = notes?.takeIf { it.isNotBlank() }?.trim(),
            ),
        ).toDomain()
    }
}
