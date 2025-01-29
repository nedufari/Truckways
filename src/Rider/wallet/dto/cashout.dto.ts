import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";

export class CashoutDto {
    @ApiProperty({type:Number, example:3000})
    @IsNumber()
    amount : number

    @ApiProperty({type:String, example:'access bank'})
    @IsString()
    accountName:string


    @ApiProperty({type:String, example:'12345'})
    @IsString()
    bankCode:string


    @ApiProperty({type:String, example:'234567123'})
    @IsString()
    accountNumber:string
}