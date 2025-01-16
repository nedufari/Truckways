import { Customer } from "src/Customer/Domain/customer";

export abstract class CustomerRepository{
    abstract create(customer:Customer):Promise<Customer>
    abstract findByID(id:number):Promise<Customer | null>
    abstract find():Promise<Customer[]>
    abstract findByEmail(email:string):Promise<Customer | null>
    abstract findbyPasswordResetToken (token:string):Promise <Customer|null>;
    abstract update (id:number , customer:Partial<Customer>):Promise<Customer>
    abstract remove (id:string):Promise<void>
    abstract profile (customer:Customer):Promise<Customer>
    abstract save (customer:Customer):Promise<Customer>
}