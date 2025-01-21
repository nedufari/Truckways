import { ApiProperty } from "@nestjs/swagger";
import { IsNumber } from "class-validator";

export class CashoutDto {
    @ApiProperty({type:Number, example:3000})
    @IsNumber()
    amount : number

    @ApiProperty({type:String, example:'access bank'})
    @IsNumber()
    accountName:string


    @ApiProperty({type:String, example:'12345'})
    @IsNumber()
    bankCode:string


    @ApiProperty({type:String, example:'234567123'})
    @IsNumber()
    accountNumber:string
}