import { ApiProperty } from "@nestjs/swagger";
import { IsArray,  IsNotEmpty, IsString, Min } from "class-validator";

export class DropOffCodeDto {
    @ApiProperty({type:String, example:'234789'})
    @IsString()
    @IsNotEmpty()
    dropOff_code: string;
  
    @ApiProperty({type:Array, example:['TrkRdnFjv3o']})
    @IsArray()  
    itemsDroppedOff: string[];
  }