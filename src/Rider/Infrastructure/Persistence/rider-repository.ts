import { Customer } from "src/Customer/Domain/customer";
import { Bank } from "src/Rider/Domain/bank";
import { Rider } from "src/Rider/Domain/rider";
import { Vehicle } from "src/Rider/Domain/vehicle";
import { Wallet } from "src/Rider/Domain/wallet";
import { PaginationDto } from "src/utils/shared-dto/pagination.dto";

export abstract class RiderRepository{
    abstract create(rider:Rider):Promise<Rider>
    abstract findByID(id:number):Promise<Rider | null>
    abstract find(dto:PaginationDto):Promise<{data:Rider[], total:number}>
    abstract findByEmail(rider:string):Promise<Rider | null>
    abstract findbyPasswordResetToken (token:string):Promise <Rider|null>;
    abstract update (id:string , rider:Partial<Rider>):Promise<Rider>
    abstract remove (id:string):Promise<void>
    abstract profile (rider:Rider):Promise<Rider>
    abstract save (rider:Rider):Promise<Rider>
}

export abstract class VehicleRepository{
    abstract create(vehicle:Vehicle):Promise<Vehicle>
    abstract findByID(string:string):Promise<Vehicle | null>
    abstract find(dto:PaginationDto):Promise<{data:Vehicle[], total:number}>
    abstract update (id:string , vehicle:Partial<Vehicle>):Promise<Vehicle>
    abstract remove (id:string):Promise<void>
    abstract save (vehicle:Vehicle):Promise<Vehicle>
}

export abstract class BankRepository{
    abstract create(bank:Bank):Promise<Bank>
    abstract findByID(string:string):Promise<Bank | null>
    abstract find(dto:PaginationDto):Promise<{data:Bank[], total:number}>
    abstract update (id:string , bank:Partial<Bank>):Promise<Bank>
    abstract remove (id:string):Promise<void>
    abstract save (bank:Bank):Promise<Bank>
}

export abstract class WalletRepository{
    abstract create(wallet:Wallet):Promise<Wallet>
    abstract findByID(string:string):Promise<Wallet | null>
    abstract find(dto:PaginationDto):Promise<{data:Wallet[], total:number}>
    abstract update (id:string , wallet:Partial<Wallet>):Promise<Wallet>
    abstract remove (id:string):Promise<void>
    abstract save (wallet:Wallet):Promise<Wallet>
}