import { ApiProperty } from "@nestjs/swagger";
import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { RiderEntity } from "./rider.entity";

@Entity({name:'rider-bank'})
export class BankEntity{

    @ApiProperty({type:Number})
    @PrimaryGeneratedColumn()
    id:number

    @ApiProperty({type:String})
    @Column({nullable:true})
    bankID:string 

    @ApiProperty({type:String})
    @Column({nullable:true})
    bankName:string 

    @ApiProperty({type:String})
    @Column({nullable:true})
    accountNumber:string

    @ApiProperty({type:String})
    @Column({nullable:true})
    accountName:string


    @ApiProperty()
    @Column({type:'timestamp', nullable:true})
    createdAt:Date

    @ApiProperty()
    @Column({type:'timestamp', nullable:true})
    updatedAt:Date

    @ApiProperty({type:()=>RiderEntity})
    @OneToOne(()=>RiderEntity, (rider)=>rider.bank_details)
    @JoinColumn() 
    owner:RiderEntity

}