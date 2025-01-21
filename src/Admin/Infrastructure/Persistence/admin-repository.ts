import { Admin } from "src/Admin/Domain/admin";
import { Customer } from "src/Customer/Domain/customer";
import { PaginationDto, SearchDto } from "src/utils/shared-dto/pagination.dto";

export abstract class AdminRepository{
    abstract create(admin:Admin):Promise<Admin>
    abstract findByID(id:number):Promise<Admin | null>
    abstract find(dto:PaginationDto):Promise<{data:Admin[], total:number}>
    abstract findByEmail(email:string):Promise<Admin | null>
    abstract findbyPasswordResetToken (token:string):Promise <Admin|null>;
    abstract update (id:number , admin:Partial<Admin>):Promise<Admin>
    abstract remove (id:string):Promise<void>
    abstract profile (admin:Admin):Promise<Admin>
    abstract save (admin:Admin):Promise<Admin>
    abstract searchAdmin (searchdto:SearchDto):Promise<{data:Admin[], total:number}>
}