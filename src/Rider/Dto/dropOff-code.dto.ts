import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsInt, IsNotEmpty, IsString, Min } from "class-validator";

export class DropOffCodeDto {
    @ApiProperty({type:String, example:'234789'})
    @IsString()
    @IsNotEmpty()
    dropOff_code: string;
  
    @ApiProperty({type:Array, example:[1,2]})
    @IsArray() // Validate as an array
    @IsInt({ each: true }) // Ensure each item in the array is an integer
    @Min(1, { each: true }) // Each integer must be greater than or equal to 1
    itemsDroppedOff: string[];
  }