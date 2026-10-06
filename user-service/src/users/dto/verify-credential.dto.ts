import { IsIn } from "class-validator";

export class VerifyCredentialDto {
  @IsIn(["approved", "rejected"])
  status: "approved" | "rejected";
}
