import { Type } from "class-transformer";
import { ArrayNotEmpty, IsInt, IsString, Max, Min, ValidateNested } from "class-validator";

class SlotDto {
  @IsInt()
  @Min(0)
  @Max(6)
  day_of_week: number;

  @IsString()
  start_time: string; // "HH:mm"

  @IsString()
  end_time: string; // "HH:mm"
}

export class SetAvailabilityDto {
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SlotDto)
  slots: SlotDto[];
}
