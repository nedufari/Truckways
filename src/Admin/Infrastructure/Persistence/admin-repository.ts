import { Admin } from "src/Admin/Domain/admin";
import { PercentageConfig } from "src/Admin/Domain/percentage";
import { Customer } from "src/Customer/Domain/customer";
import { PercentageType } from "src/Enums/percentage.enum";
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


export abstract class PercentageConfigRepository{
    abstract create(percent:PercentageConfig):Promise<PercentageConfig>
    abstract findByID(id:number):Promise<PercentageConfig | null>
    abstract find(dto:PaginationDto):Promise<{data:PercentageConfig[], total:number}>
    abstract findByType(type:PercentageType):Promise<PercentageConfig | null>
    abstract update (id:number , admin:Partial<PercentageConfig>):Promise<PercentageConfig>
    abstract remove (id:string):Promise<void>
    abstract save (admin:PercentageConfig):Promise<PercentageConfig>
    
}